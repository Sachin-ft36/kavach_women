import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  stopTimer: () => void;
}

export default function SafeTimerActiveView({ stopTimer }: Props) {
  return (
    <motion.div
      key="active"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xs space-y-8"
    >
      <div className="p-6 bg-accent-red/5 border border-accent-red/20 rounded-3xl space-y-3">
        <div className="flex items-center justify-center gap-2 text-accent-red">
          <AlertCircle size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Fail-Safe Protocol</span>
        </div>
        <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed px-4">If you don't confirm safety by timer end, a full SOS alert will be sent to all guardians.</p>
      </div>

      <button
        onClick={stopTimer}
        className="w-full py-5 bg-accent-green text-black rounded-[24px] text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 shadow-xl shadow-accent-green/20"
      >
        <ShieldCheck size={18} /> I am Safe Now
      </button>
    </motion.div>
  );
}
