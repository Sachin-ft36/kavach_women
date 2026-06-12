import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VisualStepInfo {
  current: number;
  total: number;
  steps: number[];
}

interface OnboardingHeaderProps {
  step: number;
  visualStepInfo: VisualStepInfo;
  onBack: () => void;
}

export default function OnboardingHeader({ step, visualStepInfo, onBack }: OnboardingHeaderProps) {
  return (
    <div className="w-full bg-white shrink-0 relative z-20">
      <div className="w-full max-w-md mx-auto px-4 pt-3 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button onClick={onBack} className="p-1.5 -ml-1 rounded-full hover:bg-slate-100 transition-colors">
                <ChevronLeft size={20} className="text-slate-700" />
              </button>
            ) : null}

            <div className="flex items-center gap-2">
              <img src="/logo.jpeg" alt="KAVACH Logo" className="h-14 w-14 rounded-xl object-contain" />
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-[#0B2545] leading-none tracking-tight">KAVACH</span>
                <span className="text-[6.5px] font-black text-slate-400 tracking-wider mt-0.5 leading-none">NATIONAL SAFETY NETWORK</span>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <img src="/digitalindia.png" alt="Digital India" className="h-9 w-auto object-contain" />
          </div>
        </div>

        <div className="text-center mt-1">
          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest">
            STEP {visualStepInfo.current} OF {visualStepInfo.total}
          </span>
        </div>

        <div className="relative w-full flex items-center justify-between px-2 py-1">
          <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-slate-200 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-2 right-2 h-[2px] -translate-y-1/2 z-0">
            <div
              className="h-full bg-[#0B2545] transition-all duration-500"
              style={{ width: `${((visualStepInfo.current - 1) / (visualStepInfo.total - 1)) * 100}%` }}
            />
          </div>

          {visualStepInfo.steps.map((s) => (
            <div
              key={s}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] z-10 transition-all duration-300 border-2",
                s === visualStepInfo.current
                  ? "bg-[#0B2545] border-[#0B2545] text-white shadow-sm scale-110"
                  : s < visualStepInfo.current
                    ? "bg-white border-[#0B2545] text-[#0B2545]"
                    : "bg-white border-slate-200 text-slate-400"
              )}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="flex h-[3.5px] w-full rounded-full overflow-hidden mt-1.5">
          <div className="w-[20%] bg-[#2563EB]" />
          <div className="w-[22%] bg-[#FF9933]" />
          <div className="w-[30%] bg-[#F59E0B]" />
          <div className="w-[28%] bg-[#10B981]" />
        </div>
      </div>
    </div>
  );
}
