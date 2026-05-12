import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { NavButton } from './components/NavButton';
import { createPortal } from 'react-dom';
import { syncTelemetry, startBackgroundTracking, watchLiveLocation } from './services/locationService';
import { useKavachStore } from './store/useKavachStore';
import { useEvidenceEngine } from './hooks/useEvidenceEngine';
import { useThreatSentinel } from './hooks/useThreatSentinel';
import { useProtectorSentinel } from './hooks/useProtectorSentinel';
import { useVoiceTrigger } from './hooks/useVoiceTrigger';
import { useShakeTrigger } from './hooks/useShakeTrigger';
import { useRideProtocol } from './hooks/useRideProtocol';
import { useAudioAI } from './hooks/useAudioAI';
import { motion, AnimatePresence } from 'motion/react';
import { initializeBackgroundSentinel } from './services/BackgroundSentinelService';
import SOSConfirmationOverlay from './components/SOSConfirmationOverlay';
import WarningOverlay from './components/WarningOverlay';
import BanOverlay from './components/BanOverlay';
import RemoteCommandListener from './components/RemoteCommandListener';
import { TacticalCallOverlay } from './components/TacticalCallOverlay';

const SOSButton = React.lazy(() => import('./components/SOSButton'));
const VictimMap = React.lazy(() => import('./components/maps/VictimMap'));
const EvidenceVault = React.lazy(() => import('./components/EvidenceVault'));
const EmergencyContacts = React.lazy(() => import('./components/EmergencyContacts'));
const Onboarding = React.lazy(() => import('./components/Onboarding'));
const FakeCallUI = React.lazy(() => import('./components/FakeCallUI'));
const ProtectorDashboard = React.lazy(() => import('./components/ProtectorDashboard'));
const SuperCellDashboard = React.lazy(() => import('./components/SuperCellDashboard'));
const Rewards = React.lazy(() => import('./components/Rewards'));
const AuthScreen = React.lazy(() => import('./screens/AuthScreen'));
const DashboardScreen = React.lazy(() => import('./screens/DashboardScreen'));
const SOSScreen = React.lazy(() => import('./screens/SOSScreen'));
const MissionHistoryScreen = React.lazy(() => import('./screens/MissionHistoryScreen'));
const GuideScreen = React.lazy(() => import('./screens/GuideScreen'));
const ProtectorGuideScreen = React.lazy(() => import('./screens/ProtectorGuideScreen'));
const ProtectorVerify = React.lazy(() => import('./components/ProtectorVerify'));
const ProtectorsRadarScreen = React.lazy(() => import('./screens/ProtectorsRadarScreen'));
const ProtectorGrievanceScreen = React.lazy(() => import('./screens/ProtectorGrievanceScreen'));
const ProtectorHistoryScreen = React.lazy(() => import('./screens/ProtectorHistoryScreen'));
const LanguageStep = React.lazy(() => import('./components/onboarding/LanguageStep'));
const TrackScreen = React.lazy(() => import('./screens/TrackScreen'));

import { 
  Settings, 
  AlertTriangle, 
  MessageSquare, 
  LayoutDashboard, 
  Globe, 
  Users, 
  ShieldCheck, 
  Upload, 
  MapPin, 
  BookOpen, 
  UserCheck, 
  Trophy,
  Shield
} from 'lucide-react';
import KavachAIChat from './components/KavachAIChat';
import StealthOverlay from './components/StealthOverlay';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from './services/KavachNative';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { auth, googleProvider, db, resetKavachState } from './firebase';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, onSnapshot, query, where, terminate } from 'firebase/firestore';
import { App as CapApp } from '@capacitor/app';
import { cn } from './lib/utils';

// KavachNative is now imported from services

