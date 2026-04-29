import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { syncTelemetry, startBackgroundTracking, watchLiveLocation } from './services/locationService';
import { useKavachStore } from './store/useKavachStore';
import { useEvidenceEngine } from './hooks/useEvidenceEngine';
import { useThreatSentinel } from './hooks/useThreatSentinel';
import { useProtectorSentinel } from './hooks/useProtectorSentinel';
import { useVoiceTrigger } from './hooks/useVoiceTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeBackgroundSentinel } from './services/BackgroundSentinelService';

// 🚀 TACTICAL CODE SPLITTING: Lazy load heavy modules to prevent Startup Black Screen
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
const GuideScreen = React.lazy(() => import('./screens/GuideScreen'));
const ProtectorGuideScreen = React.lazy(() => import('./screens/ProtectorGuideScreen'));
const ProtectorVerify = React.lazy(() => import('./components/ProtectorVerify'));
const DecoyCalculator = React.lazy(() => import('./components/DecoyCalculator'));
const ProtectorsRadarScreen = React.lazy(() => import('./screens/ProtectorsRadarScreen'));
const ProtectorGrievanceScreen = React.lazy(() => import('./screens/ProtectorGrievanceScreen'));
const LanguageStep = React.lazy(() => import('./components/onboarding/LanguageStep'));
import { Settings, AlertTriangle } from 'lucide-react';
import RemoteCommandListener from './components/RemoteCommandListener';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { useLanguage } from './contexts/LanguageContext';
import { CallProvider } from './contexts/CallContext';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { App as CapApp } from '@capacitor/app';
import { cn } from './lib/utils';

interface KavachNativePlugin {
  directCall(options: { number: string }): Promise<void>;
  sendSilentSMS(options: { number: string, message: string }): Promise<void>;
  updateGuardianContacts(options: { contacts: string }): Promise<void>;
  checkSafetyPermissions(): Promise<{ sms: string, call: string, battery: string }>;
  requestSensitivePermissions(): Promise<void>;
  startContinuousSiren(): Promise<void>;
  stopContinuousSiren(): Promise<void>;
  startForensicCapture(): Promise<void>;
  stopForensicCapture(): Promise<void>;
  triggerHapticPulse(): Promise<void>;
  addListener(eventName: string, listenerFunc: (data: any) => void): { remove: () => void };
}
const KavachNative = registerPlugin<KavachNativePlugin>('KavachPlugin');

