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
          "w-full py-4 rounded-md font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all border-none",
          isActive
            ? "bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] hover:bg-blue-900 cursor-pointer"
            : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
        )}
      >
        {step === 2
          ? (roleSubStep === 'select' ? "Confirm Category" : "Confirm Profile")
          : "Setup Guardians"
        }
      </button>


    </div>
  );
}
