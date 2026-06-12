import React from 'react';
import { Briefcase, MessageSquare, Activity } from 'lucide-react';

interface ProtectorDeepIntelProps {
  selectedProt: any;
}

export function ProtectorDeepIntel({ selectedProt }: ProtectorDeepIntelProps) {
  return (
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
  );
}
