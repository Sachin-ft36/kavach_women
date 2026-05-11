import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, MapPin, Phone, 
  AlertTriangle, History, MessageSquare,
  Activity, Zap, ShieldAlert, Ban, 
  CheckCircle2, Users, Search, Target, Clock,
  ChevronRight, Filter, Fingerprint, Car, X,
  ChevronDown
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// 🏛️ UHD Strategic Map
import CommandMap from '../maps/CommandMap';

const WARNING_REASONS = [
  "Accidental SOS trigger without emergency.",
  "Testing the SOS system without authorization.",
  "Intentional false alarm reporting.",
  "Misuse of the grid for non-emergency communication.",
  "Inappropriate or prank SOS activation.",
  "Other (Type custom message below)"
];

export function SOSManagement() {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [historicalAlerts, setHistoricalAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [userStatusMap, setUserStatusMap] = useState<Record<string, any>>({});

  // 🛡️ Warning Modal State
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(WARNING_REASONS[0]);
  const [customMsg, setCustomMsg] = useState("");
  const [isSubmittingWarn, setIsSubmittingWarn] = useState(false);

  useEffect(() => {
    // 🔴 LIVE SOS STREAM
    const qLive = query(collection(db, 'alerts'), where('status', 'in', ['active', 'Active', 'responding', 'Responding']));
    const unsubLive = onSnapshot(qLive, (snap) => {
      setActiveAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 🕒 HISTORICAL FORENSICS STREAM
    const qHistory = query(collection(db, 'alerts'), where('status', '==', 'resolved'));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
       const sorted = snap.docs
         .map(d => ({ id: d.id, ...d.data() }))
         .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
       setHistoricalAlerts(sorted);
    });

    // 📡 MASTER USER REGISTRY (FOR KUNDALI DATA)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
       const uMap: Record<string, any> = {};
       snap.docs.forEach(doc => { uMap[doc.id] = { id: doc.id, ...doc.data() }; });
       setUserStatusMap(uMap);
    });

    return () => { unsubLive(); unsubHistory(); unsubUsers(); };
  }, []);

  // 🛡️ TACTICAL GROUPING ENGINE
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    historicalAlerts.forEach(alert => {
      if (!groups[alert.victimUid]) groups[alert.victimUid] = [];
      groups[alert.victimUid].push(alert);
    });
    return groups;
  }, [historicalAlerts]);

  const uniqueHistoricalVictims = React.useMemo(() => {
    return Object.keys(groupedHistory).map(uid => {
      const victimAlerts = groupedHistory[uid];
      return {
        uid,
        name: victimAlerts[0].victimName,
        count: victimAlerts.length,
        lastTimestamp: victimAlerts[0].timestamp,
        isTransitSOS: victimAlerts.some(a => a.isTransitSOS)
      };
    }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
  }, [groupedHistory]);

  const filteredAlerts = sidebarTab === 'LIVE' 
    ? activeAlerts.filter(a => a.victimName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.toLowerCase().includes(searchTerm.toLowerCase()))
    : uniqueHistoricalVictims.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => a.id === selectedAlertId);
  const victimId = sidebarTab === 'LIVE' ? selectedAlert?.victimUid : selectedVictimId;
  const victimData = victimId ? userStatusMap[victimId] : null;
  const victimTimeline = sidebarTab === 'HISTORY' && selectedVictimId ? groupedHistory[selectedVictimId] : [];

  const handleAction = async (type: 'warn' | 'ban' | 'restore') => {
    if (!victimData) return;
    const userRef = doc(db, 'users', victimData.id);
    
    try {
      if (type === 'warn') {
        setIsWarnModalOpen(true);
      } else if (type === 'ban') {
        if (!window.confirm("CRITICAL: Block SOS access for this citizen?")) return;
        await updateDoc(userRef, {
           isSOSBlocked: true,
           sosBlockedReason: "Repeated Grid Misuse"
        });
        toast.error("SOS Access Revoked");
      } else if (type === 'restore') {
        await updateDoc(userRef, {
           isSOSBlocked: false,
           sosStrikeCount: 0
        });
        toast.success("SOS Access Restored");
      }
    } catch (e) {
      toast.error("Sync Error");
    }
  };

  const submitWarning = async () => {
    if (!victimData) return;
    setIsSubmittingWarn(true);
    const finalMsg = selectedReason.includes("Other") ? customMsg : selectedReason;
    
    if (!finalMsg) {
      toast.error("Please provide a reason.");
      setIsSubmittingWarn(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', victimData.id);
      await updateDoc(userRef, {
        hasPendingWarning: true,
        warningMessage: finalMsg,
        sosStrikeCount: (victimData.sosStrikeCount || 0) + 1
      });
      toast.warning("Warning Citation Issued");
      setIsWarnModalOpen(false);
      setCustomMsg("");
    } catch (e) {
      toast.error("Citation Failed");
    } finally {
      setIsSubmittingWarn(false);
    }
  };

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      {/* 📟 DUAL-STREAM QUEUE (LEFT) */}
      <aside className="w-[380px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl">
         <div className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-6">
               <div className={cn(
                 "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl transition-all",
                 sidebarTab === 'LIVE' ? "bg-rose-600 shadow-rose-600/20" : "bg-blue-600 shadow-blue-600/20"
               )}>
                  {sidebarTab === 'LIVE' ? <Bell size={22} className="animate-pulse" /> : <History size={22} />}
               </div>
               <div>
                  <h2 className="text-sm font-black text-white tracking-widest uppercase italic leading-none">
                     {sidebarTab === 'LIVE' ? 'Emergency Grid' : 'Forensic Ledger'}
                  </h2>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Unified SOS Command</p>
               </div>
            </div>

            {/* TAB TOGGLE */}
            <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-white/5 mb-6">
               <button 
                 onClick={() => { setSidebarTab('LIVE'); setSelectedAlertId(null); setSelectedVictimId(null); }}
                 className={cn(
                   "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                   sidebarTab === 'LIVE' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                 )}
               >
                  <Activity size={12} /> Live SOS
               </button>
               <button 
                 onClick={() => { setSidebarTab('HISTORY'); setSelectedAlertId(null); setSelectedVictimId(null); }}
                 className={cn(
                   "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                   sidebarTab === 'HISTORY' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                 )}
               >
                  <Clock size={12} /> Past Logs
               </button>
            </div>

            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input 
                 type="text" 
                 placeholder="SEARCH VICTIM/ID..." 
                 className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0F172A]/30">
            {filteredAlerts.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 text-center">
                  <Shield size={60} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                     {sidebarTab === 'LIVE' ? 'No Active Signals' : 'Forensic Archives Clear'}
                  </p>
               </div>
            ) : sidebarTab === 'LIVE' ? (
               (filteredAlerts as any[]).map((alert) => (
                 <div 
                   key={alert.id} 
                   onClick={() => setSelectedAlertId(alert.id)}
                   className={cn(
                     "p-5 rounded-[2.5rem] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden",
                     selectedAlertId === alert.id ? "bg-rose-600/10 border-rose-500/30" : "bg-[#1E293B]/50"
                   )}
                 >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all relative bg-rose-500/10 text-rose-500 border-rose-500/20">
                         <Activity size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[11px] font-black text-white uppercase leading-none truncate">{alert.victimName}</h4>
                         <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1.5 text-rose-500">
                               <Zap size={8} /> SOS ACTIVE
                            </p>
                            {alert.isTransitSOS && (
                               <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[6px] font-black rounded-sm uppercase flex items-center gap-1 animate-pulse">
                                  <Car size={6} /> Intercept
                               </span>
                            )}
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-white italic tabular-nums leading-none">
                            {alert.timestamp ? new Date(alert.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'LIVE'}
                         </p>
                      </div>
                   </div>
                 </div>
               ))
            ) : (
               (filteredAlerts as any[]).map((victim: any) => (
                 <div 
                   key={victim.uid} 
                   onClick={() => { setSelectedVictimId(victim.uid); setSelectedAlertId(null); }}
                   className={cn(
                     "p-5 rounded-[2.5rem] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative overflow-hidden",
                     selectedVictimId === victim.uid ? "bg-blue-600/10 border-blue-500/30" : "bg-[#1E293B]/50"
                   )}
                 >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all relative bg-blue-500/10 text-blue-500 border-blue-500/20">
                         <User size={20} />
                         <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white/10 shadow-lg">
                           {victim.count}
                         </div>
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[11px] font-black text-white uppercase leading-none truncate">{victim.name}</h4>
                         <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1.5 text-emerald-500">
                               <CheckCircle2 size={8} /> RESOLVED
                            </p>
                            {victim.isTransitSOS && <Car size={8} className="text-blue-400 opacity-50" />}
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-500 italic leading-none">
                            {victim.lastTimestamp ? new Date(victim.lastTimestamp.toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '---'}
                         </p>
                      </div>
                   </div>
                 </div>
               ))
            )}
         </div>
      </aside>

      {/* 🔍 VICTIM KUNDALI + MAP (MAIN) */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
         {(selectedAlert || (sidebarTab === 'HISTORY' && selectedVictimId)) ? (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
               {/* 🗺️ UHD TACTICAL MAP PANEL (ONLY FOR LIVE) */}
               {sidebarTab === 'LIVE' && selectedAlert && (
                  <div className="h-[45%] w-full relative shrink-0 border-b border-white/5">
                     <CommandMap activeAlerts={[selectedAlert]} activeProtectors={[]} activeJourneys={[]} activeFirs={[]} pendingProtectors={[]} selectedAlertId={selectedAlert.id} />
                     <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 pointer-events-auto">
                           <div className="w-3 h-3 bg-rose-500 rounded-full" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Target Surveillance Locked</span>
                        </div>
                     </div>
                  </div>
               )}

               {/* 👤 VICTIM KUNDALI DATA */}
               <div className={cn("flex-1 p-10 bg-[#0F172A]", sidebarTab === 'HISTORY' && "pt-16")}>
                  <div className="max-w-5xl mx-auto">
                     {/* BREADCRUMB FOR HISTORY */}
                     {sidebarTab === 'HISTORY' && (
                        <div className="flex items-center gap-3 mb-8 text-blue-500">
                           <History size={16} />
                           <span className="text-[10px] font-black uppercase tracking-[3px]">Historical Mission Archive</span>
                           {selectedAlert && (
                             <>
                               <ChevronRight size={14} className="opacity-40" />
                               <span className="text-[10px] font-black text-white uppercase tracking-[3px]">Case #{selectedAlert.id.slice(-6).toUpperCase()}</span>
                             </>
                           )}
                        </div>
                     )}

                     <div className="flex items-start justify-between mb-10">
                        <div className="flex items-center gap-8">
                           <div className={cn(
                             "w-24 h-24 border-2 rounded-[32px] flex items-center justify-center shadow-2xl relative",
                             sidebarTab === 'LIVE' ? "bg-rose-600/10 border-rose-500/30 text-rose-500 shadow-rose-600/20" : "bg-blue-600/10 border-blue-500/30 text-blue-500 shadow-blue-600/20"
                           )}>
                              <User size={48} strokeWidth={1.5} />
                              {victimData?.isSOSBlocked && <div className="absolute -bottom-1 -right-1 bg-rose-600 p-2 rounded-xl text-white shadow-xl"><Ban size={16} /></div>}
                           </div>
                           <div className="flex-1">
                              <p className={cn("text-[10px] font-black uppercase tracking-[4px] mb-2", sidebarTab === 'LIVE' ? "text-rose-400" : "text-blue-400")}>
                                 {sidebarTab === 'LIVE' ? 'Live Citizen Forensic Packet' : 'Archived Citizen Intel'}
                              </p>
                              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{victimData?.name || 'Loading Profile...'}</h1>
                              <div className="flex items-center gap-4 mt-4">
                                 <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Phone size={14} className="text-gray-400" /><span className="text-xs font-bold text-white tabular-nums">{victimData?.phoneNumber || 'XXXXXXXXXX'}</span></div>
                                 <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Fingerprint size={14} className="text-gray-400" /><span className="text-xs font-bold text-white uppercase tracking-widest">{victimData?.aadhar || 'NOT LINKED'}</span></div>
                                 <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gender</span>
                                    <span className="text-xs font-bold text-white uppercase">{victimData?.gender || 'N/A'}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => handleAction('warn')} className="flex items-center justify-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all"><AlertTriangle size={14} /> Warn Misuse</button>
                           {victimData?.isSOSBlocked ? (
                              <button onClick={() => handleAction('restore')} className="flex items-center justify-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"><Shield size={14} /> Restore SOS</button>
                           ) : (
                              <button onClick={() => handleAction('ban')} className="flex items-center justify-center gap-3 px-6 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"><Ban size={14} /> Ban Access</button>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-4 gap-6 mb-10">
                        <div className="bg-[#1E293B] p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Historical Alerts</p>
                           <h3 className="text-3xl font-black text-white italic tabular-nums leading-none mb-1">{historicalAlerts.filter(a => a.victimUid === victimId).length}</h3>
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Grid Memory</p>
                        </div>
                        <div className="bg-[#1E293B] p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Protocol Strikes</p>
                           <h3 className="text-3xl font-black text-rose-500 italic tabular-nums leading-none mb-1">{victimData?.sosStrikeCount || 0}</h3>
                           <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Behavioral Score</p>
                        </div>
                        {selectedAlert?.isTransitSOS && (
                           <div className="col-span-2 bg-blue-600/10 p-6 rounded-[32px] border border-blue-500/30 flex items-center gap-6 relative overflow-hidden group animate-pulse">
                              <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20"><Car size={28} /></div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Transit Interception Active</p>
                                 <div className="flex items-center justify-between">
                                    <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedAlert.vehicleNo}</p>
                                    <span className="text-[8px] font-black bg-blue-500 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Target Node Moving</span>
                                 </div>
                              </div>
                           </div>
                        )}
                        <div className={cn("bg-[#1E293B] p-6 rounded-[32px] border border-white/5 flex items-center gap-6 relative overflow-hidden group", (selectedAlert?.isTransitSOS) ? "col-span-4" : "col-span-2")}>
                           <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0"><Users size={24} /></div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Emergency Infrastructure</p>
                              <div className="flex items-center justify-between">
                                 <p className="text-xs font-black text-white uppercase truncate">{victimData?.primaryGuardian?.name || 'NOT LINKED'}</p>
                                 <p className="text-[9px] font-bold text-emerald-400 tabular-nums ml-4">{victimData?.primaryGuardian?.phone || 'XXXXXXXXXX'}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* 🕒 MISSION TIMELINE (ONLY FOR HISTORY) */}
                     {sidebarTab === 'HISTORY' && (
                        <div className="mb-12">
                           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[4px] mb-6">Mission Timeline</h3>
                           <div className="grid grid-cols-2 gap-4">
                              {victimTimeline.map((alert) => (
                                 <div 
                                   key={alert.id}
                                   onClick={() => setSelectedAlertId(alert.id)}
                                   className={cn(
                                     "p-6 rounded-[32px] border transition-all cursor-pointer group relative overflow-hidden",
                                     selectedAlertId === alert.id ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/20" : "bg-[#1E293B] border-white/5 hover:border-blue-500/30"
                                   )}
                                 >
                                    <div className="flex items-center justify-between mb-4">
                                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", selectedAlertId === alert.id ? "bg-white/10 border-white/20 text-white" : "bg-blue-500/10 border-blue-500/20 text-blue-500")}>
                                          <History size={20} />
                                       </div>
                                       <p className={cn("text-[9px] font-black uppercase tracking-widest", selectedAlertId === alert.id ? "text-white/60" : "text-gray-500")}>
                                          {alert.timestamp ? new Date(alert.timestamp.toMillis()).toLocaleDateString() : '---'}
                                       </p>
                                    </div>
                                    <h4 className={cn("text-lg font-black tracking-tighter uppercase leading-none", selectedAlertId === alert.id ? "text-white" : "text-gray-200")}>
                                       Case #{alert.id.slice(-6).toUpperCase()}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-3">
                                       <span className={cn("text-[7px] font-black px-2 py-1 rounded-sm uppercase tracking-widest", selectedAlertId === alert.id ? "bg-white/10 text-white" : "bg-emerald-500/10 text-emerald-500")}>
                                          Resolved
                                       </span>
                                       {alert.isTransitSOS && <span className="text-[7px] font-black bg-blue-500 text-white px-2 py-1 rounded-sm uppercase tracking-widest">Transit</span>}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* MISSION SPECIFIC DATA (ONLY FOR HISTORY) */}
                     {sidebarTab === 'HISTORY' && selectedAlert && (
                        <div className="bg-blue-600/10 border border-blue-500/20 rounded-[40px] p-8 mb-10 relative overflow-hidden">
                           <div className="absolute right-0 top-0 p-8 opacity-5"><History size={160} /></div>
                           <h3 className="text-xs font-black text-blue-400 uppercase tracking-[4px] mb-6">Mission Conclusion Log</h3>
                           <div className="grid grid-cols-1 gap-6">
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Resolution Justification</p>
                                 <p className="text-xl font-black italic text-white leading-relaxed">"{selectedAlert.closureReason || 'Mission resolved with standard tactical protocols.'}"</p>
                              </div>
                              <div className="flex items-center gap-12 pt-6 border-t border-white/5">
                                 <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Response Initiation</p>
                                    <p className="text-xs font-black text-white">{selectedAlert.timestamp ? new Date(selectedAlert.timestamp.toMillis()).toLocaleString() : 'N/A'}</p>
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Rescuer Task Force</p>
                                    <div className="flex flex-wrap gap-2">
                                       {selectedAlert.activeResponders && selectedAlert.activeResponders.length > 0 ? (
                                          selectedAlert.activeResponders.map((res: any, idx: number) => (
                                             <div key={idx} className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/30">
                                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">{res.name?.charAt(0)}</div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">{res.name}</span>
                                             </div>
                                          ))
                                       ) : (
                                          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
                                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Autonomous / Remote Resolution</span>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     <div className="bg-[#1E293B]/50 rounded-[32px] border border-white/5 p-8 relative overflow-hidden">
                        <div className="flex items-start gap-4 mb-4">
                           <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0"><MapPin size={20} /></div>
                           <div className="min-w-0">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Operative Home Base</p>
                              <p className="text-xs font-bold text-white leading-relaxed">{victimData?.fullAddress || 'Address Registry Pending'}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <ShieldAlert size={120} strokeWidth={0.5} className="mb-8" />
               <p className="text-xl font-black uppercase tracking-[10px]">
                  {sidebarTab === 'LIVE' ? 'Select Active SOS' : 'Select Archived Case'}
               </p>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Kavach National Unified Command</p>
            </div>
         )}
      </main>

      {/* 🛡️ TACTICAL WARNING MODAL */}
      <AnimatePresence>
         {isWarnModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }} 
                 onClick={() => setIsWarnModalOpen(false)}
                 className="absolute inset-0 bg-black/80 backdrop-blur-md" 
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                 animate={{ opacity: 1, scale: 1, y: 0 }} 
                 exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                 className="relative w-full max-w-xl bg-[#1E293B] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-10"
               >
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/10">
                           <AlertTriangle size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Issue Misuse Warning</h3>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Grid Compliance Protocol</p>
                        </div>
                     </div>
                     <button onClick={() => setIsWarnModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Select Standardized Reason</label>
                        <div className="relative">
                           <select 
                             value={selectedReason} 
                             onChange={(e) => setSelectedReason(e.target.value)}
                             className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white appearance-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all cursor-pointer"
                           >
                              {WARNING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                           <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                     </div>

                     {selectedReason.includes("Other") && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Custom Justification</label>
                           <textarea 
                             placeholder="TYPE DETAILED REASON FOR GRID MISUSE..." 
                             className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white h-32 resize-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all uppercase placeholder:text-gray-700" 
                             value={customMsg} 
                             onChange={(e) => setCustomMsg(e.target.value)}
                           />
                        </motion.div>
                     )}

                     <div className="pt-4 flex gap-4">
                        <button 
                          onClick={() => setIsWarnModalOpen(false)}
                          className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-gray-400 uppercase hover:bg-white/10 transition-all"
                        >
                           Abort Protocol
                        </button>
                        <button 
                          disabled={isSubmittingWarn}
                          onClick={submitWarning}
                          className="flex-[2] py-4 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                           {isSubmittingWarn ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />}
                           Finalize Citation
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
