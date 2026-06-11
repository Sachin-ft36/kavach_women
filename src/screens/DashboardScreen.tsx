import React from 'react';
import RideSafeOverlay from '../components/RideSafeOverlay';
import SOSButton from '../components/SOSButton';

import { Shield, Activity, ShieldCheck, Lock, PhoneCall, Mic, MicOff, FileText, ChevronRight, Radio, MapPin, MessageSquare, EyeOff, User, Clock, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useCall } from '../contexts/CallContext';
import VoiceVisualizer from '../components/VoiceVisualizer';
import KavachAIChat from '../components/KavachAIChat';
import ShadowProtectMode from '../components/ShadowProtectMode';
import FakeCallModal from '../components/FakeCallModal';
import ZeroFIRModal from '../components/ZeroFIRModal';
import SafeTimerModal from '../components/SafeTimerModal';
import NearbyHubModal from '../components/NearbyHubModal';
import MedicalHubModal from '../components/MedicalHubModal';
import WarningOverlay from '../components/WarningOverlay';
import BannedOverlay from '../components/BannedOverlay';
import SafeHavenMap from '../components/maps/SafeHavenMap';


import { db, auth } from '../firebase';
import { setDoc, doc, getDoc, deleteDoc, serverTimestamp, arrayUnion, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import ProtectorRatingModal from '../components/ProtectorRatingModal';

import { useVoiceTrigger } from '../hooks/useVoiceTrigger';
import { useRideProtocol } from '../hooks/useRideProtocol';
import { useProtectorSentinel } from '../hooks/useProtectorSentinel';

import { useSafetyIntelligence } from '../hooks/useSafetyIntelligence';

const SafetyRadarCard = React.memo(() => {
  const metrics = useSafetyIntelligence();
  const [showInfo, setShowInfo] = React.useState(false);

  const getColors = () => {
    switch (metrics.level) {
      case 'OPTIMAL': return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'CAUTION': return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'CRITICAL': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
      default: return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setShowInfo(!showInfo)}
      className={cn("px-4 py-2.5 rounded-[20px] border shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer active:scale-95", colors.bg, colors.border)}
    >
      <div className="flex justify-between items-center relative z-10 gap-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse shrink-0", metrics.level === 'OPTIMAL' ? 'bg-emerald-500' : metrics.level === 'CAUTION' ? 'bg-amber-500' : 'bg-red-500')} />
          <span className="text-[9px] font-black text-gray-900 tracking-widest uppercase italic">Radar Active</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="h-6 w-[1px] bg-black/5" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-gray-900 tabular-nums leading-none">{metrics.score}</span>
            <span className="text-[6px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Safety</span>
          </div>
          <div className="flex -space-x-1">
            {[...Array(Math.min(2, metrics.protectorCount || 1))].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-white bg-blue-100 flex items-center justify-center text-[6px] font-black text-blue-600">
                P
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 pt-2 border-t border-black/5"
          >
            <div className="flex justify-between text-[6px] font-black uppercase tracking-widest text-gray-400">
              <span>80+: Optimal</span>
              <span>60+: Stable</span>
              <span>40+: Caution</span>
              <span>-40: Critical</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function DashboardScreen() {
  const {
    batteryLevel, gender, userPos, syncLocation,
    setFakeCallActive, isBatteryExempt, setBatteryExempt,
    isSOSActive, isRideModeActive, rideData, updateRideData,
    setBriefingActive, verifiedProtectorCount, setOverlayActive,
    setActiveTab, setIsFirFlowActive, isVoiceTriggerActive, setVoiceTriggerActive,
    pendingNavigationTarget, setPendingNavigationTarget
  } = useKavachStore();
  const { language } = useLanguage();

  // 🛡️ Global hooks are now handled in App.tsx to prevent duplicate background execution
  // useVoiceTrigger();
  // useRideProtocol();
  // useProtectorSentinel();

  const [isVaultOpen, setIsVaultOpen] = React.useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [isShadowOpen, setIsShadowOpen] = React.useState(false);
  const [isFakeCallHubOpen, setIsFakeCallHubOpen] = React.useState(false);
  const [isSafeTimerOpen, setIsSafeTimerOpen] = React.useState(false);
  const [isNearbyHubOpen, setIsNearbyHubOpen] = React.useState(false);
  const [isMedicalHubOpen, setIsMedicalHubOpen] = React.useState(false);
  const [isRideSafeOpen, setIsRideSafeOpen] = React.useState(isRideModeActive);
  const [isRideActive, setIsRideActive] = React.useState(isRideModeActive);
  const [isSafeHavenMapOpen, setIsSafeHavenMapOpen] = React.useState(false);
  const [vehicleNo, setVehicleNo] = React.useState(rideData?.vehicleNo || '');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isBriefingPlaying, setIsBriefingPlaying] = React.useState(false);

  // Rating Modal State
  const [ratingAlert, setRatingAlert] = React.useState<{ id: string, responders: string[] } | null>(null);

  React.useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', currentUser.uid),
      where('status', '==', 'resolved'),
      where('isRated', '!=', true),
      orderBy('isRated'), // required for != query
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const alertData = snapshot.docs[0].data();
        const alertId = snapshot.docs[0].id;
        
        // Ensure there are responders to rate
        const responders = alertData.responders || alertData.acceptedBy || [];
        
        if (responders.length > 0) {
          setRatingAlert({ id: alertId, responders });
        }
      } else {
        setRatingAlert(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🛡️ TACTICAL OVERLAY HANDSHAKE
  const toggleOverlay = (setter: (val: boolean) => void, val: boolean) => {
    setter(val);
    setOverlayActive(val);
  };

  const handleVoiceBriefing = async (isManual = false) => {
    const isCompleted = localStorage.getItem('kavach_briefing_completed') === 'true';

    // 🛡️ STOP LOGIC: Allow any user to manually halt the voice briefing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsBriefingPlaying(false);
      setBriefingActive(false);

      // 🔄 RESUME NATIVE MIC: Briefing interrupted manually
      KavachSafe.startVoiceSentinel().catch(() => { });
      return;
    }

    // 🛡️ PREVENT RE-TRIGGER: If already playing or already greeted in this session, do nothing
    const isAlreadyGreeted = sessionStorage.getItem('kavach_greeted') === 'true';
    if (isBriefingPlaying || (!isManual && isAlreadyGreeted)) return;

    const audioPath = language === 'hi' ? '/voice/hindispeech.mp3' : '/voice/englishspeech.mp3';
    const audio = new Audio(audioPath);
    audioRef.current = audio;

    setBriefingActive(true);
    setIsBriefingPlaying(true);

    audio.onended = () => {
      setBriefingActive(false);
      setIsBriefingPlaying(false);
      localStorage.setItem('kavach_briefing_completed', 'true');

      // 🔄 RESUME NATIVE MIC: Briefing naturally completed
      KavachSafe.startVoiceSentinel().catch(() => { });
    };

    // 🛑 PAUSE NATIVE MIC: Prevent feedback loop while system speaks
    await KavachSafe.stopVoiceSentinel().catch(() => { });
    // Give native layer 200ms to actually drop the hardware lock before speaking
    await new Promise(r => setTimeout(r, 200));

    audio.play().then(() => {
      if (!isManual) sessionStorage.setItem('kavach_greeted', 'true');
    }).catch(err => {
      setBriefingActive(false);
      setIsBriefingPlaying(false);
      console.log("Voice blocked by browser autoplay policy.");
      // If blocked, instantly resume mic
      KavachSafe.startVoiceSentinel().catch(() => { });
    });
  };

  React.useEffect(() => {
    if (isRideModeActive) {
      setIsRideActive(true);
      setIsRideSafeOpen(true);
      if (rideData?.vehicleNo) setVehicleNo(rideData.vehicleNo);
    }
  }, [isRideModeActive, rideData]);

  React.useEffect(() => {
    if (pendingNavigationTarget) {
      setIsNearbyHubOpen(false); // Close modal if open
      setIsSafeHavenMapOpen(true);
    }
  }, [pendingNavigationTarget]);

  React.useEffect(() => {
    syncLocation();
    const isJustLoggedIn = sessionStorage.getItem('kavach_just_logged_in');

    if (isJustLoggedIn === 'true') {
      // 🎙️ Auto-play for NEW LOGIN session
      sessionStorage.removeItem('kavach_just_logged_in');
      sessionStorage.removeItem('kavach_greeted');

      // Try to play immediately (might be blocked by browser)
      handleVoiceBriefing();

      // Fallback for browser autoplay block (plays on first click)
      const playOnInteract = (e: MouseEvent) => {
        // If the user clicked the manual toggle button, don't auto-start and let the button handle it
        const target = e.target as HTMLElement;
        if (target.closest('#voice-toggle-btn')) {
          document.removeEventListener('click', playOnInteract);
          return;
        }
        handleVoiceBriefing();
        document.removeEventListener('click', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
    }
    if (Capacitor.isNativePlatform()) {
      const checkStatus = async () => {
        const status = await KavachSafe.isIgnoringBatteryOptimizations();
        if (status) setBatteryExempt(status.isExempt);
      };
      checkStatus();
      const interval = setInterval(checkStatus, 5000);
      return () => {
        clearInterval(interval);
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    }

    return () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#2563EB]/10 text-[#1E293B]">
      <main className="max-w-md mx-auto px-4 sm:px-6 pt-0 pb-10 sm:pt-1 space-y-3 sm:space-y-4">

        {/* 🔊 BRIEFING TOGGLE BUTTON */}
        <div className="w-full flex justify-end px-2 mb-3">
          <button
            id="voice-toggle-btn"
            onClick={() => handleVoiceBriefing(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm active:scale-95 transition-all"
          >
            {isBriefingPlaying ? (
              <>
                <Volume2 size={12} className="text-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Stop Briefing</span>
              </>
            ) : (
              <>
                <Volume2 size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Listen Briefing</span>
              </>
            )}
          </button>
        </div>

        {/* 🔊 Voice Visualizer Removed from UI (Still runs in background) */}
        {/* <VoiceVisualizer isSOSActive={isSOSActive} /> */}

        {/* SOS CORE */}
        <section className="relative min-h-[200px] sm:min-h-[250px] bg-[#0A0A0B] rounded-[32px] sm:rounded-[56px] overflow-hidden shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 border border-white/5">
          <div className="relative z-10 space-y-2 mb-4 text-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-accent-red/10 rounded-full border border-accent-red/20 mx-auto w-fit">
              <span className="text-[7px] sm:text-[8px] font-bold text-accent-red tracking-[2px]">SOS Emergency Control</span>
            </div>
            <p className={cn(
              "text-[8px] sm:text-[9px] font-bold tracking-[2px] transition-colors",
              isVoiceTriggerActive ? "text-blue-500" : "text-gray-500"
            )}>
              {isVoiceTriggerActive ? 'Shout "Kavach Help" to Activate' : 'Voice Sentinel Offline'}
            </p>
          </div>
          <div className="relative z-10 scale-[0.9] sm:scale-[1.08]">
            <SOSButton />
          </div>
        </section>

        {/* Priority Helplines */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => KavachSafe.initiateEmergencyCall({ number: '112' })}
            className="p-3.5 sm:p-5 bg-red-600 rounded-[24px] sm:rounded-[36px] flex flex-col items-center gap-1 active:scale-95 transition-all overflow-hidden relative"
          >
            <div className="relative">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center text-white mb-0.5">
                <PhoneCall size={14} className="sm:size-[20px]" />
              </div>
            </div>
            <span className="text-base sm:text-xl font-black text-white tracking-tighter leading-tight">112</span>
            <span className="text-[6px] sm:text-[8px] font-bold text-white uppercase tracking-wider sm:tracking-widest leading-none">Call For Help</span>
            <span className="text-[5px] sm:text-[7px] text-white/50 font-medium uppercase tracking-widest mt-0.5">Emergency</span>
          </button>
          <button
            onClick={() => KavachSafe.initiateEmergencyCall({ number: gender === 'female' ? '1091' : '100' })}
            className="p-3.5 sm:p-5 bg-white border border-gray-200 rounded-[24px] sm:rounded-[36px] flex flex-col items-center gap-1 active:scale-95 transition-all overflow-hidden relative"
          >
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-0.5">
              {gender === 'female' ? <User size={14} className="sm:size-[20px]" /> : <Shield size={14} className="sm:size-[20px]" />}
            </div>
            <span className="text-base sm:text-xl font-black text-[#1E293B] tracking-tighter leading-tight">{gender === 'female' ? '1091' : '100'}</span>
            <span className="text-[6px] sm:text-[8px] font-bold text-gray-500 uppercase tracking-wider sm:tracking-widest leading-none">{gender === 'female' ? 'Women Helpline' : 'Police Helpline'}</span>
            <span className="text-[5px] sm:text-[7px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Tap To Call</span>
          </button>
        </div>

        {/* Tactical Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-4">
          <ActionCard icon={<Shield />} title="Nearby Help" desc={`${verifiedProtectorCount > 0 ? verifiedProtectorCount : 'Multiple'} protectors standing by`} tint="#ECFDF3" iconColor="#22C55E" onClick={() => toggleOverlay(setIsNearbyHubOpen, true)} />
          <ActionCard icon={<EyeOff />} title="ThreatProtect" desc="Silent safety recording" tint="#EEF2FF" iconColor="#3B82F6" onClick={() => toggleOverlay(setIsShadowOpen, true)} />
          <ActionCard icon={<MapPin />} title="Safe Journey" desc="Live travel protection" tint="#EFF6FF" iconColor="#0EA5E9" onClick={() => toggleOverlay(setIsRideSafeOpen, true)} />
          <ActionCard
            icon={<FileText />}
            title="Digital Complaint"
            desc="Online FIR support"
            tint="#F8FAFC"
            iconColor="#64748B"
            onClick={() => {
              setActiveTab('vault');
              setIsFirFlowActive(true);
            }}
          />
          <ActionCard icon={<PhoneCall />} title="FakeCall" desc="Quick exit assistance" tint="#FFF7ED" iconColor="#F59E0B" onClick={() => toggleOverlay(setIsFakeCallHubOpen, true)} />
          <ActionCard icon={<Clock />} title="Safe Timer" desc="Reach home safely" tint="#FFF4EE" iconColor="#F97316" onClick={() => toggleOverlay(setIsSafeTimerOpen, true)} />
          <ActionCard className="col-span-2 border border-rose-100/50 hover:border-rose-200/50 transition-all duration-300" icon={<Activity />} title="Medical Hub" desc="Ambulance & Emergency Trauma Center triangulation" tint="#FEF2F2" iconColor="#EF4444" onClick={() => toggleOverlay(setIsMedicalHubOpen, true)} />
        </div>

      </main>

      <RideSafeOverlay isOpen={isRideSafeOpen} onClose={() => toggleOverlay(setIsRideSafeOpen, false)} isRideActive={isRideActive} setIsRideActive={setIsRideActive} vehicleNo={vehicleNo} setVehicleNo={setVehicleNo} />
      <SafeTimerModal isOpen={isSafeTimerOpen} onClose={() => toggleOverlay(setIsSafeTimerOpen, false)} />
      <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => toggleOverlay(setIsNearbyHubOpen, false)} />
      <MedicalHubModal isOpen={isMedicalHubOpen} onClose={() => toggleOverlay(setIsMedicalHubOpen, false)} />
      <ShadowProtectMode isOpen={isShadowOpen} onClose={() => toggleOverlay(setIsShadowOpen, false)} />
      <FakeCallModal isOpen={isFakeCallHubOpen} onClose={() => toggleOverlay(setIsFakeCallHubOpen, false)} />
      <KavachAIChat isOpen={isAIChatOpen} onClose={() => toggleOverlay(setIsAIChatOpen, false)} />

      {isSafeHavenMapOpen && (
        <SafeHavenMap
          onClose={() => {
            setIsSafeHavenMapOpen(false);
            setPendingNavigationTarget(null);
          }}
          initialTarget={pendingNavigationTarget || undefined}
        />
      )}

      <WarningOverlay />
      <BannedOverlay />

      <ProtectorRatingModal 
        isOpen={ratingAlert !== null} 
        onClose={() => setRatingAlert(null)}
        alertId={ratingAlert?.id || ''}
        responders={ratingAlert?.responders || []}
      />
    </div>
  );
}

const ActionCard = React.memo(({ icon, title, desc, iconColor, tint, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={cn("bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-transform", className)}
  >
    <div className="flex items-center gap-2 sm:gap-3 relative z-10">
      <div style={{ color: iconColor, backgroundColor: tint }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
        {React.cloneElement(icon as any, { size: 16 })}
      </div>
      <h3 className="text-[10px] sm:text-[12px] font-bold text-[#1E293B] tracking-tight leading-tight flex-1 break-words">
        {title}
      </h3>
    </div>

    <div className="relative z-10">
      <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">{desc}</p>
    </div>
  </button>
));
