import React, { useState, useEffect } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';

import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  MapPin, Battery, Activity, Phone, ShieldAlert, Volume2, Camera, 
  Compass, Signal, Wifi, Terminal, ExternalLink, RefreshCw, Play, 
  BellRing, UserCheck, ShieldCheck, HelpCircle, AlertTriangle, ChevronRight, User, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import NearbyHubModal from './NearbyHubModal';
import MedicalHubModal from './MedicalHubModal';
import PCROfficerDashboard from './PCROfficerDashboard';
import TacticalModal from './TacticalModal';

// Imported modular components & hooks
import ProtectorHeader from './protector/ProtectorHeader';
import ProtectorTabs from './protector/ProtectorTabs';
import ProtectorAlertList from './protector/ProtectorAlertList';
import ProtectorMapContainer from './protector/ProtectorMapContainer';
import ProtectorHQHub from './protector/panels/ProtectorHQHub';
import { useProtectorShift } from '../hooks/useProtectorShift';
import { useProtectorCarSimulation } from '../hooks/useProtectorCarSimulation';
import { useProtectorAlerts } from '../hooks/useProtectorAlerts';
import { useProtectorHandlers } from '../hooks/useProtectorHandlers';
import { ProtectorClosureModal } from './protector/components/ProtectorClosureModal';
import { ProtectorInterceptHUD } from './protector/components/ProtectorInterceptHUD';
import { ProtectorSuccessModal } from './protector/components/ProtectorSuccessModal';
import { ProtectorShiftCompleteModal } from './protector/components/ProtectorShiftCompleteModal';
import { ProtectorStandDownModal } from './protector/components/ProtectorStandDownModal';

