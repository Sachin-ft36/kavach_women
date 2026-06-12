import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useSafeTimerLogic } from './safetimer/hooks/useSafeTimerLogic';
import { SafeTimerVerifyView } from './safetimer/SafeTimerVerifyView';
import { SafeTimerExtendView } from './safetimer/SafeTimerExtendView';

export default function SafeTimerPopup() {
  const {
    isSafeTimerAlertActive, timerStage, graceTimeLeft,
    pinInput, setPinInput, error, mode, setMode, safetyPin,
    handleExtendClick, handleStop,
    selectedReason, setSelectedReason,
    customReason, setCustomReason,
    extendMins, setExtendMins,
    handleExtendConfirm
  } = useSafeTimerLogic();

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isSafeTimerAlertActive) return null;

  return (
    <AnimatePresence>
      {isSafeTimerAlertActive && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-[90%] max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Background pulse effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>

              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Are You Safe?</h2>
              <p className="text-sm text-gray-400 mb-4 font-medium">
                Your safe timer has expired. Please enter your Security PIN to confirm your safety.
              </p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-2 mb-6 flex flex-col items-center">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">
                  {timerStage === 'grace' ? 'Guardians Alert In' : 'SOS Alert In'}
                </span>
                <span className="text-4xl font-black text-red-500 tabular-nums tracking-tight animate-pulse">
                  {formatTime(graceTimeLeft)}
                </span>
              </div>

              <div className="w-full flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300
                      ${error ? 'bg-red-500/20 text-red-500 border border-red-500/50' :
                        pinInput[index]
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 border border-gray-700 text-gray-500'
                      }`}
                  >
                    {pinInput[index] ? '•' : ''}
                  </div>
                ))}
              </div>

              {mode === 'verify' ? (
                <SafeTimerVerifyView
                  pinInput={pinInput} setPinInput={setPinInput}
                  safetyPin={safetyPin} error={error}
                  handleExtendClick={handleExtendClick} handleStop={handleStop}
                />
              ) : (
                <SafeTimerExtendView
                  selectedReason={selectedReason} setSelectedReason={setSelectedReason}
                  customReason={customReason} setCustomReason={setCustomReason}
                  extendMins={extendMins} setExtendMins={setExtendMins}
                  setMode={setMode} setPinInput={setPinInput}
                  handleExtendConfirm={handleExtendConfirm}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
