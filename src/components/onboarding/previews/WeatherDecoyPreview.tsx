import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Shield, Eye, CloudSun } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function WeatherDecoyPreview({ onClose }: Props) {
  const [step, setStep] = useState(1);

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
          className="w-full max-w-[320px] h-[80vh] max-h-[650px] bg-[#080000] border-2 border-slate-800 rounded-[32px] sm:rounded-[36px] overflow-hidden flex flex-col relative shadow-2xl"
        >
          {/* Status Bar */}
          <div className="bg-black text-[9px] font-bold text-gray-500 py-2 px-6 flex justify-between items-center border-b border-white/5 shrink-0">
            <span>09:41 AM</span>
            <span>5G | 🔋 98%</span>
          </div>

          {/* ── STEP 1: Kavach App with glowing Eye icon ── */}
          {step === 1 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-[#2563EB]" />
                  <span className="text-[9px] font-black tracking-wider text-slate-200">Kavach Grid</span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setStep(2)}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-[#2563EB]/25 border-2 border-[#2563EB] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                  >
                    <Eye size={10} className="text-white animate-pulse sm:w-3 sm:h-3" />
                  </button>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-500 overflow-hidden" />
                  <div className="absolute top-8 sm:top-9 right-0 bg-blue-600 text-[7px] sm:text-[8px] font-black text-white px-2 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap shadow-lg z-20 border border-blue-400/30 animate-bounce">
                    👈 Click Eye to Disguise App
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center my-4 sm:my-6 text-center space-y-3 sm:space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-[#2563EB] sm:w-[28px] sm:h-[28px]" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200">Kavach Safety Active</h4>
                  <p className="text-[7.5px] sm:text-[8px] text-slate-400 uppercase tracking-widest mt-1">Grid Protection Connected</p>
                </div>
              </div>

              <div className="bg-[#111] border border-blue-500/20 rounded-2xl p-3 text-center mb-2 shrink-0">
                <h5 className="text-[8.5px] sm:text-[9px] font-black text-blue-500 uppercase tracking-wider">Step 1: Disguise App</h5>
                <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-relaxed">
                  Tap the 'Eye' icon next to your profile photo to instantly mask Kavach under a weather interface.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Climate Pro Weather App ── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden bg-gradient-to-b from-[#1E3A8A] to-[#0F172A] text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <CloudSun size={14} className="text-yellow-400 animate-pulse" />
                  <span className="text-[9px] font-black tracking-wider text-slate-200">Climate Pro</span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setStep(3)}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-sky-500/25 border-2 border-sky-400 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                  >
                    <Eye size={10} className="text-white animate-pulse sm:w-3 sm:h-3" />
                  </button>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-500/50 overflow-hidden" />
                  <div className="absolute top-8 sm:top-9 right-0 bg-sky-500 text-[7px] sm:text-[8px] font-black text-black px-2 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap shadow-lg z-20 border border-sky-300/30 animate-bounce">
                    👈 Click Eye to Exit Decoy
                  </div>
                </div>
              </div>

              <div className="text-center my-4 sm:my-6 space-y-1 flex-1 flex flex-col justify-center">
                <p className="text-[11px] sm:text-xs font-bold text-slate-300">New Delhi</p>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter">28°C</p>
                <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Partly Cloudy</p>
                <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-500 mt-1">Wind: 14 km/h | Humidity: 55%</p>
              </div>

              <div className="bg-[#111]/80 border border-sky-500/20 rounded-2xl p-3 text-center mb-2 shrink-0">
                <h5 className="text-[8.5px] sm:text-[9px] font-black text-sky-400 uppercase tracking-wider">Step 2: Unhide Prompt</h5>
                <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-relaxed">
                  Tap the 'Eye' icon again inside the Climate Pro decoy app to trigger the PIN shield.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Security PIN Dialog ── */}
          {step === 3 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden bg-[#0A0D14] text-white">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 opacity-20 shrink-0">
                <div className="flex items-center gap-1.5">
                  <CloudSun size={14} className="text-yellow-400" />
                  <span className="text-[9px] font-black tracking-wider text-slate-200">Climate Pro</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center my-3 sm:my-4 relative">
                <div className="w-full bg-[#111] border-2 border-blue-500 rounded-3xl p-4 sm:p-5 text-center shadow-[0_0_24px_rgba(37,99,235,0.45)]">
                  <Lock size={16} className="text-blue-500 mx-auto mb-1.5 sm:w-[18px] sm:h-[18px]" />
                  <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">Identity Verification</h4>
                  <p className="text-[7.5px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 leading-relaxed">
                    Enter Security PIN to Abort Decoy
                  </p>

                  <div className="flex justify-center gap-2 mt-2 sm:mt-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-blue-500/40 bg-blue-500/20" />
                    ))}
                  </div>

                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[6.5px] sm:text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md shadow-blue-600/30">
                    PIN Dialog Active
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-blue-500/20 rounded-2xl p-3 text-center mb-2 z-10 shrink-0">
                <h5 className="text-[8.5px] sm:text-[9px] font-black text-blue-500 uppercase tracking-wider">Step 3: Verify Identity</h5>
                <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-relaxed mb-2 sm:mb-3">
                  Type your 4-digit security PIN to verify yourself and exit the weather decoy.
                </p>
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md"
                >
                  ⌨️ Type PIN (Simulate Press)
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Successfully Unlocked ── */}
          {step === 4 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white bg-[#030605]">
              <div className="flex-1 flex flex-col items-center justify-center my-4 sm:my-6 text-center space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                  <ShieldCheck size={24} className="text-emerald-500 sm:w-[28px] sm:h-[28px]" />
                </div>
                <div className="space-y-1.5 px-2">
                  <h4 className="text-[10px] sm:text-[11px] font-black uppercase text-emerald-500 tracking-wider">Successfully Unlocked</h4>
                  <p className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-300 leading-normal uppercase">
                    Decoy Mode Exited! You have safely returned to the Kavach grid.
                  </p>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="mt-3 sm:mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                >
                  🔄 Restart Walkthrough
                </button>
              </div>

              <div className="mt-auto space-y-2.5 sm:space-y-3 opacity-60 shrink-0">
                <div className="bg-[#1A1A2E] border border-white/5 rounded-[20px] p-1.5">
                  <div className="w-full py-2.5 sm:py-3 bg-white text-black rounded-[14px] font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-2">
                    <Lock size={10} />
                    I AM SAFE NOW
                  </div>
                </div>
                <p className="text-[6px] font-black text-white/20 uppercase tracking-[2px] text-center">Kavach Grid link Secure</p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => { onClose(); setStep(1); }}
            className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors border-t border-slate-800 shrink-0"
          >
            Close Preview
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
