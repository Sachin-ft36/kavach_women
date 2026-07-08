import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function MissionAuditIntel({
  user,
  integrityScore,
  historyCount,
  falseAlertCount,
  guardians,
  handleIssueWarning,
  isIssuingWarning
}: any) {
  return (
    <div className="w-[400px] border-r border-white/10 bg-black/20 p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
      <div className="text-center">
         <div className="relative inline-block">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="w-32 h-32 rounded-[40px] mx-auto object-cover border-4 border-white/10 shadow-2xl mb-6" alt="User Profile" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-[#0F172A] text-white">
               <ShieldCheck size={20} />
            </div>
         </div>
         <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{user.name}</h3>
         <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full " />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{user.city || 'Sector Unknown'}</p>
         </div>
      </div>

      <div className="space-y-6">
        <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Integrity Index</span>
             <span className={cn("text-xl font-black tabular-nums", integrityScore > 70 ? "text-emerald-500" : "text-rose-500")}>{integrityScore}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${integrityScore}%` }}
               transition={{ duration: 1.5, ease: "circOut" }}
               className={cn("h-full", integrityScore > 70 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]")}
             />
          </div>
          <p className="text-[8px] font-bold text-gray-600 uppercase mt-4 tracking-widest leading-relaxed">Behavioral analytics consistent with national baseline safety requirements.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 text-center">
              <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{historyCount}</p>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Total SOS</p>
           </div>
           <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-500 italic tracking-tighter leading-none">{falseAlertCount}</p>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">False Blocks</p>
           </div>
        </div>

        {/* 🛡️ GUARDIAN NETWORK SECTION */}
        <div className="p-8 bg-blue-600/5 rounded-[40px] border border-blue-500/10">
           <div className="flex items-center gap-3 mb-6">
              <Users size={18} className="text-blue-400" />
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[3px]">Guardian Network</h4>
           </div>
           
           {guardians.length > 0 ? (
              <div className="space-y-4">
                 {guardians.map((g: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5 text-[10px] font-black italic">
                          {g.name?.charAt(0)}
                       </div>
                       <div className="min-w-0">
                          <p className="text-[11px] font-black text-white uppercase truncate">{g.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest">{g.relation}</span>
                             <span className="text-[8px] font-bold text-gray-600">{g.phone}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           ) : (
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center py-4">No Guardians Registered</p>
           )}
        </div>
      </div>

      <div className="mt-auto pt-10">
         <button 
           onClick={handleIssueWarning}
           disabled={isIssuingWarning}
           className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50"
         >
            <ShieldAlert size={20} />
            Issue System Warn
         </button>
         <p className="text-[8px] font-bold text-gray-600 text-center uppercase tracking-widest mt-4">Authorized Personnel Only</p>
      </div>
    </div>
  );
}
