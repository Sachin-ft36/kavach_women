import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Shield, X, Video, Mic, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { reverseGeocode } from '../utils/geoUtils';

interface ZeroFIRProps {
  evidenceLogs?: any[];
}

export default function ZeroFIR({ evidenceLogs = [] }: ZeroFIRProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [firData, setFirData] = useState<any>(null);
  
  // Modal & Form State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [firForm, setFirForm] = useState({
    occurenceDate: '',
    occurenceTime: '',
    offenseType: '',
    suspectDetails: '',
    victimStatement: ''
  });

  const { user, userPos } = useKavachStore();

  const generateFIR = async () => {
    setIsGenerating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Security Lock: You must be actively logged in to sign an official FIR.");
        setIsGenerating(false);
        return;
      }
      
      // Calculate automated Jurisdiction Routing details
      const locationData = await reverseGeocode(userPos[0], userPos[1]);
      const statePrefix = locationData?.state ? locationData.state.substring(0, 2).toUpperCase() : 'XX';
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const generatedFirId = `FIR-IND-${statePrefix}-${randomId}`;

      const payload = {
        firId: generatedFirId,
        victimUid: currentUser.uid,
        victimName: currentUser.displayName || "Kavach Citizen",
        victimAadharHash: "AADHAAR_VERIFIED_HASH", 
        incidentLocation: { 
          lat: userPos[0], 
          lng: userPos[1], 
          city: locationData?.city || 'Unknown', 
          state: locationData?.state || 'Unknown' 
        },
        offenseType: firForm.offenseType,
        statement: firForm.victimStatement,
        suspectDetails: firForm.suspectDetails,
        timestamp: serverTimestamp(),
        status: "PENDING_REVIEW",
        evidenceHashes: evidenceLogs.map(l => l.hash)
      };

      // Push securely to Firestore Database
      await setDoc(doc(db, 'zero_firs', generatedFirId), payload);

      setFirData({ firId: generatedFirId });
      setShowReviewModal(false);
      toast.success("Nationwide Zero-FIR Routed Successfully");
    } catch (error: any) {
      console.error("FIR Submission Failure:", error);
      toast.error(`Submission Failed: ${error.message || 'System Error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center">
            <FileText className="text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Zero-FIR Protocol</h3>
            <p className="text-sm text-gray-400">Bypass local delays. Direct to Home Dept.</p>
          </div>
        </div>

        {!firData ? (
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
          >
            DRAFT & PREVIEW FIR
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-2xl flex items-center gap-4">
              <CheckCircle className="text-green-500" />
              <div>
                <p className="text-sm font-bold">FIR #{firData.firId}</p>
                <p className="text-[10px] text-green-200 uppercase tracking-widest">Digitally Signed & Timestamped</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Download size={16} />
                DOWNLOAD
              </button>
              <button className="py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Shield size={16} />
                TRACK CASE
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* DRAFTING & REVIEW MODAL */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-5xl bg-bg border border-border shadow-2xl rounded-[32px] overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="flex justify-between items-center bg-[#0a0a0c] p-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <Shield size={28} className="text-green-500" />
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Official Zero-FIR Draft</h3>
                    <p className="text-[10px] tracking-widest text-gray-500 font-bold uppercase mt-1">CrPC Sec 154 / BNSS Compliance Form</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* SECTION 1: Evidence Preview */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="text-sm font-black uppercase tracking-widest text-accent-blue">Section 1: Evidence Preview</h4>
                    <span className="text-[9px] bg-red-500/20 text-red-500 px-2 py-1 rounded font-bold uppercase tracking-widest">Immutable Chain</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono italic">
                    Below evidence is cryptographically locked and will be attached automatically. You may preview it but cannot delete it to maintain forensic integrity.
                  </p>
                  <div className="space-y-3">
                    {evidenceLogs.length === 0 ? (
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                        <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={24} />
                        <p className="text-sm font-bold text-gray-500">No evidence logs found in current session.</p>
                      </div>
                    ) : (
                      evidenceLogs.map(log => (
                        <div key={log.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                              {log.type === 'SOS Alert' && <Shield className="text-red-500" size={20} />}
                              {log.type === 'Audio Log' && <Mic className="text-blue-500" size={20} />}
                              {log.type === 'Video Stream' || log.type === 'Snapshot' ? <Video className="text-accent-red" size={20} /> : null}
                              {log.type === 'Zero-FIR' && <FileText className="text-green-500" size={20} />}
                            </div>
                            <div>
                               <p className="font-bold text-sm">{log.type}</p>
                               <p className="text-[10px] text-gray-500 font-mono">{log.date}</p>
                            </div>
                          </div>
                          <button 
                            className="text-[10px] font-black uppercase text-accent-blue hover:text-white transition-colors"
                            onClick={() => window.open(log.url || '#', '_blank')}
                          >
                            Preview
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SECTION 2: Official Form */}
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-3">
                    <h4 className="text-sm font-black uppercase tracking-widest text-green-500">Section 2: Statement of Facts</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                          <Calendar size={12} className="inline mr-1 -mt-0.5" />
                          Date of Occurrence
                        </label>
                        <input 
                          type="date" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
                          value={firForm.occurenceDate}
                          onChange={(e) => setFirForm({...firForm, occurenceDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                          <Clock size={12} className="inline mr-1 -mt-0.5" />
                          Time of Occurrence
                        </label>
                        <input 
                          type="time" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
                          value={firForm.occurenceTime}
                          onChange={(e) => setFirForm({...firForm, occurenceTime: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />
                        Nature of Offense
                      </label>
                      <select 
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
                        value={firForm.offenseType}
                        onChange={(e) => setFirForm({...firForm, offenseType: e.target.value})}
                      >
                        <option value="">Select Primary Offense...</option>
                        <option value="Physical Assault">Physical Assault / Violence</option>
                        <option value="Sexual Harassment">Sexual Harassment</option>
                        <option value="Stalking">Stalking / Following</option>
                        <option value="Kidnapping / Abduction">Attempted Kidnapping / Abduction</option>
                        <option value="Domestic Violence">Domestic Violence</option>
                        <option value="Other">Other / Unspecified</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Details of Suspect / Vehicle (If Known)
                      </label>
                      <input 
                        type="text" 
                        placeholder="E.g., Tall man in red shirt, or Cab DL 1C 1234"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500 outline-none placeholder:text-gray-600"
                        value={firForm.suspectDetails}
                        onChange={(e) => setFirForm({...firForm, suspectDetails: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1.5 block">
                        Statement of Events (Incident Report) *
                      </label>
                      <textarea 
                        rows={6}
                        placeholder="Describe what exactly happened in detail..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500 outline-none placeholder:text-gray-600 custom-scrollbar resize-none font-mono"
                        value={firForm.victimStatement}
                        onChange={(e) => setFirForm({...firForm, victimStatement: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="bg-[#050505] border-t border-white/10 p-6 flex items-center justify-between shrink-0">
                 <p className="text-[10px] font-mono text-gray-500 max-w-sm hidden sm:block">
                   By submitting this form, you are registering a legally binding Zero-FIR with the Home Department via KAVACH. False reporting is punishable under law.
                 </p>
                 <button 
                  onClick={generateFIR}
                  disabled={isGenerating || !firForm.victimStatement || !firForm.offenseType}
                  className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(22,163,74,0.3)] ml-auto"
                 >
                   {isGenerating ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <>
                        <FileText size={18} />
                        Sign & Submit O-FIR
                     </>
                   )}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
