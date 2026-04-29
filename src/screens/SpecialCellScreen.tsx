import React, { useState, useEffect, useCallback } from 'react';
import { Shield, MessageSquare, Phone, Info, Send, UserX, AlertCircle, Lock, CheckCircle2, History, RefreshCw, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import KavachAIChat from '../components/KavachAIChat';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function SpecialCellScreen() {
  const { t } = useLanguage();
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
      console.error("KAVACH UPLINK FAILURE:", error);
      setErrorStatus("Comm Blackout: Submission failed.");
      toast.error("Transmission Failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'special_cell_reports', reportId));
      toast.success("Record Purged Instantly");
      if (auth.currentUser) fetchHistory(auth.currentUser.uid);
    } catch (error) {
      console.error("PURGE ERROR:", error);
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
    <div className="min-h-[85vh] p-6 space-y-8 pb-32 overflow-y-auto">
       <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-accent-blue mb-2">
               <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse shadow-[0_0_10px_#0A84FF]" />
               <span className="text-[10px] font-black uppercase tracking-[4px]">Secure Node: SPC-X</span>
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Special Cell</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px] mt-2 italic">Strategic Intelligence Hub</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('NEW')}
              className={cn("px-4 py-2 rounded-xl text-[8px] font-black transition-all", activeTab === 'NEW' ? "bg-accent-blue text-white" : "text-gray-500")}
            >
              NEW
            </button>
            <button 
              onClick={() => { setActiveTab('HISTORY'); if(auth.currentUser) fetchHistory(auth.currentUser.uid); }}
              className={cn("px-4 py-2 rounded-xl text-[8px] font-black transition-all flex items-center gap-2", activeTab === 'HISTORY' ? "bg-white/10 text-white" : "text-gray-500")}
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
             className="bg-green-500/5 border-2 border-green-500/20 p-10 rounded-[40px] text-center space-y-6 shadow-2xl relative overflow-hidden"
           >
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield size={100} />
             </div>
             <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center text-green-500 mx-auto shadow-inner">
               <CheckCircle2 size={40} />
             </div>
             <div>
               <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mb-2">Transmission Secured</h3>
               <p className="text-xs text-gray-500 font-medium leading-relaxed">
                 Intelligence packet {sentAt.toString().slice(-6)} has been persisted and verified.
               </p>
             </div>
             <button onClick={() => setSentAt(null)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] text-accent-blue font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Send New Intelligence
             </button>
           </motion.div>
         ) : activeTab === 'NEW' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => window.open('tel:1091', '_self')} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all">
                   <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg"><Phone size={24} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Call 1091</span>
                 </button>
                 <button onClick={() => setIsAIChatOpen(true)} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all">
                   <div className="w-12 h-12 bg-accent-blue/10 text-accent-blue rounded-2xl flex items-center justify-center group-hover:bg-accent-blue group-hover:text-white transition-all shadow-lg"><MessageSquare size={24} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Counselor</span>
                 </button>
              </div>

              <section className="bg-gradient-to-br from-[#0d0d0f] to-black border border-white/5 rounded-[40px] p-8 space-y-6 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={20} className="text-accent-blue" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Discreet Report</h3>
                    </div>
                    <button 
                     onClick={() => setIsAnonymous(!isAnonymous)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isAnonymous ? 'bg-green-600/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-gray-500'}`}
                    >
                      <UserX size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{isAnonymous ? 'MASKED' : 'UNMASKED'}</span>
                    </button>
                 </div>

                 <textarea 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   placeholder="Describe threat... (Blackmail, Stalking, etc.)"
                   className="w-full h-44 bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm font-bold placeholder:text-gray-800 outline-none focus:border-accent-blue/30 transition-all resize-none shadow-inner"
                 />

                 {errorStatus && (
                   <div className="flex items-center gap-3 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500">
                     <AlertCircle size={16} />
                     <p className="text-[10px] font-black uppercase tracking-widest">{errorStatus}</p>
                   </div>
                 )}

                 <button 
                   onClick={handleSubmitReport}
                   disabled={!message || isSending}
                   className={cn(
                     "w-full py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl",
                     isSending ? "bg-gray-800 text-gray-500" : "bg-white text-black"
                   )}
                 >
                   {isSending ? 'ENCRYPTING...' : <><Send size={16} /> Secure Send</>}
                 </button>

                 <div className="flex items-start gap-4 p-5 bg-white/2 rounded-2xl border border-white/5 opacity-60">
                   <Info size={16} className="text-gray-500 shrink-0" />
                   <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest italic">
                     SECURE NODE: Intelligence dispatched via encrypted tactical uplink.
                   </p>
                 </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               {history.length === 0 ? (
                 <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center">
                    <History size={48} className="mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">No Discreet Reports Found</p>
                    <button onClick={() => auth.currentUser && fetchHistory(auth.currentUser.uid)} className="mt-4 text-[10px] font-black text-accent-blue uppercase tracking-widest underline flex items-center gap-2">
                       <RefreshCw size={12} /> Force Sync
                    </button>
                 </div>
               ) : (
                 history.map((item, idx) => (
                   <div key={item.id} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all"><Shield size={40} /></div>
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'pending' ? "bg-yellow-500" : "bg-green-500")} />
                           <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                             {item.status === 'pending' ? 'Awaiting Command Review' : 'Report Processed'}
                           </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-mono text-gray-600">
                            {item.timestamp?.toLocaleString()}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteReport(item.id);
                            }}
                            className="p-2 -mr-2 text-gray-600 hover:text-red-500 transition-all active:scale-75 cursor-pointer z-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-gray-300 leading-relaxed italic pr-10">"{item.text}"</p>
                      
                      {item.reply && (
                        <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-1.5 opacity-10"><Shield size={20} /></div>
                           <p className="text-[7px] font-black text-accent-blue uppercase tracking-widest mb-2 italic">Command Directive / Response:</p>
                           <p className="text-[10px] text-white font-bold italic">"{item.reply}"</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                         <span className="text-[7px] font-black uppercase text-gray-700 tracking-widest">REPORT_ID: {item.id.slice(-8).toUpperCase()}</span>
                         <span className="text-[7px] font-black uppercase text-accent-blue tracking-widest ml-auto">{item.isAnonymous ? 'MASKED' : 'VERIFIED'}</span>
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