export const KavachSafe = {
  startContinuousSiren: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.startContinuousSiren(); } catch (e) { console.error("Native Siren Error:", e); }
    }
  },
  stopContinuousSiren: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.stopContinuousSiren(); } catch (e) { console.error("Native Siren Stop Error:", e); }
    }
  },
  triggerHapticPulse: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.triggerHapticPulse(); } catch (e) { console.error("Native Haptic Error:", e); }
    }
  },
  requestSensitivePermissions: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.requestSensitivePermissions(); } catch (e) { console.error("Native Permissions Error:", e); }
    }
  },
  startForensicCapture: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.startForensicCapture(); } catch (e) { console.error("Native Capture Error:", e); }
    }
  },
  stopForensicCapture: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.stopForensicCapture(); } catch (e) { console.error("Native Capture Stop Error:", e); }
    }
  },
  broadcastEmergencySMS: async (options: { message: string, location: { lat: number, lng: number } }) => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.broadcastEmergencySMS(options); } catch (e) { console.error("Native Broadcast Error:", e); }
    }
  },
  sendSilentSMS: async (options: { number: string, message: string }) => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.sendSilentSMS(options); } catch (e) { console.error("Native SMS Error:", e); }
    }
  },
  directCall: async (options: { number: string }) => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.directCall(options); } catch (e) { console.error("Native Call Error:", e); }
    }
  },
  isIgnoringBatteryOptimizations: async () => {
    if (Capacitor.isNativePlatform()) {
      try { return await KavachNative.isIgnoringBatteryOptimizations(); } catch (e) { console.error("Native Battery Check Error:", e); return { isExempt: true }; }
    }
    return { isExempt: true };
  },
  openBatterySettings: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.openBatterySettings(); } catch (e) { console.error("Native Settings Error:", e); }
    }
  },
  startBackgroundSentinel: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.startBackgroundSentinel(); } catch (e) { console.error("Native Sentinel Start Error:", e); }
    }
  }
};

