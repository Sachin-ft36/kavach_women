import React from 'react';
import { Shield, Zap, Sparkles } from 'lucide-react';

export function WomenSafetyOPS({ activeAlerts = [], onAlertClick }: { activeAlerts?: any[], onAlertClick?: (id: string) => void, viewMode?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#0F172A] border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 text-center p-12">
        <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 mb-8 mx-auto border border-blue-500/20 shadow-2xl shadow-blue-500/10">
          <Sparkles size={48} strokeWidth={1.5} className="animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-black text-white uppercase italic tracking-[8px] mb-4">Command Ready</h2>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[4px] max-w-sm mx-auto leading-relaxed">
          The tactical feed has been migrated to SOS Alerts. This section is now reserved for your next sovereign operational module.
        </p>
        
        <div className="mt-12 flex items-center justify-center gap-4 text-blue-500/30">
          <Shield size={20} />
          <div className="h-px w-20 bg-current" />
          <Zap size={20} />
        </div>
      </div>
    </div>
  );
}
