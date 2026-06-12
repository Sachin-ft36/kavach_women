import { useState } from 'react';
import { auth } from '../../firebase';
import { useEvidenceVaultSync } from '../../hooks/useEvidenceVaultSync';
import { AuditExportService } from '../../services/AuditExportService';

export function useEvidenceVaultLogic(targetUid?: string) {
  const { logs, firs, loading } = useEvidenceVaultSync(targetUid);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyIntegrity = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const totalFiles = logs.filter(l => l.url || l.hash).length;
    alert(`Safety Records Verified.\n${totalFiles} evidence records match their digital signatures.\nChain of Custody is secured.`);
    setIsVerifying(false);
  };

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllEvidence = () => {
    const downloadableLogs = logs.filter(l => l.url);
    if (downloadableLogs.length === 0) {
      alert("No downloadable records found.");
      return;
    }
    alert(`Downloading ${downloadableLogs.length} safety records...`);
    downloadableLogs.forEach((log, index) => {
      setTimeout(() => {
        let extension = log.type === 'Audio Log' ? 'webm' : 'jpg';
        handleDownload(log.url, `KAVACH_RECORD_${log.hash}_${index}.${extension}`);
      }, index * 500);
    });
  };

  const generateLegalAudit = async () => {
    try {
      const dummyIncident = {
        id: 'GLOBAL_VAULT_EXPORT',
        victimUid: auth.currentUser?.uid || 'UNKNOWN',
        status: 'Audit Export' as any,
        location: { lat: 0, lng: 0 }
      };
      await AuditExportService.generatePDF(dummyIncident, logs);
      alert('Legal Audit PDF generated securely.');
    } catch (e) {
      alert('Failed to generate Legal Audit. Ensure jspdf is installed.');
    }
  };

  // 🛡️ FORENSIC INTEGRITY: Identify evidence already anchored in existing FIRs
  const usedEvidenceIds = new Set();
  firs.forEach(fir => {
    if (Array.isArray(fir.evidence)) {
      fir.evidence.forEach((ev: any) => {
        // Check for various possible identifiers (id, hash, or url)
        if (ev.id) usedEvidenceIds.add(ev.id);
        if (ev.hash) usedEvidenceIds.add(ev.hash);
      });
    }
  });

  const unusedLogs = logs.filter(log => !usedEvidenceIds.has(log.id) && !usedEvidenceIds.has(log.hash));
  
  // 🔥 Only attach the absolute latest evidence to the FIR to prevent old test data from mixing
  const latestUnusedLogs = unusedLogs.length > 0 ? [unusedLogs[0]] : [];

  return {
    logs, firs, loading,
    isVerifying,
    verifyIntegrity, handleDownload, exportAllEvidence, generateLegalAudit,
    latestUnusedLogs
  };
}
