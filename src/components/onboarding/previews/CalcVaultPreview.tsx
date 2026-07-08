import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Calculator } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  onClose: () => void;
  localPin: string;
}

export default function CalcVaultPreview({ onClose, localPin }: Props) {
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

          {/* ── STEP 1: SOS Active + HIDE button highlight ── */}
          {step === 1 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">SOS ACTIVE</span>
                </div>
                <span className="text-[8px] font-bold text-gray-500 uppercase">GRID LINK ACTIVE</span>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2 shrink-0">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-full relative z-20 shadow-[0_0_15px_rgba(37,99,235,0.8)] border border-white "
                >
                  <Calculator size={12} className="text-white animate-bounce" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">HIDE</span>
                </button>
                <span className="text-[8px] font-bold text-slate-500 bg-slate-900/50 px-2 py-1 rounded-full">PCR DISPATCHED</span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center">
                  <ShieldCheck size={32} className="text-red-500  sm:w-9 sm:h-9" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                  Responders can track your live GPS location.
                </p>
              </div>

              <div className="bg-blue-600 text-white rounded-2xl p-3 sm:p-4 text-center border border-blue-500 shadow-xl mt-auto relative z-30 shrink-0">
                <p className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider">Step 1: Disguise App</p>
                <p className="text-[8.5px] sm:text-[9.5px] font-bold text-blue-100 mt-1 leading-normal">
                  When SOS is active, click the <span className="bg-white text-blue-700 px-1 py-0.5 rounded font-black">HIDE</span> button in the top left corner to enter Decoy mode.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-2.5 sm:mt-3 w-full py-2 bg-white text-blue-700 rounded-xl text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Click "HIDE" to proceed 👉
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Calculator Decoy + PIN entry ── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden bg-[#0F172A] text-white">
              <div className="flex items-center justify-between border-b border-slate-700/55 pb-2 select-none shrink-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Decoy App Mode</span>
                <span className="text-[8px] font-bold text-[#38BDF8] uppercase bg-[#38BDF8]/10 px-2 py-0.5 rounded">CALCULATOR ACTIVE</span>
              </div>

              <div className="my-3 sm:my-4 p-3 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl text-right flex flex-col justify-end min-h-[60px] sm:min-h-[70px] relative select-none shrink-0">
                <span className="text-slate-500 text-[10px] sm:text-[11px] leading-none">25 + 50</span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 leading-none">
                  {localPin || '3420'}
                </span>
                <div className="absolute -top-3 left-4 bg-[#38BDF8] text-[7px] sm:text-[7.5px] font-black text-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md shadow-[#38BDF8]/30 ">
                  Type security PIN to open
                </div>
              </div>

              <div
                onClick={() => setStep(3)}
                className="grid grid-cols-4 gap-2 sm:gap-2.5 max-w-md mx-auto w-full cursor-pointer hover:border-[#38BDF8]/20 border border-transparent rounded-2xl p-1 transition-all"
              >
                {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '🔓'].map((key) => {
                  const isOperator = ['/', '*', '-', '+', '='].includes(key);
                  const isSpecial = ['C', '(', ')', '🔓'].includes(key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                        key === '🔓' ? "border-[#38BDF8] bg-[#38BDF8]/10 text-[#38BDF8]" :
                          isOperator ? "bg-amber-500 border-amber-600 text-white" :
                            isSpecial ? "bg-slate-700 border-slate-800 text-slate-200" :
                              "bg-slate-800 border-slate-900 text-white"
                      )}
                    >
                      {key}
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#38BDF8] text-slate-950 rounded-2xl p-3 sm:p-4 text-center shadow-xl mt-auto shrink-0">
                <p className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider">Step 2: Enter PIN to Unlock</p>
                <p className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-800 mt-1 leading-normal">
                  The app is disguised. Type your 4-digit security PIN (<span className="bg-slate-950 text-white px-1 py-0.5 rounded font-bold">{localPin || '3420'}</span>) to reveal the SOS app.
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="mt-2.5 sm:mt-3 w-full py-2 bg-slate-950 text-white rounded-xl text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
                >
                  Click keyboard to unlock 👉
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Return to SOS Screen ── */}
          {step === 3 && (
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white bg-black">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500  shrink-0" />
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">SOS ACTIVE</span>
                </div>
                <span className="text-[8px] font-bold text-gray-500">SECURE TERMINAL</span>
              </div>

              <div className="my-auto bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 text-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-2 sm:mb-3 animate-bounce">
                  <ShieldCheck size={24} className="sm:w-[26px] sm:h-[26px]" />
                </div>
                <p className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">Step 3: Vault Restored</p>
                <p className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-400/90 leading-relaxed mt-1">
                  Successful Handshake! You are returned straight back to the active SOS screen.
                </p>

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
