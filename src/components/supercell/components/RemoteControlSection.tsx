import React from 'react';
import { Bell, Shield, Activity, Zap, Cpu, MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface RemoteControlSectionProps {
  selectedState: string;
  activeAlerts: any[];
  womenUsers: any[];
  activeTargetId: string | null;
  setActiveTargetId: (id: string | null) => void;
  handleHardwareTrigger: (id: string, label: string) => void;
}

export function RemoteControlSection({
  selectedState,
  activeAlerts,
  womenUsers,
  activeTargetId,
  setActiveTargetId,
  handleHardwareTrigger
}: RemoteControlSectionProps) {
  return (
    <div className="h-full flex flex-col gap-6 p-8 overflow-y-auto custom-scrollbar">
      <div className="bg-[#0F172A] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group shrink-0">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Zap size={200} className="text-rose-500" /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-[4px]">Tactical Hardware Link</div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full " />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Protocol: KAVACH-NATIVE-V2</span>
            </div>
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Remote Command Interface</h2>
          <p className="text-gray-400 text-sm font-bold mt-4 max-w-2xl uppercase tracking-tight leading-relaxed">
            Direct hardware-level orchestration for all active nodes in the {selectedState} sector. Authorization required for destructive overrides.
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
          <MapPin size={14} className="text-rose-500" />
          Live Target Selection ({activeAlerts.length})
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
          {activeAlerts.length === 0 ? (
            <div className="w-full py-12 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center opacity-40">
              <Activity size={30} className="mb-4 text-gray-400" />
              <p className="text-[8px] font-black uppercase tracking-widest">No Active Field Targets</p>
            </div>
          ) : activeAlerts.map(alert => {
            const isSelected = activeTargetId === alert.id;
            return (
              <button 
                key={alert.id}
                onClick={() => setActiveTargetId(alert.id)}
                className={cn(
                  "min-w-[240px] p-6 rounded-[2.5rem] border transition-all text-left group relative overflow-hidden",
                  isSelected 
                    ? "bg-rose-600 border-rose-600 shadow-xl shadow-rose-600/20 text-white" 
                    : "bg-white border-gray-100 hover:border-rose-200 text-gray-900 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", isSelected ? "bg-white/20 border-white/20" : "bg-rose-50 border-rose-100 text-rose-600")}>
                    <Heart size={14} />
                  </div>
                  <div className={cn("px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest", isSelected ? "bg-white/20" : "bg-rose-100 text-rose-600")}>
                    {alert.status || 'SOS'}
                  </div>
                </div>
                <h4 className="text-[11px] font-black uppercase truncate leading-none">
                  {womenUsers.find(u => u.id === (alert.victimUid || alert.userId))?.name || alert.victimName || 'Citizen'}
                </h4>
                <p className={cn("text-[7px] font-bold uppercase mt-2 tracking-widest", isSelected ? "text-white/60" : "text-gray-400")}>
                  {alert.location?.city || 'Vector Unknown'} // {alert.batteryLevel}% PWR
                </p>
                {isSelected && <motion.div layoutId="targetGlow" className="absolute inset-0 bg-white/5 pointer-events-none" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {[
          { id: 'siren', label: 'Remote Siren', icon: Bell, color: 'bg-rose-500', desc: 'Trigger 110dB SOS Siren' },
          { id: 'forensic', label: 'Forensic Capture', icon: Shield, color: 'bg-blue-600', desc: 'Remote A/V Stream' },
          { id: 'biometric', label: 'Biometric Pulse', icon: Activity, color: 'bg-emerald-600', desc: 'Live Vital Snapshot' },
          { id: 'lockdown', label: 'Tactical Lockout', icon: Zap, color: 'bg-gray-900', desc: 'Emergency App Disable' }
        ].map((cmd) => (
          <button 
            key={cmd.id}
            disabled={!activeTargetId}
            onClick={() => handleHardwareTrigger(cmd.id, cmd.label)}
            className={cn(
              "bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm transition-all group flex flex-col items-center text-center relative overflow-hidden disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed",
              activeTargetId && "hover:shadow-xl hover:border-rose-200 active:scale-95"
            )}
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl transition-transform", cmd.color, activeTargetId && "group-hover:scale-110")}>
              <cmd.icon size={30} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">{cmd.label}</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cmd.desc}</p>
            <div className="mt-8 w-full h-[1px] bg-gray-50" />
            <div className="mt-4 flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", activeTargetId ? "bg-emerald-500 " : "bg-gray-300")} />
              <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{activeTargetId ? 'Link Ready' : 'Awaiting Target'}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-[300px] bg-[#020617] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden flex flex-col justify-center items-center text-center">
        <div className="absolute inset-0 bg-rose-600/5 blur-3xl" />
        <div className="relative z-10 max-w-md">
          <div className="w-20 h-20 bg-rose-600/10 rounded-[32px] border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-2xl">
            <Cpu size={40} className="" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Authorized Control Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase">Socket Latency</span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">14ms // Secure</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase">Encryption</span>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">AES-256-GCM</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] font-black text-gray-500 uppercase">Selected Target</span>
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                {activeTargetId ? (
                  womenUsers.find(u => u.id === activeAlerts.find(a => a.id === activeTargetId)?.victimUid)?.name || 
                  activeAlerts.find(a => a.id === activeTargetId)?.victimName?.toUpperCase() || 
                  'ACTIVE TARGET'
                ) : 'NONE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
