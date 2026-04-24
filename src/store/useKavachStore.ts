import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

interface KavachState {
  // --- IDENTITY ---
  user: FirebaseUser | null;
  role: 'citizen' | 'protector' | 'admin';
  gender: 'female' | 'male' | null;
  isRegistered: boolean;
  isVerified: boolean;
  
  // --- TACTICAL ---
  userPos: [number, number];
  batteryLevel: number | null;
  isSOSActive: boolean;
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
  
  // --- SYSTEM STATE ---
  isLocked: boolean;
  isGhostMode: boolean;
  activeTab: string;
  loading: boolean;
  biometricAvailable: boolean;
  
  // --- SENTINEL SCHEDULE ---
  isSentinelActive: boolean;
  lastSentinelPulse: number | null;
  
  // --- ACTIONS ---
  setSentinelActive: (active: boolean) => void;
  resetSentinelPulse: () => void;
  setUser: (user: FirebaseUser | null) => void;
  setRole: (role: 'citizen' | 'protector' | 'admin') => void;
  setGender: (gender: 'female' | 'male') => void;
  setRegistered: (registered: boolean) => void;
  setVerified: (verified: boolean) => void;
  setUserPos: (pos: [number, number]) => void;
  setBatteryLevel: (level: number) => void;
  setSOSActive: (active: boolean, alertId?: string | null) => void;
  setRideMode: (active: boolean, rideData?: KavachState['rideData']) => void;
  updateRideData: (updates: Partial<NonNullable<KavachState['rideData']>>) => void;
  incrementFalseSOS: () => void;
  setLocked: (locked: boolean) => void;
  setBiometricAvailable: (available: boolean) => void;
  setGhostMode: (ghost: boolean) => void;
  handleManualUnlock: () => Promise<void>;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  syncLocation: () => Promise<[number, number] | null>;
}

export const useKavachStore = create<KavachState>((set) => ({
  user: null,
  role: 'citizen',
  gender: 'female',
  isRegistered: false,
  isVerified: false,
  userPos: [28.6139, 77.2090],
  batteryLevel: null,
  isSOSActive: false,
  isRideModeActive: false,
  rideData: null,
  falseSOSCount: 0,
  activeAlertId: null,
  isLocked: false,
  isGhostMode: false,
  activeTab: 'dashboard',
  loading: true,
  biometricAvailable: false,
  isSentinelActive: false,
  lastSentinelPulse: null,

  setSentinelActive: (isSentinelActive) => set({ isSentinelActive, lastSentinelPulse: isSentinelActive ? Date.now() : null }),
  resetSentinelPulse: () => set({ lastSentinelPulse: Date.now() }),
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setGender: (gender) => set({ gender }),
  setRegistered: (isRegistered) => set({ isRegistered }),
  setVerified: (isVerified) => set({ isVerified }),
  setUserPos: (userPos) => set({ userPos }),
  setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
  setRideMode: (isRideModeActive, rideData = null) => set({ isRideModeActive, rideData }),
  updateRideData: (updates) => set((state) => ({
    rideData: state.rideData ? { ...state.rideData, ...updates } : null
  })),
  incrementFalseSOS: () => set((state) => ({ falseSOSCount: state.falseSOSCount + 1 })),
  setLocked: (isLocked) => set({ isLocked }),
  setBiometricAvailable: (biometricAvailable) => set({ biometricAvailable }),
  setGhostMode: (isGhostMode) => set({ isGhostMode }),
  handleManualUnlock: async () => {
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Unlock KAVACH Shield",
        title: "Biometric Authentication",
        useFallback: true
      });
      set({ isLocked: false });
    } catch (e) {
      console.warn("Manual unlock failed:", e);
    }
  },
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (loading) => set({ loading }),
  syncLocation: async () => {
    try {
      const { getLiveLocation } = await import('../services/locationService');
      const loc = await getLiveLocation();
      if (loc) {
        set({ userPos: [loc.latitude, loc.longitude], loading: false });
        return [loc.latitude, loc.longitude];
      }
    } catch (e) {
      console.warn("KAVACH Store: Initial GPS lock failed:", e);
    }
    return null;
  },
  setSOSActive: (isSOSActive, activeAlertId = null) => {
    set({ isSOSActive, activeAlertId });
    if (isSOSActive) {
      localStorage.setItem('kavach_sos_active', 'true');
      if (activeAlertId) localStorage.setItem('kavach_active_alert_id', activeAlertId);
    } else {
      localStorage.removeItem('kavach_sos_active');
      localStorage.removeItem('kavach_active_alert_id');
    }
  },
}));
