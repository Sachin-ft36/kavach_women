import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { syncTelemetry, startBackgroundTracking, watchLiveLocation } from './services/locationService';
import { useKavachStore } from './store/useKavachStore';
import { useEvidenceEngine } from './hooks/useEvidenceEngine';
import { useThreatSentinel } from './hooks/useThreatSentinel';
import { useProtectorSentinel } from './hooks/useProtectorSentinel';
import { useVoiceTrigger } from './hooks/useVoiceTrigger';
import { useAudioAI } from './hooks/useAudioAI';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeBackgroundSentinel } from './services/BackgroundSentinelService';

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
const SpecialCellScreen = React.lazy(() => import('./screens/SpecialCellScreen'));
const MissionHistoryScreen = React.lazy(() => import('./screens/MissionHistoryScreen'));
const GuideScreen = React.lazy(() => import('./screens/GuideScreen'));
const ProtectorGuideScreen = React.lazy(() => import('./screens/ProtectorGuideScreen'));
const ProtectorVerify = React.lazy(() => import('./components/ProtectorVerify'));
const DecoyCalculator = React.lazy(() => import('./components/DecoyCalculator'));
const ProtectorsRadarScreen = React.lazy(() => import('./screens/ProtectorsRadarScreen'));
const ProtectorGrievanceScreen = React.lazy(() => import('./screens/ProtectorGrievanceScreen'));
const ProtectorHistoryScreen = React.lazy(() => import('./screens/ProtectorHistoryScreen'));
const LanguageStep = React.lazy(() => import('./components/onboarding/LanguageStep'));
const TrackScreen = React.lazy(() => import('./screens/TrackScreen'));

import { Settings, AlertTriangle } from 'lucide-react';
import RemoteCommandListener from './components/RemoteCommandListener';
import StealthOverlay from './components/StealthOverlay';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { CallProvider } from './contexts/CallContext';
import { TacticalCallOverlay } from './components/TacticalCallOverlay';
import { auth, googleProvider, db, resetKavachState } from './firebase';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, onSnapshot, query, where, terminate } from 'firebase/firestore';
import { App as CapApp } from '@capacitor/app';
import { cn } from './lib/utils';

const KavachNative = registerPlugin<any>('KavachPlugin');

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
  }
};

export default function App() {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [showFailSafe, setShowFailSafe] = useState(false);
  const handleHardReset = () => { localStorage.clear(); window.location.reload(); };
  const {
    user, setUser, role, setRole, setGender, isRegistered, setRegistered, setVerified,
    userPos, setUserPos, batteryLevel, isLocked, isSOSActive,
    activeTab, setActiveTab, setSOSActive, loading, setLoading,
    handleManualUnlock, isFakeCallActive, setFakeCallActive, setGuardianCache,
    isHubReady, setHubReady, setSafetyPin, performanceMode, setProfile
  } = useKavachStore();

  const [superCellViewMode, setSuperCellViewMode] = useState<'OPS' | 'GATEKEEPER' | 'JUSTICE' | 'LEADERBOARD' | 'ALL' | 'COMMS'>('ALL');
  const [isGhostMode, setIsGhostMode] = useState<boolean>(() => localStorage.getItem('kavach_ghost_mode') === 'true');

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
  useAudioAI();

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

  useEffect(() => {
    // 🛰️ GUARDIAN LINK DETECTION
    const path = window.location.pathname;
    if (path.startsWith('/track/')) {
      const id = path.split('/')[2];
      if (id) setTrackId(id);
    }

    initializeBackgroundSentinel();

    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        await PushNotifications.requestPermissions();
        KavachNative.addListener('sosTriggered', (data: { source: string }) => {
          const { setShadowActive } = useKavachStore.getState();
          if (data.source === 'shadow') {
            setShadowActive(true);
            KavachSafe.startForensicCapture();
          } else {
            setActiveTab('sos');
            setSOSActive(true, null, (data.source as any) || 'shake');
          }
        });
        setHubReady(true);
      }, 2000);
    } else {
      setHubReady(true);
    }
  }, []);

  useEffect(() => {
    let activePulse: { watchId: any, pulseInterval: any } | null = null;
    const startTracking = async () => {
      if (user && isRegistered && isHardwareSynced && isHubReady) {
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
  }, [user, isRegistered, isHardwareSynced, performanceMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowFailSafe(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
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
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e) {
      console.error("KAVACH Login Error:", e);
      toast.error("Login failed. Please check your browser's popup blocker.");
    }
  };

  const handleOnboardingComplete = async () => {
    setIsHardwareSynced(true);
    localStorage.setItem('kavach_hardware_synced', 'true');
    setRegistered(true);
  };

  if (loading && !trackId) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8 p-10 text-center">
      <div className="w-20 h-20 bg-white border border-[#E5E7EB] rounded-[32px] flex items-center justify-center shadow-2xl shadow-gray-100 animate-pulse">
         <div className="w-10 h-10 border-[4px] border-[#2563EB]/10 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
      <p className="text-sm text-gray-400 font-semibold italic">Synchronizing with National Safety Network...</p>
    </div>
  );

  return (
    <CallProvider>
      <StealthOverlay />
      <RemoteCommandListener />
      <TacticalCallOverlay />
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
            ) : isSOSActive ? (
              <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />
            ) : (!isRegistered || !isHardwareSynced) ? (
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Onboarding user={user} onComplete={handleOnboardingComplete} isReturningUser={isRegistered && !isHardwareSynced} />
                </motion.div>
              </AnimatePresence>
            ) : (isLocked && activeTab !== 'sos') ? (
              <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />
            ) : (
              <Layout isGhostMode={isGhostMode} onToggleGhost={onToggleGhost} activeTab={activeTab} setActiveTab={setActiveTab} role={role} setRole={setRole} setGender={() => { }}>
                <TabManager isGhostMode={isGhostMode} onToggleGhost={onToggleGhost} />
              </Layout>
            )}
          </>
        )}
      </React.Suspense>
    </CallProvider>
  );
}

