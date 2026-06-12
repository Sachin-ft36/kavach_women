import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, ShieldCheck, ShieldAlert, Power, Calculator, Timer, Eye, Landmark, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

import SOSCancelPreview from './previews/SOSCancelPreview';
import CalcVaultPreview from './previews/CalcVaultPreview';
import TimerCancelPreview from './previews/TimerCancelPreview';
import WeatherDecoyPreview from './previews/WeatherDecoyPreview';

interface SecurityPinStepProps {
  pin: string;
  setPin: (pin: string) => void;
  onNext: () => void;
  isKeyboardOpen?: boolean;
}

export default function SecurityPinStep({ pin, setPin, onNext, isKeyboardOpen }: SecurityPinStepProps) {
  const [localPin, setLocalPin] = useState(pin);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [showSosPreview, setShowSosPreview] = useState(false);
  const [showCalcPreview, setShowCalcPreview] = useState(false);
  const [showTimerPreview, setShowTimerPreview] = useState(false);
  const [showClimatePreview, setShowClimatePreview] = useState(false);

  const handlePress = (val: string) => {
    if (localPin.length < 4) {
      const newPin = localPin + val;
      setLocalPin(newPin);

      if (newPin.length === 4) {
        const isRepeating = /^(\d)\1{3}$/.test(newPin);
        const sequentialPins = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];

        if (isRepeating || sequentialPins.includes(newPin)) {
          toast.error("Weak Security PIN! Avoid using repeating (e.g. 0000) or sequential (e.g. 1234) numbers.");
          setTimeout(() => { setLocalPin(''); setPin(''); }, 400);
          return;
        }

        setPin(newPin);
      }
    }
  };

  const handleClear = () => { setLocalPin(''); setPin(''); };

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        {/* ── VIEW 1: PIN ENTRY ── */}
        {!showGuidelines ? (
          <motion.div
            key="pin-entry"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col space-y-4 py-2 overflow-y-auto custom-scrollbar"
          >
            <div className="flex flex-col items-center space-y-2 mt-2 mb-1 text-center shrink-0">
              <Landmark className="text-[#000080]" size={36} strokeWidth={1.5} />
              <div className="space-y-0.5">
                <h2 className="text-[16px] sm:text-[18px] font-black tracking-widest text-[#000080] uppercase">Security Clearance</h2>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">National Safety Grid • Form 4A</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-300 pb-2 px-1 shrink-0">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#000080]">Establish Authentication</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mandatory Step</span>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden relative flex flex-col items-center py-5 sm:py-6 shrink-0 w-full">
              {/* Tricolor Top Band */}
              <div className="absolute top-0 left-0 h-1.5 w-full flex">
                <div className="h-full flex-1 bg-[#FF9933]" />
                <div className="h-full flex-1 bg-white" />
                <div className="h-full flex-1 bg-[#138808]" />
              </div>

              <div className="flex flex-col items-center text-center space-y-1 mt-1 sm:mt-2 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 border border-blue-100 rounded-sm flex items-center justify-center mb-1.5 sm:mb-2">
                  <Lock className="text-[#000080]" size={20} strokeWidth={2} />
                </div>
                <h2 className="text-xs sm:text-sm font-black text-[#000080] uppercase tracking-widest">Setup 4-Digit PIN</h2>
                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider">Required for disabling SOS &amp; Decoy</p>
              </div>

              {/* PIN Dots */}
              <div className="flex gap-3 sm:gap-4 my-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-all duration-300 border",
                      localPin[i] ? "bg-[#000080] border-[#000080] shadow-sm" : "bg-slate-100 border-slate-300"
                    )}
                  />
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-y-2 sm:gap-y-3 gap-x-4 sm:gap-x-6 w-full max-w-[240px] sm:max-w-[280px] mt-4 sm:mt-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handlePress(num.toString())}
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-slate-50 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-xl sm:text-2xl font-black text-[#000080] transition-all flex items-center justify-center shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-slate-50 hover:bg-red-50 active:bg-red-100 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all shadow-sm"
                >
                  <Delete size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => handlePress('0')}
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-slate-50 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-xl sm:text-2xl font-black text-[#000080] transition-all flex items-center justify-center shadow-sm"
                >
                  0
                </button>
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center text-[#000080]/20 bg-slate-50 border border-slate-200 shadow-sm">
                  <ShieldCheck size={22} strokeWidth={2} className="sm:w-[26px] sm:h-[26px]" />
                </div>
              </div>
            </div>

            <button
              disabled={localPin.length < 4}
              onClick={() => setShowGuidelines(true)}
              className={cn(
                "w-full py-3.5 sm:py-4 mt-auto rounded-md font-black text-[10px] sm:text-[11px] tracking-widest uppercase transition-all shadow-sm flex items-center justify-center gap-2 shrink-0",
                localPin.length === 4
                  ? "bg-[#000080] text-white hover:bg-blue-900 active:scale-[0.99] border-none"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              )}
            >
              Verify &amp; Proceed To Directives
            </button>
          </motion.div>
        ) : (
        /* ── VIEW 2: SAFETY DIRECTIVES ── */
          <motion.div
            key="pin-guidelines"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col space-y-3 py-1 min-h-0 text-slate-800 overflow-y-auto custom-scrollbar"
          >
            <div className="flex flex-col items-center space-y-2 mt-2 mb-1 text-center shrink-0">
              <Landmark className="text-[#000080] sm:w-9 sm:h-9" size={32} strokeWidth={1.5} />
              <div className="space-y-0.5">
                <h2 className="text-[16px] sm:text-[18px] font-black tracking-widest text-[#000080] uppercase">Safety Directives</h2>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mandatory Interactive Tutorials</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-2 border-[#000080] px-3 py-2 flex items-start gap-2.5 rounded-r-sm mb-1 sm:mb-2 shrink-0">
              <Info size={14} className="text-[#000080] shrink-0 mt-0.5" />
              <p className="text-[8.5px] sm:text-[9.5px] font-bold text-[#000080] uppercase tracking-wide leading-relaxed">
                Review the following operational modules to understand PIN usage during active threats.
              </p>
            </div>

            <div className="space-y-3 flex-col flex shrink-0">
              {/* Module 1: Weather Decoy */}
              <div className="bg-white border border-slate-300 rounded-sm p-3.5 sm:p-4 shadow-sm hover:border-[#000080] transition-colors shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 border border-sky-100">
                    <Eye size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black text-[#000080] uppercase tracking-wider">Module 1: Weather Decoy</h4>
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 leading-relaxed mt-2.5">
                  Disguises the grid as a weather forecast. Tap eye icon next to profile; enter PIN to disable decoy.
                </p>
                <button type="button" onClick={() => setShowClimatePreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#000080] border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all">
                  [ INITIATE TUTORIAL ]
                </button>
              </div>

              {/* Module 2: Stop SOS Alarm */}
              <div className="bg-white border border-slate-300 rounded-sm p-3.5 sm:p-4 shadow-sm hover:border-red-600 transition-colors shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm bg-red-50 flex items-center justify-center text-red-600 shrink-0 border border-red-100">
                    <Power size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black text-red-800 uppercase tracking-wider">Module 2: Stop SOS Alarm</h4>
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 leading-relaxed mt-2.5">
                  PIN is strictly required to terminate active SOS tracking, silence sirens, and stand down police response.
                </p>
                <button type="button" onClick={() => setShowSosPreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-red-700 border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all">
                  [ INITIATE TUTORIAL ]
                </button>
              </div>

              {/* Module 3: Calculator Vault */}
              <div className="bg-white border border-slate-300 rounded-sm p-3.5 sm:p-4 shadow-sm hover:border-[#000080] transition-colors shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                    <Calculator size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black text-[#000080] uppercase tracking-wider">Module 3: Calculator Vault</h4>
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 leading-relaxed mt-2.5">
                  Masks the safety grid as a standard calculator. Input your Security PIN directly on the keypad to unlock.
                </p>
                <button type="button" onClick={() => setShowCalcPreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#000080] border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all">
                  [ INITIATE TUTORIAL ]
                </button>
              </div>

              {/* Module 4: Standby Timer */}
              <div className="bg-white border border-slate-300 rounded-sm p-3.5 sm:p-4 shadow-sm hover:border-amber-600 transition-colors shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                    <Timer size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black text-amber-800 uppercase tracking-wider">Module 4: Standby Timer</h4>
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 leading-relaxed mt-2.5">
                  Input PIN to abort the automatic safety countdown timer before an emergency broadcast is triggered.
                </p>
                <button type="button" onClick={() => setShowTimerPreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all">
                  [ INITIATE TUTORIAL ]
                </button>
              </div>
            </div>

            {/* Acknowledgement Checkbox */}
            <div
              onClick={() => setUnderstood(!understood)}
              className="mt-2 bg-slate-50 border border-slate-300 p-3.5 sm:p-4 rounded-sm flex items-start gap-3 cursor-pointer hover:bg-blue-50/30 transition-colors shrink-0"
            >
              <div className={cn(
                "w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-sm flex items-center justify-center shrink-0 transition-colors mt-0.5",
                understood ? "bg-[#000080] border-[#000080]" : "bg-white border-slate-400"
              )}>
                {understood && <CheckCircle2 size={12} className="text-white sm:w-3.5 sm:h-3.5" strokeWidth={3} />}
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 leading-relaxed uppercase tracking-wider">
                I acknowledge that this Security PIN is classified and critical for emergency override. It must not be shared.
              </span>
            </div>

            {/* Submit Button */}
            <button
              disabled={!understood}
              onClick={onNext}
              className={cn(
                "w-full py-3.5 sm:py-4 rounded-md font-black text-[10px] sm:text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all mt-2 shrink-0 mb-4",
                understood
                  ? "bg-[#000080] text-white hover:bg-blue-900 active:scale-[0.99] border-none shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              )}
            >
              <ShieldCheck size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
              <span>Authorize &amp; Register PIN</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TUTORIAL MODALS ── */}
      {showSosPreview && <SOSCancelPreview onClose={() => setShowSosPreview(false)} />}
      {showCalcPreview && <CalcVaultPreview onClose={() => setShowCalcPreview(false)} localPin={localPin} />}
      {showTimerPreview && <TimerCancelPreview onClose={() => setShowTimerPreview(false)} />}
      {showClimatePreview && <WeatherDecoyPreview onClose={() => setShowClimatePreview(false)} />}
    </div>
  );
}