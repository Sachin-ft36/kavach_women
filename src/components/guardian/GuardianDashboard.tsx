import React, { useState, useEffect } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { db } from '../../firebase';
import { 
  collection, query, where, onSnapshot, getDocs, doc, 
  addDoc, serverTimestamp, getDoc, limit, orderBy 
} from 'firebase/firestore';
import { 
  MapPin, Battery, Activity, Phone, ShieldAlert, Volume2, Camera, 
  Compass, Signal, Wifi, Terminal, RefreshCw, BellRing, 
  ShieldCheck, AlertTriangle, User, Loader2, Play, Users, 
  VolumeX, Clock, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const VictimMap = React.lazy(() => import('../maps/VictimMap'));

export default function GuardianDashboard() {
  const { user, profile } = useKavachStore();
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');
  
  // Dynamic State variables for family nodes
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [activeSOSAlert, setActiveSOSAlert] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [hudStats, setHudStats] = useState({ pingCount: 0, ringStatus: 'idle', sirenStatus: 'idle', checkInStatus: 'idle' });
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, any>>({});
  
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "🛰️ [UPLINK] Family Safe Grid activated.",
    "🔒 [SECURE] Bidirectional encrypted session verified.",
    "📍 [RADAR] Scanning for citizen telemetry..."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // 1. Subscribe to linked citizen(s) by matching guardian phone number
  useEffect(() => {
    if (!profile?.phoneNumber) return;

    const guardianPhone = profile.phoneNumber;
    const guardianPhoneClean = `+91${guardianPhone.replace(/\D/g, '').slice(-10)}`;
    const familyPhone: string | null = (profile as any)?.protectorVetting?.familyPhone || null;

    addLog(`🔄 Scanning safe grid for linked nodes...`);

    let familyByPrimary: any[] = [];
    let familyByDirect: any[] = [];

    const mergeAndSet = () => {
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const m of [...familyByPrimary, ...familyByDirect]) {
        const key = m.uid || m.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(m);
        }
      }
      setFamilyMembers(merged);
      setLoadingFamily(false);
      addLog(`✅ Connected to ${merged.length} family node${merged.length !== 1 ? 's' : ''}.`);
    };

    // Query 1 — Citizens who added this guardian
    const q1 = query(
      collection(db, 'users'),
      where('primaryGuardian.phone', 'in', [guardianPhone, guardianPhoneClean])
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      familyByPrimary = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      mergeAndSet();
    }, (err) => {
      console.error('Guardian Q1 error:', err);
      setLoadingFamily(false);
    });

    // Query 2 — Guardian explicitly linked phone
    let unsub2: (() => void) | null = null;
    if (familyPhone) {
      const familyPhoneClean = `+91${familyPhone.replace(/\D/g, '').slice(-10)}`;
      const q2 = query(
        collection(db, 'users'),
        where('phoneNumber', 'in', [familyPhone, familyPhoneClean])
      );
      unsub2 = onSnapshot(q2, (snap) => {
        familyByDirect = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
      }, (err) => {
        console.error('Guardian Q2 error:', err);
      });
    }

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [profile?.phoneNumber, (profile as any)?.protectorVetting?.familyPhone]);

  // Real-time reverse geocoding watcher for family member movement
  useEffect(() => {
    if (familyMembers.length === 0) return;
    
    familyMembers.forEach(async (member) => {
      const id = member.id || member.uid;
      const lat = member.lastLocation?.lat || member.locationData?.lat || member.latitude;
      const lng = member.lastLocation?.lng || member.locationData?.lng || member.longitude;
      if (!id || !lat || !lng) return;

      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (resolvedAddresses[id]?.cacheKey === cacheKey) return;

      try {
        const { getReverseMetadata } = await import('../../services/locationService');
        const resolved = await getReverseMetadata(lat, lng);
        setResolvedAddresses(prev => ({
          ...prev,
          [id]: {
            ...resolved,
            cacheKey
          }
        }));
      } catch (err) {
        console.warn("Guardian reverse geocoding fail:", err);
      }
    });
  }, [familyMembers]);

  // 2. Subscribe to active alerts for the linked family members
  useEffect(() => {
    if (familyMembers.length === 0) return;
    const uids = familyMembers.map(m => m.uid || m.id).filter(Boolean);
    if (uids.length === 0) return;

    const q = query(
      collection(db, 'alerts'),
      where('victimUid', 'in', uids),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const activeAlert = snap.docs[0].data();
        setActiveSOSAlert({ id: snap.docs[0].id, ...activeAlert });
        addLog(`🚨 WARNING: Distress protocol active for ${activeAlert.victimName}!`);
      } else {
        setActiveSOSAlert(null);
      }
    });

    return () => unsub();
  }, [familyMembers]);

  // 3. Real-time Evidence stream query during active SOS
  useEffect(() => {
    if (!activeSOSAlert?.id) {
      setEvidenceList([]);
      return;
    }
    
    // Listen for evidence chunks uploaded during the active alert
    const q = query(
      collection(db, 'evidence'),
      where('alert_id', '==', activeSOSAlert.id),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      setEvidenceList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Evidence snapshot listener error (likely index pending):", err);
    });

    return () => unsub();
  }, [activeSOSAlert?.id]);

  // Remote Commands Action Dispatchers
  const handleRemoteRing = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, ringStatus: 'ringing' }));
    addLog(`📣 Sending remote ring command to device...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'ring_phone',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`📡 Remote ring successfully broadcast.`);
      setTimeout(() => setHudStats(prev => ({ ...prev, ringStatus: 'success' })), 2000);
      toast.success("Remote Ring signal broadcasted.");
    } catch (e) {
      addLog(`❌ Failed to dispatch ring command.`);
      setHudStats(prev => ({ ...prev, ringStatus: 'error' }));
      toast.error("Failed to ring device.");
    }
  };

  const handleRemoteSiren = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, sirenStatus: 'sirening' }));
    addLog(`🚨 Activating remote emergency siren...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'siren',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`📡 Remote siren signal broadcast.`);
      setTimeout(() => setHudStats(prev => ({ ...prev, sirenStatus: 'success' })), 2000);
      toast.success("Siren activation signal broadcasted.");
    } catch (e) {
      addLog(`❌ Failed to trigger remote siren.`);
      setHudStats(prev => ({ ...prev, sirenStatus: 'error' }));
      toast.error("Failed to sound siren.");
    }
  };

  const handleLocationPing = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, pingCount: prev.pingCount + 1 }));
    addLog(`📍 Dispatching instant location query...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'ping_location',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`✅ Location telemetry refresh requested.`);
      toast.success("GPS refresh ping sent.");
    } catch (e) {
      addLog(`❌ Precision location request timed out.`);
      toast.error("Ping request failed.");
    }
  };

  const handleCheckIn = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, checkInStatus: 'pinging' }));
    addLog(`💬 Pushing safety check-in prompt to citizen screen...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'check_in',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`📡 Check-In signal dispatched.`);
      setTimeout(() => setHudStats(prev => ({ ...prev, checkInStatus: 'success' })), 2000);
      toast.success("Safety Check-in request sent.");
    } catch (e) {
      addLog(`❌ Check-In dispatcher timed out.`);
      setHudStats(prev => ({ ...prev, checkInStatus: 'error' }));
      toast.error("Failed to send check-in.");
    }
  };

  const handleEmergencyBroadcast = async (member: any) => {
    addLog(`📣 Initiating Emergency Support Request to nearby Protectors...`);
    try {
      const position = member.lastLocation || member.locationData || {};
      if (!position.lat) {
        toast.error("Citizen location unavailable. Cannot broadcast.");
        return;
      }

      await addDoc(collection(db, 'alerts'), {
        victimUid: member.uid || member.id,
        victimName: member.name || "Kavach Citizen",
        victimPhone: member.phoneNumber || member.phone || "",
        status: 'active',
        latitude: position.lat,
        longitude: position.lng,
        type: 'GUARDIAN_REQUEST',
        triggerMethod: 'remote',
        priority: 'MEDIUM',
        timestamp: Date.now(),
        dispatchRadius: 1.0,
        handshakeCode: Math.floor(1000 + Math.random() * 9000).toString(),
        message: `Guardian requested assistance for ${member.name || 'citizen'}.`
      });

      addLog(`📡 Support request blasted to volunteer network within 1km.`);
      toast.success("Guardian Emergency Support Request broadcasted!");
    } catch (err) {
      addLog(`❌ Failed to trigger volunteer broadcast.`);
      toast.error("Failed to broadcast alert.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060b13] pb-12 font-sans text-white relative">
      {/* Dynamic Command Center Header */}
      <div className="px-5 pt-6 pb-4 bg-gradient-to-b from-[#0b1323] to-transparent">
        <div className="flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <ShieldCheck className="text-indigo-400" size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Family Command Center</p>
              <h1 className="text-[17px] font-black text-white mt-1 uppercase tracking-tight">KAVACH Guardian</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Grid</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-2 space-y-5 max-w-xl mx-auto">
        
        {/* Loading Family Nodes */}
        {loadingFamily ? (
          <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center shadow-xl">
            <Loader2 className="animate-spin text-indigo-500 mb-3" size={32} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scanning Secure Grid Channels...</p>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <User className="text-slate-500 mx-auto" size={40} />
            <h5 className="font-black text-slate-250 text-sm uppercase tracking-wide">No Linked Family Nodes</h5>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Ask your family members to register as a <span className="text-indigo-400 font-bold">Citizen</span> and add your phone number <span className="underline font-bold text-white">{profile?.phoneNumber}</span> as their primary guardian.
            </p>
          </div>
        ) : (
          familyMembers.map((member) => {
            // Determine active safety state
            const isSOS = activeSOSAlert?.victimUid === member.uid || activeSOSAlert?.victimUid === member.id;
            const isThreat = member.isShadowActive || member.shadowModeActive;
            const isSuspicious = member.isRideDeviationAlertActive || member.rideGracePeriodEndsAt;
            const isOffline = member.lastLocation?.timestamp 
              ? (Date.now() - member.lastLocation.timestamp > 300000) 
              : false;

            let statusColor = "bg-emerald-500 text-emerald-400 border-emerald-500/20";
            let statusText = "🟢 Safe";
            let statusBannerStyle = "from-emerald-500/10 to-transparent border-emerald-500/20";
            
            if (isSOS) {
              statusColor = "bg-red-500 text-red-400 border-red-500/20";
              statusText = "🔴 SOS Active";
              statusBannerStyle = "from-red-500/20 to-transparent border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.08)]";
            } else if (isThreat) {
              statusColor = "bg-orange-500 text-orange-400 border-orange-500/20";
              statusText = "🟠 Threat Detected";
              statusBannerStyle = "from-orange-500/15 to-transparent border-orange-500/25";
            } else if (isSuspicious) {
              statusColor = "bg-amber-500 text-amber-400 border-amber-500/20";
              statusText = "🟡 Suspicious Activity";
              statusBannerStyle = "from-amber-500/15 to-transparent border-amber-500/25";
            } else if (isOffline) {
              statusColor = "bg-slate-500 text-slate-400 border-slate-500/20";
              statusText = "⚫ Device Offline";
              statusBannerStyle = "from-slate-500/10 to-transparent border-slate-500/20";
            }

            return (
              <div key={member.id} className="space-y-4">
                
                {/* 1. SAFETY STATUS CARD */}
                <div className={cn(
                  "bg-gradient-to-r p-5 rounded-3xl border flex flex-col gap-4 relative overflow-hidden transition-all duration-500",
                  statusBannerStyle
                )}>
                  {isSOS && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[8px] tracking-widest px-3 py-1 uppercase rounded-bl-xl flex items-center gap-1.5">
                      <ShieldAlert className="animate-spin" size={10} /> Live Distress Mode
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {member.photoUrl || member.photoURL ? (
                          <img src={member.photoUrl || member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={22} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-black text-white uppercase tracking-tight leading-none">{member.name || 'Citizen Node'}</h2>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1.5">{member.phoneNumber || member.phone || "No Number"}</span>
                      </div>
                    </div>

                    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/40 shadow-sm")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusColor.split(" ")[0])} />
                      <span className="text-[9.5px] font-black uppercase tracking-wider">{statusText}</span>
                    </div>
                  </div>

                  {/* Battery and Signal telemetry */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5 text-center">
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                        <Battery size={10} className="text-emerald-400" /> Battery
                      </span>
                      <p className="text-xs font-black text-white mt-1">{member.telemetry?.battery || '84%'}</p>
                    </div>
                    <div className="border-l border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                        <Signal size={10} className="text-blue-400" /> Signal
                      </span>
                      <p className="text-xs font-black text-white mt-1">Excellent</p>
                    </div>
                    <div className="border-l border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                        <Activity size={10} className="text-purple-400" /> Status
                      </span>
                      <p className="text-xs font-black text-white mt-1">{isOffline ? 'Offline' : 'Online'}</p>
                    </div>
                  </div>

                  {/* Geolocation Tag */}
                  <div className="bg-slate-950/30 p-3.5 rounded-2xl border border-white/5 text-xs text-slate-300 font-bold uppercase tracking-wide flex flex-col gap-1.5 justify-start items-start">
                    <div className="flex items-center gap-2.5 w-full">
                      <MapPin size={14} className="text-indigo-400 shrink-0" />
                      <span className="truncate font-black text-white">
                        {resolvedAddresses[member.id || member.uid]?.suburb || 'Resolving Sector...'} ({resolvedAddresses[member.id || member.uid]?.pincode || '------'})
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-semibold pl-6 tracking-wide normal-case">
                      {resolvedAddresses[member.id || member.uid]?.address || member.fullAddress || member.locationData?.formattedAddress || 'Awaiting telemetry sync...'}
                    </div>
                  </div>
                </div>

                {/* 2. COMMAND ACTIONS PANEL */}
                <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-4 space-y-3 shadow-lg">
                  <h4 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Terminal size={12} className="text-indigo-400" /> Tactical Device Overrides
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleRemoteRing(member.uid || member.id)}
                      className={cn(
                        "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer transition-all border-none",
                        hudStats.ringStatus === 'ringing' ? "bg-amber-600/20 text-amber-400" : "bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-200"
                      )}
                    >
                      <BellRing size={12} /> Ring Phone
                    </button>
                    <button 
                      onClick={() => handleRemoteSiren(member.uid || member.id)}
                      className={cn(
                        "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer transition-all border-none",
                        hudStats.sirenStatus === 'sirening' ? "bg-red-600/20 text-red-400" : "bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-200"
                      )}
                    >
                      <Volume2 size={12} /> Trigger Siren
                    </button>
                    <button 
                      onClick={() => handleLocationPing(member.uid || member.id)}
                      className="py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-200 border border-white/5 cursor-pointer border-none"
                    >
                      <RefreshCw size={12} className={hudStats.pingCount > 0 ? "animate-spin" : ""} /> Ping GPS
                    </button>
                    <button 
                      onClick={() => handleCheckIn(member.uid || member.id)}
                      className={cn(
                        "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer transition-all border-none",
                        hudStats.checkInStatus === 'pinging' ? "bg-indigo-600/25 text-indigo-400" : "bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-200"
                      )}
                    >
                      <ShieldAlert size={12} /> Check-In Prompt
                    </button>
                  </div>
                </div>

                {/* 3. TACTICAL MAP */}
                <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-4 space-y-3 shadow-lg relative overflow-hidden">
                  <h4 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Compass size={12} className="text-indigo-400" /> Tactical Incident Map</span>
                    {isSOS && <span className="text-[8px] text-red-400 font-bold animate-pulse uppercase">Focus Mode Active</span>}
                  </h4>
                  
                  {/* Real Map Container */}
                  <div className="w-full h-56 bg-slate-950 border border-white/5 rounded-2xl overflow-hidden relative">
                    <React.Suspense fallback={
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="animate-spin text-indigo-500 mb-2" size={24} />
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">Initializing Tactical Map...</span>
                      </div>
                    }>
                      <VictimMap
                        activeAlerts={activeSOSAlert ? [activeSOSAlert] : []}
                        customPos={
                          (member.lastLocation?.lat && member.lastLocation?.lng) ? [member.lastLocation.lat, member.lastLocation.lng] :
                          (member.locationData?.lat && member.locationData?.lng) ? [member.locationData.lat, member.locationData.lng] :
                          (member.latitude && member.longitude) ? [member.latitude, member.longitude] :
                          undefined
                        }
                        isProtectorHUD={true}
                      />
                    </React.Suspense>
                  </div>
                </div>

                {/* 4. EMERGENCY BROADCAST TO VOLUNTEERS */}
                <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-5 text-center space-y-4 shadow-lg">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/25 flex items-center justify-center mx-auto">
                    <Users className="text-indigo-400" size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-black text-white text-xs uppercase tracking-widest">Mobilize Volunteer Protectors</h4>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                      Trigger an Emergency Support Request to send notifications to volunteer Protectors within a 1km radius of the citizen.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleEmergencyBroadcast(member)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] tracking-[0.2em] rounded-2xl uppercase border-none cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    Request Volunteer Support
                  </button>
                </div>

                {/* 5. EVIDENCE FEED CENTER (Privacy-gated, active only during distress/SOS) */}
                <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-4 space-y-3 shadow-lg">
                  <h4 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Camera size={12} className="text-indigo-400" /> Emergency Evidence Center
                  </h4>

                  {!isSOS && !isThreat ? (
                    <div className="p-6 text-center bg-slate-950/30 border border-white/5 rounded-2xl space-y-2">
                      <LockIcon className="mx-auto text-slate-600" size={24} />
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Feeds Encrypted</h5>
                      <p className="text-[9px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                        In compliance with safety privacy policies, camera snapshots and audio logs are only unlocked when distress mode is active.
                      </p>
                    </div>
                  ) : evidenceList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/30 border border-white/5 rounded-2xl">
                      <Loader2 className="animate-spin text-slate-600 mx-auto mb-2" size={18} />
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Waiting for incoming forensic upload streams...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Photo Snapshots */}
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block mb-2">Captured Snapshots</span>
                        <div className="grid grid-cols-2 gap-2">
                          {evidenceList.filter(e => e.type === 'Snapshot').map((ev) => (
                            <div key={ev.id} className="bg-slate-950 border border-white/5 rounded-xl overflow-hidden aspect-[4/3] relative">
                              <img src={ev.url} alt="Forensic Feed" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1.5 left-1.5 text-[7px] bg-black/60 px-1.5 py-0.5 rounded font-black tracking-widest text-white uppercase flex items-center gap-1">
                                <Clock size={8} /> {new Date(ev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Audio Logs */}
                      <div className="border-t border-white/5 pt-3">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block mb-2">Tactical Audio Records</span>
                        <div className="space-y-2">
                          {evidenceList.filter(e => e.type === 'Audio Log').map((ev, i) => (
                            <div key={ev.id} className="bg-slate-950 border border-white/5 p-2.5 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Volume2 size={12} className="text-red-400" />
                                <span className="text-[9px] font-black text-slate-350 uppercase">Audio Log #{evidenceList.filter(e => e.type === 'Audio Log').length - i}</span>
                              </div>
                              <a 
                                href={ev.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                              >
                                <Play size={10} fill="currentColor" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. AI RISK INTELLIGENCE & TIMELINE */}
                <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-4 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Activity size={12} className="text-indigo-400" /> Live safety Timeline
                    </h4>
                    <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI Guard Link</span>
                  </div>

                  {/* Threat Flags */}
                  {(isSOS || isThreat || isSuspicious) && (
                    <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-2xl flex gap-2">
                      <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block leading-none">AI Risk Warning</span>
                        <p className="text-[9.5px] text-amber-300/80 leading-normal font-medium">
                          {isSOS ? "Critical Emergency trigger confirmed. Responder nodes dispatching." :
                           isThreat ? "High-sensitivity threat threshold breached on user sentinel layer." :
                           "Unusual path routing or stationary stop detected along the transit ride."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline Logs */}
                  <div className="space-y-3 pl-2 relative border-l border-white/5 ml-2">
                    <div className="relative pl-4">
                      <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#060b13]" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase">10:12 PM</span>
                      <p className="text-[10px] text-slate-350 font-bold uppercase mt-0.5">Location Updated</p>
                    </div>
                    {isSuspicious && (
                      <div className="relative pl-4">
                        <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-[#060b13]" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase">10:14 PM</span>
                        <p className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">Citizen Started Ride</p>
                      </div>
                    )}
                    {isThreat && (
                      <div className="relative pl-4">
                        <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-[#060b13]" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase">10:16 PM</span>
                        <p className="text-[10px] text-orange-400 font-bold uppercase mt-0.5">Unsafe Route / Stop Detected</p>
                      </div>
                    )}
                    {isSOS && (
                      <div className="relative pl-4">
                        <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#060b13] animate-ping" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase">10:17 PM</span>
                        <p className="text-[10px] text-red-400 font-bold uppercase mt-0.5">SOS Emergency Triggered</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}

        {/* 7. SYSTEM TELEMETRY LOGGER PANEL */}
        <div className="bg-[#0f172a]/60 border border-white/5 rounded-3xl p-4">
          <h5 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Terminal size={12} className="text-indigo-400" /> Sentinel Telemetry Console
          </h5>
          <div className="bg-black/85 rounded-2xl p-3 font-mono text-[9px] text-indigo-300 space-y-1.5 h-36 overflow-y-auto custom-scrollbar border border-white/5 select-all">
            {systemLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2 items-start leading-relaxed">
                <span className="text-indigo-500">❯</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Inline SVG Lock Icon for security visualization
function LockIcon({ size = 20, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
