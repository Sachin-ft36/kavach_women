import React from 'react';
import TrashWarningIllustration from './TrashWarningIllustration';

export default function DeleteWarningBanner() {
  return (
    <section className="bg-gradient-to-br from-[#270e13]/90 to-[#0e0406]/95 border border-[#4c1620] rounded-[24px] p-5 flex items-center gap-4.5 relative overflow-hidden text-left shadow-xl w-full">
      {/* 3D SVG Trash Bin Illustration on the Left */}
      <TrashWarningIllustration className="w-16 h-16 shrink-0" />

      {/* Warning Text on the Right */}
      <div className="flex-1 min-w-0">
        <h2 className="text-[14px] font-bold text-red-400 tracking-tight leading-snug">
          This action is permanent
        </h2>
        <p className="text-[11px] text-slate-400 font-normal leading-relaxed mt-1">
          Once you delete your account, all your data will be permanently removed and cannot be recovered.
        </p>
      </div>
    </section>
  );
}
