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

const lastLat = localStorage.getItem('kavach_last_lat');
const lastLng = localStorage.getItem('kavach_last_lng');
const cachedGuardians = JSON.parse(localStorage.getItem('kavach_guardian_cache') || '[]');
const savedSOS = localStorage.getItem('kavach_sos_active') === 'true';
const savedAlertId = localStorage.getItem('kavach_active_alert_id');
const savedMethod = localStorage.getItem('kavach_trigger_method') as any;
const savedRideMode = localStorage.getItem('kavach_ride_mode_active') === 'true';
const savedRideData = JSON.parse(localStorage.getItem('kavach_ride_data') || 'null');

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
  setBatteryExempt: (exempt: boolean) => void;
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
}

export const useKavachStore = create<KavachState>((set, get) => ({
  user: null,
  profile: null,
  role: 'citizen',
  gender: 'female',
  isRegistered: false,
  isVerified: false,
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
  sosStrikeCount: 0,
  hasPendingWarning: false,
  warningMessage: null,
  handshakeCode: null,
  isHandshakeVerified: false,
  isEmergencyOverrideRequested: false,
  isDuressTriggered: false,
  biometricAvailable: false,
  verifiedProtectorCount: 0,
  isFakeCallActive: false,
  isVoiceTriggerActive: localStorage.getItem('kavach_voice_trigger') === 'true',
  isBatteryExempt: true,
  setBatteryExempt: (isBatteryExempt) => set({ isBatteryExempt }),
  guardianCache: cachedGuardians,
  isSentinelActive: false,
  lastSentinelPulse: null,
  isHubReady: false,
  blackBox: JSON.parse(localStorage.getItem('kavach_blackbox') || '[]'),
  performanceMode: (localStorage.getItem('kavach_perf_mode') as any) || 'auto',
  isShadowActive: localStorage.getItem('kavach_shadow_mode') === 'true',
  pendingSOS: null,
  isOverlayActive: false,
  setOverlayActive: (isOverlayActive) => set({ isOverlayActive }),
  isAIChatOpen: false,
  setIsAIChatOpen: (isAIChatOpen) => set({ isAIChatOpen }),
  activeProtectorAlertId: null,
  setActiveProtectorAlert: (activeProtectorAlertId) => set({ activeProtectorAlertId }),
  activeRadius: 1.0,
  setActiveRadius: (activeRadius) => set({ activeRadius }),

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
      
      onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          set({ 
            isSOSBlocked: !!data.isSOSBlocked,
            sosBlockedReason: data.sosBlockedReason || null,
            sosStrikeCount: data.sosStrikeCount || 0,
            hasPendingWarning: !!data.hasPendingWarning,
            warningMessage: data.warningMessage || null,
            profile: data,
            isVerified: !!(data.isVerified || data.verified)
          });
        }
      });
    }
  },
  setProfile: (profile) => set({ profile }),
  setRole: (role) => set({ role }),
  setGender: (gender) => set({ gender }),
  setRegistered: (isRegistered) => set({ isRegistered }),
  setVerified: (isVerified) => set({ isVerified }),
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
             await deleteDoc(journeyRef).catch(() => {});
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
              await updateDoc(doc(db, 'alerts', state.activeAlertId), {
                latitude: loc.latitude,
                longitude: loc.longitude,
                path: arrayUnion({ lng: loc.longitude, lat: loc.latitude }),
                lastUpdated: serverTimestamp()
              });
            }

            // 🛡️ SYNC ACCOUNTABILITY STATES
            const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userSnap.exists()) {
              const data = userSnap.data();
              set({ 
                isSOSBlocked: !!data.isSOSBlocked,
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
      console.error("📍 KAVACH: Sync Location Failed.", e);
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
    } catch (e) {}

    return null;
  },
  setSOSActive: async (isSOSActive: boolean, activeAlertId: string | null = null, method = 'button', closureReason = null) => {
    const { guardianCache, userPos, isBriefingActive } = get();
    
    set({ isSOSActive, activeAlertId, triggerMethod: method, pendingSOS: null });
    if (!isSOSActive) set({ activeRadius: 1.0 }); // Reset perimeter on de-escalation
    
    if (isSOSActive) {
      console.log(`🚨 KAVACH COMMAND: SOS TRIGGERED VIA [${method.toUpperCase()}]`);
      localStorage.setItem('kavach_sos_active', 'true');
      localStorage.setItem('kavach_trigger_method', method);
      
      // 🛡️ TACTICAL HANDSHAKE: Fire Hardware Dispatch Sequentially
      if (Capacitor.isNativePlatform()) {
        try {
          // STEP 1: Blast SMS (Priority 1)
          const phones = (guardianCache || []).map(g => g.phone?.replace(/\s/g, '')).filter(Boolean);
          console.log("📡 DISPATCH: Blasting SMS to Guardians:", phones);
          await KavachSafe.broadcastEmergencySMS(phones);
          
          // STEP 2: Wait for hardware handshake (Avoid collision)
          console.log("⏳ SYNC: Tactical Delay (1000ms)...");
          await new Promise(r => setTimeout(r, 1000));

          // STEP 3: Initiate Voice Call (Priority 2)
          console.log("📞 DISPATCH: Initiating Voice Uplink...");
          await KavachSafe.initiateEmergencyCall();

          // STEP 4: Capture & Engage Interceptors (Siren Silenced for Victim Safety)
          console.log("🚨 DISPATCH: Engaging Interceptors...");
          // KavachSafe.startContinuousSiren(); // REMOVED FOR STEALTH SOS
        } catch (e) {
          console.error("🚨 DISPATCH FAIL: Hardware Bridge Error", e);
        }
      }
      if (auth.currentUser) {
        const alertId = activeAlertId || `alert_${auth.currentUser.uid}_${Date.now()}`;
        if (!activeAlertId) set({ activeAlertId: alertId });
        localStorage.setItem('kavach_active_alert_id', alertId);

        const handshake = Math.floor(1000 + Math.random() * 9000).toString();
        set({ handshakeCode: handshake });

        const state = useKavachStore.getState();
        const safeCoords = state.userPos || [20.5937, 78.9629];
        
        const isTransit = !!(state.isRideModeActive || state.rideData);
        const rideContext = isTransit ? {
          isTransitSOS: true,
          vehicleNo: state.rideData?.vehicleNo || 'UNKNOWN',
          journeyId: auth.currentUser.uid,
          transitStatus: 'INTERCEPTION_REQUIRED'
        } : {};

        try {
          // 🚀 PHASE 1: FORCE RED STATUS ON GRID
          if (isTransit) {
            await updateDoc(doc(db, 'journeys', auth.currentUser.uid), {
              status: 'emergency',
              alertId: alertId,
              isTransitSOS: true,
              lastUpdated: serverTimestamp()
            });
            console.log("🛑 GRID: Status Forced to EMERGENCY");
          }

          // 📡 PHASE 2: BROADCAST TACTICAL ALERT
          await setDoc(doc(db, 'alerts', alertId), {
            id: alertId,
            victimUid: auth.currentUser.uid,
            victimName: auth.currentUser.displayName || 'Kavach Citizen',
            victimPhone: auth.currentUser.phoneNumber || '',
            latitude: safeCoords[0],
            longitude: safeCoords[1],
            coords: safeCoords,
            path: [{ lng: safeCoords[1], lat: safeCoords[0] }],
            status: 'active',
            method: method,
            handshakeCode: handshake,
            isHandshakeVerified: false,
            batteryLevel: state.batteryLevel || 100,
            ...rideContext,
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp()
          });

          toast.success("INTERCEPTION PROTOCOL ACTIVE", {
            description: "National Grid synchronized successfully.",
            icon: '🚨'
          });
          console.log("🛑 GRID SUCCESS: Emergency Protocol Synchronized.");
        } catch (e: any) {
          console.error("🛑 GRID ERROR:", e);
          toast.error("PROTOCOL UPLINK FAILED", {
            description: e.message || "Please check grid connectivity."
          });
        }
      }
    } else {
      localStorage.removeItem('kavach_sos_active');
      localStorage.removeItem('kavach_active_alert_id');
      localStorage.removeItem('kavach_trigger_method');
      
      const currentAlertId = activeAlertId || useKavachStore.getState().activeAlertId;
      if (auth.currentUser && currentAlertId) {
        try {
          // 🛡️ FETCH ALERT DATA TO IDENTIFY RESPONDERS & SYNC GRID
          const alertRef = doc(db, 'alerts', currentAlertId);
          const alertSnap = await getDoc(alertRef);
          
          if (alertSnap.exists()) {
            const alertData = alertSnap.data();
            const responders = alertData.activeResponders || [];
            
            // 🏅 CREDIT MERIT POINTS TO ALL ACTIVE RESPONDERS (Honor for Readiness)
            if (responders.length > 0) {
              for (const responder of responders) {
                if (responder.uid) {
                  const responderRef = doc(db, 'users', responder.uid);
                  await updateDoc(responderRef, {
                    xp: increment(100), // Standard 100 XP for being dispatched
                    livesSaved: increment(1), // Persistent merit tracking
                    missionHistory: arrayUnion({
                      id: currentAlertId,
                      victimName: alertData.victimName || 'Citizen',
                      timestamp: serverTimestamp(),
                      type: alertData.isTransitSOS ? 'TRANSIT_INTERCEPTION' : 'SOS_RESCUE',
                      status: 'SUCCESSFUL_INTERVENTION'
                    })
                  }).catch(e => console.error(`Failed to credit responder ${responder.uid}:`, e));
                }
              }
            }

            // ⚠️ VICTIM ACCOUNTABILITY: Handle False Triggers
            if (closureReason === 'Accidentally triggered SOS') {
              const victimRef = doc(db, 'users', auth.currentUser.uid);
              await updateDoc(victimRef, {
                falseSOSCount: increment(1),
                hasPendingWarning: true,
                warningMessage: "⚠️ KAVACH ALERT: False trigger detected. Frequent accidental SOS activations may lead to temporary grid suspension.",
                lastPenaltyAt: serverTimestamp()
              });
              console.warn("🛡️ KAVACH ACCOUNTABILITY: Victim flagged for false trigger.");
            }
          }

          await updateDoc(doc(db, 'alerts', currentAlertId), {
            status: 'resolved',
            closureReason: closureReason || 'Manual Deactivation',
            resolvedAt: serverTimestamp(),
            isHandshakeVerified: useKavachStore.getState().isHandshakeVerified
          });
          
          if (useKavachStore.getState().isRideModeActive) {
             await updateDoc(doc(db, 'journeys', auth.currentUser.uid), {
                status: 'active',
                alertId: null,
                isTransitSOS: false
             });
          }
        } catch (e) {}
      }
      set({ handshakeCode: null, isHandshakeVerified: false });
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
      } catch (e) {}
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
        } catch (e) {}
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
