import React, { useState } from 'react';
import { useGuardianState } from '../components/guardian/hooks/useGuardianState';
import { History, MapPin, Clock, Trash2, Play, Download, ShieldAlert, ChevronRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import JourneyPlaybackOverlay from '../components/guardian/JourneyPlaybackOverlay';

export default function GuardianHistoryScreen() {
  const {
    historicalJourneys,
    handleDeleteHistory,
    loadingFamily
  } = useGuardianState();

  const [playbackJourney, setPlaybackJourney] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#080F1A] text-white p-4 sm:p-6 overflow-hidden min-h-screen pb-32">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
            <History className="text-sky-400" size={28} />
            Track History
          </h1>
          <p className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-[3px] mt-1 opacity-60">
            Citizen Telemetry Logs // Active
          </p>
        </div>
        <div className="bg-sky-450/10 border border-sky-400/20 px-3 py-1 rounded-full text-[10px] font-black text-sky-400 animate-pulse">
          {historicalJourneys.length} Rides
        </div>
      </div>

      {loadingFamily ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">Fetching Ride Logs...</p>
        </div>
      ) : historicalJourneys.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/5 rounded-[28px] border border-white/10 border-dashed my-8">
          <ShieldAlert size={48} className="text-gray-600 mb-4" />
          <h3 className="text-lg font-black italic uppercase text-gray-400">No Past Journeys</h3>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">
            No telemetry records have been logged in the past 24 hours.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-w-2xl mx-auto w-full">
          <AnimatePresence mode="popLayout">
            {historicalJourneys.map((history, index) => {
              const endedTimeStr = history.endedAt
                ? new Date(history.endedAt.seconds ? history.endedAt.seconds * 1000 : history.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'N/A';
              const endedDateStr = history.endedAt
                ? new Date(history.endedAt.seconds ? history.endedAt.seconds * 1000 : history.endedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : '';

              return (
                <motion.div
                  key={history.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-4 space-y-3.5 shadow-xl relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
                        {history.userName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-black text-white leading-none">{history.userName || 'Citizen'}</h4>
                        <span className="text-[8.5px] text-[#64748B] font-bold block mt-1 leading-none">
                          Completed at {endedTimeStr} · {endedDateStr}
                        </span>
                      </div>
                    </div>
                    <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest leading-none">
                      Safe
                    </span>
                  </div>

                  <div className="bg-[#080F1A]/60 border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-sky-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-350 leading-tight">
                        <span className="font-extrabold text-white">To:</span> {history.destination || 'Not Specified'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={12} className="text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-tight">
                        <span className="font-bold">Vehicle:</span> {history.vehicleNo || 'PCR-UNASSIGNED'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPlaybackJourney(history)}
                      className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/25 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Play size={10} fill="currentColor" /> Play Replay
                    </button>

                    <button
                      onClick={() => {
                        try {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `kavach_ride_${history.userName}_${history.id}.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                          toast.success("Telemetry log download started.");
                        } catch (err) {
                          toast.error("Download failed.");
                        }
                      }}
                      className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-none"
                    >
                      <Download size={10} /> Download
                    </button>

                    <button
                      onClick={() => handleDeleteHistory(history.id)}
                      className="py-2 px-3 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete History"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Playback Map Overlay */}
      {playbackJourney && (
        <JourneyPlaybackOverlay
          journey={playbackJourney}
          onClose={() => setPlaybackJourney(null)}
        />
      )}
    </div>
  );
}
