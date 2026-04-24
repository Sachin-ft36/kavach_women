import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import SOSButton from './components/SOSButton';
import VictimMap from './components/maps/VictimMap';
import EvidenceVault from './components/EvidenceVault';
import EmergencyContacts from './components/EmergencyContacts';
import Onboarding from './components/Onboarding';
import ProtectorDashboard from './components/ProtectorDashboard';
import SuperCellDashboard from './components/SuperCellDashboard';
import Rewards from './components/Rewards';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import SOSScreen from './screens/SOSScreen';
import SpecialCellScreen from './screens/SpecialCellScreen';
import ProtectorVerify from './components/ProtectorVerify';
import DecoyCalculator from './components/DecoyCalculator';
import ProtectorsRadarScreen from './screens/ProtectorsRadarScreen';
import { syncTelemetry, startBackgroundTracking } from './services/locationService';
import { executeEmergencyBlast } from './services/sosService';
import { useKavachStore } from './store/useKavachStore';
import { useEvidenceEngine } from './hooks/useEvidenceEngine';
import { useThreatSentinel } from './hooks/useThreatSentinel';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, MapPin, Camera, AlertTriangle, LayoutDashboard, Users, Languages, LogIn, Fingerprint, TrendingUp, Trophy, Map as MapIcon, ChevronRight, Navigation, Phone, Activity, Smartphone, ShieldCheck } from 'lucide-react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { CallProvider } from './contexts/CallContext';
import { Language } from './lib/translations';
import { cn } from './lib/utils';
import { auth, googleProvider, db } from './firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signInAnonymously, 
  User as FirebaseUser,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// TACTICAL PLUGIN ANCHOR: Must be registered in global scope for reliable neural link
const KavachPlugin = registerPlugin<any>('KavachPlugin');

