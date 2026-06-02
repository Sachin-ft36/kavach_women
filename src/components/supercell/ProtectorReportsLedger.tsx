import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock, ShieldAlert,
  Search, MessageSquare, ShieldCheck, Send
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function ProtectorReportsLedger() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const q = query(collection(db, 'protector_grievances'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReply = async (reportId: string) => {
    const text = replyText[reportId];
    if (!text || !text.trim()) return;

    try {
      await updateDoc(doc(db, 'protector_grievances', reportId), {
        status: 'resolved',
        reply: text,
        resolvedAt: serverTimestamp()
      });
      toast.success('Official Response Transmitted to Protector');
      setReplyText(prev => ({ ...prev, [reportId]: '' }));
    } catch (error) {
      toast.error('Transmission Failed');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesTab = activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'resolved';
    const matchesSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.uid || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0F172A] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl font-['Outfit'] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

      {/* 🏛️ HEADER */}
      <div className="p-8 border-b border-white/5 bg-black/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-xl shadow-amber-500/10">
              <ClipboardList size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none italic">Field Reports</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Protector Incident Ledger</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search Name or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white focus:border-amber-500/50 outline-none transition-all w-64 placeholder-gray-600"
              />
           </div>
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('PENDING')} 
                className={cn("px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeTab === 'PENDING' ? "bg-amber-500 text-white shadow-lg" : "text-gray-400 hover:text-white")}
              >
                Action Required
              </button>
              <button 
                onClick={() => setActiveTab('RESOLVED')} 
                className={cn("px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeTab === 'RESOLVED' ? "bg-emerald-600 text-white shadow-lg" : "text-gray-400 hover:text-white")}
              >
                Resolved
              </button>
           </div>
        </div>
      </div>

      {/* 📊 CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
         {loading ? (
           <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
              <div className="w-12 h-12 border-4 border-gray-600 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[5px] text-white">Syncing Intelligence...</p>
           </div>
         ) : filteredReports.length > 0 ? (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
              {filteredReports.map((report) => (
                <motion.div 
                  key={report.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black/20 border border-white/5 rounded-[2.5rem] p-8 shadow-xl hover:border-white/10 transition-all relative overflow-hidden group"
                >
                   <div className={cn("absolute top-0 left-0 w-2 h-full opacity-50", report.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500')} />
                   
                   <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white font-black text-xl border border-white/10 uppercase italic">
                            {report.name?.charAt(0) || 'P'}
                         </div>
                         <div>
                            <h3 className="text-lg font-black text-white uppercase italic leading-none">{report.name || 'Protector Node'}</h3>
                            <div className="flex items-center gap-2 mt-2">
                               <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ID: {report.uid?.slice(0, 12)}...</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className={cn("px-4 py-1.5 text-[8px] font-black rounded-full border uppercase tracking-widest", report.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')}>
                            {report.status === 'pending' ? 'Under Review' : 'Resolved'}
                         </div>
                         <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={12} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : 'Recent'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 mb-8 relative">
                      <div className="absolute -top-3 left-6 px-4 py-1 bg-[#0F172A] border border-white/10 rounded-full flex items-center gap-2">
                         <ShieldAlert size={10} className="text-amber-500" />
                         <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Field Report Data</span>
                      </div>
                      <p className="text-[12px] font-bold text-gray-300 leading-relaxed uppercase italic whitespace-pre-wrap">
                         "{report.message}"
                      </p>
                   </div>

                   {report.status === 'pending' ? (
                     <div className="flex flex-col gap-4">
                        <textarea 
                          value={replyText[report.id] || ''}
                          onChange={(e) => setReplyText({...replyText, [report.id]: e.target.value})}
                          placeholder="Type official response here..."
                          className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white focus:border-amber-500/50 outline-none resize-none"
                        />
                        <button 
                          onClick={() => handleReply(report.id)}
                          className="w-full py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                          disabled={!replyText[report.id]?.trim()}
                        >
                           <Send size={16} /> Transmit Official Response
                        </button>
                     </div>
                   ) : (
                     <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6 relative">
                         <div className="absolute -top-3 left-6 px-4 py-1 bg-[#0F172A] border border-blue-500/20 rounded-full flex items-center gap-2">
                           <ShieldCheck size={10} className="text-blue-400" />
                           <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Official Response</span>
                         </div>
                         <p className="text-[11px] font-bold text-blue-100 leading-relaxed uppercase italic">
                           "{report.reply || 'Acknowledged and Resolved by Command.'}"
                         </p>
                     </div>
                   )}
                </motion.div>
              ))}
              </AnimatePresence>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
              <ClipboardList size={80} strokeWidth={1} className="text-white" />
              <p className="text-[14px] font-black uppercase tracking-[10px] text-white">No Reports Active</p>
           </div>
         )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
