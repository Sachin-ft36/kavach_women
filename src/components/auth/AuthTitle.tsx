import React from 'react';

const KavachShieldLogo = () => (
  <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto flex items-center justify-center select-none">
    <div className="absolute inset-0 bg-[#2563EB]/8 rounded-full blur-xl animate-pulse" />
    <img
      src="/logo.jpeg"
      alt="KAVACH Logo"
      className="w-26 h-26 sm:w-30 sm:h-30 object-contain mix-blend-multiply relative z-10"
    />
  </div>
);

export default function AuthTitle() {
  return (
    <div className="text-center space-y-1 sm:space-y-2">
      <KavachShieldLogo />

      <div className="space-y-0.5">
        <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight text-[#0B2545] leading-none">KAVACH</h1>

        {/* Tricolor accent stripes */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex flex-col gap-[2px] w-8 shrink-0">
            <div className="h-[1.5px] bg-[#FF9933] rounded-full" />
            <div className="h-[1.5px] bg-[#138808] rounded-full" />
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#3b82f6] font-bold tracking-[0.2em] uppercase whitespace-nowrap">Official Safety Portal</span>
          <div className="flex flex-col gap-[2px] w-8 shrink-0">
            <div className="h-[1.5px] bg-[#FF9933] rounded-full" />
            <div className="h-[1.5px] bg-[#138808] rounded-full" />
          </div>
        </div>

        <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium uppercase tracking-[0.15em] leading-none mt-1">Authorized Safety Network Access</p>
      </div>
    </div>
  );
}
