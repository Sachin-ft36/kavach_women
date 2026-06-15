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
  },

  startBleSOSAdvertising: async (options: { victimUid: string; latitude: number; longitude: number }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startBleSOSAdvertising(options);
      } catch (error) {
        console.error("🚨 BLE MESH FAULT: Failed to start advertising BLE beacon:", error);
      }
    }
  },

  stopBleSOSAdvertising: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopBleSOSAdvertising();
      } catch (error) {
        console.error("🚨 BLE MESH FAULT: Failed to stop advertising BLE beacon:", error);
      }
    }
  },

  startBleSOSScanning: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startBleSOSScanning();
      } catch (error) {
        console.error("🚨 BLE MESH FAULT: Failed to start scanning for BLE beacons:", error);
      }
    }
  },

  stopBleSOSScanning: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopBleSOSScanning();
      } catch (error) {
        console.error("🚨 BLE MESH FAULT: Failed to stop scanning for BLE beacons:", error);
      }
    }
  }
};
