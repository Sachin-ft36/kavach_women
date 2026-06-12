import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Shield, Volume2, VolumeX } from 'lucide-react';
import { cn } from './lib/utils';
import { KavachSafe } from './services/KavachNative';
import { useKavachStore } from './store/useKavachStore';
import { useEvidenceEngine } from './hooks/useEvidenceEngine';
import { useThreatSentinel } from './hooks/useThreatSentinel';
import { useProtectorSentinel } from './hooks/useProtectorSentinel';
import { useVoiceTrigger } from './hooks/useVoiceTrigger';
import { useShakeTrigger } from './hooks/useShakeTrigger';
import { useRideProtocol } from './hooks/useRideProtocol';
import { useAuthOrchestrator } from './hooks/useAuthOrchestrator';
import { useAppInitialization } from './hooks/useAppInitialization';

import Layout from './components/Layout';
import SOSConfirmationOverlay from './components/SOSConfirmationOverlay';
import WarningOverlay from './components/WarningOverlay';
import BanOverlay from './components/BanOverlay';
import RemoteCommandListener from './components/RemoteCommandListener';
import { TacticalCallOverlay } from './components/TacticalCallOverlay';
import SafeTimerPopup from './components/SafeTimerPopup';
import RideDeviationPopup from './components/RideDeviationPopup';
import KavachAIChat from './components/KavachAIChat';
import { TabManager } from './components/navigation/TabManager';
import { BottomNavBar } from './components/navigation/BottomNavBar';
import { VerificationPendingGate } from './components/onboarding/VerificationPendingGate';

const Onboarding = React.lazy(() => import('./components/Onboarding'));
const FakeCallUI = React.lazy(() => import('./components/FakeCallUI'));
const AuthScreen = React.lazy(() => import('./screens/AuthScreen'));
const SOSScreen = React.lazy(() => import('./screens/SOSScreen'));
const TrackScreen = React.lazy(() => import('./screens/TrackScreen'));
const LanguageStep = React.lazy(() => import('./components/onboarding/LanguageStep'));
const SuperCellDashboard = React.lazy(() => import('./components/SuperCellDashboard'));

