import { Capacitor } from '@capacitor/core';
import { KavachNative } from './KavachPluginInterface';

export const KavachSafeHardware = {
  startContinuousSiren: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startContinuousSiren();
      } catch (error) {
        console.error("🚨 HARDWARE ERROR: Unable to trigger native siren speaker:", error);
      }
    }
  },

  stopContinuousSiren: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopContinuousSiren();
      } catch (error) {
        console.error("🚨 HARDWARE ERROR: Unable to halt native siren speaker:", error);
      }
    }
  },

  triggerHapticPulse: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.triggerHapticPulse();
      } catch (error) {
        console.error("🚨 HARDWARE ERROR: Haptic engine failed to pulse:", error);
      }
    } else {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  },

  playEmergencyRingtone: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.playEmergencyRingtone();
      } catch (error) {
        console.error("🚨 NATIVE RINGTONE ERROR:", error);
      }
    }
  },

  stopEmergencyRingtone: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopEmergencyRingtone();
      } catch (error) {
        console.error("🚨 NATIVE RINGTONE ERROR:", error);
      }
    }
  }
};
