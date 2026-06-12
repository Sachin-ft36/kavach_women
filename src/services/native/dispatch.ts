import { Capacitor } from '@capacitor/core';
import { KavachNative } from './KavachPluginInterface';

export const KavachSafeDispatch = {
  broadcastEmergencySMS: async (options: { numbers: string[]; message: string }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("📡 DISPATCH [NATIVE]: Blasting Emergency SMS to Guardians:", options.numbers);
        return await KavachNative.broadcastEmergencySMS(options);
      } catch (error) {
        console.error("🚨 DISPATCH FAULT: SMS Hardware Bridge Failure:", error);
      }
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
    }
  }
};
