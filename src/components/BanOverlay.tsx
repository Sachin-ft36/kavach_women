import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldX, AlertOctagon, Lock, Gavel, Info, LogOut, Send, Clock, CheckCircle2 } from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

export default function BanOverlay() {
  const { isSOSBlocked, sosBlockedReason, setOverlayActive, user, isPermanentlyBlocked } = useKavachStore();
  const [isAppealMode, setIsAppealMode] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAppealed, setHasAppealed] = useState(false);

  React.useEffect(() => {
    if (isSOSBlocked) {
      setOverlayActive(true);
      checkExistingAppeal();
    } else {
      setOverlayActive(false);
    }
    return () => setOverlayActive(false);
  }, [isSOSBlocked, setOverlayActive]);

  const checkExistingAppeal = async () => {
    if (!user?.uid) return;
    const q = query(collection(db, 'appeals'), where('userId', '==', user.uid), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    if (!snap.empty) setHasAppealed(true);
  };

  if (!isSOSBlocked) return null;

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const submitAppeal = async () => {
    const effectiveUser = user || auth.currentUser;
    if (!appealReason.trim()) {
      toast.error("Forensic protocol requires a detailed statement.");
      return;
    }
    if (!effectiveUser) {
      toast.error("Identity Verification Failed. Please re-authenticate.");
      return;
    }
    if (isPermanentlyBlocked) {
      toast.error("Terminal Blacklist Active. Adjudication Final.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'appeals'), {
        userId: effectiveUser.uid,
        userName: effectiveUser.displayName || 'Anonymous',
        reason: appealReason,
        status: 'pending',
        timestamp: serverTimestamp(),
        originalBanReason: sosBlockedReason
      });
      setHasAppealed(true);
      setIsAppealMode(false);
      toast.success("Appeal Submitted to SuperCell Command.");
    } catch (e: any) {
      console.error("Appeal Error:", e);
      toast.error(`Forensic Link Failed: ${e.message || 'Check Rules'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[20000] bg-[#0F172A] flex items-center justify-center p-4 sm:p-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1),transparent)] pointer-events-none" />
        
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <motion.div
          initial={{ scale: 0.9, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="relative w-full max-w-md bg-white rounded-[32px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden border border-rose-500/20"
        >
          {/* 🏛️ BNS Official Revocation Header */}
          <div className="bg-rose-600 px-6 py-8 sm:py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 opacity-50" />
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" 
            />
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-1 relative">
                <ShieldX size={40} className="text-rose-600" strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-rose-600 rounded-full  opacity-75" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-[9px] font-black uppercase tracking-[4px] text-white/80">Sovereign Grid Control</h2>
                <h1 className="text-2xl font-black uppercase text-white tracking-tight leading-none">Access Revoked</h1>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            {!isAppealMode ? (
              <>
                {/* 🛡️ Forensic Suspension Notice */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertOctagon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol Violation Detected</span>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-5 relative overflow-hidden">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-rose-100 rounded-full">
                      <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest italic">Legal Status</span>
                    </div>
                    <div className="flex items-start gap-4">
                        <Lock size={20} className="text-rose-600 mt-1 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-rose-900 uppercase leading-relaxed tracking-tight">
                                {isPermanentlyBlocked 
                                  ? "Your SOS Interception privileges have been PERMANENTLY REVOKED due to severe protocol violations." 
                                  : "Your SOS Interception privileges have been temporarily suspended by the SuperCell Command."}
                            </p>
                            <p className="text-[10px] font-bold text-rose-500 uppercase mt-2 tracking-widest leading-none">
                                Reason: {sosBlockedReason || "Repeated misuse of emergency protocols"}
                            </p>
                        </div>
                    </div>
                  </div>
                </div>

                {isPermanentlyBlocked ? (
                  <div className="bg-rose-950 border border-rose-900 rounded-[24px] p-6 flex flex-col items-center text-center gap-3">
                    <ShieldX className="text-rose-500" size={32} />
                    <div className="space-y-1">
                       <p className="text-xs font-black text-white uppercase italic tracking-tighter">Terminal Blacklist Active</p>
                       <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest leading-relaxed">
                          Adjudication Complete. All future appeals for this identity have been summarily rejected. Access to the National Grid is permanently terminated.
                       </p>
                    </div>
                  </div>
                ) : hasAppealed ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-6 flex flex-col items-center text-center gap-3">
                    <Clock className="text-blue-600 " size={32} />
                    <div className="space-y-1">
                       <p className="text-xs font-black text-blue-900 uppercase">Appeal Under Review</p>
                       <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                          Your case is currently being adjudicated by the national forensic board. Access will remain restricted until a verdict is reached.
                       </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAppealMode(true)}
                    className="w-full py-5 rounded-[24px] bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 hover:bg-rose-100 active:scale-[0.98]"
                  >
                    <Send size={16} />
                    Request Access Restoration
                  </button>
                )}

                {/* ⚖️ Accountability Clause */}
                <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-5">
                  <div className="flex items-start gap-4">
                    <Gavel size={18} className="text-gray-400 mt-1 shrink-0" />
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-700 leading-relaxed uppercase tracking-tight">
                        This action is recorded in the national security blockchain. 
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="space-y-2">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Sovereign Appeal</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                       Provide a detailed justification for restoring your tactical safety privileges. False claims will lead to a permanent terminal ban.
                    </p>
                 </div>
                 
                 <div className="relative">
                    <textarea 
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="ENTER DETAILED REASON..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-6 text-xs font-bold text-gray-900 placeholder:text-gray-300 min-h-[160px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all uppercase tracking-tight"
                    />
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => setIsAppealMode(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                    <button 
                      onClick={submitAppeal}
                      disabled={isSubmitting || !appealReason.trim()}
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <Clock className="animate-spin" size={16} /> : <Send size={16} />}
                      Submit Forensic Review
                    </button>
                 </div>
              </motion.div>
            )}

            {/* ⚡ Secondary Actions */}
            <div className="space-y-4 pt-2">
                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl bg-[#0F172A] text-white text-xs font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] hover:bg-black"
                >
                    <LogOut size={16} />
                    Exit Tactical Grid
                </button>
                
                <div className="flex items-center justify-center gap-2">
                    <Info size={12} className="text-gray-400" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[2px]">Terminal Session ID: BNS-REVO-TX{Math.floor(Math.random()*10000)}</span>
                </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
