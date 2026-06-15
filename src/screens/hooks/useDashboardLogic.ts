import { useState, useEffect, useRef } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth, db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../../services/KavachNative';

export function useDashboardLogic() {
  const {
    batteryLevel, gender, userPos, syncLocation,
    setFakeCallActive, isBatteryExempt, setBatteryExempt,
    isSOSActive, isRideModeActive, rideData, updateRideData,
    setBriefingActive, verifiedProtectorCount, setOverlayActive,
    setActiveTab, setIsFirFlowActive, isVoiceTriggerActive, setVoiceTriggerActive,
    pendingNavigationTarget, setPendingNavigationTarget
  } = useKavachStore();
  const { language } = useLanguage();

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isShadowOpen, setIsShadowOpen] = useState(false);
  const [isFakeCallHubOpen, setIsFakeCallHubOpen] = useState(false);
  const [isSafeTimerOpen, setIsSafeTimerOpen] = useState(false);
  const [isNearbyHubOpen, setIsNearbyHubOpen] = useState(false);
  const [isMedicalHubOpen, setIsMedicalHubOpen] = useState(false);
  const [isRideSafeOpen, setIsRideSafeOpen] = useState(isRideModeActive);
  const [isRideActive, setIsRideActive] = useState(isRideModeActive);
  const [isSafeHavenMapOpen, setIsSafeHavenMapOpen] = useState(false);
  const [vehicleNo, setVehicleNo] = useState(rideData?.vehicleNo || '');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);

  // Rating Modal State
  const [ratingAlert, setRatingAlert] = useState<{ id: string, responders: string[] } | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resolvedUnrated = snapshot.docs
        .map(d => {
          const data = d.data();
          return { id: d.id, ...data, timestamp: data.timestamp?.seconds ? data.timestamp.seconds * 1000 : data.timestamp };
        })
        .filter((d: any) => d.status === 'resolved' && d.isRated !== true)
        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

      if (resolvedUnrated.length > 0) {
        const alertData = resolvedUnrated[0] as any;
        const responders = alertData.responders || alertData.acceptedBy || [];
        
        if (responders.length > 0) {
          setRatingAlert({ id: alertData.id, responders });
        } else {
          setRatingAlert(null);
        }
      } else {
        setRatingAlert(null);
      }
    }, (error) => {
      console.warn("KAVACH: Rating alerts listener error:", error);
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

  useEffect(() => {
    if (isRideModeActive) {
      setIsRideActive(true);
      setIsRideSafeOpen(true);
      if (rideData?.vehicleNo) setVehicleNo(rideData.vehicleNo);
    }
  }, [isRideModeActive, rideData]);

  useEffect(() => {
    if (pendingNavigationTarget) {
      setIsNearbyHubOpen(false); // Close modal if open
      setIsSafeHavenMapOpen(true);
    }
  }, [pendingNavigationTarget]);

  useEffect(() => {
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

  return {
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
  };
}