function TabManager({ isGhostMode, onToggleGhost }: { isGhostMode: boolean, onToggleGhost: () => void }) {
  const { activeTab, role, isLocked, handleManualUnlock } = useKavachStore();
  const isSystemAdmin = auth.currentUser?.email === 'singh.sachin16559@gmail.com';
  const renderTab = (tab: string) => {
    const isVisible = activeTab === tab;
    switch (tab) {
      case 'dashboard': return <div key="dashboard" className={isVisible ? "block" : "hidden"}>{role === 'protector' ? <ProtectorDashboard /> : isSystemAdmin ? <SuperCellDashboard /> : <DashboardScreen />}</div>;
      case 'map': return isVisible ? <div key="map" className="block h-[calc(100vh-210px)] w-full"><VictimMap /></div> : null;
      case 'sos': return isVisible ? <SOSScreen key="sos" isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} /> : null;
      case 'vault': return isVisible ? <div key="vault" className="max-w-2xl mx-auto"><EvidenceVault /></div> : null;
      case 'contacts': return isVisible ? <div key="contacts" className="max-w-2xl mx-auto"><EmergencyContacts /></div> : null;
      case 'special_cell': return isVisible ? <div key="special_cell" className="max-w-2xl mx-auto"><SpecialCellScreen /></div> : null;
      case 'radar': return isVisible ? <div key="radar" className="max-w-4xl mx-auto px-4"><ProtectorsRadarScreen /></div> : null;
      case 'rewards': return isVisible ? <div key="rewards" className="max-w-2xl mx-auto"><Rewards /></div> : null;
      case 'history': return isVisible ? <div key="history" className="max-w-4xl mx-auto px-4"><MissionHistoryScreen /></div> : null;
      case 'guide': return isVisible ? <div key="guide" className="max-w-4xl mx-auto px-4">{role === 'protector' ? <ProtectorGuideScreen /> : <GuideScreen />}</div> : null;
      case 'grievance': return isVisible ? <div key="grievance" className="max-w-4xl mx-auto px-4"><ProtectorGrievanceScreen /></div> : null;
      case 'protector_history': return isVisible ? <div key="protector_history" className="max-w-4xl mx-auto px-4"><ProtectorHistoryScreen /></div> : null;
      default: return null;
    }
  };
  const stack = ['dashboard', 'map', 'sos', 'vault', 'contacts', 'special_cell', 'radar', 'rewards', 'guide', 'grievance', 'history', 'protector_history'];
  return (
    <div className="relative w-full h-full overflow-hidden">
      <React.Suspense fallback={<div className="p-20 text-center uppercase tracking-widest text-xs animate-pulse text-gray-400">Loading Node...</div>}>
        <div className="relative w-full h-full">{stack.map(tab => renderTab(tab))}</div>
      </React.Suspense>
    </div>
  );
}
