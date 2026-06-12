import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  enteredPin: string;
  setEnteredPin: React.Dispatch<React.SetStateAction<string>>;
  setShowPinOverlay: (val: boolean) => void;
  handlePinSubmit: (digit: string) => void;
}

export default function PinVerificationOverlay({ enteredPin, setEnteredPin, setShowPinOverlay, handlePinSubmit }: Props) {
  return (
    <div className="absolute inset-0 z-[6000] bg-black/95 flex flex-col p-8">
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className="text-center">
          <Lock size={40} className="text-accent-blue mx-auto mb-4" />
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Identity Verification</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Enter Secure PIN to Verify</p>
        </div>

        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn(
              "w-4 h-4 rounded-full border-2 transition-all duration-300",
              enteredPin.length >= i ? "bg-accent-blue border-accent-blue shadow-[0_0_15px_rgba(45,212,191,0.5)]" : "border-white/20"
            )} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((k) => (
            <button
              key={k}
              onClick={() => {
                if (k === 'C') setEnteredPin('');
                else if (k === '⌫') setEnteredPin(prev => prev.slice(0, -1));
                else handlePinSubmit(k.toString());
              }}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white active:bg-accent-blue/20 transition-all active:scale-90"
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => { setShowPinOverlay(false); setEnteredPin(''); }}
        className="py-6 text-gray-500 font-bold uppercase tracking-widest text-[8px] hover:text-white"
      >
        RETURN TO KAVACH DASHBOARD
      </button>
    </div>
  );
}
