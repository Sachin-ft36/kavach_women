import React from 'react';
import { Activity, Clock, Search, User } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface SOSQueueSidebarProps {
  sidebarTab: 'LIVE' | 'HISTORY';
  setSidebarTab: (tab: 'LIVE' | 'HISTORY') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredAlerts: any[];
  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  selectedVictimId: string | null;
  setSelectedVictimId: (id: string | null) => void;
  userStatusMap: Record<string, any>;
}

export function SOSQueueSidebar({
  sidebarTab,
  setSidebarTab,
  searchTerm,
  setSearchTerm,
  filteredAlerts,
  selectedAlertId,
  setSelectedAlertId,
  selectedVictimId,
  setSelectedVictimId,
  userStatusMap
}: SOSQueueSidebarProps) {
  return (
    <aside className="w-[380px] bg-[#1E293B]/40 border-r border-white/5 flex flex-col z-20">
      <div className="p-8 pb-4">
        <div className="flex bg-[#0F172A] p-1 rounded-xl border border-white/5 mb-6">
          <button 
            onClick={() => { setSidebarTab('LIVE'); setSelectedAlertId(null); setSelectedVictimId(null); }} 
            className={cn("flex-1 py-3 text-[13px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'LIVE' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500")}
          >
            <Activity size={12} className="inline mr-2" /> Live SOS
          </button>
          <button 
            onClick={() => { setSidebarTab('HISTORY'); setSelectedAlertId(null); setSelectedVictimId(null); }} 
            className={cn("flex-1 py-3 text-[13px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'HISTORY' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500")}
          >
            <Clock size={12} className="inline mr-2" /> Logs
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="SEARCH VICTIM..." 
            className="w-full bg-[#0F172A] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-[11px] font-black text-white uppercase" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredAlerts.map((alert: any) => (
          <div 
            key={alert.id || alert.uid} 
            onClick={() => {
              if (sidebarTab === 'LIVE') {
                  setSelectedAlertId(alert.id);
              } else {
                  setSelectedVictimId(alert.uid);
                  setSelectedAlertId(null);
              }
            }} 
            className={cn(
              "p-5 rounded-[2rem] border border-white/5 shadow-2xl cursor-pointer transition-all", 
              (selectedAlertId === alert.id || selectedVictimId === alert.uid) ? "bg-white/10 border-white/5" : "bg-[#1E293B]/40"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/5">
                <User size={20} className={sidebarTab === 'LIVE' ? "text-rose-500" : "text-blue-500"} />
              </div>
              <div className="flex-1 truncate">
                <h4 className="text-[11px] font-black text-white uppercase">
                  {userStatusMap[alert.victimUid || alert.userId || alert.uid]?.name || alert.victimName || alert.name}
                </h4>
                <p className="text-[11px] text-gray-500 font-black uppercase">
                  {sidebarTab === 'LIVE' ? 'SOS Active' : `Resolved (${alert.count} Incidents)`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
