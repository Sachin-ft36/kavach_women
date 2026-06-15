import React from 'react';
import { motion } from 'motion/react';
import { Mic, Activity, Car, ShieldAlert, Phone } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DispatchPanelProps {
  activeAlerts: any[];
  selectedAlertId: string | null;
  handleForceReassignPcr: (alertId: string, officerName: string) => Promise<void>;
  incidentData: any;
  isLiveStreamActive: boolean;
  isAudioPlaying: boolean;
  toggleLiveMicSynth: () => void;
  simulatedPcrVans: any[];
  pcrDispatched: Record<string, boolean>;
  handleBroadcastAlarm: () => void;
  handleRadioCall: (pcrId: string, pcrName: string) => void;
  activePcoRadio: string | null;
  handlePcrDispatch: (pcrId: string, pcrName: string, isReal: boolean, uid?: string) => Promise<void>;
  handleLegalDispatch: () => Promise<void>;
  isDispatching: boolean;
}

export const DispatchPanel = ({
  activeAlerts,
  selectedAlertId,
  handleForceReassignPcr,
  incidentData,
  isLiveStreamActive,
  isAudioPlaying,
  toggleLiveMicSynth,
  simulatedPcrVans,
  pcrDispatched,
  handleBroadcastAlarm,
  handleRadioCall,
  activePcoRadio,
  handlePcrDispatch,
  handleLegalDispatch,
  isDispatching
}: DispatchPanelProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col gap-4 overflow-hidden"
    >
      <div className="flex items-center justify-between px-1">
         <div className="flex items-center gap-1.5">
            <Mic size={14} className="text-rose-500 animate-pulse" />
            <span className="text-[13px] font-black text-white uppercase tracking-widest">Stealth Mic Feed</span>
         </div>
         <div className="flex items-center gap-1">
            <div className={cn("w-1.5 h-1.5 rounded-full", isAudioPlaying ? "bg-rose-500 animate-ping" : "bg-gray-500")} />
            <span className="text-[14px] text-gray-500 font-bold uppercase tracking-wider">{isAudioPlaying ? "LIVE CONNECTION" : "MUTED"}</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        
        {/* 🚨 PERSISTENT ESCALATION BANNER FOR INACTIVE UNIT */}
        {activeAlerts.find(a => a.id === selectedAlertId)?.inactivityEscalated && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <Activity className="text-rose-500 animate-pulse" size={14} />
              </div>
              <div>
                <h4 className="text-[14px] font-black text-rose-500 uppercase tracking-widest">Unit Inactivity Detected</h4>
                <p className="text-[11px] text-rose-200/80 font-bold leading-relaxed mt-1 uppercase tracking-wider">
                  {activeAlerts.find(a => a.id === selectedAlertId)?.inactiveOfficerName || "Dispatched Officer"} ({activeAlerts.find(a => a.id === selectedAlertId)?.inactiveOfficerVehicle || "PCR"}) has remained stationary for &gt;15s after intercepting the SOS.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleForceReassignPcr(selectedAlertId!, activeAlerts.find(a => a.id === selectedAlertId)?.inactiveOfficerName || "Unknown")}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[2px] transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] active:scale-[0.98]"
            >
              FORCE UN-ASSIGN & RE-BROADCAST TO POOL
            </button>
          </div>
        )}

        {/* VoIP Call audio interface */}
        <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="min-w-0 pr-2">
              <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">VOIP Stealth Feed</span>
              <h4 className="text-[14px] font-black text-white uppercase mt-0.5 truncate">{incidentData.address}</h4>
              {isLiveStreamActive && (
                <span className="text-[14px] text-emerald-400 font-bold uppercase tracking-widest block mt-1 animate-pulse">WebRTC Secured Link Active</span>
              )}
            </div>
            <button 
              onClick={toggleLiveMicSynth}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all",
                isAudioPlaying 
                  ? "bg-rose-500/10 border-rose-500 text-rose-500 animate-pulse font-bold" 
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold"
              )}
            >
              {isAudioPlaying ? "🛑 Disconnect" : "🎙️ Listen Live"}
            </button>
          </div>

          {/* Bouncing Audio Bars */}
          <div className="h-10 flex items-end justify-between gap-1 px-1 bg-[#020617] rounded-xl border border-white/5 overflow-hidden py-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "w-1.5 rounded-t-full transition-all duration-300 origin-bottom scale-y-100",
                  isAudioPlaying ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" : "bg-slate-800"
                )}
                style={{
                  height: '100%',
                  animation: isAudioPlaying ? 'bounceBar 0.4s ease-in-out infinite' : 'none',
                  animationDelay: `${i * 0.03}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* 🚨 NEAREST PCR PATROL VEHICLES TELEMETRY CONSOLE */}
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Car size={12} className="text-cyan-400 animate-pulse" />
              <span className="text-[11px] font-black text-white uppercase tracking-widest">Nearest PCR Patrol Vans</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[5px] text-cyan-400 font-black uppercase tracking-widest">2.0 KM Radius</span>
              <button 
                onClick={handleBroadcastAlarm}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[5px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-1"
              >
                <ShieldAlert size={8} /> BROADCAST ALARM
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {simulatedPcrVans.length === 0 ? (
              <div className="py-8 text-center opacity-40 border border-dashed border-white/10 rounded-[1.25rem] bg-white/2">
                <p className="text-[12px] font-black uppercase tracking-widest text-white">No Active PCR Units in Range</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Units must mark themselves on-duty to appear</p>
              </div>
            ) : (
              simulatedPcrVans.map((pcr) => (
                <div key={pcr.id} className={cn(
                  "p-3 border rounded-xl flex items-center justify-between transition-all",
                  pcrDispatched[pcr.id] 
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "bg-black/40 border-white/5 hover:border-white/10"
                )}>
                  <div className="min-w-0 flex-1 pr-2">
                    <h5 className="text-[12px] font-black text-white uppercase leading-none truncate">{pcr.name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[14px] text-gray-500 font-bold uppercase">{pcr.officer}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[14px] text-cyan-400 font-black italic">{pcr.distance} // ETA {pcr.delay}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button 
                      onClick={() => handleRadioCall(pcr.id, pcr.name)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[14px] font-black uppercase tracking-widest border transition-all flex items-center gap-1",
                        activePcoRadio === pcr.id
                          ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse"
                          : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                      )}
                    >
                      <Phone size={8} className={activePcoRadio === pcr.id ? "animate-pulse" : ""} />
                      {activePcoRadio === pcr.id ? "ON CALL" : "RADIO PCO"}
                    </button>

                    <button 
                      onClick={() => handlePcrDispatch(pcr.id, pcr.name, pcr.isReal, pcr.uid)}
                      disabled={pcrDispatched[pcr.id]}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[14px] font-black uppercase tracking-widest border transition-all",
                        pcrDispatched[pcr.id]
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-md shadow-rose-600/15"
                      )}
                    >
                      {pcrDispatched[pcr.id] ? "✓ DISPATCHED" : "DISPATCH"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sentinel interim voice transcripts */}
        <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-2">
          <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">Sentinel Interim Transcript</span>
          <p className="text-[14px] text-gray-200 font-bold leading-relaxed italic bg-[#020617] p-3 rounded-xl border border-white/5">
            "{incidentData.forensicTranscript}"
          </p>
        </div>

        {/* Dispatch Location POI Node */}
        <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-2">
          <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">Nearest Dispatch Precinct</span>
          <h5 className="text-[13px] font-black text-cyan-400 uppercase tracking-wide truncate">{incidentData.nearestThanaName}</h5>
          <p className="text-[11px] text-gray-400 font-bold leading-snug uppercase tracking-tight mt-1">BNS Tier: {incidentData.bnsOffenseCategory}</p>
        </div>

        {/* Dispatch Legal Call Action */}
        <button 
          onClick={handleLegalDispatch}
          disabled={isDispatching}
          className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-black uppercase tracking-[2px] text-[12px] flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isDispatching ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />}
          {isDispatching ? "DISPATCHING PACKET..." : "DISPATCH LEGAL RESPONSE"}
        </button>

      </div>
    </motion.div>
  );
};