export default function App() {
  const [showFailSafe, setShowFailSafe] = useState(false);
  const handleHardReset = () => { localStorage.clear(); window.location.reload(); };
  const {
    user, setUser, role, setRole, setGender, isRegistered, setRegistered, setVerified,
    userPos, setUserPos, batteryLevel, isLocked, isSOSActive,
    activeTab, setActiveTab, setSOSActive, loading, setLoading,
    handleManualUnlock, isFakeCallActive, setFakeCallActive, setGuardianCache,
    isHubReady, setHubReady
  } = useKavachStore();

  const [superCellViewMode, setSuperCellViewMode] = useState<'OPS' | 'GATEKEEPER' | 'JUSTICE' | 'LEADERBOARD' | 'ALL'>('ALL');
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

  const [isHardwareSynced, setIsHardwareSynced] = useState<boolean>(() => localStorage.getItem('kavach_hardware_synced') === 'true');
  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(() => localStorage.getItem('kavach_language_selected') === 'true');

  useEffect(() => {
    const wasSOSActive = localStorage.getItem('kavach_sos_active') === 'true';
    if (wasSOSActive) {
      setActiveTab('sos');
      setSOSActive(true, localStorage.getItem('kavach_active_alert_id'));
    }

    // 🛡️ Initialize Strategic Background Sentinel for SOS Intercepts
    initializeBackgroundSentinel();

    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        KavachNative.addListener('sosTriggered', (data: { source: string }) => {
          setActiveTab('sos');
          setSOSActive(true, null, (data.source as any) || 'shake');
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
        activePulse = await watchLiveLocation((pos, acc) => {
          setUserPos(pos);
          syncTelemetry(user.uid, role, batteryLevel, pos, acc);
        });
        startBackgroundTracking(user.uid);
      }
    };
    startTracking();

    const handleAppChange = async (state: { isActive: boolean }) => {
      if (!state.isActive && user && isRegistered) startBackgroundTracking(user.uid);
    };
    const listener = CapApp.addListener('appStateChange', handleAppChange);

    return () => {
      if (activePulse) {
        const { watchId, pulseInterval } = activePulse;
        watchId.then((id: string) => Geolocation.clearWatch({ id }));
        clearInterval(pulseInterval);
      }
      listener.then(l => l.remove());
    };
  }, [user, isRegistered, isHardwareSynced]);

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

        unsubProfile = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setRole(data.role || 'citizen');
            setRegistered(data.isRegistered === true);
            setVerified(data.isVerified || false);
            setGender(data.gender || 'female');
            console.log("🛡️ KAVACH: Identity Synced.");
          } else {
            setRegistered(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("🛡️ KAVACH: Profile Sync Error:", error);
          setLoading(false);
        });

        const gSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'guardians'));
        const guardianList = gSnap.docs.map(d => ({ phone: d.data().phone }));
        setGuardianCache(guardianList);

        if (Capacitor.isNativePlatform() && guardianList.length > 0) {
          KavachNative.updateGuardianContacts({ contacts: JSON.stringify(guardianList) }).catch(() => { });
        }
      } else {
        setUser(null);
        setRegistered(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const syncLocation = async () => {
    const loc = await useKavachStore.getState().syncLocation();
    if (loc) setUserPos(loc);
  };

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
    }
  };

  const handleOnboardingComplete = async () => {
    setIsHardwareSynced(true);
    localStorage.setItem('kavach_hardware_synced', 'true');
    setRegistered(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
      <div className="text-accent-blue font-black uppercase text-xs animate-pulse tracking-[4px]">Syncing Mission Hub...</div>
      {showFailSafe && (
        <button onClick={handleHardReset} className="px-6 py-3 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-red hover:text-white transition-all shadow-lg">Reset Session Node</button>
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      <CallProvider>
        <RemoteCommandListener />
        <React.Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center text-accent-blue font-black uppercase text-xs animate-pulse italic tracking-[4px]">Initializing KAVACH Hub...</div>}>
          {isFakeCallActive && <FakeCallUI onEnd={() => setFakeCallActive(false)} />}
          {!isLanguageSelected ? (
            <LanguageStep onNext={() => {
              localStorage.setItem('kavach_language_selected', 'true');
              setIsLanguageSelected(true);
            }} />
          ) : !user ? (
            <AuthScreen handleLogin={handleLogin} onResetLanguage={() => setIsLanguageSelected(false)} />
          ) : user?.email === 'singh.sachin16559@gmail.com' ? (
            <Layout isGhostMode={isGhostMode} onToggleGhost={onToggleGhost} activeTab={superCellViewMode === 'LEADERBOARD' ? 'rewards' : 'dashboard'} setActiveTab={(tab) => {
              if (tab === 'dashboard') setSuperCellViewMode('OPS');
              if (tab === 'rewards') setSuperCellViewMode('LEADERBOARD');
            }} role="super_cell" setRole={setRole} setGender={() => { }}>
              {superCellViewMode === 'LEADERBOARD' ? <Rewards /> : <SuperCellDashboard viewModeOverride={superCellViewMode} onTabChange={(m) => setSuperCellViewMode(m)} />}
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
        </React.Suspense>
      </CallProvider>
    </ErrorBoundary>
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
      case 'guide': return isVisible ? <div key="guide" className="max-w-4xl mx-auto px-4">{role === 'protector' ? <ProtectorGuideScreen /> : <GuideScreen />}</div> : null;
      case 'grievance': return isVisible ? <div key="grievance" className="max-w-4xl mx-auto px-4"><ProtectorGrievanceScreen /></div> : null;
      default: return null;
    }
  };
  const stack = ['dashboard', 'map', 'sos', 'vault', 'contacts', 'special_cell', 'radar', 'rewards', 'guide', 'grievance'];
  return (
    <div className="relative w-full h-full overflow-hidden">
      <React.Suspense fallback={<div className="flex items-center justify-center p-20 text-[10px] font-black uppercase tracking-[4px] animate-pulse">Syncing Mission Node...</div>}>
        <div className="relative w-full h-full">{stack.map(tab => renderTab(tab))}</div>
      </React.Suspense>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-600/20 border border-red-600/30 rounded-2xl flex items-center justify-center text-red-500 mb-6"><AlertTriangle size={32} /></div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Neural Glitch Detected</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-8">System node collapsed. Re-initiating uplink.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] italic">Re-Launch Kavach</button>
        </div>
      );
    }
    return this.props.children;
  }
}
