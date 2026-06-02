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
      console.log("%c📡 KAVACH VIRTUAL HARDWARE: SMS BLAST SIMULATED", "background: #1e3a8a; color: #60a5fa; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      console.table({
        Targets: options.numbers.join(", "),
        Payload: options.message,
        Status: "✅ READY_FOR_NATIVE_DISPATCH"
      });
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
      console.log("%c📞 KAVACH VIRTUAL HARDWARE: VOICE CALL SIMULATED", "background: #1e3a8a; color: #60a5fa; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      console.table({
        Target: options.number,
        Status: "✅ READY_FOR_NATIVE_UPLINK"
      });
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
      console.log("🔊 %c[SIMULATOR] Continuous Siren Started.", "color: #ef4444; font-weight: bold;");
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
      console.log("🔊 %c[SIMULATOR] Continuous Siren Stopped.", "color: #10b981;");
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
      console.log("🛰️ %c[SIMULATOR] Background Tracking Sentinel Engaged.", "color: #3b82f6;");
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
      console.log("🛰️ %c[SIMULATOR] Background Tracking Sentinel Terminated.", "color: #6b7280;");
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
      console.log("📹 %c[SIMULATOR] Ambient Microphone and Camera Forensic Capture active.", "color: #a855f7;");
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
      console.log("📹 %c[SIMULATOR] Ambient Forensic Capture sealed and vaulted.", "color: #22c55e;");
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
      console.log("🎙️ %c[SIMULATOR] Acoustic Keyword Engine listening for hot phrases...", "color: #f59e0b;");
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
      console.log("🎙️ %c[SIMULATOR] Acoustic Keyword Engine disabled.", "color: #6b7280;");
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
      console.log(`🔔 %c[SIMULATOR ALERT] ${options.title} - ${options.body}`, "background: #b91c1c; color: white; padding: 4px; font-weight: bold;");
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
      console.log(`🕶️ %c[SIMULATOR] App Stealth Mode: ${options.enabled ? 'ENGAGED' : 'DISENGAGED'}`, "color: #9333ea;");
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
      console.log(`⏱️ %c[SIMULATOR] Native Safe Timer Started for ${options.durationMins} minutes.`, "color: #f59e0b;");
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
      console.log("⏱️ %c[SIMULATOR] Native Safe Timer Stopped.", "color: #10b981;");
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
      console.log(`📞 %c[SIMULATOR] Scheduled Fake Call natively in ${options.delaySeconds} seconds.`, "color: #f59e0b;");
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
