import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserCheck, Phone } from 'lucide-react';

interface Props {
  activeAlertData: any;
  initiateCall: (uid: string, name: string) => void;
}

export default function ResponderHub({ activeAlertData, initiateCall }: Props) {
  return (
    <AnimatePresence mode="wait">
      {(activeAlertData?.activeResponders?.length > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-[8px] sm:text-[9px] font-semibold text-blue-600 uppercase tracking-[1px] sm:tracking-[2px] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              {(() => {
                const unique = (activeAlertData?.activeResponders || []).filter(
                  (v: any, i: number, a: any[]) => a.findIndex(t => t.uid === v.uid) === i
                );
                return unique.length;
              })()} Protector{(activeAlertData?.activeResponders?.length || 0) > 1 ? "s" : ""} Responding
            </p>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            </div>
          </div>

          <div className="max-h-[160px] sm:max-h-[180px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar space-y-2 sm:space-y-3">
            {(activeAlertData?.activeResponders || [])
              .filter((v: any, i: number, a: any[]) => a.findIndex(t => t.uid === v.uid) === i)
              .map((responder: any) => (
                <motion.div
                  key={responder.uid}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white border border-slate-200 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 sm:gap-3 relative z-10 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 flex-shrink-0">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <h4 className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-slate-800 uppercase truncate max-w-[110px] sm:max-w-[180px]">
                          {responder.name}
                        </h4>
                        {(responder.xp || 0) >= 25000 && (
                          <div className="px-1 py-0.5 bg-blue-700 rounded-full flex items-center flex-shrink-0">
                            <ShieldCheck className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-blue-600 rounded-full" />
                        <p className="text-[6px] sm:text-[7px] font-bold text-gray-500 uppercase tracking-wide sm:tracking-widest">
                          Active Dispatch
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <button
                      onClick={() => {
                        console.log("📞 KAVACH UI: Secure Link Initiated for", responder.name);
                        initiateCall(responder.uid, responder.name);
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all hover:bg-blue-800 flex-shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