export default function App() {
  const {
    isAIChatOpen, setIsAIChatOpen, isInterceptActive, isSOSActive,
    activeTab, setActiveTab, role, setRole, isRegistered, isVerified, profile,
    user, loading, isLocked, handleManualUnlock, isFakeCallActive, setFakeCallActive,
    isOverlayActive, isSOSBlocked, pendingSOS, isHardwareSynced
  } = useKavachStore();

  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [trackId, setTrackId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) setIsNavVisible(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 50) setIsNavVisible(false);
      else if (currentScrollY < lastScrollY) setIsNavVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/track/')) setTrackId(path.split('/')[2]);
  }, []);

  const [isGhostMode, setIsGhostMode] = useState<boolean>(() => localStorage.getItem('kavach_ghost_mode') === 'true');
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(true);
  const [isIntroEnding, setIsIntroEnding] = useState(false);
  const [isIntroMuted, setIsIntroMuted] = useState(false);

  const onIntroEnd = () => {
    setIsIntroEnding(true);
    setTimeout(() => {
      localStorage.setItem('kavach_intro_seen', 'true');
      setHasSeenIntro(true);
    }, 1000);
  };

  const onToggleGhost = () => {
    setIsGhostMode(prev => {
      const newState = !prev;
      localStorage.setItem('kavach_ghost_mode', newState.toString());
      if (Capacitor.isNativePlatform()) {
        KavachSafe.setAppStealthMode({ enabled: newState }).catch(() => {});
      }
      return newState;
    });
  };

  useEvidenceEngine();
  useThreatSentinel();
  useProtectorSentinel();
  useVoiceTrigger();
  useShakeTrigger();
  useRideProtocol();

  const { handleLogin, handleOnboardingComplete } = useAuthOrchestrator();
  const { showFailSafe, setShowFailSafe, loadingStatus } = useAppInitialization(trackId);

  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(() => {
    return localStorage.getItem('kavach_language_selected') === 'true';
  });

  if (loading && !trackId) return (
    <div className="min-h-[100svh] bg-black flex flex-col items-center justify-center font-['Outfit'] relative">
      <div className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-6xl font-black tracking-tight mb-2 bg-gradient-to-b from-[#FF9933] via-white to-[#138808] text-transparent bg-clip-text">KAVACH</h1>
        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{loadingStatus}</p>

        {showFailSafe && (
          <button
            onClick={() => {
              console.warn("🚨 KAVACH TACTICAL: Manual offline bypass triggered.");
              useKavachStore.getState().setLoading(false);
            }}
            className="mt-12 px-6 py-3 bg-[#111] border border-[#333] rounded-lg text-white text-[10px] font-bold tracking-widest uppercase active:scale-95"
          >
            Continue Offline →
          </button>
        )}
      </div>

      <div className="absolute bottom-12 flex flex-col items-center justify-center gap-1.5 opacity-60">
        <p className="text-[9px] font-black tracking-[0.3em] text-white uppercase">Proudly Made In India</p>
        <div className="flex gap-1 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SOSConfirmationOverlay />
      <WarningOverlay />
      <BanOverlay />
      <RemoteCommandListener />
      <TacticalCallOverlay />
      <SafeTimerPopup />
      <RideDeviationPopup />
      <React.Suspense fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-[#2563EB] rounded-full animate-spin shadow-inner" />
          <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">{trackId ? 'Connecting Guardian Link' : 'Initializing Safety Hub'}</p>
        </div>
      }>
        {trackId ? (
          <TrackScreen />
        ) : (
          <>
            {isFakeCallActive && <FakeCallUI onEnd={() => setFakeCallActive(false)} />}
            {!hasSeenIntro ? (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isIntroEnding ? 0 : 1 }}
                transition={{ duration: 1 }}
                className="fixed inset-0 bg-black flex items-center justify-center z-[1000000] overflow-hidden cursor-pointer"
                onClick={onIntroEnd}
              >
                <video
                  autoPlay playsInline muted={isIntroMuted} onEnded={onIntroEnd} onError={onIntroEnd}
                  className="w-full h-full object-cover scale-[1.01]"
                  ref={(el) => { if (el) setTimeout(() => { if (!isIntroEnding) onIntroEnd(); }, 15000); }}
                >
                  <source src="/kavachintro.mp4" type="video/mp4" />
                </video>

                <div className="absolute top-10 right-10 z-50">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsIntroMuted(prev => !prev); }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl text-white transition-all active:scale-95 shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/[0.02] group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex h-2 w-2">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isIntroMuted ? "bg-rose-400" : "bg-emerald-400")} />
                      <span className={cn("relative inline-flex rounded-full h-2 w-2", isIntroMuted ? "bg-rose-500" : "bg-emerald-500")} />
                    </span>
                    {isIntroMuted ? <VolumeX size={15} className="text-rose-400 animate-pulse" /> : <Volume2 size={15} className="text-emerald-400" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{isIntroMuted ? "Tap for Sound" : "Mute Sound"}</span>
                  </button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                <div className="absolute bottom-12 left-0 right-0 text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.4em] italic">Tactical Briefing in Progress</p>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                  </div>
                  <p className="text-[8px] text-white/20 font-bold uppercase tracking-[2px]">Synchronizing Sovereign Safety Matrix v4.2</p>
                  <button onClick={onIntroEnd} className="mt-4 px-5 py-2 border border-white/20 rounded-full text-white/40 text-[9px] font-bold uppercase tracking-widest hover:border-white/50 hover:text-white/70 transition-all">
                    Tap to Skip →
                  </button>
                </div>

                <div className="absolute top-10 left-10 flex items-center gap-3 opacity-40">
                  <Shield size={20} className="text-white" />
                  <div className="h-4 w-[1px] bg-white/20" />
                  <span className="text-[8px] text-white font-black uppercase tracking-widest">KAVACH HQ</span>
                </div>
              </motion.div>
            ) : !isLanguageSelected ? (
              <LanguageStep onNext={() => {
                localStorage.setItem('kavach_language_selected', 'true');
                setIsLanguageSelected(true);
              }} />
            ) : !user ? (
              <AuthScreen handleLogin={handleLogin} onResetLanguage={() => setIsLanguageSelected(false)} />
            ) : isSOSActive ? (
              <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />
            ) : ((role as any) === 'admin' || (role as any) === 'super_cell') ? (
              <Layout
                isGhostMode={isGhostMode} onToggleGhost={onToggleGhost}
                activeTab={activeTab === 'dashboard' ? 'COMMAND' : activeTab}
                setActiveTab={setActiveTab} role="super_cell" setRole={setRole} setGender={() => { }}
              >
                <SuperCellDashboard viewMode={activeTab === 'dashboard' ? 'COMMAND' : activeTab as any} onTabChange={setActiveTab} />
              </Layout>
            ) : (!isRegistered || !isHardwareSynced) ? (
              <div className="w-full h-full">
                <Onboarding user={user} onComplete={handleOnboardingComplete} isReturningUser={isRegistered && !isHardwareSynced} />
              </div>
            ) : (!isVerified && (role as any) !== 'admin' && (role as any) !== 'super_cell') ? (
              <VerificationPendingGate user={user} profile={profile} />
            ) : (isLocked && activeTab !== 'sos' && role === 'citizen') ? (
              <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />
            ) : (
              <Layout isGhostMode={isGhostMode} onToggleGhost={onToggleGhost} activeTab={activeTab} setActiveTab={setActiveTab} role={role} setRole={setRole} setGender={() => { }}>
                <TabManager isGhostMode={isGhostMode} onToggleGhost={onToggleGhost} />
              </Layout>
            )}
          </>
        )}
      </React.Suspense>

      {(!isGhostMode && !isSOSActive && !pendingSOS && !isInterceptActive && !isOverlayActive && !isSOSBlocked && !isFakeCallActive && user && (role as any) !== 'admin' && !trackId && isRegistered && isHardwareSynced && (isVerified || (role as any) === 'admin' || (role as any) === 'super_cell')) && createPortal(
        <>
          <BottomNavBar isNavVisible={isNavVisible} />

          {role === 'citizen' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ bottom: '110px', scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', right: '24px', zIndex: 1000000 }}
            >
              <button
                onClick={() => setIsAIChatOpen(!isAIChatOpen)}
                className="w-14 h-14 bg-[#0F172A] rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white active:scale-90 transition-all group relative"
              >
                <MessageSquare size={24} className={cn("transition-transform duration-500", isAIChatOpen ? "rotate-90 scale-0" : "rotate-0 scale-100")} />
                <div className={cn("absolute inset-0 flex items-center justify-center transition-transform duration-500", isAIChatOpen ? "rotate-0 scale-100" : "-rotate-90 scale-0")}>
                  <div className="w-6 h-0.5 bg-white rotate-45 absolute" />
                  <div className="w-6 h-0.5 bg-white -rotate-45 absolute" />
                </div>
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {isAIChatOpen && <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />}
          </AnimatePresence>
        </>,
        document.body
      )}
      <TacticalCallOverlay />
    </>
  );
}
