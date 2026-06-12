import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Landmark } from 'lucide-react';
import { BatteryExemptModule } from './modules/BatteryExemptModule';
import { OverlayGrantedModule } from './modules/OverlayGrantedModule';
import { SentinelActiveModule } from './modules/SentinelActiveModule';
import { EmergencyPermissionsModule } from './modules/EmergencyPermissionsModule';

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
            <BatteryExemptModule 
              batteryExempt={batteryExempt}
              onOpenBattery={onOpenBattery}
              onOpenAppSettings={onOpenAppSettings}
              isNative={isNative}
            />
          )}

          {/* Module 2: Emergency Interface Authorization (Hidden on iOS) */}
          {!isIOS && (
            <OverlayGrantedModule 
              overlayGranted={overlayGranted}
              onOpenOverlay={onOpenOverlay}
              onOpenAppSettings={onOpenAppSettings}
              isNative={isNative}
            />
          )}

          {/* Module 3: Kinetic Sentinel Authorization */}
          {isCitizen && (
            <SentinelActiveModule 
              isSentinelActive={isSentinelActive}
              setSentinelActive={setSentinelActive}
            />
          )}

          {/* Module 4: Safety Core Permissions */}
          <EmergencyPermissionsModule 
            isLifelineActive={isLifelineActive}
            onRequestPerms={onRequestPerms}
            onOpenAppSettings={onOpenAppSettings}
            isNative={isNative}
            safePerms={safePerms}
          />

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