import React from 'react';
import { ScanLine, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface OverlayGrantedModuleProps {
  overlayGranted: boolean;
  onOpenOverlay: () => void;
  onOpenAppSettings: () => void;
  isNative: boolean;
}

export function OverlayGrantedModule({
  overlayGranted,
  onOpenOverlay,
  onOpenAppSettings,
  isNative
}: OverlayGrantedModuleProps) {
  return (
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
  );
}
