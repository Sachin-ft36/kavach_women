import { Capacitor } from '@capacitor/core';
import { KavachNative } from './KavachPluginInterface';

export const KavachSafePermissions = {
  requestSensitivePermissions: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.requestSensitivePermissions();
      } catch (error) {
        console.error("🚨 PERMISSION BRIDGE REFUSED:", error);
      }
    }
  },

  requestLockScreenPermission: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        await KavachNative.requestLockScreenPermission();
      } catch (error) {
        console.log("No specific lock screen intent needed or found on target platform tier.");
      }
    }
  },

  isIgnoringBatteryOptimizations: async (): Promise<{ isExempt: boolean }> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.isIgnoringBatteryOptimizations();
      } catch (error) {
        console.error("🚨 SECURITY LAYER ERROR: Battery optimization validation error:", error);
        return { isExempt: false };
      }
    }
    return { isExempt: true };
  },

  openBatterySettings: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.openBatterySettings();
      } catch (error) {
        console.error("🚨 OS REDIRECT ERROR: Unable to display device battery configuration tray:", error);
      }
    }
  },

  hasFullScreenIntentPermission: async (): Promise<{ granted: boolean }> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.hasFullScreenIntentPermission();
      } catch (error) {
        return { granted: true };
      }
    }
    return { granted: true };
  },

  openFullScreenIntentSettings: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.openFullScreenIntentSettings();
      } catch (error) {
        console.error("🚨 OS REDIRECT ERROR:", error);
      }
    }
  }
};
