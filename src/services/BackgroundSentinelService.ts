import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { KavachNative, KavachSafe } from './KavachNative';
import { toast } from 'sonner';

/**
 * 🛰️ STRATEGIC BACKGROUND SENTINEL
 * Ensures that SOS alerts trigger hardware alarms even if the app is in the background.
 */
import { useKavachStore } from '../state/useKavachStore';

export const initializeBackgroundSentinel = async () => {
  if (!Capacitor.isNativePlatform()) return;

  const platform = Capacitor.getPlatform();

  try {
    // 🛡️ INITIATE NATIVE HARDWARE SENTINEL (Background Persistence)
    await KavachSafe.startBackgroundSentinel();

    // 🔒 REQUEST LOCK SCREEN & FULL SCREEN INTENT PERMISSIONS (For lock screen bypass alerts)
    await KavachSafe.requestLockScreenPermission().catch(() => {});
    try {
      const fsIntent = await KavachSafe.hasFullScreenIntentPermission();
      if (fsIntent && !fsIntent.granted) {
        await KavachSafe.openFullScreenIntentSettings();
      }
    } catch {}

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
        const isSilent = localStorage.getItem('kavach_silent_notifications_enabled') === 'true';

        // 🚨 TACTICAL SIREN: Active for Patrolling Units, Protectors, & Command
        if (role === 'guardian' || role === 'super_cell' || role === 'admin' || role === 'protector') {
          if (!isSilent) {
            KavachSafe.startContinuousSiren();
            KavachSafe.triggerHapticPulse().catch(() => {});
          }

          // Force a Heads-Up Banner over other open apps / lock screen
          KavachSafe.showUrgentNotification({
            title: "🚨 EMERGENCY ALERT: EXTREME",
            body: notification.body || "A nearby citizen has triggered an active SOS distress signal. Deploy immediately!",
            id: notification.id || "kavach_sos",
            sound: isSilent ? "none" : "siren"
          }).catch(() => {});
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
      if (store.role !== 'citizen') return; // Power Button Trigger is ONLY for Citizens (Victims)

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
      if (store.role !== 'citizen') return;

      if (store.isShadowActive) {
        console.log("🛡️ KAVACH HARDWARE STOP: Sealing Forensic Evidence...");
        store.setShadowActive(false);
        localStorage.removeItem('kavach_shadow_stealth');
        toast.success("FORENSIC LOG SEALED", {
          description: "Stealth recording ended and secured in vault.",
        });
      }
    });

    // 🛡️ NATIVE HARDWARE ACCELEROMETER IMPACT TRIGGER (Lock screen safe fall-detection)
    KavachSafe.addListener('onImpactTrigger', async (data: { gForce: number }) => {
      const store = useKavachStore.getState();
      if (store.role !== 'citizen') return; // Crash detection is ONLY for Citizens

      if (!store.isSOSActive && !store.isSOSBlocked) {
        console.error("🚨 KAVACH NATIVE SENTINEL: Critical G-Force Impact Detected in Background!", data.gForce);
        window.dispatchEvent(new CustomEvent('sos-impact-trigger', { detail: { gForce: data.gForce } }));
      }
    });

    // 🛡️ NATIVE HARDWARE TRIPLE POCKET-TAP TRIGGER (Lock screen check-in)
    KavachSafe.addListener('onPocketTapTrigger', async () => {
      const store = useKavachStore.getState();
      console.log("🛰️ KAVACH NATIVE SENTINEL: Native Triple Pocket-Tap check-in recorded!");
      store.resetSentinelPulse();
      if (platform === 'ios' || platform === 'android') {
        KavachSafe.triggerHapticPulse().catch(() => {});
      }
      toast.success("SENTINEL CHECK-IN SUCCESSFUL", {
        description: "Safety timer reset successfully without unlocking device."
      });
    });

    // 🛰️ BACKGROUND HEARTBEAT (Debug Sentinel Vitality)
    setInterval(() => {
      console.log("🛰️ KAVACH BACKGROUND PULSE: Sentinel is Vigilant. Sensors Active.");
    }, 15000); // Pulse every 15 seconds

  } catch (error) {
    console.error(`Background Sentinel [${platform}] Failed:`, error);
  }
};
