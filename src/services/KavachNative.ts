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
  broadcastEmergencySMS(options: { numbers: string[], message: string }): Promise<void>;
  initiateEmergencyCall(options: { number: string }): Promise<void>;
  
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
  requestSensitivePermissions(): Promise<void>;
  openAppSettings(): Promise<void>;
  checkSafetyPermissions(): Promise<{ sms: string; call: string; microphone: string }>;
}

// 🛡️ Master Plugin Registration
export const KavachNative = registerPlugin<KavachPlugin>('KavachPlugin');

// 🛡️ Global Hardware Bridge (Tactical Wrapper)
export const KavachSafe = {
  broadcastEmergencySMS: async (options: { numbers: string[], message: string }) => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📡 DISPATCH [NATIVE]: Blasting Emergency SMS to Guardians:", options.numbers);
        return await KavachNative.broadcastEmergencySMS(options);
      } catch (e) {
        console.error("🚨 DISPATCH FAIL: SMS Bridge Broken", e);
      }
    } else {
      console.log("%c📡 KAVACH VIRTUAL HARDWARE: SMS BLAST SIMULATED", "background: #1e3a8a; color: #60a5fa; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      console.table({
        Target: options.numbers.join(", "),
        Payload: options.message,
        Status: "✅ READY_FOR_NATIVE_DISPATCH"
      });
      return Promise.resolve();
    }
  },

  initiateEmergencyCall: async (options: { number: string }) => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📞 DISPATCH [NATIVE]: Initiating Emergency Voice Uplink to:", options.number);
        return await KavachNative.initiateEmergencyCall(options);
      } catch (e) {
        console.error("🚨 DISPATCH FAIL: Call Bridge Broken", e);
      }
    } else {
      console.log("%c📞 KAVACH VIRTUAL HARDWARE: VOICE CALL SIMULATED", "background: #1e3a8a; color: #60a5fa; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      console.table({
        Target: options.number,
        Status: "✅ READY_FOR_NATIVE_UPLINK",
        Platform: "WEB_SIMULATION"
      });
      return Promise.resolve();
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
  },

  requestSensitivePermissions: async () => {
    if (Capacitor.isNativePlatform()) {
      return await KavachNative.requestSensitivePermissions();
    }
  },

  startForensicCapture: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.startForensicCapture(); } catch (e) { console.error("Native Capture Error:", e); }
    }
  },

  stopForensicCapture: async () => {
    if (Capacitor.isNativePlatform()) {
      try { await KavachNative.stopForensicCapture(); } catch (e) { console.error("Native Capture Stop Error:", e); }
    }
  }
};
