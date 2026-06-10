import { registerPlugin, Capacitor, PluginListenerHandle } from '@capacitor/core';

/**
 * 🛰️ KAVACH NATIVE HARDWARE INTERFACE
 * Centralized Bridge between Web UI and Android/iOS Native Systems.
 */
export interface KavachPlugin {
  // 🎙️ Acoustic Sentinel (Voice keyword monitoring)
  startVoiceSentinel(): Promise<void>;
  stopVoiceSentinel(): Promise<void>;
  
  // 📳 Kinetic Sentinel (Background sensor monitoring)
  startBackgroundSentinel(): Promise<void>;
  stopBackgroundSentinel(): Promise<void>;
  
  // 📡 Mission Critical Dispatch Utilities
  broadcastEmergencySMS(options: { numbers: string[]; message: string }): Promise<void>;
  initiateEmergencyCall(options: { number: string }): Promise<void>;
  updateGuardianContacts(options: { contacts: string }): Promise<void>;
  setUserRole(options: { role: string }): Promise<void>;
  
  // 🚨 Hardware Interceptors & Alarms
  startContinuousSiren(): Promise<void>;
  stopContinuousSiren(): Promise<void>;
  startForensicCapture(): Promise<void>;
  stopForensicCapture(): Promise<void>;
  
  // 🔒 Platform Security & OS Settings Overrides
  isOverlayPermissionGranted(): Promise<{ granted: boolean }>;
  openOverlaySettings(): Promise<void>;
  isIgnoringBatteryOptimizations(): Promise<{ isExempt: boolean }>;
  openBatterySettings(): Promise<void>;
  triggerHapticPulse(): Promise<void>;
  requestSensitivePermissions(): Promise<void>;
  openAppSettings(): Promise<void>;
  checkSafetyPermissions(): Promise<{ sms: string; call: string; microphone: string }>;
  showUrgentNotification(options: { title: string; body: string; id: string; sound: string }): Promise<void>;
  getPhoneHint(): Promise<{ number?: string }>;
  requestLockScreenPermission(): Promise<void>;
  consumeTrigger(): Promise<{ source: string }>;
  setAppStealthMode(options: { enabled: boolean }): Promise<void>;
  startSafeTimer(options: { durationMins: number }): Promise<void>;
  stopSafeTimer(): Promise<void>;
  scheduleFakeCall(options: { delaySeconds: number }): Promise<void>;
  playEmergencyRingtone(): Promise<void>;
  stopEmergencyRingtone(): Promise<void>;
}

// 🛡️ Master Plugin Registration
export const KavachNative = registerPlugin<KavachPlugin>('KavachPlugin');

/**
 * 🛡️ GLOBAL HARDWARE BRIDGE (Resilient Wrapper)
 * Safely polyfills hardware tasks in web views and protects against native runtime crashes.
 */
