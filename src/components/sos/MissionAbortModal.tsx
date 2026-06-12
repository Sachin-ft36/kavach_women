import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../store/useKavachStore';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[8000] flex items-center justify-center p-6 bg-black/90"
    >
      <div className="relative w-full max-w-[400px] max-h-[92vh] bg-white rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Safety Confirmation</h2>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Official Record Update</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-[12px] font-semibold text-gray-600 leading-relaxed text-center px-2">
            {activeAlertData?.status === 'rescued_pending_victim_clearance'
              ? "The Protector has confirmed your safety. Please provide a final closure note."
              : "Please confirm why you are closing this SOS request."
            }
          </p>

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
                  "w-full py-3 px-4 rounded-xl text-[12px] font-bold text-left transition-colors border flex items-center justify-between",
                  abortReason === reason
                    ? "bg-blue-50 border-blue-600 text-blue-900"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{reason}</span>
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  abortReason === reason ? "border-blue-600 bg-blue-600" : "border-gray-300"
                )}>
                  {abortReason === reason && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          {abortReason === 'Other reason' && (
            <div className="mt-2">
              <textarea
                placeholder="Please provide details..."
                className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-gray-400 min-h-[80px]"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider text-center leading-relaxed">
              False reports are logged for emergency accountability.
            </p>
          </div>

          <button
            onClick={handleFinalAbort}
            disabled={!abortReason || isAborting}
            className={cn(
              "w-full py-4 rounded-xl font-black uppercase tracking-[2px] text-xs transition-all",
              abortReason
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed",
              isAborting && "opacity-50 cursor-wait"
            )}
          >
            {isAborting ? 'PROCESSING...' : 'CONFIRM & CLOSE ALERT'}
          </button>

          <div className="flex flex-col items-center gap-1.5 pt-2">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-[8px] font-bold uppercase tracking-widest">ID: {activeAlertId?.slice(-4).toUpperCase()}</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Archived Securely</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