export default function App() {
  const { t } = useLanguage();

  // Emergency Blast logic moved to sosService.ts

  const {
    user, setUser,
    role, setRole,
    gender, setGender,
    isRegistered, setRegistered,
    isVerified, setVerified,
    userPos, setUserPos,
    batteryLevel, setBatteryLevel,
    isLocked, setLocked,
    biometricAvailable, setBiometricAvailable,
    isGhostMode, setGhostMode,
    activeTab, setActiveTab,
    isSOSActive, setSOSActive,
    loading, setLoading,
    handleManualUnlock,
  } = useKavachStore();

  useEvidenceEngine();
  useThreatSentinel();

  const [authStatus, setAuthStatus] = useState<'idle' | 'signaling' | 'verifying' | 'locking' | 'saving' | 'error'>('idle');
  const [isHardwareSynced, setIsHardwareSynced] = useState<boolean>(() => {
    return localStorage.getItem('kavach_hardware_synced') === 'true';
  });
  const urlListenerRef = useRef<any>(null);

  useEffect(() => {
    // PHOENIX PROTOCOL: Detect SOS-in-progress during cold start/crash
    const wasSOSActive = localStorage.getItem('kavach_sos_active') === 'true';
    const savedAlertId = localStorage.getItem('kavach_active_alert_id');
    if (wasSOSActive && savedAlertId) {
      console.log("🛡️ KAVACH Phoenix Protocol: Resuming interrupted mission.");
      setActiveTab('sos');
      setSOSActive(true, savedAlertId);
    }

    // Check for redirect result on mount
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("KAVACH Auth: Mission Profile Synchronized via Redirect.");
        }
      } catch (error: any) {
        if (error.code !== 'auth/invalid-pending-token') {
          console.error("Redirect Login Error:", error);
        }
      }
    };

    checkRedirect();

    // 📡 MISSION SYNC SENTINEL: Detects network return and flushes local evidence vault
    const handleReconnection = async () => {
      console.log("📡 KAVACH: Network Link Re-established. Synchronizing local evidence...");
      if (Capacitor.isNativePlatform()) {
        const KavachNative = registerPlugin<any>('KachPlugin');
        KavachNative.syncEvidence().catch(() => {});
      }
    };
    window.addEventListener('online', handleReconnection);

    return () => {
      window.removeEventListener('online', handleReconnection);
      if (urlListenerRef.current) urlListenerRef.current.remove();
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. BRIDGE PULSE: Immediate execution for COLD START
      const pulseInterval = setInterval(async () => {
         try {
            const data = await KavachPlugin.consumeTrigger();
            if (data) {
               console.log("⚡ KAVACH COLD-START: Buffered Trigger Neutralized and Executed.");
               setLocked(false); // BYPASS LOCK ON EMERGENCY
               setActiveTab('sos');
               executeEmergencyBlast(user, userPos, data);
               clearInterval(pulseInterval);
            }
         } catch (e) {}
      }, 500);

      // Timeout pulse after 10 seconds to save resources
      setTimeout(() => clearInterval(pulseInterval), 10000);

      // 2. LIVE LISTENER: Catch real-time shakes (OPEN STATE)
      const sosListener = KavachPlugin.addListener('sosTriggered', async (data: any) => {
        console.log("🚨 KAVACH LIVE SHAKE: Executing Supercharged Blast.");
        setLocked(false); // BYPASS LOCK ON EMERGENCY
        setActiveTab('sos');
        await executeEmergencyBlast(user, userPos, data);
      });

      // Delay push notification request so it doesn't collide with
      // location or camera dialogs that fire at the same time.
      // Android WebView crashes when multiple permission dialogs fire simultaneously.
      const setupPush = async () => {
        try {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            PushNotifications.addListener('registration', (token) => {
              localStorage.setItem('kavach_fcm_token', token.value);
            });
            PushNotifications.addListener('pushNotificationReceived', async (notification) => {
              console.log('🚨 KAVACH Signal Received:', notification);
              
              // TACTICAL SIREN: If this is a nearby SOS alert for a Protector
              if (notification.data?.type === 'VICTIM_SOS_SIGNAL' || notification.title?.includes('SOS')) {
                console.log("🛡️ MISSION CRITICAL: Remote Triggering Hardware Siren...");
                try {
                  await KavachPlugin.triggerAlarmStation({
                    title: "🚨 URGENT: RESCUE MISSION",
                    body: "A victim needs help within 1km! Tap to intercept.",
                    sound: "police_siren_persistent",
                    importance: 'high'
                  });
                } catch (e) {
                  // Fallback: Start local continuous siren if plugin allows
                  if (KavachPlugin.startContinuousSiren) KavachPlugin.startContinuousSiren();
                }
              }
            });
          }
        } catch (e) {
          console.warn('Push Grid Initialization Failed:', e);
        }
      };

      // ⏱ SEQUENTIAL PERMISSION QUEUE:
      // Wait 3 seconds for app to fully render before asking for notifications.
      // This prevents the WebView crash from simultaneous dialogs.
      const pushTimer = setTimeout(setupPush, 3000);

      return () => {
        clearTimeout(pushTimer);
        sosListener.then((l: any) => l.remove());
      };
    }
  }, []);

  // Remove SafeWalk listeners logic

  useEffect(() => {
    let telemetryInterval: NodeJS.Timeout;
    let startTimer: NodeJS.Timeout;

    const runSync = async () => {
      const pos = await syncTelemetry(user, role, batteryLevel);
      if (pos) setUserPos(pos);
    };

    if (user && isRegistered) {
      // 🛰️ START BACKGROUND SENTINEL
      startBackgroundTracking(user.uid);

      // PILLAR 2: ADAPTIVE TACTICAL FREQUENCY (45s Normal / 3s SOS)
      const missionFrequency = isSOSActive ? 3000 : 45000;

      // Sequential delay to avoid permission dialog collisions
      startTimer = setTimeout(() => {
        runSync();
        telemetryInterval = setInterval(runSync, missionFrequency);
      }, 5000);
    }

    return () => {
      clearTimeout(startTimer);
      clearInterval(telemetryInterval);
    };
  }, [user, isRegistered, batteryLevel, role, isSOSActive]);


  useEffect(() => {
    // DEADBOLT: Force loading to false if Firebase takes more than 10 seconds (Domain/Auth issues)
    const authTimeout = setTimeout(() => {
      if (loading) {
        console.warn("KAVACH: Auth Link timed out. Forcing UI render.");
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(authTimeout); // Reset timeout if it works
      console.log("KAVACH Auth: State Change Detected. User:", firebaseUser?.email || "NOT_LOGGED_IN");
      if (firebaseUser) {
        try {
          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("KAVACH Auth: Verified Citizen Profile Found.");
            setRole(userData.role || 'citizen');
            setGender(userData.gender || 'female');
            setRegistered(true);
            setVerified(userData.isVerified || false);
            
            localStorage.setItem('kavach_role', userData.role || 'citizen');
            localStorage.setItem('kavach_gender', userData.gender || 'female');
            localStorage.setItem('kavach_phone', userData.phoneNumber || '');
            localStorage.setItem('kavach_aadhaar', userData.aadhaar || '');
            localStorage.setItem('kavach_uid', firebaseUser.uid);
          } else {
            console.log("KAVACH Auth: No Mission Profile. Redirecting to Onboarding.");
            setRegistered(false);
          }
        } catch (error) {
          console.error("KAVACH Auth: Firestore Check Failed:", error);
          setAuthStatus('error');
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setRegistered(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
      if (urlListenerRef.current) urlListenerRef.current.remove();
    };
  }, []);

  const isUnlocking = useRef(false);
  const lastSuccessTime = useRef<number>(0);
  const hasCheckedBiometrics = useRef(false);
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const performBiometricUnlock = async () => {
      // 1. Critical Safeguard: Avoid double-prompts using a 3-second grace window
      const now = Date.now();
      if (now - lastSuccessTime.current < 3000) {
        console.log("KAVACH: Biometric Grace Window Active. Skipping Prompt.");
        setLocked(false);
        return;
      }

      if (!isLocked || isUnlocking.current) return;
      
      isUnlocking.current = true;
      try {
        await NativeBiometric.verifyIdentity({
          reason: "Unlock KAVACH Shield",
          title: "Biometric Authentication",
          subtitle: "Identity Verification Required",
          description: "Scan fingerprint to access the safety network.",
          useFallback: true
        });
        
        lastSuccessTime.current = Date.now();
        setLocked(false);
        console.log("KAVACH: Neural Gate Unlocked successfully.");
      } catch (e) {
        console.error("Biometric verification failed:", e);
      } finally {
        isUnlocking.current = false;
      }
    };

    // Auto-trigger biometric prompt if locked
    if (isLocked && !isUnlocking.current) {
        performBiometricUnlock();
    }

    const checkBiometricAvailability = async () => {
      if (!Capacitor.isNativePlatform()) return;
      if (hasCheckedBiometrics.current) return;
      try {
        const result = await NativeBiometric.isAvailable();
        // Only store availability — do NOT lock app on open.
        // Biometric is ONLY used in SOSButton to deactivate SOS.
        setBiometricAvailable(!!result.isAvailable);
        hasCheckedBiometrics.current = true;
      } catch (e) {
        console.warn("Biometric check failed:", e);
      }
    };

    checkBiometricAvailability();

    // App resume/background tracking (no biometric lock on resume)
    const handleAppBackgrounded = () => {
      backgroundTimeRef.current = Date.now();
    };
    const handleAppResumed = () => {
      backgroundTimeRef.current = null;
    };

    let resumeListener: any;
    const setupListener = async () => {
      resumeListener = await CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) handleAppResumed();
        else handleAppBackgrounded();
      });
    };
    setupListener();

    return () => {
      if (resumeListener) resumeListener.remove();
    };
  }, [user, isRegistered]);

  // Manual unlock logic moved to store/useKavachStore.ts

  useEffect(() => {
    const getBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        }
      } catch (e) {
        console.warn("Battery API not supported or blocked.");
      }
    };
    getBattery();
  }, []);

  const handleLogin = async () => {
    try {
      console.log("KAVACH Auth: Initiating Google Sign-In Sequence...");
      setAuthStatus('signaling');
      
      if (Capacitor.isNativePlatform()) {
        try {
          // Attempt high-speed Native Handshake
          const result = await FirebaseAuthentication.signInWithGoogle();
          console.log("KAVACH Auth: Native Sign-In Success. Clipping token for JS sync...");
          
          if (result.credential?.idToken) {
            const { signInWithCredential, GoogleAuthProvider } = await import('firebase/auth');
            const credential = GoogleAuthProvider.credential(result.credential.idToken);
            await signInWithCredential(auth, credential);
            console.log("KAVACH Auth: JS Layer Synced.");
          }
        } catch (nativeError: any) {
          // TACTICAL FALLBACK: If native handshake fails (Play Services/Sync issue), use Popup
          console.warn("Native Auth Failed, engaging Popup Fallback:", nativeError);
          
          try {
            // Using Popup instead of Redirect to ensure the user stays inside the app context
            await signInWithPopup(auth, googleProvider);
          } catch (popupError: any) {
             console.error("Popup Fallback failed:", popupError);
             throw popupError;
          }
        }
      } else {
        // Web Environment: Standard Popup flow
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked') {
            console.log("Popup blocked. Switching to Redirect flow...");
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error: any) {
      console.error("KAVACH Auth Error Detail:", error);
      setAuthStatus('error');
      
      // Provide clear guidance on why the login might have failed
      const errorCode = error.code || 'unknown';
      const errorMessage = error.message || JSON.stringify(error);
      
      alert(`Neural Link Failed: ${errorCode}\n\nReason: ${errorMessage}\n\nPlease ensure Google Play Services is updated and your phone's Time/Date is correct.`);
    } finally {
      setAuthStatus('idle');
    }
  };

  const playActivationVoice = () => {
    try {
      const utterance = new SpeechSynthesisUtterance("Kavach system activated");
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      // Filter for a more digital/neutral voice if available
      const voices = window.speechSynthesis.getVoices();
      const aiVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural')));
      if (aiVoice) utterance.voice = aiVoice;
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Tactical Audio Failed:", e);
    }
  };

  const handleOnboardingComplete = () => {
    console.log("KAVACH: Mission Onboarding Success. Finalizing Core Systems.");
    setRegistered(true);
    setIsHardwareSynced(true);
    localStorage.setItem('kavach_hardware_synced', 'true');
    playActivationVoice();
    const savedRole = (localStorage.getItem('kavach_role') as 'citizen' | 'protector' | 'admin') || 'citizen';
    const savedGender = (localStorage.getItem('kavach_gender') as 'female' | 'male') || 'female';
    setRole(savedRole);
    setGender(savedGender);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin shadow-2xl" />
        <div className="text-center animate-pulse">
           <p className="text-[10px] font-black italic uppercase tracking-[4px] text-accent-blue">{t('neural_link') || "Neural Link"}</p>
           <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-2">{t('verifying_mission') || "Verifying Mission Profile..."}</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-accent-red/10 border border-accent-red/20 rounded-2xl flex items-center justify-center text-accent-red mb-8">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Neural Sync Failure</h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] leading-relaxed max-w-[280px] mb-8">
          Unable to anchor mission profile to the national grid. Please check your tactical data connection.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-2xl"
        >
          Retry Neural Link
        </button>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen handleLogin={handleLogin} />;
  }

  return (
    <>
      {(!isRegistered || !isHardwareSynced) ? (
        <Onboarding 
          user={user} 
          onComplete={handleOnboardingComplete} 
          isReturningUser={isRegistered && !isHardwareSynced} 
        />
      ) : (isLocked && activeTab !== 'sos') ? (
        <SOSScreen 
          isLocked={isLocked} 
          activeTab={activeTab} 
          isGhostMode={isGhostMode} 
          handleManualUnlock={handleManualUnlock} 
        />
      ) : (
        <CallProvider>
          <Layout 
            isGhostMode={isGhostMode} 
            onToggleGhost={() => setGhostMode(!isGhostMode)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            role={role}
            setRole={setRole}
            setGender={setGender}
          >
            <TabContent />
          </Layout>
        </CallProvider>
      ) }
    </>
  );
}

