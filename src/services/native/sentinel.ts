import { Capacitor } from '@capacitor/core';
import { KavachNative } from './KavachPluginInterface';

export const KavachSafeSentinel = {
  startBackgroundSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startBackgroundSentinel();
      } catch (error) {
        console.error("🚨 SENTINEL CONFIG FAULT: Core Background Tracking Engine failed to start:", error);
      }
    }
  },

  stopBackgroundSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopBackgroundSentinel();
      } catch (error) {
        console.error("🚨 SENTINEL CONFIG FAULT: Core Background Tracking Engine failed to halt:", error);
      }
    }
  },

  startVoiceSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startVoiceSentinel();
      } catch (error) {
        console.error("🚨 ACOUSTIC SENTINEL FAULT: Voice tracking failed to attach:", error);
      }
    }
  },

  stopVoiceSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopVoiceSentinel();
      } catch (error) {
        console.error("🚨 ACOUSTIC SENTINEL FAULT: Voice tracking failed to halt:", error);
      }
    }
  }
};
