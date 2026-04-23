import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import SOSButton from './components/SOSButton';
import RakshakMap from './components/RakshakMap';
import EvidenceVault from './components/EvidenceVault';
import EmergencyContacts from './components/EmergencyContacts';
import Onboarding from './components/Onboarding';
import ProtectorDashboard from './components/ProtectorDashboard';
import SuperCellDashboard from './components/SuperCellDashboard';
import Rewards from './components/Rewards';
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

  const executeEmergencyBlast = async (data?: any) => {
    console.log("🚨 KAVACH EXECUTING EMERGENCY BLAST:", data || "MANUAL");
    
    // 1. TACTICAL VIBRATION: Confirm trigger to user instantly
    if (Capacitor.isNativePlatform()) {
      // Powerful triple pulse for confirmation
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 500]);
      // playActivationVoice(); // Assuming this helper exists in context or scope
    }

    // 2. CODE RED BYPASS: Fire SMS and Calls directly via Tunnel
    const KavachDirect = (window as any).KavachDirect;
    if (KavachDirect) {
      console.log("KAVACH: Engaging Direct Tunnel SOS Blast...");
      
      const guardiansStr = localStorage.getItem('emergency_contacts');
      const guardians = guardiansStr ? JSON.parse(guardiansStr) : [];
      const userPosStr = localStorage.getItem('kavach_last_pos') || "28.6139,77.2090";
      
      const mapLink = `https://www.google.com/maps?q=${userPosStr}`;
      const message = `🚨 CRITICAL EMERGENCY SOS (SHAKE TRIGGER) 🚨\nI am in danger! Help needed!\n\n📍 Location: ${mapLink}\n\n🛡️ Sent via KAVACH National Grid`;

      // SUPERCHARGE: Fire all guardians in parallel waves
      Promise.all(guardians.map(async (g: any) => {
        if (g.phone) {
          console.log(`SOS: Bypassing to send SMS to ${g.phone}`);
          KavachDirect.directSmsBypass(g.phone, message);
        }
      })).then(() => {
        if (guardians[0]?.phone) {
          console.log(`SOS: Bypassing to initiate Call to ${guardians[0].phone}`);
          KavachDirect.directCallBypass(guardians[0].phone);
        }
      });
    }
  };

  const [isGhostMode, setIsGhostMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [role, setRole] = useState<'citizen' | 'protector' | 'admin'>('citizen');
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [userPos, setUserPos] = useState<[number, number]>([28.6139, 77.2090]);
  const [authStatus, setAuthStatus] = useState<'idle' | 'signaling' | 'verifying' | 'locking' | 'saving' | 'error'>('idle');
  const [isHardwareSynced, setIsHardwareSynced] = useState<boolean>(() => {
    return localStorage.getItem('kavach_hardware_synced') === 'true';
  });
  const urlListenerRef = useRef<any>(null);

  useEffect(() => {
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

    // 🔗 CAPACITOR DEEP LINK HANDLER: Essential for Auth Redirects on Android
    const setupUrlListener = async () => {
      if (Capacitor.isNativePlatform()) {
        urlListenerRef.current = await CapApp.addListener('appUrlOpen', (data: any) => {
          console.log("KAVACH: Received Deep Link URL:", data.url);
          // If the URL contains an auth token/state, let Firebase JS SDK handle it
          // getRedirectResult will pick it up on the next tick
        });
      }
    };
    setupUrlListener();
    checkRedirect();
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. BRIDGE PULSE: Immediate execution for COLD START
      const pulseInterval = setInterval(async () => {
         try {
            const data = await KavachPlugin.consumeTrigger();
            if (data) {
               console.log("⚡ KAVACH COLD-START: Buffered Trigger Neutralized and Executed.");
               setIsLocked(false); // BYPASS LOCK ON EMERGENCY
               setActiveTab('sos');
               executeEmergencyBlast(data);
               clearInterval(pulseInterval);
            }
         } catch (e) {}
      }, 500);

      // Timeout pulse after 10 seconds to save resources
      setTimeout(() => clearInterval(pulseInterval), 10000);

      // 2. LIVE LISTENER: Catch real-time shakes (OPEN STATE)
      const sosListener = KavachPlugin.addListener('sosTriggered', async (data: any) => {
        console.log("🚨 KAVACH LIVE SHAKE: Executing Supercharged Blast.");
        setIsLocked(false); // BYPASS LOCK ON EMERGENCY
        setActiveTab('sos');
        await executeEmergencyBlast(data);
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
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              console.log('🚨 KAVACH Signal Received:', notification);
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

    const syncTelemetry = async () => {
      if (!user || !isRegistered) return;
      try {
        // Check if location permission is already granted before requesting
        // This prevents a surprise dialog mid-session that can crash the WebView
        if (Capacitor.isNativePlatform()) {
          const state = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
          if (state && state.state === 'denied') {
            console.warn('KAVACH Telemetry: Location permission denied. Skipping GPS sync.');
            return;
          }
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          });
        });

        setUserPos([position.coords.latitude, position.coords.longitude]);
        localStorage.setItem('kavach_last_pos', `${position.coords.latitude},${position.coords.longitude}`);

        const telemetryData = {
          coords: [position.coords.latitude, position.coords.longitude],
          battery: batteryLevel,
          lastSeen: serverTimestamp(),
          role,
          status: 'Optimal',
          accuracy: position.coords.accuracy,
          isOnline: navigator.onLine
        };

        await setDoc(doc(db, 'users', user.uid), {
          telemetry: telemetryData,
          lastActive: serverTimestamp()
        }, { merge: true });

        console.log('KAVACH Neural Link: Telemetry synced.');
      } catch (error) {
        // Silent fail — don't crash app if location is unavailable
        console.warn('KAVACH Telemetry Interrupted:', error);
      }
    };

    if (user && isRegistered) {
      // ⏱ Delay first telemetry by 5 seconds so:
      //   • Push notification dialog (fires at 3s) finishes first
      //   • App is fully rendered and stable
      //   • No simultaneous permission dialogs
      startTimer = setTimeout(() => {
        syncTelemetry();
        telemetryInterval = setInterval(syncTelemetry, 45000);
      }, 5000);
    }

    return () => {
      clearTimeout(startTimer);
      clearInterval(telemetryInterval);
    };
  }, [user, isRegistered, batteryLevel, role]);


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
            setIsRegistered(true);
            localStorage.setItem('kavach_role', userData.role || 'citizen');
            localStorage.setItem('kavach_gender', userData.gender || 'female');
            localStorage.setItem('kavach_phone', userData.phoneNumber || '');
            localStorage.setItem('kavach_aadhaar', userData.aadhaar || '');
            localStorage.setItem('kavach_uid', firebaseUser.uid);
          } else {
            console.log("KAVACH Auth: No Mission Profile. Redirecting to Onboarding.");
            setIsRegistered(false);
          }
        } catch (error) {
          console.error("KAVACH Auth: Firestore Check Failed:", error);
          setAuthStatus('error');
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setIsRegistered(false);
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
        setIsLocked(false);
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
        setIsLocked(false);
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

  const handleManualUnlock = async () => {
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Unlock KAVACH Shield",
        title: "Biometric Authentication",
        useFallback: true
      });
      setIsLocked(false);
    } catch (e) {
      console.warn("Manual unlock failed:", e);
    }
  };

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
    setIsRegistered(true);
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
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-accent-red rounded-xl flex items-center justify-center font-black text-4xl mx-auto shadow-2xl">K</div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">KAVACH Woman</h1>
              <p className="text-text-dim font-bold uppercase tracking-[3px] text-[10px] leading-relaxed max-w-[280px] mx-auto opacity-80">
                {t('national_grid')}
              </p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button 
              onClick={handleLogin}
              className="w-full py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl"
            >
              <LogIn size={20} /> {t('login_google')}
            </button>

            <div className="pt-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                Identity Anchoring via Neural Link <br/> Secured by KAVACH Defense Systems
              </p>
            </div>
          </motion.div>

          <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed text-center">
            By logging in, you agree to the KAVACH Protocol for real-time emergency response and evidence collection.
          </p>
        </div>
      </div>
    );
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
        <div className="min-h-screen bg-[#060000] flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-12">
            <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent-blue shadow-2xl">
              <Lock size={48} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{t('shield_locked')}</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-12 opacity-60">{t('identity_verification')}</p>
          <button 
            onClick={handleManualUnlock}
            className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-4 active:scale-95 transition-all shadow-2xl"
          >
            <Fingerprint size={20} /> {t('use_biometrics')}
          </button>
        </div>
      ) : (
        <CallProvider>
          <Layout 
            isGhostMode={isGhostMode} 
            onToggleGhost={() => setIsGhostMode(!isGhostMode)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            role={role}
            setRole={setRole}
            setGender={setGender}
          >
            <TabContent activeTab={activeTab} setActiveTab={setActiveTab} role={role} isGhostMode={isGhostMode} batteryLevel={batteryLevel} gender={gender} userPos={userPos} />
          </Layout>
        </CallProvider>
      ) }
    </>
  );
}

