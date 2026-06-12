import React from 'react';
import { ShieldAlert, Lock, Delete, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PinVerificationModalProps {
  isOpen: boolean;
  pinError: boolean;
  isLockedOut: boolean;
  lockoutSeconds: number;
  enteredPin: string;
  onPinKey: (val: string) => void;
  onPinClear: () => void;
  onPinSubmit: () => void;
  onCancel: () => void;
}

export default function PinVerificationModal({
  isOpen,
  pinError,
  isLockedOut,
  lockoutSeconds,
  enteredPin,
  onPinKey,
  onPinClear,
  onPinSubmit,
  onCancel
}: PinVerificationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="w-full max-w-sm bg-[#0A0D14] border border-blue-500/30 rounded-t-[36px] sm:rounded-[36px] p-7 shadow-[0_0_60px_rgba(37,99,235,0.25)] relative overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-blue-500/15 blur-3xl pointer-events-none" />

            {/* Drag handle (mobile) */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6 sm:hidden" />

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                animate={pinError ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={cn(
                  "w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 border-2 transition-colors duration-300",
                  pinError
                    ? "bg-red-500/15 border-red-500/40"
                    : isLockedOut
                    ? "bg-orange-500/15 border-orange-500/40"
                    : "bg-blue-500/15 border-blue-500/30"
                )}
              >
                {pinError ? (
                  <ShieldAlert size={26} className="text-red-400" />
                ) : isLockedOut ? (
                  <Lock size={26} className="text-orange-400" />
                ) : (
                  <Lock size={26} className="text-blue-400" />
                )}
              </motion.div>
              <h3 className="text-base font-black text-white uppercase tracking-widest">
                {isLockedOut ? 'Account Locked' : 'Identity Verification'}
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">
                {isLockedOut
                  ? `Retry in ${lockoutSeconds}s`
                  : 'Enter your Security PIN to exit decoy'}
              </p>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-4 mb-7">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={pinError ? { scale: [1, 1.3, 0.8, 1] } : {}}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-200",
                    enteredPin.length > i
                      ? pinError
                        ? "bg-red-500 border-red-400"
                        : "bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                      : "bg-transparent border-white/20"
                  )}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <button
                  key={num}
                  disabled={isLockedOut}
                  onClick={() => onPinKey(num.toString())}
                  className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-bold hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  {num}
                </button>
              ))}
              {/* Clear / Backspace */}
              <button
                disabled={isLockedOut}
                onClick={onPinClear}
                className="h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Delete size={20} />
              </button>
              <button
                key={0}
                disabled={isLockedOut}
                onClick={() => onPinKey('0')}
                className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-bold hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                0
              </button>
              {/* Confirm */}
              <button
                disabled={isLockedOut || enteredPin.length < 4}
                onClick={onPinSubmit}
                className="h-14 rounded-2xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                <ShieldCheck size={22} />
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-full mt-5 py-3 text-white/30 hover:text-white/60 text-[11px] font-black uppercase tracking-widest transition-colors"
            >
              Cancel — Stay in WeatherPro
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
