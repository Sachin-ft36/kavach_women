import React, { useState, useEffect } from 'react';
import { useGuardianState } from './hooks/useGuardianState';
import { useCall } from '../../contexts/CallContext';
import { useKavachStore } from '../../state/useKavachStore';
import {
  MapPin, Battery, Activity, Phone, ShieldAlert, Volume2, Camera,
  Compass, Signal, Wifi, Terminal, RefreshCw, BellRing, Bell,
  ShieldCheck, AlertTriangle, User, Loader2, Play, Users,
  VolumeX, Clock, FileText, ChevronRight, Download, Trash2,
  Shield, Navigation, Layers, Target, Share2, MoreHorizontal, CheckCircle2, ChevronDown, ChevronUp,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import JourneyPlaybackOverlay from './JourneyPlaybackOverlay';
import TacticalNavigationOverlay from './TacticalNavigationOverlay';
import QuickPairQr from './QuickPairQr';
import GuardianRequestsPage from './GuardianRequestsPage';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

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
  const [showLogsPanel, setShowLogsPanel] = useState<boolean>(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showNavigationOverlay, setShowNavigationOverlay] = useState<boolean>(false);
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState<boolean>(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Listen to incoming pending requests for badge count
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const q = query(
      collection(db, 'pairing_requests'),
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingRequestsCount(snapshot.size);
    }, (err) => {
      console.warn("Guardian requests count fetch failed:", err);
    });
    return () => unsub();
  }, [auth.currentUser?.uid]);

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

  const handleDownloadHistory = (journey: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(journey, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `journey_${journey.id || 'telemetry'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Telemetry log downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-[#060b13] pb-28 font-sans text-white relative">
      {/* Main Grid View */}
      <div className="px-4 mt-4 space-y-4 max-w-xl mx-auto">
        {/* Pairing Hub Header */}
        <div className="flex justify-between items-center bg-[#0b1220] border border-[#1e293b]/50 rounded-[24px] p-4 shadow-xl">
          <div>
            <h4 className="text-[11px] font-black tracking-widest text-indigo-400 uppercase font-display">Guardian Control Hub</h4>
            <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Secure Sentinel Grid Linkage</p>
          </div>
          <div className="flex items-center gap-2">
            {familyMembers.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-[9px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-95 transition-all text-slate-200"
                >
                  Switch Node <ChevronDown size={10} />
                </button>
                <AnimatePresence>
                  {showMemberDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-1.5 w-48 bg-[#0d1424] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                    >
                      {familyMembers.map((member) => (
                        <button
                          key={member.id || member.uid}
                          onClick={() => {
                            setSelectedMemberId(member.id || member.uid);
                            setShowMemberDropdown(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider transition-colors hover:bg-white/5 flex items-center justify-between",
                            (member.id || member.uid) === memberId ? "text-indigo-400 bg-indigo-500/5" : "text-slate-300"
                          )}
                        >
                          <span>{member.name}</span>
                          {(member.id || member.uid) === activeSOSAlert?.victimUid && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 " />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              onClick={() => setIsRequestsOpen(true)}
              className="relative px-4 py-2 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/20 text-[#A78BFA] text-[9px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Bell size={12} /> Requests Inbox
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-md">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowScanModal(true)}
              className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Camera size={12} /> Pair Ward (QR)
            </button>
          </div>
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

        {/* 1. SAFE RIDE ACTIVE CARD (Shown conditionally when a safe ride journey is live) */}
        {activeJourney && (
          <div className="relative rounded-[24px] overflow-hidden p-5 shadow-[0_0_40px_-15px_rgba(59,130,246,0.25)] border border-blue-500/30 bg-gradient-to-br from-[#030712] via-[#0b172a] to-[#0f2d54] ">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="relative w-[42px] h-[42px] rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)] backdrop-blur-md shrink-0">
                  <div className="absolute inset-0 rounded-full border border-blue-500/40 hidden opacity-25" />
                  <Car size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wider text-blue-400 leading-none uppercase font-display">SAFE RIDE ACTIVE</h3>
                  <p className="text-[12px] font-medium text-slate-200 mt-2 leading-none">
                    Destination: {activeJourney.destination || "In Transit"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white " /> Tracking
                </span>
                <p className="text-[10px] font-medium text-slate-400 mt-2">
                  Vehicle: {activeJourney.vehicleNo || "N/A"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleLiveTrack}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
              >
                <Target size={13} /> Track Live Movement
              </button>
            </div>
          </div>
        )}

        {/* 2. CITIZEN SAFETY STATUS CARD */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-3xl p-4 shadow-2xl space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-full bg-slate-850 border-2 border-white/15 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                {currentMember.photoUrl || currentMember.photoURL ? (
                  <img src={currentMember.photoUrl || currentMember.photoURL} alt={currentMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-semibold text-white uppercase tracking-tight leading-none font-display">{currentMember.name}</h2>
                  {isSOSActive && (
                    <span className="text-[7.5px] font-medium bg-[#E53E3E] text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-display">
                      SOS
                    </span>
                  )}
                </div>
                <p className="text-[9.5px] text-slate-400 font-medium mt-1.5">
                  Phone: {currentMember.phoneNumber || "Not Configured"} &bull; {distanceStr}
                </p>
              </div>
            </div>

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
                "py-2 px-3.5 rounded-xl text-[10.5px] font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-transform border-none font-sans",
                (isSOSActive || activeJourney !== null)
                  ? "bg-[#E53E3E] hover:bg-[#c53030] text-white cursor-pointer active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <Navigation size={12} fill="currentColor" /> NAVIGATE
            </button>
          </div>

          {/* battery/signal/status grid */}
          <div className="grid grid-cols-3 gap-2 bg-[#060b13]/40 p-2 rounded-xl border border-white/5 text-center">
            <div>
              <span className="text-[7.5px] text-slate-500 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
                <Battery size={10} className="text-emerald-400" /> Battery
              </span>
              <p className="text-[11px] font-bold text-white mt-0.5 font-display">{currentMember.telemetry?.battery || currentMember.battery || "N/A"}</p>
            </div>
            <div className="border-l border-white/5">
              <span className="text-[7.5px] text-slate-500 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
                <Signal size={10} className="text-blue-400" /> Signal
              </span>
              <p className="text-[11px] font-bold text-white mt-0.5 font-display">{isOffline ? "None" : (currentMember.telemetry?.networkStrength || "Strong")}</p>
            </div>
            <div className="border-l border-white/5">
              <span className="text-[7.5px] text-slate-500 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
                <Activity size={10} className="text-purple-400" /> State
              </span>
              <p className="text-[11px] font-bold text-white mt-0.5 font-display">{isSOSActive ? "Distress" : (isOffline ? "Offline" : "Safe")}</p>
            </div>
          </div>

          {/* Address Geolocator */}
          <div className="bg-[#060b13]/60 p-3 rounded-xl border border-white/5 text-[10px] text-slate-350 leading-relaxed font-normal flex items-start gap-2">
            <MapPin size={12} className="text-indigo-400 shrink-0 mt-0.5" />
            <span>
              {resolvedAddresses[memberId]?.address || currentMember.fullAddress || currentMember.locationData?.formattedAddress || "Awaiting GPS telemetry data..."}
            </span>
          </div>

          {/* Action Row */}
          <button
            onClick={handleCall}
            className="w-full py-2.5 bg-[#062615] hover:bg-[#093d22] border border-[#22C55E]/20 text-[#22C55E] rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans"
          >
            <Phone size={11} fill="currentColor" /> CALL CALLSIGN LINK
          </button>
        </div>

        {/* 3. SOS ALERT CARD (Distress state) / ALL CLEAR / BRIDGE CARD (Safe state) */}
        {isSOSActive ? (
          <div className="relative rounded-[24px] overflow-hidden p-5 shadow-[0_0_40px_-15px_rgba(239,68,68,0.25)] border border-[#E53E3E]/60 bg-gradient-to-br from-[#030712] via-[#1A080A] to-[#2E0B0E]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                <div className="relative w-[42px] h-[42px] rounded-full bg-[#E53E3E]/10 border border-[#E53E3E]/30 flex items-center justify-center shadow-[0_0_12px_rgba(229,62,62,0.2)] backdrop-blur-md shrink-0">
                  <div className="absolute inset-0 rounded-full border border-[#E53E3E]/50 hidden opacity-20" />
                  <span className="w-5 h-5 rounded-full bg-[#E53E3E] flex items-center justify-center text-white text-[11px] font-medium">
                    ▲
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-wider text-[#E53E3E] leading-none uppercase font-display">SOS ACTIVE</h3>
                  <p className="text-[13px] font-semibold text-white mt-2.5 leading-none font-display">
                    {currentMember.name} in Active Distress
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#E53E3E] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white " /> LIVE
                </span>
                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  {getTimeAgoStr()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => activeSOSAlert && handleDeactivateAlert(activeSOSAlert.id)}
                className="py-2.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-xl text-[10.5px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-md"
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
                className="py-2.5 bg-[#1E293B]/70 hover:bg-[#1E293B] text-slate-200 rounded-xl text-[10.5px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
              >
                <Navigation size={12} fill="currentColor" /> NAVIGATE
              </button>
            </div>
          </div>
        ) : (
          /* All Clear / Bridge Card */
          <div className="relative rounded-[24px] overflow-hidden p-5 shadow-[0_0_40px_-15px_rgba(6,182,212,0.15)] border border-[#00E676]/20 bg-gradient-to-br from-[#030712] via-[#05101E] to-[#071A2F]">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex gap-4 items-center">
                <div className="relative w-[36px] h-[36px] rounded-full bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,230,118,0.2)] backdrop-blur-md">
                  <div className="absolute inset-0 rounded-full border border-[#00E676]/50 hidden opacity-15" />
                  <ShieldCheck size={18} className="text-[#00E676]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white leading-tight font-display">
                    All Clear — {currentMember.name} is Safe
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Telemetry tracking stable</p>
                </div>
              </div>

              {/* Conic Radar sweep & smartphone visual */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_70%,rgba(0,230,118,0.15)_100%)] animate-[spin_4s_linear_infinite] border border-cyan-500/10" />
                <Shield size={18} className="text-[#00E676] " />
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-white/5 flex gap-2">
              <button
                onClick={() => handleTriggerSMSBridge(currentMember, victimLat || 26.9124, victimLng || 75.7873)}
                className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              >
                Bridge Offline SMS SOS
              </button>
            </div>
          </div>
        )}

        {/* 4. TACTICAL INCIDENT MAP */}
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

            {/* Map Legend Overlay */}
            <div className="absolute top-4 left-4 z-[999] bg-[#060b13]/85 backdrop-blur-md border border-white/10 rounded-2xl p-3 space-y-2 text-[9px] font-semibold text-slate-200 tracking-wider uppercase">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-400/20" />
                <span>You (Guardian)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                <span>Protector</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53E3E] ring-2 ring-[#E53E3E]/20 " />
                <span>Distress Node</span>
              </div>
            </div>

            {/* Radius overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-[#060b13]/80 backdrop-blur-md border border-white/10 px-3.5 py-1 rounded-full">
              <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">1 km Radar Radius</span>
            </div>

            {/* Floating controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[999] flex flex-col gap-2">
              <button
                onClick={handleLiveTrack}
                className="w-10 h-10 rounded-full bg-[#060b13]/85 backdrop-blur-md border border-white/10 hover:border-white/20 flex items-center justify-center text-slate-350 hover:text-white transition-colors"
              >
                <Target size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 5. TACTICAL DEVICE OVERRIDES (Always open) */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-5 space-y-4 shadow-xl">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <Terminal size={12} className="text-indigo-400" /> Tactical Device Overrides
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRemoteRing(memberId)}
              className="py-3 bg-[#172554] hover:bg-[#1e3a8a] border border-[#3b82f6]/20 text-slate-200 rounded-xl text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97]"
            >
              <BellRing size={12} /> Ring Phone
            </button>
            <button
              onClick={() => handleRemoteSiren(memberId)}
              className="py-3 bg-[#991b1b]/10 hover:bg-[#991b1b]/20 border border-[#ef4444]/20 text-red-400 rounded-xl text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97]"
            >
              <Volume2 size={12} /> Trigger Siren
            </button>
            <button
              onClick={() => handleLocationPing(memberId)}
              className="py-3 bg-[#1e293b]/70 hover:bg-[#1e293b] border border-white/5 text-slate-200 rounded-xl text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97]"
            >
              <RefreshCw size={12} /> Ping GPS
            </button>
            <button
              onClick={() => handleCheckIn(memberId)}
              className="py-3 bg-[#1e293b]/70 hover:bg-[#1e293b] border border-white/5 text-slate-200 rounded-xl text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97]"
            >
              <ShieldAlert size={12} /> Check-in Prompt
            </button>
          </div>
          {isSOSActive && (
            <button
              onClick={() => handleDeactivateAlert(activeSOSAlert.id)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border-none cursor-pointer"
            >
              Mark Citizen Safe (Resolve SOS)
            </button>
          )}
        </div>

        {/* 6. NEARBY PROTECTORS */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-[#E2E8F0] tracking-wider uppercase font-display">Nearby Protectors</h3>
            <span className="text-[9px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-display">
              {nearbyProtectors.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {nearbyProtectors.length === 0 ? (
              <div className="py-6 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="text-slate-600" size={24} />
                <p className="text-[10px] text-slate-550 uppercase tracking-widest font-normal">No nearby protectors available</p>
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
                          <h4 className="text-[12px] font-bold text-white leading-none font-display">{protector.name || "Responder"}</h4>
                          {protector.isVerified !== false && (
                            <CheckCircle2 size={12} className="text-sky-400" fill="white" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-450 font-bold block mt-1.5">
                          {protector.distanceStr} &bull; {protector.isOnDuty ? "On Duty" : "Off Duty"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toast.info(`Credentials: ${protector.name || 'Protector'}, rating: ${protector.rating || '5.0'}. Verified Saathi.`)}
                        className="py-2 px-3 bg-transparent hover:bg-white/5 text-[#3b82f6] border border-[#3b82f6]/25 rounded-lg text-[9px] font-semibold uppercase cursor-pointer"
                      >
                        VIEW
                      </button>
                      <button
                        disabled={!isSOSActive || !!isAssigned}
                        onClick={() => handleAssignProtector(protector)}
                        className={cn(
                          "py-2 px-3 rounded-lg text-[9px] font-semibold uppercase transition-all cursor-pointer",
                          (!isSOSActive || isAssigned)
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

        {/* 7. RIDE HISTORY (Last 24h) */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-5 shadow-2xl">
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="w-full flex justify-between items-center text-left text-xs font-semibold text-slate-300 tracking-wider uppercase border-none bg-transparent cursor-pointer text-white font-display"
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
                    <p className="text-[10px] font-bold uppercase tracking-wider">No completed rides in past 24 hours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historicalJourneys.map((history) => (
                      <div key={history.id} className="bg-[#060b13]/60 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-bold text-white font-display">{history.destination || "Destination"}</p>
                          <span className="text-[9px] text-slate-500 block mt-1">Vehicle: {history.vehicleNo || "PCR-UNASSIGNED"}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPlaybackJourney(history)}
                            className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-bold uppercase cursor-pointer"
                          >
                            Replay
                          </button>
                          <button
                            onClick={() => handleDownloadHistory(history)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/5 cursor-pointer"
                            title="Download Telemetry"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(history.id)}
                            className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 rounded-lg cursor-pointer"
                            title="Delete Telemetry"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 8. SENTINEL UPLINK LOGS */}
        <div className="bg-[#0b1220] border border-[#1e293b]/50 rounded-[32px] p-5 shadow-2xl">
          <button
            onClick={() => setShowLogsPanel(!showLogsPanel)}
            className="w-full flex justify-between items-center text-left text-xs font-semibold text-slate-350 tracking-wider uppercase border-none bg-transparent cursor-pointer text-white font-display"
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
              <h3 className="text-white text-xl font-medium tracking-widest uppercase mb-3 font-display">STAND DOWN CONFIRMED</h3>
              <p className="text-slate-450 text-xs font-medium uppercase tracking-wider mb-6 leading-relaxed">
                Safety protocol successfully finalized for <span className="text-emerald-400 font-medium">{lastResolvedMember}</span>. Node stand-down active.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all border-none font-sans"
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

      {/* Guardian Requests Overlay */}
      {isRequestsOpen && (
        <GuardianRequestsPage 
          isOpen={isRequestsOpen} 
          onClose={() => setIsRequestsOpen(false)} 
        />
      )}
    </div>
  );
}
