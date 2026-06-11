import { jsPDF } from 'jspdf';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export class AuditExportService {
  /**
   * Generates a signed PDF Official Audit Report for a specific incident.
   */
  static async generateAuditPDF(incidentId: string): Promise<boolean> {
    try {
      console.log(`📜 [AUDIT] Generating Official Report for ${incidentId}...`);
      
      // 1. Fetch from Hot Data or Cold Archive
      let alertSnap = await getDoc(doc(db, 'alerts', incidentId));
      if (!alertSnap.exists()) {
        alertSnap = await getDoc(doc(db, 'incident_archive', incidentId));
      }

      if (!alertSnap.exists()) {
        throw new Error(`Incident ${incidentId} not found in any ledger.`);
      }

      const incident = alertSnap.data();

      // 2. Initialize jsPDF
      const docPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // --- DOCUMENT HEADER ---
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(22);
      docPdf.setTextColor(200, 50, 50);
      docPdf.text('KAVACH TACTICAL COMMAND', 105, 20, { align: 'center' });
      
      docPdf.setFontSize(14);
      docPdf.setTextColor(50, 50, 50);
      docPdf.text('OFFICIAL INCIDENT AUDIT REPORT', 105, 30, { align: 'center' });
      
      docPdf.setLineWidth(0.5);
      docPdf.line(20, 35, 190, 35);

      // --- INCIDENT METADATA ---
      docPdf.setFontSize(12);
      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Incident ID:', 20, 45);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text(incident.id || incidentId, 60, 45);

      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Final Status:', 20, 55);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text((incident.status || 'UNKNOWN').toUpperCase(), 60, 55);

      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Trigger Method:', 20, 65);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text((incident.triggerMethod || 'UNKNOWN').toUpperCase(), 60, 65);

      // --- TELEMETRY SNAPSHOT ---
      docPdf.setFont('helvetica', 'bold');
      docPdf.text('Last Known GPS:', 20, 75);
      docPdf.setFont('helvetica', 'normal');
      const lat = incident.latitude || incident.location?.lat || 'N/A';
      const lng = incident.longitude || incident.location?.lng || 'N/A';
      docPdf.text(`[${lat}, ${lng}]`, 60, 75);

      // --- EVIDENCE CHAIN ---
      docPdf.line(20, 85, 190, 85);
      docPdf.setFontSize(14);
      docPdf.setFont('helvetica', 'bold');
      docPdf.text('CRYPTOGRAPHIC EVIDENCE CHAIN', 20, 95);

      docPdf.setFontSize(10);
      docPdf.setFont('courier', 'normal');
      
      let yOffset = 105;
      const evidenceChain = incident.evidenceChain || [];

      if (evidenceChain.length === 0) {
        docPdf.text('No cryptographically signed evidence nodes found.', 20, yOffset);
        yOffset += 10;
      } else {
        // Print top 3 nodes to fit on page
        const nodesToPrint = evidenceChain.slice(0, 3);
        nodesToPrint.forEach((node: any, idx: number) => {
          docPdf.text(`Node ${idx + 1}: ${node.evidenceId}`, 20, yOffset);
          docPdf.text(`Hash: ${node.hash}`, 25, yOffset + 5);
          docPdf.text(`Sig : ${node.digitalSignature ? node.digitalSignature.substring(0, 60) + '...' : 'NONE'}`, 25, yOffset + 10);
          docPdf.text(`Time: ${new Date(node.capturedAt).toISOString()}`, 25, yOffset + 15);
          yOffset += 25;
        });
      }

      // --- DIGITAL SIGNATURE FOOTER ---
      docPdf.setFont('helvetica', 'italic');
      docPdf.setFontSize(9);
      docPdf.setTextColor(150, 150, 150);
      
      const generationTime = new Date().toISOString();
      docPdf.text(`Generated securely by Kavach System at ${generationTime}`, 105, 280, { align: 'center' });
      docPdf.text(`Checksum Seal: ${incident.sha256Seal || 'NO_SEAL_PRESENT'}`, 105, 285, { align: 'center' });

      // Save PDF
      docPdf.save(`Kavach_Audit_${incidentId}.pdf`);
      
      console.log(`✅ [AUDIT] Successfully exported ${incidentId}.`);
      return true;
    } catch (error) {
      console.error(`❌ [AUDIT] Failed to generate PDF:`, error);
      return false;
    }
  }
}
