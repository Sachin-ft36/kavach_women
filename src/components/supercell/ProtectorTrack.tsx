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
  selectedState?: string;
  detectedAdminDistrict?: string | null;
}

export function ProtectorTrack({ 
  activeMissionId, 
  onClearMission, 
  isSovereignActive, 
  userStatusMap = {}, 
  selectedState = 'ALL',
  detectedAdminDistrict = null
}: ProtectorTrackProps) {
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [resolvedMissions, setResolvedMissions] = useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(activeMissionId || null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);
  const [historicalJourneys, setHistoricalJourneys] = useState<any[]>([]);
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

    const unsubFirs = onSnapshot(collection(db, 'zero_firs'), (snap) => {
       setActiveFirs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubJourneyHistory = onSnapshot(query(collection(db, 'journey_history'), orderBy('endTime', 'desc')), (snap) => {
       setHistoricalJourneys(snap.docs.map(d => ({ id: d.id, ...d.data(), isJourney: true })));
    });

    return () => { unsubActive(); unsubResolved(); unsubProts(); unsubFirs(); unsubJourneyHistory(); };
  }, []);

  // 📡 STATE SHARD FILTERING FOR PROTECTOR TRACK
  const filterByState = React.useCallback((item: any) => {
    if (!item) return false;
    if (!selectedState || selectedState === 'ALL') return true;

    const getStateVariations = (stateName: string): string[] => {
      const name = stateName.toLowerCase().trim();
      const variations = [name];
      
      if (name === 'uttar pradesh') variations.push('up', 'u.p.', 'uttarpradesh');
      else if (name === 'maharashtra') variations.push('mh', 'm.h.');
      else if (name === 'delhi') variations.push('dl', 'd.l.');
      else if (name === 'karnataka') variations.push('ka', 'k.a.');
      else if (name === 'rajasthan') variations.push('rj', 'r.j.');
      else if (name === 'west bengal') variations.push('wb', 'w.b.');
      else if (name === 'madhya pradesh') variations.push('mp', 'm.p.');
      else if (name === 'andhra pradesh') variations.push('ap', 'a.p.');
      else if (name === 'jammu and kashmir') variations.push('jk', 'j&k', 'j & k', 'jammu & kashmir');
      else if (name === 'punjab') variations.push('pb', 'p.b.');
      else if (name === 'haryana') variations.push('hr', 'h.r.');
      else if (name === 'gujarat') variations.push('gj', 'g.j.');
      else if (name === 'bihar') variations.push('br', 'b.r.');
      else if (name === 'tamil nadu') variations.push('tn', 't.n.');
      else if (name === 'telangana') variations.push('ts', 't.s.');
      
      return variations;
    };

    const matchesState = (selState: string, text: string) => {
      if (!text) return false;
      const lowerText = text.toLowerCase().trim();
      const selectedVariations = getStateVariations(selState);
      
      if (selectedVariations.includes(lowerText)) return true;
      
      return selectedVariations.some(variation => {
        if (variation.length <= 4) {
          const regex = new RegExp(`\\b${variation.replace('.', '\\.')}\\b`, 'i');
          return regex.test(lowerText);
        }
        return lowerText.includes(variation);
      });
    };

    // 1. Direct State Matches
    if (item.state && matchesState(selectedState, item.state)) return true;
    
    // 2. Substring Matches inside address/location fields
    if (item.address && matchesState(selectedState, item.address)) return true;
    if (item.locationName && matchesState(selectedState, item.locationName)) return true;
    if (item.incidentAddress && matchesState(selectedState, item.incidentAddress)) return true;
    if (item.city && matchesState(selectedState, item.city)) return true;
    if (item.fullAddress && matchesState(selectedState, item.fullAddress)) return true;
    
    // 3. Resolve user profile for alerts / journeys
    const uUid = item.victimUid || item.userId || item.uid;
    if (uUid && userStatusMap[uUid]) {
      const profile = userStatusMap[uUid];
      if (profile.state && matchesState(selectedState, profile.state)) return true;
      if (profile.address && matchesState(selectedState, profile.address)) return true;
      if (profile.city && matchesState(selectedState, profile.city)) return true;
      if (profile.fullAddress && matchesState(selectedState, profile.fullAddress)) return true;
    }

    return false;
  }, [selectedState, userStatusMap]);

  const filteredActiveMissions = useMemo(() => activeMissions.filter(filterByState), [activeMissions, filterByState]);
  const filteredResolvedMissions = useMemo(() => resolvedMissions.filter(filterByState), [resolvedMissions, filterByState]);
  const filteredActiveProtectors = useMemo(() => activeProtectors.filter(filterByState), [activeProtectors, filterByState]);
  const filteredActiveFirs = useMemo(() => activeFirs.filter(filterByState), [activeFirs, filterByState]);
  const filteredHistoricalJourneys = useMemo(() => historicalJourneys.filter(filterByState), [historicalJourneys, filterByState]);

  // 🧬 CLOUD ML MISSION ANALYSIS
  const selectedMission = (
    filteredActiveMissions.find(m => m.id === selectedMissionId) || 
    filteredResolvedMissions.find(m => m.id === selectedMissionId) ||
    filteredHistoricalJourneys.find(m => m.id === selectedMissionId)
  );

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
    const allHistorical = [
      ...filteredResolvedMissions.map(m => ({ ...m, type: 'ALERT' })),
      ...filteredHistoricalJourneys.map(j => ({ ...j, type: 'JOURNEY' }))
    ].sort((a: any, b: any) => {
      const timeA = a.timestamp?.toMillis() || a.endTime?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || b.endTime?.toMillis() || 0;
      return timeB - timeA;
    });

    allHistorical.forEach(item => {
      const uid = item.victimUid || item.userId || 'anonymous';
      if (!groups[uid]) groups[uid] = [];
      groups[uid].push(item);
    });
    return groups;
  }, [filteredResolvedMissions, filteredHistoricalJourneys]);

  const uniqueResolvedVictims = useMemo(() => {
    return Object.keys(groupedResolved).map(uid => {
      const items = groupedResolved[uid];
      return {
        uid,
        name: items[0].victimName || items[0].userName,
        count: items.length,
        lastTimestamp: items[0].timestamp || items[0].endTime
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
                  <span className="text-[8px] font-black uppercase tracking-widest">{filteredActiveMissions.length} LIVE</span>
               </div>
            </div>

            {filteredActiveMissions.map((mission) => (
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
               activeAlerts={filteredActiveMissions} 
               activeProtectors={filteredActiveProtectors} 
               activeFirs={filteredActiveFirs} 
               pendingProtectors={[]}
               selectedAlertId={selectedMissionId}
               victimPath={selectedMission?.path || []}
               protectorPath={selectedMission?.protectorPath || []}
               safePath={selectedMission?.safePath || []}
               replayProgress={replayProgress}
               selectedState={selectedState}
            />
         </div>
         
         {/* 🗺️ STRATEGIC ROUTE STATUS: RELOCATED TO TOP CORNER */}
         <AnimatePresence>
            {selectedMission && deviationReport && (
               <motion.div 
                 initial={{ x: -100, opacity: 0 }} 
                 animate={{ x: 0, opacity: 1 }} 
                 className={cn(
                    "absolute top-8 right-8 z-50 px-5 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-md",
                    deviationReport.isBreached ? "bg-rose-500/20 border-rose-500/30 text-rose-500" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
                 )}
               >
                  {deviationReport.isBreached ? <AlertTriangle size={14} className="animate-pulse" /> : <ShieldCheck size={14} />}
                  <div>
                     <p className="text-[7px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Route Integrity</p>
                     <p className="text-[9px] font-black uppercase tracking-wider">{deviationReport.isBreached ? 'Breach Detected' : 'Route Normal'}</p>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 🎛️ FORENSIC REPLAY CONTROLS */}
         <AnimatePresence>
            {selectedMission && (
               <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="absolute bottom-10 inset-x-10 z-40">
                  <div className="bg-black/90 backdrop-blur-3xl rounded-[32px] p-5 border border-white/10 shadow-2xl">
                     <div className="grid grid-cols-3 items-center mb-6">
                        {/* LEFT: IDENTITY */}
                        <div className="flex items-center gap-3">
                           <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                 <h3 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none truncate max-w-[150px]">{resolveIdentity(selectedMission)}</h3>
                                 <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/10 shrink-0">
                                    <Cpu size={8} className="text-blue-400" />
                                    <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">OMS ML LINK</span>
                                 </div>
                              </div>
                              <p className="text-[7px] font-black text-blue-400 uppercase tracking-[2px] truncate max-w-[200px]">Mission Log: <span className="opacity-60">{selectedMission.id}</span></p>
                           </div>
                        </div>

                        {/* CENTER: REPLAY CONTROLS */}
                        <div className="flex items-center justify-center gap-3">
                           <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                              <button onClick={() => setReplayProgress(0.01)} className="w-10 h-10 hover:bg-white/10 rounded-xl text-white transition-all flex items-center justify-center"><RotateCcw size={16} /></button>
                              <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
                                 {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                              </button>
                           </div>
                        </div>
                        
                        {/* RIGHT: OVERRIDES & BIOMETRICS */}
                        <div className="flex items-center justify-end gap-3">
                           <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                              <button onClick={() => handleRemoteOverride('LOCKOUT')} disabled={isProcessingCommand} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isSovereignActive ? "bg-rose-600 text-white shadow-lg" : "bg-white/5 text-gray-600")}>
                                 {isProcessingCommand ? <Activity size={16} className="animate-spin" /> : <Power size={16} />}
                              </button>
                              <button onClick={() => handleRemoteOverride('SIREN')} disabled={isProcessingCommand} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isSovereignActive ? "bg-amber-600 text-white shadow-lg" : "bg-white/5 text-gray-500")}>
                                 <Bell size={16} />
                              </button>
                              <button onClick={() => handleRemoteOverride('SNAPSHOT')} disabled={isProcessingCommand} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isSovereignActive ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-gray-500")}>
                                 <Camera size={16} />
                              </button>
                           </div>

                           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 shrink-0">
                              <div className="flex flex-col items-center">
                                 <Heart size={14} className="text-rose-500 animate-pulse mb-1" />
                                 <span className="text-[9px] font-black text-white tabular-nums leading-none">74 BPM</span>
                                 <span className="text-[6px] font-black text-gray-500 uppercase mt-0.5">Pulse</span>
                              </div>
                              <div className="w-[1px] h-6 bg-white/10" />
                              <div className="flex flex-col items-center">
                                 <Activity size={14} className="text-emerald-500 mb-1" />
                                 <span className="text-[9px] font-black text-white tabular-nums leading-none">98%</span>
                                 <span className="text-[6px] font-black text-gray-500 uppercase mt-0.5">Stress</span>
                              </div>
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
                        <div className="absolute -top-6 left-0 text-[8px] font-black text-gray-500 uppercase">Origin</div>
                        <div className="absolute -top-6 right-0 text-[8px] font-black text-gray-500 uppercase">Intercept</div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Operative Case List */}
         <AnimatePresence>
            {selectedVictimId && groupedResolved[selectedVictimId] && groupedResolved[selectedVictimId].length > 0 && !selectedMissionId && (
               <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="absolute top-10 right-10 w-[420px] z-30">
                  <div className="bg-[#1E293B]/95 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-2xl">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[4px] mb-2">Evidence Chain</p>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{resolveIdentity(groupedResolved[selectedVictimId]?.[0] || {})}</h3>
                        </div>
                        <button onClick={() => setSelectedVictimId(null)} className="p-3 bg-white/5 rounded-2xl text-white"><ShieldAlert size={20} /></button>
                     </div>
                     <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                        {(groupedResolved[selectedVictimId] || []).map((mission) => (
                           <div 
                             key={mission.id} 
                             onClick={() => { setSelectedMissionId(mission.id); setReplayProgress(0); }}
                             className="p-6 bg-white/5 border border-white/5 rounded-[28px] hover:bg-white/10 transition-all group cursor-pointer"
                           >
                               <div className="flex justify-between items-center mb-3">
                                 <span className={cn(
                                   "text-[9px] font-black uppercase",
                                   mission.type === 'JOURNEY' ? "text-blue-500" : "text-emerald-500"
                                 )}>
                                   {mission.type === 'JOURNEY' ? 'Safe Journey Data' : 'Court Ready Log'}
                                 </span>
                                 <span className="text-[9px] font-black text-gray-500">
                                   {mission.timestamp ? new Date(mission.timestamp.toMillis()).toLocaleDateString() : (mission.endTime ? new Date(mission.endTime.toMillis()).toLocaleDateString() : '')}
                                 </span>
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
