import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Timer } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function TimerCancelPreview({ onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-[320px] h-[80vh] max-h-[650px] bg-[#0A0502] border-2 border-amber-900/30 rounded-[32px] sm:rounded-[36px] overflow-hidden flex flex-col relative shadow-2xl"
        >
          {/* Status Bar */}
          <div className="bg-black text-[9px] font-bold text-gray-500 py-2 px-6 flex justify-between items-center border-b border-white/5 shrink-0">
            <span>09:41 AM</span>
            <span>5G | 🔋 98%</span>
          </div>

          {/* Mock Screen Content */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white font-sans">
            {/* Timer Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 shrink-0">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">SAFETY TIMER RUNNING</span>
              <span className="text-[8px] font-bold text-gray-500 uppercase">STANDBY MODE</span>
            </div>

            {/* Countdown Circle */}
            <div className="flex-1 flex flex-col items-center justify-center my-3 sm:my-4 relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-dashed border-amber-500/40 flex flex-col items-center justify-center ">
                <span className="text-2xl sm:text-3xl font-black text-amber-500">00:42</span>
                <span className="text-[6.5px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest">SECONDS</span>
              </div>
              <p className="text-[8px] sm:text-[8.5px] font-bold text-slate-400 uppercase mt-3 sm:mt-4 text-center">
                Automatic SOS triggers when timer reaches 0
              </p>
            </div>

            {/* PIN Input field overlay */}
            <div className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-3 sm:p-4 text-center shadow-lg relative my-2 sm:my-3 shrink-0">
              <Lock size={14} className="text-amber-500 mx-auto mb-1.5 sm:w-4 sm:h-4" />
              <h4 className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">Cancel Safety Timer</h4>
              <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5">Enter Security PIN to Abort Countdown</p>

              <div className="flex justify-center gap-2 mt-2 sm:mt-2.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-amber-500/40 bg-amber-500/20" />
                ))}
              </div>

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-[6.5px] sm:text-[7px] font-black text-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md shadow-amber-500/30">
                PIN Verification Overlay
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mt-auto shrink-0">
              <p className="text-[7px] sm:text-[7.5px] font-bold text-amber-500 text-center leading-normal uppercase">
                Cancelling the timer stops the broadcast &amp; prevents false alerts.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors border-t border-slate-800 shrink-0"
          >
            Close Preview
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
