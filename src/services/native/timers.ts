import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { KavachNative } from './KavachPluginInterface';

export const KavachSafeTimers = {
  startSafeTimer: async (options: { durationMins: number }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.startSafeTimer(options);
      } catch (error) {
        console.error("🚨 NATIVE TIMER ERROR:", error);
      }
    }
  },

  stopSafeTimer: async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.stopSafeTimer();
      } catch (error) {
        console.error("🚨 NATIVE TIMER ERROR:", error);
      }
    }
  },

  scheduleFakeCall: async (options: { delaySeconds: number }): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await KavachNative.scheduleFakeCall(options);
      } catch (error) {
        console.error("🚨 NATIVE FAKE CALL ERROR:", error);
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
    }
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
  }
};
