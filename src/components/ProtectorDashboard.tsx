import React, { useState, useEffect } from 'react';
import { useKavachStore } from '../state/useKavachStore';
import { db } from '../firebase';
import { toast } from 'sonner';
import MapplsVictimMap from './maps/MapplsVictimMap';

import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  MapPin, Battery, Activity, Phone, ShieldAlert, Volume2, Camera,
  Compass, Signal, Wifi, Terminal, ExternalLink, RefreshCw, Play,
  BellRing, UserCheck, ShieldCheck, HelpCircle, AlertTriangle, ChevronRight, User, Loader2, Shield,
  Crosshair, Route, Layers, X, Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import NearbyHubModal from './NearbyHubModal';
import MedicalHubModal from './MedicalHubModal';
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

// --- GOVERNMENT EMERGENCY ALERT SOUND SYSTEM ---
let audioCtx: AudioContext | null = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

const startEmergencyAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    // Stop any existing sound first to avoid overlapping contexts
    stopEmergencyAlertSound();
    
    audioCtx = new AudioContextClass();
    
    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(853, audioCtx.currentTime); // Standard EAS Freq 1
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(960, audioCtx.currentTime); // Standard EAS Freq 2
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    
    // Pulse pattern: 1s ON, 0.5s OFF
    const now = audioCtx.currentTime;
    let t = now;
    for (let i = 0; i < 60; i++) {
      gainNode.gain.setValueAtTime(0.45, t);
      gainNode.gain.setValueAtTime(0, t + 0.95);
      t += 1.35;
    }
  } catch (error) {
    console.error("Failed to start emergency audio:", error);
  }
};

