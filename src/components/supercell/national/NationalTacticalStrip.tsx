import React from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldAlert, Volume2, Target } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { IncidentRecord, UserProfile } from '../../../domain/types';

interface Props {
  activeAlerts: IncidentRecord[];
  verifiedProtectors: UserProfile[];
  pendingProtectors: UserProfile[];
  selectedAlertId: string | null;
  protectorsInRangeCount: number;
  onDispatchSpecial?: (alertId: string) => void;
  handleToggleRemoteSiren: (alertId: string) => void;
  setSelectedAlertId: (id: string | null) => void;
}

export function NationalTacticalStrip({
  activeAlerts, verifiedProtectors, pendingProtectors,
  selectedAlertId, protectorsInRangeCount,
  onDispatchSpecial, handleToggleRemoteSiren, setSelectedAlertId
}: Props) {
  const selectedAlert = activeAlerts.find(a => a.id === selectedAlertId);
  const isSirenActiveOnVictim = selectedAlert?.remoteSirenTriggered || false;

  return (
    <div className="bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase italic leading-none tracking-tighter">KAVACH NATIONAL SUPERCELL</h1>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[1.5px] mt-1">Operational Readiness: 100% // SOVEREIGN CLOUD LOCK</p>
          </div>
        </div>
        
        <div className="h-8 w-px bg-white/5 mx-2" />
        
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest mb-1">Live SOS</span>
            <span className="text-rose-500 font-black italic text-xs tabular-nums leading-none">{activeAlerts.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest mb-1">Protectors</span>
            <span className="text-cyan-400 font-black italic text-xs tabular-nums leading-none">{verifiedProtectors.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest mb-1">Vetting Queue</span>
            <span className="text-amber-500 font-black italic text-xs tabular-nums leading-none">{pendingProtectors.length}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {selectedAlertId && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onDispatchSpecial?.(selectedAlertId)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xl shadow-rose-600/20 text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <ShieldAlert size={14} /> 
            Dispatch Special Force ({protectorsInRangeCount})
          </motion.button>
        )}
        {selectedAlertId && (
          <button
            onClick={() => handleToggleRemoteSiren(selectedAlertId)}
            className={cn(
              "px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
              isSirenActiveOnVictim
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 animate-pulse font-black"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
          >
            <Volume2 size={12} className={isSirenActiveOnVictim ? "animate-bounce" : ""} />
            {isSirenActiveOnVictim ? "🔊 SILENCE VICTIM SIREN" : "🔊 TRIGGER PHONE SIREN"}
          </button>
        )}
        {selectedAlertId && (
          <button 
            onClick={() => setSelectedAlertId(null)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Target size={12} /> Clear Lock
          </button>
        )}
        <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-[12px] font-black uppercase text-gray-400 tracking-widest">Grid Sync: 14ms</span>
        </div>
      </div>
    </div>
  );
}
