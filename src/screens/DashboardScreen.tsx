import React from 'react';
import RideSafeOverlay from '../components/RideSafeOverlay';
import SOSButton from '../components/SOSButton';
import VictimMap from '../components/maps/VictimMap';
import { Shield, Activity, ShieldCheck, Lock, PhoneCall, Mic, FileText, ChevronRight, Radio, MapPin, MessageSquare, EyeOff, User, Clock, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../App';
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
import WarningOverlay from '../components/WarningOverlay';
import BannedOverlay from '../components/BannedOverlay';

import { db, auth } from '../firebase';
import { setDoc, doc, getDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';

import { useVoiceTrigger } from '../hooks/useVoiceTrigger';
import { useRideProtocol } from '../hooks/useRideProtocol';
import { useProtectorSentinel } from '../hooks/useProtectorSentinel';

export default function DashboardScreen() {
  const { 
    batteryLevel, gender, userPos, syncLocation, 
    setFakeCallActive, isBatteryExempt, setBatteryExempt,
    isSOSActive, isRideModeActive, rideData, updateRideData,
    setBriefingActive, verifiedProtectorCount
  } = useKavachStore();
  const { language } = useLanguage();

  useVoiceTrigger();
  useRideProtocol();
  useProtectorSentinel();

  const [isVaultOpen, setIsVaultOpen] = React.useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [isShadowOpen, setIsShadowOpen] = React.useState(false);
  const [isFakeCallHubOpen, setIsFakeCallHubOpen] = React.useState(false);
  const [isZeroFIROpen, setIsZeroFIROpen] = React.useState(false);
  const [isSafeTimerOpen, setIsSafeTimerOpen] = React.useState(false);
  const [isNearbyHubOpen, setIsNearbyHubOpen] = React.useState(false);
  const [isRideSafeOpen, setIsRideSafeOpen] = React.useState(isRideModeActive);
  const [isRideActive, setIsRideActive] = React.useState(isRideModeActive);
  const [vehicleNo, setVehicleNo] = React.useState(rideData?.vehicleNo || '');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isBriefingPlaying, setIsBriefingPlaying] = React.useState(false);

  const handleVoiceBriefing = (isManual = false) => {
    if (isBriefingPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsBriefingPlaying(false);
      setBriefingActive(false);
      return;
    }

    const audioPath = language === 'hi' ? '/voice/hindispeech.mp3' : '/voice/englishspeech.mp3';
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    
    // 🛡️ SELF-TRIGGER PROTECTION: Mute Mic during briefing
    setBriefingActive(true);
    setIsBriefingPlaying(true);

    audio.onended = () => {
      setBriefingActive(false);
      setIsBriefingPlaying(false);
      if (!isManual) sessionStorage.setItem('kavach_greeted', 'true');
    };

    audio.play().then(() => {
      if (!isManual) sessionStorage.setItem('kavach_greeted', 'true');
    }).catch(err => {
      setBriefingActive(false);
      setIsBriefingPlaying(false);
      console.log("Voice blocked by browser autoplay policy, waiting for interaction.");
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
    syncLocation();
    const isJustLoggedIn = sessionStorage.getItem('kavach_just_logged_in');
    
    if (isJustLoggedIn) {
      // 🎙️ Auto-play for NEW LOGIN session
      handleVoiceBriefing();
      
      // Fallback for browser autoplay block
      const playOnInteract = () => {
        const stillInSession = sessionStorage.getItem('kavach_just_logged_in');
        if (stillInSession) {
          handleVoiceBriefing();
          sessionStorage.removeItem('kavach_just_logged_in');
        }
        document.removeEventListener('click', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
      
      // Clean up after first successful play attempt
      setTimeout(() => sessionStorage.removeItem('kavach_just_logged_in'), 5000);
    }
    if (Capacitor.isNativePlatform()) {
      const checkStatus = async () => {
        const status = await KavachSafe.isIgnoringBatteryOptimizations();
        if (status) setBatteryExempt(status.isExempt);
      };
      checkStatus();
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#2563EB]/10 text-[#1E293B]">
      <main className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-10">
        {/* Header Status */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#E5E7EB]">
             <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <div className="absolute inset-0 bg-[#22C55E] rounded-full animate-ping opacity-25" />
             </div>
              <span className="text-[10px] font-bold text-[#1E293B] tracking-wide">Kavach Protection Active</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={isBriefingPlaying}
              onClick={() => handleVoiceBriefing(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 border rounded-xl text-[10px] font-bold transition-all shadow-sm",
                isBriefingPlaying 
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75" 
                  : "bg-white border-[#E5E7EB] text-[#1E293B] hover:bg-gray-50 active:scale-95"
              )}
            >
              <Volume2 size={14} className={isBriefingPlaying ? "text-gray-400 animate-pulse" : "text-[#DC2626]"} />
              {isBriefingPlaying ? "Safety Briefing..." : "Listen Again"}
            </button>
          </div>
        </header>

        <VoiceVisualizer isSOSActive={isSOSActive} />

        {/* SOS CORE */}
        <section className="relative min-h-[200px] sm:min-h-[250px] bg-[#0A0A0B] rounded-[32px] sm:rounded-[56px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center p-4 sm:p-6 border border-white/[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1),transparent)] pointer-events-none" />
          <div className="relative z-10 space-y-3 mb-8 text-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-accent-red/10 rounded-full border border-accent-red/20 mx-auto w-fit">
               <span className="text-[7px] sm:text-[8px] font-bold text-accent-red tracking-[2px]">SOS Emergency Control</span>
            </div>
             <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold tracking-[2px]">Shout "Kavach Help" to Activate</p>
          </div>
          <div className="relative z-10 scale-[0.9] sm:scale-[1.08]">
            <SOSButton />
          </div>
        </section>

        {/* Priority Helplines */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
           <button 
             onClick={() => window.open('tel:112')} 
             className="p-3.5 sm:p-5 bg-accent-red rounded-[24px] sm:rounded-[36px] flex flex-col items-center gap-1 shadow-[0_12px_24px_rgba(239,68,68,0.2)] active:scale-95 transition-all group overflow-hidden relative"
           >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center text-white mb-0.5 animate-pulse">
                   <PhoneCall size={14} className="sm:size-[20px]" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-full border-2 border-accent-red animate-ping" />
              </div>
              <span className="text-base sm:text-xl font-black text-white tracking-tighter leading-tight">112</span>
              <span className="text-[6px] sm:text-[8px] font-bold text-white uppercase tracking-wider sm:tracking-widest leading-none">Maddat ke liye</span>
              <span className="text-[5px] sm:text-[7px] text-white/50 font-medium uppercase tracking-widest mt-0.5">Emergency</span>
           </button>
           <button 
             onClick={() => window.open(gender === 'female' ? 'tel:1091' : 'tel:100')} 
             className="p-3.5 sm:p-5 bg-white border border-black/[0.05] rounded-[24px] sm:rounded-[36px] flex flex-col items-center gap-1 shadow-[0_8px_25px_rgba(0,0,0,0.03)] active:scale-95 transition-all group overflow-hidden relative"
           >
              <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC] to-transparent pointer-events-none" />
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-[#DC2626]/5 rounded-full flex items-center justify-center text-[#DC2626] mb-0.5">
                 {gender === 'female' ? <User size={14} className="sm:size-[20px]" /> : <Shield size={14} className="sm:size-[20px]" />}
              </div>
              <span className="text-base sm:text-xl font-black text-[#1E293B] tracking-tighter leading-tight">{gender === 'female' ? '1091' : '100'}</span>
              <span className="text-[6px] sm:text-[8px] font-bold text-gray-500 uppercase tracking-wider sm:tracking-widest leading-none">{gender === 'female' ? 'Women Helpline' : 'Police Helpline'}</span>
              <span className="text-[5px] sm:text-[7px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Dabayein</span>
           </button>
        </div>

        {/* Tactical Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-4">
          <ActionCard icon={<Shield />} title="Nearby Help" desc={`${verifiedProtectorCount > 0 ? verifiedProtectorCount : 'Multiple'} protectors standing by`} tint="#ECFDF3" iconColor="#22C55E" onClick={() => setIsNearbyHubOpen(true)} badge={verifiedProtectorCount > 0 ? `${verifiedProtectorCount} LIVE` : 'GRID'} />
          <ActionCard icon={<EyeOff />} title="ThreatProtect" desc="Silent safety recording" tint="#EEF2FF" iconColor="#3B82F6" onClick={() => setIsShadowOpen(true)} badge="STEALTH" />
          <ActionCard icon={<MapPin />} title="Safe Journey" desc="Live travel protection" tint="#EFF6FF" iconColor="#0EA5E9" onClick={() => setIsRideSafeOpen(true)} badge="HUB" />
          <ActionCard icon={<FileText />} title="Digital Complaint" desc="Online FIR support" tint="#F8FAFC" iconColor="#64748B" onClick={() => setIsZeroFIROpen(true)} />
          <ActionCard icon={<PhoneCall />} title="FakeCall" desc="Quick exit assistance" tint="#FFF7ED" iconColor="#F59E0B" onClick={() => setIsFakeCallHubOpen(true)} />
          <ActionCard icon={<Mic />} title="Voice SOS" desc="Emergency voice activation" tint="#F5F3FF" iconColor="#8B5CF6" onClick={() => toast.info("Voice Monitor Active")} />
          <ActionCard icon={<ShieldCheck />} title="Evidence Vault" desc="Secured safety records" tint="#FFF1F5" iconColor="#EC4899" onClick={() => setIsVaultOpen(true)} badge="OFFICIAL" />
          <ActionCard icon={<Clock />} title="Safe Timer" desc="Reach home safely" tint="#FFF4EE" iconColor="#F97316" onClick={() => setIsSafeTimerOpen(true)} />
        </div>



        <div className="flex items-center justify-center gap-2 py-4 border-t border-black/[0.03] opacity-60 group">
           <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
           <span className="text-[7px] font-black text-gray-500 uppercase tracking-[2px]">Kavach Protection Network Active</span>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAIChatOpen(true)} 
          className="fixed bottom-26 right-6 w-14 h-14 bg-[#14213D] text-white rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(20,33,61,0.2)] z-[100] border-4 border-white"
        >
          <MessageSquare size={24} />
        </motion.button>
      </main>



      <RideSafeOverlay isOpen={isRideSafeOpen} onClose={() => setIsRideSafeOpen(false)} isRideActive={isRideActive} setIsRideActive={setIsRideActive} vehicleNo={vehicleNo} setVehicleNo={setVehicleNo} />
      <ZeroFIRModal isOpen={isZeroFIROpen} onClose={() => setIsZeroFIROpen(false)} />
      <SafeTimerModal isOpen={isSafeTimerOpen} onClose={() => setIsSafeTimerOpen(false)} />
      <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => setIsNearbyHubOpen(false)} />
      <ShadowProtectMode isOpen={isShadowOpen} onClose={() => setIsShadowOpen(false)} />
      <FakeCallModal isOpen={isFakeCallHubOpen} onClose={() => setIsFakeCallHubOpen(false)} />
      <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      
      {/* 🏛️ Institutional Enforcement Overlay */}
      <WarningOverlay />
      <BannedOverlay />
    </div>
  );
}

const ActionCard = ({ icon, title, desc, iconColor, tint, onClick, badge }: any) => (
  <motion.button 
    whileTap={{ scale: 0.98 }} 
    onClick={onClick} 
    className="h-full p-5 bg-white rounded-[24px] border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-left flex flex-col gap-4 transition-all relative group hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-gray-300 active:scale-[0.98]"
  >
    <div className="flex items-center gap-3 relative z-10">
      <div style={{ color: iconColor, backgroundColor: tint }} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/[0.02]">
        {React.cloneElement(icon as any, { size: 20 })}
      </div>
      <h3 className="text-[12px] sm:text-[13px] font-semibold text-[#1E293B] tracking-tight leading-tight flex-1 break-words">
        {title}
      </h3>
    </div>

    <div className="relative z-10">
      <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">{desc}</p>
    </div>
  </motion.button>
);
