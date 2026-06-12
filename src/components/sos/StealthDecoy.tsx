import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface Props {
  safetyPin: string;
  setIsStealthDisguised: (val: boolean) => void;
}

export default function StealthDecoy({ safetyPin, setIsStealthDisguised }: Props) {
  const [calcInput, setCalcInput] = useState('');

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col justify-end p-4 select-none font-sans text-white">
      {/* Decoy Calculator Display */}
      <div className="flex-1 flex flex-col justify-end items-end mb-8 px-4">
        <span className="text-gray-400 text-sm font-light tracking-wide min-h-[28px]">{calcInput || '0'}</span>
        <span className="text-white text-5xl font-extralight tracking-tighter mt-3 truncate max-w-full">
          {(() => {
            try {
              if (!calcInput) return '0';
              if (/^[0-9\+\-\*\/\.\s()]+$/.test(calcInput)) {
                // Using new Function avoids the strict 'eval' bundler warnings
                const result = new Function('return ' + calcInput)();
                return String(result).slice(0, 12);
              }
              return '0';
            } catch (e) {
              return '0';
            }
          })()}
        </span>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-4 mb-8 max-w-md mx-auto w-full">
        {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '🔓'].map((key) => {
          const isOperator = ['/', '*', '-', '+', '='].includes(key);
          const isClear = ['C', '(', ')'].includes(key);
          return (
            <button
              key={key}
              onClick={() => {
                if (key === 'C') {
                  setCalcInput('');
                } else if (key === '=') {
                  // Handled in dynamic eval display
                } else if (key === '🔓') {
                  setIsStealthDisguised(false);
                  setCalcInput('');
                  toast.success("DISGUISE DISENGAGED");
                } else {
                  const nextInput = calcInput + key;
                  setCalcInput(nextInput);
                  // Custom trigger: entering safetyPin (e.g. 1234) escapes disguise
                  if (nextInput === safetyPin) {
                    setIsStealthDisguised(false);
                    setCalcInput('');
                    toast.success("DISGUISE DISENGAGED");
                  }
                }
              }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90",
                isOperator ? "bg-amber-500 text-white active:bg-amber-400" :
                  isClear ? "bg-gray-700 text-gray-200 active:bg-gray-600" :
                    "bg-gray-800 text-white active:bg-gray-700"
              )}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
