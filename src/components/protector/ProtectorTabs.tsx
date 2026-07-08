import React from 'react';
import { Radio, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProtectorTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertsLength: number;
  isPcrOfficer?: boolean;
}

export default function ProtectorTabs({ activeTab, setActiveTab, activeAlertsLength, isPcrOfficer = false }: ProtectorTabsProps) {
  return (
    <div className="mx-5 mb-4 p-1.5 bg-[#1E293B] rounded-2xl flex relative border border-white/5">
      <button 
        onClick={() => setActiveTab('map')}
        className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-[2px] transition-all duration-300 rounded-xl relative z-10 flex items-center justify-center gap-2", activeTab === 'map' ? "text-white" : "text-slate-500 hover:text-slate-300")}
      >
        <Radio size={14} className={activeTab === 'map' ? "" : ""} />
        RADAR
      </button>
      
      <button 
        onClick={() => setActiveTab('list')}
        className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-[2px] transition-all duration-300 rounded-xl relative z-10 flex items-center justify-center gap-2", activeTab === 'list' ? "text-white" : "text-slate-500 hover:text-slate-300")}
      >
        <AlertTriangle size={14} />
        ALERTS
        {activeAlertsLength > 0 && (
          <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.6)]">
            {activeAlertsLength}
          </div>
        )}
      </button>
      
      {isPcrOfficer && (
        <button 
          onClick={() => setActiveTab('hq')}
          className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-[2px] transition-all duration-300 rounded-xl relative z-10 flex items-center justify-center gap-2", activeTab === 'hq' ? "text-white" : "text-slate-500 hover:text-slate-300")}
        >
          <Layers size={14} />
          HQ HUB
        </button>
      )}

      <div 
        className={cn("absolute top-1.5 bottom-1.5 bg-blue-600 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0 shadow-lg", 
          isPcrOfficer ? "w-[calc(33.33%-4px)]" : "w-[calc(50%-4px)]",
          isPcrOfficer 
            ? (activeTab === 'map' ? "left-1.5" : activeTab === 'list' ? "left-[calc(33.33%+2px)]" : "left-[calc(66.66%+2px)]")
            : (activeTab === 'map' ? "left-1.5" : "left-[calc(50%+2px)]")
        )} 
      />
    </div>
  );
}
