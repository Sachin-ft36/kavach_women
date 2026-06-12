import React from 'react';
import { ShieldCheck, Shield } from 'lucide-react';

interface Props {
  handleConfirmSafety: () => void;
  handleRequestMoreHelp: () => void;
}

export default function SafetyHandshakePopup({ handleConfirmSafety, handleRequestMoreHelp }: Props) {
  return (
    <div className="absolute inset-0 z-[7000] flex items-center justify-center p-8 bg-black/90">
      <div className="relative w-full max-w-[340px] bg-[#111] border border-white/10 rounded-[40px] p-8 text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <ShieldCheck size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Response Verification</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action Required</p>
          </div>
        </div>

        <p className="text-[13px] font-bold text-white/70 leading-relaxed px-2 uppercase tracking-wide">
          The assigned protector has completed the emergency response. Please verify your safety status.
        </p>

        <div className="pt-4 space-y-3">
          <button
            onClick={handleConfirmSafety}
            className="w-full py-6 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-[4px] text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            SAFE
          </button>
          <button
            onClick={handleRequestMoreHelp}
            className="w-full py-6 bg-white/5 text-gray-400 rounded-[24px] font-black uppercase tracking-[4px] text-[10px] border border-white/5 active:scale-95 transition-all"
          >
            REQUEST HELP
          </button>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2.5 opacity-30">
          <Shield size={10} className="text-white" />
          <span className="text-[7px] font-black uppercase tracking-[3px] text-white">Kavach Handshake Protocol Active</span>
        </div>
      </div>
    </div>
  );
}
