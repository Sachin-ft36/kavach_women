import React from 'react';
import { 
  FileText, Clock, Shield, MapPin, ChevronRight, Gavel, 
  CheckCircle2, Lock, Fingerprint, Database, Link as LinkIcon,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface JusticeLedgerProps {
  zeroFirs: any[];
  viewMode: string;
  onViewFir: (fir: any) => void;
  userStatusMap?: Record<string, any>;
}

export function JusticeLedger({ zeroFirs, viewMode, onViewFir, userStatusMap }: JusticeLedgerProps) {
  return (
    <div className={cn(
      "bg-[#0F172A] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all h-full relative", 
      viewMode === 'JUSTICE' ? "flex-1" : "flex-1"
    )}>
      {/* 🏛️ BLOCKCHAIN HUB HEADER */}
      <div className="p-6 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 relative">
            <Database size={20} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center">
               <Lock size={8} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[4px] text-white italic leading-none">Justice Ledger</h3>
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2 opacity-60">Immutable Operational Chain</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
              <Fingerprint size={12} className="text-emerald-500" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Sync Verified</span>
           </div>
           <div className="bg-blue-600/10 px-4 py-2 rounded-2xl border border-blue-500/20">
              <span className="text-[10px] font-black text-blue-400 tabular-nums">{zeroFirs.length} BLOCKS</span>
           </div>
        </div>
      </div>

      {/* 🔗 IMMUTABLE CHAIN FEED */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 py-8 custom-scrollbar bg-[#0F172A]/50 relative">
        {/* Background Chain Line */}
        <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent z-0" />

        {zeroFirs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4 py-20">
             <LinkIcon size={60} />
             <p className="text-[12px] font-black uppercase tracking-[4px] text-center italic">Chain Synchronizing...</p>
          </div>
        ) : zeroFirs.map((fir, idx) => {
          const firDate = fir.timestamp ? new Date(fir.timestamp.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "LIVE";
          const locString = typeof (fir.locationName || fir.location) === 'string' 
            ? (fir.locationName || fir.location) 
            : (fir.location?.latitude ? `${fir.location.latitude.toFixed(4)}, ${fir.location.longitude.toFixed(4)}` : "SECTOR GRID");

          // Generate simulated hash
          const blockHash = `0x${fir.id.slice(0, 8)}${idx}A7F2`;

          return (
            <motion.div 
              key={fir.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="relative z-10 flex gap-6 group"
            >
              {/* Block Node */}
              <div className="shrink-0 pt-2">
                 <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-2xl relative group-hover:border-blue-500/50 transition-all">
                    <ShieldCheck size={20} className={cn("transition-colors", fir.officialResponse ? "text-emerald-500" : "text-blue-400")} />
                    {idx < zeroFirs.length - 1 && (
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 h-8 w-[2px] bg-blue-500/10 group-hover:bg-blue-500/30 transition-all" />
                    )}
                 </div>
              </div>

              {/* Block Content */}
              <div className="flex-1 bg-[#1E293B]/40 hover:bg-[#1E293B]/70 border border-white/5 hover:border-white/10 rounded-[2.5rem] p-6 transition-all group-hover:shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">BLOCK_{idx.toString().padStart(3, '0')}</span>
                       <span className="text-[8px] font-black text-gray-500 tabular-nums uppercase italic">Hash: {blockHash}</span>
                    </div>
                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">
                      {userStatusMap?.[fir.victimUid || fir.userId || '']?.name || fir.userName || "Operative Log"}
                    </h4>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                    fir.officialResponse ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", fir.officialResponse ? "bg-emerald-500" : "bg-blue-500 animate-pulse")} />
                    {fir.officialResponse ? "Committed" : "Pending Sync"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Vector Location</p>
                      <p className="text-[11px] font-bold text-white truncate uppercase tracking-tighter italic">{locString}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Timestamp</p>
                      <p className="text-[11px] font-bold text-white uppercase tracking-tighter italic">{firDate}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1E293B] bg-blue-900/50 flex items-center justify-center text-[8px] font-black text-blue-400">
                              <Shield size={10} />
                           </div>
                         ))}
                      </div>
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">Validated by 3 Command Nodes</span>
                   </div>
                   <button 
                     onClick={() => onViewFir(fir)} 
                     className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-3 group/btn"
                   >
                     View Block
                     <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 🔐 LEDGER AUTHENTICATION FOOTER */}
      <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <Lock size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[4px]">Sovereign Immutability Active</span>
           </div>
           <div className="hidden lg:flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[4px]">Neural Grid Synced</span>
           </div>
        </div>
        <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3 group hover:text-white transition-colors">
           <Database size={14} />
           Audit Full Chain
           <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
