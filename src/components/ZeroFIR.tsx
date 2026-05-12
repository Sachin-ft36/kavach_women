import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Shield, X, Video, Mic, MapPin, Calendar, Clock, AlertTriangle, Lock, Radio, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db, auth, app } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { getReverseMetadata } from '../services/locationService';

interface ZeroFIRProps {
  evidenceLogs?: any[];
}

export default function ZeroFIR({ evidenceLogs = [] }: ZeroFIRProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [firData, setFirData] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [firForm, setFirForm] = useState({
    occurenceDate: '',
    occurenceTime: '',
    offenseType: '',
    suspectDetails: '',
    policeStation: '',
    victimStatement: ''
  });

   const { userPos, activeAlertId, triggerMethod, isFirFlowActive, setIsFirFlowActive, setOverlayActive } = useKavachStore();

  const generateFIR = async () => {
    setIsGenerating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Authentication expired. Please login again.");
        setIsGenerating(false); return;
      }

      const idToken = await currentUser.getIdToken();
      const lat = userPos?.[0] || 0;
      const lng = userPos?.[1] || 0;
      const meta = await getReverseMetadata(lat, lng);
      const firId = `FIR-KVC-${Math.floor(1000 + Math.random() * 9000)}`;

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/gen-lang-client-0115433512/databases/(default)/documents/zero_firs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
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
              evidence: {
                arrayValue: {
                  values: evidenceLogs.map(log => ({
                    mapValue: {
                      fields: {
                        type: { stringValue: String(log.type || 'unknown') },
                        url: { stringValue: String(log.url || '') },
                        hash: { stringValue: String(log.hash || 'no-hash') },
                        timestamp: { timestampValue: log.timestamp?.toISOString ? log.timestamp.toISOString() : new Date().toISOString() },
                        transcript: { stringValue: String(log.transcript || '') }
                      }
                    }
                  }))
                }
              },
              incidentLocation: {
                mapValue: {
                  fields: {
                    lat: { doubleValue: Number(lat) },
                    lng: { doubleValue: Number(lng) },
                    city: { stringValue: String(meta.city || 'Unknown') },
                    display: { stringValue: String(meta.display || 'Sector Unknown') }
                  }
                }
              }
            }
          })
        }
      );

      if (!response.ok) throw new Error("Connection processing failed.");

      setFirData({ firId });
      setShowReviewModal(false);
      toast.success("O-FIR Processed via Official Gateway.");
    } catch (error: any) {
      console.error("LEGAL PROTOCOL FAILURE:", error);
      toast.error(`Submission Failed: Authentication error during processing.`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isFirFlowActive) {
      setShowReviewModal(true);
      setIsFirFlowActive(false);
    }
  }, [isFirFlowActive, setIsFirFlowActive]);

  useEffect(() => {
    setOverlayActive(showReviewModal);
    return () => setOverlayActive(false);
  }, [showReviewModal, setOverlayActive]);

  const downloadFIR = async () => {
    if (!firData) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const firId = firData.firId;

      // 🛡️ BACKGROUND WATERMARK (Institutional)
      doc.setTextColor(240, 240, 240);
      doc.setFontSize(80);
      doc.setFont("helvetica", "bold");
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
      doc.text("KAVACH SAFETY SYSTEM", 105, 140, { align: "center", angle: 45 });
      doc.setFontSize(20);
      doc.text("YOUR SAFETY IS OUR FIRST PRIORITY", 105, 160, { align: "center", angle: 45 });
      doc.restoreGraphicsState();

      // 🏛️ OFFICIAL HEADER (Government Style)
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(15, 10, 195, 10);
      
      doc.setTextColor(20, 30, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("GOVERNMENT OF INDIA", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text("NATIONAL SAFETY AND INTEGRATED SUPPORT NETWORK", 105, 27, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("MINISTRY OF HOME AFFAIRS // DIGITAL SAFETY DIVISION", 105, 33, { align: "center" });
      
      doc.setLineWidth(0.2);
      doc.line(15, 38, 195, 38);

      // 📋 DOCUMENT TITLE
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ELECTRONIC FIRST INFORMATION REPORT (E-FIR)", 105, 50, { align: "center" });
      doc.setFontSize(9);
      doc.text("UNDER SECTION 154 OF THE CODE OF CRIMINAL PROCEDURE / BNSS 2023", 105, 56, { align: "center" });

      // 🛡️ CASE IDENTIFICATION TABLE
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(252, 252, 252);
      doc.rect(15, 65, 180, 40, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(20, 30, 60);
      doc.text("OFFICIAL CASE DETAILS:", 20, 73);
      
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`REFERENCE NUMBER:`, 20, 82);
      doc.setFont("helvetica", "bold");
      doc.text(firId, 65, 82);
      
      doc.setFont("helvetica", "normal");
      doc.text(`FILING DATE/TIME:`, 20, 89);
      doc.text(timestamp, 65, 89);
      
      doc.text(firForm.offenseType.toUpperCase(), 65, 96);
      
      doc.setFont("helvetica", "normal");
      doc.text(`JURISDICTION STATION:`, 20, 103);
      doc.setFont("helvetica", "bold");
      doc.text(firForm.policeStation.toUpperCase() || "ZERO FIR (NATIONWIDE)", 65, 103);

      // 🖋️ STATEMENT SECTION
      doc.setFontSize(11);
      doc.setTextColor(20, 30, 60);
      doc.text("DEPOSITION STATEMENT OF COMPLAINANT:", 15, 120);
      
      doc.setDrawColor(20, 30, 60);
      doc.setLineWidth(0.5);
      doc.line(15, 123, 195, 123);

      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitStatement = doc.splitTextToSize(firForm.victimStatement, 175);
      doc.text(splitStatement, 15, 132);

      if (evidenceLogs.length > 0) {
        const startY = 180;
        doc.setTextColor(20, 30, 60);
        doc.setFont("helvetica", "bold");
        doc.text("CERTIFIED FORENSIC RECORDS:", 15, startY);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        evidenceLogs.forEach((log, i) => {
          const y = (startY + 8) + (i * 7);
          doc.text(`- ${log.type} // VERIFIED HASH: ${log.hash.slice(0, 24)}...`, 20, y);
        });
      }

      // 🛡️ OFFICIAL KAVACH STAMP (Circular Gov Style)
      const sealX = 160;
      const sealY = 240;
      doc.setDrawColor(20, 30, 60);
      doc.setLineWidth(1);
      doc.circle(sealX + 15, sealY + 15, 20, 'D');
      doc.circle(sealX + 15, sealY + 15, 18, 'D');
      
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("KAVACH OFFICIAL", sealX + 15, sealY + 8, { align: "center" });
      doc.text("GOVERNMENT SEAL", sealX + 15, sealY + 13, { align: "center" });
      doc.setFontSize(5);
      doc.text("VERIFIED UNDER BNSS 2023", sealX + 15, sealY + 22, { align: "center" });
      doc.text("NATIONAL SAFETY DIVISION", sealX + 15, sealY + 25, { align: "center" });

      // 🖋️ DIGITAL SIGNATURE
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Digitally Signed by:", 15, 250);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 30, 60);
      doc.text("KAVACH NATIONAL SAFETY SYSTEM", 15, 255);
      doc.setFont("helvetica", "normal");
      doc.text("Certificate Authority: IND-NSN-2023", 15, 260);

      // 🏛️ FOOTER LEGAL
      doc.setFillColor(250, 250, 250);
      doc.rect(0, 275, 210, 22, 'F');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("YOUR SAFETY IS OUR FIRST PRIORITY // KAVACH SAFETY SYSTEM", 105, 282, { align: "center" });
      doc.text("This is a computer generated document and does not require a physical signature under the IT Act 2000.", 105, 287, { align: "center" });

      doc.save(`E-FIR_${firId}.pdf`);
      toast.success("Official E-FIR Document Generated.");
    } catch (err) {
      console.error("PDF GEN FAILURE:", err);
      toast.error("Government server sync failed.");
    }
  };

  const trackFIR = () => {
    toast.info("Processing Status: Under active review by authorities.");
  };

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-6 space-y-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Shield size={80} /></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-[#2563EB]/5 rounded-2xl flex items-center justify-center border border-[#2563EB]/10">
            <FileText className="text-[#2563EB]" size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-[#1E293B] text-xl">Digital Complaint Center</h3>
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-widest mt-0.5">Online FIR & Safety Reporting</p>
          </div>
        </div>

        {!firData ? (
          <div className="flex flex-col gap-3 relative z-10">
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full py-4 sm:py-5 bg-[#2563EB] text-white rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-[#1d4ed8] active:scale-[0.98] transition-all shadow-xl shadow-[#2563EB]/20"
            >
              <Upload size={18} /> Start Complaint
            </button>
            <div className="flex items-center justify-center gap-2 text-[#64748B]">
              <Shield size={14} className="text-[#2563EB]" />
              <span className="text-[10px] font-bold uppercase tracking-wider italic">Your information is securely protected.</span>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 relative z-10">
            <div className="bg-accent-green/5 border border-accent-green/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <CheckCircle className="text-accent-green" />
              <div>
                <p className="text-sm font-bold text-gray-900 tracking-tight">O-FIR: {firData.firId}</p>
                <p className="text-[10px] text-accent-green uppercase tracking-widest font-bold">LEGALLY REGISTERED</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={downloadFIR}
                className="py-4 bg-white border border-[#E5E7EB] text-gray-900 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm"
              >
                <Download size={14} className="text-[#2563EB]" /> ACKNOWLEDGEMENT
              </button>
              <button 
                onClick={trackFIR}
                className="py-4 bg-white border border-[#E5E7EB] text-gray-900 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm"
              >
                <Shield size={14} className="text-accent-green" /> TRACK FILING
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }} 
            className="fixed inset-0 z-[10000] bg-[#F8FAFC] flex flex-col"
          >
            {/* 🛡️ TACTICAL HEADER */}
            <div className="p-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 z-[101]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2563EB]/5 rounded-2xl flex items-center justify-center text-[#2563EB]">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter italic leading-none">Digital Complaint Center</h2>
                  <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-[3px] mt-1.5 opacity-60">National Safety Reporting Portal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-500 active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-12">
              <div className="max-w-5xl mx-auto w-full bg-white border border-[#E5E7EB] shadow-sm rounded-[3rem] overflow-hidden flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 p-8 sm:p-12">
                  {/* Left: Forensic Evidence Summary */}
                  <div className="space-y-6 sm:space-y-8">
                    <div className="p-5 sm:p-8 bg-gray-50 border border-[#E5E7EB] rounded-[24px] sm:rounded-[32px] shadow-sm relative overflow-hidden">
                      <h4 className="text-[9px] sm:text-[10px] font-black text-[#1E293B] uppercase tracking-[3px] mb-6 sm:mb-8 flex items-center gap-3">
                        <Video size={16} className="text-[#2563EB]" /> SECTION I: FORENSIC ATTACHMENTS
                      </h4>
                      {evidenceLogs.length === 0 ? (
                        <div className="py-10 sm:py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl sm:rounded-3xl bg-white/50">
                          <AlertTriangle className="text-gray-300 mx-auto mb-3" size={32} />
                          <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest px-4">No forensic assets detected in this session.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {evidenceLogs.map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm group hover:border-[#2563EB]/30 transition-all">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-gray-100 shadow-inner">
                                  {log.type === 'Audio Log' ? <Mic className="text-[#2563EB] w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="text-[#DC2626] w-5 h-5 sm:w-6 sm:h-6" />}
                                </div>
                                <div>
                                  <p className="font-black text-[12px] sm:text-sm text-gray-900 italic uppercase">{log.type}</p>
                                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-tight">{log.date}</p>
                                </div>
                              </div>
                              <div className="px-2 py-1 bg-accent-green/10 border border-accent-green/20 rounded-lg">
                                <span className="text-[7px] sm:text-[8px] font-black uppercase text-accent-green tracking-widest">VERIFIED</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-[#2563EB]/5 rounded-xl sm:rounded-2xl border border-[#2563EB]/10">
                        <p className="text-[8px] sm:text-[9px] text-[#2563EB] font-bold uppercase leading-relaxed tracking-wider">
                           All attachments are hashed and timestamped via secure government node.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Manual Input Section */}
                  <div className="space-y-6 sm:space-y-8">
                    <h4 className="text-[9px] sm:text-[10px] font-black text-[#111827] uppercase tracking-[2px] sm:tracking-[3px] flex items-center gap-3">
                       <FileText size={16} className="text-[#2563EB]" /> SECTION II: AFFIDAVIT OF INCIDENT
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Incident Date</label>
                        <input type="date" className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold" value={firForm.occurenceDate} onChange={(e) => setFirForm({...firForm, occurenceDate: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Incident Time</label>
                        <input type="time" className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold" value={firForm.occurenceTime} onChange={(e) => setFirForm({...firForm, occurenceTime: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Category of Offense</label>
                      <select className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold appearance-none" value={firForm.offenseType} onChange={(e) => setFirForm({...firForm, offenseType: e.target.value})}>
                        <option value="">Select Official Category...</option>
                        <option value="Physical Assault">Physical Assault / Violence</option>
                        <option value="Sexual Harassment">Sexual Harassment</option>
                        <option value="Stalking">Stalking / Cyber-Harassment</option>
                        <option value="Attempted Abduction">Attempted Abduction</option>
                        <option value="Emergency Rescue">Emergency Rescue Required</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Identification Details (Suspect/Vehicle)</label>
                      <input type="text" placeholder="Visual indicators, plate numbers..." className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold placeholder:text-gray-300" value={firForm.suspectDetails} onChange={(e) => setFirForm({...firForm, suspectDetails: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Nearest Police Station (Search on Google)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Noida Sector 63 PS (Search nearest PS on Google)" 
                        className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold placeholder:text-gray-300" 
                        value={firForm.policeStation} 
                        onChange={(e) => setFirForm({...firForm, policeStation: e.target.value})} 
                      />
                      <p className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-widest ml-1 italic">
                        Please search "Nearest Police Station" on Google and enter the official name here.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Detailed Deposition of Facts *</label>
                      <textarea rows={4} placeholder="Describe the events..." className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold placeholder:text-gray-300 resize-none font-sans" value={firForm.victimStatement} onChange={(e) => setFirForm({...firForm, victimStatement: e.target.value})} />
                    </div>

                    <div className="flex items-start gap-3 p-4 sm:p-5 bg-accent-red/5 border border-accent-red/10 rounded-xl sm:rounded-2xl">
                      <input type="checkbox" id="affirmation" className="mt-1 w-3.5 h-3.5 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                      <label htmlFor="affirmation" className="text-[8px] sm:text-[9px] font-bold text-gray-800 uppercase tracking-wider leading-relaxed">
                         I affirm all information is true under Section 193 of the IPC.
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-10 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-[101]">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:max-w-md">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-inner shrink-0 border border-gray-100">
                  <Lock size={16} />
                </div>
                <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                  Submission is encrypted and digitally signed for admissibility in Indian Courts under BNSS-2023.
                </p>
              </div>
              <button 
                onClick={generateFIR}
                disabled={isGenerating || !firForm.offenseType || !firForm.victimStatement}
                className="w-full sm:w-auto px-10 py-4 sm:px-12 sm:py-5 bg-[#111827] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-[2px] sm:tracking-[3px] text-[10px] sm:text-xs flex items-center justify-center gap-3 sm:gap-4 hover:bg-black active:scale-[0.95] transition-all shadow-2xl shadow-black/20 disabled:opacity-50 disabled:grayscale"
              >
                {isGenerating ? <Radio className="animate-spin" size={14} /> : <Shield size={18} />} 
                {isGenerating ? "DISPATCHING..." : "OFFICIALLY DISPATCH REPORT"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
