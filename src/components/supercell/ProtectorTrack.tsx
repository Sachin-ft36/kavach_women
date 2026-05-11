import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Navigation, CheckCircle2, Search, Crosshair, 
  Target, Maximize2, Camera, Timer, Gauge, Route, Activity,
  ShieldCheck, History, ChevronRight
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

// 🏛️ IMPORT OFFICIAL COMMAND ENGINE
import CommandMap from '../maps/CommandMap';

interface ProtectorTrackProps {
  activeMissionId?: string | null;
  onClearMission?: () => void;
}

export function ProtectorTrack({ activeMissionId, onClearMission }: ProtectorTrackProps) {
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [resolvedMissions, setResolvedMissions] = useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(activeMissionId || null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);

  useEffect(() => {
    if (activeMissionId) {
      setSelectedMissionId(activeMissionId);
      setSelectedVictimId(null);
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

  const selectedMission = (activeMissions.find(m => m.id === selectedMissionId) || resolvedMissions.find(m => m.id === selectedMissionId));

  const getDistanceInfo = (mission: any) => {
    if (!mission) return { dist: '---', eta: '---' };
    const vLat = mission.location?.latitude || mission.location?.lat;
    const vLng = mission.location?.longitude || mission.location?.lng;
    const resp = mission.activeResponders?.[0];
    if (!vLat || !vLng || !resp?.lastLocation) return { dist: '---', eta: '---' };
    
    // Neural calc (approximate for HUD)
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
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-60 italic mt-1">Pursuit Telemetry Hub</p>
               </div>
            </div>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input 
                 type="text" 
                 placeholder="SCAN GRID ID..." 
                 className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="px-4 py-2 flex items-center justify-between">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Intercept Pursuits</span>
               <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full border border-rose-500/20">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{activeMissions.length} ACTIVE</span>
               </div>
            </div>

            {activeMissions.map((mission) => {
              const { dist, eta } = getDistanceInfo(mission);
              return (
                <div key={mission.id} onClick={() => { setSelectedMissionId(mission.id); setSelectedVictimId(null); }} className={cn("p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden bg-[#0F172A]/50", selectedMissionId === mission.id && "bg-blue-600/10 border-blue-500/30")}>
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white border border-white/5"><User size={18} /></div><div><h4 className="text-[12px] font-black text-white uppercase leading-none">{mission.victimName}</h4><p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">ID: {mission.id.slice(-8).toUpperCase()}</p></div></div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-blue-400 italic tabular-nums">{dist}</p>
                        <p className="text-[7px] font-bold text-gray-500 uppercase">Distance</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] text-white"><Route size={12} /></div><span className="text-[9px] font-black text-white uppercase italic">{eta} ETA</span></div>
                     <div className="flex items-center justify-end"><span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-tighter animate-pulse">Navigating</span></div>
                  </div>
                </div>
              );
            })}

            <div className="px-4 py-2 mt-8 border-t border-white/5 pt-6">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Operational Archives</span>
            </div>
            {filteredArchives.length === 0 ? (
               <div className="py-10 text-center opacity-10">
                  <History size={30} className="mx-auto mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest">Archive Core Empty</p>
               </div>
            ) : filteredArchives.map((victim) => (
              <div 
                key={victim.uid} 
                onClick={() => { setSelectedVictimId(victim.uid); setSelectedMissionId(null); }} 
                className={cn(
                  "p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 bg-[#1E293B]/50 relative overflow-hidden group", 
                  selectedVictimId === victim.uid && "bg-emerald-600/10 border-emerald-500/30 shadow-xl"
                )}
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all relative",
                     selectedVictimId === victim.uid ? "bg-emerald-500 text-white border-white/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                   )}>
                      <CheckCircle2 size={20} />
                      <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#1E293B]">
                        {victim.count}
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[12px] font-black text-white uppercase leading-none truncate">{victim.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-[2px]">Secured Hub</span>
                        <div className="w-1 h-1 bg-emerald-500/50 rounded-full" />
                        <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                           {victim.lastTimestamp ? new Date(victim.lastTimestamp.toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '---'}
                        </span>
                      </div>
                   </div>
                   <ChevronRight size={14} className={cn("transition-all", selectedVictimId === victim.uid ? "text-emerald-500 translate-x-1" : "text-gray-700")} />
                </div>
              </div>
            ))}
         </div>
      </aside>

      {/* 🗺️ OFFICIAL STRATEGIC MAP */}
      <main className="flex-1 relative h-full overflow-hidden">
         <div className="absolute inset-0 w-full h-full">
            <CommandMap 
               activeAlerts={activeMissions} 
               activeProtectors={activeProtectors} 
               pendingProtectors={[]} 
               activeFirs={activeFirs} 
               selectedAlertId={selectedMissionId}
               onAlertClick={setSelectedMissionId}
            />
         </div>
         
         {/* 🎯 TARGET DATA OVERLAY */}
         <AnimatePresence mode="wait">
            {selectedMission && (
               <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute top-8 inset-x-8 z-30 pointer-events-none">
                  <div className="max-w-6xl mx-auto bg-black/60 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-2xl flex flex-col pointer-events-auto">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/40"><Target size={36} strokeWidth={2} /></div>
                           <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-[4px] mb-1">Target Intercept Pursuit</p><h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{selectedMission.victimName}</h2></div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="px-6 py-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                              <span className="text-[11px] font-black text-blue-500 uppercase tracking-[2px]">Neural Dashboard Sync</span>
                           </div>
                           <button onClick={() => setSelectedMissionId(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><Maximize2 size={24} /></button>
                        </div>
                     </div>

                     <div className="grid grid-cols-4 gap-8">
                        <div className="space-y-4">
                           <div className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Distance to Target</p>
                              <div className="flex items-end gap-2 text-white"><span className="text-4xl font-black italic tracking-tighter leading-none">{getDistanceInfo(selectedMission).dist}</span></div>
                           </div>
                           <div className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimated Intercept</p>
                              <div className="flex items-center gap-3 text-blue-400"><Timer size={24} /><span className="text-2xl font-black italic tracking-tighter">{getDistanceInfo(selectedMission).eta}</span></div>
                           </div>
                        </div>

                        <div className="col-span-3">
                           <div className="aspect-video bg-[#0F172A] rounded-[40px] border border-white/10 overflow-hidden relative group">
                              {selectedMission.status === 'resolved' ? (
                                 <img src={selectedMission.closurePhoto} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="absolute inset-0 bg-[#0F172A]">
                                     <CommandMap 
                                        activeAlerts={[selectedMission]} 
                                        activeProtectors={activeProtectors} 
                                        pendingProtectors={[]} 
                                        activeFirs={activeFirs} 
                                        selectedAlertId={selectedMissionId}
                                        onAlertClick={() => {}}
                                     />
                                     <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-48 h-48 border border-blue-500/30 rounded-full animate-pulse flex items-center justify-center">
                                           <div className="w-10 h-10 border-t-2 border-l-2 border-blue-500/50 absolute top-0 left-0"></div>
                                           <div className="w-10 h-10 border-t-2 border-r-2 border-blue-500/50 absolute top-0 right-0"></div>
                                           <div className="w-10 h-10 border-b-2 border-l-2 border-blue-500/50 absolute bottom-0 left-0"></div>
                                           <div className="w-10 h-10 border-b-2 border-r-2 border-blue-500/50 absolute bottom-0 right-0"></div>
                                           <div className="w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e]"></div>
                                        </div>
                                     </div>
                                  </div>
                              )}
                              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 flex items-center justify-between">
                                 <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck size={16} /></div><span className="text-[10px] font-black text-white uppercase tracking-widest">Operative: {selectedMission.activeResponders?.[0]?.name || 'Unknown'}</span></div>
                                 <div className="flex items-center gap-4"><span className="text-[10px] font-black text-white uppercase tracking-widest">Safety PIN: {selectedMission.safetyPin || '####'}</span></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}

            {selectedVictimId && !selectedMissionId && (
               <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="absolute top-8 right-8 w-[400px] z-30 pointer-events-auto">
                  <div className="bg-[#1E293B]/90 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                        <div>
                           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[4px] mb-1">Operative History</p>
                           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{groupedResolved[selectedVictimId][0].victimName}</h3>
                        </div>
                        <button onClick={() => setSelectedVictimId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                           <Crosshair size={20} />
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {groupedResolved[selectedVictimId].map((mission) => (
                           <div 
                             key={mission.id} 
                             onClick={() => setSelectedMissionId(mission.id)}
                             className="p-4 bg-white/5 border border-white/5 rounded-[24px] cursor-pointer hover:bg-white/10 transition-all group"
                           >
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Case Resolved</span>
                                 <span className="text-[8px] font-black text-gray-500 tabular-nums">{mission.timestamp ? new Date(mission.timestamp.toMillis()).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <p className="text-[10px] font-bold text-white uppercase group-hover:text-emerald-400 transition-all">#{mission.id.slice(-12).toUpperCase()}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </main>

      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .mapboxgl-canvas { height: 100% !important; width: 100% !important; min-height: 100vh !important; }
        .mapboxgl-map { height: 100% !important; min-height: 100vh !important; }
      `}</style>
    </div>
  );
}
