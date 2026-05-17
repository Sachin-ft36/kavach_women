import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { KavachNative, KavachSafe } from './KavachNative';
import { toast } from 'sonner';

/**
 * 🛰️ STRATEGIC BACKGROUND SENTINEL
 * Ensures that SOS alerts trigger hardware alarms even if the app is in the background.
 */
import { useKavachStore } from '../store/useKavachStore';

export const initializeBackgroundSentinel = async () => {
  if (!Capacitor.isNativePlatform()) return;

  const platform = Capacitor.getPlatform();

  try {
    // 🛡️ INITIATE NATIVE HARDWARE SENTINEL (Background Persistence)
    await KavachSafe.startBackgroundSentinel();
    await KavachSafe.startVoiceSentinel();

    // 🔋 REQUEST BATTERY EXEMPTION (Mandatory for Background Survival)
    const batteryStatus = await KavachSafe.isIgnoringBatteryOptimizations();
    if (!batteryStatus.isExempt) {
      toast.warning("Background Protection Restricted", {
        description: "Please allow Kavach to run without battery optimization for 100% safety.",
        action: {
          label: "Fix Now",
          onClick: () => KavachSafe.openBatterySettings()
        }
      });
    }

    // 1. Request Permissions
    const status = await PushNotifications.checkPermissions();
    if (status.receive !== 'granted') {
      await PushNotifications.requestPermissions();
    }
    await PushNotifications.register();

    // 🎯 LOG FCM TOKEN (Cross-Platform)
    await PushNotifications.addListener('registration', token => {
      console.log(`🚀 KAVACH [${platform.toUpperCase()}] TOKEN:`, token.value);
    });

    // 2. 🍏 iOS / 🤖 Android: Background Alert Handling
    await PushNotifications.addListener('pushNotificationReceived', notification => {
      const { role } = useKavachStore.getState(); // 🛡️ GET CURRENT ROLE
      const data = notification.data;
      const isCritical = data?.type === 'SOS_ALERT' || data?.priority === 'high' || data?.shadow === 'true';

      if (isCritical) {
        // 🚨 TACTICAL SIREN: Only for Responders (Protector/SuperCell)
        if (role === 'protector' || role === 'super_cell' || role === 'admin') {
          KavachSafe.startContinuousSiren();
          if (platform === 'ios') KavachSafe.triggerHapticPulse();
        }

        toast.info("🚨 TACTICAL ALERT: EMERGENCY IN PROGRESS", {
          duration: 10000,
          position: platform === 'ios' ? 'top-center' : 'bottom-center'
        });
      }
    });

    // 3. User Interaction Logic
    await PushNotifications.addListener('pushNotificationActionPerformed', action => {
      const data = action.notification.data;
      // If it's a shadow intercept, jump straight to SOS HUD
      window.location.href = data?.type === 'SOS_ALERT' ? '/sos' : '/';
    });
    
    // 🛡️ NATIVE HARDWARE PANIC TRIGGER (Power Button Hold)
    KavachSafe.addListener('onPanicTrigger', async () => {
      const store = useKavachStore.getState();
      if (!store.isShadowActive && !store.isSOSActive) {
        console.warn("🚨 KAVACH HARDWARE PANIC: Initiating Silent ThreatProtect Protocol...");
        localStorage.setItem('kavach_shadow_stealth', 'true');
        store.setShadowActive(true);
        toast.error("THREATPROTECT ENGAGED SILENTLY", {
          description: "Hardware Panic detected. Forensic capture active.",
          duration: 2000
        });
      }
    });

    // 🛡️ NATIVE HARDWARE STOP TRIGGER (Volume Down Hold)
    KavachSafe.addListener('onStopTrigger', async () => {
      const store = useKavachStore.getState();
      if (store.isShadowActive) {
        console.log("🛡️ KAVACH HARDWARE STOP: Sealing Forensic Evidence...");
        store.setShadowActive(false);
        localStorage.removeItem('kavach_shadow_stealth');
        toast.success("FORENSIC LOG SEALED", {
          description: "Stealth recording ended and secured in vault.",
        });
      }
    });

    // 🛰️ BACKGROUND HEARTBEAT (Debug Sentinel Vitality)
    setInterval(() => {
      console.log("🛰️ KAVACH BACKGROUND PULSE: Sentinel is Vigilant. Sensors Active.");
    }, 15000); // Pulse every 15 seconds

  } catch (error) {
    console.error(`Background Sentinel [${platform}] Failed:`, error);
  }
};
