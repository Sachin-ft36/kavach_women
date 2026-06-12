import { StateCreator } from 'zustand';
import { KavachState } from './types';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const savedIsHardwareSynced = localStorage.getItem('kavach_hardware_synced') === 'true';

export const createHardwareSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'batteryLevel' | 'isHardwareSynced' | 'biometricAvailable' | 'isBatteryExempt' | 'isLocked' | 'performanceMode' | 'isSentinelActive' | 'lastSentinelPulse' | 'setBatteryLevel' | 'setIsHardwareSynced' | 'setBatteryExempt' | 'setLocked' | 'handleManualUnlock' | 'setPerformanceMode' | 'setSentinelActive' | 'resetSentinelPulse'>> = (set, get) => ({
  batteryLevel: null,
  isHardwareSynced: savedIsHardwareSynced,
  biometricAvailable: false,
  isBatteryExempt: true,
  isLocked: false,
  performanceMode: (localStorage.getItem('kavach_perf_mode') as any) || 'auto',
  isSentinelActive: false,
  lastSentinelPulse: null,

  setBatteryLevel: (batteryLevel) => set((state) => {
    let mode = state.performanceMode;
    if (state.performanceMode === 'auto') {
      if (batteryLevel < 20) mode = 'power_save';
      else if (batteryLevel > 80) mode = 'high';
    }
    return { batteryLevel, performanceMode: mode };
  }),

  setIsHardwareSynced: (isHardwareSynced) => {
    localStorage.setItem('kavach_hardware_synced', String(isHardwareSynced));
    set({ isHardwareSynced });
  },

  setBatteryExempt: (isBatteryExempt) => set({ isBatteryExempt }),
  setLocked: (isLocked) => set({ isLocked }),

  handleManualUnlock: async () => {
    try {
      await NativeBiometric.verifyIdentity({ reason: "Manual Unlock", useFallback: true });
      set({ isLocked: false });
    } catch (e) {
      console.warn("Biometric verification failed, fallback required.");
      throw e;
    }
  },

  setPerformanceMode: (performanceMode) => {
    localStorage.setItem('kavach_perf_mode', performanceMode);
    set({ performanceMode });
  },

  setSentinelActive: (active) => set({ isSentinelActive: active }),
  resetSentinelPulse: () => set({ lastSentinelPulse: Date.now() })
});
