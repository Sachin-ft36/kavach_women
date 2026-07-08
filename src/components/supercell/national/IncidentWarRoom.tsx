import React from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Zap, Crosshair, Terminal, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IncidentWarRoomProps {
  incidentData: any;
  isSimulatingRun: boolean;
  triggerStateHighwaySimulation: () => void;
  isNakabandiDeployed: boolean;
  deployHighwayNakabandi: () => void;
}

export const IncidentWarRoom = ({
  incidentData,
  isSimulatingRun,
  triggerStateHighwaySimulation,
  isNakabandiDeployed,
  deployHighwayNakabandi
}: IncidentWarRoomProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col gap-4 overflow-hidden"
    >
      <div className="flex items-center gap-2">
         <Fingerprint size={16} className="text-[#38BDF8]" />
         <h3 className="text-[14px] font-black text-white uppercase tracking-[2px]">BNSS Sec 63 Chain</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        
        {/* Case Dispatch ID badge */}
        <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-2">
          <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">Operational Case Code</span>
          <h4 className="text-sm font-black text-white tracking-wider font-mono text-cyan-400 italic">{incidentData.incidentId}</h4>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 " />
            <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Live Node Intercept Active</span>
          </div>
        </div>

        {/* 🍊 STATE RADAR SURVEILLANCE & HIGHWAY ESCALATION SIMULATOR */}
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-amber-400 animate-bounce" />
            <span className="text-[12px] font-black text-white uppercase tracking-widest">State HQ Intercept Radar</span>
          </div>
          <p className="text-[12px] text-gray-400 font-bold uppercase leading-relaxed">
            Escalate local grid alert into dynamic State HQ highway tracking.
          </p>
          <button 
            onClick={triggerStateHighwaySimulation}
            className={cn(
              "w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
              isSimulatingRun 
                ? "bg-amber-600 border-amber-600 text-slate-950 font-bold" 
                : "bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold"
            )}
          >
            <Crosshair size={12} />
            {isSimulatingRun ? 'Cancel State Intercept' : `Track Escape Vector (${incidentData?.city || 'City'} -> State Border)`}
          </button>

          {/* 🚧 DYNAMIC NHAI TOLL PLAZA IOT LOCKDOWN PANEL */}
          {isSimulatingRun && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">🚧 NHAI TOLL INTERDICT GRID</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[5px] font-black uppercase tracking-widest ",
                  isNakabandiDeployed ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"
                )}>
                  {isNakabandiDeployed ? "GRID LOCKED" : "ONLINE / STANDBY"}
                </span>
              </div>

              {/* List of Simulated Toll Plaza IoT Nodes */}
              <div className="space-y-1.5">
                {(incidentData.nearbyTolls || [
                  { name: `${incidentData.city} Main Highway Toll (T1)`, road: "NH-12 Grid Sector A", relay: "PLC-01" },
                  { name: `${incidentData.stateName} Border Checkpost Toll (T2)`, road: "NH-3 Interstate Link", relay: "PLC-04" }
                ]).map((gate: any, i: number) => (
                  <div key={i} className="bg-slate-950 border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                    <div className="flex-1 pr-2">
                      <h5 className="text-[12px] font-black text-white uppercase tracking-tight truncate">{gate.name}</h5>
                      <span className="text-[14px] text-slate-400 font-bold uppercase tracking-widest block truncate">{gate.road}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-widest block",
                        isNakabandiDeployed ? "text-rose-500 " : "text-emerald-500"
                      )}>
                        {isNakabandiDeployed ? "🚨 BARRIER LOCKED" : "🟢 AUTO-FASTAG"}
                      </span>
                      <span className="text-[5px] text-slate-500 font-mono tracking-tighter">IoT ID: {gate.relay || `PLC-0${i+1}`} // 24V Signal</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ANPR Camera feed / fastag block status */}
              {isNakabandiDeployed ? (
                <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-2.5 text-center space-y-1.5 ">
                  <span className="text-[6.5px] font-black text-rose-400 uppercase tracking-widest block">🔒 RFID FASTAG LOCKOUT ENGAGED</span>
                  <p className="text-[5.5px] text-rose-350 leading-relaxed font-bold uppercase">
                    Suspect vehicle flagged at central toll server. Dynamic boom barrier PLC relays disabled. Physical crash grid deployed.
                  </p>
                </div>
              ) : (
                <button
                  onClick={deployHighwayNakabandi}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/20"
                >
                  <Lock size={10} /> TRIGGER HIGHWAY NAKABANDI
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hacker Rolling Text Console */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-gray-500 font-black uppercase tracking-widest">System Log Terminal</span>
            <Terminal size={10} className="text-[#38BDF8]" />
          </div>
          <div className="bg-[#020617] border border-white/5 p-4 rounded-2xl font-mono text-[13px] text-[#38BDF8] space-y-2 h-36 overflow-y-auto custom-scrollbar shadow-inner">
            {(incidentData.systemLogs || []).map((log: string, index: number) => (
              <div key={index} className="flex gap-1.5 items-start">
                <span className="text-[#38BDF8]/40 font-black shrink-0">&gt;&gt;</span>
                <span className="leading-snug text-[12px] tracking-tight">{log}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
