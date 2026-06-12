import React, { useState, useEffect } from 'react';
import { Car, Radar, Power, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

interface TollGate { id: string; name: string; state: string; status: string; coords: number[]; }
interface TrafficSignal { id: string; intersection: string; status: string; }

interface Props {
  tollGates: TollGate[];
  setTollGates: (fn: (prev: TollGate[]) => TollGate[]) => void;
  trafficSignals: TrafficSignal[];
  setTrafficSignals: (fn: (prev: TrafficSignal[]) => TrafficSignal[]) => void;
  anprLogs: string[];
  isSovereignActive?: boolean;
  startAnprSimulator: () => ReturnType<typeof setInterval>;
}

export default function TransitInfraPanel({
  tollGates, setTollGates, trafficSignals, setTrafficSignals,
  anprLogs, isSovereignActive, startAnprSimulator
}: Props) {
  const [activeCCTVID, setActiveCCTVID] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [irMode, setIrMode] = useState(false);

  useEffect(() => {
    const timer = startAnprSimulator();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── TOLL GATE CONTROL ── */}
      <div>
        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[4px] mb-4">Sovereign Toll Gates</h3>
        <div className="space-y-3">
          {tollGates.map(gate => (
            <div
              key={gate.id}
              onClick={() => setActiveCCTVID(gate.id)}
              className={cn(
                'p-4 rounded-[2.5rem] border cursor-pointer transition-all hover:bg-white/5 bg-[#1E293B]/50 flex justify-between items-center',
                activeCCTVID === gate.id ? 'border-amber-500/30 bg-amber-500/5 shadow-md shadow-amber-500/5' : 'border-white/5'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Car size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-white uppercase truncate">{gate.name}</h4>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">{gate.state} · ID: {gate.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0',
                  gate.status === 'OPEN'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                )}>
                  {gate.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSovereignActive) { toast.error('OVERRIDE BLOCKED', { description: 'Sovereign Override must be active.' }); return; }
                    setTollGates(prev => prev.map(g => g.id === gate.id ? { ...g, status: g.status === 'OPEN' ? 'CLOSED' : 'OPEN' } : g));
                    toast.success(gate.status === 'OPEN' ? `GATE ${gate.id} SEALED` : `GATE ${gate.id} RELEASED`);
                  }}
                  className="w-8 h-8 rounded-xl bg-[#0F172A] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <Power size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRAFFIC SIGNAL OVERRIDE ── */}
      <div>
        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[4px] mb-4">Traffic Signal Override</h3>
        <div className="space-y-3">
          {trafficSignals.map(sig => (
            <div key={sig.id} className="p-4 rounded-[2.5rem] border border-white/5 bg-[#1E293B]/50 flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Radar size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-white uppercase truncate">{sig.intersection}</h4>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {sig.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0F172A] p-1 rounded-xl border border-white/5 shrink-0">
                {(['RED', 'GREEN', 'AUTO'] as const).map(mode => {
                  const statusMap = { RED: 'ALL-RED LOCK', GREEN: 'FORCE-GREEN', AUTO: 'AUTO-GREEN' };
                  const isCurrent = sig.status === statusMap[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        if (!isSovereignActive) { toast.error('OVERRIDE BLOCKED', { description: 'Sovereign Override must be active.' }); return; }
                        setTrafficSignals(prev => prev.map(s => s.id === sig.id ? { ...s, status: statusMap[mode] } : s));
                        toast.success(`SIGNAL ${sig.id} FORCE SET TO ${mode}`);
                      }}
                      className={cn(
                        'px-2 py-1 text-[7px] font-black uppercase tracking-widest rounded-lg transition-all',
                        isCurrent
                          ? (mode === 'RED' ? 'bg-rose-600 text-white' : mode === 'GREEN' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white')
                          : 'text-gray-500 hover:text-white'
                      )}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CCTV FLOATING PANEL ── */}
      <AnimatePresence>
        {activeCCTVID && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed top-6 right-6 z-40 w-[360px] bg-black/90 backdrop-blur-md border border-white/10 rounded-[30px] overflow-hidden shadow-2xl flex flex-col font-['Outfit']"
          >
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black text-white uppercase tracking-[4px]">LIVE CCTV FEED: {activeCCTVID}</span>
              </div>
              <button onClick={() => setActiveCCTVID(null)} className="text-gray-500 hover:text-white text-[9px] font-black uppercase tracking-widest">DISCONNECT</button>
            </div>

            <div className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none animate-pulse-slow" />
              <div className="absolute top-4 left-4 border-t-2 border-l-2 border-white/20 w-4 h-4" />
              <div className="absolute top-4 right-4 border-t-2 border-r-2 border-white/20 w-4 h-4" />
              <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-white/20 w-4 h-4" />
              <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-white/20 w-4 h-4" />
              <div className="absolute top-3 left-4 text-[7px] font-mono text-cyan-400/80 uppercase tracking-widest space-y-0.5">
                <p>CAM-REF: {tollGates.find(g => g.id === activeCCTVID)?.name || activeCCTVID}</p>
                <p>UTC: {new Date().toISOString().slice(11, 19)}</p>
                <p>ZOOM: {cameraZoom}X {irMode ? '· IR ENGAGED' : ''}</p>
              </div>
              <div className="absolute bottom-3 right-4 text-[7px] font-mono text-cyan-400/80 uppercase tracking-widest text-right">
                <p>AUTO-ANPR: ACTIVE</p>
                <p>RES: 4K 60FPS</p>
                <p>SIG STRENGTH: 99.8%</p>
              </div>
              <div className={cn('w-full h-full flex flex-col items-center justify-center transition-all p-6', irMode ? 'bg-emerald-950/20 grayscale invert text-emerald-400' : 'bg-neutral-900 text-cyan-500')}>
                <Eye size={40} className="opacity-40 animate-pulse mb-3" />
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Target Tracking Feed</p>
                  <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">NOH-PLAZA BARRIER SECURE</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/40 flex-1 flex flex-col max-h-[140px]">
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2 leading-none">Auto License Plate Scanner (ANPR)</span>
              <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar text-[8px] font-mono text-gray-400">
                {anprLogs.map((log, i) => (
                  <div key={i} className={cn('p-1.5 rounded bg-white/5 border border-white/5 truncate', log.includes('WANTED') || log.includes('VIOLATION') || log.includes('DRIFT') ? 'text-rose-400 border-rose-500/20 bg-rose-500/5 animate-pulse' : '')}>{log}</div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCameraZoom(z => Math.min(8, z + 1))} className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-[8px] font-black uppercase tracking-widest border border-white/10 cursor-pointer">ZOOM+</button>
                <button onClick={() => setCameraZoom(z => Math.max(1, z - 1))} className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-[8px] font-black uppercase tracking-widest border border-white/10 cursor-pointer">ZOOM-</button>
                <button onClick={() => setIrMode(!irMode)} className={cn('px-2.5 py-1.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer', irMode ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white')}>IR NIGHT</button>
              </div>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Sovereign Control Link</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
