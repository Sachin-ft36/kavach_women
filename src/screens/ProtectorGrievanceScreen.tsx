import React, { useState, useEffect } from 'react';
import { Shield, Send, AlertTriangle, MessageSquare, History, CheckCircle2, Clock, Trash2, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useKavachStore } from '../state/useKavachStore';
import KavachAIChat from '../components/KavachAIChat';

export default function ProtectorGrievanceScreen() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [history, setHistory] = useState<any[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const user = auth.currentUser;

  const { role } = useKavachStore();

  // 🛡️ SECURE HISTORY SYNC
  useEffect(() => {
    if (!user || role !== 'protector') return;
    
    let unsubMain: () => void;
    let unsubBypass: () => void;

    // 🛡️ NEURAL STABILIZATION DELAY: Wait for SDK state to settle before engaging multiple listeners
    const engageTimer = setTimeout(() => {
      const qMain = query(
        collection(db, 'protector_grievances'),
        where('uid', '==', user.uid),
        limit(20)
      );

      const qBypass = query(
        collection(db, 'special_cell_reports'),
        where('uid', '==', user.uid),
        where('category', '==', 'GRIEVANCE_BYPASS'),
        limit(20)
      );

      unsubMain = onSnapshot(qMain, (snap) => {
        try {
          const mainData = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), channel: 'main' }));
          setHistory(prev => {
            const bypassData = prev.filter(item => (item as any).channel === 'bypass');
            return [...mainData, ...bypassData].sort((a: any, b: any) => {
              const tA = a.timestamp?.toMillis?.() || new Date(a.sentAt || 0).getTime() || 0;
              const tB = b.timestamp?.toMillis?.() || new Date(b.sentAt || 0).getTime() || 0;
              return tB - tA;
            });
          });
        } catch (e) {
          console.warn("Grievance Data Parse Error:", e);
        }
      }, (err) => {
        if (err.code !== 'permission-denied') console.warn("Grievance Main Error:", err);
      });

      unsubBypass = onSnapshot(qBypass, (snap) => {
        try {
          const bypassData = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), channel: 'bypass' }));
          setHistory(prev => {
            const mainData = prev.filter(item => (item as any).channel !== 'bypass');
            return [...mainData, ...bypassData].sort((a: any, b: any) => {
              const tA = a.timestamp?.toMillis?.() || new Date(a.sentAt || 0).getTime() || 0;
              const tB = b.timestamp?.toMillis?.() || new Date(b.sentAt || 0).getTime() || 0;
              return tB - tA;
            });
          });
        } catch (e) {
          console.warn("Grievance Bypass Parse Error:", e);
        }
      }, (err) => {
        if (err.code !== 'permission-denied') console.warn("Grievance Bypass Error:", err);
      });
    }, 800);

    return () => { 
      clearTimeout(engageTimer);
      try {
        if (unsubMain) unsubMain(); 
        if (unsubBypass) unsubBypass(); 
      } catch (e) {
        console.error("Cleanup interrupted in ProtectorGrievanceScreen:", e);
      }
    };
  }, [user, role]);

  const deleteReport = async (id: string, channel: string) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS RECORD?")) return;
    try {
      const collectionName = channel === 'main' ? 'protector_grievances' : 'special_cell_reports';
      await deleteDoc(doc(db, collectionName, id));
      toast.success("RECORD DELETED.");
    } catch (e) {
      toast.error("DELETION FAILED.");
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setIsSubmitting(true);
    
    const payload = {
      uid: user.uid,
      name: user.displayName || 'Protector',
      message: message,
      timestamp: serverTimestamp(),
      status: 'pending',
      type: 'incident_report',
      sentAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'protector_grievances'), payload);
      toast.success("TRANSMITTED TO SUPERCELL.");
      setMessage('');
      setActiveTab('HISTORY');
    } catch (error: any) {
      try {
        await addDoc(collection(db, 'special_cell_reports'), {
          ...payload,
          category: 'GRIEVANCE_BYPASS'
        });
        toast.success("ROUTED VIA SPECIAL CELL.");
        setMessage('');
        setActiveTab('HISTORY');
      } catch (err2) {
        toast.error("COMMUNICATION BLACKOUT.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative space-y-8 pt-8 pb-32 font-sans text-white">
      {/* HEADER */}
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-[22px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-sm">
            <Shield size={20} className="text-rose-400 sm:hidden" />
            <Shield size={28} className="text-rose-400 hidden sm:block" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              <span className="text-[10px] font-bold text-rose-400 tracking-[1px]">Verified Safety Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter italic leading-none text-white">Safety Report Center</h1>
            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold tracking-[0.5px] mt-1 sm:mt-1.5 italic">Secure Emergency Reporting</p>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-3 mb-10 bg-[#1E293B] p-1.5 rounded-[24px] border border-white/10 shadow-sm">
        <button
          onClick={() => setActiveTab('NEW')}
          className={cn(
            "flex-1 py-3 sm:py-4 rounded-xl sm:rounded-[18px] text-[11px] sm:text-[12px] font-bold tracking-tight transition-all flex items-center justify-center gap-2 sm:gap-3",
            activeTab === 'NEW' ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20 scale-[1.02]" : "text-slate-400 hover:text-white"
          )}
        >
          <MessageSquare size={14} className="sm:size-[16px]" /> New Report
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn(
            "flex-1 py-4 rounded-[18px] text-[11px] sm:text-[12px] font-bold tracking-tight transition-all flex items-center justify-center gap-3",
            activeTab === 'HISTORY' ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
          )}
        >
          <History size={16} /> Report History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'NEW' ? (
          <motion.div key="new" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 sm:space-y-8">
            <div className="bg-[#1E293B] border border-white/10 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 sm:p-10 text-white/[0.02] pointer-events-none"><Shield size={120} className="sm:size-[180px]" /></div>
              
              <div className="space-y-4 relative z-10">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-[0.5px] ml-1 flex items-center gap-2 sm:gap-3">
                  <AlertTriangle size={12} className="text-rose-400 sm:size-[14px]" />
                  Describe the incident and location details
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe the incident..."
                  className="w-full h-48 sm:h-56 bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 text-sm sm:text-base font-medium text-white focus:bg-white/10 transition-all outline-none resize-none shadow-inner placeholder:text-slate-500"
                />
                <p className="text-[10px] text-slate-500 font-medium ml-2">Include location, vehicle number, or important details if possible.</p>
              </div>

              <div className="p-4 sm:p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl sm:rounded-[28px] relative z-10">
                <p className="text-[9px] sm:text-[10px] text-rose-400 font-bold leading-relaxed tracking-[1px] text-center">
                  Your location and safety details will be securely attached to this report.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className="w-full py-5 sm:py-6 bg-rose-600 text-white rounded-2xl sm:rounded-[28px] text-[11px] sm:text-[13px] font-bold tracking-tight shadow-[0_15px_35px_rgba(225,29,72,0.2)] hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3 sm:gap-4 disabled:opacity-30 relative z-10"
              >
                {isSubmitting ? "Transmitting..." : <><Send size={16} className="sm:size-[18px]" /> Submit Report</>}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {history.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center bg-[#1E293B] border border-dashed border-white/20 rounded-[48px]">
                <History size={40} className="text-slate-600 mb-4" />
                <p className="text-sm font-bold tracking-[1px] text-slate-500">No historical records found</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-[#1E293B] border border-white/10 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 space-y-4 sm:space-y-5 relative group shadow-sm">
                  <button onClick={() => deleteReport(item.id, item.channel)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", item.status === 'pending' ? "bg-amber-400" : "bg-emerald-400")} />
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.status === 'pending' ? 'Under Review' : 'Resolved'}
                      </span>
                    </div>
                  </div>
                  <p className="text-base text-white font-medium italic pr-12">"{item.message}"</p>
                  {item.reply && (
                    <div className="mt-4 p-6 bg-blue-500/10 border border-blue-500/20 rounded-[24px]">
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[1px] mb-2 italic">Official Response:</p>
                      <p className="text-sm text-white font-bold italic">"{item.reply}"</p>
                    </div>
                  )}
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
