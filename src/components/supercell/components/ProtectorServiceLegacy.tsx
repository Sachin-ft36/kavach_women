import React from 'react';
import { History, CheckCircle2, Star, Phone, Fingerprint } from 'lucide-react';

interface ProtectorServiceLegacyProps {
  missionHistory: any[];
  selectedProt: any;
  onViewReplay?: (missionId: string) => void;
}

export function ProtectorServiceLegacy({ missionHistory, selectedProt, onViewReplay }: ProtectorServiceLegacyProps) {
  return (
    <div className="space-y-6">
       <h3 className="text-xs font-black text-gray-500 uppercase tracking-[4px] ml-1">Service Legacy & Mission Intelligence</h3>
       <div className="bg-[#1E293B]/50 rounded-[40px] border border-white/5 p-8">
          {missionHistory.length === 0 ? (
            <div className="py-20 text-center opacity-20">
               <History size={48} className="mx-auto mb-4" />
               <p className="text-[14px] font-black uppercase tracking-widest">No Rescue History Recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
               {missionHistory.map((mission) => {
                  const callLog = mission.callLogs?.[0];
                  return (
                    <div key={mission.id} className="p-6 bg-[#0F172A] rounded-3xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                             <CheckCircle2 size={24} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-white uppercase italic">{mission.victimName || 'Citizen Rescue'}</h4>
                             <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                {mission.timestamp ? new Date(mission.timestamp.toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'PAST MISSION'}
                             </p>
                          </div>
                       </div>

                       <div className="flex items-center gap-12">
                          {/* ⭐ RATING INTEL */}
                          <div className="text-right max-w-[180px]">
                             <div className="flex items-center gap-2 justify-end mb-1">
                                <Star size={12} className={mission.ratingsProvided?.[selectedProt.id] ? "text-amber-400" : "text-gray-600"} />
                                <span className="text-[14px] font-black text-white italic">
                                  {mission.ratingsProvided?.[selectedProt.id] ? `${mission.ratingsProvided[selectedProt.id]}/5` : 'Unrated'}
                                </span>
                             </div>
                             {mission.feedbacksProvided?.[selectedProt.id] ? (
                               <p className="text-[10px] font-bold text-gray-400 truncate" title={mission.feedbacksProvided[selectedProt.id]}>
                                 "{mission.feedbacksProvided[selectedProt.id]}"
                               </p>
                             ) : (
                               <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Citizen Feedback</p>
                             )}
                          </div>

                          {/* 📞 CALL LOG INTEL */}
                          <div className="text-right">
                             <div className="flex items-center gap-2 justify-end mb-1">
                                <Phone size={12} className="text-blue-400" />
                                <span className="text-[14px] font-black text-white italic">{callLog ? `${Math.floor(callLog.durationSeconds / 60)}m ${callLog.durationSeconds % 60}s` : '0s'}</span>
                             </div>
                             <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Forensic Voice Link</p>
                          </div>

                          {/* 🏹 3D TRACK LINK */}
                          <button 
                            onClick={() => onViewReplay?.(mission.id)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 group-hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                             <Fingerprint size={14} /> 3D Replay
                          </button>
                       </div>
                    </div>
                  );
               })}
            </div>
          )}
       </div>
    </div>
  );
}
