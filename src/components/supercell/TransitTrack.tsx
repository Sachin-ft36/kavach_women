import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Shield, MapPin, Activity, Clock, Phone, 
  ChevronRight, Users, Navigation, AlertTriangle,
  User, Mail, Fingerprint, ShieldCheck, Heart,
  Zap, Search, Globe, Info, Target, Maximize2,
  History, CheckCircle2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import CommandMap from '../maps/CommandMap';

export function TransitTrack() {
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [historicalJourneys, setHistoricalJourneys] = useState<any[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY' | 'MISSIONS'>('LIVE');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
    const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
    const [activeFirs, setActiveFirs] = useState<any[]>([]);

    // 📡 LIVE TACTICAL STREAMS
    useEffect(() => {
      // 🚗 FETCH LIVE TRANSITS
      const qJourneys = query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency']));
      const unsubJourneys = onSnapshot(qJourneys, (snap) => {
         setActiveJourneys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // 🕒 FETCH PAST TRANSITS (FORENSIC ARCHIVE)
      const qHistory = query(collection(db, 'journeys'), where('status', 'in', ['completed', 'resolved']));
      const unsubHistory = onSnapshot(qHistory, (snap) => {
         const sorted = snap.docs
           .map(d => ({ id: d.id, ...d.data() }))
           .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
         setHistoricalJourneys(sorted);
      });

      // 🚨 FETCH ONLY TRANSIT-RELATED MISSIONS
      const unsubAlerts = onSnapshot(query(collection(db, 'alerts'), where('status', 'in', ['active', 'responding']), where('isTransitSOS', '==', true)), (snap) => {
         setActiveAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubProts = onSnapshot(query(collection(db, 'users'), where('role', '==', 'protector')), (snap) => {
         setActiveProtectors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubFirs = onSnapshot(collection(db, 'firs'), (snap) => {
         setActiveFirs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubJourneys(); unsubHistory(); unsubAlerts(); unsubProts(); unsubFirs(); };
    }, []);

    // 🛡️ TACTICAL GROUPING ENGINE
    const groupedHistory = useMemo(() => {
      const groups: Record<string, any[]> = {};
      historicalJourneys.forEach(j => {
        const uid = j.userId || 'anonymous';
        if (!groups[uid]) groups[uid] = [];
        groups[uid].push(j);
      });
      return groups;
    }, [historicalJourneys]);

    const uniqueHistoricalVictims = useMemo(() => {
      return Object.keys(groupedHistory).map(uid => {
        const victimJourneys = groupedHistory[uid];
        return {
          uid,
          name: victimJourneys[0].userName,
          count: victimJourneys.length,
          lastTimestamp: victimJourneys[0].timestamp
        };
      }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
    }, [groupedHistory]);

    const selectedJourney = (sidebarTab === 'LIVE' ? activeJourneys : sidebarTab === 'HISTORY' ? historicalJourneys : activeAlerts).find(j => j.id === selectedJourneyId);

    const filteredItems = sidebarTab === 'LIVE' 
      ? activeJourneys.filter(j => j.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || j.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()))
      : sidebarTab === 'HISTORY'
      ? uniqueHistoricalVictims.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      : activeAlerts.filter(a => a.victimName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.responderName?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
        {/* 📋 LEFT COMMAND PANEL */}
        <aside className="w-[400px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl relative h-full">
           <div className="p-8 border-b border-white/5 bg-[#1E293B]">
              <div className="flex items-center gap-3 mb-6">
                 <div className={cn(
                   "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl transition-all",
                   sidebarTab === 'LIVE' ? "bg-blue-600 shadow-blue-600/20" : sidebarTab === 'HISTORY' ? "bg-emerald-600 shadow-emerald-600/20" : "bg-rose-600 shadow-rose-600/20"
                 )}>
                    {sidebarTab === 'LIVE' ? <Car size={24} strokeWidth={2.5} /> : sidebarTab === 'HISTORY' ? <History size={24} /> : <Shield size={24} />}
                 </div>
                 <div>
                    <h2 className="text-sm font-black text-white tracking-widest uppercase italic leading-none">
                       {sidebarTab === 'LIVE' ? 'TransitIntel' : sidebarTab === 'HISTORY' ? 'Transit Forensic' : 'Mission Hub'}
                    </h2>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-60 italic mt-1">National Transit Hub</p>
                 </div>
              </div>

              {/* TAB TOGGLE */}
              <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-white/5 mb-6">
                 <button 
                   onClick={() => { setSidebarTab('LIVE'); setSelectedJourneyId(null); setSelectedVictimId(null); }}
                   className={cn(
                     "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                     sidebarTab === 'LIVE' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                   )}
                 >
                    <Activity size={12} /> Live
                 </button>
                 <button 
                   onClick={() => { setSidebarTab('MISSIONS'); setSelectedJourneyId(null); setSelectedVictimId(null); }}
                   className={cn(
                     "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                     sidebarTab === 'MISSIONS' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                   )}
                 >
                    <Shield size={12} /> Missions
                 </button>
                 <button 
                   onClick={() => { setSidebarTab('HISTORY'); setSelectedJourneyId(null); setSelectedVictimId(null); }}
                   className={cn(
                     "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                     sidebarTab === 'HISTORY' ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                   )}
                 >
                    <History size={12} /> Past Log
                 </button>
              </div>

              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                 <input 
                   type="text" 
                   placeholder="SCAN VEHICLE / PASSENGER..." 
                   className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                   value={searchTerm} 
                   onChange={(e) => setSearchTerm(e.target.value)} 
                 />
              </div>
           </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0F172A]/30">
            <div className="px-4 py-2 flex items-center justify-between">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {sidebarTab === 'LIVE' ? 'Live Deployments' : 'Historical Archive'}
               </span>
               <div className={cn(
                 "flex items-center gap-1.5 px-3 py-1 rounded-full border",
                 sidebarTab === 'LIVE' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
               )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", sidebarTab === 'LIVE' ? "bg-blue-500" : "bg-emerald-500")} />
                  <span className="text-[8px] font-black uppercase tracking-widest">
                     {sidebarTab === 'LIVE' ? `${activeJourneys.length} ACTIVE` : `${historicalJourneys.length} LOGS`}
                  </span>
               </div>
            </div>

            {filteredItems.length === 0 ? (
               <div className="py-20 text-center opacity-20">
                  <Globe size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                     {sidebarTab === 'LIVE' ? 'No Active Transits' : sidebarTab === 'HISTORY' ? 'Archive Data Clear' : 'No Active Missions'}
                  </p>
               </div>
            ) : sidebarTab === 'LIVE' ? (
               (filteredItems as any[]).map((journey) => (
                  <div 
                    key={journey.id} 
                    onClick={() => setSelectedJourneyId(journey.id)} 
                    className={cn(
                      "p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden",
                      selectedJourneyId === journey.id ? "bg-blue-600/10 border-blue-500/30 shadow-xl" : "bg-[#1E293B]/50",
                      journey.status === 'emergency' && "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/5 group-hover:border-blue-500/30 transition-all">
                             <Car size={20} className={journey.status === 'emergency' ? "text-rose-500 animate-pulse" : "text-blue-400"} />
                          </div>
                          <div>
                             <h4 className="text-[12px] font-black text-white uppercase leading-none">{journey.userName || 'Passenger'}</h4>
                             <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-2">Vehicle: {journey.vehicleNo}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className={cn(
                             "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                             journey.status === 'emergency' ? "bg-rose-500 text-white" : "bg-emerald-500/10 text-emerald-500"
                          )}>
                             {journey.status === 'emergency' ? 'EMERGENCY' : 'ON-ROUTE'}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                       <div className="flex items-center gap-2">
                          <Clock size={12} className="text-gray-500" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                             {journey.timestamp ? new Date(journey.timestamp.toMillis()).toLocaleTimeString() : 'LIVE'}
                          </span>
                       </div>
                       <ChevronRight size={16} className={cn("transition-all", selectedJourneyId === journey.id ? "text-blue-500 translate-x-1" : "text-gray-700")} />
                    </div>
                  </div>
               ))
            ) : sidebarTab === 'MISSIONS' ? (
              (filteredItems as any[]).map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={() => setSelectedJourneyId(alert.id)} 
                  className={cn(
                    "p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden",
                    selectedJourneyId === alert.id ? "bg-rose-600/10 border-rose-500/30 shadow-xl" : "bg-[#1E293B]/50",
                    alert.status === 'responding' ? "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/5 group-hover:border-rose-500/30 transition-all">
                           <Shield size={20} className={alert.status === 'responding' ? "text-blue-400" : "text-rose-500 animate-pulse"} />
                        </div>
                        <div>
                           <h4 className="text-[12px] font-black text-white uppercase leading-none">{alert.victimName || 'Victim'}</h4>
                           <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                             {alert.status === 'responding' ? `Responder: ${alert.responderName}` : 'Awaiting Responder'}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className={cn(
                           "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                           alert.status === 'responding' ? "bg-blue-600 text-white" : "bg-rose-600 text-white"
                        )}>
                           {alert.status === 'responding' ? 'INTERCEPTING' : 'SOS ACTIVE'}
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-500" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                           {alert.timestamp ? new Date(alert.timestamp.toMillis()).toLocaleTimeString() : 'LIVE'}
                        </span>
                     </div>
                     <ChevronRight size={16} className={cn("transition-all", selectedJourneyId === alert.id ? "text-rose-500 translate-x-1" : "text-gray-700")} />
                  </div>
                </div>
             ))
            ) : (
               (filteredItems as any[]).map((victim) => (
                  <div 
                    key={victim.uid} 
                    onClick={() => { setSelectedVictimId(victim.uid); setSelectedJourneyId(null); }}
                    className={cn(
                      "p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden",
                      selectedVictimId === victim.uid ? "bg-emerald-600/10 border-emerald-500/30 shadow-xl" : "bg-[#1E293B]/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all relative",
                         selectedVictimId === victim.uid ? "bg-emerald-600 text-white border-white/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                       )}>
                          <User size={20} />
                          <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#1E293B]">
                            {victim.count}
                          </div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] font-black text-white uppercase leading-none truncate">{victim.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                             <CheckCircle2 size={10} className="text-emerald-500" />
                             <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                                {victim.lastTimestamp ? new Date(victim.lastTimestamp.toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '---'}
                             </span>
                          </div>
                       </div>
                       <ChevronRight size={16} className={cn("transition-all", selectedVictimId === victim.uid ? "text-emerald-500 translate-x-1" : "text-gray-700")} />
                    </div>
                  </div>
               ))
            )}
         </div>
      </aside>

      {/* 🗺️ OFFICIAL STRATEGIC MAP */}
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
         <div className="flex-1 relative">
            <CommandMap 
               activeAlerts={activeAlerts} 
               activeProtectors={activeProtectors} 
               activeJourneys={sidebarTab === 'LIVE' ? activeJourneys : []}
               activeFirs={activeFirs} 
               pendingProtectors={[]} 
               selectedAlertId={selectedJourneyId}
               onAlertClick={setSelectedJourneyId}
            />
         </div>
         
         {/* 🎯 TRANSIT HUD OVERLAY */}
         <AnimatePresence>
            {selectedJourney && (
               <motion.div 
                 initial={{ y: 50, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: 50, opacity: 0 }} 
                 className="absolute bottom-12 inset-x-12 z-30 pointer-events-none"
               >
                  <div className="max-w-4xl mx-auto bg-[#0F172A]/90 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-2xl flex flex-col pointer-events-auto">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "w-14 h-14 rounded-[24px] flex items-center justify-center text-white shadow-2xl transition-all",
                             sidebarTab === 'LIVE' ? "bg-blue-600 shadow-blue-600/40" : "bg-emerald-600 shadow-emerald-600/40"
                           )}>
                              <Target size={28} />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[4px] mb-1">
                                 {sidebarTab === 'LIVE' ? 'Grid Target Locked' : 'Forensic Journey Archive'}
                              </p>
                              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">{selectedJourney.userName}</h2>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", sidebarTab === 'LIVE' ? "bg-blue-500" : "bg-emerald-500")} />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                 {sidebarTab === 'LIVE' ? 'UHD Telemetry Active' : 'Mission Resolved'}
                              </span>
                           </div>
                           <button onClick={() => setSelectedJourneyId(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                              <Maximize2 size={20} />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white/5 p-5 rounded-[32px] border border-white/10">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Tactical Asset ID</p>
                           <p className="text-xl font-black text-white italic tracking-tighter uppercase">{selectedJourney.vehicleNo}</p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-[32px] border border-white/10">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Driver Credentials</p>
                           <p className="text-xl font-black text-white italic tracking-tighter uppercase">{selectedJourney.driverName || 'Verified Autonomous'}</p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-[32px] border border-white/10">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">GPS Node</p>
                           <div className="flex items-center gap-2 text-blue-400">
                              <MapPin size={16} />
                              <span className="text-[10px] font-black uppercase">
                                 {selectedJourney.latitude?.toFixed(4)} / {selectedJourney.longitude?.toFixed(4)}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}

            {selectedVictimId && !selectedJourneyId && (
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} className="absolute top-12 right-12 w-[350px] z-30 pointer-events-auto">
                  <div className="bg-[#1E293B]/90 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-2xl max-h-[70vh] flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                        <div>
                           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[4px] mb-1">Transit History</p>
                           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{groupedHistory[selectedVictimId][0].userName}</h3>
                        </div>
                        <button onClick={() => setSelectedVictimId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                           <History size={20} />
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {groupedHistory[selectedVictimId].map((j) => (
                           <div 
                             key={j.id} 
                             onClick={() => setSelectedJourneyId(j.id)}
                             className="p-4 bg-white/5 border border-white/5 rounded-[24px] cursor-pointer hover:bg-white/10 transition-all group"
                           >
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Journey Secured</span>
                                 <span className="text-[8px] font-black text-gray-500 tabular-nums">{j.timestamp ? new Date(j.timestamp.toMillis()).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <p className="text-[10px] font-bold text-white uppercase group-hover:text-emerald-400 transition-all">{j.vehicleNo}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </main>

      <style>{`
        .mapboxgl-canvas { height: 100% !important; width: 100% !important; }
        .mapboxgl-map { height: 100% !important; }
      `}</style>
    </div>
  );
}
