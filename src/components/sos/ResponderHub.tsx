import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserCheck, Phone, CheckCircle2, Award } from 'lucide-react';

interface Props {
  activeAlertData: any;
  initiateCall: (uid: string, name: string) => void;
}

export default function ResponderHub({ activeAlertData, initiateCall }: Props) {
  const respondersMap = activeAlertData?.responders || {};
  const acceptedResponders = Object.keys(respondersMap).map(uid => ({
    uid,
    ...respondersMap[uid]
  }));

  return (
    <AnimatePresence mode="wait">
      {acceptedResponders.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-[8px] sm:text-[9px] font-semibold text-blue-600 uppercase tracking-[1px] sm:tracking-[2px] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              {acceptedResponders.length} Protector{acceptedResponders.length > 1 ? "s" : ""} Responding
            </p>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full " />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {acceptedResponders.map((responder: any) => {
              const isGold = responder.trustTier === 'gold';
              const roleLabel = responder.role?.toUpperCase() || 'RESPONDER';
              const missionsCompleted = responder.completedMissions || 0;

              return (
                <motion.div
                  key={responder.uid}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`border p-3 rounded-2xl flex items-center justify-between relative overflow-hidden bg-white shadow-sm ${
                    isGold ? 'border-amber-400 bg-amber-500/5' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 relative z-10 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                      isGold ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                    }`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-[10px] md:text-[11px] font-bold text-slate-800 uppercase truncate max-w-[120px]">
                          {responder.name}
                        </h4>
                        
                        {/* Trust Badge */}
                        <div className={`px-1.5 py-0.5 rounded-full flex items-center gap-0.5 text-[6px] font-black uppercase tracking-wider ${
                          isGold ? 'bg-amber-500 text-white shadow-sm' : 'bg-blue-600 text-white'
                        }`}>
                          <Award size={6} />
                          {responder.trustTier || 'Blue'}
                        </div>

                        {/* Swarm Role Badge */}
                        <span className="text-[6px] font-black uppercase bg-slate-100 text-slate-600 px-1 py-0.5 rounded border border-slate-200">
                          {roleLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        <span>{missionsCompleted} Successful Missions</span>
                        <span>•</span>
                        <span className="text-rose-600 font-extrabold ">ETA: 2-3 min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 relative z-10">
                    <button
                      onClick={() => {
                        console.log("📞 KAVACH UI: Secure Link Initiated for", responder.name);
                        initiateCall(responder.uid, responder.name);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0 ${
                        isGold ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20' : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md shadow-blue-700/20'
                      }`}
                    >
                      <Phone className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
