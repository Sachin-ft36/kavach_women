import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { App as CapApp } from '@capacitor/app';
import { OfflineQueueService } from '../services/OfflineQueueService';
import { siriEmergencyService } from '../services/siriService';
import { initializeBackgroundSentinel } from '../services/BackgroundSentinelService';
import { KavachSafe } from '../services/KavachNative';
import { syncTelemetry, startBackgroundTracking, watchLiveLocation } from '../services/locationService';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useAppInitialization(trackId: string | null) {
  const {
    user, role, isRegistered, isHardwareSynced, performanceMode, isSOSBlocked, isHubReady,
    setHubReady, setUserPos, setPendingSOS, setShadowActive, setFakeCallActive, setIsSafeTimerAlertActive,
    setSOSActive, isSOSActive, handshakeCode, activeTab, setActiveTab, isVoiceTriggerActive, triggerMethod, loading, setLoading
  } = useKavachStore();

  const [showFailSafe, setShowFailSafe] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Resolving Local Telemetry...");

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      OfflineQueueService.init();
    }
    try {
      siriEmergencyService.initialize();
    } catch (e) {
      console.warn("Siri Shortcuts skipped (Web Platform)");
    }
    initializeBackgroundSentinel();
  }, []);

  useEffect(() => {
    const storedMethod = localStorage.getItem('kavach_trigger_method');
    if (isSOSActive && !triggerMethod && storedMethod) {
    }
  }, [isSOSActive, triggerMethod]);

  useEffect(() => {
    const handleGlobalError = async (event: ErrorEvent | PromiseRejectionEvent) => {
      const msg = event instanceof ErrorEvent ? event.message : String(event.reason);
      if (msg.includes('ASSERTION FAILED') || msg.includes('ca9') || msg.includes('b815')) {
        const lastReload = sessionStorage.getItem('kavach_auto_recovery_time');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload) > 60000) {
          sessionStorage.setItem('kavach_auto_recovery_time', now.toString());
          console.warn('⚠️ KAVACH: Firestore stream error detected. Reloading to recover...');
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

  useEffect(() => {
    const storedRole = localStorage.getItem('kavach_user_role');
    const effectiveRole = role || storedRole;

    if (isSOSActive && (effectiveRole === 'citizen' || (user as any)?.role === 'admin' || (user as any)?.role === 'super_cell')) {
      if (activeTab !== 'sos') {
        setActiveTab('sos');
      }
    }
  }, [isSOSActive, role, activeTab, setActiveTab, user]);

  useEffect(() => {
    const isResponder = role === 'protector' || role === 'super_cell' || role === 'admin';
    if (role === 'citizen' && !isResponder && !isVoiceTriggerActive) {
      console.log("🛡️ KAVACH SENTINEL: Proactive Voice Protection Engaged.");
      useKavachStore.getState().setVoiceTriggerActive(true);
    }
  }, [role, isVoiceTriggerActive, user]);

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
        
        // Ignore protector incident broadcasts, only resume actual SOS
        if (alertData.type === 'PROTECTOR_REPORT') return;

        console.log("🛰️ KAVACH RECOVERY: Active Mission Detected in Cloud Hub. Syncing local state...");
        if (!isSOSActive || (alertData.handshakeCode && handshakeCode !== alertData.handshakeCode)) {
          setSOSActive(true, activeAlert.id, alertData.type || 'remote', null, alertData.handshakeCode);
        }
      } else {
        const lastTrigger = localStorage.getItem('kavach_last_trigger_time');
        const isRecentlyTriggered = lastTrigger && (Date.now() - parseInt(lastTrigger) < 10000);

        if (isSOSActive && !isRecentlyTriggered) {
          console.log("✅ KAVACH RECOVERY: Mission Resolved in Cloud Hub. Standing down.");
          setSOSActive(false);
        }
      }
    });

    return () => unsubscribe();
  }, [user, isSOSActive, handshakeCode, setSOSActive]);

  useEffect(() => {
    if (activeTab === 'sos' && role === 'protector' && (user as any)?.role !== 'admin' && (user as any)?.role !== 'super_cell') {
      console.log("🛡️ KAVACH NAV: Protector detected on Victim interface. Snapping back to Command...");
      setActiveTab('dashboard');
    }
  }, [activeTab, role, setActiveTab, user]);

  useEffect(() => {
    initializeBackgroundSentinel();

    if (Capacitor.isNativePlatform()) {
      setTimeout(async () => {
        await PushNotifications.requestPermissions();
        KavachSafe.addListener('sosTriggered', (data: { source: string }) => {
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

        const pendingTrigger = await KavachSafe.consumeTrigger();
        if (pendingTrigger) {
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

        if (!useKavachStore.getState().isSOSActive && !pendingTrigger) {
          console.log("🛡️ TACTICAL: Reconciling native lock state (standing down).");
          KavachSafe.stopContinuousSiren().catch(() => { });
        }

        setHubReady(true);
      }, 2000);
    } else {
      setHubReady(true);
    }
  }, [setFakeCallActive, setIsSafeTimerAlertActive, setShadowActive, setPendingSOS, setHubReady]);

  useEffect(() => {
    let activePulse: any = null;

    const startTracking = async () => {
      if (user && isRegistered && isHardwareSynced && !isSOSBlocked && isHubReady) {
        const state = useKavachStore.getState();
        activePulse = await watchLiveLocation((pos, acc) => {
          setUserPos(pos);
          syncTelemetry(user.uid, role, state.batteryLevel, pos, acc);

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
  }, [user, isRegistered, isHardwareSynced, performanceMode, isSOSBlocked, isHubReady, role, setUserPos]);

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
    const cachedUid = localStorage.getItem('kavach_user_uid');
    const delay = cachedUid ? 5000 : 3000;

    const loadingTimeout = setTimeout(() => {
      if (useKavachStore.getState().loading) {
        console.warn("🛰️ KAVACH: Optimistic startup bypass engaged to prevent network blocking.");
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(loadingTimeout);
  }, [setLoading]);

  return { showFailSafe, setShowFailSafe, loadingStatus };
}
