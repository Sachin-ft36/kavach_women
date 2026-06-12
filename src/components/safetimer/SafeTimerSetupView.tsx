import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

interface Props {
  inputHrs: number;
  inputMins: number;
  setInputHrs: React.Dispatch<React.SetStateAction<number>>;
  setInputMins: React.Dispatch<React.SetStateAction<number>>;
  handleMinsBlur: () => void;
  setShowConfirmation: (show: boolean) => void;
}

export default function SafeTimerSetupView({
  inputHrs, inputMins, setInputHrs, setInputMins, handleMinsBlur, setShowConfirmation
}: Props) {
  return (
    <motion.div 
      key="setup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: -20, y: 0 }}
      className="w-full max-w-xs space-y-6"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <input
              type="number"
              min="0"
              max="24"
              value={inputHrs === 0 ? '' : inputHrs}
              onChange={(e) => setInputHrs(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-4 text-center text-white font-black text-2xl outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-gray-700"
              placeholder="00"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-gray-500 tracking-widest pointer-events-none group-focus-within:text-white/70 transition-colors">
              HRS
            </div>
          </div>
          <span className="text-white/20 font-black text-2xl mb-1">:</span>
          <div className="relative flex-1 group">
            <input
              type="number"
              min="0"
              value={inputMins === 0 ? '' : inputMins}
              onChange={(e) => setInputMins(parseInt(e.target.value) || 0)}
              onBlur={handleMinsBlur}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-4 text-center text-white font-black text-2xl outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-gray-700"
              placeholder="00"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-gray-500 tracking-widest pointer-events-none group-focus-within:text-white/70 transition-colors">
              MINS
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {[15, 30, 45, 60].map(m => (
            <button 
              key={m}
              onClick={() => {
                setInputHrs(Math.floor(m / 60));
                setInputMins(m % 60);
              }}
              className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all active:scale-95"
            >
              {m >= 60 ? (m % 60 === 0 ? `${m/60} Hr` : `${Math.floor(m/60)}H ${m%60}M`) : `${m} Min`}
            </button>
          ))}
        </div>
      </div>
      <button 
        onClick={() => setShowConfirmation(true)}
        className="w-full py-5 bg-white text-black rounded-[24px] text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 shadow-2xl"
      >
        <Play size={16} fill="currentColor" /> Start Safe Timer
      </button>
    </motion.div>
  );
}
