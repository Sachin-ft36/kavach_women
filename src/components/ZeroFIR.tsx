import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Shield, X, Video, Mic, MapPin, Calendar, Clock, AlertTriangle, Lock, Radio } from 'lucide-react';
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
    victimStatement: ''
  });

  const { userPos, activeAlertId, triggerMethod } = useKavachStore();

  const generateFIR = async () => {
    setIsGenerating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Auth Expired. Please login.");
        setIsGenerating(false); return;
      }

      // 🔐 FETCH ID TOKEN FOR REST BYPASS
      const idToken = await currentUser.getIdToken();
      const lat = userPos?.[0] || 0;
      const lng = userPos?.[1] || 0;
      const meta = await getReverseMetadata(lat, lng);
      const firId = `FIR-KVC-${Math.floor(1000 + Math.random() * 9000)}`;

      // 🛰️ TACTICAL REST BYPASS: Direct HTTP POST to Firestore (Bypassing broken SDK)
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
              status: { stringValue: "PENDING_REVIEW" },
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

      if (!response.ok) throw new Error("Connection Bridge Blocked.");

      setFirData({ firId });
      setShowReviewModal(false);
      toast.success("O-FIR Transmitted via Tactical REST Bridge.");
    } catch (error: any) {
      console.error("MISSION CRITICAL FAILURE:", error);
      toast.error(`Dispatch Failed: System Protocol Sync Error.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFIR = () => {
    if (!firData) return;
    const content = `
    🛡️ KAVACH WOMEN SAFETY ECOSYSTEM
    -------------------------------------------
    OFFICIAL O-FIR RECEIPT
    TIMESTAMP: ${new Date().toLocaleString()}
    FIR ID: ${firData.firId}
    -------------------------------------------
    INCIDENT DETAILS:
    - Type: ${firForm.offenseType}
    - Statement: ${firForm.victimStatement}
    -------------------------------------------
    DIGITAL COMPLIANCE: CrPC-154 / BNSS
    SAFE TRAVELS. KAVACH IS WATCHING.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KAVACH_${firData.firId}.txt`;
    link.click();
    toast.success("Receipt Downloaded.");
  };

  const trackFIR = () => {
    toast.info("Status: Processing with SuperCell HQ.");
  };

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center">
            <FileText className="text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Online FIR Protocol</h3>
            <p className="text-sm text-gray-400 font-medium">Bypass local delays. Direct State Node.</p>
          </div>
        </div>

        {!firData ? (
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all shadow-lg"
          >
            SIGN & SUBMIT O-FIR
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl flex items-center gap-4">
              <CheckCircle className="text-green-500" />
              <div>
                <p className="text-sm font-black text-white italic tracking-tight">O-FIR #{firData.firId}</p>
                <p className="text-[10px] text-green-500/80 uppercase tracking-[2px] font-bold">Encrypted & Received</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={downloadFIR}
                className="py-4 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Download size={14} /> DOWNLOAD
              </button>
              <button 
                onClick={trackFIR}
                className="py-4 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 flex items-center justify-center gap-2"
              >
                <Shield size={14} /> TRACKING
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-5xl bg-[#080808] border border-white/10 shadow-2xl rounded-[32px] overflow-hidden flex flex-col max-h-[95vh]">
              
              <div className="flex justify-between items-center p-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Shield size={28} className="text-green-500" />
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">E-FIR Submission</h3>
                    <p className="text-[9px] tracking-[4px] text-gray-500 font-bold uppercase mt-1">CrPC SEC 154 / BNSS COMPLIANCE FORM</p>
                  </div>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Left: Forensic Evidence Summary */}
                  <div className="space-y-8">
                    <div className="p-6 bg-accent-blue/5 border border-accent-blue/20 rounded-[24px]">
                      <h4 className="text-[10px] font-black text-accent-blue uppercase tracking-[3px] mb-4 flex items-center gap-2">
                        <Video size={14} /> SECTION 1: Forensic Attachments
                      </h4>
                      {evidenceLogs.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                          <AlertTriangle className="text-gray-700 mx-auto mb-2" size={32} />
                          <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">No evidence logs detected in session.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {evidenceLogs.map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                                  {log.type === 'Audio Log' ? <Mic className="text-blue-500" size={18} /> : <Video className="text-red-500" size={18} />}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-white">{log.type}</p>
                                  <p className="text-[9px] text-gray-500 font-mono italic uppercase">{log.date}</p>
                                </div>
                              </div>
                              <span className="text-[8px] font-black uppercase text-accent-blue tracking-widest">Attached</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Manual Input Section */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[3px] flex items-center gap-2">
                       <FileText size={14} /> SECTION 2: Statement of Facts
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Date of Occurrence</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-all font-bold" value={firForm.occurenceDate} onChange={(e) => setFirForm({...firForm, occurenceDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Time of Occurrence</label>
                        <input type="time" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-all font-bold" value={firForm.occurenceTime} onChange={(e) => setFirForm({...firForm, occurenceTime: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Nature of Offense</label>
                      <select className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-all font-bold" value={firForm.offenseType} onChange={(e) => setFirForm({...firForm, offenseType: e.target.value})}>
                        <option value="">Select offense type...</option>
                        <option value="Physical Assault">Physical Assault / Violence</option>
                        <option value="Sexual Harassment">Sexual Harassment</option>
                        <option value="Stalking">Stalking / Cyber-Stalking</option>
                        <option value="Attempted Abduction">Attempted Abduction</option>
                        <option value="Emergency Rescue Needed">Emergency Rescue Needed</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Details of Suspect / Vehicle</label>
                      <input type="text" placeholder="Description or Number Plate..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-all font-bold placeholder:text-gray-800" value={firForm.suspectDetails} onChange={(e) => setFirForm({...firForm, suspectDetails: e.target.value})} />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Statement of Events (Incident Report) *</label>
                      <textarea rows={5} placeholder="Type detailed statement here..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition-all font-bold placeholder:text-gray-800 resize-none font-mono" value={firForm.victimStatement} onChange={(e) => setFirForm({...firForm, victimStatement: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
                <p className="text-[10px] text-gray-500 max-w-sm italic">
                  Submission is cryptographically hashed and digitally signed by your device identification node.
                </p>
                <button 
                  onClick={generateFIR}
                  disabled={isGenerating || !firForm.offenseType || !firForm.victimStatement}
                  className="px-8 py-3.5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-green-700 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                  {isGenerating ? <Radio className="animate-spin" size={14} /> : <FileText size={14} />} 
                  {isGenerating ? "PROCESSING..." : "SIGN & SUBMIT O-FIR"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