export const KavachSafe = {
  broadcastEmergencySMS: async (options: { numbers: string[]; message: string }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📡 DISPATCH [NATIVE]: Blasting Emergency SMS to Guardians:", options.numbers);
        return await KavachNative.broadcastEmergencySMS(options);
      } catch (error) {
        console.error("🚨 DISPATCH FAULT: SMS Hardware Bridge Failure:", error);
      }
    } else {
      // Web simulator: SMS not available
    }
  },

  initiateEmergencyCall: async (options: { number: string }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📞 DISPATCH [NATIVE]: Initiating Emergency Voice Uplink to:", options.number);
        return await KavachNative.initiateEmergencyCall(options);
      } catch (error) {
        console.error("🚨 DISPATCH FAULT: Voice Call Bridge Failure:", error);
      }
    } else {
      // Web simulator: Call not available
    }
  },

  startContinuousSiren: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startContinuousSiren();
      } catch (error) {
        console.error("🚨 HARDWARE ERROR: Unable to trigger native siren speaker:", error);
      }
    } else {
      // Web simulator: Siren not available
    }
  },

  stopContinuousSiren: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopContinuousSiren();
      } catch (error) {
        console.error("🚨 HARDWARE ERROR: Unable to halt native siren speaker:", error);
      }
    } else {
      // Web simulator: Siren not available
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

  setUserRole: async (options: { role: string }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        await KavachNative.setUserRole(options);
        console.log("🛡️ KAVACH SYSTEM: Hardware Role Defined ->", options.role);
      } catch (error) {
        console.error("🚨 KAVACH EXCEPTION: Role Sync failed", error);
      }
    }
  },

  startBackgroundSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        // FIXED: Re-mapped method name back to matching interface contract
        return await KavachNative.startBackgroundSentinel();
      } catch (error) {
        console.error("🚨 SENTINEL CONFIG FAULT: Core Background Tracking Engine failed to start:", error);
      }
    } else {
      // Web simulator: Background sentinel not available
    }
  },

  stopBackgroundSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopBackgroundSentinel();
      } catch (error) {
        console.error("🚨 SENTINEL CONFIG FAULT: Core Background Tracking Engine failed to halt:", error);
      }
    } else {
      // Web simulator: Background sentinel not available
    }
  },

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

  startForensicCapture: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try { 
        await KavachNative.startForensicCapture(); 
      } catch (error) { 
        console.error("🚨 FORENSIC SECURITY SYSTEM ERROR: Capture engagement drop:", error); 
      }
    } else {
      // Web simulator: Forensic capture not available
    }
  },

  stopForensicCapture: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try { 
        await KavachNative.stopForensicCapture(); 
      } catch (error) { 
        console.error("🚨 FORENSIC SECURITY SYSTEM ERROR: Capture seal drop:", error); 
      }
    } else {
      // Web simulator: Forensic capture not available
    }
  },

  startVoiceSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startVoiceSentinel();
      } catch (error) {
        console.error("🚨 ACOUSTIC SENTINEL FAULT: Voice tracking failed to attach:", error);
      }
    } else {
      // Web simulator: Voice sentinel not available
    }
  },

  stopVoiceSentinel: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopVoiceSentinel();
      } catch (error) {
        console.error("🚨 ACOUSTIC SENTINEL FAULT: Voice tracking failed to halt:", error);
      }
    } else {
      // Web simulator: Voice sentinel not available
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

  showUrgentNotification: async (options: { title: string; body: string; id: string; sound: string }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.showUrgentNotification(options);
      } catch (error) {
        console.error("🚨 NOTIFICATION EXCEPTION: High-priority system banner drop:", error);
      }
    } else {
      // Web simulator: Notifications not available
    }
  },

  addListener: (eventName: string, listenerFunc: (data: any) => void): PluginListenerHandle => {
    if (Capacitor.isNativePlatform()) {
      try {
        return (KavachNative as any).addListener(eventName, listenerFunc);
      } catch (error) {
        console.error(`🚨 HARDWARE LISTENER LEAK: Event channel attachment broke for ${eventName}:`, error);
      }
    }
    // Return a dummy handle for smooth execution in web testing environments
    return { remove: async () => {} };
  },

  consumeTrigger: async (): Promise<{ source: string } | null> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.consumeTrigger();
      } catch (error) {
        // Will throw if no pending trigger, this is normal
        return null;
      }
    }
    return null;
  },

  setAppStealthMode: async (options: { enabled: boolean }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.setAppStealthMode(options);
      } catch (error) {
        console.error("🚨 STEALTH BRIDGE ERROR:", error);
      }
    } else {
      // Web simulator: Stealth mode not available
    }
  },

  startSafeTimer: async (options: { durationMins: number }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startSafeTimer(options);
      } catch (error) {
        console.error("🚨 NATIVE TIMER ERROR:", error);
      }
    } else {
      // Web simulator: Safe timer not available
    }
  },

  stopSafeTimer: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopSafeTimer();
      } catch (error) {
        console.error("🚨 NATIVE TIMER ERROR:", error);
      }
    } else {
      // Web simulator: Safe timer not available
    }
  },

  scheduleFakeCall: async (options: { delaySeconds: number }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.scheduleFakeCall(options);
      } catch (error) {
        console.error("🚨 NATIVE FAKE CALL ERROR:", error);
      }
    } else {
      // Web simulator: Fake call not available
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
