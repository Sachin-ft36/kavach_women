import React, { useState, useEffect } from 'react';
import { useGuardianState } from './hooks/useGuardianState';
import { useCall } from '../../contexts/CallContext';
import { useKavachStore } from '../../store/useKavachStore';
import { 
  MapPin, Battery, Activity, Phone, ShieldAlert, Volume2, Camera,
  Compass, Signal, Wifi, Terminal, RefreshCw, BellRing, 
  ShieldCheck, AlertTriangle, User, Loader2, Play, Users, 
  VolumeX, Clock, FileText, ChevronRight, Download, Trash2, 
  Shield, Navigation, Layers, Target, Share2, MoreHorizontal, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import JourneyPlaybackOverlay from './JourneyPlaybackOverlay';
import TacticalNavigationOverlay from './TacticalNavigationOverlay';
import QuickPairQr from './QuickPairQr';

const VictimMap = React.lazy(() => import('../maps/VictimMap'));

// Distance Calculator helper
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)} km`;
};

export default function GuardianDashboard() {
  const { initiateCall } = useCall();
  const { setOverlayActive } = useKavachStore();
  const {
    userPos,
    user,
    profile,
    familyMembers,
    loadingFamily,
    activeSOSAlert,
    hudStats,
    resolvedAddresses,
    showSuccessModal,
    setShowSuccessModal,
    lastResolvedMember,
    closureReason,
    systemLogs,
    nearbyProtectors,
    displayMember,
    isSOSActiveState,
    handleRemoteRing,
    handleRemoteSiren,
    handleLocationPing,
    handleCheckIn,
    handleDeactivateAlert,
    handleForceGhostClear,
    handleAssignProtector,
    activeJourney,
    historicalJourneys,
    handleDeleteHistory,
    handleTriggerSMSBridge
  } = useGuardianState();

  const [playbackJourney, setPlaybackJourney] = useState<any | null>(null);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const [showLogsPanel, setShowLogsPanel] = useState<boolean>(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showNavigationOverlay, setShowNavigationOverlay] = useState<boolean>(false);
  const [showScanModal, setShowScanModal] = useState<boolean>(false);

  // Auto-focus on family member in SOS distress if any
  useEffect(() => {
    if (activeSOSAlert?.victimUid) {
      setSelectedMemberId(activeSOSAlert.victimUid);
    }
  }, [activeSOSAlert?.victimUid]);

  useEffect(() => {
    setOverlayActive(showNavigationOverlay);
    return () => {
      setOverlayActive(false);
    };
  }, [showNavigationOverlay, setOverlayActive]);

  if (loadingFamily) {
    return (
      <div className="min-h-screen bg-[#060b13] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="animate-spin text-indigo-500 mb-3" size={36} />
        <p className="text-[10px] text-slate-400 font-normal uppercase tracking-widest">Scanning Secure Grid Channels...</p>
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return (
      <div className="min-h-screen bg-[#060b13] px-6 flex flex-col items-center justify-center text-center space-y-5 font-sans text-white">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center">
          <User className="text-slate-400" size={32} />
        </div>
        <h5 className="font-medium text-slate-200 text-base uppercase tracking-wide">No Linked Family Nodes</h5>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          Ask your family members to register as a <span className="text-indigo-400 font-medium">Citizen</span> and add your phone number <span className="underline font-medium text-white">{profile?.phoneNumber}</span> as their primary guardian.
        </p>
        <button 
          onClick={() => setShowScanModal(true)}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
        >
          <Camera size={14} /> Scan Ward QR Code
        </button>
        <AnimatePresence>
          {showScanModal && (
            <QuickPairQr 
              mode="scan"
              onClose={() => setShowScanModal(false)}
              currentUserProfile={profile}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Determine current display member
  const currentMember = familyMembers.find(m => m.id === selectedMemberId || m.uid === selectedMemberId) || familyMembers[0];
  const memberId = currentMember.id || currentMember.uid;

  const isSOSActive = activeSOSAlert?.victimUid === memberId || activeSOSAlert?.id === memberId;
  const isOffline = currentMember.lastLocation?.timestamp 
    ? (Date.now() - currentMember.lastLocation.timestamp > 300000) 
    : false;

  const victimLat = activeSOSAlert?.latitude || currentMember.lastLocation?.lat || currentMember.lastLocation?.latitude || currentMember.locationData?.lat || currentMember.latitude;
  const victimLng = activeSOSAlert?.longitude || currentMember.lastLocation?.lng || currentMember.lastLocation?.longitude || currentMember.locationData?.lng || currentMember.longitude;

  const guardianLat = userPos?.lat || profile?.lastLocation?.lat || (profile?.lastLocation as any)?.latitude;
  const guardianLng = userPos?.lng || profile?.lastLocation?.lng || (profile?.lastLocation as any)?.longitude;

  // Calculate real distance
  let distanceStr = "Distance unavailable";
  if (victimLat && victimLng && guardianLat && guardianLng) {
    distanceStr = `${calculateDistance(guardianLat, guardianLng, victimLat, victimLng)} away`;
  }

  // Get real relative time ago for active SOS
  const getTimeAgoStr = () => {
    if (!activeSOSAlert?.timestamp) return "Active now";
    const date = activeSOSAlert.timestamp.toDate ? activeSOSAlert.timestamp.toDate() : new Date(activeSOSAlert.timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    return `${diffMins} min ago`;
  };

  const handleCall = () => {
    console.log(`📞 KAVACH GUARDIAN: Initiating direct VoIP Tactical Bridge with ${currentMember.name} (ID: ${memberId}, Alert ID: ${activeSOSAlert?.id || 'none'}). Connecting via backend signaling...`);
    toast.success(`Tactical VoIP Bridge initiated with ${currentMember.name}`);
    initiateCall(memberId, currentMember.name || "Relative", activeSOSAlert?.id || memberId);
  };

  const handleLiveTrack = () => {
    toast.info("Centering tactical camera tracking...");
    window.dispatchEvent(new Event('recenter-map'));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${memberId}`);
    toast.success("Secure tracking bridge link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#060b13] pb-24 font-sans text-white relative">

      {/* Main Grid View */}
      <div className="px-4 mt-4 space-y-4 max-w-xl mx-auto">

        {/* Pairing Hub Header */}
        <div className="flex justify-between items-center bg-[#0b1220] border border-[#1e293b]/50 rounded-[24px] p-4 shadow-xl">
          <div>
            <h4 className="text-[11px] font-black tracking-widest text-indigo-400 uppercase">Guardian Control Hub</h4>
            <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Secure Sentinel Grid Linkage</p>
          </div>
          <button 
            onClick={() => setShowScanModal(true)}
            className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Camera size={12} /> Pair Ward (QR)
          </button>
        </div>

        {/* Helpline quick dials */}
        {isSOSActive && (
          <div className="grid grid-cols-2 gap-3.5">
            <a
              href="tel:112"
              className="py-3 bg-gradient-to-r from-red-950/40 via-red-900/25 to-red-950/40 hover:from-red-950/60 hover:to-red-950/60 border border-red-500/35 text-red-200 rounded-[20px] text-[10.5px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all no-underline shadow-[0_0_20px_rgba(239,68,68,0.12)] hover:shadow-[0_0_25px_rgba(239,68,68,0.22)] active:scale-95 border-solid backdrop-blur-md"
            >
              <Phone size={13} fill="currentColor" className="text-red-400" /> Call 112
            </a>
            <a
              href="tel:1091"
              className="py-3 bg-gradient-to-r from-rose-950/40 via-rose-900/25 to-rose-950/40 hover:from-rose-950/60 hover:to-rose-950/60 border border-rose-500/35 text-rose-200 rounded-[20px] text-[10.5px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all no-underline shadow-[0_0_20px_rgba(244,63,94,0.12)] hover:shadow-[0_0_25px_rgba(244,63,94,0.22)] active:scale-95 border-solid backdrop-blur-md"
            >
              <Phone size={13} fill="currentColor" className="text-rose-400" /> Women Help (1091)
            </a>
          </div>
        )}

        {/* SOS Alert Card (Placed ABOVE the map when SOS is active) */}
        {isSOSActive && (
          <div className="relative rounded-[24px] overflow-hidden p-5 shadow-[0_0_40px_-15px_rgba(239,68,68,0.15)] border border-[#E53E3E]/50 bg-gradient-to-br from-[#030712] via-[#1A080A] to-[#2E0B0E]">
            {/* Top row: Alert details */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                {/* Glowing red alert badge */}
                <div className="relative w-[42px] h-[42px] rounded-full bg-[#E53E3E]/10 border border-[#E53E3E]/30 flex items-center justify-center shadow-[0_0_12px_rgba(229,62,62,0.2)] backdrop-blur-md shrink-0">
                  <div className="absolute inset-0 rounded-full border border-[#E53E3E]/50 animate-ping opacity-20" />
                  {/* Warning Indicator circle */}
                  <span className="w-5 h-5 rounded-full bg-[#E53E3E] flex items-center justify-center text-white text-[11px] font-medium">
                    ▲
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-medium tracking-wider text-[#E53E3E] leading-none uppercase">SOS ALERT</h3>
                  <p className="text-[13px] font-medium text-white mt-2.5 leading-none">
                    {currentMember.name} triggered SOS
                  </p>
                </div>
              </div>

              {/* LIVE status & Time */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[9px] font-medium bg-[#E53E3E] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                </span>
                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  {getTimeAgoStr()}
                </p>
              </div>
            </div>

            {/* Action buttons (CONFIRM SAFE & NAVIGATE) */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => activeSOSAlert && handleDeactivateAlert(activeSOSAlert.id)}
                className="py-2.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-xl text-[10.5px] font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-md"
              >
                <ShieldCheck size={13} fill="currentColor" /> CONFIRM SAFE
              </button>
              <button
                onClick={() => {
                  if (victimLat && victimLng) {
                    setShowNavigationOverlay(true);
                  } else {
                    toast.error("Telemetry location unavailable.");
                  }
                }}
                className="py-2.5 bg-[#1E293B]/70 hover:bg-[#1E293B] text-slate-200 rounded-xl text-[10.5px] font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
              >
                <Navigation size={12} fill="currentColor" /> NAVIGATE
              </button>
            </div>
          </div>
        )}

        {/* All Clear Card (Placed ABOVE the map when Safe) */}
        {!isSOSActive && (
          <div 
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="relative h-[118px] rounded-[20px] overflow-hidden flex items-center p-4 group shadow-[0_0_40px_-15px_rgba(6,182,212,0.15)] border border-[#00E676]/20 hover:border-[#00E676]/45 bg-gradient-to-br from-[#030712] via-[#05101E] to-[#071A2F] cursor-pointer transition-all duration-300 select-none"
          >
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
                  <div className="absolute inset-0 rounded-full border border-[#00E676]/50 animate-ping opacity-15" />
                  <ShieldCheck size={18} className="text-[#00E676] drop-shadow-[0_0_6px_rgba(0,230,118,0.7)]" strokeWidth={2.2} />
                </div>

                {/* Text Group */}
                <div className="flex flex-col">
                  <h3 className="text-base font-medium text-white leading-tight">
                    All Clear — {currentMember?.name || 'Relative'} is Safe
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">System tracking normal</p>
                </div>
              </div>
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
                <div className="absolute right-[40px] top-[50px] w-[5px] h-[5px] rounded-full bg-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.8)] animate-pulse" />
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
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-7 h-7 bg-[#00E676]/30 blur-[8px] rounded-full pointer-events-none animate-pulse" />
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
                      <p className="text-[4.5px] font-medium text-white tracking-[0.1em] uppercase mt-2">System Normal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tactical Map Container */}
        <div className="relative bg-[#0d1424] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl p-1">
          <div className="w-full h-80 rounded-[28px] overflow-hidden relative">
            <React.Suspense fallback={
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#090f1b]">
                <Loader2 className="animate-spin text-indigo-500 mb-2" size={28} />
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">Initializing Satellite Grid...</span>
              </div>
            }>
              <VictimMap
                activeAlerts={activeSOSAlert ? [activeSOSAlert] : []}
                customPos={(victimLat && victimLng) ? [victimLat, victimLng] : undefined}
                isProtectorHUD={true}
              />
            </React.Suspense>

            {/* Map Legend Overlay (Top Left) */}
            <div className="absolute top-4 left-4 z-[999] bg-[#060b13]/85 backdrop-blur-md border border-white/10 rounded-2xl p-3 space-y-2 text-[10px] font-medium text-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-400/20" />
                <span>You (Guardian)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                <span>Protector</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53E3E] ring-2 ring-[#E53E3E]/20 animate-pulse" />
                <span>SOS Alert</span>
              </div>
            </div>

            {/* Map Radius Label Overlay (Bottom Center) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-[#060b13]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
              <span className="text-[9px] font-medium uppercase tracking-wider text-sky-400">1 km Radius</span>
            </div>

            {/* Floating Action Buttons Overlay (Right Side) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[999] flex flex-col gap-2">
              <button 
                onClick={handleLiveTrack}
                className="w-10 h-10 rounded-full bg-[#060b13]/85 backdrop-blur-md border border-white/10 hover:border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <Target size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-[#060b13]/85 backdrop-blur-md border border-white/10 hover:border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                <Layers size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-[#060b13]/85 backdrop-blur-md border border-white/10 hover:border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                <Navigation size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Member Details & Actions */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-3xl p-4 shadow-2xl space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-white/15 flex items-center justify-center shrink-0 overflow-hidden relative">
                {currentMember.photoUrl || currentMember.photoURL ? (
                  <img src={currentMember.photoUrl || currentMember.photoURL} alt={currentMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-medium text-white uppercase tracking-tight leading-none">{currentMember.name}</h2>
                  {isSOSActive && (
                    <span className="text-[7.5px] font-medium bg-[#E53E3E] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                      SOS
                    </span>
                  )}
                </div>
                <p className="text-[9.5px] text-slate-400 font-medium mt-1.5">
                  {isSOSActive ? getTimeAgoStr() : (isOffline ? "Device Offline" : "Online")} &bull; {distanceStr}
                </p>
              </div>
            </div>

            {/* NAVIGATE button to open directions (Privacy Locked unless SOS or Safe Ride is active) */}
            <button
              onClick={() => {
                const isTrackingAllowed = isSOSActive || activeJourney !== null;
                if (!isTrackingAllowed) {
                  toast.error("Privacy Lock: Tracking & navigation is disabled unless a live SOS or Safe Ride is active.", {
                    description: "KAVACH strictly protects citizens' privacy during normal hours."
                  });
                  return;
                }

                if (victimLat && victimLng) {
                  setShowNavigationOverlay(true);
                } else {
                  toast.error("Telemetry location unavailable.");
                }
              }}
              className={cn(
                "py-2 px-3.5 rounded-xl text-[10.5px] font-medium uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-transform border-none",
                (isSOSActive || activeJourney !== null)
                  ? "bg-[#E53E3E] hover:bg-[#c53030] text-white cursor-pointer active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <Navigation size={12} fill="currentColor" /> NAVIGATE
            </button>
          </div>

          {/* Telemetry quick values */}
          <div className="grid grid-cols-3 gap-2 bg-[#060b13]/40 p-2 rounded-xl border border-white/5 text-center">
            <div>
              <span className="text-[7.5px] text-slate-500 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
                <Battery size={10} className="text-emerald-400" /> Battery
              </span>
              <p className="text-[11px] font-medium text-white mt-0.5">{currentMember.telemetry?.battery || "N/A"}</p>
            </div>
            <div className="border-l border-white/5">
              <span className="text-[7.5px] text-slate-500 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
                <Signal size={10} className="text-blue-400" /> Signal
              </span>
              <p className="text-[11px] font-medium text-white mt-0.5">{isOffline ? "None" : "Good"}</p>
            </div>
            <div className="border-l border-white/5">
              <span className="text-[7.5px] text-slate-500 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
                <Activity size={10} className="text-purple-400" /> State
              </span>
              <p className="text-[11px] font-medium text-white mt-0.5">{isSOSActive ? "Distress" : (isOffline ? "Offline" : "Safe")}</p>
            </div>
          </div>

          {/* Address Box */}
          <div className="bg-[#060b13]/60 p-3 rounded-xl border border-white/5 text-[10px] text-slate-350 leading-relaxed font-normal">
            {resolvedAddresses[memberId]?.address || currentMember.fullAddress || currentMember.locationData?.formattedAddress || "Awaiting GPS telemetry data..."}
          </div>

          {/* Action Row */}
          <button 
            onClick={handleCall}
            className="w-full py-2.5 bg-[#062615] hover:bg-[#093d22] border border-[#22C55E]/20 text-[#22C55E] rounded-xl text-[10px] font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Phone size={11} fill="currentColor" /> CALL
          </button>
        </div>

        {/* Remote Command Overrides Tray (Always open during active SOS, toggleable via All Clear card when safe) */}
        <AnimatePresence>
          {(isSOSActive || showMoreActions) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-5 space-y-4 shadow-xl">
                <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={12} className="text-indigo-400" /> Remote Device Controls
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRemoteRing(memberId)}
                    className="py-3 bg-[#172554] hover:bg-[#1e3a8a] border border-[#3b82f6]/20 text-slate-200 rounded-xl text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BellRing size={12} /> Ring Phone
                  </button>
                  <button
                    onClick={() => handleRemoteSiren(memberId)}
                    className="py-3 bg-[#991b1b]/10 hover:bg-[#991b1b]/20 border border-[#ef4444]/20 text-red-400 rounded-xl text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 size={12} /> Trigger Siren
                  </button>
                  <button
                    onClick={() => handleLocationPing(memberId)}
                    className="py-3 bg-[#1e293b]/70 hover:bg-[#1e293b] border border-white/5 text-slate-200 rounded-xl text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} /> Ping GPS
                  </button>
                  <button
                    onClick={() => handleCheckIn(memberId)}
                    className="py-3 bg-[#1e293b]/70 hover:bg-[#1e293b] border border-white/5 text-slate-200 rounded-xl text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert size={12} /> Check-in Prompt
                  </button>
                </div>

                {isSOSActive && activeSOSAlert && (
                  <button
                    onClick={() => handleDeactivateAlert(activeSOSAlert.id)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
                  >
                    RESOLVE ALERT (MARK SAFE)
                  </button>
                )}
                {!isSOSActive && (
                  <button
                    onClick={() => handleTriggerSMSBridge(currentMember, victimLat || 26.9124, victimLng || 75.7873)}
                    className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-[9px] font-medium uppercase tracking-widest rounded-xl cursor-pointer"
                  >
                    Bridge Offline SMS SOS
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nearby Protectors List */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-medium text-[#E2E8F0] tracking-wider uppercase">Nearby Protectors</h3>
            <span className="text-[9px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
              {nearbyProtectors.length} Available
            </span>
          </div>

          <div className="space-y-3">
            {nearbyProtectors.length === 0 ? (
              <div className="py-6 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="text-slate-650" size={24} />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-normal">No nearby protectors detected</p>
              </div>
            ) : (
              nearbyProtectors.map((protector) => {
                const isAssigned = activeSOSAlert?.responders?.[protector.id];
                return (
                  <div key={protector.id} className="flex justify-between items-center p-3 rounded-2xl bg-[#060b13]/60 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {protector.photoUrl || protector.photoURL ? (
                          <img src={protector.photoUrl || protector.photoURL} alt={protector.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-slate-400" />
                        )}
                        <span className={cn(
                          "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#060b13]",
                          protector.isOnDuty ? "bg-emerald-500" : "bg-slate-500"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="text-[12px] font-medium text-white leading-none">{protector.name || "Responder"}</h4>
                          {protector.isVerified !== false && (
                            <CheckCircle2 size={12} className="text-sky-400" fill="white" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1.5">
                          {protector.distanceStr} &bull; {protector.isOnDuty ? "On Duty" : "Off Duty"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toast.info(`Credentials: ${protector.name || 'Protector'}, rating: ${protector.rating || '5.0'}.`)}
                        className="py-2 px-3 bg-transparent hover:bg-white/5 text-[#3b82f6] border border-[#3b82f6]/25 rounded-lg text-[9px] font-medium uppercase cursor-pointer"
                      >
                        VIEW
                      </button>
                      <button 
                        disabled={!!isAssigned}
                        onClick={() => handleAssignProtector(protector)}
                        className={cn(
                          "py-2 px-3 rounded-lg text-[9px] font-medium uppercase transition-all cursor-pointer",
                          isAssigned
                            ? "bg-slate-800 text-slate-500 border border-transparent cursor-not-allowed"
                            : "bg-transparent hover:bg-emerald-500/10 text-[#22c55e] border border-[#22c55e]/25"
                        )}
                      >
                        {isAssigned ? "ASSIGNED" : "ASSIGN"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Collapsible Completed Rides Tray */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-5 shadow-2xl">
          <button 
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="w-full flex justify-between items-center text-left text-xs font-medium text-slate-350 tracking-wider uppercase border-none bg-transparent cursor-pointer text-white"
          >
            <span>Ride History (Last 24h)</span>
            {showHistoryPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showHistoryPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                {historicalJourneys.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <Clock size={24} />
                    <p className="text-[10px] font-medium uppercase tracking-wider">No completed rides in past 24 hours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historicalJourneys.map((history) => (
                      <div key={history.id} className="bg-[#060b13]/60 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-medium text-white">{history.destination || "Destination"}</p>
                          <span className="text-[9px] text-slate-500 block mt-1">Vehicle: {history.vehicleNo || "PCR-UNASSIGNED"}</span>
                        </div>
                        <button
                          onClick={() => setPlaybackJourney(history)}
                          className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-medium uppercase cursor-pointer"
                        >
                          Replay
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsible Sentinel Logs Tray */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-5 shadow-2xl">
          <button 
            onClick={() => setShowLogsPanel(!showLogsPanel)}
            className="w-full flex justify-between items-center text-left text-xs font-medium text-slate-350 tracking-wider uppercase border-none bg-transparent cursor-pointer text-white"
          >
            <span>Sentinel Uplink Logs</span>
            {showLogsPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showLogsPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="bg-[#060b13]/85 rounded-2xl p-3.5 font-mono text-[9px] text-sky-400 space-y-2 max-h-36 overflow-y-auto border border-white/5 select-all">
                  {systemLogs.map((log, idx) => (
                     <div key={idx} className="flex gap-2 items-start leading-relaxed font-normal">
                      <span className="text-indigo-500">❯</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200000] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#090F1B] border border-emerald-500/30 rounded-[32px] p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)]"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-[24px] border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto mb-6">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-white text-xl font-medium tracking-widest uppercase mb-3">STAND DOWN CONFIRMED</h3>
              <p className="text-slate-450 text-xs font-medium uppercase tracking-wider mb-6 leading-relaxed">
                Safety protocol successfully finalized for <span className="text-emerald-400 font-medium">{lastResolvedMember}</span>. Node stand-down active.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium uppercase tracking-[2px] shadow-lg active:scale-95 transition-all border-none font-sans"
              >
                CLOSE TERMINAL
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playback Map Overlay */}
      {playbackJourney && (
        <JourneyPlaybackOverlay
          journey={playbackJourney}
          onClose={() => setPlaybackJourney(null)}
        />
      )}

      {/* Futuristic Tactical Navigation Overlay */}
      {showNavigationOverlay && victimLat && victimLng && (
        <TacticalNavigationOverlay
          victimName={currentMember.name || "Relative"}
          victimLat={victimLat}
          victimLng={victimLng}
          guardianLat={guardianLat}
          guardianLng={guardianLng}
          nearbyProtectors={nearbyProtectors}
          activeSOSAlert={activeSOSAlert}
          onClose={() => setShowNavigationOverlay(false)}
        />
      )}

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanModal && (
          <QuickPairQr 
            mode="scan"
            onClose={() => setShowScanModal(false)}
            currentUserProfile={profile}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
