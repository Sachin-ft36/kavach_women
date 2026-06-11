import React, { useState, useEffect } from 'react';
import { 
  User, Shield, ShieldAlert, ShieldCheck, 
  Search, Target, Award, AlertTriangle, 
  Ban, CheckCircle2, History, MessageSquare,
  Activity, Star, Fingerprint, Phone, Briefcase
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { NodesControl } from './NodesControl';

interface ProtectorManagementProps {
  onViewReplay?: (missionId: string) => void;
  externalSelectedId?: string | null;
  verifiedProtectors?: any[];
  pendingProtectors?: any[];
  userStatusMap?: Record<string, any>;
  onSelectPendingProtector?: (id: string) => void;
}

export function ProtectorManagement({ 
  onViewReplay, 
  externalSelectedId, 
  verifiedProtectors = [], 
  pendingProtectors = [],
  userStatusMap = {},
  onSelectPendingProtector
}: ProtectorManagementProps) {
  const [selectedProtId, setSelectedProtId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [missionStats, setMissionStats] = useState<Record<string, any>>({});

  useEffect(() => {
    // 📡 FETCH MISSION SUCCESS DATA (Aggregated from alerts)
    const qMissions = query(collection(db, 'alerts'), where('status', '==', 'resolved'));
    const unsubMissions = onSnapshot(qMissions, (snap) => {
       const stats: Record<string, any> = {};
       snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.activeResponders && Array.isArray(data.activeResponders)) {
            data.activeResponders.forEach((res: any) => {
              const respId = res.uid;
              if (respId) {
                if (!stats[respId]) stats[respId] = { total: 0, successful: 0 };
                stats[respId].total += 1;
                stats[respId].successful += 1;
              }
            });
          }
       });
       setMissionStats(stats);
    });

    return () => unsubMissions();
  }, []);

  // 📡 SYNC EXTERNAL SELECTION (e.g. from Dashboard)
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedProtId(externalSelectedId);
    }
  }, [externalSelectedId]);

   // 🗄️ FETCH PROTECTOR SERVICE LEGACY (Resolved Missions)
   const [missionHistory, setMissionHistory] = useState<any[]>([]);
   useEffect(() => {
      if (!selectedProtId) {
        setMissionHistory([]);
        return;
      }
      // Query alerts where this protector was a responder
      const q = query(collection(db, 'alerts'), where('status', '==', 'resolved'), orderBy('timestamp', 'desc'));
      const unsubHistory = onSnapshot(q, (snap) => {
         const missions = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((a: any) => a.activeResponders?.some((r: any) => r.uid === selectedProtId));
         setMissionHistory(missions);
      });
      return () => unsubHistory();
   }, [selectedProtId]);

   const allProtectors = [...verifiedProtectors, ...pendingProtectors];
   const selectedProt = allProtectors.find(p => p.id === selectedProtId);
   const filteredProtectors = allProtectors.filter(p => 
     p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.phoneNumber?.includes(searchTerm)
   );

   const handleAction = async (type: 'warn' | 'ban' | 'restore') => {
     if (!selectedProtId) return;
     const protRef = doc(db, 'users', selectedProtId);
     
     try {
       if (type === 'warn') {
         const msg = window.prompt("Issue Warning Citation:");
         if (!msg) return;
         await updateDoc(protRef, {
            hasPendingWarning: true,
            warningMessage: msg,
            sosStrikeCount: (selectedProt?.sosStrikeCount || 0) + 1
         });
         toast.warning("Disciplinary Citation Issued");
       } else if (type === 'ban') {
         if (!window.confirm("CRITICAL: Ban this operative from the National Grid?")) return;
         await updateDoc(protRef, {
            isVerified: false,
            isSOSBlocked: true,
            sosBlockedReason: "Administrative Ban",
            verified: false
         });
         toast.error("Node Credentials Revoked");
       } else if (type === 'restore') {
         await updateDoc(protRef, {
            isVerified: true,
            isSOSBlocked: false,
            sosStrikeCount: 0,
            verified: true
         });
         toast.success("Node Credentials Restored");
       }
     } catch (e) {
       toast.error("Sync Error");
     }
   };

   return (
     <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
       {/* 📋 OPERATIVE DIRECTORY (LEFT) - Consolidated with NodesControl */}
       <aside className="w-[430px] shrink-0 z-20 shadow-2xl h-full">
          <NodesControl 
            pendingProtectors={pendingProtectors}
            verifiedProtectors={verifiedProtectors}
            viewMode="PROTECTORS"
            onSelectPendingProtector={onSelectPendingProtector}
            onSelectVerifiedProtector={(id) => setSelectedProtId(id)}
            selectedId={selectedProtId}
          />
       </aside>

       {/* 🔮 THE KUNDALI (CENTER/RIGHT) */}
       <main className="flex-1 relative overflow-y-auto p-12 bg-[#0F172A] custom-scrollbar">
          <AnimatePresence mode="wait">
             {selectedProt ? (
                <motion.div 
                  key={selectedProt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto"
                >
                   {/* HEADER PACKET */}
                   <div className="flex items-start justify-between mb-12">
                      <div className="flex items-center gap-8">
                         <div className="w-32 h-32 bg-blue-600/10 border-2 border-blue-500/30 rounded-[48px] flex items-center justify-center text-blue-500 shadow-2xl shadow-blue-600/20 relative">
                            <User size={64} strokeWidth={1.5} />
                            {selectedProt.verified && <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-2xl text-white shadow-xl"><ShieldCheck size={24} /></div>}
                         </div>
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <span className="text-[14px] font-black text-blue-400 uppercase tracking-[4px]">Verified Grid Node</span>
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">{selectedProt.name}</h1>
                            <div className="flex items-center gap-4 mt-6">
                               <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Phone size={14} className="text-gray-400" /><span className="text-xs font-bold text-white tabular-nums">{selectedProt.phoneNumber}</span></div>
                               {/* <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Fingerprint size={14} className="text-gray-400" /><span className="text-xs font-bold text-white uppercase tracking-widest">{selectedProt.aadhar || 'NOT LINKED'}</span></div> */}
                               <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                  <span className="text-[14px] font-black text-gray-500 uppercase tracking-widest">Gender</span>
                                  <span className="text-xs font-bold text-white uppercase">{selectedProt.gender || 'N/A'}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col gap-3">
                         <button onClick={() => handleAction('warn')} className="flex items-center justify-center gap-3 px-8 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl text-[14px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all"><AlertTriangle size={16} /> Issue Citation</button>
                         {selectedProt.verified ? (
                            <button onClick={() => handleAction('ban')} className="flex items-center justify-center gap-3 px-8 py-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl text-[14px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"><Ban size={16} /> Revoke Node</button>
                         ) : (
                            <button onClick={() => handleAction('restore')} className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[14px] font-black uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"><ShieldCheck size={16} /> Activate Node</button>
                         )}
                      </div>
                   </div>

                   {/* KUNDALI GRID STATS */}
                   <div className="grid grid-cols-3 gap-6 mb-12">
                      <div className="bg-[#1E293B] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                         <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all"><Target size={120} /></div>
                         <p className="text-[14px] font-black text-gray-500 uppercase tracking-widest mb-4">Rescue Success</p>
                         <h3 className="text-4xl font-black text-white italic tabular-nums leading-none mb-2">{missionStats[selectedProt.id]?.successful || 0}</h3>
                         <p className="text-[13px] font-black text-emerald-400 uppercase tracking-widest">100% Efficiency</p>
                      </div>
                      <div className="bg-[#1E293B] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                         <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all"><History size={120} /></div>
                         <p className="text-[14px] font-black text-gray-500 uppercase tracking-widest mb-4">Total Missions</p>
                         <h3 className="text-4xl font-black text-white italic tabular-nums leading-none mb-2">{missionStats[selectedProt.id]?.total || 0}</h3>
                         <p className="text-[13px] font-black text-blue-400 uppercase tracking-widest">Active Responder</p>
                      </div>
                      <div className="bg-[#1E293B] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                         <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all"><AlertTriangle size={120} /></div>
                         <p className="text-[14px] font-black text-gray-500 uppercase tracking-widest mb-4">Grid Strikes</p>
                         <h3 className="text-4xl font-black text-rose-500 italic tabular-nums leading-none mb-2">{selectedProt.sosStrikeCount || 0}</h3>
                         <p className="text-[13px] font-black text-rose-400 uppercase tracking-widest">Disciplinary Log</p>
                      </div>
                   </div>

                   {/* DEEP INTEL SECTIONS */}
                   <div className="grid grid-cols-2 gap-8 mb-12">
                      <div className="space-y-6">
                         <h3 className="text-xs font-black text-gray-500 uppercase tracking-[4px] ml-1">Professional Identity</h3>
                         <div className="bg-[#1E293B]/50 rounded-[32px] border border-white/5 p-8 space-y-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><Briefcase size={20} /></div>
                               <div><p className="text-[12px] font-black text-gray-500 uppercase mb-1">Occupation</p><p className="text-sm font-black text-white uppercase">{selectedProt.protectorVetting?.occupation || 'None'}</p></div>
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                               <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400"><MessageSquare size={20} /></div>
                               <div><p className="text-[12px] font-black text-gray-500 uppercase mb-1">Grid Motivation</p><p className="text-xs font-bold text-gray-300 italic leading-relaxed">"{selectedProt.protectorVetting?.reason || 'No statement provided.'}"</p></div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h3 className="text-xs font-black text-gray-500 uppercase tracking-[4px] ml-1">Grid Location Base</h3>
                         <div className="bg-[#1E293B]/50 rounded-[32px] border border-white/5 p-8 relative overflow-hidden">
                            <div className="flex items-start gap-4 mb-4">
                               <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><Activity size={20} /></div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-black text-gray-500 uppercase mb-1">Operational Address</p>
                                  <p className="text-xs font-bold text-white leading-relaxed">{selectedProt.protectorVetting?.address || 'Location Unknown'}</p>
                               </div>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[13px] font-black text-gray-500 uppercase">Sector Status</span>
                                <span className="text-[13px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Optimal Node</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* 🛡️ SERVICE LEGACY (HISTORY & CALL LOGS) */}
                   <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-[4px] ml-1">Service Legacy & Mission Intelligence</h3>
                      <div className="bg-[#1E293B]/50 rounded-[40px] border border-white/5 p-8">
                         {missionHistory.length === 0 ? (
                           <div className="py-20 text-center opacity-20">
                              <History size={48} className="mx-auto mb-4" />
                              <p className="text-[14px] font-black uppercase tracking-widest">No Rescue History Recorded</p>
                           </div>
                         ) : (
                           <div className="space-y-4">
                              {missionHistory.map((mission) => {
                                 const callLog = mission.callLogs?.[0];
                                 return (
                                   <div key={mission.id} className="p-6 bg-[#0F172A] rounded-3xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                      <div className="flex items-center gap-6">
                                         <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={24} />
                                         </div>
                                         <div>
                                            <h4 className="text-sm font-black text-white uppercase italic">{mission.victimName || 'Citizen Rescue'}</h4>
                                            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                               {mission.timestamp ? new Date(mission.timestamp.toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'PAST MISSION'}
                                            </p>
                                         </div>
                                      </div>

                                      <div className="flex items-center gap-12">
                                         {/* ⭐ RATING INTEL */}
                                         <div className="text-right max-w-[180px]">
                                            <div className="flex items-center gap-2 justify-end mb-1">
                                               <Star size={12} className={mission.ratingsProvided?.[selectedProt.id] ? "text-amber-400" : "text-gray-600"} />
                                               <span className="text-[14px] font-black text-white italic">
                                                 {mission.ratingsProvided?.[selectedProt.id] ? `${mission.ratingsProvided[selectedProt.id]}/5` : 'Unrated'}
                                               </span>
                                            </div>
                                            {mission.feedbacksProvided?.[selectedProt.id] ? (
                                              <p className="text-[10px] font-bold text-gray-400 truncate" title={mission.feedbacksProvided[selectedProt.id]}>
                                                "{mission.feedbacksProvided[selectedProt.id]}"
                                              </p>
                                            ) : (
                                              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Citizen Feedback</p>
                                            )}
                                         </div>

                                         {/* 📞 CALL LOG INTEL */}
                                         <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end mb-1">
                                               <Phone size={12} className="text-blue-400" />
                                               <span className="text-[14px] font-black text-white italic">{callLog ? `${Math.floor(callLog.durationSeconds / 60)}m ${callLog.durationSeconds % 60}s` : '0s'}</span>
                                            </div>
                                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Forensic Voice Link</p>
                                         </div>

                                         {/* 🏹 3D TRACK LINK */}
                                         <button 
                                           onClick={() => onViewReplay?.(mission.id)}
                                           className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 group-hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                         >
                                            <Fingerprint size={14} /> 3D Replay
                                         </button>
                                      </div>
                                   </div>
                                 );
                              })}
                           </div>
                         )}
                      </div>
                   </div>
                </motion.div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                   <Shield size={120} strokeWidth={0.5} className="mb-8" />
                   <p className="text-xl font-black uppercase tracking-[10px]">Select Operative for Kundali Access</p>
                   <p className="text-[14px] font-bold uppercase tracking-widest mt-4">Kavach National Command Registry</p>
                </div>
             )}
          </AnimatePresence>
       </main>
     </div>
   );
}
