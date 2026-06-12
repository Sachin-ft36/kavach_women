import React from 'react';
import { Target, History, AlertTriangle } from 'lucide-react';

interface ProtectorKundaliGridProps {
  missionStats: Record<string, any>;
  selectedProt: any;
}

export function ProtectorKundaliGrid({ missionStats, selectedProt }: ProtectorKundaliGridProps) {
  return (
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
  );
}
