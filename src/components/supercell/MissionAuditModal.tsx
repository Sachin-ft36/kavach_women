import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, X, ShieldAlert, CheckCircle2, 
  Clock, MapPin, AlertTriangle, MessageSquare,
  ShieldCheck, ArrowRight, UserMinus
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
      const q = query(
        collection(db, 'alerts'),
        where('victimUid', '==', user.id),
        where('status', '==', 'resolved'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Audit Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueWarning = async () => {
    if (!user?.id) return;
    setIsIssuingWarning(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        safetyWarningActive: true,
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
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.25)] border border-white/20 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* 🏛️ MODAL HEADER */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Mission Audit File</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registry Ref: {user.id?.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* 📊 LEFT SIDE: CITIZEN INTEL */}
              <div className="w-80 border-r border-gray-100 bg-gray-50/30 p-8 flex flex-col gap-8">
                <div className="text-center">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="w-24 h-24 rounded-[32px] mx-auto object-cover border-4 border-white shadow-xl mb-4" />
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">{user.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{user.city || 'Sector Unknown'}</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Integrity Score</span>
                       <span className={cn("text-xs font-black", integrityScore > 70 ? "text-emerald-500" : "text-red-500")}>{integrityScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div 
                         className={cn("h-full transition-all duration-1000", integrityScore > 70 ? "bg-emerald-500" : "bg-red-500")}
                         style={{ width: `${integrityScore}%` }} 
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[14px] font-black text-gray-900 leading-none">{history.length}</p>
                        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total SOS</p>
                     </div>
                     <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[14px] font-black text-red-500 leading-none">{falseAlertCount}</p>
                        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">False Triggers</p>
                     </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                   <button 
                     onClick={handleIssueWarning}
                     disabled={isIssuingWarning}
                     className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                   >
                      <ShieldAlert size={14} />
                      Issue System Warning
                   </button>
                </div>
              </div>

              {/* 📜 RIGHT SIDE: MISSION TIMELINE */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                <div className="mb-8">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6">Historical Mission Logs</h4>
                   
                   {loading ? (
                     <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Retrieving Forensic Data...</p>
                     </div>
                   ) : history.length > 0 ? (
                     <div className="space-y-6">
                        {history.map((alert, idx) => (
                          <div key={alert.id} className="group relative pl-8 border-l border-gray-100 pb-2">
                             <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-gray-200 rounded-full border-2 border-white group-hover:bg-blue-500 transition-colors" />
                             
                             <div className="bg-gray-50/50 hover:bg-gray-50 rounded-[24px] p-5 border border-gray-100 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-3">
                                      <div className="px-3 py-1 bg-white rounded-lg border border-gray-100 text-[8px] font-black text-gray-500">
                                         MISSION ID: {alert.id.slice(-8).toUpperCase()}
                                      </div>
                                      <span className="text-[8px] font-bold text-gray-400">{alert.timestamp?.toDate().toLocaleString()}</span>
                                   </div>
                                   <div className={cn(
                                     "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                     alert.closureReason === 'Accidentally triggered SOS' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                   )}>
                                      {alert.closureReason || 'Mission Resolved'}
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                                         <MapPin size={14} />
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-[7px] font-black text-gray-400 uppercase">Incident Location</p>
                                         <p className="text-[9px] font-bold text-gray-700 truncate">{alert.location?.address || 'GPS Coordinates Provided'}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                                         <MessageSquare size={14} />
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-[7px] font-black text-gray-400 uppercase">Verification Reason</p>
                                         <p className="text-[9px] font-bold text-gray-700 truncate">{alert.closureReason || 'Standard Clearance'}</p>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                           <ShieldCheck size={32} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Historical Alerts Found</p>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* 🛡️ MODAL FOOTER */}
            <div className="p-6 bg-gray-900 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                     <span className="text-[8px] font-black text-white/60 uppercase tracking-[2px]">Forensic Registry v4.1</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                     <span className="text-[8px] font-black text-white/60 uppercase tracking-[2px]">BNS Compliant Data Store</span>
                  </div>
               </div>
               <p className="text-[7px] font-bold text-gray-500 uppercase tracking-[2px]">SuperCell Command Authorized Access Only</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
