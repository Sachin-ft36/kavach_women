import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, ShieldCheck, Shield, ShieldAlert, Power, Calculator, Timer, Eye, CloudSun, Landmark, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

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
  const [calcPreviewStep, setCalcPreviewStep] = useState(1);
  const [showTimerPreview, setShowTimerPreview] = useState(false);
  const [showClimatePreview, setShowClimatePreview] = useState(false);
  const [climatePreviewStep, setClimatePreviewStep] = useState(1);

  const handlePress = (val: string) => {
    if (localPin.length < 4) {
      const newPin = localPin + val;
      setLocalPin(newPin);

      if (newPin.length === 4) {
        const isRepeating = /^(\d)\1{3}$/.test(newPin);
        const sequentialPins = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];

        if (isRepeating || sequentialPins.includes(newPin)) {
          toast.error("Weak Security PIN! Avoid using repeating (e.g. 0000) or sequential (e.g. 1234) numbers.");
          setTimeout(() => {
            setLocalPin('');
            setPin('');
          }, 400);
          return;
        }

        setPin(newPin);
      }
    }
  };

  const handleClear = () => {
    setLocalPin('');
    setPin('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        {!showGuidelines ? (
          <motion.div
            key="pin-entry"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col space-y-4 py-2 overflow-y-auto custom-scrollbar"
          >
            {/* Official Header */}
            <div className="flex flex-col items-center space-y-2 mt-2 mb-1 text-center shrink-0">
              <Landmark className="text-[#000080]" size={36} strokeWidth={1.5} />
              <div className="space-y-0.5">
                <h2 className="text-[16px] sm:text-[18px] font-black tracking-widest text-[#000080] uppercase">
                  Security Clearance
                </h2>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  National Safety Grid • Form 4A
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-300 pb-2 px-1 shrink-0">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#000080]">Establish Authentication</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mandatory Step</span>
            </div>

            {/* Official Form Container - Added shrink-0 to prevent flexbox crushing on small screens */}
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden relative flex flex-col items-center py-5 sm:py-6 shrink-0 w-full">
              {/* Tricolor Top Band */}
              <div className="absolute top-0 left-0 h-1.5 w-full flex">
                <div className="h-full flex-1 bg-[#FF9933]"></div>
                <div className="h-full flex-1 bg-white"></div>
                <div className="h-full flex-1 bg-[#138808]"></div>
              </div>

              <div className="flex flex-col items-center text-center space-y-1 mt-1 sm:mt-2 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 border border-blue-100 rounded-sm flex items-center justify-center mb-1.5 sm:mb-2">
                  <Lock className="text-[#000080]" size={20} strokeWidth={2} />
                </div>
                <h2 className="text-xs sm:text-sm font-black text-[#000080] uppercase tracking-widest">Setup 4-Digit PIN</h2>
                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider">Required for disabling SOS & Decoy</p>
              </div>

              {/* PIN Dots */}
              <div className="flex gap-3 sm:gap-4 my-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-all duration-300 border",
                      localPin[i]
                        ? "bg-[#000080] border-[#000080] shadow-sm"
                        : "bg-slate-100 border-slate-300"
                    )}
                  />
                ))}
              </div>

              {/* Keypad - Made buttons smaller on mobile (w-14 instead of w-16) to fit screen */}
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
              Verify & Proceed To Directives
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="pin-guidelines"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col space-y-3 py-1 min-h-0 text-slate-800 overflow-y-auto custom-scrollbar"
          >
            {/* Directive Header */}
            <div className="flex flex-col items-center space-y-2 mt-2 mb-1 text-center shrink-0">
              <Landmark className="text-[#000080 ] sm:w-9 sm:h-9" size={32} strokeWidth={1.5} />
              <div className="space-y-0.5">
                <h2 className="text-[16px] sm:text-[18px] font-black tracking-widest text-[#000080] uppercase">
                  Safety Directives
                </h2>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Mandatory Interactive Tutorials
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-2 border-[#000080] px-3 py-2 flex items-start gap-2.5 rounded-r-sm mb-1 sm:mb-2 shrink-0">
              <Info size={14} className="text-[#000080] shrink-0 mt-0.5" />
              <p className="text-[8.5px] sm:text-[9.5px] font-bold text-[#000080] uppercase tracking-wide leading-relaxed">
                Review the following operational modules to understand PIN usage during active threats.
              </p>
            </div>

            {/* Grid of Guidelines - Changed to let the parent scroll smoothly */}
            <div className="space-y-3 flex-col flex shrink-0">
              
              {/* Card 1: Climate Pro Weather Decoy */}
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
                <button
                  type="button"
                  onClick={() => setShowClimatePreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#000080] border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all"
                >
                  [ INITIATE TUTORIAL ]
                </button>
              </div>

              {/* Card 2: SOS Cancel */}
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
                <button
                  type="button"
                  onClick={() => setShowSosPreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-red-700 border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all"
                >
                  [ INITIATE TUTORIAL ]
                </button>
              </div>

              {/* Card 3: Calculator Decoy */}
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
                <button
                  type="button"
                  onClick={() => setShowCalcPreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#000080] border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all"
                >
                  [ INITIATE TUTORIAL ]
                </button>
              </div>

              {/* Card 4: Cancel Timer */}
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
                <button
                  type="button"
                  onClick={() => setShowTimerPreview(true)}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300 rounded-sm text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest transition-all"
                >
                  [ INITIATE TUTORIAL ]
                </button>
              </div>
            </div>

            {/* Checkbox agreement */}
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

            {/* Action Proceed Button */}
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
              <span>Authorize & Register PIN</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Preview Modal */}
      <AnimatePresence>
        {showSosPreview && (
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
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">SOS ACTIVE</span>
                  </div>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">TIER 1 DISPATCH</span>
                </div>

                {/* Radar Area */}
                <div className="flex-1 flex items-center justify-center relative my-3 rounded-2xl bg-[#050608] border border-white/5 overflow-hidden select-none">
                  <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(#3B82F6 1px, transparent 1px)`, backgroundSize: `16px 16px` }} />
                  <div className="w-20 h-20 rounded-full border border-blue-500/10 flex items-center justify-center animate-pulse">
                    <div className="w-12 h-12 rounded-full border border-blue-500/20 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 bg-blue-500/80 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>

                {/* PIN Prompt Overlay at Center-Top */}
                <div className="absolute inset-x-4 top-14 bg-[#111] border-2 border-blue-500 rounded-3xl p-4 sm:p-5 text-center shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-pulse">
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
                onClick={() => setShowSosPreview(false)}
                className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors border-t border-slate-800 shrink-0"
              >
                Close Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculator Preview Modal (Interactive Walkthrough) */}
      <AnimatePresence>
        {showCalcPreview && (
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

              {/* ----------------- STEP 1: ACTIVE SOS & HIDE BUTTON HIGHLIGHT ----------------- */}
              {calcPreviewStep === 1 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white">
                  {/* Pulsing Alert Header */}
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">SOS ACTIVE</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase">GRID LINK ACTIVE</span>
                  </div>

                  {/* Header HIDE button (Pulsing highlight) */}
                  <div className="relative z-10 flex items-center justify-between pt-2 shrink-0">
                    <button
                      onClick={() => setCalcPreviewStep(2)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-full relative z-20 shadow-[0_0_15px_rgba(37,99,235,0.8)] border border-white animate-pulse"
                    >
                      <Calculator size={12} className="text-white animate-bounce" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">HIDE</span>
                    </button>
                    <span className="text-[8px] font-bold text-slate-500 bg-slate-900/50 px-2 py-1 rounded-full">PCR DISPATCHED</span>
                  </div>

                  {/* SOS Secure Circle Graphic */}
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center">
                      <ShieldCheck size={32} className="text-red-500 animate-pulse sm:w-9 sm:h-9" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                      Responders can track your live GPS location.
                    </p>
                  </div>

                  {/* Walkthrough Tooltip */}
                  <div className="bg-blue-600 text-white rounded-2xl p-3 sm:p-4 text-center border border-blue-500 shadow-xl mt-auto relative z-30 shrink-0">
                    <p className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider">Step 1: Disguise App</p>
                    <p className="text-[8.5px] sm:text-[9.5px] font-bold text-blue-100 mt-1 leading-normal">
                      When SOS is active, click the <span className="bg-white text-blue-700 px-1 py-0.5 rounded font-black">HIDE</span> button in the top left corner to enter Decoy mode.
                    </p>
                    <button
                      onClick={() => setCalcPreviewStep(2)}
                      className="mt-2.5 sm:mt-3 w-full py-2 bg-white text-blue-700 rounded-xl text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Click "HIDE" to proceed 👉
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 2: CALCULATOR DECOY & PIN ENTER ----------------- */}
              {calcPreviewStep === 2 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden bg-[#0F172A] text-white">
                  {/* Calculator Decoy Header */}
                  <div className="flex items-center justify-between border-b border-slate-700/55 pb-2 select-none shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Decoy App Mode</span>
                    <span className="text-[8px] font-bold text-[#38BDF8] uppercase bg-[#38BDF8]/10 px-2 py-0.5 rounded">CALCULATOR ACTIVE</span>
                  </div>

                  {/* Display Area */}
                  <div className="my-3 sm:my-4 p-3 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl text-right flex flex-col justify-end min-h-[60px] sm:min-h-[70px] relative select-none shrink-0">
                    <span className="text-slate-500 text-[10px] sm:text-[11px] leading-none">25 + 50</span>
                    <span className="text-xl sm:text-2xl font-bold text-white mt-1 leading-none">
                      {localPin || '3420'}
                    </span>

                    {/* Blinking highlight overlay pointing to input */}
                    <div className="absolute -top-3 left-4 bg-[#38BDF8] text-[7px] sm:text-[7.5px] font-black text-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md shadow-[#38BDF8]/30 animate-pulse">
                      Type security PIN to open
                    </div>
                  </div>

                  {/* Keyboard Grid */}
                  <div
                    onClick={() => setCalcPreviewStep(3)}
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

                  {/* Walkthrough Tooltip */}
                  <div className="bg-[#38BDF8] text-slate-950 rounded-2xl p-3 sm:p-4 text-center shadow-xl mt-auto shrink-0">
                    <p className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider">Step 2: Enter PIN to Unlock</p>
                    <p className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-800 mt-1 leading-normal">
                      The app is disguised. Type your 4-digit security PIN (<span className="bg-slate-950 text-white px-1 py-0.5 rounded font-bold">{localPin || '3420'}</span>) to reveal the SOS app.
                    </p>
                    <button
                      onClick={() => setCalcPreviewStep(3)}
                      className="mt-2.5 sm:mt-3 w-full py-2 bg-slate-950 text-white rounded-xl text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
                    >
                      Click keyboard to unlock 👉
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 3: RETURN TO SOS SCREEN ----------------- */}
              {calcPreviewStep === 3 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white bg-black">
                  {/* SOS Header */}
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">SOS ACTIVE</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-500">SECURE TERMINAL</span>
                  </div>

                  {/* Success Banner overlay */}
                  <div className="my-auto bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 text-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-2 sm:mb-3 animate-bounce">
                      <ShieldCheck size={24} className="sm:w-[26px] sm:h-[26px]" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">Step 3: Vault Restored</p>
                    <p className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-400/90 leading-relaxed mt-1">
                      Successful Handshake! You are returned straight back to the active SOS screen.
                    </p>

                    <button
                      onClick={() => setCalcPreviewStep(1)}
                      className="mt-3 sm:mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                    >
                      🔄 Restart Walkthrough
                    </button>
                  </div>

                  {/* Bottom Action Area */}
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
                onClick={() => {
                  setShowCalcPreview(false);
                  setCalcPreviewStep(1);
                }}
                className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors border-t border-slate-800 shrink-0"
              >
                Close Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Preview Modal */}
      <AnimatePresence>
        {showTimerPreview && (
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
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-dashed border-amber-500/40 flex flex-col items-center justify-center animate-pulse">
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
                    Cancelling the timer stops the broadcast & prevents false alerts.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowTimerPreview(false)}
                className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors border-t border-slate-800 shrink-0"
              >
                Close Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Climate Pro Preview Modal */}
      <AnimatePresence>
        {showClimatePreview && (
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

              {/* ----------------- STEP 1: KAVACH SCREEN WITH GLOWING EYE ICON ----------------- */}
              {climatePreviewStep === 1 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Shield size={14} className="text-[#2563EB]" />
                      <span className="text-[9px] font-black tracking-wider text-slate-200">Kavach Grid</span>
                    </div>
                    {/* Glowing Eye Switcher Trigger */}
                    <div className="flex items-center gap-2 relative">
                      <button
                        onClick={() => setClimatePreviewStep(2)}
                        className="w-6 h-6 sm:w-7 sm:h-7 bg-[#2563EB]/25 border-2 border-[#2563EB] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                      >
                        <Eye size={10} className="text-white animate-pulse sm:w-3 sm:h-3" />
                      </button>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-500 overflow-hidden" />

                      {/* Tooltip pointer pointing to the Eye button */}
                      <div className="absolute top-8 sm:top-9 right-0 bg-blue-600 text-[7px] sm:text-[8px] font-black text-white px-2 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap shadow-lg z-20 border border-blue-400/30 animate-bounce">
                        👈 Click Eye to Disguise App
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col items-center justify-center my-4 sm:my-6 text-center space-y-3 sm:space-y-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
                      <ShieldCheck size={24} className="text-[#2563EB] sm:w-[28px] sm:h-[28px]" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200">Kavach Safety Active</h4>
                      <p className="text-[7.5px] sm:text-[8px] text-slate-400 uppercase tracking-widest mt-1">Grid Protection Connected</p>
                    </div>
                  </div>

                  {/* Floating Walkthrough Banner */}
                  <div className="bg-[#111] border border-blue-500/20 rounded-2xl p-3 text-center mb-2 shrink-0">
                    <h5 className="text-[8.5px] sm:text-[9px] font-black text-blue-500 uppercase tracking-wider">Step 1: Disguise App</h5>
                    <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-relaxed">
                      Tap the 'Eye' icon next to your profile photo to instantly mask Kavach under a weather interface.
                    </p>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 2: CLIMATE PRO APP ACTIVE (WEATHER DISPLAY) ----------------- */}
              {climatePreviewStep === 2 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden bg-gradient-to-b from-[#1E3A8A] to-[#0F172A] text-white">
                  {/* Weather Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <CloudSun size={14} className="text-yellow-400 animate-pulse" />
                      <span className="text-[9px] font-black tracking-wider text-slate-200">Climate Pro</span>
                    </div>
                    {/* Glowing Eye Switcher Trigger to Unlock */}
                    <div className="flex items-center gap-2 relative">
                      <button
                        onClick={() => setClimatePreviewStep(3)}
                        className="w-6 h-6 sm:w-7 sm:h-7 bg-sky-500/25 border-2 border-sky-400 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                      >
                        <Eye size={10} className="text-white animate-pulse sm:w-3 sm:h-3" />
                      </button>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-500/50 overflow-hidden" />

                      {/* Tooltip pointer pointing to the Eye button to unlock */}
                      <div className="absolute top-8 sm:top-9 right-0 bg-sky-500 text-[7px] sm:text-[8px] font-black text-black px-2 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap shadow-lg z-20 border border-sky-300/30 animate-bounce">
                        👈 Click Eye to Exit Decoy
                      </div>
                    </div>
                  </div>

                  {/* Weather Display */}
                  <div className="text-center my-4 sm:my-6 space-y-1 flex-1 flex flex-col justify-center">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-300">New Delhi</p>
                    <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter">28°C</p>
                    <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Partly Cloudy</p>
                    <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-500 mt-1">Wind: 14 km/h | Humidity: 55%</p>
                  </div>

                  {/* Floating Walkthrough Banner */}
                  <div className="bg-[#111]/80 border border-sky-500/20 rounded-2xl p-3 text-center mb-2 shrink-0">
                    <h5 className="text-[8.5px] sm:text-[9px] font-black text-sky-400 uppercase tracking-wider">Step 2: Unhide Prompt</h5>
                    <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-relaxed">
                      Tap the 'Eye' icon again inside the Climate Pro decoy app to trigger the PIN shield.
                    </p>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 3: SECURITY PIN DIALOG ----------------- */}
              {climatePreviewStep === 3 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden bg-[#0A0D14] text-white">
                  {/* Weather Header blurred/faded */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 opacity-20 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <CloudSun size={14} className="text-yellow-400" />
                      <span className="text-[9px] font-black tracking-wider text-slate-200">Climate Pro</span>
                    </div>
                  </div>

                  {/* PIN Prompt dialog in center */}
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

                  {/* Floating Walkthrough Banner */}
                  <div className="bg-[#111] border border-blue-500/20 rounded-2xl p-3 text-center mb-2 z-10 shrink-0">
                    <h5 className="text-[8.5px] sm:text-[9px] font-black text-blue-500 uppercase tracking-wider">Step 3: Verify Identity</h5>
                    <p className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase mt-0.5 leading-relaxed mb-2 sm:mb-3">
                      Type your 4-digit security PIN to verify yourself and exit the weather decoy.
                    </p>

                    {/* Interactive mock keypad click handler */}
                    <button
                      onClick={() => setClimatePreviewStep(4)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md"
                    >
                      ⌨️ Type PIN (Simulate Press)
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 4: SWITCH BACK SUCCESS ----------------- */}
              {climatePreviewStep === 4 && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 relative overflow-hidden text-white bg-[#030605]">
                  {/* Success indicator */}
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
                      onClick={() => setClimatePreviewStep(1)}
                      className="mt-3 sm:mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                    >
                      🔄 Restart Walkthrough
                    </button>
                  </div>

                  {/* Bottom Action Area */}
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
                onClick={() => {
                  setShowClimatePreview(false);
                  setClimatePreviewStep(1);
                }}
                className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-colors border-t border-slate-800 shrink-0"
              >
                Close Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}