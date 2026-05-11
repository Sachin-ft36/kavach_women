import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * 🛰️ KAVACH NATIVE HARDWARE INTERFACE
 * Centralized Bridge between Web UI and Android/iOS Native Systems.
 */
export interface KavachPlugin {
  // 🎙️ Acoustic Sentinel
  startVoiceSentinel(): Promise<void>;
  stopVoiceSentinel(): Promise<void>;
  
  // 📳 Kinetic Sentinel
  startBackgroundSentinel(): Promise<void>;
  stopBackgroundSentinel(): Promise<void>;
  
  // 📡 Mission Critical Dispatch
  broadcastEmergencySMS(options: { numbers: string[] }): Promise<void>;
  initiateEmergencyCall(): Promise<void>;
  
  // 🚨 Hardware Interceptors
  startContinuousSiren(): Promise<void>;
  stopContinuousSiren(): Promise<void>;
  startForensicCapture(): Promise<void>;
  stopForensicCapture(): Promise<void>;
  
  // 🔒 Platform Security
  isOverlayPermissionGranted(): Promise<{ granted: boolean }>;
  openOverlaySettings(): Promise<void>;
  isIgnoringBatteryOptimizations(): Promise<{ isExempt: boolean }>;
  openBatterySettings(): Promise<void>;
  triggerHapticPulse(): Promise<void>;
}

// 🛡️ Master Plugin Registration
export const KavachNative = registerPlugin<KavachPlugin>('KavachPlugin');

// 🛡️ Global Hardware Bridge (Tactical Wrapper)
export const KavachSafe = {
  broadcastEmergencySMS: async (numbers: string[]) => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📡 DISPATCH: Blasting Emergency SMS to Guardians:", numbers);
        return await KavachNative.broadcastEmergencySMS({ numbers });
      } catch (e) {
        console.error("🚨 DISPATCH FAIL: SMS Bridge Broken", e);
      }
    }
  },

  initiateEmergencyCall: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📞 DISPATCH: Initiating Emergency Voice Uplink (112)");
        return await KavachNative.initiateEmergencyCall();
      } catch (e) {
        console.error("🚨 DISPATCH FAIL: Call Bridge Broken", e);
      }
    }
  },

  startContinuousSiren: async () => {
    if (Capacitor.isNativePlatform()) {
      return await KavachNative.startContinuousSiren();
    }
  },

  stopContinuousSiren: async () => {
    if (Capacitor.isNativePlatform()) {
      return await KavachNative.stopContinuousSiren();
    }
  },

  triggerHapticPulse: async () => {
    if (Capacitor.isNativePlatform()) {
      return await KavachNative.triggerHapticPulse();
    }
  },

  startBackgroundSentinel: async () => {
    if (Capacitor.isNativePlatform()) {
      return await KavachNative.startBackgroundSentinel();
    }
  }
};
