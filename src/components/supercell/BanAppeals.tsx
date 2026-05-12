import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gavel, CheckCircle2, XCircle, Clock, 
  User, ShieldAlert, History, MessageSquare,
  Search, Filter, ShieldCheck, Mail, ArrowUpRight
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function BanAppeals() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');

  useEffect(() => {
    const q = query(
      collection(db, 'appeals'),
      where('status', '==', activeTab === 'PENDING' ? 'pending' : 'resolved')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setAppeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const handleAction = async (appealId: string, userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      if (action === 'APPROVE') {
        // 1. Restore User Access
        await updateDoc(doc(db, 'users', userId), {
          isSOSBlocked: false,
          isPermanentlyBlocked: false,
          sosBlockedReason: null,
          hasPendingWarning: false,
          sosStrikeCount: 0
        });
        
        // 2. Mark Appeal as Resolved
        await updateDoc(doc(db, 'appeals', appealId), {
          status: 'resolved',
          adjudication: 'APPROVED',
          resolvedAt: serverTimestamp()
        });
        
        toast.success("COMMAND CENTER: Access Restored. Blockchain Updated.");
      } else {
        // 1. Enforce Permanent Ban on User
        await updateDoc(doc(db, 'users', userId), {
          isSOSBlocked: true,
          isPermanentlyBlocked: true,
          sosBlockedReason: "Permanent Grid Exclusion by SuperCell Command"
        });

        // 2. Mark Appeal as Rejected
        await updateDoc(doc(db, 'appeals', appealId), {
          status: 'resolved',
          adjudication: 'REJECTED',
          resolvedAt: serverTimestamp()
        });
        toast.error("COMMAND CENTER: Permanent Ban Enforced. Identity Blacklisted.");
      }
    } catch (e) {
      toast.error("Forensic Link Failed.");
    }
  };

  const filteredAppeals = appeals.filter(a => 
    a.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl font-['Outfit']">
      {/* 🏛️ HEADER */}
      <div className="p-8 border-b border-gray-50 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-600/20">
              <Gavel size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none italic">Sovereign Adjudication</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">National Grid / Appeal Review / V1.2</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search UID/Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all w-64"
              />
           </div>
           <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
              <button onClick={() => setActiveTab('PENDING')} className={cn("px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeTab === 'PENDING' ? "bg-white text-gray-900 shadow-lg border border-gray-100" : "text-gray-400 hover:bg-gray-100")}>Pending</button>
              <button onClick={() => setActiveTab('RESOLVED')} className={cn("px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeTab === 'RESOLVED' ? "bg-white text-gray-900 shadow-lg border border-gray-100" : "text-gray-400 hover:bg-gray-100")}>Archives</button>
           </div>
        </div>
      </div>

      {/* 📊 CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         {loading ? (
           <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[5px]">Linking Archives...</p>
           </div>
         ) : filteredAppeals.length > 0 ? (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
              {filteredAppeals.map((appeal) => (
                <motion.div 
                  key={appeal.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group"
                >
                   <div className="absolute top-0 left-0 w-2 h-full bg-rose-600 opacity-20" />
                   
                   <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-black text-xl shadow-lg uppercase italic">
                            {appeal.userName?.charAt(0)}
                         </div>
                         <div>
                            <h3 className="text-lg font-black text-gray-900 uppercase italic leading-none">{appeal.userName}</h3>
                            <div className="flex items-center gap-2 mt-2">
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {appeal.userId.slice(0, 12)}...</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded-full border border-rose-100 uppercase tracking-widest">
                            Suspended: {appeal.originalBanReason || 'Grid Misuse'}
                         </div>
                         <div className="flex items-center gap-2 text-gray-400">
                            <Clock size={12} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{appeal.timestamp?.toDate().toLocaleString()}</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 mb-8 relative">
                      <div className="absolute -top-3 left-6 px-4 py-1 bg-white border border-gray-100 rounded-full flex items-center gap-2">
                         <MessageSquare size={10} className="text-rose-600" />
                         <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Claim Justification</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-800 leading-relaxed uppercase italic">
                         "{appeal.reason}"
                      </p>
                   </div>

                   {activeTab === 'PENDING' ? (
                     <div className="flex gap-4">
                        <button 
                          onClick={() => handleAction(appeal.id, appeal.userId, 'REJECT')}
                          className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                        >
                           <XCircle size={16} /> Uphold Block
                        </button>
                        <button 
                          onClick={() => handleAction(appeal.id, appeal.userId, 'APPROVE')}
                          className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                           <ShieldCheck size={16} /> Restore Grid Access
                        </button>
                     </div>
                   ) : (
                     <div className={cn(
                       "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border",
                       appeal.adjudication === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                     )}>
                        {appeal.adjudication === 'APPROVED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        Verdict: {appeal.adjudication}
                     </div>
                   )}
                </motion.div>
              ))}
              </AnimatePresence>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
              <ShieldCheck size={80} strokeWidth={1} />
              <p className="text-[14px] font-black uppercase tracking-[10px]">Registry Clear</p>
           </div>
         )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 10px; }
      `}</style>
    </div>
  );
}