const stopEmergencyAlertSound = () => {
  try {
    if (osc1) { osc1.stop(); osc1.disconnect(); osc1 = null; }
    if (osc2) { osc2.stop(); osc2.disconnect(); osc2 = null; }
    if (gainNode) { gainNode.disconnect(); gainNode = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
  } catch {}
};

export default function ProtectorDashboard() {
  const { user, profile, userPos, setInterceptActive, setActiveAlertsCount, setOverlayActive } = useKavachStore();
  const [activeTab, setActiveTab] = useState('map');
  const [isNearbyHubOpen, setIsNearbyHubOpen] = useState(false);
  const [hubViewMode, setHubViewMode] = useState<'all' | 'protectors_only'>('all');
  const [isMedicalHubOpen, setIsMedicalHubOpen] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

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
  const isPcrOfficer = (profile as any)?.protectorVetting?.occupation === 'POLICE' || (profile as any)?.occupation === 'POLICE';

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



  const hasRealAlert = activeAlerts.length > 0;
  const displayAlert = hasRealAlert ? activeAlerts[0] : null;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [silentNotificationEnabled, setSilentNotificationEnabled] = useState(() => {
    return (profile as any)?.silentNotificationsEnabled ?? (localStorage.getItem('kavach_silent_notifications_enabled') === 'true');
  });
  const [showSilentWarning, setShowSilentWarning] = useState(false);

  useEffect(() => {
    if (profile && typeof (profile as any).silentNotificationsEnabled === 'boolean') {
      setSilentNotificationEnabled((profile as any).silentNotificationsEnabled);
      localStorage.setItem('kavach_silent_notifications_enabled', String((profile as any).silentNotificationsEnabled));
    }
  }, [profile]);

  const handleToggleSilentPreference = async () => {
    const nextVal = !silentNotificationEnabled;
    if (nextVal) {
      setShowSilentWarning(true);
      setOverlayActive(true);
    } else {
      setSilentNotificationEnabled(false);
      localStorage.setItem('kavach_silent_notifications_enabled', 'false');
      toast.success("Sound alerts enabled for incoming SOS.");
      if (user?.uid) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            silentNotificationsEnabled: false
          });
        } catch (error) {
          console.error("Failed to update silent notifications in DB:", error);
        }
      }
    }
  };

  const confirmSilentNotification = async () => {
    setSilentNotificationEnabled(true);
    localStorage.setItem('kavach_silent_notifications_enabled', 'true');
    toast.warning("Silent notifications enabled. Alert sounds muted.", { icon: '🔕' });
    setShowSilentWarning(false);
    setOverlayActive(false);
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          silentNotificationsEnabled: true
        });
      } catch (error) {
        console.error("Failed to update silent notifications in DB:", error);
      }
    }
  };

  const cancelSilentNotification = () => {
    setSilentNotificationEnabled(false);
    localStorage.setItem('kavach_silent_notifications_enabled', 'false');
    setShowSilentWarning(false);
    setOverlayActive(false);
  };

  useEffect(() => {
    if (!displayAlert) {
      setElapsedSeconds(0);
      return;
    }

    const getAlertTimeMs = () => {
      const ts = displayAlert.timestamp;
      if (!ts) return Date.now();
      if (ts.toMillis) return ts.toMillis();
      if (ts.seconds) return ts.seconds * 1000;
      if (typeof ts === 'number') return ts;
      return Date.now();
    };

    const alertTimeMs = getAlertTimeMs();

    const updateTimer = () => {
      const diffSec = Math.floor((Date.now() - alertTimeMs) / 1000);
      setElapsedSeconds(diffSec > 0 ? diffSec : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [displayAlert?.id, displayAlert?.timestamp]);

  const formatElapsed = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getFormattedSosTime = (alert: any) => {
    if (!alert) return '10:24 AM';
    const ts = alert.timestamp;
    let date = new Date();
    if (ts) {
      if (ts.toDate) date = ts.toDate();
      else if (ts.seconds) date = new Date(ts.seconds * 1000);
      else if (typeof ts === 'number') date = new Date(ts);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white font-sans overflow-y-auto relative flex flex-col pb-1">
      {/* 📡 SILENT NOTIFICATION PREFERENCE TOGGLE */}
      <div className="mx-5 mt-4 px-4 py-3 bg-[#111622] border border-white/5 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <Volume2 size={16} />
          </div>
          <div className="flex flex-col text-left">
            <p className="text-[11px] font-bold text-white leading-tight">SILENT NOTIFICATION</p>
            <p className="text-[9px] text-gray-500 font-semibold mt-0.5 leading-none">Toggle ON to mute alert sounds</p>
          </div>
        </div>
        <button
          onClick={handleToggleSilentPreference}
          className={cn(
            "w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative flex items-center shrink-0",
            silentNotificationEnabled ? "bg-[#10B981]" : "bg-slate-700"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200",
              silentNotificationEnabled ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* 🟢 ALL CLEAR CARD (WHEN NO ACTIVE SOS ALERTS) */}
      {!hasRealAlert && (
        <div className="relative mx-5 mt-4 h-[118px] rounded-[20px] overflow-hidden flex items-center p-4 group shadow-[0_0_40px_-15px_rgba(6,182,212,0.15)] border border-cyan-500/15 bg-gradient-to-br from-[#030712] via-[#05101E] to-[#071A2F]">
          {/* Cyber Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:16px_16px] opacity-70" />

          {/* Ambient Glowing Orbs */}
          <div className="absolute -left-[40px] -top-[40px] w-[110px] h-[110px] bg-[#00E676]/10 blur-[45px] rounded-full pointer-events-none" />
          <div className="absolute right-[40px] top-1/2 -translate-y-1/2 w-[150px] h-[150px] bg-cyan-600/10 blur-[50px] rounded-full pointer-events-none" />

          {/* --- LEFT SIDE: INFO --- */}
          <div className="relative z-10 flex flex-col justify-center gap-2 h-full py-1">
            <div className="flex items-center gap-3">
              {/* Glowing Shield Icon Container */}
              <div className="relative w-[36px] h-[36px] rounded-full bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,230,118,0.2)] backdrop-blur-md">
                <div className="absolute inset-0 rounded-full border border-[#00E676]/50 hidden opacity-15" />
                <ShieldCheck size={18} className="text-[#00E676] drop-shadow-[0_0_6px_rgba(0,230,118,0.7)]" strokeWidth={2.2} />
              </div>

              {/* Text Group */}
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-white leading-tight">All Clear</h3>
                <p className="text-xs text-slate-400 mt-0.5">No active SOS alerts</p>
              </div>
            </div>

            {/* Status Message */}
            <p className="text-xs font-normal text-emerald-400 mt-1">
              You are ready to help and protect
            </p>
          </div>

          {/* --- RIGHT SIDE: COMMAND CENTER RADAR & PHONE --- */}
          <div className="absolute right-0 top-0 bottom-0 w-[240px] pointer-events-none select-none">

            {/* Cyber Radar System */}
            <div className="absolute top-1/2 -translate-y-1/2 right-[100px] w-[180px] h-[180px] flex items-center justify-center">

              {/* Radar Sweeping Animation */}
              <div className="absolute w-[180px] h-[180px] rounded-full overflow-hidden border border-cyan-500/10">
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_70%,rgba(0,230,118,0.12)_100%)] animate-[spin_4s_linear_infinite]" />
              </div>

              {/* Faint Axis Crosshairs */}
              <div className="absolute w-[220px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
              <div className="absolute h-[220px] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent" />

              {/* Concentric Cyber Rings */}
              <div className="absolute w-[130px] h-[130px] rounded-full border border-cyan-400/10" />
              <div className="absolute w-[70px] h-[70px] rounded-full border border-cyan-400/15 border-dashed" />

              {/* Radar Tracking Dots */}
              <div className="absolute left-[20px] top-[90px] w-[4px] h-[4px] rounded-full bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <div className="absolute right-[40px] top-[50px] w-[5px] h-[5px] rounded-full bg-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.8)] " />
            </div>

            {/* Premium 4K High-Fidelity Smartphone Mockup */}
            <div className="absolute top-1/2 -translate-y-[48%] right-[16px] w-[52px] h-[102px] rounded-[13px] bg-gradient-to-br from-[#475569] via-[#0F172A] to-[#1E293B] shadow-[0_15px_30px_-10px_rgba(0,0,0,1)] rotate-[15deg] z-10 flex items-center justify-center p-[1.5px] ring-1 ring-black/80">

              {/* Phone Inner Bezel & Screen Container */}
              <div className="relative w-full h-full bg-black rounded-[11px] flex flex-col items-center overflow-hidden border border-white/[0.08]">

                {/* notch */}
                <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[22px] h-[4px] bg-black rounded-full z-30" />

                {/* OLED Screen Content */}
                <div className="absolute inset-[0.8px] bg-gradient-to-b from-[#030712] via-[#071324] to-[#030712] rounded-[10px] flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute -top-[50%] -right-[50%] w-[200%] h-[200%] bg-gradient-to-b from-white/[0.05] to-transparent rotate-[35deg] pointer-events-none z-20" />

                  {/* Status Bar */}
                  <div className="absolute top-[2px] right-[3px] flex items-end gap-[0.5px] z-20 opacity-80">
                    <div className="w-[0.5px] h-[1px] bg-white rounded-sm" />
                    <div className="w-[0.5px] h-[1.5px] bg-white rounded-sm" />
                    <div className="w-[0.5px] h-[2px] bg-white rounded-sm" />
                  </div>

                  {/* Center Shield */}
                  <div className="relative flex flex-col items-center justify-center mt-[4px] z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-7 h-7 bg-[#00E676]/30 blur-[8px] rounded-full pointer-events-none " />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C12 2 20 5.5 20 11V16L12 22L4 16V11C4 5.5 12 2 12 2Z" fill="url(#neon-green-grad-v2)" />
                      <path d="M9 12L11 14L15 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <defs>
                        <linearGradient id="neon-green-grad-v2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#69FFB4" />
                          <stop offset="1" stopColor="#00E676" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <p className="text-[4.5px] font-bold text-white tracking-[0.1em] uppercase mt-2">System Normal</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🚨 SOS ALERT CARD */}
      {displayAlert && (
        <div className="mx-4 mt-3 bg-[#121418] rounded-[18px] p-3.5 shadow-xl border border-red-500/10">

          {/* Header Bar */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-6 h-6 bg-[#FF3B30]/20 blur-md rounded-full" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  <rect x="3.5" y="17.5" width="17" height="4.5" rx="1.5" fill="url(#baseGrad)" />
                  <path d="M5.5 17.5C5.5 10 7.5 7.5 12 7.5C16.5 7.5 18.5 10 18.5 17.5H5.5Z" fill="url(#domeGrad)" />
                  <ellipse cx="8.5" cy="11.5" rx="1.2" ry="2.8" transform="rotate(-35 8.5 11.5)" fill="#FFFFFF" fillOpacity="0.85" />
                  <path d="M12 5V2" stroke="#FFD60A" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M7 7.5L4.5 5" stroke="#FFD60A" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M17 7.5L19.5 5" stroke="#FFD60A" strokeWidth="2.2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="domeGrad" x1="12" y1="7.5" x2="12" y2="17.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF4B4B" />
                      <stop offset="1" stopColor="#D90000" />
                    </linearGradient>
                    <linearGradient id="baseGrad" x1="12" y1="17.5" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E1D7ED" />
                      <stop offset="1" stopColor="#9282A8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-[#FF3B30] text-[12px] font-bold tracking-[0.1em] drop-shadow-[0_0_6px_rgba(255,59,48,0.5)]">
                SOS ALERT
              </span>
            </div>

            {/* Dynamic Distance Indicator */}
            {distanceToVictim[displayAlert.id] && (
              <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-full px-2.5 py-0.5 text-right flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,59,48,0.05)]">
                <span className="text-[8px] text-[#FF3B30]/70 font-black uppercase tracking-widest">Distance:</span>
                <span className="text-[12px] text-[#FF3B30] font-black tracking-tight tabular-nums">{distanceToVictim[displayAlert.id]}</span>
              </div>
            )}
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between mb-3 px-0.5">

            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-[48px] h-[48px] rounded-full border-[2px] border-[#FF3B30] overflow-hidden bg-[#2A2D35] shadow-[0_0_10px_rgba(255,59,48,0.2)]">
                  {displayAlert.victimPhoto ? (
                    <img src={displayAlert.victimPhoto} alt="Victim" className="w-full h-full object-cover" />
                  ) : displayAlert.victimName === 'Ananya Sharma' ? (
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop" alt="Victim" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-900/60 to-red-950/80 flex items-center justify-center text-red-300 font-black text-lg">
                      {displayAlert.victimName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#FF3B30]/40 hidden opacity-30" />
              </div>

              <div className="flex flex-col justify-center">
                <h3 className="text-white text-[15px] font-semibold leading-tight tracking-wide">
                  {displayAlert.victimName}
                </h3>
                <p className="text-[#8E8E93] text-[11px] mt-0.5">
                  {displayAlert.distance ? `${displayAlert.distance} km away from you` : 'Nearby'}
                </p>
                <p className="text-[#FF3B30] text-[11px] font-medium mt-0.5">
                  High Priority
                </p>
              </div>
            </div>

            {/* Right: SOS Trigger Time */}
            <div className="flex items-center h-full">
              <div className="w-[1px] h-[44px] bg-[#2C2C2E] mr-3" />
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-left">
                  <p className="text-[#8E8E93] text-[10px] leading-tight font-medium">SOS Time</p>
                  <p className="text-[#FF3B30] text-[20px] font-bold leading-none mt-1.5 tracking-wide tabular-nums">
                    {getFormattedSosTime(displayAlert)}
                  </p>
                </div>
                <ChevronRight size={18} className="text-[#8E8E93]" />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (respondingToId === displayAlert.id) {
                  setIsStandDownOpen(true);
                  setOverlayActive(true);
                } else {
                  toast.info("Alert Rejected");
                }
              }}
              className="flex-1 h-[44px] bg-[#1C0D10] border border-[#4A1619] hover:bg-[#2A1114] text-[#FF3B30] rounded-[13px] flex items-center justify-center gap-1.5 transition-colors active:scale-95 group"
            >
              <X size={16} className="text-[#FF3B30] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              <span className="text-[12px] font-semibold tracking-wider">REJECT</span>
            </button>

            {respondingToId === displayAlert.id ? (
              <button
                onClick={() => {
                  setIsNavigating(true);
                  setIsInterceptHUDOpen(true);
                  setInterceptActive(true);
                  setActiveTab('map');
                  toast.success("Navigation map opened.");
                }}
                className="flex-1 h-[44px] bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-colors active:scale-95 group"
              >
                <Compass size={16} className="text-[#98C6F7] group-hover:scale-110 transition-transform animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-[12px] font-semibold tracking-wider">NAVIGATE</span>
              </button>
            ) : (
              <button
                onClick={() => { handleStartHelp(displayAlert.id); setIsNavigating(true); }}
                className="flex-1 h-[44px] bg-[#1D6A23] hover:bg-[#16551B] text-white rounded-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(29,106,35,0.2)] transition-colors active:scale-95 group"
              >
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] fill-[#98E0A0] group-hover:scale-110 transition-transform">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-[12px] font-semibold tracking-wider">RESPOND</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* 🗺️ INTERACTIVE MAP */}
      <div className="mx-5 mt-4 bg-[#141822] border border-white/5 rounded-3xl overflow-hidden relative h-[360px] shadow-2xl">
        <MapplsVictimMap
          activeAlerts={activeAlerts}
          isProtectorHUD={true}
          isNavigating={isNavigating}
          onVictimClick={() => {
            const alert = activeAlerts.find((a: any) => a.status === 'active' || a.status === 'responding');
            if (alert && setActiveInterceptAlert) {
              setActiveInterceptAlert(alert);
            }
          }}
        />

        {/* MAP ACTIONS OVERLAY (RIGHT SIDE) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 items-center">
          <div className="flex flex-col items-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('recenter-map'))}
              className="w-10 h-10 bg-[#0F1420]/90 border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all shadow-lg hover:border-cyan-500/30"
            >
              <Crosshair size={16} />
            </button>
            <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">Re-center</span>
          </div>


          <div className="flex flex-col items-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-map-style'))}
              className="w-10 h-10 bg-[#0F1420]/90 border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all shadow-lg hover:border-cyan-500/30"
            >
              <Layers size={16} />
            </button>
            <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">Layers</span>
          </div>
        </div>
      </div>

      {/* 📋 ALERT DETAILS */}
      {displayAlert && (
        <div className="mx-4 mt-3 bg-[#141820] border border-white/8 rounded-[18px] px-4 py-3.5 shadow-xl">

          {/* Header Row */}
          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-2">
              {/* Shield/Alert icon */}
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span className="text-white text-[13px] font-bold tracking-wide">ALERT DETAILS</span>
            </div>
          </div>

          {/* 3-Column Info Row */}
          <div className="grid grid-cols-3 gap-3">

            {/* Column 1: Location */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">Location</p>
              <div className="flex items-start gap-1.5">
                <MapPin size={13} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-gray-200 leading-snug">
                  {typeof displayAlert.location === 'string'
                    ? displayAlert.location
                    : displayAlert.location && typeof displayAlert.location === 'object'
                      ? `${(displayAlert.location as any).latitude?.toFixed(4)}, ${(displayAlert.location as any).longitude?.toFixed(4)}`
                      : 'Location unavailable'}
                </p>
              </div>
            </div>

            {/* Column 2: Alert Type */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">Alert Type</p>
              <div className="flex items-center gap-2">
                {/* SOS Badge */}
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-[6px] font-black text-white">SOS</span>
                </div>
                <span className="text-[12px] font-semibold text-red-400">
                  {displayAlert.type === 'button' ? 'SOS Button' : displayAlert.type || 'SOS Button'}
                </span>
              </div>
            </div>

            {/* Column 3: Shared With */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">Shared With</p>
              <div className="flex items-center gap-2">
                {/* Person icon */}
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
                {/* Phone icon */}
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                  </svg>
                </div>
                {/* Shield/Police icon */}
                <div className="w-7 h-7 rounded-full bg-yellow-600 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z"/>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ⚡ YOUR ACTIONS */}
      {displayAlert && (
        <div className="mx-5 mt-6 space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Your Actions</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {/* NAVIGATE — locked until responded */}
            <button
              onClick={() => respondingToId ? setIsNavigating(!isNavigating) : toast.warning("Pehle RESPOND karo tab navigate kar sakte ho.")}
              className={cn(
                "p-3.5 border rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 relative",
                respondingToId
                  ? isNavigating
                    ? "bg-blue-500/5 border-blue-500/30 active:scale-95"
                    : "bg-[#141822] border-white/5 active:scale-95"
                  : "bg-[#0D1018] border-white/5 opacity-40 cursor-not-allowed"
              )}
            >
              {!respondingToId && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400"><path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
                </div>
              )}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", respondingToId ? (isNavigating ? "bg-blue-600 text-white " : "bg-blue-500/10 text-blue-400") : "bg-white/5 text-gray-600")}>
                <Compass size={18} />
              </div>
              <div>
                <span className={cn("block text-[10px] font-black leading-tight", respondingToId ? "text-white" : "text-gray-600")}>Navigate</span>
                <span className="block text-[8px] text-gray-500 font-bold mt-0.5 leading-none">{respondingToId ? "Start Route" : "Respond First"}</span>
              </div>
            </button>

            {/* NEAR PROTECTORS — always available */}
            <button
              onClick={() => {
                setHubViewMode('protectors_only');
                setIsNearbyHubOpen(true);
              }}
              className="p-3.5 bg-[#141822] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <span className="block text-[10px] font-black text-white leading-tight">Near Protector</span>
                <span className="block text-[8px] text-gray-500 font-bold mt-0.5 leading-none">View Swarm</span>
              </div>
            </button>

            {/* SHARE STATUS — always available */}
            <button
              onClick={() => {
                toast.success("Location shared with search grid.");
              }}
              className="p-3.5 bg-[#141822] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </div>
              <div>
                <span className="block text-[10px] font-black text-white leading-tight">Share Status</span>
                <span className="block text-[8px] text-gray-500 font-bold mt-0.5 leading-none">Live Telemetry</span>
              </div>
            </button>

            {/* SAFE ARRIVAL — locked until responded */}
            <button
              onClick={() => respondingToId ? setResolvingAlert(displayAlert) : toast.warning("Pehle RESPOND karo tab mark kar sakte ho.")}
              className={cn(
                "p-3.5 border rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 relative",
                respondingToId
                  ? "bg-[#141822] border-white/5 active:scale-95"
                  : "bg-[#0D1018] border-white/5 opacity-40 cursor-not-allowed"
              )}
            >
              {!respondingToId && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400"><path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
                </div>
              )}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", respondingToId ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-600")}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className={cn("block text-[10px] font-black leading-tight", respondingToId ? "text-white" : "text-gray-600")}>Safe Arrival</span>
                <span className="block text-[8px] text-gray-500 font-bold mt-0.5 leading-none">{respondingToId ? "Mark Resolved" : "Respond First"}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 🚨 EMERGENCY BANNER */}
      <div className="mx-5 mt-6 p-4 bg-red-950/10 border border-red-500/10 rounded-3xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
            <Shield size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase italic">Stay Safe. Stay Alert.</p>
            <p className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">Your response can save a life.</p>
          </div>
        </div>
        <button onClick={() => window.open('tel:112')} className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl transition-all shadow-md shadow-red-900/15 active:scale-95 flex items-center gap-2">
          <Phone size={11} className="shrink-0" fill="currentColor" />
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-wider leading-none">Emergency Call</span>
            <span className="text-[11px] font-black tracking-widest leading-none mt-0.5">112</span>
          </div>
        </button>
      </div>

      {/* POPUP MODALS & HUDs */}
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
        onAbort={() => { setIsStandDownOpen(true); setOverlayActive(true); }}
      />

      {/* Stand Down Reason Modal */}
      <ProtectorStandDownModal
        isOpen={isStandDownOpen}
        isAborting={isAborting}
        onCancel={() => { setIsStandDownOpen(false); setOverlayActive(false); }}
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
          setOverlayActive(false);
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
      {/* ⚠️ SILENT NOTIFICATION WARNING OVERLAY */}
      {showSilentWarning && (
        <div className="fixed inset-0 z-[2000000] flex items-center justify-center bg-black/85 backdrop-blur-md p-5 animate-none">
          <div className="w-full max-w-[420px] bg-[#121620] border border-orange-500/20 rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Orange Glow behind icon */}
            <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 w-[180px] h-[180px] bg-orange-600/10 blur-[40px] rounded-full pointer-events-none" />

            {/* Warning Icon Container */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">CRITICAL SAFETY RISK</h3>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-[2px] mt-1">Silent Notifications Active</p>
            </div>

            {/* Content Details */}
            <div className="mt-5 space-y-3.5 bg-black/35 rounded-2xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  <strong>You will NOT hear any alarm sound</strong> when a nearby woman in distress triggers an emergency SOS alert.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Muted alerts can lead to delayed rescue response times, placing lives in immediate danger.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <p className="text-[11px] text-emerald-400 font-bold leading-relaxed">
                  We highly recommend keeping sound alerts ON to receive real-time siren updates.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={confirmSilentNotification}
                className="w-full h-[48px] bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-orange-900/20"
              >
                I Accept Risk & Mute Alerts
              </button>
              <button
                onClick={cancelSilentNotification}
                className="w-full h-[48px] bg-[#1C2030] hover:bg-[#252A3F] text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                Keep Sound Alerts ON
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