export default function App() {
  const isAIChatOpen = useKavachStore(state => state.isAIChatOpen);
  const setIsAIChatOpen = useKavachStore(state => state.setIsAIChatOpen);
  
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const [trackId, setTrackId] = useState<string | null>(null);
  const [showFailSafe, setShowFailSafe] = useState(false);
  const handleHardReset = () => { localStorage.clear(); window.location.reload(); };
  const isSOSActive = useKavachStore(state => state.isSOSActive);
  const handshakeCode = useKavachStore(state => state.handshakeCode);
  const activeTab = useKavachStore(state => state.activeTab);
  const role = useKavachStore(state => state.role);
  const isRegistered = useKavachStore(state => state.isRegistered);
  const isVerified = useKavachStore(state => state.isVerified);
  
  const {
    user, setUser, setRole, setGender, setRegistered, setVerified,
    userPos, setUserPos, batteryLevel, isLocked,
    setActiveTab, 
    activeAlertId, 
    triggerMethod,
    setSOSActive, 
    isShadowActive, 
    setShadowActive, 
    setPendingSOS, 
    loading,
    setLoading,
    handleManualUnlock, isFakeCallActive, setFakeCallActive, setGuardianCache,
    isHubReady, setHubReady, setSafetyPin, performanceMode, setProfile,
    isOverlayActive, isSOSBlocked
  } = useKavachStore();

  // ... (some code)

  // 🛡️ RECOVERY PROTOCOL: Ensure triggerMethod is restored from storage if state is lost
  useEffect(() => {
    const storedMethod = localStorage.getItem('kavach_trigger_method');
    if (isSOSActive && !triggerMethod && storedMethod) {
       // We don't have a setter for triggerMethod alone, but we can rely on the store sync
    }
  }, [isSOSActive, triggerMethod]);

  const [superCellViewMode, setSuperCellViewMode] = useState<'OPS' | 'GATEKEEPER' | 'JUSTICE' | 'LEADERBOARD' | 'ALL' | 'COMMS'>('ALL');
  const [isGhostMode, setIsGhostMode] = useState<boolean>(() => localStorage.getItem('kavach_ghost_mode') === 'true');
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => localStorage.getItem('kavach_intro_seen') === 'true');
  const [isIntroEnding, setIsIntroEnding] = useState(false);

  const onIntroEnd = () => {
    setIsIntroEnding(true);
    setTimeout(() => {
      localStorage.setItem('kavach_intro_seen', 'true');
      setHasSeenIntro(true);
    }, 1000); // 1s fade out
  };

  const onToggleGhost = () => {
    setIsGhostMode(prev => {
      const newState = !prev;
      localStorage.setItem('kavach_ghost_mode', newState.toString());
      return newState;
    });
  };

  useEvidenceEngine();
  useThreatSentinel();
  useProtectorSentinel();
  useVoiceTrigger();
  useShakeTrigger();
  useAudioAI();
  useRideProtocol();

  const [isHardwareSynced, setIsHardwareSynced] = useState<boolean>(() => localStorage.getItem('kavach_hardware_synced') === 'true');
  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(() => localStorage.getItem('kavach_language_selected') === 'true');

  useEffect(() => {
    // 🛡️ AUTO-RECOVERY SENTINEL: Detect Firestore Internal Assertion Failures
    const handleGlobalError = async (event: ErrorEvent | PromiseRejectionEvent) => {
      const msg = event instanceof ErrorEvent ? event.message : String(event.reason);
      if (msg.includes('ASSERTION FAILED') || msg.includes('ca9') || msg.includes('b815')) {
        console.error("🚨 KAVACH: SDK INTERNAL CORRUPTION DETECTED. INITIATING DEEP RECOVERY...");
        
        const lastReload = sessionStorage.getItem('kavach_auto_recovery_time');
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 30000) {
          sessionStorage.setItem('kavach_auto_recovery_time', now.toString());
          
          try {
            // Attempt to kill the corrupt SDK instance
            await terminate(db);
            await resetKavachState();
          } catch (e) {
            console.error("Deep Reset Interrupted:", e);
          }
          
          window.location.reload();
        }
      }
    };
    window.addEventListener('error', handleGlobalError as any);
    window.addEventListener('unhandledrejection', handleGlobalError as any);
    return () => {
      window.removeEventListener('error', handleGlobalError as any);
      window.removeEventListener('unhandledrejection', handleGlobalError as any);
    };
  }, []);

  // 🚨 EMERGENCY UI OVERRIDE: Automatically switch to SOS screen on trigger
  useEffect(() => {
    const storedRole = localStorage.getItem('kavach_user_role');
    const effectiveRole = role || storedRole;

    if (isSOSActive && (effectiveRole === 'citizen' || user?.email === 'singh.sachin16559@gmail.com')) {
      if (activeTab !== 'sos') {
        setActiveTab('sos');
      }
    }
  }, [isSOSActive, role, activeTab, setActiveTab, user]);

  // 🛡️ SOS RECOVERY ENGINE: Sync local state with Cloud Hub on mount/refresh
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'alerts'), 
      where('victimUid', '==', user.uid),
      where('status', 'in', ['active', 'responding', 'rescued_pending_victim_clearance'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const activeAlert = snapshot.docs[0];
        const alertData = activeAlert.data();
        console.log("🛰️ KAVACH RECOVERY: Active Mission Detected in Cloud Hub. Syncing local state...");
        if (!isSOSActive || (alertData.handshakeCode && handshakeCode !== alertData.handshakeCode)) {
          setSOSActive(true, activeAlert.id, alertData.type || 'remote', null, alertData.handshakeCode);
        }
      } else {
        // 🛡️ RACE CONDITION SHIELD: Do not stand down if the SOS was triggered very recently (within 10s)
        const lastTrigger = localStorage.getItem('kavach_last_trigger_time');
        const isRecentlyTriggered = lastTrigger && (Date.now() - parseInt(lastTrigger) < 10000);

        if (isSOSActive && !isRecentlyTriggered) {
          console.log("✅ KAVACH RECOVERY: Mission Resolved in Cloud Hub. Standing down.");
          setSOSActive(false);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 🛡️ ROLE-AWARE SNAPBACK: Ensure Protectors never stay on the SOS interface
  useEffect(() => {
    if (activeTab === 'sos' && role === 'protector' && user?.email !== 'singh.sachin16559@gmail.com') {
      console.log("🛡️ KAVACH NAV: Protector detected on Victim interface. Snapping back to Command...");
      setActiveTab('dashboard');
    }
  }, [activeTab, role, setActiveTab, user]);

  useEffect(() => {
    // 🛰️ GUARDIAN LINK DETECTION
    const path = window.location.pathname;
    if (path.startsWith('/track/')) {
      const id = path.split('/')[2];
      setTrackId(id);
    }
  }, [setTrackId]);

  useEffect(() => {
    initializeBackgroundSentinel();

    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        await PushNotifications.requestPermissions();
        KavachNative.addListener('sosTriggered', (data: { source: string }) => {
          const { setShadowActive, setPendingSOS } = useKavachStore.getState();
          if (data.source === 'shadow') {
            setShadowActive(true);
            KavachSafe.startForensicCapture();
          } else {
            setPendingSOS(true, (data.source as any) || 'shake');
          }
        });
        setHubReady(true);
      }, 2000);
    } else {
      setHubReady(true);
    }
  }, []);

  useEffect(() => {
    let activePulse: any = null;
    
    const startTracking = async () => {
      if (user && isRegistered && isHardwareSynced && !isSOSBlocked && isHubReady) {
        const state = useKavachStore.getState();
        activePulse = await watchLiveLocation((pos, acc) => {
          setUserPos(pos);
          syncTelemetry(user.uid, role, batteryLevel, pos, acc);
          
          // 🚗 TRANSIT SYNC: If in ride mode, update the journey doc immediately
          if (localStorage.getItem('kavach_ride_active') === 'true') {
            state.syncLocation({ latitude: pos[0], longitude: pos[1] });
          }
        }, performanceMode);
        startBackgroundTracking(user.uid, performanceMode);
      }
    };
    startTracking();

    const handleAppChange = async (state: { isActive: boolean }) => {
      if (!state.isActive && user && isRegistered) startBackgroundTracking(user.uid, performanceMode);
    };
    const listener = CapApp.addListener('appStateChange', handleAppChange);

    return () => {
      if (activePulse) {
        const { watchId, pulseInterval } = activePulse;
        Geolocation.clearWatch({ id: watchId });
        clearInterval(pulseInterval);
      }
      listener.then(l => l.remove());
    };
  }, [user, isRegistered, isHardwareSynced, performanceMode, isSOSBlocked]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowFailSafe(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    // 🛡️ TACTICAL REDIRECT CATCH
    if (!Capacitor.isNativePlatform()) {
      getRedirectResult(auth).catch((err) => {
        if (err.code !== 'auth/web-storage-unsupported') {
          console.error("KAVACH Redirect Error:", err);
        }
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem('kavach_user_uid', firebaseUser.uid);
        const docRef = doc(db, 'users', firebaseUser.uid);

        unsubProfile = onSnapshot(docRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            let currentRole = data.role || 'citizen';
            
            // 🛡️ SOVEREIGN ROLE LOCKDOWN: Males MUST be Protectors
            if (data.gender === 'male' && currentRole !== 'protector') {
              currentRole = 'protector';
              await setDoc(docRef, { role: 'protector' }, { merge: true });
            }

            setRole(currentRole);
            setRegistered(data.isRegistered === true);
            setVerified(data.isVerified || data.verified || false);
            setGender(data.gender || 'female');
            setProfile(data);
            if (data.safetyPin) setSafetyPin(data.safetyPin);
          } else {
            localStorage.removeItem('kavach_sos_active');
            localStorage.removeItem('kavach_active_alert_id');
            setRegistered(false);
          }
          setLoading(false);
        }, (error) => {
          setLoading(false);
        });

        const gSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'guardians'));
        const guardianList = gSnap.docs.map(d => ({ name: d.data().name, phone: d.data().phone }));
        setGuardianCache(guardianList);

        if (Capacitor.isNativePlatform() && guardianList.length > 0) {
          KavachNative.updateGuardianContacts({ contacts: JSON.stringify(guardianList) }).catch(() => { });
        }
        setLoading(false);
      } else {
        setUser(null);
        setRegistered(false);
        setLoading(false);
      }
    });

    return () => {
      try {
        unsubscribe();
        if (unsubProfile) unsubProfile();
      } catch (e) {
        console.warn("Auth Cleanup Interrupted:", e);
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.requestPermissions();
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (webErr: any) {
          // 🛡️ TACTICAL REDIRECT FALLBACK
          if (webErr.code === 'auth/popup-closed-by-user' || webErr.code === 'auth/network-request-failed' || webErr.code === 'auth/internal-error') {
            toast.info("Handshake interrupted. Switching to Secure Redirect...", { duration: 4000 });
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw webErr;
        }
      }
    } catch (e: any) {
      console.error("KAVACH Login Error:", e);
      toast.error(e.message || "Login failed. Please check your browser's popup blocker.");
    }
  };

  const handleOnboardingComplete = async () => {
    setIsHardwareSynced(true);
    localStorage.setItem('kavach_hardware_synced', 'true');
    setRegistered(true);
  };

  // 🛡️ MANDATORY BRIEFING: Force new users to watch the cinematic intro
  if (!hasSeenIntro && !trackId) return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: isIntroEnding ? 0 : 1 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-[1000000] overflow-hidden"
    >
      <video 
        autoPlay 
        playsInline
        muted
        onEnded={onIntroEnd}
        className="w-full h-full object-cover scale-[1.01]"
      >
        <source src="/kavachintro.mp4" type="video/mp4" />
      </video>
      
      {/* 🏛️ NATIONAL HUD OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      
      <div className="absolute bottom-12 left-0 right-0 text-center space-y-4">
         <div className="flex items-center justify-center gap-3">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
            <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.4em] italic">Tactical Briefing in Progress</p>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
         </div>
         <p className="text-[8px] text-white/20 font-bold uppercase tracking-[2px]">Synchronizing Sovereign Safety Matrix v4.2</p>
      </div>
      
      <div className="absolute top-10 left-10 flex items-center gap-3 opacity-40">
         <Shield size={20} className="text-white" />
         <div className="h-4 w-[1px] bg-white/20" />
         <span className="text-[8px] text-white font-black uppercase tracking-widest">KAVACH HQ</span>
      </div>
    </motion.div>
  );

  // 🛰️ VETERAN SYNC: High-speed loading for returning users
  if (loading && !trackId) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-6">
       <div className="w-16 h-16 border-4 border-gray-100 border-t-[#2563EB] rounded-full animate-spin shadow-inner" />
       <p className="text-xs font-bold text-gray-900 uppercase tracking-widest italic">Synchronizing Tactical Hub...</p>
    </div>
  );

  return (
    <>
      <SOSConfirmationOverlay />
      <WarningOverlay />
      <BanOverlay />
      <RemoteCommandListener />
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
            {!isLanguageSelected ? (
              <LanguageStep onNext={() => {
                localStorage.setItem('kavach_language_selected', 'true');
                setIsLanguageSelected(true);
              }} />
            ) : !user ? (
              <AuthScreen handleLogin={handleLogin} onResetLanguage={() => setIsLanguageSelected(false)} />
            ) : isSOSActive ? (
              <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />
            ) : user?.email === 'singh.sachin16559@gmail.com' ? (
              <Layout 
                isGhostMode={isGhostMode} 
                onToggleGhost={onToggleGhost} 
                activeTab={activeTab === 'dashboard' ? 'COMMAND' : activeTab} 
                setActiveTab={setActiveTab} 
                role="super_cell" 
                setRole={setRole} 
                setGender={() => { }}
              >
                <SuperCellDashboard viewMode={activeTab === 'dashboard' ? 'COMMAND' : activeTab} onTabChange={setActiveTab} />
              </Layout>
            ) : (!isRegistered || !isHardwareSynced) ? (
              <div className="w-full h-full">
                <Onboarding user={user} onComplete={handleOnboardingComplete} isReturningUser={isRegistered && !isHardwareSynced} />
              </div>
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

      {/* 🚀 GLOBAL TACTICAL SHELL (TRULY FIXED VIA PORTAL) */}
      {!isSOSActive && !isOverlayActive && !isSOSBlocked && user && !trackId && isRegistered && isHardwareSynced && createPortal(
        <>
          <motion.nav 
            initial={{ y: 120, opacity: 0 }}
            animate={{ 
              y: isNavVisible ? 0 : 120, 
              opacity: isNavVisible ? 1 : 0 
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 1000000,
              padding: '16px',
              paddingBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[40px] p-2 flex justify-between items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-auto">
              {role === 'citizen' && (
                <>
                  <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
                  <NavButton active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} icon={<Globe size={20} />} label="Radar" />
                  <NavButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<Users size={20} />} label="Guardians" />
                  <NavButton active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} icon={<Upload size={20} />} label="Vault" />
                </>
              )}
              {role === 'protector' && (
                <>
                  <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<MapPin size={20} />} label="Response" />
                  <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Users size={20} />} label="Community" />
                  <NavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={20} />} label="Safety Tips" />
                  <NavButton active={activeTab === 'grievance'} onClick={() => setActiveTab('grievance')} icon={<AlertTriangle size={20} />} label="Reports" />
                </>
              )}
              {role === 'admin' && (
                <>
                  <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Admin" />
                  <NavButton active={activeTab === 'verify'} onClick={() => setActiveTab('verify')} icon={<UserCheck size={20} />} label="Verify" />
                  <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Trophy size={20} />} label="Audits" />
                </>
              )}
            </div>
          </motion.nav>

          {role === 'citizen' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                bottom: '110px',
                scale: 1, 
                opacity: 1 
              }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ 
                position: 'fixed', 
                right: '24px', 
                zIndex: 1000000 
              }}
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
            {isAIChatOpen && (
              <KavachAIChat 
                isOpen={isAIChatOpen} 
                onClose={() => setIsAIChatOpen(false)} 
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
      <TacticalCallOverlay />
    </>
  );
}

