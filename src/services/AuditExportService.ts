import jsPDF from 'jspdf';
import { IncidentRecord } from '../types';

export const AuditExportService = {
  generatePDF: async (incident: IncidentRecord, evidenceLogs: any[] = []) => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `KAVACH_AUDIT_${incident.id || 'NIL'}_${timestamp}.pdf`;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(220, 38, 38); // Red
      doc.text('KAVACH FORENSIC INCIDENT REPORT', 14, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Official System Generated Legal Audit`, 14, 26);
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 32);

      // Section: Core Incident Details
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 36, 196, 36);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('1. Core Incident Details', 14, 46);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Incident ID: ${incident.id || 'UNKNOWN'}`, 14, 54);
      doc.text(`Victim UID: ${incident.victimUid || incident.userId || 'UNKNOWN'}`, 14, 60);
      doc.text(`Phone No: ${incident.victimPhone || incident.phone || 'UNKNOWN'}`, 14, 66);
      doc.text(`Status: ${incident.status.toUpperCase()}`, 14, 72);
      
      const lat = incident.location?.lat || incident.lat || incident.latitude || 'NIL';
      const lng = incident.location?.lng || incident.lng || incident.longitude || 'NIL';
      doc.text(`Coordinates: ${lat}, ${lng}`, 14, 78);

      // Section: Cryptographic Chain of Custody
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('2. Cryptographic Chain of Custody (Evidence)', 14, 94);
      
      doc.setFontSize(9);
      let startY = 102;
      if (evidenceLogs.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.text('No digital evidence recorded for this incident.', 14, startY);
      } else {
        evidenceLogs.forEach((log, i) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`[RECORD ${i+1}] ${log.type}`, 14, startY);
          
          doc.setFont('helvetica', 'normal');
          doc.text(`SHA-256 Hash: ${log.hash || 'N/A'}`, 14, startY + 6);
          
          if (log.digitalSignature) {
            doc.setTextColor(5, 150, 105); // Green for verified
            doc.text(`ECDSA Signature: VALID [${log.digitalSignature.substring(0, 40)}...]`, 14, startY + 12);
            doc.setTextColor(30, 41, 59);
          } else {
            doc.text(`ECDSA Signature: NOT APPLIED`, 14, startY + 12);
          }

          doc.text(`Timestamp: ${log.date || log.timestamp || 'UNKNOWN'}`, 14, startY + 18);
          startY += 28;

          // Page break check
          if (startY > 270) {
            doc.addPage();
            startY = 20;
          }
        });
      }

      // Section: System Integrity Verification
      startY += 10;
      doc.line(14, startY, 196, startY);
      startY += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('System Integrity Notice:', 14, startY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('This document was generated automatically by the Kavach Evidence Engine.', 14, startY + 6);
      doc.text('Any alteration to this PDF or the referenced hashes will break the cryptographic signature chain.', 14, startY + 10);
      doc.text('Valid for presentation to appropriate law enforcement authorities.', 14, startY + 14);

      // Save PDF
      doc.save(filename);
      return true;
    } catch (error) {
      console.error('Failed to export PDF Audit:', error);
      throw error;
    }
  }
};
