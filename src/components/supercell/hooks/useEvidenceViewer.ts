import { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';

export function useEvidenceViewer(alertId: string, isOpen: boolean) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !alertId) return;
    const q = query(collection(db, 'alerts', alertId, 'evidence'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEvidence(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [alertId, isOpen]);

  // Load blobs from IndexedDB for video/audio
  useEffect(() => {
    if (evidence.length === 0) return;
    const loadBlobs = async () => {
      const { getVaultEntry } = await import('../../../lib/forensicVault');
      const newUrls: Record<string, string> = {};
      for (const item of evidence) {
        if (!item.vaultId) continue;
        try {
          const entry = await getVaultEntry(item.vaultId);
          if (entry) newUrls[item.vaultId] = URL.createObjectURL(entry.blob);
        } catch (e) { /* vault entry may not exist */ }
      }
      setBlobUrls(prev => {
        Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
        return newUrls;
      });
    };
    loadBlobs();
    return () => setBlobUrls(prev => {
      Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
      return {};
    });
  }, [evidence]);

  const handleReview = async (item: any) => {
    if (item.status === 'Reviewed') return;
    if (!window.confirm("CRITICAL: This will permanently delete the evidence file from the cloud to save space. The log will remain. Proceed?")) return;
    try {
      if (item.url && item.fileName) {
         const fileRef = ref(storage, `kavach_evidence/${alertId}/${item.fileName}`);
         await deleteObject(fileRef).catch(() => {});
      }
      await updateDoc(doc(db, 'alerts', alertId, 'evidence', item.id), {
        status: 'Reviewed',
        url: '',
        'metadata.reviewedBy': 'Command Center',
        'metadata.reviewedAt': serverTimestamp()
      });
      toast.success("Evidence Reviewed", { description: "Cloud storage cleared." });
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDownload = (item: any) => {
    const src = blobUrls[item.vaultId] || item.url;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = item.fileName || `kavach_evidence_${item.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const snapshots = evidence.filter(e => e.type === 'Snapshot' || e.type === 'CCTV_FEED');
  const audioLogs = evidence.filter(e => e.type === 'Audio Log');

  return {
    evidence,
    loading,
    blobUrls,
    snapshots,
    audioLogs,
    handleReview,
    handleDownload
  };
}
