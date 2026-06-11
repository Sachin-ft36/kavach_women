import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ProtectorControlProps {
  protectorTab: 'PENDING' | 'ACTIVE';
  setProtectorTab: (tab: 'PENDING' | 'ACTIVE') => void;
  pendingProtectors: any[];
  verifiedProtectors: any[];
  onNavigate?: (tab: string, id?: string) => void;
}

export const ProtectorControl = ({
  protectorTab,
  setProtectorTab,
  pendingProtectors,
  verifiedProtectors,
  onNavigate
}: ProtectorControlProps) => {
  return (
    <>
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
         <button 
            onClick={() => setProtectorTab('PENDING')}
            className={cn("flex-1 py-2 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all", protectorTab === 'PENDING' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}
         >
            Pending ({pendingProtectors.length})
         </button>
         <button 
            onClick={() => setProtectorTab('ACTIVE')}
            className={cn("flex-1 py-2 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all", protectorTab === 'ACTIVE' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}
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
                        <p className="text-[12px] font-black uppercase tracking-widest">Queue Clear</p>
                     </div>
                  ) : (
                     pendingProtectors.map((prot) => (
                        <div 
                           key={prot.id} 
                           onClick={() => onNavigate?.('VERIFICATION', prot.id)}
                           className="bg-white/5 border border-white/5 rounded-[1.25rem] p-3.5 group hover:border-blue-500/40 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-between"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-black italic text-sm transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-400 group-hover:border-blue-500/20">
                                 {prot.name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                 <h4 className="text-[13px] font-black text-white uppercase italic tracking-tight leading-none group-hover:text-blue-400 transition-colors">{prot.name || 'New Node'}</h4>
                                 <p className="text-[11px] text-gray-500 font-bold tracking-widest mt-1.5">{prot.phone || 'NO CONTACT'}</p>
                              </div>
                           </div>
                           <ArrowRight size={14} className="text-gray-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-400 transition-all duration-300" />
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
                  {verifiedProtectors.map((prot) => {
                     const occ = (prot.protectorVetting?.occupation || '').toLowerCase();
                     const isPriority = occ.includes('army') || occ.includes('police') || occ.includes('doctor') || occ.includes('military');
                     
                     return (
                        <div 
                           key={prot.id} 
                           onClick={() => onNavigate?.('SOVEREIGN_OPS', prot.id)}
                           className="bg-slate-900/50 border border-white/5 rounded-[1.25rem] p-3.5 group hover:border-cyan-500/40 hover:bg-slate-900 transition-all cursor-pointer"
                        >
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                 <div className={cn("w-2 h-2 rounded-full", prot.active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-gray-500")} />
                                 <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{prot.name}</h4>
                              </div>
                              {isPriority && (
                                 <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[5px] text-blue-400 font-black uppercase tracking-widest">
                                    Priority Asset
                                 </span>
                              )}
                           </div>
                           
                           <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                              <span>{prot.phone || 'Unknown'}</span>
                              <span className="text-emerald-400">Trusted</span>
                           </div>
                        </div>
                     );
                  })}
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </>
  );
};
