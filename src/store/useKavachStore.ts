import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  arrayUnion,
  limit,
  increment
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';
import { executeEmergencyBlast } from '../services/sosService';
import { supabase } from '../lib/supabase';

const lastLat = localStorage.getItem('kavach_last_lat');
const lastLng = localStorage.getItem('kavach_last_lng');
const cachedGuardians = JSON.parse(localStorage.getItem('kavach_guardian_cache') || '[]');
const savedSOS = localStorage.getItem('kavach_sos_active') === 'true';
const savedAlertId = localStorage.getItem('kavach_active_alert_id');
const savedMethod = localStorage.getItem('kavach_trigger_method') as any;
const savedRideMode = localStorage.getItem('kavach_ride_mode_active') === 'true';
const savedRideData = JSON.parse(localStorage.getItem('kavach_ride_data') || 'null');
const savedIsRegistered = localStorage.getItem('kavach_is_registered') === 'true';
const savedIsHardwareSynced = localStorage.getItem('kavach_hardware_synced') === 'true';
const savedIsVerified = localStorage.getItem('kavach_is_verified') === 'true';

interface KavachState {
  user: FirebaseUser | null;
  profile: any | null;
  role: 'citizen' | 'protector' | 'admin' | 'super_cell';
  gender: 'female' | 'male' | null;
  isRegistered: boolean;
  isVerified: boolean;
  safetyPin: string | null;
  userPos: [number, number];
  batteryLevel: number | null;
  isSOSActive: boolean;
  triggerMethod: 'button' | 'shake' | 'voice' | 'silent' | 'ride' | 'remote';
  isRideModeActive: boolean;
  rideData: {
    vehicleNo: string;
    destination: string;
    targetCoords: [number, number] | null;
    startTime: number | null;
    deviationDistance: number;
    status: 'linked' | 'displacement_only' | 'active' | 'monitored' | 'emergency';
    warningsIssued: number;
    path?: [number, number][];
    emergencyTriggeredAt?: number;
    alertLevel?: string;
  } | null;
  falseSOSCount: number;
  activeAlertId: string | null;
  isLocked: boolean;
  isGhostMode: boolean;
  activeTab: string;
  loading: boolean;
  isSOSBlocked: boolean;
  sosBlockedReason: string | null;
  isPermanentlyBlocked: boolean;
  sosStrikeCount: number;
  hasPendingWarning: boolean;
  warningMessage: string | null;
  handshakeCode: string | null;
  isHandshakeVerified: boolean;
  isEmergencyOverrideRequested: boolean;
  isDuressTriggered: boolean;
  biometricAvailable: boolean;
  verifiedProtectorCount: number;
  isFakeCallActive: boolean;
  isVoiceTriggerActive: boolean;
  isBatteryExempt: boolean;
  respondingToAlertId: string | null;
  setBatteryExempt: (exempt: boolean) => void;
  isHardwareSynced: boolean;
  setIsHardwareSynced: (synced: boolean) => void;
  guardianCache: any[];
  isSentinelActive: boolean;
  lastSentinelPulse: number | null;
  setSentinelActive: (active: boolean) => void;
  resetSentinelPulse: () => void;
  setGuardianCache: (guardians: any[]) => void;
  setUser: (user: FirebaseUser | null) => Promise<void>;
  setProfile: (profile: any | null) => void;
  setRole: (role: 'citizen' | 'protector' | 'admin' | 'super_cell') => void;
  setGender: (gender: 'female' | 'male') => void;
  setRegistered: (registered: boolean) => void;
  setVerified: (verified: boolean) => void;
  setSafetyPin: (pin: string | null) => void;
  setUserPos: (pos: [number, number]) => void;
  setBatteryLevel: (level: number) => void;
  setSOSActive: (active: boolean, alertId?: string | null, method?: KavachState['triggerMethod'], closureReason?: string | null) => Promise<void>;
  setRideMode: (active: boolean, rideData?: KavachState['rideData']) => Promise<void>;
  updateRideData: (updates: Partial<NonNullable<KavachState['rideData']>>) => Promise<void>;
  setLocked: (locked: boolean) => void;
  setFakeCallActive: (active: boolean) => void;
  setVoiceTriggerActive: (active: boolean) => void;
  handleManualUnlock: () => Promise<void>;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  syncLocation: (providedCoords?: any) => Promise<[number, number] | null>;
  isHubReady: boolean;
  setHubReady: (ready: boolean) => void;
  blackBox: any[];
  logIncidentToBlackBox: (data: any) => void;
  clearBlackBox: () => void;
  performanceMode: 'high' | 'auto' | 'power_save';
  setPerformanceMode: (mode: KavachState['performanceMode']) => void;
  isShadowActive: boolean;
  setShadowActive: (active: boolean) => void;
  isBriefingActive: boolean;
  setBriefingActive: (active: boolean) => void;
  setSOSBlocked: (blocked: boolean, reason?: string | null) => void;
  setStrikeCount: (count: number) => void;
  acknowledgeWarning: () => Promise<void>;
  requestEmergencyOverride: () => Promise<void>;
  triggerDuress: (distressCode: string) => Promise<boolean>;
  isInterceptActive: boolean;
  setInterceptActive: (active: boolean) => void;
  pendingSOS: {
    active: boolean;
    method: KavachState['triggerMethod'];
    expiresAt: number;
  } | null;
  setPendingSOS: (active: boolean, method?: KavachState['triggerMethod']) => void;
  cancelPendingSOS: () => void;
  isOverlayActive: boolean;
  setOverlayActive: (active: boolean) => void;
  isAIChatOpen: boolean;
  setIsAIChatOpen: (open: boolean) => void;
  activeProtectorAlertId: string | null;
  setActiveProtectorAlert: (id: string | null) => void;
  activeRadius: number;
  setActiveRadius: (radius: number) => void;
  isFirFlowActive: boolean;
  setIsFirFlowActive: (active: boolean) => void;
}

