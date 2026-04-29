import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Activity, ScanLine, Smartphone, CheckCircle2 } from 'lucide-react';
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
  onActivate: () => Promise<void>;
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

  // 📜 AUTO-SCROLL LOGIC
  useEffect(() => {
    if (allShieldsActive) {
      setTimeout(() => {
        protocolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [allShieldsActive]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-20">
      {/* ── Sticky Heading ── */}
      <div className="text-center space-y-3 pb-2">
        <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-2xl relative">
          <div className="absolute inset-0 bg-red-500/10 rounded-2xl animate-pulse" />
          <ShieldCheck className="text-red-400 relative z-10" size={32} />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
          Mission Readiness
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[3px] text-red-400">
          {isReturningUser ? "⚠️ Neural profile found — Need hardware sync" : "⚠️ All hardware anchors required"}
        </p>
      </div>

      {/* ── Toggle Cards (The Three Shields) ── */}
      <div className="space-y-3">
        {/* 1. Persistent Guard — Battery */}
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all",
          batteryExempt ? "bg-green-500/10 border-green-500/40" : "bg-white/3 border-white/10"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Activity className={cn("flex-shrink-0", batteryExempt ? "text-green-400" : "text-gray-400")} size={22} />
              <div>
                <p className={cn("text-[11px] font-black uppercase tracking-widest", batteryExempt ? "text-green-300" : "text-white")}>
                  Persistent Guard
                </p>
                <p className="text-[8px] text-gray-500 font-bold mt-0.5">Always On Background Sync</p>
              </div>
            </div>
            <button
              onClick={onOpenBattery}
              className={cn(
                "relative w-14 h-7 rounded-full transition-all flex-shrink-0 border-2",
                batteryExempt ? "bg-green-500 border-green-400" : "bg-gray-700 border-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                batteryExempt ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
              )} />
            </button>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
            KAVACH will never sleep — ensuring SOS triggers even if the app is closed.
          </p>
        </div>

        {/* 2. Tactical Break-In — Overlay */}
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all",
          overlayGranted ? "bg-green-500/10 border-green-500/40" : "bg-white/3 border-white/10"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <ScanLine className={cn("flex-shrink-0", overlayGranted ? "text-green-400" : "text-gray-400")} size={22} />
              <div>
                <p className={cn("text-[11px] font-black uppercase tracking-widest", overlayGranted ? "text-green-300" : "text-white")}>
                  Tactical Break-In
                </p>
                <p className="text-[8px] text-gray-500 font-bold mt-0.5">Lock-screen Overwrite</p>
              </div>
            </div>
            <button
              onClick={onOpenOverlay}
              className={cn(
                "relative w-14 h-7 rounded-full transition-all flex-shrink-0 border-2",
                overlayGranted ? "bg-green-500 border-green-400" : "bg-gray-700 border-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                overlayGranted ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
              )} />
            </button>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
            Emergency UI will appear over any app or lock-screen for instant visibility.
          </p>
        </div>

        {/* 3. Lifeline Grid — 5-Core Permissions */}
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all",
          isLifelineActive ? "bg-green-500/10 border-green-500/40" : "bg-white/3 border-white/10"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Smartphone className={cn("flex-shrink-0", isLifelineActive ? "text-green-400" : "text-gray-400")} size={22} />
              <div>
                <p className={cn("text-[11px] font-black uppercase tracking-widest", isLifelineActive ? "text-green-300" : "text-white")}>
                  Lifeline Grid
                </p>
                <p className="text-[8px] text-gray-500 font-bold mt-0.5">SMS, Call, GPS, Camera, Mic</p>
              </div>
            </div>
            <button
              onClick={onRequestPerms}
              className={cn(
                "relative w-14 h-7 rounded-full transition-all flex-shrink-0 border-2",
                isLifelineActive ? "bg-green-500 border-green-400" : "bg-gray-700 border-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                isLifelineActive ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
              )} />
            </button>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
            Full sensor activation for SOS. Secure transmission of all forensic artifacts to your guardians.
          </p>
          {!isLifelineActive && (
            <div className="mt-3 grid grid-cols-5 gap-1.5 opacity-60">
               {['SMS', 'Call', 'GPS', 'Cam', 'Mic'].map((p, i) => {
                 const states = [perms.sms, perms.call, perms.location, perms.camera, perms.microphone];
                 const isG = states[i] === 'granted';
                 return (
                   <div key={p} className={cn(
                     "py-1 rounded text-[7px] font-black text-center border uppercase tracking-tighter",
                     isG ? "bg-green-500 border-green-400 text-white" : "bg-white/5 border-white/10 text-white/40"
                   )}>
                     {p}
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>

      {/* ── Gate: All must be ON ── */}
      {!allShieldsActive && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Tactical Gate Locked</p>
            <p className="text-[8px] text-gray-500 mt-0.5">Activate all hardware anchors to proceed to Mission Protocol</p>
          </div>
        </div>
      )}

      {/* ── Mission Protocol Card ── */}
      {allShieldsActive && (
        <motion.div
           ref={protocolRef}
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-6 pt-4 scroll-mt-6"
        >
          {!isReturningUser && (
            <div className="rounded-3xl overflow-hidden border border-red-500/20 bg-black/40 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.1)]">
              {/* Tactical Header */}
              <div className="bg-gradient-to-r from-red-600/40 to-black/20 px-6 py-5 flex items-center justify-between border-b border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  <p className="text-[10px] font-black uppercase tracking-[3px] text-red-100">{tr('tos_title')}</p>
                </div>
                <div className="px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10">
                   <p className="text-[7px] font-black text-red-400 whitespace-nowrap uppercase tracking-widest">{tr('tos_updated')}</p>
                </div>
              </div>

              {/* Protocol Content */}
              <div className="p-6 space-y-6 max-h-64 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-red-500/5">
                <p className="text-[11px] text-red-100/90 font-medium leading-relaxed italic border-l-2 border-red-500/50 pl-4">
                  {tr('tos_intro')}
                </p>
                
                <div className="grid gap-5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="group flex gap-4 items-start relative px-1">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 shrink-0 group-hover:border-red-500/40 transition-colors">
                        0{num}
                      </div>
                      <div className="space-y-1.5">
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          num === 1 ? "text-red-400" : num === 2 ? "text-blue-400" : num === 3 ? "text-amber-400" : num === 4 ? "text-green-400" : "text-purple-400"
                        )}>
                          {(tr as any)(`tos_s${num}_title`)}
                        </p>
                        <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                          {(tr as any)(`tos_s${num}`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affirmation Checkboxes */}
              <div className="p-5 bg-black/60 border-t border-white/5 space-y-3">
                <button 
                  onClick={() => setTosChecked(p => ({ ...p, terms: !p.terms }))} 
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-2xl transition-all border",
                    tosChecked.terms ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0", 
                    tosChecked.terms ? "bg-green-500 border-green-500 scale-110" : "border-white/20"
                  )}>
                    {tosChecked.terms && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <p className={cn("text-[10px] text-left leading-tight font-bold", tosChecked.terms ? "text-green-400" : "text-white/70")}>
                    {tr('tos_check1')}
                  </p>
                </button>

                <button 
                  onClick={() => setTosChecked(p => ({ ...p, permissions: !p.permissions }))} 
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-2xl transition-all border",
                    tosChecked.permissions ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0", 
                    tosChecked.permissions ? "bg-green-500 border-green-500 scale-110" : "border-white/20"
                  )}>
                    {tosChecked.permissions && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <p className={cn("text-[10px] text-left leading-tight font-bold", tosChecked.permissions ? "text-green-400" : "text-white/70")}>
                    {tr('tos_check2')}
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Mega Action Button */}
          <div className="relative group p-1 rounded-[32px] bg-white/5">
            <div className={cn(
                "absolute inset-0 bg-red-600 rounded-[32px] blur-2xl opacity-0 transition-opacity",
                (tosChecked.terms && tosChecked.permissions) && "group-hover:opacity-20"
            )} />
            <button
                disabled={(!isReturningUser && (!tosChecked.terms || !tosChecked.permissions)) || authStatus === 'saving'}
                onClick={onActivate}
                className={cn(
                  "relative w-full py-6 rounded-[28px] font-black uppercase tracking-[5px] text-[13px] shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden",
                  (isReturningUser || (tosChecked.terms && tosChecked.permissions))
                    ? "bg-white text-black active:scale-95 hover:bg-red-50 hover:text-red-600"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                )}
              >
                {authStatus === 'saving' && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                )}
                
                {authStatus === 'saving'
                  ? "GRID SYNCING..."
                  : isReturningUser
                    ? "RESTORE MISSION"
                    : tosChecked.terms && tosChecked.permissions
                      ? tr('tos_confirm')
                      : "✋ PROTOCOL INCOMPLETE"}

                {/* Animated Overlay */}
                {(isReturningUser || (tosChecked.terms && tosChecked.permissions)) && (
                   <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500 animate-[shimmer_2s_infinite]" />
                )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
