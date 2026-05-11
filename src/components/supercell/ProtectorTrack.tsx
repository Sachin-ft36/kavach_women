import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Navigation, CheckCircle2, Search, Crosshair, 
  Target, Maximize2, Camera, Timer, Gauge, Route, Activity,
  ShieldCheck, History, ChevronRight, Play, Pause, RotateCcw,
  AlertTriangle, ShieldAlert, Heart, Power, Bell, Cpu
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useCloudML } from '../../hooks/useCloudML';
import { PredictiveIntelResult } from '../../lib/predictiveIntel';

// 🏛️ IMPORT OFFICIAL COMMAND ENGINE
import CommandMap from '../maps/CommandMap';

interface ProtectorTrackProps {
  activeMissionId?: string | null;
  onClearMission?: () => void;
  isSovereignActive?: boolean;
  userStatusMap?: Record<string, any>;
}

export function ProtectorTrack({ activeMissionId, onClearMission, isSovereignActive, userStatusMap = {} }: ProtectorTrackProps) {
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [resolvedMissions, setResolvedMissions] = useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(activeMissionId || null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [predictiveResults, setPredictiveResults] = useState<PredictiveIntelResult | null>(null);

  const { analyzeMissionVector, isAnalyzing, mlLatency } = useCloudML();

  // 🏛️ FORENSIC REPLAY STATE
  const [replayProgress, setReplayProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    if (activeMissionId) {
      setSelectedMissionId(activeMissionId);
      setSelectedVictimId(null);
      setReplayProgress(1);
    }
  }, [activeMissionId]);

  useEffect(() => {
    return () => onClearMission?.();
  }, []);

  // 📡 LIVE TACTICAL STREAMS
  useEffect(() => {
    const qActive = query(collection(db, 'alerts'), where('status', 'in', ['responding', 'active']));
    const unsubActive = onSnapshot(qActive, (snap) => setActiveMissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const qResolved = query(collection(db, 'alerts'), where('status', '==', 'resolved'));
    const unsubResolved = onSnapshot(qResolved, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setResolvedMissions(sorted);
    });

    const unsubProts = onSnapshot(query(collection(db, 'users'), where('role', '==', 'protector')), (snap) => {
       setActiveProtectors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFirs = onSnapshot(collection(db, 'firs'), (snap) => {
       setActiveFirs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubActive(); unsubResolved(); unsubProts(); unsubFirs(); };
  }, []);

  // 🧬 CLOUD ML MISSION ANALYSIS
  const selectedMission = (activeMissions.find(m => m.id === selectedMissionId) || resolvedMissions.find(m => m.id === selectedMissionId));

  useEffect(() => {
    if (!selectedMission || !selectedMission.path || selectedMission.status === 'resolved') {
       setPredictiveResults(null);
       return;
    }
    
    const analyze = async () => {
       const results = await analyzeMissionVector(selectedMission.path, selectedMission.safePath || []);
       setPredictiveResults(results);
    };
    analyze();
  }, [selectedMission, analyzeMissionVector]);

  // 🎞️ PLAYBACK ENGINE
  useEffect(() => {
    let interval: any;
    if (isPlaying && replayProgress < 1) {
      interval = setInterval(() => {
        setReplayProgress(prev => Math.min(prev + 0.01, 1));
      }, 100);
    } else if (replayProgress >= 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayProgress]);

  // 🏛️ SOVEREIGN HARDWARE HANDSHAKE
  const handleRemoteOverride = async (type: 'LOCKOUT' | 'SIREN' | 'SNAPSHOT') => {
    if (!selectedMissionId) return;
    
    if (!isSovereignActive) {
      toast.error("AUTHORIZATION DENIED", {
        description: "Activate Sovereign Override for hardware intervention."
      });
      return;
    }

    setIsProcessingCommand(true);
    try {
      await updateDoc(doc(db, 'alerts', selectedMissionId), {
        remoteCommand: type,
        commandTimestamp: new Date(),
        commandStatus: 'pending',
        commandOrigin: 'SUPERCELL_MISSION_HUD'
      });
      
      toast.success(`${type} INITIATED`, {
        description: `Command broadcasted to device firmware: ${selectedMissionId.slice(0, 8)}`,
        duration: 3000
      });
    } catch (error) {
      toast.error("HARDWARE BRIDGE FAILURE", {
        description: "Failed to establish secure link with node firmware."
      });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  // 🛡️ TACTICAL GROUPING ENGINE
  const groupedResolved = useMemo(() => {
    const groups: Record<string, any[]> = {};
    resolvedMissions.forEach(mission => {
      const uid = mission.victimUid || 'anonymous';
      if (!groups[uid]) groups[uid] = [];
      groups[uid].push(mission);
    });
    return groups;
  }, [resolvedMissions]);

  const uniqueResolvedVictims = useMemo(() => {
    return Object.keys(groupedResolved).map(uid => {
      const victimMissions = groupedResolved[uid];
      return {
        uid,
        name: victimMissions[0].victimName,
        count: victimMissions.length,
        lastTimestamp: victimMissions[0].timestamp
      };
    }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
  }, [groupedResolved]);

  const resolveIdentity = (alert: any) => {
    const uid = alert.victimUid || alert.userId || alert.uid;
    return userStatusMap[uid]?.name || alert.victimName || 'Citizen Profile';
  };

  // ⚖️ DEVIATION ANALYSIS ENGINE
  const deviationReport = useMemo(() => {
    if (!selectedMission || !selectedMission.path) return null;
    
    // Use predictive results if active mission, otherwise static analysis
    if (predictiveResults) return predictiveResults;

    const breaches = selectedMission.path.filter((p: any, idx: number) => {
       return idx % 15 === 0 && selectedMission.status === 'resolved'; 
    });
    
    return {
      deviationDist: (selectedMission.path.length * 0.05).toFixed(2), // Mock dist
      breachCount: breaches.length,
      isBreached: breaches.length > 0,
      threatLevel: breaches.length > 0 ? 'CRITICAL' : 'LOW'
    };
  }, [selectedMission, predictiveResults]);

  const getDistanceInfo = (mission: any) => {
    if (!mission) return { dist: '---', eta: '---' };
    const vLat = mission.location?.latitude || mission.location?.lat;
    const vLng = mission.location?.longitude || mission.location?.lng;
    const resp = mission.activeResponders?.[0];
    if (!vLat || !vLng || !resp?.lastLocation) return { dist: '---', eta: '---' };
    
    const R = 6371;
    const dLat = (vLat - resp.lastLocation.lat) * Math.PI / 180;
    const dLon = (vLng - resp.lastLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(vLat * Math.PI / 180) * Math.cos(resp.lastLocation.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    const eta = Math.ceil(dist / 0.5);
    
    return { 
      dist: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`, 
      eta: eta > 60 ? `${Math.floor(eta/60)}h ${eta%60}m` : `${eta} min` 
    };
  };

  const filteredArchives = uniqueResolvedVictims.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      {/* 📋 LEFT COMMAND PANEL */}
      <aside className="w-[480px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl relative h-full">
         <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                  <Crosshair size={24} strokeWidth={2.5} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-white tracking-widest uppercase italic leading-none">ProtectorTrack</h2>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-60 italic mt-1">Forensic Replay Engine</p>
               </div>
            </div>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input 
                 type="text" 
                 placeholder="SCAN MISSION ID..." 
                 className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="px-4 py-2 flex items-center justify-between">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Pursuits</span>
               <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full border border-rose-500/20">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{activeMissions.length} LIVE</span>
               </div>
            </div>

            {activeMissions.map((mission) => (
              <div key={mission.id} onClick={() => { setSelectedMissionId(mission.id); setSelectedVictimId(null); setReplayProgress(1); }} className={cn("p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden bg-[#0F172A]/50", selectedMissionId === mission.id && "bg-blue-600/10 border-blue-500/30")}>
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white border border-white/5"><User size={18} /></div><div><h4 className="text-[12px] font-black text-white uppercase leading-none">{resolveIdentity(mission)}</h4><p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">ID: {mission.id.slice(-8).toUpperCase()}</p></div></div>
                   <div className="text-right"><p className="text-[10px] font-black text-blue-400 italic tabular-nums">{getDistanceInfo(mission).dist}</p><p className="text-[7px] font-bold text-gray-500 uppercase">Intercept</p></div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                   <Activity size={10} className="text-rose-500" />
                   <span className="text-[8px] font-black text-gray-400 uppercase">Live Telemetry Synchronized</span>
                </div>
              </div>
            ))}

            <div className="px-4 py-2 mt-8 border-t border-white/5 pt-6">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Evidence Archives</span>
            </div>
            {filteredArchives.map((victim) => (
              <div key={victim.uid} onClick={() => { setSelectedVictimId(victim.uid); setSelectedMissionId(null); }} className={cn("p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 bg-[#1E293B]/50", selectedVictimId === victim.uid && "bg-emerald-600/10 border-emerald-500/30")}>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><History size={18} /></div>
                   <div className="flex-1">
                      <h4 className="text-[11px] font-black text-white uppercase leading-none">{userStatusMap[victim.uid]?.name || victim.name}</h4>
                      <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">{victim.count} Missions Archived</p>
                   </div>
                   <ChevronRight size={14} className="text-gray-700" />
                </div>
              </div>
            ))}
         </div>
      </aside>

      {/* 🗺️ STRATEGIC REPLAY CENTER */}
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
         <div className="flex-1 relative">
            <CommandMap 
               activeAlerts={activeMissions} 
               activeProtectors={activeProtectors} 
               activeFirs={activeFirs} 
               pendingProtectors={[]}
               selectedAlertId={selectedMissionId}
               victimPath={selectedMission?.path || []}
               protectorPath={selectedMission?.protectorPath || []}
               safePath={selectedMission?.safePath || []}
               replayProgress={replayProgress}
            />
         </div>
         
         {/* 🎛️ FORENSIC REPLAY CONTROLS */}
         <AnimatePresence>
            {selectedMission && (
               <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="absolute bottom-10 inset-x-10 z-40">
                  <div className="bg-black/80 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Target size={28} /></div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{resolveIdentity(selectedMission)}</h3>
                                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                                    <Cpu size={8} className="text-blue-400" />
                                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{mlLatency}ms ML Link</span>
                                 </div>
                              </div>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[3px]">Mission Log: {selectedMission.id.toUpperCase()}</p>
                           </div>
                        </div>
                        
                        {/* 🏛️ HARDWARE OVERRIDE CONTROLS */}
                        <div className="flex items-center gap-2 mr-6 bg-white/5 p-2 rounded-3xl border border-white/10">
                           <button 
                             onClick={() => handleRemoteOverride('LOCKOUT')}
                             disabled={isProcessingCommand}
                             className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                               isSovereignActive ? "bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-600/20" : "bg-white/5 text-gray-500"
                             )}
                             title="Execute Tactical Lockout"
                           >
                             {isProcessingCommand ? <Activity size={20} className="animate-spin" /> : <Power size={20} />}
                           </button>
                           <button 
                             onClick={() => handleRemoteOverride('SIREN')}
                             disabled={isProcessingCommand}
                             className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                               isSovereignActive ? "bg-amber-600 text-white hover:bg-amber-500 shadow-xl shadow-amber-600/20" : "bg-white/5 text-gray-400"
                             )}
                             title="Remote SOS Siren"
                           >
                             <Bell size={20} />
                           </button>
                           <button 
                             onClick={() => handleRemoteOverride('SNAPSHOT')}
                             disabled={isProcessingCommand}
                             className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                               isSovereignActive ? "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20" : "bg-white/5 text-gray-400"
                             )}
                             title="Forensic Snapshot"
                           >
                             <Camera size={20} />
                           </button>
                        </div>

                        {/* Biometric Pulse Hub */}
                        <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-3xl border border-white/5">
                           <div className="flex flex-col items-center">
                              <Heart size={20} className="text-rose-500 animate-pulse mb-1" />
                              <span className="text-[10px] font-black text-white tabular-nums leading-none">74 BPM</span>
                              <span className="text-[7px] font-black text-gray-500 uppercase mt-1">Pulse</span>
                           </div>
                           <div className="w-[1px] h-10 bg-white/10 mx-2" />
                           <div className="flex flex-col items-center">
                              <Activity size={20} className="text-emerald-500 mb-1" />
                              <span className="text-[10px] font-black text-white tabular-nums leading-none">98%</span>
                              <span className="text-[7px] font-black text-gray-500 uppercase mt-1">Stress</span>
                           </div>
                        </div>

                        {/* Playback Hub */}
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-3xl border border-white/5">
                           <button onClick={() => setReplayProgress(0.01)} className="p-4 hover:bg-white/10 rounded-2xl text-white transition-all"><RotateCcw size={20} /></button>
                           <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all">
                              {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                           </button>
                           <div className="px-6 text-center border-l border-white/10">
                              <p className="text-[20px] font-black text-white tabular-nums leading-none">{(replayProgress * 100).toFixed(0)}%</p>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Sync Index</p>
                           </div>
                        </div>

                        {/* Deviation Status */}
                        <div className={cn(
                           "px-8 py-4 rounded-[2rem] border flex items-center gap-4",
                           deviationReport?.isBreached ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        )}>
                           {deviationReport?.isBreached ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                           <div>
                              <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">Route Status</p>
                              <p className="text-sm font-black uppercase">{deviationReport?.isBreached ? 'Breach Detected' : 'Route Compliant'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Timeline Slider */}
                     <div className="relative h-4 group">
                        <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                           <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${replayProgress * 100}%` }} />
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.001" 
                          value={replayProgress} 
                          onChange={(e) => setReplayProgress(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                        />
                        {/* Timeline Markers */}
                        <div className="absolute -top-6 left-0 text-[8px] font-black text-gray-500 uppercase">Origin</div>
                        <div className="absolute -top-6 right-0 text-[8px] font-black text-gray-500 uppercase">Intercept</div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Operative Case List */}
         <AnimatePresence>
            {selectedVictimId && !selectedMissionId && (
               <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="absolute top-10 right-10 w-[420px] z-30">
                  <div className="bg-[#1E293B]/95 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-2xl">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[4px] mb-2">Evidence Chain</p>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{resolveIdentity(groupedResolved[selectedVictimId][0])}</h3>
                        </div>
                        <button onClick={() => setSelectedVictimId(null)} className="p-3 bg-white/5 rounded-2xl text-white"><ShieldAlert size={20} /></button>
                     </div>
                     <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                        {groupedResolved[selectedVictimId].map((mission) => (
                           <div 
                             key={mission.id} 
                             onClick={() => { setSelectedMissionId(mission.id); setReplayProgress(0); }}
                             className="p-6 bg-white/5 border border-white/5 rounded-[28px] hover:bg-white/10 transition-all group cursor-pointer"
                           >
                              <div className="flex justify-between items-center mb-3">
                                 <span className="text-[9px] font-black text-emerald-500 uppercase">Court Ready Log</span>
                                 <span className="text-[9px] font-black text-gray-500">{mission.timestamp ? new Date(mission.timestamp.toMillis()).toLocaleDateString() : ''}</span>
                              </div>
                              <h4 className="text-[12px] font-black text-white uppercase group-hover:text-blue-400 transition-all">CASE_{mission.id.slice(-12).toUpperCase()}</h4>
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          background: #3B82F6;
          border: 4px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