// DashboardScreen replaces Dashboard, SensorStat, and ShieldItem

function TabContent() {
  const { 
    activeTab, 
    setActiveTab, 
    role, 
    isGhostMode, 
    batteryLevel, 
    gender, 
    userPos,
    isLocked,
    handleManualUnlock
  } = useKavachStore();
  
  const isAdmin = auth.currentUser?.email === 'singh.sachin16559@gmail.com';
  const isCitizenOnlyTab = ['sos', 'vault', 'ai', 'contacts'].includes(activeTab);
  
  if (isCitizenOnlyTab && role !== 'citizen') {
    if (role === 'admin' && isAdmin) return <SuperCellDashboard />;
    return <ProtectorDashboard />;
  }

  switch (activeTab) {
    case 'dashboard': 
      if (role === 'admin' && isAdmin) return <SuperCellDashboard />;
      return role === 'protector' ? <ProtectorDashboard /> : <DashboardScreen />;
    case 'sos': return <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />;
    case 'map': return <div className="h-[calc(100vh-210px)] w-full"><VictimMap /></div>;
    case 'vault': return <div className="max-w-2xl mx-auto"><EvidenceVault /></div>;
    case 'contacts': return <div className="max-w-2xl mx-auto"><EmergencyContacts /></div>;
    case 'special_cell': return <div className="max-w-2xl mx-auto"><SpecialCellScreen /></div>;
    case 'decoy': return <div className="max-w-2xl mx-auto"><DecoyCalculator /></div>;
    case 'rewards': return <div className="max-w-2xl mx-auto"><Rewards /></div>;
    case 'radar': return <div className="max-w-4xl mx-auto px-4"><ProtectorsRadarScreen /></div>;
    case 'verify': return role === 'admin' && isAdmin ? <div className="max-w-4xl mx-auto"><ProtectorVerify /></div> : <ProtectorDashboard />;
    default: 
      if (role === 'admin' && isAdmin) return <SuperCellDashboard />;
      return role === 'protector' ? <ProtectorDashboard /> : <DashboardScreen />;
  }
}
