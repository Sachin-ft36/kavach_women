import React from 'react';
import { motion } from 'motion/react';
import { Radar, AlertTriangle, Target, Phone, MapPin, RefreshCw, X, Fingerprint } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IncidentFeedProps {
  sortedAlerts: any[];
  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  onNavigate?: (tab: string, id?: string) => void;
  handleForceReassignPcr: (alertId: string, officerName: string) => Promise<void>;
  zeroFirs: any[];
}

const formatAlertTime = (timestamp: any) => {
  if (!timestamp) return 'LIVE';
  let dateVal: Date;
  if (typeof timestamp.toDate === 'function') {
    dateVal = timestamp.toDate();
  } else if (timestamp.seconds) {
    dateVal = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp.toMillis === 'function') {
    dateVal = new Date(timestamp.toMillis());
  } else {
    dateVal = new Date(timestamp);
  }
  return isNaN(dateVal.getTime()) 
    ? 'LIVE' 
    : dateVal.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

export const IncidentFeed = ({
  sortedAlerts,
  selectedAlertId,
  setSelectedAlertId,
  onNavigate,
  handleForceReassignPcr,
  zeroFirs
}: IncidentFeedProps) => {
  return (
    <>
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
            <Radar size={16} className="text-rose-500" />
            <h3 className="text-[14px] font-black text-white uppercase tracking-[3px]">Active Distress</h3>
         </div>
         <span className="text-[12px] font-black text-rose-500/50 uppercase italic tracking-widest">Priority: Omega</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
         {sortedAlerts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/2 opacity-20">
               <p className="text-[12px] font-black uppercase tracking-widest">No Active SOS</p>
            </div>
         ) : (
            sortedAlerts.map((alert) => (
              <motion.div 
                 key={alert.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className={cn(
                    "bg-[#1E293B]/40 border rounded-[1.25rem] p-3 group transition-all cursor-pointer relative overflow-hidden",
                    alert.inactivityEscalated 
                      ? "border-amber-500 shadow-xl shadow-amber-500/10 bg-amber-950/20 animate-pulse"
                      : selectedAlertId === alert.id 
                        ? "border-rose-500 shadow-xl shadow-rose-500/10 bg-[#1E293B]/80" 
                        : "border-rose-500/10 hover:bg-[#1E293B]/60"
                 )}
                 onClick={() => setSelectedAlertId(alert.id)}
              >
                 {selectedAlertId === alert.id && (
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Target size={30} className="text-rose-500" /></div>
                 )}
                 <div className="flex justify-between items-start mb-2">
                    <div className={cn(
                       "w-7 h-7 rounded-lg flex items-center justify-center border transition-all",
                       alert.inactivityEscalated
                         ? "bg-amber-500 text-slate-950 border-amber-500"
                         : selectedAlertId === alert.id 
                           ? "bg-rose-500 text-white border-rose-500" 
                           : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                       <AlertTriangle size={14} className="" />
                    </div>
                    <span className="text-[11px] text-gray-500 font-black">
                       {formatAlertTime(alert.timestamp)}
                    </span>
                 </div>
                 
                 {alert.inactivityEscalated && (
                     <div className="mb-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                        <span className="text-[6.5px] font-black text-amber-400 uppercase tracking-widest block">⚠️ PCR STANDSTILL DETECTED</span>
                        <span className="text-[5.5px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                           Unit {alert.inactiveOfficerVehicle || 'PCR-TBD'} stationary en-route
                        </span>
                     </div>
                  )}

                 <div className="space-y-0.5 mb-2">
                    <h4 className="text-[14px] font-black text-white uppercase tracking-tight truncate leading-tight">
                       {alert.victimName || alert.userName || alert.name || 'Sovereign Node'}
                    </h4>
                    <div className="flex items-center gap-2">
                       <Phone size={7} className="text-gray-500" />
                       <span className="text-[11px] text-gray-500 font-bold tracking-widest">{alert.phone || alert.victimPhone || 'Force ID: 102'}</span>
                    </div>
                    <div className="flex items-start gap-1 pt-0.5">
                       <MapPin size={8} className="text-cyan-400 shrink-0 mt-0.5" />
                       <p className="text-[12px] text-cyan-100/70 font-bold line-clamp-2 leading-snug italic">
                          {alert.locationName || alert.address || alert.fullAddress || alert.victimLocationName || 'Triangulating GPS...'}
                       </p>
                    </div>

                    {/* 🛡️ LIVE RESPONDERS STATUS */}
                    {alert.responders && Object.keys(alert.responders).length > 0 && (
                       <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">👮 Responding PCRs / Officers:</span>
                          <div className="flex flex-wrap gap-1.5">
                             {Object.values(alert.responders).map((res: any) => (
                                <span key={res.uid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10px] font-bold text-blue-200">
                                   <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                   {res.name} ({res.role || 'Rescuer'})
                                </span>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
                 
                 <div className="flex gap-2">
                    {alert.inactivityEscalated ? (
                        <button 
                           onClick={async (e) => { 
                              e.stopPropagation(); 
                              await handleForceReassignPcr(alert.id, alert.inactiveOfficerName || 'PCR Officer'); 
                           }}
                           className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-950"
                        >
                           <RefreshCw size={8} className="animate-spin" /> FORCE RE-ASSIGN PCR
                        </button>
                     ) : (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onNavigate?.('SAFETY', alert.id); }}
                           className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                           Intercept
                        </button>
                     )}
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

       {/* 🏛️ JURISDICTIONAL ZERO FIR REGISTRY (BNSS SEC 173) */}
       <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-cyan-400">
                <Fingerprint size={14} className="animate-pulse text-[#38BDF8]" />
                <span className="text-[14px] font-black uppercase tracking-widest text-[#38BDF8]">Zero FIR Legal Registry</span>
             </div>
             <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">{zeroFirs?.length || 0} Logs</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
             {zeroFirs && zeroFirs.length > 0 ? zeroFirs.map((fir: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-950 border border-white/5 rounded-xl space-y-1.5 font-['Outfit']">
                   <div className="flex justify-between items-center">
                      <span className="text-[12px] font-black text-white font-mono">{fir.caseId || `ZF-0${idx + 1}`}</span>
                      <span className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[5px] text-cyan-400 font-black uppercase tracking-widest">
                         BNSS SEC 173
                       </span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold uppercase">
                      <span>Victim: {fir.victimName || 'Sovereign Node'}</span>
                      <span className="text-amber-400 italic">Pending Handover</span>
                   </div>
                   <p className="text-[14px] text-gray-500 font-bold leading-normal uppercase">
                      Origin: {fir.area || 'District Outer Sector'} ➔ Target: {fir.dest || 'Jurisdiction Post'}
                   </p>
                </div>
             )) : (
                 <div className="py-6 text-center opacity-30 border border-dashed border-white/10 rounded-xl">
                    <Fingerprint size={16} className="mx-auto mb-2 text-[#38BDF8] animate-pulse" />
                    <p className="text-[7.5px] font-black uppercase tracking-widest text-white">No Registered Zero FIRs</p>
                 </div>
              )}
           </div>
       </div>
    </>
  );
};
