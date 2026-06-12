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
import { useDashboardLogic } from './hooks/useDashboardLogic';
import { ActionCard } from './components/ActionCard';


export default function DashboardScreen() {
  const {
    batteryLevel, gender, userPos, syncLocation,
    setFakeCallActive, isBatteryExempt, setBatteryExempt,
    isSOSActive, isRideModeActive, rideData, updateRideData,
    setBriefingActive, verifiedProtectorCount, setOverlayActive,
    setActiveTab, setIsFirFlowActive, isVoiceTriggerActive, setVoiceTriggerActive,
    pendingNavigationTarget, setPendingNavigationTarget,
    isVaultOpen, setIsVaultOpen,
    isAIChatOpen, setIsAIChatOpen,
    isShadowOpen, setIsShadowOpen,
    isFakeCallHubOpen, setIsFakeCallHubOpen,
    isSafeTimerOpen, setIsSafeTimerOpen,
    isNearbyHubOpen, setIsNearbyHubOpen,
    isMedicalHubOpen, setIsMedicalHubOpen,
    isRideSafeOpen, setIsRideSafeOpen,
    isRideActive, setIsRideActive,
    isSafeHavenMapOpen, setIsSafeHavenMapOpen,
    vehicleNo, setVehicleNo,
    isBriefingPlaying, setIsBriefingPlaying,
    ratingAlert, setRatingAlert,
    toggleOverlay, handleVoiceBriefing
  } = useDashboardLogic();

  // 🛡️ Global hooks are now handled in App.tsx to prevent duplicate background execution
  // useVoiceTrigger();
  // useRideProtocol();
  // useProtectorSentinel();



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


