import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Activity, ScanLine, Smartphone, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MissionReadinessProps {
  batteryExempt: boolean;
  overlayGranted: boolean;
  perms: { 
    sms: string; 
    call: string; 
    camera: string; 
    location: string; 
    microphone: string; 
  };
  isReturningUser?: boolean;
  tosChecked: { terms: boolean; permissions: boolean };
  setTosChecked: React.Dispatch<React.SetStateAction<{ terms: boolean; permissions: boolean }>>;
  onActivate: () => void;
  authStatus: string;
  tr: (key: string) => string;
  onOpenBattery: () => void;
  onOpenOverlay: () => void;
  onRequestPerms: () => void;
  onOpenAppSettings: () => void;
  isNative: boolean;
}

export default function MissionReadiness({
  batteryExempt,
  overlayGranted,
  perms,
  isReturningUser,
  tosChecked,
  setTosChecked,
  onActivate,
  authStatus,
  tr,
  onOpenBattery,
  onOpenOverlay,
  onRequestPerms,
  onOpenAppSettings,
  isNative
}: MissionReadinessProps) {
  
  const protocolRef = useRef<HTMLDivElement>(null);

  const isLifelineActive = 
    perms.sms === 'granted' && 
    perms.call === 'granted' && 
    perms.location === 'granted' && 
    perms.camera === 'granted' && 
    perms.microphone === 'granted';

  const allShieldsActive = batteryExempt && overlayGranted && isLifelineActive;

  useEffect(() => {
    if (allShieldsActive) {
      setTimeout(() => {
        protocolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [allShieldsActive]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-8 pb-24">
      {/* Header Section */}
      <div className="text-center space-y-3 sm:space-y-4 pt-1 sm:pt-2">
        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white border border-[#E5E7EB] rounded-xl sm:rounded-[24px] flex items-center justify-center shadow-lg shadow-gray-100 mx-auto transition-all duration-500">
          <ShieldCheck className={cn(allShieldsActive ? "text-[#10B981]" : "text-[#2563EB]")} size={allShieldsActive ? 20 : 28} className="sm:size-[32px]" />
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">System Readiness</h1>
          <p className="text-[9px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-[2px] sm:tracking-[3px]">
            {allShieldsActive ? "System Configuration Complete" : "Hardware Setup Required"}
          </p>
        </div>
      </div>

      {/* Hardware Configuration Cards */}
      <div className="space-y-4">
        {/* 1. Always On Protection */}
        <div className={cn(
          "p-3.5 sm:p-6 rounded-[24px] sm:rounded-[32px] border-2 transition-all duration-300 shadow-sm",
          batteryExempt ? "bg-white border-[#10B981]/20" : "bg-white border-amber-200 ring-4 ring-amber-50"
        )}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all",
                batteryExempt ? "bg-[#10B981]/5 text-[#10B981] border-[#10B981]/10" : "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                <Activity size={20} className="sm:size-[24px]" />
              </div>
              <div>
                <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight">Always-On Protection</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:tracking-widest mt-0.5">Background Connectivity</p>
              </div>
            </div>
            <button
              onClick={onOpenBattery}
              className={cn(
                "px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border",
                batteryExempt 
                  ? "bg-[#10B981] text-white border-[#10B981]/50" 
                  : "bg-white text-amber-600 border-amber-200"
              )}
            >
              {batteryExempt ? "ACTIVE" : "SETUP"}
            </button>
          </div>
          {!batteryExempt && (
            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-3 sm:mt-4 font-semibold leading-relaxed">
              Required to ensure KAVACH remains active in the background during critical emergencies.
            </p>
          )}
        </div>

        {/* 2. Emergency Interface Authorization */}
        <div className={cn(
          "p-3.5 sm:p-6 rounded-[24px] sm:rounded-[32px] border-2 transition-all duration-300 shadow-sm",
          overlayGranted ? "bg-white border-[#10B981]/20" : "bg-white border-[#E5E7EB]"
        )}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all",
                overlayGranted ? "bg-[#10B981]/5 text-[#10B981] border-[#10B981]/10" : "bg-gray-50 text-gray-300 border-gray-100"
              )}>
                <ScanLine size={20} className="sm:size-[24px]" />
              </div>
              <div>
                <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight">Interface Authorization</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:tracking-widest mt-0.5">Lock-Screen Visibility</p>
              </div>
            </div>
            <button
              onClick={onOpenOverlay}
              className={cn(
                "px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border",
                overlayGranted 
                  ? "bg-[#10B981] text-white border-[#10B981]/50" 
                  : "bg-white text-[#2563EB] border-[#2563EB]/20"
              )}
            >
              {overlayGranted ? "GRANTED" : "ENABLE"}
            </button>
          </div>
          {!overlayGranted && (
            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-3 sm:mt-4 font-semibold leading-relaxed">
              Allows the emergency interface to appear instantly even if your device is locked.
            </p>
          )}
        </div>

        {/* 3. Safety Core Permissions */}
        <div className={cn(
          "p-3.5 sm:p-6 rounded-[24px] sm:rounded-[32px] border-2 transition-all duration-300 shadow-sm",
          isLifelineActive ? "bg-white border-[#10B981]/20" : "bg-white border-[#E5E7EB]"
        )}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all",
                isLifelineActive ? "bg-[#10B981]/5 text-[#10B981] border-[#10B981]/10" : "bg-gray-50 text-gray-300 border-gray-100"
              )}>
                <Smartphone size={20} className="sm:size-[24px]" />
              </div>
              <div>
                <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight">Safety Core Access</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:tracking-widest mt-0.5">Hardware Permissions</p>
              </div>
            </div>
            <button
              onClick={onRequestPerms}
              className={cn(
                "relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-all flex-shrink-0",
                isLifelineActive ? "bg-[#10B981]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md transition-all duration-500",
                isLifelineActive ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
              )} />
            </button>
          </div>
          {!isLifelineActive && (
            <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
               {['SMS', 'Call', 'GPS', 'Cam', 'Mic'].map((p, i) => {
                 const states = [perms.sms, perms.call, perms.location, perms.camera, perms.microphone];
                 const isG = states[i] === 'granted';
                 return (
                   <div key={p} className={cn(
                     "py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-bold text-center border uppercase tracking-wider sm:tracking-widest transition-all",
                     isG ? "bg-[#10B981]/5 border-[#10B981]/10 text-[#10B981]" : "bg-gray-50 border-gray-100 text-gray-300"
                   )}>
                     {p}
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>

      {/* Protocol Card */}
      {allShieldsActive && (
        <motion.div
           ref={protocolRef}
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-6 pt-2"
        >
          {!isReturningUser && (
            <div className="bg-white border border-[#E5E7EB] rounded-[32px] shadow-xl overflow-hidden">
              <div className="bg-gray-50 px-5 sm:px-8 py-4 sm:py-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-[#2563EB] sm:size-[18px]" />
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-900">Usage Terms & Policy</p>
                </div>
                <div className="px-2 sm:px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] shadow-sm">
                   <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest">v2.0-GRID</p>
                </div>
              </div>

              <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[250px] sm:max-h-[350px] overflow-y-auto custom-scrollbar">
                <p className="text-[11px] sm:text-xs text-gray-600 font-semibold leading-relaxed border-l-4 border-[#2563EB] pl-4 sm:pl-5 bg-[#2563EB]/5 py-3 sm:py-4 rounded-r-2xl">
                  {tr('tos_intro')}
                </p>
                
                <div className="space-y-5 sm:space-y-8">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex gap-4 sm:gap-5 items-start">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-400 shrink-0 shadow-inner">
                        0{num}
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-900 leading-tight">
                          {(tr as any)(`tos_s${num}_title`)}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 leading-relaxed font-medium">
                          {(tr as any)(`tos_s${num}`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-gray-50 border-t border-[#E5E7EB] space-y-3 sm:space-y-4">
                <button 
                  onClick={() => setTosChecked(p => ({ ...p, terms: !p.terms }))} 
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all border shadow-sm",
                    tosChecked.terms ? "bg-white border-[#10B981]/50" : "bg-white border-[#E5E7EB]"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 flex items-center justify-center transition-all shrink-0", 
                    tosChecked.terms ? "bg-[#10B981] border-[#10B981]" : "border-[#E5E7EB]"
                  )}>
                    {tosChecked.terms && <CheckCircle2 size={14} className="text-white sm:size-[16px]" />}
                  </div>
                  <p className={cn("text-[10px] sm:text-xs text-left font-bold", tosChecked.terms ? "text-gray-900" : "text-gray-400")}>
                    {tr('tos_check1')}
                  </p>
                </button>

                <button 
                  onClick={() => setTosChecked(p => ({ ...p, permissions: !p.permissions }))} 
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all border shadow-sm",
                    tosChecked.permissions ? "bg-white border-[#10B981]/50" : "bg-white border-[#E5E7EB]"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 flex items-center justify-center transition-all shrink-0", 
                    tosChecked.permissions ? "bg-[#10B981] border-[#10B981]" : "border-[#E5E7EB]"
                  )}>
                    {tosChecked.permissions && <CheckCircle2 size={14} className="text-white sm:size-[16px]" />}
                  </div>
                  <p className={cn("text-[10px] sm:text-xs text-left font-bold", tosChecked.permissions ? "text-gray-900" : "text-gray-400")}>
                    {tr('tos_check2')}
                  </p>
                </button>
              </div>
            </div>
          )}

            <button
              disabled={(!isReturningUser && (!tosChecked.terms || !tosChecked.permissions)) || authStatus === 'saving'}
              onClick={onActivate}
              className={cn(
                "w-full py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-bold text-base sm:text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]",
                (isReturningUser || (tosChecked.terms && tosChecked.permissions))
                  ? "bg-[#2563EB] text-white shadow-[#2563EB]/25"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              {authStatus === 'saving' ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synchronizing Grid...</span>
                </>
              ) : (
                <span className="uppercase tracking-widest font-bold">Activate Protection</span>
              )}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
