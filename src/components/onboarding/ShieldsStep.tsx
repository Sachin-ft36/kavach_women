import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, ScanLine, Smartphone, Zap, CheckCircle2, AlertTriangle, ChevronRight, Landmark } from 'lucide-react';

// Self-contained utility function to replace external '../../lib/utils' import
function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}

// Safely detect platform without external '@capacitor/core' import
const getCapacitorPlatform = () => {
  if (typeof window !== 'undefined') {
    // Check if Capacitor global exists, otherwise fallback to user-agent detection
    const anyWindow = window as any;
    if (anyWindow.Capacitor && typeof anyWindow.Capacitor.getPlatform === 'function') {
      return anyWindow.Capacitor.getPlatform();
    }
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }
    if (/android/.test(userAgent)) {
      return 'android';
    }
  }
  return 'web';
};

interface MissionReadinessProps {
  batteryExempt: boolean;
  overlayGranted: boolean;
  isSentinelActive: boolean;
  setSentinelActive: (active: boolean) => void;
  perms: {
    sms?: string;
    call?: string;
    camera?: string;
    location?: string;
    microphone?: string;
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
  onOpenOEMSettings?: () => void;
  onForceBatteryExempt?: () => void;
  isNative: boolean;
  role?: string;
}

export default function MissionReadiness({
  batteryExempt,
  overlayGranted,
  isSentinelActive,
  setSentinelActive,
  perms = {}, // Fallback to safe empty object to prevent destructured undefined errors
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
  onOpenOEMSettings,
  onForceBatteryExempt,
  isNative,
  role
}: MissionReadinessProps) {

  // Defensively extract permissions with safe fallback values
  const safePerms = {
    sms: perms?.sms || 'denied',
    call: perms?.call || 'denied',
    camera: perms?.camera || 'denied',
    location: perms?.location || 'denied',
    microphone: perms?.microphone || 'denied'
  };

  const isLifelineActive =
    safePerms.sms === 'granted' &&
    safePerms.call === 'granted' &&
    safePerms.location === 'granted' &&
    safePerms.camera === 'granted' &&
    safePerms.microphone === 'granted';

  const isIOS = getCapacitorPlatform() === 'ios';
  const effectiveBatteryExempt = isIOS ? true : batteryExempt;
  const effectiveOverlayGranted = isIOS ? true : overlayGranted;

  const isCitizen = role === 'citizen' || !role;

  const allShieldsActive = effectiveBatteryExempt &&
    effectiveOverlayGranted &&
    isLifelineActive &&
    (isCitizen ? isSentinelActive : true);

  useEffect(() => {
    if (isReturningUser) {
      setTosChecked({ terms: true, permissions: true });
    }
  }, [isReturningUser, setTosChecked]);

  // Count active modules
  const activeModulesCount = [
    effectiveBatteryExempt,
    effectiveOverlayGranted,
    isLifelineActive,
    isCitizen ? isSentinelActive : true
  ].filter(Boolean).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/50">
      
      {/* Top Ministry Badge Banner */}
      <div className="bg-slate-900 text-[9px] text-slate-300 font-bold uppercase tracking-wider py-1.5 px-4 flex items-center justify-center gap-2 border-b border-slate-800">
        <Landmark size={11} className="text-amber-500" />
        <span>KAVACH Security Protocol • Government of India Initiative</span>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 px-4 custom-scrollbar pb-6 pt-4">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-500 border shadow-md relative",
              allShieldsActive 
                ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-emerald-100" 
                : "bg-white border-slate-200 text-slate-700 shadow-slate-100"
            )}
          >
            <ShieldCheck className={cn("transition-transform duration-500", allShieldsActive ? "scale-110" : "scale-100")} size={32} />
            {allShieldsActive && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {allShieldsActive ? "SYSTEM ARMED & SECURED" : "KAVACH System Configuration"}
            </h1>
            <p className={cn(
              "text-[10px] sm:text-xs font-semibold tracking-wide max-w-sm mx-auto leading-normal",
              allShieldsActive ? "text-emerald-600" : "text-slate-500"
            )}>
              {allShieldsActive 
                ? "All critical security and communication lifelines are fully operational." 
                : "Initialize the mandatory background engines and permissions to establish emergency safety."
              }
            </p>
          </div>
        </div>

        {/* Protection Progress & Status Indicator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Verification Progress
              </span>
              <p className="text-xs font-bold text-slate-800">
                {activeModulesCount === 4 ? "Ready to Deploy Shield" : "Awaiting Authorization Modules"}
              </p>
            </div>

            <div className="flex items-baseline gap-1 bg-slate-100 px-3 py-1 rounded-lg">
              <span className="text-base font-black text-slate-900">{activeModulesCount}</span>
              <span className="text-[10px] font-bold text-slate-400">/ 4</span>
            </div>
          </div>

          {/* Clean Progress Bar */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(activeModulesCount / 4) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-colors duration-500",
                allShieldsActive ? "bg-emerald-500" : "bg-blue-600"
              )}
            />
          </div>
        </div>

        {/* Configurations List */}
        <div className="space-y-3">
          
          {/* Module 1: Always On Protection (Hidden on iOS) */}
          {!isIOS && (
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-300 shadow-sm",
              batteryExempt 
                ? "bg-emerald-50/20 border-emerald-500/30" 
                : "bg-white border-amber-200 ring-4 ring-amber-500/5"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all mt-0.5",
                    batteryExempt ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                  )}>
                    <Activity size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        Emergency Response Engine
                      </h3>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                        batteryExempt ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {batteryExempt ? "Armed" : "Critical"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      KAVACH must bypass battery optimization to trigger SOS in sleep state.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenBattery}
                  className={cn(
                    "relative w-12 h-6.5 rounded-full transition-colors duration-300 shrink-0",
                    batteryExempt ? "bg-emerald-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-300",
                    batteryExempt ? "translate-x-6.5" : "translate-x-1"
                  )} />
                </button>
              </div>

              {!batteryExempt && (
                <div className="mt-3.5 pt-3 border-t border-amber-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-bold">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span>SYSTEM ALERT: Core engine will go dormant if optimization is enabled.</span>
                  </div>
                  {isNative && (
                    <button
                      onClick={onOpenAppSettings}
                      className="text-[10px] text-slate-600 hover:text-slate-900 font-bold underline underline-offset-2 flex items-center gap-1"
                    >
                      <span>Android 15: Open settings to remove restrictions</span>
                      <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              )}

              {batteryExempt && (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-700 text-[10px] font-semibold">
                  <CheckCircle2 size={12} />
                  <span>Always-On background service verified.</span>
                </div>
              )}
            </div>
          )}

          {/* Module 2: Emergency Interface Authorization (Hidden on iOS) */}
          {!isIOS && (
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-300 shadow-sm",
              overlayGranted 
                ? "bg-emerald-50/20 border-emerald-500/30" 
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all mt-0.5",
                    overlayGranted ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                  )}>
                    <ScanLine size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        Lock Screen SOS Access
                      </h3>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                        overlayGranted ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      )}>
                        {overlayGranted ? "Granted" : "Required"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Enables physical SOS widgets and emergency feeds on top of the lock screen.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenOverlay}
                  className={cn(
                    "relative w-12 h-6.5 rounded-full transition-colors duration-300 shrink-0",
                    overlayGranted ? "bg-emerald-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-300",
                    overlayGranted ? "translate-x-6.5" : "translate-x-1"
                  )} />
                </button>
              </div>

              {!overlayGranted && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                    <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                    <span>Highly recommended for immediate safety access during duress.</span>
                  </div>
                  {isNative && (
                    <button
                      onClick={onOpenAppSettings}
                      className="text-[10px] text-slate-600 hover:text-slate-900 font-bold underline underline-offset-2 flex items-center gap-1"
                    >
                      <span>Resolve restricted lock-screen setting</span>
                      <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              )}

              {overlayGranted && (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-700 text-[10px] font-semibold">
                  <CheckCircle2 size={12} />
                  <span>Overlay authorization verified.</span>
                </div>
              )}
            </div>
          )}

          {/* Module 3: Kinetic Sentinel Authorization */}
          {isCitizen && (
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-300 shadow-sm",
              isSentinelActive 
                ? "bg-emerald-50/20 border-emerald-500/30" 
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all mt-0.5",
                    isSentinelActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                  )}>
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        Shake-to-Activate SOS
                      </h3>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                        isSentinelActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      )}>
                        {isSentinelActive ? "Active" : "Recommended"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Triggers a priority emergency sequence when the handset is shaken aggressively.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSentinelActive(!isSentinelActive)}
                  className={cn(
                    "relative w-12 h-6.5 rounded-full transition-colors duration-300 shrink-0",
                    isSentinelActive ? "bg-emerald-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-300",
                    isSentinelActive ? "translate-x-6.5" : "translate-x-1"
                  )} />
                </button>
              </div>

              {!isSentinelActive && (
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium leading-normal">
                    Allows triggering emergency responses hands-free without opening the screen.
                  </p>
                </div>
              )}

              {isSentinelActive && (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-700 text-[10px] font-semibold">
                  <CheckCircle2 size={12} />
                  <span>Violent movement detection operational.</span>
                </div>
              )}
            </div>
          )}

          {/* Module 4: Safety Core Permissions */}
          <div className={cn(
            "p-4 rounded-2xl border transition-all duration-300 shadow-sm",
            isLifelineActive 
              ? "bg-emerald-50/20 border-emerald-500/30" 
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all mt-0.5",
                  isLifelineActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                )}>
                  <Smartphone size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">
                      Emergency Permissions
                    </h3>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                      isLifelineActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {isLifelineActive ? "Authorized" : "Action Required"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Crucial hardware features required to capture media, map location, and contact dispatch.
                  </p>
                </div>
              </div>

              <button
                onClick={onRequestPerms}
                className={cn(
                  "relative w-12 h-6.5 rounded-full transition-colors duration-300 shrink-0",
                  isLifelineActive ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-300",
                  isLifelineActive ? "translate-x-6.5" : "translate-x-1"
                )} />
              </button>
            </div>

            {/* Permission badges matrix */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 pt-2">
              {[
                { name: 'SMS Alerts', state: safePerms.sms },
                { name: 'Emergency Calls', state: safePerms.call },
                { name: 'Live GPS', state: safePerms.location },
                { name: 'Camera Feed', state: safePerms.camera },
                { name: 'Microphone', state: safePerms.microphone }
              ].map((item) => {
                const isGranted = item.state === 'granted';
                return (
                  <div 
                    key={item.name} 
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-[9px] font-bold text-center border uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
                      isGranted 
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700" 
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    )}
                  >
                    {isGranted && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    <span className="truncate">{item.name}</span>
                  </div>
                );
              })}
            </div>

            {!isLifelineActive && isNative && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 text-center">
                <button 
                  onClick={onOpenAppSettings} 
                  className="text-[10px] text-slate-600 hover:text-slate-900 font-bold underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <span>Manual Override: Allow Background Location in App Info</span>
                  <ChevronRight size={10} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Security Status Bar & Action Footer */}
      <div className="shrink-0 p-4 bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] space-y-3">
        {allShieldsActive ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onActivate}
            className="w-full py-4 rounded-xl font-bold text-[11px] tracking-widest uppercase flex items-center justify-between px-6 transition-all border-none bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/15 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-white text-[11px] font-black">PROCEED TO CONSOLE</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-300">INITIATE REVIEW</span>
              <ChevronRight size={14} className="text-white" />
            </div>
          </motion.button>
        ) : (
          <div className="w-full py-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              Awaiting Mandatory Security Modules
            </span>
          </div>
        )}
      </div>
      
    </div>
  );
}