import React from 'react';
import { ShieldCheck, AlertTriangle, Cpu, RotateCcw, Play, Pause, Power, Bell, Camera, Heart, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';

interface Props {
  selectedMission: any;
  deviationReport: any;
  resolveIdentity: (alert: any) => string;
  replayProgress: number;
  setReplayProgress: (p: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  handleRemoteOverride: (type: 'LOCKOUT' | 'SIREN' | 'SNAPSHOT') => void;
  isProcessingCommand: boolean;
  isSovereignActive: boolean;
  selectedVictimId: string | null;
  setSelectedVictimId: (id: string | null) => void;
  groupedResolved: Record<string, any[]>;
  selectedMissionId: string | null;
  setSelectedMissionId: (id: string | null) => void;
}

export default function ProtectorReplayHUD({
  selectedMission, deviationReport, resolveIdentity,
  replayProgress, setReplayProgress, isPlaying, setIsPlaying,
  handleRemoteOverride, isProcessingCommand, isSovereignActive,
  selectedVictimId, setSelectedVictimId, groupedResolved,
  selectedMissionId, setSelectedMissionId
}: Props) {
  return (
    <>
      <AnimatePresence>
        {selectedMission && deviationReport && (
          <motion.div 
            initial={{ x: -100, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            className={cn(
              "absolute top-8 right-8 z-50 px-5 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-md",
              deviationReport.isBreached ? "bg-rose-500/20 border-rose-500/30 text-rose-500" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
            )}
          >
            {deviationReport.isBreached ? <AlertTriangle size={14} className="" /> : <ShieldCheck size={14} />}
            <div>
              <p className="text-[7px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Route Integrity</p>
              <p className="text-[9px] font-black uppercase tracking-wider">{deviationReport.isBreached ? 'Breach Detected' : 'Route Normal'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMission && (
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="absolute bottom-10 inset-x-10 z-40">
            <div className="bg-black/90 backdrop-blur-3xl rounded-[32px] p-5 border border-white/10 shadow-2xl">
              <div className="grid grid-cols-3 items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none truncate max-w-[150px]">{resolveIdentity(selectedMission)}</h3>
                      <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/10 shrink-0">
                        <Cpu size={8} className="text-blue-400" />
                        <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">OMS ML LINK</span>
                      </div>
                    </div>
                    <p className="text-[7px] font-black text-blue-400 uppercase tracking-[2px] truncate max-w-[200px]">Mission Log: <span className="opacity-60">{selectedMission.id}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => setReplayProgress(0.01)} className="w-10 h-10 hover:bg-white/10 rounded-xl text-white transition-all flex items-center justify-center"><RotateCcw size={16} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => handleRemoteOverride('LOCKOUT')} disabled={isProcessingCommand} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isSovereignActive ? "bg-rose-600 text-white shadow-lg" : "bg-white/5 text-gray-600")}>
                      {isProcessingCommand ? <Activity size={16} className="animate-spin" /> : <Power size={16} />}
                    </button>
                    <button onClick={() => handleRemoteOverride('SIREN')} disabled={isProcessingCommand} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isSovereignActive ? "bg-amber-600 text-white shadow-lg" : "bg-white/5 text-gray-500")}>
                      <Bell size={16} />
                    </button>
                    <button onClick={() => handleRemoteOverride('SNAPSHOT')} disabled={isProcessingCommand} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isSovereignActive ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-gray-500")}>
                      <Camera size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 shrink-0">
                    <div className="flex flex-col items-center">
                      <Heart size={14} className="text-rose-500  mb-1" />
                      <span className="text-[9px] font-black text-white tabular-nums leading-none">74 BPM</span>
                      <span className="text-[6px] font-black text-gray-500 uppercase mt-0.5">Pulse</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="flex flex-col items-center">
                      <Activity size={14} className="text-emerald-500 mb-1" />
                      <span className="text-[9px] font-black text-white tabular-nums leading-none">98%</span>
                      <span className="text-[6px] font-black text-gray-500 uppercase mt-0.5">Stress</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative h-4 group">
                <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${replayProgress * 100}%` }} />
                </div>
                <input 
                  type="range" min="0" max="1" step="0.001" 
                  value={replayProgress} 
                  onChange={(e) => setReplayProgress(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute -top-6 left-0 text-[8px] font-black text-gray-500 uppercase">Origin</div>
                <div className="absolute -top-6 right-0 text-[8px] font-black text-gray-500 uppercase">Intercept</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVictimId && groupedResolved[selectedVictimId] && groupedResolved[selectedVictimId].length > 0 && !selectedMissionId && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="absolute top-10 right-10 w-[420px] z-30">
            <div className="bg-[#1E293B]/95 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[4px] mb-2">Evidence Chain</p>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{resolveIdentity(groupedResolved[selectedVictimId]?.[0] || {})}</h3>
                </div>
                <button onClick={() => setSelectedVictimId(null)} className="p-3 bg-white/5 rounded-2xl text-white"><ShieldAlert size={20} /></button>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                {(groupedResolved[selectedVictimId] || []).map((mission) => (
                  <div 
                    key={mission.id} 
                    onClick={() => { setSelectedMissionId(mission.id); setReplayProgress(0); }}
                    className="p-6 bg-white/5 border border-white/5 rounded-[28px] hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={cn(
                        "text-[9px] font-black uppercase",
                        mission.type === 'JOURNEY' ? "text-blue-500" : "text-emerald-500"
                      )}>
                        {mission.type === 'JOURNEY' ? 'Safe Journey Data' : 'Court Ready Log'}
                      </span>
                      <span className="text-[9px] font-black text-gray-500">
                        {mission.timestamp ? new Date(mission.timestamp.toMillis()).toLocaleDateString() : (mission.endTime ? new Date(mission.endTime.toMillis()).toLocaleDateString() : '')}
                      </span>
                    </div>
                    <h4 className="text-[12px] font-black text-white uppercase group-hover:text-blue-400 transition-all">CASE_{mission.id.slice(-12).toUpperCase()}</h4>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
