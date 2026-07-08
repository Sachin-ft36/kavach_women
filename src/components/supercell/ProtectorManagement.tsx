import React, { useState, useEffect } from 'react';
import { 
  User, Shield, ShieldAlert, ShieldCheck, 
  Search, Target, Award, AlertTriangle, 
  Ban, CheckCircle2, History, MessageSquare,
  Activity, Star, Fingerprint, Phone, Briefcase
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { NodesControl } from './NodesControl';
import { useProtectorManagementData } from './hooks/useProtectorManagementData';
import { ProtectorKundaliGrid } from './components/ProtectorKundaliGrid';
import { ProtectorDeepIntel } from './components/ProtectorDeepIntel';
import { ProtectorServiceLegacy } from './components/ProtectorServiceLegacy';

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
  const { missionStats, missionHistory } = useProtectorManagementData(selectedProtId);

  // 📡 SYNC EXTERNAL SELECTION (e.g. from Dashboard)
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedProtId(externalSelectedId);
    }
  }, [externalSelectedId]);

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
                               <div className="w-2 h-2 bg-emerald-500 rounded-full " />
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
                   <ProtectorKundaliGrid missionStats={missionStats} selectedProt={selectedProt} />

                   {/* DEEP INTEL SECTIONS */}
                   <ProtectorDeepIntel selectedProt={selectedProt} />

                   {/* 🛡️ SERVICE LEGACY (HISTORY & CALL LOGS) */}
                   <ProtectorServiceLegacy missionHistory={missionHistory} selectedProt={selectedProt} onViewReplay={onViewReplay} />
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
