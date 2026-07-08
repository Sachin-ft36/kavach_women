import React from 'react';
import { ShieldAlert, Gavel, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../state/useKavachStore';

interface Props {
  abortReason: string;
  setAbortReason: (reason: string) => void;
  isAborting: boolean;
  handleFinalAbort: () => void;
  activeAlertData: any;
}

export default function MissionAbortModal({ abortReason, setAbortReason, isAborting, handleFinalAbort, activeAlertData }: Props) {
  const activeAlertId = useKavachStore(state => state.activeAlertId);

  return (
    <div className="absolute inset-0 z-[8000] flex items-center justify-center p-4 bg-black/80 font-['Outfit']">
      <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
        
        {/* 🏛️ Official Gov Header */}
        <div className="bg-[#FF9933] px-6 py-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5 opacity-50" />
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md mb-0.5">
              <ShieldAlert size={26} className="text-[#FF9933]" strokeWidth={2.5} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-[7px] font-black uppercase tracking-[3px] text-white/80">National Safety Network</h2>
              <h1 className="text-base font-black uppercase text-white tracking-tight leading-none">Safety Confirmation</h1>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[60vh]">
          <p className="text-[11px] font-bold text-gray-800 leading-relaxed text-center">
            {activeAlertData?.status === 'rescued_pending_victim_clearance'
              ? "The Protector has confirmed your safety. Please select a reason for record updates."
              : "Please confirm why you are closing this SOS request."
            }
          </p>

          {/* Simple Radio Options */}
          <div className="grid grid-cols-1 gap-2">
            {[
              'I am safe now',
              'Help has arrived',
              'Reached a safe location',
              'Accidentally triggered SOS',
              'Threat no longer nearby',
              'Other reason'
            ].map((reason) => (
              <button
                key={reason}
                onClick={() => setAbortReason(reason)}
                className={cn(
                  "w-full py-2.5 px-4 rounded-xl text-[11px] font-bold text-left transition-colors border flex items-center justify-between",
                  abortReason === reason
                    ? "bg-orange-50/50 border-[#FF9933] text-orange-950"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{reason}</span>
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                  abortReason === reason ? "border-[#FF9933] bg-[#FF9933]" : "border-gray-300"
                )}>
                  {abortReason === reason && <div className="w-1 h-1 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          {abortReason === 'Other reason' && (
            <div className="mt-1">
              <textarea
                placeholder="Enter details..."
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-xs font-semibold focus:ring-2 focus:ring-[#FF9933]/30 outline-none transition-all placeholder:text-gray-400 min-h-[70px]"
              />
            </div>
          )}

          {/* Accountability Notice */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[9px] font-black text-red-700 uppercase tracking-wider text-center leading-relaxed">
              False reports are logged for emergency accountability.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 border-t border-gray-100 space-y-3">
          <button
            onClick={handleFinalAbort}
            disabled={!abortReason || isAborting}
            className={cn(
              "w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow active:scale-[0.98]",
              abortReason
                ? "bg-[#0F172A] text-white hover:bg-[#1E293B]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <CheckCircle2 size={15} />
            {isAborting ? 'Processing...' : 'Confirm & Close Alert'}
          </button>

          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full" />
            <span className="text-[7px] font-black text-gray-500 uppercase tracking-[2px]">ID: {activeAlertId?.slice(-4).toUpperCase()} • Archived Securely</span>
          </div>
        </div>

      </div>
    </div>
  );
}
