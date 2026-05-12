import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, MapPin, Phone, 
  AlertTriangle, History, MessageSquare,
  Activity, Zap, ShieldAlert, Ban, 
  CheckCircle2, Users, Search, Target, Clock,
  ChevronRight, Filter, Fingerprint, Car, X,
  ChevronDown, Heart, Lock, Calendar, Mail, ShieldCheck, Globe
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
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

export function SOSManagement({ 
  externalSelectedId, 
  verifiedProtectors = [], 
  activeAlerts = [], 
  historicalAlerts = [], 
  userStatusMap = {} 
}: { 
  externalSelectedId?: string | null, 
  verifiedProtectors?: any[],
  activeAlerts?: any[],
  historicalAlerts?: any[],
  userStatusMap?: Record<string, any>
}) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [guardians, setGuardians] = useState<any[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // 🛡️ Modals State
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(WARNING_REASONS[0]);
  const [customMsg, setCustomMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 🛡️ NO-OP: DATA INJECTED VIA PROPS FROM SUPERCELL_DASHBOARD
  }, []);

  // 📡 SYNC EXTERNAL SELECTION
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedAlertId(externalSelectedId);
      setSidebarTab('LIVE');
    }
  }, [externalSelectedId]);

  useEffect(() => {
    const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => a.id === selectedAlertId);
    
    const lat = selectedAlert?.latitude || selectedAlert?.lat || selectedAlert?.location?.latitude || selectedAlert?.location?.lat;
    const lng = selectedAlert?.longitude || selectedAlert?.lng || selectedAlert?.location?.longitude || selectedAlert?.location?.lng;
    
    if (lat && lng) {
      const resolveAddr = async () => {
        setLoadingAddress(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setResolvedAddress(data.display_name || "Verified GPS Signal");
        } catch (e) { setResolvedAddress("Tactical Resolution Failed"); }
        finally { setLoadingAddress(false); }
      };
      resolveAddr();
    } else { setResolvedAddress(null); }

    // 🛰️ TACTICAL ID RESOLUTION
    const profile = findVictimProfile();
    const currentVictimId = profile?.id || selectedAlert?.victimUid || selectedAlert?.uid || selectedAlert?.userId;
    
    // 🛰️ TACTICAL GUARDIAN FETCH
    if (currentVictimId) {
      const gRef1 = collection(db, 'users', currentVictimId, 'guardians');
      const gRef2 = collection(db, 'women_users', currentVictimId, 'safety_data');
      
      const unsub1 = onSnapshot(gRef1, (snap) => {
        if (!snap.empty) setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsub2 = onSnapshot(gRef2, (snap) => {
        if (!snap.empty) setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsub1(); unsub2(); };
    }
  }, [selectedAlertId, sidebarTab, activeAlerts, historicalAlerts, userStatusMap]);

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
      };
    }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
  }, [groupedHistory]);

  const filteredAlerts = sidebarTab === 'LIVE' 
    ? activeAlerts.filter(a => a.victimName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.toLowerCase().includes(searchTerm.toLowerCase()))
    : uniqueHistoricalVictims.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => a.id === selectedAlertId);
  const victimHistory = (sidebarTab === 'HISTORY' && selectedVictimId) ? groupedHistory[selectedVictimId] : [];
  
  // 🛰️ TACTICAL ID & PHONE RESOLUTION
  const victimId = sidebarTab === 'LIVE' 
    ? (selectedAlert?.victimUid || selectedAlert?.uid || selectedAlert?.userId) 
    : selectedVictimId;

  const firstHistoryAlert = victimHistory[0];
  const alertPhone = sidebarTab === 'LIVE' 
    ? (selectedAlert?.phone || selectedAlert?.victimPhone || selectedAlert?.phoneNumber)
    : (firstHistoryAlert?.phone || firstHistoryAlert?.victimPhone || firstHistoryAlert?.phoneNumber);

  const [pendingAppeal, setPendingAppeal] = useState<any>(null);

  // 🛰️ DEEP PROFILE SEARCH (ID -> PHONE -> NAME)
  const findVictimProfile = () => {
    if (victimId && userStatusMap[victimId]) return userStatusMap[victimId];
    if (alertPhone) {
      const profileByPhone = Object.values(userStatusMap).find((u: any) => 
        u.phoneNumber === alertPhone || u.phone === alertPhone
      );
      if (profileByPhone) return profileByPhone;
    }
    const victimName = (sidebarTab === 'LIVE' ? selectedAlert?.victimName : firstHistoryAlert?.victimName);
    if (victimName) {
      const profileByName = Object.values(userStatusMap).find((u: any) => 
        (u.name || u.userName || '').toLowerCase() === victimName.toLowerCase()
      );
      if (profileByName) return profileByName;
    }
    return null;
  };

  const victimDataFromAlert = {
    name: (sidebarTab === 'LIVE' ? (selectedAlert?.victimName || selectedAlert?.userName) : firstHistoryAlert?.victimName) || 'UNIDENTIFIED CITIZEN',
    phoneNumber: alertPhone || 'NO PHONE RECORD',
    aadhar: (sidebarTab === 'LIVE' ? selectedAlert?.aadhar : firstHistoryAlert?.aadhar) || 'UNLINKED'
  };

  const victimData = findVictimProfile() || victimDataFromAlert;

  useEffect(() => {
    if (victimId && victimData?.isSOSBlocked) {
      const q = query(collection(db, 'appeals'), where('userId', '==', victimId), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setPendingAppeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setPendingAppeal(null);
        }
      });
      return () => unsub();
    } else {
      setPendingAppeal(null);
    }
  }, [victimId, victimData?.isSOSBlocked]);

  const handleAction = async (type: 'warn' | 'ban') => {
    if (!victimData) return;
    if (type === 'warn') setIsWarnModalOpen(true);
    else if (type === 'ban') {
      if (!window.confirm("CRITICAL: Block SOS access?")) return;
      await updateDoc(doc(db, 'users', victimData.id), { isSOSBlocked: true, sosBlockedReason: "Repeated Grid Misuse" });
      toast.error("SOS Access Revoked");
    }
  };

  const submitWarning = async () => {
    if (!victimData) return;
    setIsSubmitting(true);
    const finalMsg = selectedReason.includes("Other") ? customMsg : selectedReason;
    try {
      await updateDoc(doc(db, 'users', victimData.id), {
        hasPendingWarning: true,
        warningMessage: finalMsg,
        sosStrikeCount: (victimData.sosStrikeCount || 0) + 1
      });
      toast.warning("Warning Issued");
      setIsWarnModalOpen(false);
    } catch (e) { toast.error("Citation Failed"); }
    finally { setIsSubmitting(false); }
  };

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);

  const triggerSovereignOverride = async () => {
    if (!selectedAlert) return;
    setIsOverriding(true);
    try {
      await updateDoc(doc(db, 'alerts', selectedAlert.id), {
        isSovereignOverrideActive: true,
        priority: 'SOVEREIGN_CRITICAL'
      });
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'protector')));
      const batchPromises = snap.docs.map(pDoc => 
        updateDoc(doc(db, 'users', pDoc.id), {
          currentMissionId: selectedAlert.id,
          missionStatus: 'REDIRECTED',
          isUnderSovereignCommand: true
        })
      );
      await Promise.all(batchPromises);
      toast.error("SOVEREIGN OVERRIDE ACTIVE");
      setIsOverrideModalOpen(false);
    } catch (e) { toast.error("Override Failed"); }
    finally { setIsOverriding(false); }
  };

  const handleRestoreAccess = async (uid: string) => {
    if (!window.confirm("COMMAND CENTER: Restore full tactical access?")) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSOSBlocked: false,
        isPermanentlyBlocked: false,
        sosBlockedReason: null,
        hasPendingWarning: false,
        sosStrikeCount: 0
      });

      // ⚖️ Resolve Pending Appeal if exists
      if (pendingAppeal?.id) {
        await updateDoc(doc(db, 'appeals', pendingAppeal.id), {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'SuperCell Command'
        });
      }

      toast.success("Access Restored. National Grid Updated.");
    } catch (e) { toast.error("Restoration Failed."); }
  };

  const handlePermanentBan = async (uid: string) => {
    if (!window.confirm("CRITICAL: Enforce Permanent Terminal Ban? This identity will be blacklisted.")) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSOSBlocked: true,
        isPermanentlyBlocked: true,
        sosBlockedReason: "Permanent Grid Exclusion by SuperCell Command"
      });

      // ⚖️ Reject Pending Appeal if exists
      if (pendingAppeal?.id) {
        await updateDoc(doc(db, 'appeals', pendingAppeal.id), {
          status: 'rejected',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'SuperCell Command'
        });
      }

      toast.error("Identity Blacklisted. Terminal Ban Active.");
    } catch (e) { toast.error("Ban Failed."); }
  };

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      {/* 📟 ASIDE QUEUE */}
      <aside className="w-[380px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl">
         <div className="p-8 pb-4">
            <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-white/5 mb-6">
               <button onClick={() => { setSidebarTab('LIVE'); setSelectedAlertId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'LIVE' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500")}><Activity size={12} className="inline mr-2" /> Live SOS</button>
               <button onClick={() => { setSidebarTab('HISTORY'); setSelectedAlertId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'HISTORY' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500")}><Clock size={12} className="inline mr-2" /> Logs</button>
            </div>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input type="text" placeholder="SEARCH VICTIM..." className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black text-white uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredAlerts.map((alert: any) => (
              <div key={alert.id || alert.uid} onClick={() => sidebarTab === 'LIVE' ? setSelectedAlertId(alert.id) : setSelectedVictimId(alert.uid)} className={cn("p-5 rounded-[2.5rem] border border-white/5 cursor-pointer transition-all", (selectedAlertId === alert.id || selectedVictimId === alert.uid) ? "bg-white/10 border-white/20" : "bg-[#1E293B]/50")}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5"><User size={20} className={sidebarTab === 'LIVE' ? "text-rose-500" : "text-blue-500"} /></div>
                   <div className="flex-1 truncate">
                      <h4 className="text-[11px] font-black text-white uppercase">{userStatusMap[alert.victimUid || alert.userId || alert.uid]?.name || alert.victimName || alert.name}</h4>
                      <p className="text-[7px] text-gray-500 font-black uppercase">{sidebarTab === 'LIVE' ? 'SOS Active' : `Resolved (${alert.count} Incidents)`}</p>
                   </div>
                </div>
              </div>
            ))}
         </div>
      </aside>

      {/* 🔍 MAIN CONTENT */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[#0F172A]">
         {(selectedAlert || (sidebarTab === 'HISTORY' && selectedVictimId)) ? (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
               {/* MAP - ONLY FOR LIVE */}
               {sidebarTab === 'LIVE' && selectedAlert && (
                  <div className="h-[45%] w-full relative shrink-0 border-b border-white/5">
                     <CommandMap activeAlerts={[selectedAlert]} activeProtectors={verifiedProtectors} selectedAlertId={selectedAlert.id} />
                  </div>
               )}

               <div className="p-12 max-w-6xl mx-auto w-full">
                  {/* 🛡️ HEADER AREA */}
                  <div className="flex items-end justify-between mb-10">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-rose-500/80 leading-none">
                           {sidebarTab === 'LIVE' ? 'Live Citizen Forensic Packet' : 'Archived Incident Ledger'}
                        </p>
                        <h1 className="text-5xl font-black text-white uppercase italic leading-none tracking-tighter">{victimData?.name || 'Citizen Profile'}</h1>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                           <div className="bg-[#1E293B] px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-lg">
                              <Phone size={14} className="text-gray-500" />
                              <span className="text-xs font-black text-white tabular-nums">{victimData?.phoneNumber || 'NO RECORD'}</span>
                           </div>
                           <div className="bg-[#1E293B] px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-lg">
                              <Fingerprint size={14} className="text-gray-500" />
                              <span className="text-xs font-black text-white tabular-nums tracking-widest">{victimData?.aadhar || 'UNLINKED'}</span>
                           </div>
                           {victimData?.email && (
                              <div className="bg-[#1E293B] px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-lg">
                                 <Mail size={14} className="text-gray-500" />
                                 <span className="text-xs font-black text-white lowercase">{victimData.email}</span>
                              </div>
                           )}
                           {sidebarTab === 'HISTORY' && (
                              <>
                                 {victimData?.gender && (
                                    <div className="bg-[#1E293B] px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-lg">
                                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">GDR:</span>
                                       <span className="text-xs font-black text-white uppercase">{victimData.gender}</span>
                                    </div>
                                 )}
                                 {victimData?.role && (
                                    <div className="bg-blue-500/10 px-5 py-2.5 rounded-2xl border border-blue-500/20 flex items-center gap-3 shadow-lg">
                                       <Shield size={14} className="text-blue-500" />
                                       <span className="text-xs font-black text-blue-500 uppercase">{victimData.role}</span>
                                    </div>
                                 )}
                                 {victimData?.isVerified && (
                                    <div className="bg-emerald-500/10 px-5 py-2.5 rounded-2xl border border-emerald-500/20 flex items-center gap-3 shadow-lg">
                                       <ShieldCheck size={14} className="text-emerald-500" />
                                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                    </div>
                                 )}
                                 {victimData?.specialCellLinked && (
                                    <div className="bg-rose-500/10 px-5 py-2.5 rounded-2xl border border-rose-500/20 flex items-center gap-3 shadow-lg">
                                       <Zap size={14} className="text-rose-500" />
                                       <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Special Cell</span>
                                    </div>
                                 )}
                              </>
                           )}
                        </div>
                        {(victimData?.fullAddress || victimData?.locationData?.formattedAddress) && (
                           <div className="flex items-center gap-3 text-gray-500 mt-4 bg-white/5 p-3 rounded-xl border border-white/5">
                              <MapPin size={14} className="text-rose-500" />
                              <span className="text-[9px] font-black uppercase tracking-[2px] leading-none text-gray-400">
                                 Permanent: {victimData.fullAddress || victimData.locationData?.formattedAddress}
                              </span>
                           </div>
                        )}
                     </div>

                      {/* 🛡️ DISCIPLINARY OVERLAY */}
                      <AnimatePresence>
                        {victimData?.isSOSBlocked && (
                          <motion.div 
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
                            className="absolute inset-x-0 bottom-0 top-[15%] z-50 bg-rose-950/20 flex flex-col items-center justify-center p-12 text-center rounded-[3rem]"
                          >
                             <div className="max-w-md w-full bg-[#1E293B] border-2 border-rose-500/50 rounded-[40px] p-10 shadow-[0_0_100px_rgba(244,63,94,0.4)] space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse" />
                                <div className="space-y-3">
                                   <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20">
                                      <Lock size={40} className="text-rose-500" />
                                   </div>
                                   <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Account Blocked</h2>
                                   <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">
                                      This identity has been restricted from the National Safety Grid. Adjudication Required.
                                   </p>
                                </div>

                                <div className="space-y-4">
                                   <div className="bg-black/40 border border-white/5 rounded-3xl p-6 text-left">
                                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Victim Appeal Statement:</p>
                                      <p className="text-xs font-bold text-gray-200 uppercase leading-relaxed italic">
                                         {pendingAppeal ? `"${pendingAppeal.reason}"` : "NO PENDING APPEAL SUBMITTED."}
                                      </p>
                                   </div>

                                   <div className="flex gap-3">
                                      <button 
                                         onClick={() => handleRestoreAccess(victimData.id)}
                                         className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                                      >
                                         Restore Access
                                      </button>
                                      <button 
                                         onClick={() => handlePermanentBan(victimData.id)}
                                         className="flex-1 py-5 bg-black/40 border border-rose-900 text-rose-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-[0.98]"
                                      >
                                         Permanent Ban
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                     
                     {/* 🛡️ COMPACT ACTION BUTTONS */}
                     <div className="flex items-center gap-3">
                        <button onClick={() => handleAction('warn')} className="px-6 py-2.5 bg-[#1E293B] border border-amber-500/30 text-amber-500 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:bg-amber-500 hover:text-black transition-all">
                           <AlertTriangle size={14} /> Warn Misuse
                        </button>
                        {sidebarTab === 'LIVE' && (
                           <button onClick={() => setIsOverrideModalOpen(true)} className="px-6 py-2.5 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 shadow-lg shadow-rose-600/20 transition-all border border-rose-400/30">
                              <Zap size={14} /> Sovereign Override
                           </button>
                        )}
                        <button onClick={() => handleAction('ban')} className="px-6 py-2.5 bg-[#1E293B] border border-rose-500/30 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:bg-rose-500 hover:text-white transition-all">
                           <Ban size={14} /> Ban Access
                        </button>
                     </div>
                  </div>

                  {/* 📊 TACTICAL GRID */}
                  {sidebarTab === 'LIVE' ? (
                    <div className="grid grid-cols-12 gap-6">
                       <div className="col-span-8 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30" />
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Neural Geocode Sector</p>
                                <p className="text-[12px] font-black text-white uppercase italic leading-relaxed">{loadingAddress ? "Pinpointing..." : (resolvedAddress || selectedAlert?.fullAddress || 'Sector Unknown')}</p>
                             </div>
                             <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Heart size={12} className="text-rose-500" /> Support Nodes</p>
                                <div className="space-y-3">{victimData?.primaryGuardian && (
                                       <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-500/20 shadow-lg shadow-rose-500/5">
                                          <div className="flex items-center gap-2">
                                             <span className="text-[10px] font-black text-white uppercase italic">{victimData.primaryGuardian.name}</span>
                                             <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[6px] font-black rounded-full uppercase tracking-widest">Primary</span>
                                          </div>
                                          <span className="text-[10px] font-black text-rose-400 tabular-nums">{victimData.primaryGuardian.phone}</span>
                                       </div>
                                    )}
                                    {guardians.map((g: any) => (
                                       <div key={g.id} className="flex justify-between items-center bg-black/20 px-4 py-2.5 rounded-xl border border-white/5">
                                          <span className="text-[10px] font-black text-white uppercase italic">{g.name}</span>
                                          <span className="text-[10px] font-black text-blue-400 tabular-nums">{g.phone || g.phoneNumber}</span>
                                       </div>
                                    ))}
</div>
                          </div>
                           <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5 shadow-xl mt-6">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <Shield size={12} className="text-blue-500" /> Active Tactical Responders
                              </p>
                              <div className="space-y-3">
                                 {selectedAlert?.activeResponders?.map((responder: any) => (
                                    <div key={responder.uid} className="flex justify-between items-center bg-blue-500/10 px-4 py-2.5 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                       <div className="flex items-center gap-3">
                                          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                             {responder.photo ? (
                                                <img src={responder.photo} className="w-full h-full object-cover" />
                                             ) : (
                                                <User size={12} className="text-blue-400" />
                                             )}
                                          </div>
                                          <div className="flex flex-col">
                                             <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black text-white uppercase italic leading-none">{responder.name}</span>
                                                {(responder.xp || 0) >= 25000 && (
                                                   <div className="px-1.5 py-0.5 bg-emerald-500 rounded flex items-center gap-0.5">
                                                      <ShieldCheck size={6} className="text-white" />
                                                      <span className="text-[5px] font-black text-white uppercase">VERIFIED</span>
                                                   </div>
                                                )}
                                                {(responder.xp || 0) >= 100000 && (
                                                   <div className="px-1.5 py-0.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500 rounded flex items-center gap-0.5">
                                                      <Globe size={6} className="text-blue-900" />
                                                      <span className="text-[5px] font-black text-[#0F172A] uppercase">ASSET</span>
                                                   </div>
                                                )}
                                             </div>
                                             <span className="text-[6px] font-black text-blue-500 uppercase tracking-widest mt-1">Status: Intercepting</span>
                                          </div>
                                       </div>
                                       <span className="text-[10px] font-black text-blue-400 tabular-nums">{responder.phone}</span>
                                    </div>
                                 ))}
                                 {(!selectedAlert?.activeResponders || selectedAlert.activeResponders.length === 0) && (
                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center py-2 italic">Awaiting National Grid Interception...</p>
                                 )}
                              </div>
                           </div>
                        </div>
                        <button onClick={() => { const msg = `🚨 *KAVACH SOVEREIGN DISPATCH*\nTarget: ${selectedAlert?.victimName}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); }} className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[4px] shadow-2xl flex items-center justify-center gap-4 transition-all group">
                           <Zap size={22} className="group-hover:animate-pulse" /> Dispatch Tactical Units
                        </button>
                     </div>
                     <div className="col-span-4 space-y-6">
                        <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Activity size={80} /></div>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Protocol Strikes</p>
                           <h3 className="text-5xl font-black text-rose-500 italic tabular-nums leading-none">{victimData?.sosStrikeCount || 0}</h3>
                        </div>
                     </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div className="grid grid-cols-3 gap-6 mb-8">
                          <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Alerts Triggered</p>
                             <h3 className="text-4xl font-black text-white italic tabular-nums">{victimHistory.length}</h3>
                          </div>
                          <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Verified Misuse</p>
                             <h3 className="text-4xl font-black text-rose-500 italic tabular-nums">{victimData?.sosStrikeCount || 0}</h3>
                          </div>
                          <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Reliability Index</p>
                             <h3 className="text-4xl font-black text-emerald-500 italic tracking-tighter">{(100 - ((victimData?.sosStrikeCount || 0) * 10))}%</h3>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[4px] mb-6">Incident History Details</h4>
                          {victimHistory.map((incident: any) => (
                             <div key={incident.id} className="bg-[#1E293B] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20"><Calendar size={18} /></div>
                                      <div>
                                         <p className="text-[11px] font-black text-white uppercase italic">{incident.timestamp?.toDate ? incident.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'UNDEFINED DATE'}</p>
                                         <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Ref ID: {incident.id.slice(0, 12)}...</p>
                                      </div>
                                   </div>
                                   <div className="flex flex-col items-end gap-2">
                                      <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black rounded-full uppercase tracking-widest">RESOLVED</div>
                                      {victimData?.email && <p className="text-[9px] font-black text-blue-400 lowercase italic">{victimData.email}</p>}
                                   </div>
                                </div>

                                {/* 🏛️ CITIZEN FORENSIC SNAPSHOT (HISTORY ONLY) */}
                                <div className="grid grid-cols-4 gap-3 mb-8">
                                   <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                      <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Gender</p>
                                      <p className="text-[9px] font-black text-gray-300 uppercase italic">{victimData?.gender || 'N/A'}</p>
                                   </div>
                                   <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                      <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Aadhar UID</p>
                                      <p className="text-[9px] font-black text-gray-300 tabular-nums">{victimData?.aadhar || 'UNLINKED'}</p>
                                   </div>
                                   <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                      <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Role</p>
                                      <p className="text-[9px] font-black text-blue-400 uppercase italic">{victimData?.role || 'CITIZEN'}</p>
                                   </div>
                                   <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                      <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Phone</p>
                                      <p className="text-[9px] font-black text-emerald-500 tabular-nums">{victimData?.phoneNumber || 'N/A'}</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                   <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2">Closing Reason (Mission Resolution)</p>
                                      <div className="flex flex-col gap-1">
                                         <p className="text-[10px] font-bold text-white uppercase italic">
                                            {incident.verification?.verifiedBy ? (
                                               <span className="text-emerald-400">Verified Rescue Completed</span>
                                            ) : (incident.resolutionReason || 'Self Resolved / App Closed')}
                                         </p>
                                         {incident.verification?.closureReason && (
                                            <p className="text-[8px] font-medium text-gray-400 italic">"{incident.verification.closureReason}"</p>
                                         )}
                                      </div>
                                   </div>
                                   <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2">Operational Responders & Savior</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                         {incident.verification?.verifiedBy && (
                                            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded-lg border border-emerald-400/20 uppercase tracking-tighter flex items-center gap-1.5">
                                               <ShieldCheck size={10} />
                                               LIFE SAVER: {userStatusMap[incident.verification.verifiedBy]?.name || 'Protector Node'}
                                            </div>
                                         )}
                                         {incident.activeResponders && incident.activeResponders.length > 0 ? (
                                            incident.activeResponders.map((resp: any) => {
                                               if (resp.uid === incident.verification?.verifiedBy) return null;
                                               return (
                                                  <span key={resp.uid || resp.id} className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[8px] font-black rounded-lg border border-blue-400/10 uppercase tracking-tighter">
                                                     {resp.name || userStatusMap[resp.uid || resp.id]?.name || 'Supporting Node'}
                                                  </span>
                                               );
                                            })
                                         ) : (
                                            !incident.verification?.verifiedBy && <p className="text-[10px] font-bold text-gray-500 uppercase italic">No Grid Responders Linked</p>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20"><ShieldAlert size={120} strokeWidth={0.5} className="mb-8" /><p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p></div>
         )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
         {isWarnModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWarnModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-[#1E293B] border border-white/10 rounded-[40px] shadow-2xl p-10">
                  <h3 className="text-xl font-black text-white uppercase italic mb-8">Issue Misuse Warning</h3>
                  <div className="space-y-6">
                     <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white appearance-none outline-none">{WARNING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                     <button disabled={isSubmitting} onClick={submitWarning} className="w-full py-4 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-3">{isSubmitting ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />} Finalize Citation</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
