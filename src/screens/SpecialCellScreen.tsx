import React, { useState, useEffect, useCallback } from 'react';
import { Shield, MessageSquare, Phone, Info, Send, UserX, AlertCircle, Lock, CheckCircle2, History, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, auth } from '../firebase';
import { useKavachStore } from '../store/useKavachStore';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import KavachAIChat from '../components/KavachAIChat';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function SpecialCellScreen() {
  const { t } = useLanguage();
  const { setActiveTab } = useKavachStore();
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [history, setHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🛡️ KAVACH SECURE SYNC
  const fetchHistory = useCallback(async (uid: string) => {
    if (!uid) return;
    setIsSyncing(true);
    try {
      const q = query(
        collection(db, 'special_cell_reports'),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      const reports = snapshot.docs
        .map((doc): any => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : 
                       (data.sentAt ? new Date(data.sentAt) : new Date())
          };
        })
        .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
      setHistory(reports);
    } catch (e: any) {
      console.error("KAVACH SECURE SYNC ERROR:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleSubmitReport = async () => {
    if (!message || isSending) return;
    setIsSending(true);
    setErrorStatus(null);
    try {
      const user = auth.currentUser;
      const reportData = {
        text: message,
        uid: user?.uid || 'GUEST',
        realUid: user?.uid || 'GUEST',
        userName: isAnonymous ? 'Anonymous Citizen' : (user?.displayName || 'Verified Citizen'),
        isAnonymous,
        status: 'pending',
        priority: 'CRITICAL',
        source: 'V-Secure_Stable_Uplink',
        timestamp: serverTimestamp(),
        sentAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'special_cell_reports'), reportData);
      setSentAt(Date.now());
      setMessage('');
      toast.success("Intelligence Packet Dispatched");
      if (user) fetchHistory(user.uid);
    } catch (error: any) {
      setErrorStatus("Comm Blackout: Submission failed.");
      toast.error("Transmission Failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'special_cell_reports', reportId));
      toast.success("Record Purged");
      if (auth.currentUser) fetchHistory(auth.currentUser.uid);
    } catch (error) {
      toast.error("Failed to purge record");
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      fetchHistory(user.uid);
      const interval = setInterval(() => fetchHistory(user.uid), 30000);
      return () => clearInterval(interval);
    }
  }, [auth.currentUser, fetchHistory]);

  return (
    <div className="min-h-full p-4 sm:p-6 space-y-6 sm:space-y-8 pb-32 overflow-y-auto bg-bg">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-10 h-10 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center hover:bg-gray-50 transition-all text-[#1E293B] shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[#2563EB] mb-1">
                <div className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[2.5px] sm:tracking-[4px]">Secure Node: SPC-X</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Special Cell</h2>
            </div>
          </div>
          <div className="flex bg-white p-1 rounded-xl sm:rounded-2xl border border-[#E5E7EB] shadow-sm">
            <button 
              onClick={() => setActiveTab('NEW')}
              className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-bold transition-all", activeTab === 'NEW' ? "bg-[#2563EB] text-white" : "text-gray-500")}
            >
              NEW
            </button>
            <button 
              onClick={() => { setActiveTab('HISTORY'); if(auth.currentUser) fetchHistory(auth.currentUser.uid); }}
              className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-bold transition-all flex items-center gap-2", activeTab === 'HISTORY' ? "bg-gray-100 text-gray-900" : "text-gray-500")}
            >
              {isSyncing && <RefreshCw size={8} className="animate-spin" />}
              HISTORY ({history.length})
            </button>
          </div>
        </header>

       <AnimatePresence mode="wait">
         {sentAt ? (
           <motion.div 
             key="success"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white border border-[#E5E7EB] p-10 rounded-[40px] text-center space-y-6 shadow-xl relative overflow-hidden"
           >
             <div className="absolute top-0 right-0 p-4 text-[#2563EB]/5">
                <Shield size={100} />
             </div>
             <div className="w-20 h-20 bg-accent-green/10 rounded-3xl flex items-center justify-center text-accent-green mx-auto border border-accent-green/20">
               <CheckCircle2 size={40} />
             </div>
             <div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Transmission Secured</h3>
               <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                 Intelligence packet {sentAt.toString().slice(-6)} has been verified and persisted in the national safety grid.
               </p>
             </div>
             <button onClick={() => setSentAt(null)} className="px-8 py-3 bg-[#2563EB] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 hover:scale-105 transition-all">
                Send New Intelligence
             </button>
           </motion.div>
         ) : activeTab === 'NEW' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <button onClick={() => window.open('tel:1091', '_self')} className="bg-white border border-[#E5E7EB] p-3.5 sm:p-6 rounded-2xl sm:rounded-[32px] flex flex-col items-center gap-2 sm:gap-3 group active:scale-95 transition-all shadow-sm">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm border border-red-100">
                     <Phone size={18} className="sm:size-[20px]" />
                   </div>
                   <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">Call 1091</span>
                 </button>
                 <button onClick={() => setIsAIChatOpen(true)} className="bg-white border border-[#E5E7EB] p-3.5 sm:p-6 rounded-2xl sm:rounded-[32px] flex flex-col items-center gap-2 sm:gap-3 group active:scale-95 transition-all shadow-sm">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-[#2563EB] rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-all shadow-sm border border-blue-100">
                     <MessageSquare size={18} className="sm:size-[20px]" />
                   </div>
                   <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">AI Counselor</span>
                 </button>
              </div>

              <section className="bg-[#0A0A0B] border border-white/10 rounded-3xl sm:rounded-[40px] p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-5 sm:p-8 text-white/5 pointer-events-none"><Shield size={100} className="sm:size-[120px]" /></div>
                 
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#2563EB]/20 rounded-full flex items-center justify-center">
                        <AlertCircle size={12} className="text-[#2563EB] sm:size-[14px]" />
                      </div>
                      <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[1.5px] sm:tracking-[2px] text-white">Discreet Report</h3>
                    </div>
                    <button 
                     onClick={() => setIsAnonymous(!isAnonymous)}
                     className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border transition-all ${isAnonymous ? 'bg-accent-green/20 border-accent-green/30 text-accent-green shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-white/5 border-white/10 text-gray-500'}`}
                    >
                      <UserX size={12} className="sm:size-[14px]" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{isAnonymous ? 'MASKED' : 'UNMASKED'}</span>
                    </button>
                 </div>

                 <textarea 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   placeholder="Describe threat... (Blackmail, Stalking, etc.)"
                   className="w-full h-36 sm:h-44 bg-white/[0.08] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white text-sm font-medium placeholder:text-gray-500 outline-none focus:border-[#2563EB]/40 transition-all resize-none shadow-inner relative z-10"
                 />

                 {errorStatus && (
                   <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-600/10 border border-red-600/20 rounded-xl sm:rounded-2xl text-red-500 relative z-10">
                     <AlertCircle size={14} className="sm:size-[16px]" />
                     <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{errorStatus}</p>
                   </div>
                 )}

                 <button 
                   onClick={handleSubmitReport}
                   disabled={!message || isSending}
                   className={cn(
                     "w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-[2px] sm:tracking-[3px] text-[10px] sm:text-xs flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all shadow-xl relative z-10",
                     isSending ? "bg-gray-800 text-gray-500" : "bg-white text-black hover:bg-gray-100"
                   )}
                 >
                   {isSending ? 'ENCRYPTING...' : <><Send size={14} className="sm:size-[16px]" /> Secure Send</>}
                 </button>

                 <div className="flex items-start gap-4 p-5 bg-white/[0.03] rounded-2xl border border-white/5 relative z-10">
                   <Info size={16} className="text-gray-400 shrink-0" />
                   <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed tracking-widest italic">
                     SECURE NODE: Intelligence dispatched via encrypted tactical uplink.
                   </p>
                 </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               {history.length === 0 ? (
                 <div className="py-24 flex flex-col items-center justify-center text-center bg-white border border-dashed border-[#E5E7EB] rounded-[40px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><History size={32} className="text-gray-300" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Discreet Reports</p>
                    <button onClick={() => auth.currentUser && fetchHistory(auth.currentUser.uid)} className="mt-4 text-[10px] font-bold text-[#2563EB] uppercase tracking-widest flex items-center gap-2 bg-[#2563EB]/5 px-4 py-2 rounded-lg">
                       <RefreshCw size={12} /> Sync Ledger
                    </button>
                 </div>
               ) : (
                 history.map((item, idx) => (
                   <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-[32px] p-6 space-y-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                      <div className="absolute top-0 right-0 p-4 text-[#2563EB]/5"><Shield size={40} /></div>
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'pending' ? "bg-amber-500" : "bg-accent-green")} />
                           <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                             {item.status === 'pending' ? 'Under Review' : 'Processed'}
                           </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                            {item.timestamp?.toLocaleString()}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteReport(item.id);
                            }}
                            className="p-2 -mr-2 text-gray-300 hover:text-red-500 transition-all active:scale-75 cursor-pointer z-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-900 font-medium italic pr-10 leading-relaxed">"{item.text}"</p>
                      
                      {item.reply && (
                        <div className="p-4 bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-2xl">
                           <p className="text-[8px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">Official Response:</p>
                           <p className="text-xs text-gray-900 font-bold italic leading-relaxed">"{item.reply}"</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                         <span className="text-[8px] font-bold uppercase text-gray-300 tracking-widest">ID: {item.id.slice(-8).toUpperCase()}</span>
                         <span className={cn("text-[8px] font-bold uppercase tracking-widest ml-auto", item.isAnonymous ? "text-accent-green" : "text-[#2563EB]")}>{item.isAnonymous ? 'MASKED' : 'VERIFIED'}</span>
                      </div>
                   </div>
                 ))
               )}
            </motion.div>
          )}
       </AnimatePresence>
       
       <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}
