import React from 'react';
import { Activity, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BatteryExemptModuleProps {
  batteryExempt: boolean;
  onOpenBattery: () => void;
  onOpenAppSettings: () => void;
  isNative: boolean;
}

export function BatteryExemptModule({
  batteryExempt,
  onOpenBattery,
  onOpenAppSettings,
  isNative
}: BatteryExemptModuleProps) {
  return (
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
  );
}
