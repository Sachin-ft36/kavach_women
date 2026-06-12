import React from 'react';
import { motion } from 'motion/react';
import { Link as LinkIcon, Clock, MapPin, Shield, Fingerprint, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function MissionAuditTimeline({
  loading,
  history,
  setSelectedEvidenceAlertId
}: any) {
  return (
    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#0F172A] relative">
      <div className="absolute left-[72px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent" />
      
      <div className="mb-12">
         <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
               <LinkIcon size={18} />
            </div>
            <h4 className="text-[12px] font-black text-blue-400 uppercase tracking-[6px]">Operational Forensic Chain</h4>
         </div>
         
         {loading ? (
           <div className="py-24 flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[4px]">Fetching Neural Blocks...</p>
           </div>
         ) : history.length > 0 ? (
           <div className="space-y-10">
              {history.map((alert: any, idx: number) => (
                <motion.div 
                  key={alert.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-24 group"
                >
                   {/* Chain Node */}
                   <div className="absolute left-[13px] top-4 w-6 h-6 bg-[#1E293B] rounded-full border-2 border-white/20 group-hover:border-blue-500 group-hover:scale-125 transition-all flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   </div>
                   
                   <div className="bg-white/5 hover:bg-white/10 rounded-[2.5rem] p-8 border border-white/5 group-hover:border-white/10 transition-all shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-4">
                            <div className="px-4 py-2 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-[10px] font-black text-blue-400 tabular-nums tracking-widest">
                               BLOCK_{alert.id.slice(-6).toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                               <Clock size={14} />
                               <span className="text-[9px] font-black uppercase tracking-widest">{alert.timestamp?.toDate().toLocaleString()}</span>
                            </div>
                         </div>
                         <div className={cn(
                           "px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border",
                           alert.closureReason === 'Accidentally triggered SOS' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                         )}>
                            {alert.closureReason || 'Verified Resolution'}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
                               <MapPin size={20} />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Grid Deployment</p>
                               <p className="text-[11px] font-black text-white truncate uppercase italic tracking-tighter">{alert.location?.address || 'Neural Location Lock'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
                               <Shield size={20} />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Sovereign Validation</p>
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">BNS Compliant Block</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Fingerprint size={14} className="text-blue-400/40" />
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-[4px]">Neural Hash: 0x{alert.id.slice(0, 12)}...</span>
                         </div>
                         <button 
                            onClick={() => setSelectedEvidenceAlertId(alert.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                         >
                            Open Evidence Vault
                            <ArrowRight size={12} />
                         </button>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
         ) : (
           <div className="py-32 text-center space-y-6">
              <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto text-gray-700 border border-white/5">
                 <ShieldCheck size={48} />
              </div>
              <p className="text-[12px] font-black text-gray-500 uppercase tracking-[6px]">Clear Forensic History</p>
           </div>
         )}
      </div>
    </div>
  );
}
