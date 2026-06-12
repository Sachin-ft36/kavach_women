import React from 'react';
import { ShieldCheck, Users, Shield, BriefcaseMedical, Landmark, Lock } from 'lucide-react';

export default function AuthFooter() {
  return (
    <>
      <div className="w-full relative z-10 flex flex-col items-center space-y-4 pb-0 pt-2 sm:pt-4">
        {/* Box 1: Trusted Platform */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8">
          <div className="w-full bg-[#f6fcf8] border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <ShieldCheck size={28} className="stroke-[2.5px]" />
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-sm sm:text-base font-semibold text-[#0B2545] leading-tight">A Trusted Platform for Every Indian</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Working together for a safer and secure India</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 border-l border-emerald-100 pl-8">
              <div className="flex flex-col items-center gap-1.5">
                <Users size={24} className="text-blue-700" />
                <span className="text-[10px] font-bold text-blue-800">Citizens</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Shield size={24} className="text-slate-500" />
                <span className="text-[10px] font-medium text-slate-500">Police</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <BriefcaseMedical size={24} className="text-red-500" />
                <span className="text-[10px] font-medium text-slate-500">Responders</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Landmark size={24} className="text-slate-700" />
                <span className="text-[10px] font-medium text-slate-500">Govt. Agencies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Compliance Stats */}
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 pb-4">
          <div className="w-full bg-white border border-slate-200 rounded-lg py-1.5 sm:py-2 px-1 sm:px-2 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between gap-1 sm:gap-2 divide-x divide-slate-100 min-w-max w-full">
              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <img src="/emblem-dark.png" alt="Emblem of India" className="h-4 sm:h-5 w-auto object-contain shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">GOVT OF<br />INDIA</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">Official Initiative</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <img src="/iso-icon.png" alt="ISO Certified" className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 mix-blend-multiply grayscale contrast-150 scale-[1.2]" />
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">ISO 27001<br />CERTIFIED</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">Information Security</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 text-[#0B2545]">
                  <ShieldCheck className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">REGULAR<br />AUDITS</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">System Protection</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 text-orange-500">
                  <Lock className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">DATA<br />PRIVACY</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">Your Privacy Matters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#0B2545] text-white py-3 sm:py-4 px-6 sm:px-12 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-center sm:text-left shadow-2xl mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-white/90" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[11px] sm:text-xs font-medium tracking-widest text-white/90">KAVACH SAFETY GRID v3.5.1</span>
            <span className="text-[9px] sm:text-[10px] text-blue-100/60 mt-0.5">Securing Women. Empowering India.</span>
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-normal text-blue-100/50 tracking-widest">© Government of India</span>
      </footer>
    </>
  );
}
