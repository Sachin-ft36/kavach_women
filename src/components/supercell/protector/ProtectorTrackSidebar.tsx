import React from 'react';
import { Crosshair, Search, User, Activity, History, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredActiveMissions: any[];
  filteredArchives: any[];
  selectedMissionId: string | null;
  setSelectedMissionId: (id: string | null) => void;
  selectedVictimId: string | null;
  setSelectedVictimId: (id: string | null) => void;
  setReplayProgress: (p: number) => void;
  resolveIdentity: (alert: any) => string;
  getDistanceInfo: (alert: any) => { dist: string; eta: string };
  userStatusMap: Record<string, any>;
}

export default function ProtectorTrackSidebar({
  searchTerm, setSearchTerm, filteredActiveMissions, filteredArchives,
  selectedMissionId, setSelectedMissionId, selectedVictimId, setSelectedVictimId,
  setReplayProgress, resolveIdentity, getDistanceInfo, userStatusMap
}: Props) {
  return (
    <aside className="w-[480px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl relative h-full">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Crosshair size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-widest uppercase italic leading-none">ProtectorTrack</h2>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-60 italic mt-1">Forensic Replay Engine</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="SCAN MISSION ID..." 
            className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Pursuits</span>
          <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full border border-rose-500/20">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full " />
            <span className="text-[8px] font-black uppercase tracking-widest">{filteredActiveMissions.length} LIVE</span>
          </div>
        </div>

        {filteredActiveMissions.map((mission) => (
          <div key={mission.id} onClick={() => { setSelectedMissionId(mission.id); setSelectedVictimId(null); setReplayProgress(1); }} className={cn("p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden bg-[#0F172A]/50", selectedMissionId === mission.id && "bg-blue-600/10 border-blue-500/30")}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white border border-white/5"><User size={18} /></div>
                <div>
                  <h4 className="text-[12px] font-black text-white uppercase leading-none">{resolveIdentity(mission)}</h4>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">ID: {mission.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-blue-400 italic tabular-nums">{getDistanceInfo(mission).dist}</p>
                <p className="text-[7px] font-bold text-gray-500 uppercase">Intercept</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
              <Activity size={10} className="text-rose-500" />
              <span className="text-[8px] font-black text-gray-400 uppercase">Live Telemetry Synchronized</span>
            </div>
          </div>
        ))}

        <div className="px-4 py-2 mt-8 border-t border-white/5 pt-6">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Evidence Archives</span>
        </div>
        {filteredArchives.map((victim) => (
          <div key={victim.uid} onClick={() => { setSelectedVictimId(victim.uid); setSelectedMissionId(null); }} className={cn("p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 bg-[#1E293B]/50", selectedVictimId === victim.uid && "bg-emerald-600/10 border-emerald-500/30")}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><History size={18} /></div>
              <div className="flex-1">
                <h4 className="text-[11px] font-black text-white uppercase leading-none">{userStatusMap[victim.uid]?.name || victim.name}</h4>
                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">{victim.count} Missions Archived</p>
              </div>
              <ChevronRight size={14} className="text-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
