import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Globe, Shield, 
  AlertTriangle, CheckCircle2, 
  Map as MapIcon, Zap,
  Radar, Fingerprint, Database, 
  MapPin, Clock, UserPlus, Check, X,
  ShieldCheck, ArrowRight, Crosshair, Users,
  Target, Send, ShieldAlert, Phone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import CommandMap from '../maps/CommandMap';

interface NationalOverviewProps {
  activeAlerts: any[];
  verifiedProtectors: any[];
  pendingProtectors: any[];
  zeroFirs: any[];
  selectedState: string;
  isSovereignActive?: boolean;
  onNavigate?: (tab: string, id?: string) => void;
  onApproveProtector?: (id: string) => void;
  onDispatchSpecial?: (alertId: string, protectorIds: string[]) => void;
}

export function NationalOverview({ 
  activeAlerts, 
  verifiedProtectors, 
  pendingProtectors, 
  zeroFirs,
  selectedState,
  isSovereignActive,
  onNavigate,
  onApproveProtector,
  onDispatchSpecial
}: NationalOverviewProps) {
  
  const [protectorTab, setProtectorTab] = useState<'PENDING' | 'ACTIVE'>('PENDING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);

  // 🛰️ TACTICAL PROXIMITY CALCULATOR
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const protectorsInRange = useMemo(() => {
    if (!selectedAlertId) return [];
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return [];

    const aLat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
    const aLng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
    if (!aLat || !aLng) return [];

    return verifiedProtectors.filter(p => {
      const pLat = p.latitude || p.lat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
      const pLng = p.longitude || p.lng || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      if (!pLat || !pLng) return false;
      return calculateDistance(aLat, aLng, pLat, pLng) <= 2; // 2km Radius
    });
  }, [selectedAlertId, activeAlerts, verifiedProtectors]);

  return (
    <div className="h-full flex flex-col bg-[#020617] overflow-hidden">
      
      {/* 🇮🇳 TOP TACTICAL STRIP */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                   <Shield size={16} className="text-white" />
                </div>
                <div>
                   <h1 className="text-sm font-black text-white uppercase italic leading-none tracking-tighter">KAVACH NATIONAL HUB</h1>
                   <p className="text-[7px] text-gray-500 font-bold uppercase tracking-[1.5px] mt-1">Operational Readiness: 100%</p>
                </div>
             </div>
            
            <div className="h-8 w-px bg-white/5 mx-2" />
            
            <div className="flex gap-6">
               <div className="flex flex-col">
                  <span className="text-[6px] text-gray-500 font-black uppercase tracking-widest mb-1">Live SOS</span>
                  <span className="text-rose-500 font-black italic text-xs tabular-nums leading-none">{activeAlerts.length}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[6px] text-gray-500 font-black uppercase tracking-widest mb-1">Protectors</span>
                  <span className="text-cyan-400 font-black italic text-xs tabular-nums leading-none">{verifiedProtectors.length}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[6px] text-gray-500 font-black uppercase tracking-widest mb-1">Vetting Queue</span>
                  <span className="text-amber-500 font-black italic text-xs tabular-nums leading-none">{pendingProtectors.length}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            {selectedAlertId && (
                <motion.button 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   onClick={() => onDispatchSpecial?.(selectedAlertId, protectorsInRange.map(p => p.id))}
                   className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xl shadow-rose-600/20 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                   <ShieldAlert size={14} /> 
                   Dispatch Special Force ({protectorsInRange.length})
                </motion.button>
            )}
            {selectedAlertId && (
               <button 
                  onClick={() => setSelectedAlertId(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
               >
                  <Target size={12} /> Clear Lock
               </button>
            )}
            <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
               <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Grid Sync: 14ms</span>
            </div>
         </div>
      </div>

      {/* 🏗️ MAIN WAR ROOM GRID */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden p-4 gap-4">
         
         {/* 🔴 LEFT COLUMN: ACTIVE DISTRESS FEED (25%) */}
         <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-2">
                  <Radar size={16} className="text-rose-500" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[3px]">Active Distress</h3>
               </div>
               <span className="text-[8px] font-black text-rose-500/50 uppercase italic tracking-widest">Priority: Omega</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
               {activeAlerts.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/2 opacity-20">
                     <p className="text-[8px] font-black uppercase tracking-widest">No Active SOS</p>
                  </div>
               ) : (
                  activeAlerts.map((alert, idx) => (
                     <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                           "bg-[#1E293B]/40 border rounded-[1.25rem] p-3 group transition-all cursor-pointer relative overflow-hidden",
                           selectedAlertId === alert.id ? "border-rose-500 shadow-xl shadow-rose-500/10 bg-[#1E293B]/80" : "border-rose-500/10 hover:bg-[#1E293B]/60"
                        )}
                        onClick={() => setSelectedAlertId(alert.id)}
                     >
                        {selectedAlertId === alert.id && (
                           <div className="absolute top-0 right-0 p-2 opacity-20"><Target size={30} className="text-rose-500" /></div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                           <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border transition-all", selectedAlertId === alert.id ? "bg-rose-500 text-white border-rose-500" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
                              <AlertTriangle size={14} className="" />
                           </div>
                           <span className="text-[7px] text-gray-500 font-black">
                              {alert.timestamp ? new Date(alert.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'LIVE'}
                           </span>
                        </div>
                        
                        <div className="space-y-0.5 mb-2">
                           <h4 className="text-[10px] font-black text-white uppercase tracking-tight truncate leading-tight">
                              {alert.victimName || alert.userName || alert.name || 'Sovereign Node'}
                           </h4>
                           <div className="flex items-center gap-2">
                              <Phone size={7} className="text-gray-500" />
                              <span className="text-[7px] text-gray-500 font-bold tracking-widest">{alert.phone || alert.victimPhone || 'Force ID: 102'}</span>
                           </div>
                           <div className="flex items-start gap-1 pt-0.5">
                              <MapPin size={8} className="text-cyan-400 shrink-0 mt-0.5" />
                              <p className="text-[8px] text-cyan-100/70 font-bold line-clamp-2 leading-snug italic">
                                 {alert.locationName || alert.address || alert.fullAddress || alert.victimLocationName || 'Triangulating GPS...'}
                              </p>
                           </div>
                        </div>
                        
                        <div className="flex gap-2">
                           <button 
                              onClick={(e) => { e.stopPropagation(); onNavigate?.('SAFETY', alert.id); }}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[7px] font-black uppercase tracking-widest rounded-lg transition-all"
                           >
                              Intercept
                           </button>
                           {selectedAlertId === alert.id && (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setSelectedAlertId(null); }}
                                 className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                              >
                                 <X size={12} />
                              </button>
                           )}
                        </div>
                     </motion.div>
                  ))
               )}
            </div>
         </div>

         {/* 🗺️ CENTER COLUMN: SITUATIONAL MAP (50%) */}
         <div className="col-span-6 bg-[#0F172A]/50 border border-white/5 rounded-[3rem] overflow-hidden relative shadow-2xl">
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
               <div className="px-4 py-2 bg-[#020617]/80 backdrop-blur-md rounded-2xl border border-white/5 flex items-center gap-3">
                  <Globe size={14} className="text-blue-500" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">
                     {selectedAlertId ? 'Tactical Lock: Radius Active' : 'National Grid View'}
                  </span>
               </div>
            </div>
            
            <div className="absolute inset-0 z-0">
               <CommandMap 
                  activeAlerts={activeAlerts} 
                  activeProtectors={verifiedProtectors} 
                  selectedAlertId={selectedAlertId}
                  selectedProtectorId={selectedProtectorId}
                  onAlertClick={(id) => setSelectedAlertId(id)}
               />
            </div>

            {/* Map Overlay Stats */}
            <div className="absolute bottom-8 right-8 z-10 flex gap-4">
               {selectedAlertId && (
                  <motion.div 
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="bg-rose-600/90 backdrop-blur-md border border-rose-400/20 p-4 rounded-3xl"
                  >
                     <p className="text-[7px] text-rose-100 font-black uppercase tracking-widest mb-1">Forces in Radius</p>
                     <p className="text-xl font-black text-white italic tabular-nums">{protectorsInRange.length}</p>
                  </motion.div>
               )}
               <div className="bg-[#020617]/80 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
                  <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-1">Response Radius</p>
                  <p className="text-xl font-black text-white italic tabular-nums">2.0 KM</p>
               </div>
            </div>
         </div>

         {/* 🛡️ RIGHT COLUMN: PROTECTOR NEXUS (25%) */}
         <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
               <button 
                  onClick={() => setProtectorTab('PENDING')}
                  className={cn("flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all", protectorTab === 'PENDING' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}
               >
                  Pending ({pendingProtectors.length})
               </button>
               <button 
                  onClick={() => setProtectorTab('ACTIVE')}
                  className={cn("flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all", protectorTab === 'ACTIVE' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}
               >
                  Active ({verifiedProtectors.length})
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
               <AnimatePresence mode="wait">
                  {protectorTab === 'PENDING' ? (
                     <motion.div 
                        key="pending"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-3"
                     >
                        {pendingProtectors.length === 0 ? (
                           <div className="h-40 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/2 opacity-20 text-center p-6">
                              <CheckCircle2 size={24} className="mb-2 text-emerald-500" />
                              <p className="text-[8px] font-black uppercase tracking-widest">Queue Clear</p>
                           </div>
                        ) : (
                           pendingProtectors.map((prot, i) => (
                              <div key={prot.id} className="bg-white/5 border border-white/5 rounded-[1.25rem] p-3 group hover:border-amber-500/30 transition-all">
                                 <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-black italic text-xs">
                                       {prot.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                       <h4 className="text-[9px] font-black text-white uppercase italic tracking-tight leading-none">{prot.name || 'New Node'}</h4>
                                       <p className="text-[7px] text-gray-500 font-bold tracking-widest mt-1">{prot.phone || 'NO CONTACT'}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button 
                                       onClick={() => onApproveProtector?.(prot.id)}
                                       className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg text-[6px] font-black uppercase tracking-widest transition-all"
                                    >
                                       Approve
                                    </button>
                                    <button className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-lg text-[6px] font-black uppercase tracking-widest transition-all">
                                       Reject
                                    </button>
                                 </div>
                              </div>
                           ))
                        )}
                     </motion.div>
                  ) : (
                     <motion.div 
                        key="active"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-3"
                     >
                        {verifiedProtectors.map((prot, i) => {
                           const occ = (prot.protectorVetting?.occupation || '').toLowerCase();
                           const isPriority = occ.includes('army') || occ.includes('police') || occ.includes('doctor') || occ.includes('military');
                           
                           return (
                              <div 
                                 key={prot.id} 
                                 onClick={() => {
                                    setSelectedProtectorId(prot.id);
                                    setSelectedAlertId(null);
                                    onNavigate?.('PROTECTORS', prot.id);
                                 }}
                                 className={cn(
                                    "border rounded-[1.25rem] p-3 group transition-all flex items-center justify-between cursor-pointer",
                                    selectedProtectorId === prot.id ? "border-cyan-500 bg-white/10" : 
                                    isPriority ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                 )}
                              >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                 <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 font-black italic shrink-0 text-xs">
                                    {prot.name?.charAt(0) || 'P'}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                       <h4 className="text-[9px] font-black text-white uppercase italic tracking-tight truncate leading-none">{prot.name || 'Protector'}</h4>
                                       <div className="flex items-center gap-1 shrink-0">
                                          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                          <span className="text-[5px] text-emerald-500 font-black uppercase tracking-widest">Online</span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[6px] text-gray-500 font-black uppercase tracking-widest">{prot.gender || 'N/A'}</span>
                                       <div className="w-1 h-1 rounded-full bg-white/10" />
                                       {(() => {
                                          const occ = (prot.protectorVetting?.occupation || '').toLowerCase();
                                          const isPriority = occ.includes('army') || occ.includes('police') || occ.includes('doctor') || occ.includes('military');
                                          return (
                                             <span className={cn(
                                                "text-[6px] font-black uppercase tracking-widest truncate",
                                                isPriority ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-cyan-400"
                                             )}>
                                                {prot.protectorVetting?.occupation || 'Operative'}
                                             </span>
                                          );
                                       })()}
                                    </div>
                                 </div>
                              </div>
                              {selectedAlertId && calculateDistance(
                                 activeAlerts.find(a => a.id === selectedAlertId)?.latitude || 0,
                                 activeAlerts.find(a => a.id === selectedAlertId)?.longitude || 0,
                                 prot.latitude || prot.lastLocation?.lat || 0,
                                 prot.longitude || prot.lastLocation?.lng || 0
                              ) <= 2 && (
                                 <div className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded uppercase">In Radius</div>
                              )}
                              </div>
                           );
                        })}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
