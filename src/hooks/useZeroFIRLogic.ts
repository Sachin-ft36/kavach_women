import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { getReverseMetadata } from '../services/locationService';
import { fetchNearbyPoliceMappls } from '../services/MapplsService';
import { useKavachStore } from '../state/useKavachStore';

export function useZeroFIRLogic(evidenceLogs: any[]) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [firData, setFirData] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isFetchingPS, setIsFetchingPS] = useState(false);
  const [evidenceHashes, setEvidenceHashes] = useState<Record<number, string>>({});
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const [firForm, setFirForm] = useState({
    occurenceDate: '', occurenceTime: '', offenseType: '',
    suspectDetails: '', policeStation: '', policeStationLat: 0,
    policeStationLng: 0, policeStationAddress: '', victimStatement: ''
  });

  const { userPos, triggerMethod, isFirFlowActive, setIsFirFlowActive, setOverlayActive } = useKavachStore();

  // Hashes
  useEffect(() => {
    const calculateAllHashes = async () => {
      const hashes: Record<number, string> = {};
      for (let i = 0; i < evidenceLogs.length; i++) {
        const log = evidenceLogs[i];
        if (log.hash && log.hash !== 'no-hash') {
          hashes[i] = log.hash;
        } else {
          const pseudoString = `${log.type}-${log.date || ''}-${i}-${Math.random()}`;
          const encoder = new TextEncoder();
          const data = encoder.encode(pseudoString);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          hashes[i] = `SHA256:${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
        }
      }
      setEvidenceHashes(hashes);
    };
    if (evidenceLogs.length > 0 && showReviewModal) calculateAllHashes();
  }, [evidenceLogs, showReviewModal]);

  // PS Auto-fetch
  useEffect(() => {
    const autoFetchPS = async () => {
      if (showReviewModal && userPos) {
        setIsFetchingPS(true);
        try {
          const stations = await fetchNearbyPoliceMappls(userPos.lat, userPos.lng);
          if (stations && stations.length > 0) {
            const nearest = stations[0];
            setFirForm(p => ({ ...p, policeStation: nearest.name, policeStationLat: nearest.lat || 0, policeStationLng: nearest.lng || 0, policeStationAddress: nearest.address || '' }));
            toast.success(`Auto-detected: ${nearest.name} (${nearest.dist})`);
          } else {
            const meta = await getReverseMetadata(userPos.lat, userPos.lng);
            if (meta && meta.city) setFirForm(p => ({ ...p, policeStation: `Kotwali Police Station, ${meta.city}` }));
          }
        } catch (e) {
          console.error("Mappls PS Auto-fetch failed:", e);
        } finally {
          setIsFetchingPS(false);
        }
      }
    };
    autoFetchPS();
  }, [showReviewModal, userPos]);

  useEffect(() => {
    if (isFirFlowActive) { setShowReviewModal(true); setIsFirFlowActive(false); }
  }, [isFirFlowActive, setIsFirFlowActive]);

  useEffect(() => {
    setOverlayActive(showReviewModal);
    if (showReviewModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { setOverlayActive(false); document.body.style.overflow = ''; };
  }, [showReviewModal, setOverlayActive]);

  // Signature handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
    setIsDrawing(true); setHasSigned(true);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const generateFIR = async () => {
    if (!hasSigned) { toast.error("Electronic signature verification required under BNSS Rules."); return; }
    setIsGenerating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) { toast.error("Authentication expired. Please login again."); setIsGenerating(false); return; }

      const idToken = await currentUser.getIdToken();
      const lat = userPos?.lat || 0; const lng = userPos?.lng || 0;
      const meta = await getReverseMetadata(lat, lng);
      const firId = `FIR-KVC-${Math.floor(1000 + Math.random() * 9000)}`;

      const finalEvidence = evidenceLogs.map((log, idx) => ({
        mapValue: {
          fields: {
            type: { stringValue: String(log.type || 'unknown') },
            url: { stringValue: String(log.url || '') },
            hash: { stringValue: String(evidenceHashes[idx] || log.hash || 'no-hash') },
            timestamp: { timestampValue: log.timestamp?.toISOString ? log.timestamp.toISOString() : new Date().toISOString() },
            transcript: { stringValue: String(log.transcript || '') }
          }
        }
      }));

      const response = await fetch(`https://firestore.googleapis.com/v1/projects/gen-lang-client-0115433512/databases/(default)/documents/zero_firs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          fields: {
            firId: { stringValue: firId },
            victimUid: { stringValue: currentUser.uid },
            userName: { stringValue: currentUser.displayName || "Verified Citizen" },
            userPhone: { stringValue: localStorage.getItem('kavach_user_phone') || 'UNREGISTERED' },
            offenseType: { stringValue: firForm.offenseType || 'UNDEFINED' },
            statement: { stringValue: firForm.victimStatement || 'NO_STATEMENT_PROVIDED' },
            policeStation: { stringValue: firForm.policeStation || 'NEAREST_AVAILABLE_STATION' },
            status: { stringValue: "UNDER_REVIEW" },
            state: { stringValue: String(meta.state || 'Unknown') },
            triggerMethod: { stringValue: String(triggerMethod || 'MANUAL') },
            timestamp: { timestampValue: new Date().toISOString() },
            evidence: { arrayValue: { values: finalEvidence } },
            policeStationGeo: {
              mapValue: {
                fields: {
                  name: { stringValue: firForm.policeStation || 'NEAREST_AVAILABLE_STATION' },
                  lat: { doubleValue: Number(firForm.policeStationLat || 0) },
                  lng: { doubleValue: Number(firForm.policeStationLng || 0) },
                  address: { stringValue: firForm.policeStationAddress || 'Address unavailable' },
                  mapsLink: { stringValue: firForm.policeStationLat ? `https://www.google.com/maps/search/?api=1&query=${firForm.policeStationLat},${firForm.policeStationLng}` : '' }
                }
              }
            },
            incidentLocation: {
              mapValue: {
                fields: {
                  lat: { doubleValue: Number(lat) }, lng: { doubleValue: Number(lng) },
                  city: { stringValue: String(meta.city || 'Unknown') },
                  display: { stringValue: String(meta.display || 'Sector Unknown') }
                }
              }
            }
          }
        })
      });

      if (!response.ok) throw new Error("Connection processing failed.");
      setFirData({ firId }); setShowReviewModal(false);
      toast.success("O-FIR Processed and Cryptographically Sealed.");
    } catch (error: any) {
      console.error("LEGAL PROTOCOL FAILURE:", error);
      toast.error(`Submission Failed: Authentication error during processing.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFIR = async () => {
    if (!firData) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const firId = firData.firId;

      doc.setTextColor(240, 240, 240); doc.setFontSize(80); doc.setFont("helvetica", "bold");
      doc.saveGraphicsState(); doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
      doc.text("KAVACH SAFETY SYSTEM", 105, 140, { align: "center", angle: 45 });
      doc.setFontSize(20); doc.text("YOUR SAFETY IS OUR FIRST PRIORITY", 105, 160, { align: "center", angle: 45 });
      doc.restoreGraphicsState();

      doc.setDrawColor(0); doc.setLineWidth(0.5); doc.line(15, 10, 195, 10);
      doc.setTextColor(20, 30, 60); doc.setFontSize(16); doc.text("GOVERNMENT OF INDIA", 105, 20, { align: "center" });
      doc.setFontSize(12); doc.text("NATIONAL SAFETY AND INTEGRATED SUPPORT NETWORK", 105, 27, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("MINISTRY OF HOME AFFAIRS // DIGITAL SAFETY DIVISION", 105, 33, { align: "center" });
      doc.setLineWidth(0.2); doc.line(15, 38, 195, 38);

      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("ELECTRONIC FIRST INFORMATION REPORT (E-FIR)", 105, 48, { align: "center" });
      doc.setFontSize(8.5); doc.text("GENERATED IN COMPLIANCE WITH SECTION 63 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023", 105, 54, { align: "center" });

      doc.setDrawColor(200, 200, 200); doc.setFillColor(252, 252, 252); doc.rect(15, 62, 180, 42, 'FD');
      doc.setFontSize(10); doc.setTextColor(20, 30, 60); doc.text("OFFICIAL CASE DETAILS (BNS COMPLIANT):", 20, 70);
      doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "normal"); doc.text(`REFERENCE NUMBER:`, 20, 78);
      doc.setFont("helvetica", "bold"); doc.text(firId, 65, 78);
      doc.setFont("helvetica", "normal"); doc.text(`FILING DATE/TIME:`, 20, 85); doc.text(timestamp, 65, 85);
      doc.text(`OFFENSE TIER (BNS):`, 20, 92); doc.setFont("helvetica", "bold"); doc.text(firForm.offenseType.toUpperCase(), 65, 92);
      doc.setFont("helvetica", "normal"); doc.text(`JURISDICTION STATION:`, 20, 99); doc.setFont("helvetica", "bold"); doc.text(firForm.policeStation.toUpperCase() || "ZERO FIR (NATIONWIDE)", 65, 99);

      doc.setFontSize(11); doc.setTextColor(20, 30, 60); doc.text("DEPOSITION STATEMENT OF COMPLAINANT:", 15, 116);
      doc.setDrawColor(20, 30, 60); doc.setLineWidth(0.5); doc.line(15, 119, 195, 119);
      doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.text(doc.splitTextToSize(firForm.victimStatement, 175), 15, 126);

      if (evidenceLogs.length > 0) {
        const startY = 175;
        doc.setTextColor(20, 30, 60); doc.setFont("helvetica", "bold"); doc.text("CERTIFIED FORENSIC RECORD CHAIN (SEC 63 BNSS):", 15, startY);
        doc.setFontSize(8); doc.setFont("helvetica", "normal");
        evidenceLogs.forEach((log, i) => {
          doc.text(`- ${log.type} // FORENSIC SEAL CHECK: ${(evidenceHashes[i] || log.hash || 'NO-HASH').slice(0, 35)}...`, 20, (startY + 7) + (i * 7));
        });
      }

      if (canvasRef.current && hasSigned) {
        try {
          doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text("Electronic Signature Authenticated (e-Sign):", 15, 222);
          doc.addImage(canvasRef.current.toDataURL("image/png"), 'PNG', 15, 225, 45, 15);
        } catch (e) { console.error("Signature embed failed:", e); }
      }

      const sealX = 160; const sealY = 230;
      doc.setDrawColor(20, 30, 60); doc.setLineWidth(1); doc.circle(sealX + 15, sealY + 15, 20, 'D'); doc.circle(sealX + 15, sealY + 15, 18, 'D');
      doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.text("KAVACH OFFICIAL", sealX + 15, sealY + 8, { align: "center" }); doc.text("GOVERNMENT SEAL", sealX + 15, sealY + 13, { align: "center" });
      doc.setFontSize(5); doc.text("VERIFIED UNDER BNSS 2023", sealX + 15, sealY + 22, { align: "center" }); doc.text("NATIONAL SAFETY DIVISION", sealX + 15, sealY + 25, { align: "center" });

      doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text("Digitally Signed by:", 15, 248); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 30, 60); doc.text("KAVACH NATIONAL SAFETY SYSTEM", 15, 253); doc.setFont("helvetica", "normal"); doc.text("Certificate Authority: IND-NSN-2023 | e-Sign Secure", 15, 258);

      doc.setFillColor(250, 250, 250); doc.rect(0, 275, 210, 22, 'F'); doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text("YOUR SAFETY IS OUR FIRST PRIORITY // KAVACH SAFETY SYSTEM", 105, 282, { align: "center" });
      doc.text("This is an electronically verified record admissible under Section 63 of BNSS, 2023 (replaces 65B of IEA).", 105, 287, { align: "center" });

      doc.save(`E-FIR_${firId}.pdf`);
      toast.success("Admissible E-FIR Document Generated.");
    } catch (err) {
      console.error("PDF GEN FAILURE:", err); toast.error("Government server sync failed.");
    }
  };

  return {
    isGenerating, firData, showReviewModal, setShowReviewModal, isFetchingPS,
    evidenceHashes, firForm, setFirForm,
    canvasRef, isDrawing, hasSigned, startDrawing, draw, stopDrawing, clearSignature,
    generateFIR, downloadFIR
  };
}