function Dashboard({ setActiveTab, batteryLevel, gender, userPos }: { setActiveTab: (tab: string) => void, batteryLevel: number | null, gender: 'female' | 'male' | null, userPos: [number, number] }) {
  const { t } = useLanguage();

  return (
    <div className="bento-grid">

      {/* National Neural Network Status */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-4 p-4 sm:p-6 bg-gradient-to-r from-card-bg to-[#0d0d0f] border-accent-blue/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(0,122,255,0.5)]" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-[3px] text-accent-blue">{t('neural_online')}</span>
          </div>
          <div className="flex gap-6 justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="text-[8px] text-text-dim font-bold uppercase tracking-wider">{t('background_sync') || "Background Sync"}</p>
              <p className="text-[10px] font-black italic text-green-500 uppercase tracking-tight">{t('active_persistent')}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[8px] text-text-dim font-bold uppercase tracking-wider">{t('threat_level')}</p>
              <p className="text-[10px] font-black italic text-accent-blue uppercase tracking-tight">{t('optimal_secure')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOS Hero Card - THE CORE TACTICAL COMPONENT */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1a0a0a_0%,#0F0F11_100%)] border-2 border-accent-red/10 min-h-[340px] shadow-2xl">
        <div className="bento-card-title absolute top-6 left-6 right-6">
          <span>{t('emergency_response')}</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-accent-red rounded-full animate-ping" />
            <div className="w-1 h-1 bg-accent-red rounded-full opacity-50" />
          </div>
        </div>
        
        {/* HARD LOCK: SOS only for Women */}
        {gender === 'female' ? (
          <SOSButton />
        ) : (
          <div className="text-center p-8 space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mx-auto shadow-inner">
              <Shield size={40} className="text-white opacity-20" />
            </div>
            <div>
              <h3 className="font-black italic uppercase text-accent-blue leading-tight mb-2 tracking-tighter text-xl">{t('tactical_disabled')}</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[2px] leading-relaxed max-w-[200px] mx-auto opacity-60">
                Unauthorized Identity detected. Emergency response reserved for authorized female citizens.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Safety Score & Leaderboard - MISSION TELEMETRY */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
        <section className="bento-card border-l-4 border-l-accent-blue">
          <div className="bento-card-title">
            <span>{t('neural_link_link')}</span>
            <Activity size={14} className="text-accent-blue animate-pulse" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black italic text-accent-blue leading-none uppercase tracking-tighter">{t('synced') || "SYNCED"}</div>
            <p className="text-[8px] text-gray-500 font-mono font-bold uppercase mt-3 tracking-widest opacity-60">
              LOC: {userPos?.[0]?.toFixed(3)}N / {userPos?.[1]?.toFixed(3)}E
            </p>
          </div>
        </section>

        <section className="bento-card border-l-4 border-l-green-600">
          <div className="bento-card-title">
            <span>{t('grid_status')}</span>
            <ShieldCheck size={14} className="text-green-600" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black italic text-green-600 leading-none tracking-tighter uppercase">{t('optimal_secure')?.split('/')[0] || "OPTIMAL"}</div>
            <p className="text-[8px] text-gray-500 font-mono font-bold uppercase mt-3 tracking-widest opacity-60">SHIELD: {t('verified') || "VERIFIED"}</p>
          </div>
        </section>
      </div>

      {/* Map Card */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 p-0 group overflow-hidden min-h-[240px]">
        <div className="absolute inset-0 z-10 pointer-events-none p-5">
          <div className="bento-card-title">
            <span>{t('rakshak_network')}</span>
            <MapIcon size={14} />
          </div>
        </div>
        <div className="h-full opacity-60 grayscale invert brightness-90 contrast-125 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 active:opacity-100 active:grayscale-0">
          <RakshakMap hideHeader />
        </div>
      </section>

      {/* Lower Tactical Grid */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
        {/* Vault Card */}
        <section className="bento-card aspect-square sm:aspect-auto flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('vault')}>
          <div className="bento-card-title">{t('vault')}</div>
          <div>
            <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white mb-2">
              <Lock size={18} />
            </div>
            <p className="text-lg font-black italic italic">4.2 GB</p>
            <p className="text-[8px] text-accent-blue font-bold uppercase tracking-widest mt-1">Encrypted Logs</p>
          </div>
        </section>

        {/* Guardians Card */}
        <section className="bento-card aspect-square sm:aspect-auto flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('contacts')}>
          <div className="bento-card-title">CIRCLE</div>
          <div>
            <div className="flex -space-x-2 mb-2">
              {[1, 2].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-card-bg bg-accent-blue/20 flex items-center justify-center text-[10px] font-bold">G{i}</div>
              ))}
            </div>
            <h3 className="text-sm font-black italic uppercase leading-none mb-1">Guardians</h3>
            <p className="text-[8px] text-text-dim font-bold uppercase tracking-widest">3 Active Links</p>
          </div>
        </section>
      </div>

      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-3 gap-4">
        <div className="bento-card-title col-span-3">MISSION TELEMETRY</div>
        <SensorStat value="ACTIVE" label={t('sensor_scanner')} />
        <SensorStat value="0.02G" label={t('sensor_gforce')} />
        <SensorStat value={batteryLevel ? `${batteryLevel}%` : "SYNC"} label={t('sensor_battery')} />
      </section>

      {/* Shield Protocols */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2">
        <div className="bento-card-title">DEFENSE PROTOCOLS</div>
        <div className="space-y-4 mt-6">
          <ShieldItem label={t('protocol_ai')} status="ACTIVE" />
          <ShieldItem label={t('protocol_mask')} status={t('verified') || "ENABLED"} />
        </div>
      </section>
    </div>
  );
}

function SensorStat({ value, label }: { value: string, label: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <span className="text-xl font-bold block">{value}</span>
      <span className="text-[9px] text-text-dim font-bold uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function ShieldItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
      <span className="text-[12px] text-text-dim">{label}</span>
      <span className="text-[10px] font-bold text-accent-blue tracking-widest">{status}</span>
    </div>
  );
}

function TabContent({ activeTab, setActiveTab, role, isGhostMode, batteryLevel, gender, userPos }: { activeTab: string, setActiveTab: (tab: string) => void, role: 'citizen' | 'protector' | 'admin', isGhostMode: boolean, batteryLevel: number | null, gender: 'female' | 'male' | null, userPos: [number, number] }) {
  const isAdmin = auth.currentUser?.email === 'singh.sachin16559@gmail.com';
  const isCitizenOnlyTab = ['sos', 'vault', 'ai', 'contacts'].includes(activeTab);
  
  if (isCitizenOnlyTab && role !== 'citizen') {
    if (role === 'admin' && isAdmin) return <SuperCellDashboard />;
    return <ProtectorDashboard />;
  }

  switch (activeTab) {
    case 'dashboard': 
      if (role === 'admin' && isAdmin) return <SuperCellDashboard />;
      return role === 'protector' ? <ProtectorDashboard /> : <Dashboard setActiveTab={setActiveTab} batteryLevel={batteryLevel} gender={gender} userPos={userPos} />;
    case 'sos': return <div className="max-w-md mx-auto"><SOSButton ghostMode={isGhostMode} /></div>;
    case 'map': return <div className="max-w-2xl mx-auto"><RakshakMap /></div>;
    case 'vault': return <div className="max-w-2xl mx-auto"><EvidenceVault /></div>;
    case 'contacts': return <div className="max-w-2xl mx-auto"><EmergencyContacts /></div>;
    case 'rewards': return <div className="max-w-2xl mx-auto"><Rewards /></div>;
    default: 
      if (role === 'admin' && isAdmin) return <SuperCellDashboard />;
      return role === 'protector' ? <ProtectorDashboard /> : <Dashboard setActiveTab={setActiveTab} batteryLevel={batteryLevel} gender={gender} userPos={userPos} />;
  }
}