const savedHandshake = localStorage.getItem('kavach_handshake_code');

export const useKavachStore = create<KavachState>((set, get) => ({
  user: null,
  profile: null,
  role: (localStorage.getItem('kavach_user_role') as any) || 'citizen',
  gender: 'female',
  isRegistered: savedIsRegistered,
  isVerified: savedIsVerified,
  safetyPin: localStorage.getItem('kavach_safety_pin'),
  userPos: (lastLat && lastLng) ? [parseFloat(lastLat), parseFloat(lastLng)] : [20.5937, 78.9629],
  batteryLevel: null,
  isSOSActive: savedSOS,
  triggerMethod: savedMethod || 'button',
  isRideModeActive: savedRideMode,
  rideData: savedRideData,
  falseSOSCount: 0,
  activeAlertId: savedAlertId,
  isLocked: false,
  isGhostMode: false,
  activeTab: 'dashboard',
  loading: true,
  isSOSBlocked: false,
  sosBlockedReason: null,
  isPermanentlyBlocked: false,
  sosStrikeCount: 0,
  hasPendingWarning: false,
  warningMessage: null,
  handshakeCode: savedHandshake,
  isHandshakeVerified: false,
  isEmergencyOverrideRequested: false,
  isDuressTriggered: false,
  biometricAvailable: false,
  verifiedProtectorCount: 0,
  isFakeCallActive: false,
  isVoiceTriggerActive: localStorage.getItem('kavach_voice_trigger') !== 'false', // Default to TRUE for proactive safety
  isBatteryExempt: true,
  isHardwareSynced: savedIsHardwareSynced,
  setIsHardwareSynced: (isHardwareSynced) => {
    localStorage.setItem('kavach_hardware_synced', String(isHardwareSynced));
    set({ isHardwareSynced });
  },
  respondingToAlertId: null,
  setBatteryExempt: (isBatteryExempt) => set({ isBatteryExempt }),
  guardianCache: cachedGuardians,
  isSentinelActive: false,
  lastSentinelPulse: null,
  isHubReady: false,
  blackBox: JSON.parse(localStorage.getItem('kavach_blackbox') || '[]'),
  performanceMode: (localStorage.getItem('kavach_perf_mode') as any) || 'auto',
  isShadowActive: (localStorage.getItem('kavach_shadow_mode') === 'true' && savedSOS),
  pendingSOS: null,
  isOverlayActive: false,
  setOverlayActive: (isOverlayActive) => set({ isOverlayActive }),
  isAIChatOpen: false,
  setIsAIChatOpen: (isAIChatOpen) => set({ isAIChatOpen }),
  activeProtectorAlertId: null,
  setActiveProtectorAlert: (activeProtectorAlertId) => set({ activeProtectorAlertId }),
  activeRadius: 5.0,
  setActiveRadius: (activeRadius) => set({ activeRadius }),
  isFirFlowActive: false,
  setIsFirFlowActive: (isFirFlowActive) => set({ isFirFlowActive }),

  setPendingSOS: (active, method = 'button') => {
    if (active) {
      set({
        pendingSOS: {
          active: true,
          method,
          expiresAt: Date.now() + 5000
        }
      });
    } else {
      set({ pendingSOS: null });
    }
  },

  cancelPendingSOS: () => {
    set({ pendingSOS: null });
    toast.info("SOS Request Cancelled", {
      description: "False trigger avoided. System returning to standby.",
      icon: '🛡️'
    });
  },

  setPerformanceMode: (performanceMode) => {
    localStorage.setItem('kavach_perf_mode', performanceMode);
    set({ performanceMode });
  },

  setHubReady: (isHubReady) => set({ isHubReady }),
  logIncidentToBlackBox: (data) => set((state) => {
    const updated = [...state.blackBox, { ...data, localTimestamp: Date.now() }];
    localStorage.setItem('kavach_blackbox', JSON.stringify(updated));
    return { blackBox: updated };
  }),
  clearBlackBox: () => {
    localStorage.removeItem('kavach_blackbox');
    set({ blackBox: [] });
  },

  setGuardianCache: (guardians) => {
    localStorage.setItem('kavach_guardian_cache', JSON.stringify(guardians));
    set({ guardianCache: guardians });
  },
  setUser: async (user) => {
    set({ user });
    if (user) {
      const { db } = await import('../firebase');
      const { doc, onSnapshot } = await import('firebase/firestore');

      // ⚡ SUPABASE SYNC & AUTO-MIGRATION (Optimized)
      let lastSyncedData = "";
      const syncProfile = async (firebaseData: any) => {
        const syncString = JSON.stringify({
          n: firebaseData.name,
          r: firebaseData.role,
          v: firebaseData.isVerified || firebaseData.verified,
          xp: firebaseData.xp
        });
        
        if (syncString === lastSyncedData) return; // Skip if no meaningful change
        lastSyncedData = syncString;

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.uid,
            email: user.email,
            display_name: firebaseData.name || user.displayName || 'Kavach Citizen',
            role: firebaseData.role || 'citizen',
            gender: firebaseData.gender || 'female',
            is_verified: !!(firebaseData.isVerified || firebaseData.verified),
            xp: firebaseData.xp || 0
          });
        
        if (error) console.error("⚡ SUPABASE: Sync Error", error);
        else console.log("⚡ SUPABASE: Profile Synced & Migrated.");
      };

      onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          
          // 🛡️ DEVICE LOCK PROTOCOL (DECOMMISSIONED)
          // Users can now login from multiple devices without lockout.

          set({
            isSOSBlocked: !!data.isSOSBlocked,
            isPermanentlyBlocked: !!data.isPermanentlyBlocked,
            sosBlockedReason: data.sosBlockedReason || null,
            sosStrikeCount: data.sosStrikeCount || 0,
            hasPendingWarning: !!data.hasPendingWarning,
            warningMessage: data.warningMessage || null,
            profile: data,
            isVerified: !!(data.isVerified || data.verified)
          });
          
          // Trigger Auto-Migration to Supabase
          syncProfile(data);
        }
      });

      // REAL-TIME SUBSCRIPTION
      supabase
        .channel(`profile:${user.uid}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.uid}` 
        }, (payload) => {
          console.log('⚡ SUPABASE: Real-time update', payload);
          if (payload.new) {
            set((state) => ({
              profile: { ...state.profile, ...payload.new as any }
            }));
          }
        })
        .subscribe();
    }
  },
  setProfile: (profile) => set({ profile }),
  setRole: (role) => {
    localStorage.setItem('kavach_user_role', role);
    set({ role });
  },
  setGender: (gender) => set({ gender }),
  setRegistered: (isRegistered) => {
    localStorage.setItem('kavach_is_registered', isRegistered.toString());
    set({ isRegistered });
  },
  setVerified: (isVerified) => {
    localStorage.setItem('kavach_is_verified', isVerified.toString());
    set({ isVerified });
  },
  setSafetyPin: (safetyPin) => {
    if (safetyPin) localStorage.setItem('kavach_safety_pin', safetyPin);
    else localStorage.removeItem('kavach_safety_pin');
    set({ safetyPin });
  },
  setUserPos: (userPos) => {
    localStorage.setItem('kavach_last_lat', userPos[0].toString());
    localStorage.setItem('kavach_last_lng', userPos[1].toString());
    set({ userPos });
  },
  setBatteryLevel: (batteryLevel) => set((state) => {
    let mode = state.performanceMode;
    if (state.performanceMode === 'auto') {
      if (batteryLevel < 20) mode = 'power_save';
      else if (batteryLevel > 80) mode = 'high';
    }
    return { batteryLevel, performanceMode: mode };
  }),
  setRideMode: async (isRideModeActive, rideData = null) => {
    localStorage.setItem('kavach_ride_mode_active', isRideModeActive.toString());
    if (rideData) localStorage.setItem('kavach_ride_data', JSON.stringify({ ...rideData, path: [] }));
    else if (!isRideModeActive) localStorage.removeItem('kavach_ride_data');
    set({ isRideModeActive, rideData: rideData ? { ...rideData, path: [] } : null });

    const { auth, db } = await import('../firebase');
    const { doc, setDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore');
    if (auth.currentUser) {
      const journeyRef = doc(db, 'journeys', auth.currentUser.uid);
      const state = useKavachStore.getState();
      if (isRideModeActive && rideData) {
        localStorage.setItem('kavach_ride_active', 'true');
        console.log("📡 KAVACH: Initiating National Transit Uplink...");
        try {
          await setDoc(journeyRef, {
            ...rideData,
            latitude: state.userPos[0],
            longitude: state.userPos[1],
            path: [{ lng: state.userPos[1], lat: state.userPos[0] }],
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Kavach User',
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            heartbeat: serverTimestamp()
          });
          console.log("✅ KAVACH: Transit Uplink Established. Sector Monitoring Active.");
        } catch (error) {
          console.error("❌ KAVACH: Transit Uplink Failed:", error);
          const { toast } = await import('sonner');
          toast.error("National Grid Connection Failed.", {
            description: `Telemetry Sync Blocked: ${error instanceof Error ? error.message : 'Unknown Rule Block'}. Check Security Rules.`,
            className: "bg-red-950 border-red-500 text-white font-black"
          });
        }
      } else {
        localStorage.removeItem('kavach_ride_active');
        if (!state.isSOSActive) {
          await updateDoc(journeyRef, {
            status: 'completed',
            endedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          }).catch(async () => {
            // Fallback if update fails (e.g. document doesn't exist yet)
            await deleteDoc(journeyRef).catch(() => { });
          });
        }
      }
    }
  },
  updateRideData: async (updates) => {
    const currentState = useKavachStore.getState();
    const newData = currentState.rideData ? { ...currentState.rideData, ...updates } : null;
    if (newData) localStorage.setItem('kavach_ride_data', JSON.stringify(newData));
    set({ rideData: newData });

    const { auth, db } = await import('../firebase');
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    if (auth.currentUser && newData) {
      await updateDoc(doc(db, 'journeys', auth.currentUser.uid), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    }
  },
  setLocked: (isLocked) => set({ isLocked }),
  setFakeCallActive: (isFakeCallActive) => set({ isFakeCallActive }),
  setVoiceTriggerActive: (isVoiceTriggerActive) => {
    localStorage.setItem('kavach_voice_trigger', String(isVoiceTriggerActive));
    set({ isVoiceTriggerActive });
  },
  handleManualUnlock: async () => {
    try {
      await NativeBiometric.verifyIdentity({ reason: "Manual Unlock", useFallback: true });
      set({ isLocked: false });
    } catch (e) {
      console.warn("Biometric verification failed, fallback required.");
      throw e; // 🛡️ THROW to trigger PIN UI in SOSScreen
    }
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ loading }),
  syncLocation: async (providedCoords = null) => {
    try {
      const { getLiveLocation } = await import('../services/locationService');
      const { db, auth } = await import('../firebase');
      const { doc, updateDoc, serverTimestamp, arrayUnion, setDoc } = await import('firebase/firestore');

      const loc: any = providedCoords || await getLiveLocation();
      if (loc) {
        // 🛰️ TACTICAL EXTRACTION: Handle both standard and high-fidelity coordinate objects
        const lat = loc.latitude ?? loc.coords?.latitude;
        const lng = loc.longitude ?? loc.coords?.longitude;

        if (lat !== undefined && lng !== undefined) {
          const userPos: [number, number] = [lat, lng];
          set({ userPos, loading: false });

          if (auth.currentUser) {
            try {
              const updates: any = {
                lastLocation: { latitude: lat, longitude: lng },
                lastActive: serverTimestamp()
              };
              await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);

              const state = useKavachStore.getState();
              
              // ⚡ SUPABASE LOCATION SYNC
              await supabase
                .from('profiles')
                .update({ 
                  last_location: `POINT(${lng} ${lat})` 
                })
                .eq('id', auth.currentUser.uid);

              if (state.isRideModeActive && state.rideData) {
                try {
                  await setDoc(doc(db, 'journeys', auth.currentUser.uid), {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    path: arrayUnion({ lng: loc.longitude, lat: loc.latitude }),
                    lastUpdated: serverTimestamp(),
                    heartbeat: serverTimestamp()
                  }, { merge: true });
                  console.log("📍 KAVACH: Transit Heartbeat Pulse... Movement Mirrored to Grid.");
                } catch (e) {
                  console.warn("⚠️ KAVACH: Transit Sync Interrupted. Check National Grid Rules.");
                }
              }

              if (state.isSOSActive && state.activeAlertId) {
                try {
                  await setDoc(doc(db, 'alerts', state.activeAlertId), {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    path: arrayUnion({ lng: loc.longitude, lat: loc.latitude }),
                    lastUpdated: serverTimestamp()
                  }, { merge: true });
                } catch (e) {
                  console.warn("⚠️ KAVACH: Alert Telemetry Sync Pending...");
                }
              }

              // 🛡️ SYNC ACCOUNTABILITY STATES
              const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
              if (userSnap.exists()) {
                const data = userSnap.data();
                set({
                  isSOSBlocked: !!data.isSOSBlocked,
                  isPermanentlyBlocked: !!data.isPermanentlyBlocked,
                  sosBlockedReason: data.sosBlockedReason || null,
                  sosStrikeCount: data.sosStrikeCount || 0,
                  hasPendingWarning: !!data.hasPendingWarning,
                  warningMessage: data.warningMessage || null
                });
              }
            } catch (e) {
              console.error("Cloud Hub Sync Failed:", e);
            }
          }
          return userPos;
        }
      }
    } catch (e) {
      // 🛡️ SILENT FAILSAFE: Location timeouts are common on desktop/low-signal.
      // Transitioned to warning to prevent console noise.
      console.warn("📍 KAVACH: Telemetry Sync Pending (Location Timeout). Nodes will refresh on next pulse.");
    }

    // 🛡️ PROTECTOR TELEMETRY: Sync global count
    try {
      const { db } = await import('../firebase');
      const { query, collection, where, onSnapshot } = await import('firebase/firestore');
      const protectorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'protector'),
        where('isVerified', '==', true)
      );
      onSnapshot(protectorsQuery, (snap) => {
        set({ verifiedProtectorCount: snap.size });
      });
    } catch (e) { }

    return null;
  },
  setSOSActive: async (isSOSActive: boolean, activeAlertId: string | null = null, method = 'button', closureReason = null, providedHandshake: string | null = null) => {
    const wasAlreadyActive = get().isSOSActive;
    const { userPos } = get();

    if (isSOSActive) {
      console.log(`🚨 KAVACH COMMAND: SOS TRIGGERED VIA [${method.toUpperCase()}]`);

      // 🛡️ NEW MISSION PROTOCOL: Always start with a clean state
      const currentUid = auth.currentUser?.uid || localStorage.getItem('kavach_user_uid');
      
      if (!currentUid) {
        toast.error("Tactical Identity Failure. Please re-authenticate.");
        return;
      }

      const alertId = activeAlertId || `alert_${currentUid}_${Date.now()}`;
      const existingHandshake = providedHandshake || get().handshakeCode || localStorage.getItem('kavach_handshake_code');
      const finalHandshake = existingHandshake || Math.floor(1000 + Math.random() * 9000).toString();

      // 🛡️ PERMISSION ESCALATION: Ensure hardware access before engaging forensic sentinel
      if (Capacitor.isNativePlatform()) {
        try {
          await KavachSafe.requestSensitivePermissions();
        } catch (e) {
          console.warn("⚠️ KAVACH: Permission escalation failed. Evidence capture may be restricted.");
        }
      }

      set({
        isSOSActive: true,
        activeAlertId: alertId,
        triggerMethod: method,
        pendingSOS: null,
        isHandshakeVerified: false,
        handshakeCode: finalHandshake,
        activeTab: 'sos'
      });

      localStorage.setItem('kavach_sos_active', 'true');
      localStorage.setItem('kavach_trigger_method', method);
      localStorage.setItem('kavach_active_alert_id', alertId);
      localStorage.setItem('kavach_handshake_code', finalHandshake);
      localStorage.setItem('kavach_last_trigger_time', Date.now().toString());

      const state = get();
      const isTransit = !!state.isRideModeActive;
      const rideContext = isTransit ? {
        isTransitSOS: true,
        vehicleNo: state.rideData?.vehicleNo || 'UNKNOWN',
        journeyId: auth.currentUser?.uid,
        transitStatus: 'INTERCEPTION_REQUIRED'
      } : {};

      if (!wasAlreadyActive) {
        // 🚀 AUTO-INITIATE FORENSIC SENTINEL
        set({ isShadowActive: true });
        localStorage.setItem('kavach_shadow_mode', 'true');
        
        executeEmergencyBlast(get().profile || get().user, get().userPos, {
          type: method,
          alertId,
          handshakeCode: get().handshakeCode,
          rideContext
        });
      } else {
        console.log("🛰️ KAVACH SYNC: State aligned with Cloud. Dispatch already operational.");
      }

      // ⚡ SUPABASE ALERT SYNC (Using upsert to prevent 409 Conflict on redundant triggers)
      supabase
        .from('alerts')
        .upsert({
          id: alertId,
          victim_id: currentUid,
          status: 'active',
          trigger_method: method,
          handshake_code: finalHandshake,
          location: `POINT(${userPos[1]} ${userPos[0]})`,
          priority: 'high'
        })
        .then(({ error }) => {
          if (error) console.error("⚡ SUPABASE: Alert Sync Failed.", error);
          else console.log("⚡ SUPABASE: Alert Mirrored to National Grid.");
        });
    } else {
      // ⚡ INSTANT UI SNAPBACK: Clear local state immediately for zero-latency response
      // 🛡️ TERMINATE ALL SENTINELS
      set({ 
        isSOSActive: false, 
        isShadowActive: false,
        activeAlertId: null, 
        sosMethod: null,
        triggerMethod: null,
        activeRadius: 5.0,
        activeTab: 'dashboard',
        handshakeCode: null,
        isHandshakeVerified: false
      });
      localStorage.removeItem('kavach_sos_active');
      localStorage.removeItem('kavach_shadow_mode');
      localStorage.removeItem('kavach_active_alert_id');
      localStorage.removeItem('kavach_trigger_method');
      localStorage.removeItem('kavach_handshake_code');

      const currentAlertId = activeAlertId || get().activeAlertId;
      if (auth.currentUser && currentAlertId) {
        try {
          const alertRef = doc(db, 'alerts', currentAlertId);
          const alertSnap = await getDoc(alertRef);

          if (alertSnap.exists()) {
            const alertData = alertSnap.data();
            const responders = alertData.activeResponders || [];

            if (responders.length > 0) {
              for (const responder of responders) {
                if (responder.uid) {
                  // 🛡️ REBALANCED MERIT SYSTEM: Simplified for 100/50 logic
                  let meritPoints = 50; // Base points for responding (even if aborted)
                  
                  // Ultimate Rescue Bonus (The Hero who verified the Handshake)
                  const isSavior = alertData.verification?.verifiedBy === responder.uid;
                  if (isSavior) meritPoints = 100; // Total 100 for a confirmed save

                  const responderRef = doc(db, 'users', responder.uid);
                  await updateDoc(responderRef, {
                    xp: increment(meritPoints),
                    livesSaved: isSavior ? increment(1) : increment(0),
                    successfulRescues: isSavior ? increment(1) : increment(0),
                    abortedAssists: !isSavior ? increment(1) : increment(0),
                    missionHistory: arrayUnion({
                      id: currentAlertId,
                      victimName: alertData.victimName || 'Citizen',
                      timestamp: Date.now(),
                      meritEarned: meritPoints,
                      outcome: isSavior ? 'VERIFIED_RESCUE' : 'ABORTED_DURING_ASSIST',
                      maxProximityReached: responder.maxProximity || 0,
                      type: alertData.isTransitSOS ? 'TRANSIT_INTERCEPTION' : 'SOS_RESCUE',
                      status: 'SUCCESSFUL_INTERVENTION',
                      reason: closureReason || 'Manual Deactivation'
                    })
                  }).catch(e => console.error(`Merit credit failed for ${responder.uid}:`, e));
                }
              }
            }

            if (closureReason === 'Accidentally triggered SOS') {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                falseSOSCount: increment(1),
                hasPendingWarning: true,
                warningMessage: "⚠️ KAVACH ALERT: False trigger detected.",
                lastPenaltyAt: serverTimestamp()
              });
            }

            await updateDoc(alertRef, {
              status: 'resolved',
              victimSafetyStatus: 'safe',
              victimClearedAt: serverTimestamp(),
              'verification.closureReason': closureReason || 'Manual Deactivation',
              'verification.resolvedAt': serverTimestamp(),
              'verification.isHandshakeVerified': get().isHandshakeVerified
            });

            // ⚡ SUPABASE ALERT DE-ESCALATION
            await supabase
              .from('alerts')
              .update({ 
                status: 'resolved',
                created_at: new Date().toISOString() // Or resolution_at if added
              })
              .eq('id', currentAlertId);

            if (alertData.isTransitSOS) {
              const journeyRef = doc(db, 'journeys', auth.currentUser.uid);
              // Check state again as it might have changed
              if (localStorage.getItem('kavach_ride_mode_active') === 'true') {
                await updateDoc(journeyRef, { status: 'active', alertId: null, isTransitSOS: false });
              } else {
                await updateDoc(journeyRef, { status: 'completed', endedAt: serverTimestamp(), alertId: null, isTransitSOS: false }).catch(() => { });
              }
            }
          }
        } catch (e) {
          console.error("SOS De-escalation Error:", e);
        }
      }
    }
  },
  requestEmergencyOverride: async () => {
    const { activeAlertId } = useKavachStore.getState();
    if (activeAlertId) {
      try {
        await updateDoc(doc(db, 'alerts', activeAlertId), {
          isEmergencyOverrideRequested: true,
          overrideRequestedAt: serverTimestamp(),
          status: 'responding_priority_override'
        });
        set({ isEmergencyOverrideRequested: true });
        toast.warning("OVERRIDE REQUESTED: Live Forensic Patch initiated to SuperCell.");
      } catch (e) { }
    }
  },
  triggerDuress: async (distressCode: string) => {
    const { activeAlertId, handshakeCode } = useKavachStore.getState();
    if (activeAlertId && handshakeCode) {
      const isDuress = distressCode === (parseInt(handshakeCode) + 1).toString();
      if (isDuress) {
        try {
          await updateDoc(doc(db, 'alerts', activeAlertId), {
            isDuressTriggered: true,
            duressAt: serverTimestamp(),
            priority: 'CRITICAL_DURESS'
          });
          set({ isDuressTriggered: true });
          toast.error("SILENT DURESS TRIGGERED: Reinforcements notified.");
          return true;
        } catch (e) { }
      }
    }
    return false;
  },
  setSentinelActive: (isSentinelActive) => set({
    isSentinelActive,
    lastSentinelPulse: isSentinelActive ? Date.now() : null
  }),
  resetSentinelPulse: () => set({ lastSentinelPulse: Date.now() }),
  setShadowActive: (isShadowActive) => {
    localStorage.setItem('kavach_shadow_mode', isShadowActive.toString());
    set({ isShadowActive });
  },
  isBriefingActive: false,
  setBriefingActive: (isBriefingActive) => set({ isBriefingActive }),

  setSOSBlocked: (isSOSBlocked, reason = null) => set({ isSOSBlocked, sosBlockedReason: reason }),
  setStrikeCount: (sosStrikeCount) => set({ sosStrikeCount }),

  acknowledgeWarning: async () => {
    const { auth, db } = await import('../firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        hasPendingWarning: false,
        warningMessage: null
      });
      set({ hasPendingWarning: false, warningMessage: null });
    }
  },
  isInterceptActive: false,
  setInterceptActive: (isInterceptActive) => set({ isInterceptActive })
}));
