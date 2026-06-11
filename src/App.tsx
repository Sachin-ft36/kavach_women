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
import { siriEmergencyService } from './services/siriService';
import SOSConfirmationOverlay from './components/SOSConfirmationOverlay';
import WarningOverlay from './components/WarningOverlay';
import BanOverlay from './components/BanOverlay';
import RemoteCommandListener from './components/RemoteCommandListener';
import { TacticalCallOverlay } from './components/TacticalCallOverlay';
import SafeTimerPopup from './components/SafeTimerPopup';
import RideDeviationPopup from './components/RideDeviationPopup';
import { OfflineQueueService } from './services/OfflineQueueService';

const SOSButton = React.lazy(() => import('./components/SOSButton'));
const VictimMap = React.lazy(() => import('./components/maps/VictimMap'));
const MapplsVictimMap = React.lazy(() => import('./components/maps/MapplsVictimMap'));
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
import { VerificationPendingGate } from './components/onboarding/VerificationPendingGate';

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
  Shield,
  Volume2,
  VolumeX,
  User
} from 'lucide-react';
import KavachAIChat from './components/KavachAIChat';
import StealthOverlay from './components/StealthOverlay';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { KavachNative, KavachSafe } from './services/KavachNative';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { auth, googleProvider, db, resetKavachState } from './firebase';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, onSnapshot, query, where, terminate } from 'firebase/firestore';
import { App as CapApp } from '@capacitor/app';
import { cn } from './lib/utils';
import { toast } from 'sonner';



