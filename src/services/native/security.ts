import { Capacitor } from '@capacitor/core';
import { KavachNative } from './KavachPluginInterface';

export const KavachSafeSecurity = {
  startForensicCapture: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try { 
        await KavachNative.startForensicCapture(); 
      } catch (error) { 
        console.error("🚨 FORENSIC SECURITY SYSTEM ERROR: Capture engagement drop:", error); 
      }
    }
  },

  stopForensicCapture: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try { 
        await KavachNative.stopForensicCapture(); 
      } catch (error) { 
        console.error("🚨 FORENSIC SECURITY SYSTEM ERROR: Capture seal drop:", error); 
      }
    }
  },

  setAppStealthMode: async (options: { enabled: boolean }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.setAppStealthMode(options);
      } catch (error) {
        console.error("🚨 STEALTH BRIDGE ERROR:", error);
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
  }
};
