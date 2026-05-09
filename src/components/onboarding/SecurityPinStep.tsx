import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Delete, ShieldCheck, Shield } from 'lucide-react';
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
      className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-12 py-2"
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-white border border-[#E5E7EB] rounded-[24px] flex items-center justify-center shadow-lg shadow-gray-100 mx-auto transition-all duration-500">
          <Lock className="text-[#2563EB]" size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Set Security PIN</h2>
          <p className="text-sm text-gray-500 font-semibold max-w-[280px] mx-auto leading-relaxed">
            Create a 4-digit authentication code to secure your safety profile.
          </p>
        </div>
      </div>

      <div className="flex gap-5">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={cn(
              "w-14 h-20 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all duration-300 shadow-sm",
              localPin[i] 
                ? "border-[#2563EB] bg-white text-gray-900 shadow-lg shadow-[#2563EB]/10" 
                : "border-[#E5E7EB] bg-gray-50 text-gray-300"
            )}
          >
            {localPin[i] ? <div className="w-3 h-3 bg-[#2563EB] rounded-full animate-in zoom-in" /> : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-[300px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="h-14 sm:h-16 rounded-[24px] bg-white border border-[#E5E7EB] text-2xl font-bold text-gray-700 shadow-sm hover:border-[#2563EB]/30 hover:bg-gray-50 active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="h-14 sm:h-16 rounded-[24px] bg-white border border-[#E5E7EB] text-[#DC2626] flex items-center justify-center active:scale-90 transition-all hover:bg-red-50 shadow-sm"
        >
          <Delete size={24} />
        </button>
        <button
          onClick={() => handlePress('0')}
          className="h-14 sm:h-16 rounded-[24px] bg-white border border-[#E5E7EB] text-2xl font-bold text-gray-700 shadow-sm hover:border-[#2563EB]/30 hover:bg-gray-50 active:scale-90 transition-all"
        >
          0
        </button>
        <div className="h-14 sm:h-16 rounded-[24px] flex items-center justify-center text-[#2563EB]/10">
          <ShieldCheck size={32} />
        </div>
      </div>

      <div className="flex items-center gap-2.5 opacity-60">
        <Shield size={14} className="text-[#2563EB]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Official Authentication Grid Security</span>
      </div>
    </motion.div>
  );
}