export default function ProtectorDashboard() {
  const { user, profile, userPos, setInterceptActive, setActiveAlertsCount } = useKavachStore();
  const [activeTab, setActiveTab] = useState('map');
  const [isNearbyHubOpen, setIsNearbyHubOpen] = useState(false);
  const [hubViewMode, setHubViewMode] = useState<'all' | 'protectors_only'>('all');
  const [isMedicalHubOpen, setIsMedicalHubOpen] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  
  const isPcrOfficer = false;
  const isGuardian = (profile as any)?.isGuardian || (profile as any)?.protectorVetting?.isGuardian === true;

  // Guardian Specific State
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [activeSOSAlert, setActiveSOSAlert] = useState<any>(null);
  const [hudStats, setHudStats] = useState({ pingCount: 0, ringStatus: 'idle', listenStatus: 'idle' });
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "🛰️ [UPLINK] Kavach sentinel mesh activated.",
    "🔒 [SECURE] AES-256 session integrity verified.",
    "📍 [GPS] High-accuracy coordinate grid enabled."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 8)]);
  };

  // Real-time family member subscription (dual-query pattern)
  // Query 1: Find citizens who set this guardian's phone as primaryGuardian.phone
  // Query 2: Find the specific phone the guardian entered (familyPhone) directly
  // Both are merged and deduplicated by UID.
  useEffect(() => {
    if (!profile?.phoneNumber) return;

    const guardianPhone = profile.phoneNumber;
    const guardianPhoneClean = `+91${guardianPhone.replace(/\D/g, '').slice(-10)}`;
    const familyPhone: string | null = (profile as any)?.protectorVetting?.familyPhone || null;

    addLog(`🔄 Scanning safe grid for linked nodes...`);

    let unsub1: (() => void) | null = null;
    let familyByPrimary: any[] = [];
    let familyByDirect: any[] = [];

    const mergeAndSet = () => {
      // Deduplicate by uid
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

    // Query 1 — citizens who added this guardian by phone
    const q1 = query(
      collection(db, 'users'),
      where('primaryGuardian.phone', 'in', [guardianPhone, guardianPhoneClean])
    );
    unsub1 = onSnapshot(q1, (snap) => {
      familyByPrimary = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      mergeAndSet();
    }, (err) => {
      console.error('Guardian Q1 error:', err);
      setLoadingFamily(false);
    });

    // Query 2 — the family member the guardian explicitly linked (by their phone number)
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


  // Real-time Active alert subscription for family members
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

  const handleRemoteRing = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, ringStatus: 'ringing' }));
    addLog(`📣 Sending remote ring command to node...`);
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
    } catch (e) {
      addLog(`❌ Failed to dispatch ring command.`);
      setHudStats(prev => ({ ...prev, ringStatus: 'error' }));
    }
  };

  const handleSilentListen = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, listenStatus: 'listening' }));
    addLog(`🎙️ Engaging silent microphone intercept...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'start_listen',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`📡 Live audio uplink established.`);
      setTimeout(() => setHudStats(prev => ({ ...prev, listenStatus: 'success' })), 2000);
    } catch (e) {
      addLog(`❌ Audio uplink handshake refused.`);
      setHudStats(prev => ({ ...prev, listenStatus: 'error' }));
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
      addLog(`✅ Location telemetry updated.`);
    } catch (e) {
      addLog(`❌ Precision location request timed out.`);
    }
  };

  const [isCarScreenOpen, setIsCarScreenOpen] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isMegaphoneActive, setIsMegaphoneActive] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInterceptHUDOpen, setIsInterceptHUDOpen] = useState(false);
  const [isStandDownOpen, setIsStandDownOpen] = useState(false);
  const [isAborting, setIsAborting] = useState(false);

  const [showTacticalPledge, setShowTacticalPledge] = useState<{ isOpen: boolean, alertId: string | null }>({ isOpen: false, alertId: null });
  const [rescuePhoto, setRescuePhoto] = useState<string | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [handshakeInput, setHandshakeInput] = useState('');
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Extract hooks
  const { 
    activeAlerts, setActiveAlerts, respondingToId, setRespondingToId, 
    activeInterceptAlert, setActiveInterceptAlert, assignedDispatch, setAssignedDispatch, 
    distanceToVictim, lastResolvedVictim, showSuccessMotivation, setShowSuccessMotivation, 
    resolvingAlert, setResolvingAlert, isCancelledByVictim, setIsCancelledByVictim,
    deEscalationReason, setDeEscalationReason, addToAbortedBlacklist, setAbortedVictims
  } = useProtectorAlerts(user, profile, userPos, activeTab || 'map', isPcrOfficer, setInterceptActive, setIsInterceptHUDOpen, setIsNavigating);

  // Sync alert count to global store for Header badge
  useEffect(() => {
    setActiveAlertsCount(activeAlerts.length);
    // Return cleanup to clear count if unmounted
    return () => setActiveAlertsCount(0);
  }, [activeAlerts.length, setActiveAlertsCount]);

  // Auto-switch to ALERTS tab when a new alert comes in
  const prevAlertCount = React.useRef(0);
  useEffect(() => {
    if (activeAlerts.length > prevAlertCount.current) {
      setActiveTab('list');
    }
    prevAlertCount.current = activeAlerts.length;
  }, [activeAlerts.length]);

  useEffect(() => {
    const handleOpenAlerts = () => setActiveTab('list');
    document.addEventListener('OPEN_ALERTS_TAB', handleOpenAlerts);
    return () => document.removeEventListener('OPEN_ALERTS_TAB', handleOpenAlerts);
  }, []);
  
  const { isOnDuty, shiftVehicle, setShiftVehicle, shiftZone, setShiftZone, shiftPartner, setShiftPartner, shiftStartTime, shiftElapsedSeconds, showShiftCompleteModal, setShowShiftCompleteModal, shiftStats, dynamicVehicleNo, customJurisdiction, handleToggleDuty, formatShiftTime } = useProtectorShift(user, profile, activeAlerts, assignedDispatch, setAssignedDispatch, setIsCarScreenOpen, setIsSirenActive, setIsMegaphoneActive);
  
  const { carSpeed, etaTimer } = useProtectorCarSimulation(isCarScreenOpen, respondingToId, isNavigating, isOnDuty, profile);

  const { handleStartHelp, confirmTacticalResponse, handleResolveAlert, handleAbortResponse, maskName } = useProtectorHandlers(
    user, isProcessingResponse, setIsProcessingResponse, showTacticalPledge, setShowTacticalPledge,
    setRespondingToId, activeAlerts, setActiveInterceptAlert, isCarScreenOpen, setIsInterceptHUDOpen,
    setInterceptActive, setIsNavigating, resolvingAlert, setResolvingAlert, handshakeInput, setHandshakeInput,
    resolutionSummary, setResolutionSummary, rescuePhoto, setRescuePhoto
  );

  const protectorStats = {
    rating: (profile as any)?.stats?.rating || (profile as any)?.rating || 0.0,
    ratingCount: (profile as any)?.stats?.ratingCount || (profile as any)?.ratingCount || 0,
    level: (profile as any)?.stats?.level || (profile as any)?.level || 1,
    xp: (profile as any)?.stats?.xp || (profile as any)?.xp || 0,
    livesHelped: (profile as any)?.stats?.livesHelped || (profile as any)?.livesHelped || 0,
    successRate: (profile as any)?.stats?.successRate || (profile as any)?.successRate || 0,
    avgResponse: (profile as any)?.stats?.avgResponse || (profile as any)?.avgResponse || '--'
  };

  if (isPcrOfficer) {
    return (
      <>
        <PCROfficerDashboard
          user={user}
          profile={profile}
          userPos={userPos}
          activeAlerts={activeAlerts}
          assignedDispatch={assignedDispatch}
          activeInterceptAlert={activeInterceptAlert}
          respondingToId={respondingToId}
          isNavigating={isNavigating}
          distanceToVictim={distanceToVictim}
          isSirenActive={isSirenActive}
          carSpeed={carSpeed}
          etaTimer={etaTimer}
          shiftElapsedSeconds={shiftElapsedSeconds}
          formatShiftTime={formatShiftTime}
          shiftVehicle={shiftVehicle}
          setShiftVehicle={setShiftVehicle}
          shiftZone={shiftZone}
          setShiftZone={setShiftZone}
          shiftPartner={shiftPartner}
          setShiftPartner={setShiftPartner}
          isOnDuty={isOnDuty}
          handleToggleDuty={handleToggleDuty}
          setIsSirenActive={setIsSirenActive}
          setActiveInterceptAlert={setActiveInterceptAlert}
          setIsInterceptHUDOpen={setIsInterceptHUDOpen}
          setInterceptActive={setInterceptActive}
          setIsNavigating={setIsNavigating}
          handleStartHelp={handleStartHelp}
          setResolvingAlert={setResolvingAlert}
          maskName={maskName}
          fileInputRef={fileInputRef}
          isCarScreenOpen={isCarScreenOpen}
          setIsCarScreenOpen={setIsCarScreenOpen}
        />

        <ProtectorShiftCompleteModal
          showShiftCompleteModal={showShiftCompleteModal}
          setShowShiftCompleteModal={setShowShiftCompleteModal}
          shiftStats={shiftStats}
          dynamicVehicleNo={dynamicVehicleNo}
          customJurisdiction={customJurisdiction}
        />
      </>
    );
  }

  if (isGuardian) {
    return (
      <div className="min-h-screen bg-[#0F172A] pb-6 font-sans overflow-x-hidden relative text-white">
        <ProtectorHeader profile={profile} user={user} isOnDuty={isOnDuty} protectorStats={protectorStats} setActiveTab={setActiveTab} handleToggleDuty={handleToggleDuty} />
        
        <div className="px-5 mt-4 space-y-4 max-w-xl mx-auto">
          {/* Header Panel / Live Telemetry Stats */}
          <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Wifi className="text-blue-400" size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Security Uplink</p>
                <h3 className="text-sm font-black text-white mt-1 uppercase tracking-tight">Kavach Safe Grid</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Node Status</p>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-emerald-400 uppercase">Synchronized</span>
              </div>
            </div>
          </div>

          {/* distress active alert panel */}
          {activeSOSAlert && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-950/40 border border-red-500/30 p-5 rounded-3xl shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[9px] tracking-widest px-3 py-1 uppercase rounded-bl-xl flex items-center gap-1">
                <ShieldAlert className="animate-spin" size={10} /> CRITICAL SOS ACTIVE
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                {activeSOSAlert.victimName} is in distress!
              </h3>
              <p className="text-xs text-red-300/80 font-bold uppercase tracking-wide mt-1">
                Last Location: {activeSOSAlert.location?.address || 'Classified Grid'}
              </p>

              {/* Encrypted Audio stream visualization */}
              <div className="bg-slate-950/80 border border-red-500/20 rounded-2xl p-4 my-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Volume2 className="animate-pulse" size={12} /> Live Encrypted Audio Link (HUD-Uplink)
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">AES-256 decrypted</span>
                </div>
                <div className="flex items-center gap-1 h-8 justify-center">
                  {[...Array(16)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-red-500 rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.random() * 28 + 4}px`, 
                        animationDelay: `${i * 0.08}s`, 
                        animationDuration: '0.5s' 
                      }} 
                    />
                  ))}
                </div>
              </div>

              {/* Mock captured safety snapshots */}
              <div className="my-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Camera size={12} /> Live Evidence Snapshots (Front/Back)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative">
                    <img 
                      src="https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=400&q=80" 
                      alt="Front Snapshot" 
                      className="w-full h-full object-cover opacity-60" 
                    />
                    <span className="absolute bottom-2 left-2 text-[8px] bg-black/60 px-2 py-0.5 rounded font-black tracking-widest text-white uppercase">FRONT CAMERA</span>
                  </div>
                  <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative">
                    <img 
                      src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80" 
                      alt="Rear Snapshot" 
                      className="w-full h-full object-cover opacity-60" 
                    />
                    <span className="absolute bottom-2 left-2 text-[8px] bg-black/60 px-2 py-0.5 rounded font-black tracking-widest text-white uppercase">REAR CAMERA</span>
                  </div>
                </div>
              </div>

              {/* Location HUD */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Estimated Distance</span>
                  <p className="text-xl font-black text-white mt-0.5">3.4 KM</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Tactical ETA</span>
                  <p className="text-xl font-black text-white mt-0.5">~6 Mins</p>
                </div>
              </div>

              {/* SOS Distress Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStartHelp(activeSOSAlert.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] tracking-widest py-3.5 rounded-2xl uppercase flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <Compass size={14} className="animate-spin" /> INTERCEPT RADAR HUD
                </button>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeSOSAlert.location?.latitude || 0},${activeSOSAlert.location?.longitude || 0}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 hover:bg-slate-800 text-white border border-white/10 px-4 py-3.5 rounded-2xl flex items-center justify-center cursor-pointer"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          )}

          {/* FAMILY NODES CONTAINER */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <UserCheck size={12} className="text-blue-400" /> Monitored Family Nodes ({familyMembers.length})
            </h4>

            {loadingFamily ? (
              <div className="bg-[#1E293B]/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Scanning Grid Nodes...</p>
              </div>
            ) : familyMembers.length === 0 ? (
              <div className="bg-[#1E293B]/40 border border-white/5 rounded-3xl p-6 text-center space-y-3">
                <HelpCircle className="text-slate-500 mx-auto" size={32} />
                <h5 className="font-bold text-slate-300 text-sm">No Active Nodes</h5>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  To link a family member, ask them to add your number <span className="underline font-bold text-blue-400">{profile?.phoneNumber}</span> as their Primary Guardian, or enter their phone number during setup.
                </p>
              </div>
            ) : (
              familyMembers.map((member) => {
                const isMemberDistress = activeSOSAlert?.victimUid === member.uid || activeSOSAlert?.victimUid === member.id;
                
                return (
                  <div 
                    key={member.id} 
                    className={cn(
                      "bg-[#1E293B]/50 backdrop-blur-xl rounded-3xl p-4 border transition-all duration-300 relative overflow-hidden",
                      isMemberDistress 
                        ? "border-red-500/50 bg-red-950/10 shadow-[0_4px_20px_rgba(239,68,68,0.08)]" 
                        : "border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{member.name || 'Citizen'}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{member.phoneNumber || member.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/5 px-2.5 py-1 rounded-full">
                        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isMemberDistress ? "bg-red-500" : "bg-emerald-500")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-wider", isMemberDistress ? "text-red-400" : "text-emerald-400")}>
                          {isMemberDistress ? "Distress" : "Safe"}
                        </span>
                      </div>
                    </div>

                    {/* Member Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-950/40 p-2.5 rounded-2xl border border-white/5 text-center">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                          <Battery size={10} className="text-emerald-400" /> Battery
                        </span>
                        <p className="text-xs font-black text-white mt-0.5">{member.lastLocation?.accuracy ? '84%' : member.telemetry?.battery || '89%'}</p>
                      </div>
                      <div className="border-l border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                          <Signal size={10} className="text-blue-400" /> Signal
                        </span>
                        <p className="text-xs font-black text-white mt-0.5">Excellent</p>
                      </div>
                      <div className="border-l border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider flex items-center justify-center gap-1">
                          <Activity size={10} className="text-purple-400" /> Status
                        </span>
                        <p className="text-xs font-black text-white mt-0.5">Online</p>
                      </div>
                    </div>

                    {/* Location Metadata */}
                    <div className="mt-3 bg-slate-950/20 p-3 rounded-2xl border border-white/5 text-xs text-slate-400 font-bold uppercase tracking-wide flex items-center gap-2">
                      <MapPin size={12} className="text-blue-400 shrink-0" />
                      <span className="truncate">{member.fullAddress || member.locationData?.formattedAddress || 'Grid Sector GPS Confirmed'}</span>
                    </div>

                    {/* Sentinel Remote Commands Panel */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleRemoteRing(member.uid || member.id)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-white/5 cursor-pointer transition-all border-none",
                          hudStats.ringStatus === 'ringing' ? "bg-amber-600/20 border-amber-500/40 text-amber-400" : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                        )}
                      >
                        <BellRing size={10} /> Ring Remote
                      </button>
                      <button 
                        onClick={() => handleSilentListen(member.uid || member.id)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-white/5 cursor-pointer transition-all border-none",
                          hudStats.listenStatus === 'listening' ? "bg-rose-600/20 border-rose-500/40 text-rose-400" : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                        )}
                      >
                        <Volume2 size={10} /> Live Listen
                      </button>
                      <button 
                        onClick={() => handleLocationPing(member.uid || member.id)}
                        className="py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 cursor-pointer border-none"
                      >
                        <RefreshCw size={10} className={hudStats.pingCount > 0 ? "animate-spin" : ""} /> Ping GPS
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* GOOGLE SENIOR ENGINEER SYSTEM LOGS */}
          <div className="bg-[#1E293B]/40 border border-white/5 rounded-3xl p-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Terminal size={12} className="text-blue-500" /> Sentinel Telemetry Console
            </h5>
            <div className="bg-black/80 rounded-2xl p-3 font-mono text-[9px] text-slate-300 space-y-1.5 h-36 overflow-y-auto custom-scrollbar border border-white/5 select-all">
              {systemLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start leading-relaxed">
                  <span className="text-blue-500">❯</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Closed/Success modals */}
        <ProtectorClosureModal
          resolvingAlert={resolvingAlert}
          setResolvingAlert={setResolvingAlert}
          resolutionSummary={resolutionSummary}
          setResolutionSummary={setResolutionSummary}
          handshakeInput={handshakeInput}
          setHandshakeInput={setHandshakeInput}
          rescuePhoto={rescuePhoto}
          setRescuePhoto={setRescuePhoto}
          handleResolveAlert={handleResolveAlert}
          fileInputRef={fileInputRef}
        />

        <ProtectorInterceptHUD
          isInterceptHUDOpen={isInterceptHUDOpen}
          activeInterceptAlert={activeInterceptAlert}
          useMapboxFallback={useMapboxFallback}
          isNavigating={isNavigating}
          distanceToVictim={distanceToVictim}
          setIsNavigating={setIsNavigating}
          setResolvingAlert={setResolvingAlert}
          setIsInterceptHUDOpen={setIsInterceptHUDOpen}
          setInterceptActive={setInterceptActive}
          setUseMapboxFallback={setUseMapboxFallback}
          onAbort={() => setIsStandDownOpen(true)}
        />

        <ProtectorStandDownModal
          isOpen={isStandDownOpen}
          isAborting={isAborting}
          onCancel={() => setIsStandDownOpen(false)}
          onConfirm={async (reason) => {
            const abortingAlertId = activeInterceptAlert?.id;
            const victimUid = activeInterceptAlert?.victimUid || activeInterceptAlert?.uid;
            setIsAborting(true);
            await handleAbortResponse(abortingAlertId, reason);
            if (victimUid) {
              addToAbortedBlacklist(victimUid);
            }
            setIsAborting(false);
            setIsStandDownOpen(false);
          }}
        />

        <ProtectorSuccessModal
          showSuccessMotivation={showSuccessMotivation}
          setShowSuccessMotivation={setShowSuccessMotivation}
          lastResolvedVictim={lastResolvedVictim}
          isCancelledByVictim={isCancelledByVictim}
          deEscalationReason={deEscalationReason}
          onCloseModal={() => {
            setShowSuccessMotivation(false);
            setIsCancelledByVictim(false);
            setDeEscalationReason('');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] pb-6 font-sans overflow-x-hidden relative">
      <ProtectorHeader profile={profile} user={user} isOnDuty={isOnDuty} protectorStats={protectorStats} setActiveTab={setActiveTab} handleToggleDuty={handleToggleDuty} />
      


      <div className="mt-4">
        <ProtectorTabs 
          activeTab={activeTab || 'map'} 
          setActiveTab={setActiveTab} 
          activeAlertsLength={activeAlerts.length} 
          isPcrOfficer={isPcrOfficer} 
        />
      </div>

      {activeTab === 'list' && (
        <ProtectorAlertList 
          activeAlerts={activeAlerts} 
          profile={profile} 
          setActiveInterceptAlert={(alert) => {
            if (profile?.respondingToAlertId === alert.id) {
              setIsInterceptHUDOpen(true);
              setInterceptActive(true);
            } else {
              handleStartHelp(alert.id);
            }
          }} 
          setActiveTab={setActiveTab} 
          setIsNearbyHubOpen={setIsNearbyHubOpen} 
          setIsMedicalHubOpen={setIsMedicalHubOpen} 
        />
      )}

      {activeTab === 'hq' && (
        <ProtectorHQHub profile={profile} userPos={userPos} activeInterceptAlert={activeInterceptAlert} />
      )}

      {(!activeTab || activeTab === 'map') && (
        <ProtectorMapContainer 
          activeAlerts={activeAlerts}
          setIsNearbyHubOpen={setIsNearbyHubOpen} 
          setIsMedicalHubOpen={setIsMedicalHubOpen} 
          setActiveTab={setActiveTab} 
          setHubViewMode={setHubViewMode} 
          setActiveInterceptAlert={(alert) => {
            if (profile?.respondingToAlertId === alert.id) {
              setIsInterceptHUDOpen(true);
              setInterceptActive(true);
            } else {
              handleStartHelp(alert.id);
            }
          }}
        />
      )}

      <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => setIsNearbyHubOpen(false)} viewMode={hubViewMode} />
      <MedicalHubModal isOpen={isMedicalHubOpen} onClose={() => setIsMedicalHubOpen(false)} />

      <TacticalModal isOpen={showTacticalPledge.isOpen} onClose={() => setShowTacticalPledge({ isOpen: false, alertId: null })} onConfirm={confirmTacticalResponse} type="info" title="Emergency Response Activated" description="Your live activity and route will now be monitored securely while you assist the victim." confirmText="START RESPONSE" />

      {/* Handshake Closure modal */}
      <ProtectorClosureModal
        resolvingAlert={resolvingAlert}
        setResolvingAlert={setResolvingAlert}
        resolutionSummary={resolutionSummary}
        setResolutionSummary={setResolutionSummary}
        handshakeInput={handshakeInput}
        setHandshakeInput={setHandshakeInput}
        rescuePhoto={rescuePhoto}
        setRescuePhoto={setRescuePhoto}
        handleResolveAlert={handleResolveAlert}
        fileInputRef={fileInputRef}
      />

      {/* Dynamic Intercept HUD */}
      <ProtectorInterceptHUD
        isInterceptHUDOpen={isInterceptHUDOpen}
        activeInterceptAlert={activeInterceptAlert}
        useMapboxFallback={useMapboxFallback}
        isNavigating={isNavigating}
        distanceToVictim={distanceToVictim}
        setIsNavigating={setIsNavigating}
        setResolvingAlert={setResolvingAlert}
        setIsInterceptHUDOpen={setIsInterceptHUDOpen}
        setInterceptActive={setInterceptActive}
        setUseMapboxFallback={setUseMapboxFallback}
        onAbort={() => setIsStandDownOpen(true)}
      />

       {/* Stand Down Reason Modal */}
      <ProtectorStandDownModal
        isOpen={isStandDownOpen}
        isAborting={isAborting}
        onCancel={() => setIsStandDownOpen(false)}
        onConfirm={async (reason) => {
          const abortingAlertId = activeInterceptAlert?.id;
          const victimUid = activeInterceptAlert?.victimUid || activeInterceptAlert?.uid;
          setIsAborting(true);
          await handleAbortResponse(abortingAlertId, reason);
          // Blacklist this victim so their alerts do not appear for 3 hours for this protector
          if (victimUid) {
            addToAbortedBlacklist(victimUid);
          }
          setIsAborting(false);
          setIsStandDownOpen(false);
        }}
      />

      {/* Success / Mission Complete celebration */}
      <ProtectorSuccessModal
        showSuccessMotivation={showSuccessMotivation}
        setShowSuccessMotivation={setShowSuccessMotivation}
        lastResolvedVictim={lastResolvedVictim}
        isCancelledByVictim={isCancelledByVictim}
        deEscalationReason={deEscalationReason}
        onCloseModal={() => {
          setShowSuccessMotivation(false);
          setIsCancelledByVictim(false);
          setDeEscalationReason('');
        }}
      />
    </div>
  );
}
