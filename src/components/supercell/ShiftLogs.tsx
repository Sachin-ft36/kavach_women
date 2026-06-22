import React from 'react';
import { Lock, History, ShieldCheck } from 'lucide-react';

interface ShiftLogsProps {
  selectedState?: string;
  detectedAdminDistrict?: string | null;
}

export function ShiftLogs({ selectedState, detectedAdminDistrict }: ShiftLogsProps) {
  return (
    <div className="w-full h-full min-h-[600px] bg-[#0A0E1A] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
      {/* Premium Ambient Radial Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 blur-[80px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/3 left-1/3 w-[150px] h-[150px] bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Decorative Blockchain Grid watermark */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="flex flex-col items-center text-center max-w-md relative z-10 space-y-6">
        {/* Animated Icon Container */}
        <div className="relative">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-[0_0_40px_rgba(37,99,235,0.2)] animate-bounce" style={{ animationDuration: '3.5s' }}>
            <History size={36} />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0A0E1A] flex items-center justify-center text-white shadow-lg">
            <Lock size={10} />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[4px] bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
            SYSTEM UNDER SECURITY AUDIT
          </span>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tight pt-2">
            PCO SHIFT LEDGER
          </h2>
          <p className="text-[12px] font-black text-blue-400 uppercase tracking-[3px] mt-1">
            Coming Soon / शीघ्र आ रहा है
          </p>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-[320px] mx-auto pt-2 uppercase tracking-wide">
            The patrol shift registry, chronological dispatch telemetry, and biometric sign-in databases are currently undergoing stress testing.
          </p>
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl shadow-inner">
          <ShieldCheck size={14} className="text-blue-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Expected Release: Phase 17</span>
        </div>
      </div>
    </div>
  );
}

