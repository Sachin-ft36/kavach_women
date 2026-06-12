import React from 'react';
import { cn } from '../../lib/utils';

interface OnboardingFooterProps {
  step: number;
  roleSubStep: 'select' | 'vetting';
  role: string | null;
  protectorData: any;
  guardiansLength: number;
  isKeyboardOpen: boolean;
  onNext: () => void;
}

export default function OnboardingFooter({
  step,
  roleSubStep,
  role,
  protectorData,
  guardiansLength,
  isKeyboardOpen,
  onNext
}: OnboardingFooterProps) {
  
  if (!((step === 2 && roleSubStep !== 'select') || step === 3)) return null;

  const isDisabled = 
    (step === 2 && (
      roleSubStep === 'select'
        ? !role
        : (role === 'pcr_officer'
          ? (!protectorData.fullName || !protectorData.address || !protectorData.badgeId || !protectorData.vehicleNo || !protectorData.rank || !protectorData.agreement)
          : (!protectorData.fullName || !protectorData.address || !protectorData.occupation || !protectorData.agreement ||
            (['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(protectorData.occupation) && (!protectorData.serviceNumber || !protectorData.isServiceNumberValid)))
        )
    )) ||
    (step === 3 && guardiansLength === 0);

  const isActive = 
    (step === 2 && (
      roleSubStep === 'select'
        ? !!role
        : (role === 'pcr_officer'
          ? (protectorData.fullName && protectorData.address && protectorData.badgeId && protectorData.vehicleNo && protectorData.rank && protectorData.agreement)
          : (protectorData.fullName && protectorData.address && protectorData.occupation && protectorData.agreement &&
            (!['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(protectorData.occupation) || (!!protectorData.serviceNumber && protectorData.isServiceNumberValid)))
        )
    )) ||
    (step === 3 && guardiansLength > 0);

  return (
    <div className="pt-6 mt-auto">
      <button
        disabled={isDisabled}
        onClick={onNext}
        className={cn(
          "w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-xl active:scale-[0.98]",
          isActive
            ? "bg-[#2563EB] text-white shadow-[#2563EB]/25"
            : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
        )}
      >
        {step === 2
          ? (roleSubStep === 'select' ? "Confirm Category" : "Confirm Profile")
          : "Setup Guardians"
        }
      </button>

      {!isKeyboardOpen && step !== 3 && (
        <div className="flex flex-col items-center gap-1.5 pt-4 pb-6 mt-6 shrink-0">
          <div className="flex items-center justify-between w-full border-t border-slate-200/60 pt-3 px-0.5">
            <div className="flex items-center gap-2.5 text-left">
              <img
                src="/emblem-dark.png"
                alt="Emblem of India"
                className="h-10 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight leading-none">
                  Government of India Initiative
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold mt-1 leading-none">
                  Securing Citizens. Empowering India.
                </span>
              </div>
            </div>

            <img
              src="/Made-In-India-Lion-PNG-Cutout.png"
              alt="Made in India"
              className="h-10 w-auto object-contain opacity-95"
            />
          </div>

          <p className="text-[8.5px] font-extrabold uppercase tracking-widest text-[#94A3B8] text-center mt-1">
            MINISTRY OF WOMEN &amp; CHILD DEVELOPMENT • GOVT. OF INDIA
          </p>
        </div>
      )}
    </div>
  );
}
