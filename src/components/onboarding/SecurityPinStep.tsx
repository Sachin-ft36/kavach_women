import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Delete, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SecurityPinStepProps {
  pin: string;
  setPin: (pin: string) => void;
}

export default function SecurityPinStep({ pin, setPin }: SecurityPinStepProps) {
  const [localPin, setLocalPin] = useState(pin);

  const handlePress = (val: string) => {
    if (localPin.length < 4) {
      const newPin = localPin + val;
      setLocalPin(newPin);
      if (newPin.length === 4) setPin(newPin);
    }
  };

  const handleClear = () => {
    setLocalPin('');
    setPin('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col items-center justify-center space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue mx-auto border border-accent-blue/20 mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Secure Safety PIN</h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px] max-w-xs mx-auto">
          Create a 4-digit code to manually abort emergency sessions if biometrics fail.
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={cn(
              "w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl transition-all",
              localPin[i] 
                ? "border-accent-blue bg-accent-blue/10 text-white shadow-[0_0_15px_rgba(10,132,255,0.2)]" 
                : "border-white/10 bg-white/5 text-gray-700"
            )}
          >
            {localPin[i] ? '●' : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-black text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="h-16 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center active:scale-95 transition-all"
        >
          <Delete size={24} />
        </button>
        <button
          onClick={() => handlePress('0')}
          className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-black text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          0
        </button>
        <div className="h-16 rounded-2xl flex items-center justify-center text-accent-blue/40">
          <ShieldCheck size={24} />
        </div>
      </div>
    </motion.div>
  );
}
