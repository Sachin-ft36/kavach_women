import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const lastLat = localStorage.getItem('kavach_last_lat');
const lastLng = localStorage.getItem('kavach_last_lng');
const cachedGuardians = JSON.parse(localStorage.getItem('kavach_guardian_cache') || '[]');
const savedSOS = localStorage.getItem('kavach_sos_active') === 'true';
const savedAlertId = localStorage.getItem('kavach_active_alert_id');
const savedMethod = localStorage.getItem('kavach_trigger_method') as any;

interface KavachState {
  user: FirebaseUser | null;
  role: 'citizen' | 'protector' | 'admin' | 'super_cell';
  gender: 'female' | 'male' | null;
  isRegistered: boolean;
  isVerified: boolean;
  safetyPin: string | null;
  userPos: [number, number];
  batteryLevel: number | null;
  isSOSActive: boolean;
  triggerMethod: 'button' | 'shake' | 'voice' | 'silent' | 'ride';
  isRideModeActive: boolean;
  rideData: {
    vehicleNo: string;
    destination: string;
    targetCoords: [number, number] | null;
    startTime: number | null;
    deviationDistance: number;
    status: 'linked' | 'displacement_only';
    warningsIssued: number;
  } | null;
  falseSOSCount: number;
  activeAlertId: string | null;
  isLocked: boolean;
  isGhostMode: boolean;
  activeTab: string;
  loading: boolean;
  biometricAvailable: boolean;
  isFakeCallActive: boolean;
  isVoiceTriggerActive: boolean;
  guardianCache: any[];
  isSentinelActive: boolean;
  lastSentinelPulse: number | null;
  setSentinelActive: (active: boolean) => void;
  resetSentinelPulse: () => void;
  setGuardianCache: (guardians: any[]) => void;
  setUser: (user: FirebaseUser | null) => void;
  setRole: (role: 'citizen' | 'protector' | 'admin' | 'super_cell') => void;
  setGender: (gender: 'female' | 'male') => void;
  setRegistered: (registered: boolean) => void;
  setVerified: (verified: boolean) => void;
  setSafetyPin: (pin: string | null) => void;
  setUserPos: (pos: [number, number]) => void;
  setBatteryLevel: (level: number) => void;
  setSOSActive: (active: boolean, alertId?: string | null, method?: KavachState['triggerMethod']) => void;
  setRideMode: (active: boolean, rideData?: KavachState['rideData']) => void;
  updateRideData: (updates: Partial<NonNullable<KavachState['rideData']>>) => void;
  setLocked: (locked: boolean) => void;
  setFakeCallActive: (active: boolean) => void;
  setVoiceTriggerActive: (active: boolean) => void;
  handleManualUnlock: () => Promise<void>;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  syncLocation: () => Promise<[number, number] | null>;
  isHubReady: boolean;
  setHubReady: (ready: boolean) => void;
  blackBox: any[];
  logIncidentToBlackBox: (data: any) => void;
  clearBlackBox: () => void;
}

export const useKavachStore = create<KavachState>((set) => ({
  user: null,
  role: 'citizen',
  gender: 'female',
  isRegistered: false,
  isVerified: false,
  safetyPin: localStorage.getItem('kavach_safety_pin'),
  userPos: (lastLat && lastLng) ? [parseFloat(lastLat), parseFloat(lastLng)] : [20.5937, 78.9629],
  batteryLevel: null,
  isSOSActive: savedSOS,
  triggerMethod: savedMethod || 'button',
  isRideModeActive: false,
  rideData: null,
  falseSOSCount: 0,
  activeAlertId: savedAlertId,
  isLocked: false,
  isGhostMode: false,
  activeTab: 'dashboard',
  loading: true,
  biometricAvailable: false,
  isFakeCallActive: false,
  isVoiceTriggerActive: localStorage.getItem('kavach_voice_trigger') !== 'false',
  guardianCache: cachedGuardians,
  isSentinelActive: false,
  lastSentinelPulse: null,
  isHubReady: false,
  blackBox: JSON.parse(localStorage.getItem('kavach_blackbox') || '[]'),

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
  setUser: (user) => set({ user }),
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
  setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
  setRideMode: (isRideModeActive, rideData = null) => set({ isRideModeActive, rideData }),
  updateRideData: (updates) => set((state) => ({
    rideData: state.rideData ? { ...state.rideData, ...updates } : null
  })),
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
    } catch (e) {}
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ loading }),
  syncLocation: async () => {
    try {
      const { getLiveLocation } = await import('../services/locationService');
      const loc = await getLiveLocation();
      if (loc) { 
        set({ userPos: [loc.latitude, loc.longitude], loading: false });
        return [loc.latitude, loc.longitude];
      }
    } catch (e) {}
    return null;
  },
  setSOSActive: (isSOSActive, activeAlertId = null, method = 'button') => {
    set({ isSOSActive, activeAlertId, triggerMethod: method });
    if (isSOSActive) {
      localStorage.setItem('kavach_sos_active', 'true');
      if (activeAlertId) localStorage.setItem('kavach_active_alert_id', activeAlertId);
      localStorage.setItem('kavach_trigger_method', method);
    } else {
      localStorage.removeItem('kavach_sos_active');
      localStorage.removeItem('kavach_active_alert_id');
      localStorage.removeItem('kavach_trigger_method');
    }
  },
  setSentinelActive: (isSentinelActive) => set({ 
    isSentinelActive, 
    lastSentinelPulse: isSentinelActive ? Date.now() : null 
  }),
  resetSentinelPulse: () => set({ lastSentinelPulse: Date.now() }),
}));
