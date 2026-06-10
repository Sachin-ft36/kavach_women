import React from 'react';
import { motion } from 'motion/react';
import { User, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileStrengtheningStepProps {
  gender: 'female' | 'male' | null;
  setGender: (val: 'female' | 'male') => void;
  address: string;
  setAddress: (val: string) => void;
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
  onNext: () => void;
}

export default function ProfileStrengtheningStep({
  gender,
  setGender,
  address,
  setAddress,
  bloodGroup,
  setBloodGroup,
  dob,
  setDob,
  onNext
}: ProfileStrengtheningStepProps) {
  const { t } = useLanguage();

  const isReady = !!gender;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col space-y-4 py-2 min-h-0"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 pt-2 pb-1 text-left">
        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
          <User className="text-[#FF9933] fill-[#FF9933]/20" size={22} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 space-y-0.5">
          <h1 className="text-xl font-black tracking-tight" style={{color:'#1B3A6B'}}>
            Gender Selection
          </h1>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
            Select your gender
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4 custom-scrollbar">
        {/* Gender Selection - REQUIRED */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3 shadow-sm">
          <label className="text-[11px] font-black uppercase tracking-wider block" style={{color:'#1B3A6B'}}>
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {(['female', 'male'] as const).map(g => {
              const isSelected = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={cn(
                    "py-5 rounded-[20px] text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-3 w-full border-2",
                    isSelected
                      ? "bg-[#F3F7FC] border-[#2563EB] text-[#1B3A6B]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#1B3A6B] hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-[14px] flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-[#DCE7F6] text-[#2563EB]"
                      : "bg-[#EEF2F6] text-[#2563EB]"
                  )}>
                    <span className="text-2xl font-bold">{g === 'female' ? '♀' : '♂'}</span>
                  </div>
                  <span className="text-[11px] font-black tracking-widest">{g === 'female' ? 'Female' : 'Male'}</span>
                </button>
              );
            })}
          </div>
        </div>


      </div>

      {/* Action Button */}
      <button
        disabled={!isReady}
        onClick={onNext}
        className={cn(
          "w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]",
          isReady
            ? "bg-[#EBF0FA] text-[#2563EB] hover:bg-[#DBEAFE] cursor-pointer"
            : "bg-[#EFF2F6] text-[#94A3B8] cursor-not-allowed"
        )}
      >
        <span>Proceed to Role Selection</span>
        <ChevronRight size={14} className="stroke-[3px]" />
      </button>
    </motion.div>
  );
}
