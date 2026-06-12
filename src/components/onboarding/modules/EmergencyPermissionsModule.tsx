import React from 'react';
import { Smartphone, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface EmergencyPermissionsModuleProps {
  isLifelineActive: boolean;
  onRequestPerms: () => void;
  onOpenAppSettings: () => void;
  isNative: boolean;
  safePerms: {
    sms: string;
    call: string;
    camera: string;
    location: string;
    microphone: string;
  };
}

export function EmergencyPermissionsModule({
  isLifelineActive,
  onRequestPerms,
  onOpenAppSettings,
  isNative,
  safePerms
}: EmergencyPermissionsModuleProps) {
  return (
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
  );
}
