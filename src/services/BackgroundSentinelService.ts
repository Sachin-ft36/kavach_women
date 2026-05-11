import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from './KavachNative';
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

  } catch (error) {
    console.error(`Background Sentinel [${platform}] Failed:`, error);
  }
};
