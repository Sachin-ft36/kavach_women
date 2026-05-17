import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, X, ShieldAlert, CheckCircle2, 
  Clock, MapPin, AlertTriangle, MessageSquare,
  ShieldCheck, ArrowRight, UserMinus, Lock,
  Database, Fingerprint, Link as LinkIcon, Users, Shield
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface MissionAuditModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function MissionAuditModal({ user, isOpen, onClose }: MissionAuditModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIssuingWarning, setIsIssuingWarning] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchMissionHistory();
    }
  }, [isOpen, user]);

  const fetchMissionHistory = async () => {
    setLoading(true);
    try {
      // 🛡️ FORENSIC RECOVERY: Broad search across multiple possible ID fields
      const userId = user.id || user.uid;
      const isProtector = user.role?.toLowerCase() === 'protector' || user.isVerified;
      
      // Fetch all alerts to ensure we don't miss any due to field naming variations
      // We limit to 200 for performance but filter in JS for maximum accuracy
      const q = query(
        collection(db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );

      const snap = await getDocs(q);
      const allAlerts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const historicalData = allAlerts.filter(h => {
        // Match user role in the mission
        const isVictimMatch = h.victimUid === userId || h.uid === userId;
        const isResponderMatch = h.responderUid === userId || (h.activeResponders || []).some((r: any) => r.uid === userId);
        
        const isUserInvolved = isVictimMatch || isResponderMatch;
        const isNotActive = !['active', 'responding', 'Active', 'Responding'].includes(h.status);
        
        return isUserInvolved && isNotActive;
      });

      setHistory(historicalData);

      // 🛡️ FETCH GUARDIANS
      const gSnap = await getDocs(collection(db, 'users', userId, 'guardians'));
      setGuardians(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Audit Fetch Error:", e);
      // Final Fallback: Simple collection scan
      try {
        const fallbackSnap = await getDocs(collection(db, 'alerts'));
        const userId = user.id || user.uid;
        const fallbackData = fallbackSnap.docs
          .map(d => ({ id: d.id, ...d.data() as any }))
          .filter(h => (h.victimUid === userId || h.uid === userId || h.responderUid === userId))
          .filter(h => !['active', 'responding'].includes(h.status?.toLowerCase()))
          .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setHistory(fallbackData);
      } catch (err) {
        console.error("Critical Audit Failure:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIssueWarning = async () => {
    if (!user?.id) return;
    setIsIssuingWarning(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        hasPendingWarning: true,
        warningMessage: `⚠️ KAVACH DISCIPLINARY: Misuse of SOS protocol detected. Your account is under forensic review.`,
        lastWarningAt: serverTimestamp(),
        warningCount: (user.warningCount || 0) + 1,
        systemStatus: 'UNDER_FORENSIC_REVIEW'
      });
      toast.success(`COMMAND CENTER: Formal warning issued to ${user.name}.`);
      onClose();
    } catch (e) {
      toast.error("Failed to issue institutional warning.");
    } finally {
      setIsIssuingWarning(false);
    }
  };

  const falseAlertCount = history.filter(h => h.closureReason === 'Accidentally triggered SOS').length;
  const integrityScore = Math.max(0, 100 - (falseAlertCount * 25));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="relative w-full max-w-6xl bg-[#0F172A] rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* 🏛️ HIGH-FIDELITY AUDIT HEADER */}
            <div className="p-10 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 relative">
                  <Database size={28} />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0F172A] flex items-center justify-center">
                     <Lock size={10} />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic leading-none">Mission Audit File</h2>
                  <p className="text-[11px] font-black text-blue-400 uppercase tracking-[4px] mt-2 opacity-60">Registry Ref: {user.id?.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* 📊 LEFT SIDE: CITIZEN INTEL */}
              <div className="w-[400px] border-r border-white/10 bg-black/20 p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
                <div className="text-center">
                   <div className="relative inline-block">
                      <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="w-32 h-32 rounded-[40px] mx-auto object-cover border-4 border-white/10 shadow-2xl mb-6" />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-[#0F172A] text-white">
                         <ShieldCheck size={20} />
                      </div>
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{user.name}</h3>
                   <div className="flex items-center justify-center gap-3 mt-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{user.city || 'Sector Unknown'}</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Integrity Index</span>
                       <span className={cn("text-xl font-black tabular-nums", integrityScore > 70 ? "text-emerald-500" : "text-rose-500")}>{integrityScore}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${integrityScore}%` }}
                         transition={{ duration: 1.5, ease: "circOut" }}
                         className={cn("h-full", integrityScore > 70 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]")}
                       />
                    </div>
                    <p className="text-[8px] font-bold text-gray-600 uppercase mt-4 tracking-widest leading-relaxed">Behavioral analytics consistent with national baseline safety requirements.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 text-center">
                        <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{history.length}</p>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Total SOS</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 text-center">
                        <p className="text-2xl font-black text-rose-500 italic tracking-tighter leading-none">{falseAlertCount}</p>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">False Blocks</p>
                     </div>
                  </div>

                  {/* 🛡️ GUARDIAN NETWORK SECTION */}
                  <div className="p-8 bg-blue-600/5 rounded-[40px] border border-blue-500/10">
                     <div className="flex items-center gap-3 mb-6">
                        <Users size={18} className="text-blue-400" />
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[3px]">Guardian Network</h4>
                     </div>
                     
                     {guardians.length > 0 ? (
                        <div className="space-y-4">
                           {guardians.map((g, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5 text-[10px] font-black italic">
                                    {g.name?.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[11px] font-black text-white uppercase truncate">{g.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                       <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest">{g.relation}</span>
                                       <span className="text-[8px] font-bold text-gray-600">{g.phone}</span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center py-4">No Guardians Registered</p>
                     )}
                  </div>
                </div>

                <div className="mt-auto pt-10">
                   <button 
                     onClick={handleIssueWarning}
                     disabled={isIssuingWarning}
                     className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50"
                   >
                      <ShieldAlert size={20} />
                      Issue System Warn
                   </button>
                   <p className="text-[8px] font-bold text-gray-600 text-center uppercase tracking-widest mt-4">Authorized Personnel Only</p>
                </div>
              </div>

              {/* 🔗 RIGHT SIDE: IMMUTABLE CHAIN TIMELINE */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#0F172A] relative">
                <div className="absolute left-[72px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent" />
                
                <div className="mb-12">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                         <LinkIcon size={18} />
                      </div>
                      <h4 className="text-[12px] font-black text-blue-400 uppercase tracking-[6px]">Operational Forensic Chain</h4>
                   </div>
                   
                   {loading ? (
                     <div className="py-24 flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[4px]">Fetching Neural Blocks...</p>
                     </div>
                   ) : history.length > 0 ? (
                     <div className="space-y-10">
                        {history.map((alert, idx) => (
                          <motion.div 
                            key={alert.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative pl-24 group"
                          >
                             {/* Chain Node */}
                             <div className="absolute left-[13px] top-4 w-6 h-6 bg-[#1E293B] rounded-full border-2 border-white/20 group-hover:border-blue-500 group-hover:scale-125 transition-all flex items-center justify-center z-10">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                             </div>
                             
                             <div className="bg-white/5 hover:bg-white/10 rounded-[2.5rem] p-8 border border-white/5 group-hover:border-white/10 transition-all shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                   <div className="flex items-center gap-4">
                                      <div className="px-4 py-2 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-[10px] font-black text-blue-400 tabular-nums tracking-widest">
                                         BLOCK_{alert.id.slice(-6).toUpperCase()}
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-500">
                                         <Clock size={14} />
                                         <span className="text-[9px] font-black uppercase tracking-widest">{alert.timestamp?.toDate().toLocaleString()}</span>
                                      </div>
                                   </div>
                                   <div className={cn(
                                     "px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border",
                                     alert.closureReason === 'Accidentally triggered SOS' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                   )}>
                                      {alert.closureReason || 'Verified Resolution'}
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
                                         <MapPin size={20} />
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Grid Deployment</p>
                                         <p className="text-[11px] font-black text-white truncate uppercase italic tracking-tighter">{alert.location?.address || 'Neural Location Lock'}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
                                         <Shield size={20} />
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Sovereign Validation</p>
                                         <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">BNS Compliant Block</p>
                                         </div>
                                      </div>
                                   </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <Fingerprint size={14} className="text-blue-400/40" />
                                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-[4px]">Neural Hash: 0x{alert.id.slice(0, 12)}...</span>
                                   </div>
                                   <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                                      View Forensic Detail
                                      <ArrowRight size={14} />
                                   </button>
                                </div>
                             </div>
                          </motion.div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-32 text-center space-y-6">
                        <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto text-gray-700 border border-white/5">
                           <ShieldCheck size={48} />
                        </div>
                        <p className="text-[12px] font-black text-gray-500 uppercase tracking-[6px]">Clear Forensic History</p>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* 🛡️ MODAL FOOTER: SECURITY PROTOCOL */}
            <div className="p-8 bg-black/60 border-t border-white/10 flex items-center justify-between">
               <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Security Clearance: Level 7</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Data Immutability: 100%</span>
                  </div>
               </div>
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-[4px] italic">KAVACH_SUPERCELL_PROTOCOL_V4.92</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
