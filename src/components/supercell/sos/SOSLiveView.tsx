import React from 'react';
import { 
  User, Shield, MapPin, Phone, 
  AlertTriangle, Activity, Zap, Ban, 
  ChevronLeft, Heart, Lock, Mail, Globe, 
  Fingerprint, Camera, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import CommandMap from '../../maps/CommandMap';
import MapplsCommandMap from '../../maps/MapplsCommandMap';

interface SOSLiveViewProps {
  selectedAlert: any;
  selectedAlertId: string | null;
  victimData: any;
  sidebarTab: 'LIVE' | 'HISTORY';
  setSelectedAlertId: (id: string | null) => void;
  handleAction: (type: 'warn' | 'ban') => void;
  setIsOverrideModalOpen: (open: boolean) => void;
  pendingAppeal: any;
  handleRestoreAccess: (uid: string) => void;
  handlePermanentBan: (uid: string) => void;
  loadingAddress: boolean;
  resolvedAddress: string | null;
  guardians: any[];
  nearbyPolice: any[];
  nearbyHospitals: any[];
  loadingNodes: boolean;
  setIsEvidenceViewerOpen: (open: boolean) => void;
  useMapboxFallback: boolean;
  setUseMapboxFallback: (use: boolean) => void;
  verifiedProtectors: any[];
}

export function SOSLiveView({
  selectedAlert,
  selectedAlertId,
  victimData,
  sidebarTab,
  setSelectedAlertId,
  handleAction,
  setIsOverrideModalOpen,
  pendingAppeal,
  handleRestoreAccess,
  handlePermanentBan,
  loadingAddress,
  resolvedAddress,
  guardians,
  nearbyPolice,
  nearbyHospitals,
  loadingNodes,
  setIsEvidenceViewerOpen,
  useMapboxFallback,
  setUseMapboxFallback,
  verifiedProtectors
}: SOSLiveViewProps) {
  if (!selectedAlertId || !selectedAlert) return null;

  return (
    <div className="flex-grow flex flex-row h-full w-full overflow-hidden">
      {/* LEFT COLUMN: MAP */}
      <div className="w-[50%] lg:w-[55%] h-full relative shrink-0 border-r border-white/5">
         {!useMapboxFallback ? (
           <MapplsCommandMap 
             activeAlerts={[selectedAlert]} 
             activeProtectors={verifiedProtectors} 
             selectedAlertId={selectedAlert.id} 
             onFallback={() => setUseMapboxFallback(true)} 
           />
         ) : (
           <CommandMap 
             activeAlerts={[selectedAlert]} 
             activeProtectors={verifiedProtectors} 
             selectedAlertId={selectedAlert.id} 
           />
         )}
      </div>

      {/* RIGHT COLUMN: DETAILS */}
      <div className="w-[50%] lg:w-[45%] h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 bg-[#0B0F19]">
         {/* 🛡️ HEADER AREA */}
         <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4 relative">
            {/* 🛡️ DISCIPLINARY OVERLAY */}
            <AnimatePresence>
              {victimData?.isSOSBlocked && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
                  className="absolute inset-0 z-50 bg-rose-950/80 flex flex-col items-center justify-center p-6 text-center rounded-[2rem]"
                >
                  <div className="bg-[#1E293B]/40 border border-rose-500/30 rounded-xl p-6  space-y-4 max-w-sm">
                     <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto border border-rose-500/20">
                        <Lock size={24} className="text-rose-500" />
                     </div>
                     <h2 className="text-base font-black text-white uppercase  leading-none">Account Blocked</h2>
                     <p className="text-[12px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">SOS restricted from National Grid</p>
                     
                     <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left text-[13px] text-gray-300 ">
                        {pendingAppeal ? `"${pendingAppeal.reason}"` : "NO PENDING APPEAL."}
                     </div>

                     <div className="flex gap-2">
                        <button onClick={() => handleRestoreAccess(victimData.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-black uppercase tracking-widest ">Restore</button>
                        <button onClick={() => handlePermanentBan(victimData.id)} className="flex-1 py-2 bg-black/40 border border-rose-900 text-rose-900 rounded-xl text-[12px] font-black uppercase tracking-widest">Ban</button>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start justify-between">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                       "px-2 py-0.5 text-[11px] font-black rounded-xl border uppercase tracking-widest leading-none",
                       sidebarTab === 'HISTORY' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                       {sidebarTab === 'HISTORY' ? 'Archived SOS Packet' : 'Live SOS Packet'}
                    </span>
                    {sidebarTab === 'HISTORY' && (
                       <button 
                         onClick={() => setSelectedAlertId(null)}
                         className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black rounded border border-white/5 uppercase tracking-widest flex items-center gap-1 transition-colors"
                       >
                         <ChevronLeft size={8} /> Back to Ledger
                       </button>
                    )}
                  </div>
                  <h1 className="text-xl font-black text-white uppercase leading-none tracking-tighter mt-1">{victimData?.name || 'Citizen Profile'}</h1>
               </div>
               
               {/* COMPACT ACTION BUTTONS */}
               <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleAction('warn')} className="px-2.5 py-1.5 bg-[#1E293B]/40 border border-amber-500/30 text-amber-500 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-amber-500 hover:text-black transition-all">
                     <AlertTriangle size={10} /> Warn
                  </button>
                  <button onClick={() => setIsOverrideModalOpen(true)} className="px-2.5 py-1.5 bg-rose-600 text-white shadow-lg text-white rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-1 shadow-rose-600/20 transition-all border border-rose-400/30">
                     <Zap size={10} /> Override
                  </button>
                  <button onClick={() => handleAction('ban')} className="px-2.5 py-1.5 bg-[#1E293B]/40 border border-rose-500/30 text-rose-500 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-500 hover:text-white transition-all">
                     <Ban size={10} /> Ban
                  </button>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
               <div className="bg-[#1E293B]/40 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 ">
                  <Phone size={10} className="text-gray-500" />
                  <span className="text-[13px] font-black text-white tabular-nums">{victimData?.phoneNumber || victimData?.phone || 'NO RECORD'}</span>
               </div>
               {victimData?.email && (
                  <div className="bg-[#1E293B]/40 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 ">
                     <Mail size={10} className="text-gray-500" />
                     <span className="text-[13px] font-black text-white lowercase truncate max-w-[120px]">{victimData.email}</span>
                  </div>
               )}
            </div>
         </div>

         {/* 📍 NEURAL GEOCODE SECTOR */}
         <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30" />
            <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
               <MapPin size={10} className="text-blue-500" /> Neural Geocode Sector
            </p>
            <p className="text-[11px] font-black text-white uppercase leading-relaxed">{loadingAddress ? "Pinpointing..." : (resolvedAddress || selectedAlert?.fullAddress || 'Sector Unknown')}</p>
         </div>

         {/* 🛡️ SUPPORT NODES */}
         <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
            <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Heart size={10} className="text-rose-500" /> Support Nodes</p>
            <div className="space-y-2.5">
               {victimData?.primaryGuardian && (
                  <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 ">
                     <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-black text-white uppercase ">{victimData.primaryGuardian.name}</span>
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded-xl uppercase tracking-widest">Primary</span>
                     </div>
                     <span className="text-[13px] font-black text-rose-400 tabular-nums">{victimData.primaryGuardian.phone}</span>
                  </div>
               )}
               {guardians.map((g: any) => (
                  <div key={g.id} className="flex justify-between items-center bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                     <span className="text-[13px] font-black text-white uppercase ">{g.name}</span>
                     <span className="text-[13px] font-black text-blue-400 tabular-nums">{g.phone || g.phoneNumber}</span>
                  </div>
               ))}

               {/* 🚀 DYNAMIC EMERGENCY NODES (POLICE & HOSPITALS) */}
               {loadingNodes ? (
                  <div className="py-2 text-center">
                     <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Scanning Nearby Grid...</p>
                  </div>
               ) : (
                  (nearbyPolice.length > 0 || nearbyHospitals.length > 0) && (
                     <div className="pt-3 border-t border-white/5 mt-3 space-y-2.5">
                        <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                           <Globe size={10} className="text-cyan-400" /> Nearby Emergency Nodes
                        </p>
                        
                        {/* POLICE STATIONS */}
                        {nearbyPolice.map((station: any, idx: number) => (
                           <div key={`police-${idx}`} className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                 <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                       <Shield size={8} className="text-blue-400 shrink-0" />
                                       <span className="text-[13px] font-black text-white uppercase leading-none truncate block max-w-[140px]">{station.name}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-none truncate block max-w-[160px]">{station.address}</p>
                                 </div>
                                 <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[5px] font-black rounded uppercase tracking-widest scale-90 shrink-0">POLICE</span>
                              </div>
                              <div className="flex gap-1.5">
                                 <button onClick={() => window.open(`tel:${station.phone || '112'}`)} className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                    <Phone size={8} /> Call
                                 </button>
                                 <button onClick={() => {
                                    const dest = (station.lat && station.lng) ? `${station.lat},${station.lng}` : encodeURIComponent(station.name);
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                                 }} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                    <MapPin size={8} /> Navigate
                                 </button>
                              </div>
                           </div>
                        ))}

                        {/* HOSPITALS */}
                        {nearbyHospitals.map((hospital: any, idx: number) => (
                           <div key={`hospital-${idx}`} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                 <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                       <Heart size={8} className="text-emerald-400 shrink-0" />
                                       <span className="text-[13px] font-black text-white uppercase leading-none truncate block max-w-[140px]">{hospital.name}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-none truncate block max-w-[160px]">{hospital.address}</p>
                                 </div>
                                 <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[5px] font-black rounded uppercase tracking-widest scale-90 shrink-0">TRAUMA</span>
                              </div>
                              <div className="flex gap-1.5">
                                 <button onClick={() => window.open(`tel:${hospital.phone || '108'}`)} className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                    <Phone size={8} /> Call
                                 </button>
                                 <button onClick={() => {
                                    const dest = (hospital.lat && hospital.lng) ? `${hospital.lat},${hospital.lng}` : encodeURIComponent(hospital.name);
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                                 }} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                    <MapPin size={8} /> Navigate
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )
               )}
            </div>
         </div>

         {/* 🛡️ ACTIVE TACTICAL RESPONDERS */}
         <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
            <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
               <Shield size={10} className="text-blue-500" /> Active Tactical Responders
            </p>
            <div className="space-y-2.5">
               {selectedAlert?.activeResponders?.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i).map((responder: any) => (
                  <div key={responder.uid} className="flex justify-between items-center bg-blue-500/5 px-4 py-2.5 rounded-xl border border-blue-500/10 ">
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                           {responder.photo ? (
                              <img src={responder.photo} className="w-full h-full object-cover" />
                           ) : (
                              <User size={10} className="text-blue-400" />
                           )}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[13px] font-black text-white uppercase leading-none">{responder.name}</span>
                           <span className="text-[5px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Intercepting</span>
                        </div>
                     </div>
                     <span className="text-[13px] font-black text-blue-400 tabular-nums">{responder.phone}</span>
                  </div>
               ))}
               {(!selectedAlert?.activeResponders || selectedAlert.activeResponders.length === 0) && (
                  <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest text-center py-2">Scanning for nearest protectors...</p>
               )}
            </div>
         </div>

         {/* 📊 PROTOCOL STRIKES */}
         <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Activity size={40} /></div>
            <div>
               <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Protocol Strikes</p>
               <p className="text-[14px] text-gray-500 font-bold uppercase tracking-widest mt-1">Misuse Strike Penalty Counter</p>
            </div>
            <h3 className="text-3xl font-black text-rose-500 tabular-nums leading-none">{victimData?.sosStrikeCount || 0}</h3>
         </div>

         {/* 🛡️ FORENSIC EVIDENCE VAULT */}
         <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
               <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Fingerprint size={10} className="text-blue-500" /> Forensic Evidence Vault
               </p>
               <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[14px] font-black rounded border border-blue-500/20">LIVE SYNC</span>
            </div>
            
            <div className="bg-black/20 border border-white/5 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
               <div className="flex -space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1E293B]/40 border-2 border-[#0B0F19] flex items-center justify-center text-emerald-500"><Camera size={18} /></div>
                  <div className="w-12 h-12 rounded-xl bg-[#1E293B]/40 border-2 border-[#0B0F19] flex items-center justify-center text-purple-500"><Mic size={18} /></div>
               </div>
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Environmental Intel & Audio Logs
               </p>
               <button onClick={() => setIsEvidenceViewerOpen(true)} className="w-full py-3 bg-rose-600 text-white shadow-lg hover:bg-blue-700 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-blue-600/20 active:scale-[0.98]">
                  Open Evidence Vault
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
