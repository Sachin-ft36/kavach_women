import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Shield, MapPin, Activity, Clock, Phone, 
  ChevronRight, Users, Navigation, AlertTriangle,
  User, Mail, Fingerprint, ShieldCheck, Heart,
  Zap, Search, Globe, Info, Target, Maximize2,
  History, CheckCircle2, Radar, Gauge, TrendingUp,
  ShieldAlert, Lock, Power, Bell, Cpu
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useCloudML } from '../../hooks/useCloudML';
import { PredictiveIntelResult } from '../../lib/predictiveIntel';
import CommandMap from '../maps/CommandMap';
import { useCall } from '../../contexts/CallContext';

interface TransitTrackProps {
  isSovereignActive?: boolean;
  userStatusMap?: Record<string, any>;
  externalSelectedId?: string | null;
}

export function TransitTrack({ isSovereignActive, userStatusMap = {}, externalSelectedId }: TransitTrackProps) {
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [historicalJourneys, setHistoricalJourneys] = useState<any[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY' | 'MISSIONS'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [predictiveResults, setPredictiveResults] = useState<PredictiveIntelResult | null>(null);

  const { analyzeMissionVector, isAnalyzing, mlLatency } = useCloudML();
  const { initiateCall } = useCall();

  // 📡 EXTERNAL SELECTION SYNC
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedJourneyId(externalSelectedId);
      const isHistorical = historicalJourneys.some(hj => hj.id === externalSelectedId);
      const isAlert = activeAlerts.some(a => a.id === externalSelectedId);
      if (isHistorical) {
        setSidebarTab('HISTORY');
      } else if (isAlert) {
        setSidebarTab('MISSIONS');
      } else {
        setSidebarTab('LIVE');
      }
    }
  }, [externalSelectedId, historicalJourneys, activeAlerts]);

  // 📡 LIVE TACTICAL STREAMS
  useEffect(() => {
    const qJourneys = query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency']));
    const unsubJourneys = onSnapshot(qJourneys, (snap) => setActiveJourneys(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qHistory = query(collection(db, 'journeys'), where('status', 'in', ['completed', 'resolved']));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
       const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
       setHistoricalJourneys(sorted);
    });

    const unsubAlerts = onSnapshot(query(collection(db, 'alerts'), where('status', 'in', ['active', 'responding']), where('isTransitSOS', '==', true)), (snap) => {
       setActiveAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProts = onSnapshot(query(collection(db, 'users'), where('role', '==', 'protector')), (snap) => {
       setActiveProtectors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFirs = onSnapshot(collection(db, 'zero_firs'), (snap) => {
       setActiveFirs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubJourneys(); unsubHistory(); unsubAlerts(); unsubProts(); unsubFirs(); };
  }, []);

  const selectedJourney = (sidebarTab === 'LIVE' ? activeJourneys : sidebarTab === 'HISTORY' ? historicalJourneys : activeAlerts).find(j => j.id === selectedJourneyId);

  // 🧬 CLOUD ML PIPELINE HANDSHAKE
  useEffect(() => {
    if (!selectedJourney || !selectedJourney.path || sidebarTab !== 'LIVE') {
       setPredictiveResults(null);
       return;
    }
    
    const analyze = async () => {
       const results = await analyzeMissionVector(selectedJourney.path, selectedJourney.safePath || []);
       setPredictiveResults(results);
    };
    analyze();
  }, [selectedJourney, sidebarTab, analyzeMissionVector]);

  // 🏛️ SOVEREIGN HARDWARE HANDSHAKE
  const handleRemoteOverride = async (type: 'LOCKOUT' | 'SIREN' | 'SNAPSHOT') => {
    if (!selectedJourneyId) return;
    
    if (!isSovereignActive) {
      toast.error("AUTHORIZATION DENIED", {
        description: "Activate Sovereign Override for hardware intervention."
      });
      return;
    }

    setIsProcessingCommand(true);
    try {
      await updateDoc(doc(db, 'journeys', selectedJourneyId), {
        remoteCommand: type,
        commandTimestamp: new Date(),
        commandStatus: 'pending',
        commandOrigin: 'SUPERCELL_TRANSIT_HUD'
      });
      
      toast.success(`${type} INITIATED`, {
        description: `Command broadcasted to device firmware: ${selectedJourneyId.slice(0, 8)}`,
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

  const resolveIdentity = (item: any) => {
    const uid = item.victimUid || item.userId || item.uid;
    return userStatusMap[uid]?.name || item.userName || item.name || item.victimName || 'Citizen Profile';
  };

  const filteredItems = sidebarTab === 'LIVE' 
    ? activeJourneys.filter(j => j.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || j.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()))
    : sidebarTab === 'HISTORY' ? historicalJourneys.filter(v => v.userName?.toLowerCase().includes(searchTerm.toLowerCase()))
    : activeAlerts.filter(a => a.victimName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      {/* 📋 LEFT COMMAND PANEL */}
      <aside className="w-[400px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl relative h-full">
         <div className="p-8 border-b border-white/5 bg-[#1E293B]">
            <div className="flex items-center gap-3 mb-6">
               <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl transition-all", sidebarTab === 'LIVE' ? "bg-blue-600 shadow-blue-600/20" : sidebarTab === 'HISTORY' ? "bg-emerald-600 shadow-emerald-600/20" : "bg-rose-600 shadow-rose-600/20")}>
                  {sidebarTab === 'LIVE' ? <Radar size={24} strokeWidth={2.5} /> : sidebarTab === 'HISTORY' ? <History size={24} /> : <Shield size={24} />}
               </div>
               <div>
                  <h2 className="text-sm font-black text-white tracking-widest uppercase italic leading-none">{sidebarTab === 'LIVE' ? 'TransitIntel' : sidebarTab === 'HISTORY' ? 'Forensic Hub' : 'Mission Grid'}</h2>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-60 italic mt-1">Predictive SafePass Hub</p>
               </div>
            </div>

            <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-white/5 mb-6">
               <button onClick={() => { setSidebarTab('LIVE'); setSelectedJourneyId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'LIVE' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}>LIVE</button>
               <button onClick={() => { setSidebarTab('MISSIONS'); setSelectedJourneyId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'MISSIONS' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}>MISSIONS</button>
               <button onClick={() => { setSidebarTab('HISTORY'); setSelectedJourneyId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'HISTORY' ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}>HISTORY</button>
            </div>

            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input type="text" placeholder="SCAN GRID ID..." className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0F172A]/30">
            {filteredItems.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => { setSelectedJourneyId(item.id); setSelectedVictimId(null); }} 
                className={cn(
                  "p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group bg-[#1E293B]/50 relative overflow-hidden",
                  (selectedJourneyId === item.id) && "bg-blue-600/10 border-blue-500/30",
                  item.status === 'emergency' && "border-rose-500/50 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                )}
              >
                {item.status === 'emergency' && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10">
                    EMERGENCY
                  </div>
                )}
                {!isSovereignActive && item.status !== 'emergency' && <div className="absolute top-0 right-0 p-2 opacity-20"><Lock size={10} className="text-white" /></div>}
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white border border-white/5 transition-all",
                        item.status === 'emergency' ? "bg-rose-600 shadow-lg shadow-rose-600/20" : "bg-white/5"
                      )}>
                        {item.status === 'emergency' ? <ShieldAlert size={18} /> : <Car size={18} />}
                      </div>
                      <div>
                         <h4 className="text-[11px] font-black text-white uppercase leading-none">{resolveIdentity(item)}</h4>
                         <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">{item.vehicleNo || 'Archive User'}</p>
                      </div>
                   </div>
                   <ChevronRight size={14} className={cn("transition-all", item.status === 'emergency' ? "text-rose-500" : "text-gray-700")} />
                </div>
              </div>
            ))}
         </div>
      </aside>

      {/* 🗺️ PREDICTIVE HUD CENTER */}
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
               projectedPath={predictiveResults?.projection}
               safePath={selectedJourney?.safePath}
               isSovereignActive={isSovereignActive}
            />
         </div>

         {/* 🎯 PREDICTIVE INTELLIGENCE HUD */}
         <AnimatePresence>
            {selectedJourney && (
               <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-10 inset-x-10 z-40 pointer-events-none">
                  <div className="max-w-[95%] w-full mx-auto bg-black/85 backdrop-blur-3xl rounded-[30px] py-4 px-6 border border-white/10 shadow-2xl flex flex-col pointer-events-auto transition-all">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all", predictiveResults?.isBreached ? "bg-rose-600 shadow-rose-600/40" : "bg-cyan-600 shadow-cyan-600/40")}>
                              {predictiveResults?.isBreached ? <ShieldAlert size={24} /> : isAnalyzing ? <Activity size={24} className="animate-spin" /> : <Radar size={24} />}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <p className="text-[8px] font-black text-cyan-400 uppercase tracking-[3px]">Predictive Transit HUD</p>
                                 <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/10">
                                    <Cpu size={7} className="text-cyan-400" />
                                    <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">{mlLatency}ms Pipeline</span>
                                 </div>
                                 {predictiveResults?.isBreached && (
                                    <div className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">500m Breach Lockout</div>
                                 )}
                              </div>
                              <h2 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">{resolveIdentity(selectedJourney)}</h2>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           {/* 🏛️ HARDWARE OVERRIDE CONTROLS */}
                           <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                              <button 
                                onClick={() => handleRemoteOverride('LOCKOUT')}
                                disabled={isProcessingCommand}
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                  isSovereignActive ? "bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-600/20" : "bg-white/5 text-gray-500"
                                )}
                                title="Execute Tactical Lockout"
                              >
                                {isProcessingCommand ? <Activity size={16} className="animate-spin" /> : <Power size={16} />}
                              </button>
                              <button 
                                onClick={() => handleRemoteOverride('SIREN')}
                                disabled={isProcessingCommand}
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                  isSovereignActive ? "bg-amber-600 text-white hover:bg-amber-500 shadow-xl shadow-amber-600/20" : "bg-white/5 text-gray-400"
                                )}
                                title="Remote SOS Siren"
                              >
                                <Bell size={16} />
                              </button>
                              <button 
                                onClick={() => handleRemoteOverride('SNAPSHOT')}
                                disabled={isProcessingCommand}
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                  isSovereignActive ? "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20" : "bg-white/5 text-gray-400"
                                )}
                                title="Forensic Snapshot"
                              >
                                <Maximize2 size={16} />
                              </button>
                           </div>

                           <div className="px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Vector Velocity</span>
                              <div className="flex items-center gap-1.5 text-white">
                                 <TrendingUp size={12} className="text-cyan-400" />
                                 <span className="text-sm font-black italic tabular-nums leading-none">{predictiveResults?.speed || '--'} KM/H</span>
                              </div>
                           </div>

                           {/* 🤝 TACTICAL HANDSHAKE HUB */}
                           <div className="px-4 py-1.5 bg-blue-600/10 rounded-xl border border-blue-500/30 flex flex-col items-center">
                              <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Verification Code</span>
                              <div className="flex items-center gap-1.5 text-white">
                                 <Fingerprint size={12} className="text-blue-400" />
                                 <span className="text-sm font-black italic tracking-[0.15em] leading-none">{selectedJourney?.handshakeCode || '----'}</span>
                              </div>
                           </div>

                           <div className="px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Node Power</span>
                              <div className="flex items-center gap-1.5 text-white">
                                 <Zap size={12} className={cn((selectedJourney?.batteryLevel || 100) < 20 ? "text-rose-500" : "text-emerald-400")} />
                                 <span className="text-sm font-black italic tabular-nums leading-none">{selectedJourney?.batteryLevel || '--'}%</span>
                              </div>
                           </div>
                           <button onClick={() => setSelectedJourneyId(null)} className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors"><Maximize2 size={16} /></button>
                        </div>
                     </div>

                     <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white/5 py-2.5 px-4 rounded-2xl border border-white/10">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Heading Angle</p>
                           <div className="flex items-center gap-2 text-cyan-400">
                              <Navigation size={16} style={{ transform: `rotate(${predictiveResults?.bearing || 0}deg)` }} />
                              <span className="text-lg font-black italic tracking-tighter leading-none">{predictiveResults?.bearing || '--'}°</span>
                           </div>
                        </div>
                        <div className="bg-white/5 py-2.5 px-4 rounded-2xl border border-white/10">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Safe Route Deviation</p>
                           <div className={cn("text-lg font-black italic tracking-tighter leading-none", predictiveResults?.isBreached ? "text-rose-500" : predictiveResults?.isWarning ? "text-amber-500" : "text-emerald-500")}>
                              {predictiveResults?.deviationDist || '0.00'} KM
                           </div>
                        </div>
                        <div className="col-span-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 py-2.5 px-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
                           <div>
                              <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Active Countermeasure</p>
                              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">
                                 {predictiveResults?.isBreached ? 'SuperCell Lockout Initiated' : 'Proactive Path Clear'}
                              </h4>
                           </div>
                           <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", predictiveResults?.isBreached ? "bg-rose-500/20 border-rose-500/40 text-rose-500" : "bg-cyan-500/20 border-cyan-500/40 text-cyan-500")}>
                              {predictiveResults?.isBreached ? <Lock size={16} /> : <ShieldCheck size={16} />}
                           </div>
                        </div>
                     </div>
                     
                     {/* 🛡️ TACTICAL RESPONDER HUD (3D TRACK SYNC) */}
                     <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none">
                           <Shield size={10} className="text-blue-500" /> Active Tactical Responders (Interceptors)
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                           {selectedJourney?.activeResponders?.map((responder: any) => (
                              <div key={responder.uid} className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-3.5 py-1.5 rounded-xl shadow-xl">
                                 <div className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center overflow-hidden">
                                    {responder.photo ? (
                                       <img src={responder.photo} className="w-full h-full object-cover" />
                                    ) : (
                                       <User size={10} className="text-blue-400" />
                                    )}
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black text-white uppercase italic leading-none">{responder.name}</p>
                                    <p className="text-[6.5px] font-black text-blue-400 uppercase tracking-widest mt-1 leading-none">{responder.phone}</p>
                                 </div>
                                 <button 
                                    onClick={() => initiateCall(responder.uid, responder.name, selectedJourneyId || undefined)}
                                    className="ml-3 w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                                 >
                                    <Phone size={10} />
                                 </button>
                              </div>
                           ))}
                           {(!selectedJourney?.activeResponders || selectedJourney.activeResponders.length === 0) && (
                              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3.5 py-1.5 rounded-xl opacity-40">
                                 <Shield size={10} className="text-gray-500" />
                                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic leading-none">Awaiting Sector Reinforcement...</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; border-color: rgba(244, 63, 94, 0.5); }
          50% { opacity: 0.8; border-color: rgba(244, 63, 94, 0.2); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