export default function App() {
  const isAIChatOpen = useKavachStore(state => state.isAIChatOpen);
  const setIsAIChatOpen = useKavachStore(state => state.setIsAIChatOpen);
  const isInterceptActive = useKavachStore(state => state.isInterceptActive);

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

  // 🛡️ SYSTEM BOOT: Initialize Offline Mission Queue
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      OfflineQueueService.init();
    }
  }, []);

  const [trackId, setTrackId] = useState<string | null>(null);
  const [showFailSafe, setShowFailSafe] = useState(false);

  // 🛡️ TACTICAL ZOOM LOCK REMOVED: Allowed browser scaling (Ctrl + and Ctrl -) for responsive flexibility.
  useEffect(() => {
    // Zoom locking disabled on user request.
    // Initialize Siri Shortcuts for iOS safely
    try {
      siriEmergencyService.initialize();
    } catch (e) {
      console.warn("Siri Shortcuts skipped (Web Platform)");
    }

    // 🛡️ BIND GLOBAL BACKGROUND SENTINEL
    // This forces Android/iOS to keep Shake/Voice/Ride running when minimized
    initializeBackgroundSentinel();
  }, []);
  const handleHardReset = () => { localStorage.clear(); window.location.reload(); };
  const isSOSActive = useKavachStore(state => state.isSOSActive);
  const handshakeCode = useKavachStore(state => state.handshakeCode);
  const activeTab = useKavachStore(state => state.activeTab);
  const role = useKavachStore(state => state.role);
  const isRegistered = useKavachStore(state => state.isRegistered);
  const isVerified = useKavachStore(state => state.isVerified);
  const profile = useKavachStore(state => state.profile);

  const {
    user, setUser, setRole, setGender, setRegistered, setVerified,
    userPos, setUserPos, batteryLevel, isLocked,
    setActiveTab,
    activeAlertId,
    triggerMethod,
    setSOSActive,
    isShadowActive,
    setShadowActive,
    setPendingSOS, pendingSOS,
    loading,
    setLoading,
    handleManualUnlock, isFakeCallActive, setFakeCallActive, setGuardianCache,
    isHubReady, setHubReady, setSafetyPin, performanceMode, setProfile,
    isOverlayActive, isSOSBlocked, isVoiceTriggerActive,
    isHardwareSynced, setIsHardwareSynced
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
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(true);
  const [isIntroEnding, setIsIntroEnding] = useState(false);
  const [isIntroMuted, setIsIntroMuted] = useState(false);

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
      if (Capacitor.isNativePlatform()) {
        toast.info(newState ? "Engaging WeatherPro Camouflage. App will restart." : "Restoring Kavach Security. App will restart.", { duration: 4000 });
        KavachSafe.setAppStealthMode({ enabled: newState }).catch(e => console.warn('Stealth Mode Native Toggle Failed:', e));
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

  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(() => {
    return localStorage.getItem('kavach_language_selected') === 'true';
  });

  useEffect(() => {
    // 🛡️ AUTO-RECOVERY SENTINEL: Detect Firestore Internal Assertion Failures
    const handleGlobalError = async (event: ErrorEvent | PromiseRejectionEvent) => {
      const msg = event instanceof ErrorEvent ? event.message : String(event.reason);
      if (msg.includes('ASSERTION FAILED') || msg.includes('ca9') || msg.includes('b815')) {
        const lastReload = sessionStorage.getItem('kavach_auto_recovery_time');
        const now = Date.now();

        // Only reload once every 60 seconds to prevent infinite loops
        if (!lastReload || now - parseInt(lastReload) > 60000) {
          sessionStorage.setItem('kavach_auto_recovery_time', now.toString());
          console.warn('⚠️ KAVACH: Firestore stream error detected. Reloading to recover...');
          // Small delay to let any pending writes finish
          setTimeout(() => window.location.reload(), 1500);
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

    if (isSOSActive && (effectiveRole === 'citizen' || user?.role === 'admin' || user?.role === 'super_cell')) {
      if (activeTab !== 'sos') {
        setActiveTab('sos');
      }
    }
  }, [isSOSActive, role, activeTab, setActiveTab, user]);

  // 🛡️ PROACTIVE SAFETY SENTINEL: Auto-enable Voice Protection for Citizens
  useEffect(() => {
    const isResponder = role === 'protector' || role === 'super_cell' || role === 'admin';
    if (role === 'citizen' && !isResponder && !isVoiceTriggerActive) {
      console.log("🛡️ KAVACH SENTINEL: Proactive Voice Protection Engaged.");
      useKavachStore.getState().setVoiceTriggerActive(true);
    }
  }, [role, isVoiceTriggerActive, user]);

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
    if (activeTab === 'sos' && role === 'protector' && user?.role !== 'admin' && user?.role !== 'super_cell') {
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
        KavachSafe.addListener('sosTriggered', (data: { source: string }) => {
          const { setShadowActive, setPendingSOS, setFakeCallActive, setIsSafeTimerAlertActive } = useKavachStore.getState();
          if (data.source === 'fake_call') {
            setFakeCallActive(true);
          } else if (data.source === 'safe_timer_expired') {
            setIsSafeTimerAlertActive(true);
          } else if (data.source === 'shadow') {
            setShadowActive(true);
            KavachSafe.startForensicCapture();
          } else {
            setPendingSOS(true, (data.source as any) || 'shake');
          }
        });

        // Consume any triggers that woke the app from a cold state (e.g. background service)
        const pendingTrigger = await KavachSafe.consumeTrigger();
        if (pendingTrigger) {
          const { setShadowActive, setPendingSOS, setFakeCallActive, setIsSafeTimerAlertActive } = useKavachStore.getState();
          if (pendingTrigger.source === 'fake_call') {
            setFakeCallActive(true);
          } else if (pendingTrigger.source === 'safe_timer_expired') {
            setIsSafeTimerAlertActive(true);
          } else if (pendingTrigger.source === 'shadow') {
            setShadowActive(true);
            KavachSafe.startForensicCapture();
          } else {
            setPendingSOS(true, (pendingTrigger.source as any) || 'shake');
          }
        }

        // 🛡️ NATIVE STATE RECONCILIATION
        // If the user previously force-closed the app while SOS was active, 
        // the native service might be deadlocked in 'isSOSMissionActive = true'.
        // This explicitly clears the native lock if the React frontend is safe.
        if (!useKavachStore.getState().isSOSActive && !pendingTrigger) {
          console.log("🛡️ TACTICAL: Reconciling native lock state (standing down).");
          KavachSafe.stopContinuousSiren().catch(() => { });
        }

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
            state.syncLocation({ latitude: pos.lat, longitude: pos.lng });
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
  }, [user, isRegistered, isHardwareSynced, performanceMode, isSOSBlocked, isHubReady]);

  const [loadingStatus, setLoadingStatus] = useState("Resolving Local Telemetry...");

  useEffect(() => {
    if (!loading) return;
    const statuses = [
      "Establishing Sovereign Link...",
      "Resolving Local Telemetry...",
      "Decrypting Credentials...",
      "Connecting to Command Hub..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      if (index < statuses.length - 1) {
        index++;
        setLoadingStatus(statuses[index]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const cachedUid = localStorage.getItem('kavach_user_uid');
    const timer = setTimeout(() => {
      if (loading) setShowFailSafe(true);
    }, cachedUid ? 2500 : 1000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    // 🛡️ INSTANT STARTUP FAILSAFE: Guarantee an instant responsive cold start
    const cachedUid = localStorage.getItem('kavach_user_uid');
    // Increased delay to 5 seconds to give Firebase Auth enough time to fetch tokens
    const delay = cachedUid ? 5000 : 3000;

    const loadingTimeout = setTimeout(() => {
      if (useKavachStore.getState().loading) {
        console.warn("🛰️ KAVACH: Optimistic startup bypass engaged to prevent network blocking.");
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(loadingTimeout);
  }, [setLoading]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    // 🛰️ Handle Google Redirect result (for mobile browsers that can't use popup)
    if (!Capacitor.isNativePlatform()) {
      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          console.log('✅ KAVACH: Redirect sign-in success:', result.user.email);
          // onAuthStateChanged will handle setting user state
        }
      }).catch((err) => {
        if (err.code && err.code !== 'auth/web-storage-unsupported' && err.code !== 'auth/no-auth-event') {
          console.error('🚨 KAVACH Redirect Result Error:', err.code, err.message);
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

        // 🏛️ ADMIN AUTO-PROVISIONING: Auto-promote to admin role if logged in with admin email
        const userEmail = firebaseUser.email || '';
        const isAdminEmail = user?.role === 'admin' || user?.role === 'super_cell';
        if (isAdminEmail) {
          // Instantly set store state to bypass onboarding
          setRole('admin');
          setRegistered(true);
          setVerified(true);
          setIsHardwareSynced(true);

          const { setDoc } = await import('firebase/firestore');
          await setDoc(docRef, {
            uid: firebaseUser.uid,
            email: userEmail,
            role: 'admin',
            isRegistered: true,
            isVerified: true
          }, { merge: true }).catch(err => console.error("Admin auto-provisioning failed:", err));
        }

        unsubProfile = onSnapshot(docRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();

            // 🛡️ TERMINAL LOCKOUT PROTOCOL: Instantly eject banned users
            if (data.isPermanentlyBlocked) {
              console.warn("🚨 KAVACH: Terminal lockout active. Session revoked.");
              await signOut(auth);
              toast.error("TERMINAL LOCKOUT: This identity is permanently blacklisted.", {
                className: "bg-rose-950 border-rose-500 text-white font-black"
              });
              setUser(null);
              setLoading(false);
              return;
            }

            let currentRole = data.role || 'citizen';

            // 🛡️ SOVEREIGN ROLE LOCKDOWN: Males CANNOT be Citizens (Victims) in the women safety grid.
            // However, they can be protectors, PCR patrol officers, or administrators.
            if (data.gender === 'male' && currentRole === 'citizen') {
              currentRole = 'protector';
              await setDoc(docRef, { role: 'protector' }, { merge: true });
            }

            // 🚔 AUTO-RECOVER OVERWRITTEN PCR/ADMIN ROLES
            // If they were accidentally downgraded to protector by the previous male lockdown check,
            // we restore them using their unique profile signature.
            if (currentRole === 'protector') {
              if (data.badgeId && data.vehicleNo) {
                console.log("🚔 KAVACH: Restoring accidentally locked PCR Officer role...");
                currentRole = 'pcr_officer';
                await setDoc(docRef, { role: 'pcr_officer' }, { merge: true });
              } else if (data.role === 'admin') {
                console.log("🏛️ KAVACH: Restoring accidentally locked Admin role...");
                currentRole = 'admin';
                await setDoc(docRef, { role: 'admin' }, { merge: true });
              }
            }


            setRole(currentRole);
            setRegistered(data.isRegistered === true);
            setVerified(data.isVerified || data.verified || false);
            setGender(data.gender || 'female');
            setProfile(data as any);
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

        // 🚀 NON-BLOCKING BACKGROUND SYNC: Fetch guardians in the background so it never blocks app initialization
        getDocs(collection(db, 'users', firebaseUser.uid, 'guardians'))
          .then((gSnap) => {
            const guardianList = gSnap.docs.map(d => ({ name: d.data().name, phone: d.data().phone }));
            setGuardianCache(guardianList);
            if (Capacitor.isNativePlatform() && guardianList.length > 0) {
              KavachNative.updateGuardianContacts({ contacts: JSON.stringify(guardianList) }).catch(() => { });
            }
          })
          .catch((err) => {
            console.warn("KAVACH Background Guardian Sync failed:", err);
          });

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
        // 📱 Native iOS/Android: Use Capacitor Firebase Auth (no WebView restriction)
        await PushNotifications.requestPermissions();
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        // 🌐 Web: Detect mobile browser - use redirect (popup blocked on mobile)
        const isMobileBrowser = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
        if (isMobileBrowser) {
          // Mobile browser: use redirect flow
          await signInWithRedirect(auth, googleProvider);
        } else {
          // Desktop browser: use popup (faster, no page reload)
          try {
            await signInWithPopup(auth, googleProvider);
          } catch (popupErr: any) {
            if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
              toast.info("Popup blocked. Redirecting to Google...");
              await signInWithRedirect(auth, googleProvider);
            } else {
              throw popupErr;
            }
          }
        }
      }
    } catch (e: any) {
      console.group('🚨 KAVACH LOGIN FAILED');
      console.error('Error Code:', e?.code);
      console.error('Error Message:', e?.message);
      console.error('Full Error Object:', e);
      console.groupEnd();

      const errCode = e?.code || '';
      const errMsg = e?.message || '';
      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        toast.info("Google sign-in window was closed.");
      } else if (errCode === 'auth/cancelled-popup-request' || errMsg.includes('cancelled-popup-request')) {
        // Ignore duplicate request cancellation
      } else {
        toast.error(`Login Failed: ${errCode || errMsg || 'Unknown error'}`);
      }
    }
  };

  const handleOnboardingComplete = async () => {
    setIsHardwareSynced(true);
    localStorage.setItem('kavach_hardware_synced', 'true');
    setRegistered(true);
  };

  if (loading && !trackId) return (
    <div className="min-h-[100svh] bg-black flex flex-col items-center justify-center font-['Outfit'] relative">
      <div className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-6xl font-black tracking-tight mb-2 bg-gradient-to-b from-[#FF9933] via-white to-[#138808] text-transparent bg-clip-text">KAVACH</h1>
        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Loading...</p>

        {/* Failsafe Button */}
        {showFailSafe && (
          <button
            onClick={() => {
              console.warn("🚨 KAVACH TACTICAL: Manual offline bypass triggered.");
              setLoading(false);
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
              /* 🛡️ MANDATORY BRIEFING: Force new users to watch the cinematic intro */
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isIntroEnding ? 0 : 1 }}
                transition={{ duration: 1 }}
                className="fixed inset-0 bg-black flex items-center justify-center z-[1000000] overflow-hidden cursor-pointer"
                onClick={onIntroEnd}
              >
                <video
                  autoPlay
                  playsInline
                  muted={isIntroMuted}
                  onEnded={onIntroEnd}
                  onError={onIntroEnd}
                  className="w-full h-full object-cover scale-[1.01]"
                  ref={(el) => {
                    if (el) {
                      // Auto-skip after 15 seconds as failsafe
                      setTimeout(() => { if (!isIntroEnding) onIntroEnd(); }, 15000);
                    }
                  }}
                >
                  <source src="/kavachintro.mp4" type="video/mp4" />
                </video>

                {/* 🔊 PREMIUM AUDIO CONTROLLER (Bypasses Browser Autoplay Block) */}
                <div className="absolute top-10 right-10 z-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIntroMuted(prev => !prev);
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl text-white transition-all active:scale-95 shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/[0.02] group-hover:opacity-100 transition-opacity" />

                    {/* Pulsing indicator */}
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isIntroMuted ? "bg-rose-400" : "bg-emerald-400"
                      )} />
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        isIntroMuted ? "bg-rose-500" : "bg-emerald-500"
                      )} />
                    </span>

                    {isIntroMuted ? (
                      <VolumeX size={15} className="text-rose-400 animate-pulse" />
                    ) : (
                      <Volume2 size={15} className="text-emerald-400" />
                    )}

                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                      {isIntroMuted ? "Tap for Sound" : "Mute Sound"}
                    </span>
                  </button>
                </div>

                {/* 🏛️ NATIONAL HUD OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                <div className="absolute bottom-12 left-0 right-0 text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.4em] italic">Tactical Briefing in Progress</p>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                  </div>
                  <p className="text-[8px] text-white/20 font-bold uppercase tracking-[2px]">Synchronizing Sovereign Safety Matrix v4.2</p>
                  {/* Skip button */}
                  <button
                    onClick={onIntroEnd}
                    className="mt-4 px-5 py-2 border border-white/20 rounded-full text-white/40 text-[9px] font-bold uppercase tracking-widest hover:border-white/50 hover:text-white/70 transition-all"
                  >
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
            ) : (role === 'admin' || role === 'super_cell') ? (
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
                <Onboarding
                  user={user}
                  onComplete={handleOnboardingComplete}
                  isReturningUser={isRegistered && !isHardwareSynced}
                />
              </div>
            ) : (!isVerified && role !== 'admin' && role !== 'super_cell') ? (
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

      {(!isGhostMode && !isSOSActive && !pendingSOS && !isInterceptActive && !isOverlayActive && !isSOSBlocked && !isFakeCallActive && user && role !== 'admin' && !trackId && isRegistered && isHardwareSynced && (isVerified || role === 'admin' || role === 'super_cell')) && createPortal(
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
            <div className={cn(
              "w-full max-w-md border rounded-[40px] p-2 flex justify-between items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-auto",
              role === 'citizen' ? "bg-white border-white/80" : "bg-white border-white/40"
            )}>
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
                  <NavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={20} />} label="Safety Tips" />
                  <NavButton active={activeTab === 'grievance'} onClick={() => setActiveTab('grievance')} icon={<AlertTriangle size={20} />} label="Reports" />
                  <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<User size={20} />} label="Profile" />
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
  const isSystemAdmin = auth.currentUser && (role === 'admin' || role === 'super_cell');
  const [useMapboxFallback, setUseMapboxFallback] = useState(true);

  const renderTab = (tab: string) => {
    const isVisible = activeTab === tab;

    // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
    // Protectors & PCR units are STRICTLY forbidden from accessing the Victim's SOS interface.
    if ((role === 'protector' || role === 'pcr_officer') && tab === 'sos') return null;

    switch (tab) {
      case 'dashboard':
        if (isVisible) {
          if ((role === 'protector' || role === 'pcr_officer') && !isVerified && !useKavachStore.getState().isSOSActive) {
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
          return <div key="dashboard" className="block">{(role === 'protector' || role === 'pcr_officer') ? <ProtectorDashboard /> : isSystemAdmin ? <SuperCellDashboard /> : <DashboardScreen />}</div>;
        }
        return null;
      case 'map': return isVisible ? <div key="map" className="block h-[calc(100vh-210px)] w-full">{!useMapboxFallback ? <MapplsVictimMap onFallback={() => setUseMapboxFallback(true)} /> : <VictimMap />}</div> : null;
      case 'sos': return (isVisible && role === 'citizen') ? <SOSScreen key="sos" isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} /> : null;
      case 'vault': return isVisible ? <div key="vault" className="max-w-2xl mx-auto"><EvidenceVault /></div> : null;
      case 'contacts': return isVisible ? <div key="contacts" className="max-w-2xl mx-auto"><EmergencyContacts /></div> : null;
      case 'radar': return isVisible ? <div key="radar" className="w-full"><ProtectorsRadarScreen /></div> : null;
      case 'rewards': return isVisible ? <div key="rewards" className="w-full min-h-screen bg-[#0F172A]"><div className="max-w-2xl mx-auto"><Rewards /></div></div> : null;
      case 'history': return isVisible ? <div key="history" className="max-w-4xl mx-auto px-4"><MissionHistoryScreen /></div> : null;
      case 'guide': return isVisible ? <div key="guide" className="max-w-4xl mx-auto px-4">{(role === 'protector' || role === 'pcr_officer') ? <ProtectorGuideScreen /> : <GuideScreen />}</div> : null;
      case 'grievance': return isVisible ? <div key="grievance" className="max-w-4xl mx-auto px-4"><ProtectorGrievanceScreen /></div> : null;
      case 'protector_history': return isVisible ? <div key="protector_history" className="max-w-4xl mx-auto px-4"><ProtectorHistoryScreen /></div> : null;
      default: return null;
    }
  };

  // 🛡️ TACTICAL STACK SEPARATION
  const citizenStack = ['dashboard', 'radar', 'map', 'sos', 'vault', 'contacts', 'history'];
  const protectorStack = ['dashboard', 'radar', 'rewards', 'guide', 'grievance', 'protector_history'];
  const adminStack = ['dashboard', 'map', 'vault', 'history'];

  const currentStack = (role === 'protector' || role === 'pcr_officer') ? protectorStack : role === 'admin' ? adminStack : citizenStack;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <React.Suspense fallback={<div className="p-20 text-center uppercase tracking-widest text-xs animate-pulse text-gray-400">Loading Node...</div>}>
        <div className="relative w-full h-full">{currentStack.map(tab => renderTab(tab))}</div>
      </React.Suspense>
    </div>
  );
}
