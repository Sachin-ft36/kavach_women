import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function SOSCancelPreview({ onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-[320px] h-[80vh] max-h-[650px] bg-[#080000] border-2 border-slate-800 rounded-[32px] sm:rounded-[36px] overflow-hidden flex flex-col relative shadow-2xl"
        >
          {/* Status Bar */}
          <div className="bg-black text-[9px] font-bold text-gray-500 py-2 px-6 flex justify-between items-center border-b border-white/5 select-none">
            <span>09:41 AM</span>
            <span>5G | 🔋 98%</span>
          </div>

          {/* Mock Screen Content */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden">
            {/* SOS Pulse Header */}
            <div className="flex items-center justify-between border-b border-red-500/20 pb-2 select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">SOS ACTIVE</span>
              </div>
              <span className="text-[8px] font-bold text-gray-500 uppercase">TIER 1 DISPATCH</span>
            </div>

            {/* Radar Area */}
            <div className="flex-1 flex items-center justify-center relative my-3 rounded-2xl bg-[#050608] border border-white/5 overflow-hidden select-none">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(#3B82F6 1px, transparent 1px)`, backgroundSize: `16px 16px` }} />
              <div className="w-20 h-20 rounded-full border border-blue-500/10 flex items-center justify-center ">
                <div className="w-12 h-12 rounded-full border border-blue-500/20 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 bg-blue-500/80 rounded-full" />
                </div>
              </div>
            </div>

            {/* PIN Prompt Overlay */}
            <div className="absolute inset-x-4 top-14 bg-[#111] border-2 border-blue-500 rounded-3xl p-4 sm:p-5 text-center shadow-[0_0_20px_rgba(37,99,235,0.3)] ">
              <Lock size={16} className="text-blue-500 mx-auto mb-1.5" />
              <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">Identity Verification</h4>
              <p className="text-[7.5px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 leading-relaxed">Enter Security PIN to Abort SOS</p>

              <div className="flex justify-center gap-2 mt-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full border border-blue-500/40 bg-blue-500/20" />
                ))}
              </div>

              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[6.5px] sm:text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md shadow-blue-600/30">
                Verification PIN Dialog
              </div>
            </div>

            {/* Bottom Action Area */}
            <div className="mt-auto space-y-2.5 select-none shrink-0">
              <div className="bg-[#1A1A2E] border border-white/5 rounded-[20px] p-1.5 opacity-60">
                <div className="w-full py-2.5 sm:py-3 bg-white text-black rounded-[14px] font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-2">
                  <Lock size={10} />
                  I AM SAFE NOW
                </div>
              </div>
              <p className="text-[6px] font-black text-white/20 uppercase tracking-[2px] text-center">Kavach Safety Grid Secure</p>
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