function TabManager({ isGhostMode, onToggleGhost }: { isGhostMode: boolean, onToggleGhost: () => void }) {
  const { activeTab, role, isLocked, handleManualUnlock, isVerified } = useKavachStore();
  const isSystemAdmin = auth.currentUser?.email === 'singh.sachin16559@gmail.com';

  const renderTab = (tab: string) => {
    const isVisible = activeTab === tab;
    
    // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
    // Protectors are STRICTLY forbidden from accessing the Victim's SOS interface.
    if (role === 'protector' && tab === 'sos') return null;

    switch (tab) {
      case 'dashboard': 
        if (isVisible) {
          if (role === 'protector' && !isVerified && !useKavachStore.getState().isSOSActive) {
            return (
              <div key="pending" className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-full h-full bg-white rounded-full border border-blue-50 flex items-center justify-center shadow-2xl">
                    <Shield size={56} className="text-blue-500 animate-pulse" strokeWidth={1} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Vetting in Progress</h2>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[3px]">Institutional Validation Active</p>
                </div>
              </div>
            );
          }
          return <div key="dashboard" className="block">{role === 'protector' ? <ProtectorDashboard /> : isSystemAdmin ? <SuperCellDashboard /> : <DashboardScreen />}</div>;
        }
        return null;
      case 'map': return isVisible ? <div key="map" className="block h-[calc(100vh-210px)] w-full"><VictimMap /></div> : null;
      case 'sos': return (isVisible && role === 'citizen') ? <SOSScreen key="sos" isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} /> : null;
      case 'vault': return isVisible ? <div key="vault" className="max-w-2xl mx-auto"><EvidenceVault /></div> : null;
      case 'contacts': return isVisible ? <div key="contacts" className="max-w-2xl mx-auto"><EmergencyContacts /></div> : null;
      case 'radar': return isVisible ? <div key="radar" className="max-w-4xl mx-auto px-4"><ProtectorsRadarScreen /></div> : null;
      case 'rewards': return isVisible ? <div key="rewards" className="max-w-2xl mx-auto"><Rewards /></div> : null;
      case 'history': return isVisible ? <div key="history" className="max-w-4xl mx-auto px-4"><MissionHistoryScreen /></div> : null;
      case 'guide': return isVisible ? <div key="guide" className="max-w-4xl mx-auto px-4">{role === 'protector' ? <ProtectorGuideScreen /> : <GuideScreen />}</div> : null;
      case 'grievance': return isVisible ? <div key="grievance" className="max-w-4xl mx-auto px-4"><ProtectorGrievanceScreen /></div> : null;
      case 'protector_history': return isVisible ? <div key="protector_history" className="max-w-4xl mx-auto px-4"><ProtectorHistoryScreen /></div> : null;
      default: return null;
    }
  };

  // 🛡️ TACTICAL STACK SEPARATION
  const citizenStack = ['dashboard', 'radar', 'map', 'sos', 'vault', 'contacts', 'history'];
  const protectorStack = ['dashboard', 'radar', 'rewards', 'guide', 'grievance', 'protector_history'];
  const adminStack = ['dashboard', 'map', 'vault', 'history'];
  
  const currentStack = role === 'protector' ? protectorStack : role === 'admin' ? adminStack : citizenStack;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <React.Suspense fallback={<div className="p-20 text-center uppercase tracking-widest text-xs animate-pulse text-gray-400">Loading Node...</div>}>
        <div className="relative w-full h-full">{currentStack.map(tab => renderTab(tab))}</div>
      </React.Suspense>
    </div>
  );
}
