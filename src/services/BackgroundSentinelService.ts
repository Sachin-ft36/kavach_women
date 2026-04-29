import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from 'sonner';

const KavachNative = registerPlugin<any>('KavachPlugin');

/**
 * 🛰️ STRATEGIC BACKGROUND SENTINEL
 * Ensures that SOS alerts trigger hardware alarms even if the app is in the background.
 */
export const initializeBackgroundSentinel = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Request Permissions
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      // 2. Register with FCM/APNS
      await PushNotifications.register();
    }

    // 🎯 LOG FCM TOKEN FOR TESTING
    await PushNotifications.addListener('registration', token => {
      console.log('🚀 KAVACH FCM TOKEN:', token.value);
      // You can also show this in a toast for easy copying
    });

    // 3. Listener: Received Notification while app is in foreground OR background
    await PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('🚨 BACKGROUND ALERT RECEIVED:', notification);
      
      const data = notification.data;
      if (data?.type === 'SOS_ALERT' || data?.priority === 'high') {
        // TRIGGER HARDWARE SIREN VIA NATIVE BRIDGE
        // This works even if the app is backgrounded because the native bridge is called
        KavachNative.startContinuousSiren().catch((err: any) => {
          console.error("Failed to start siren from background:", err);
        });
        
        toast.info("🚨 NEARBY EMERGENCY DETECTED IN BACKGROUND!", {
          duration: 10000,
          position: 'top-center'
        });
      }
    });

    // 4. Listener: User tapped on the notification
    await PushNotifications.addListener('pushNotificationActionPerformed', action => {
      console.log('🎯 USER INTERCEPTED VIA NOTIFICATION:', action);
      // Navigate to Dashboard or specific alert if needed
      window.location.href = '/'; 
    });

  } catch (error) {
    console.error("Background Sentinel Initialization Failed:", error);
  }
};
