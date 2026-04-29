package com.kavach.app;

import android.content.Intent;
import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.content.Context;
import android.media.AudioAttributes;

public class KavachMessagingService extends FirebaseMessagingService {
    private static final String TAG = "KavachMessaging";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.i(TAG, "SIGNAL RECEIVED: Processing background tactical data...");

        // 🛡️ CPU SHOCK: Wake the processor for 10s to ensure service transition
        android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            android.os.PowerManager.WakeLock wl = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK | android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP, "Kavach:FCMWakeup");
            wl.acquire(10000); // Hold for 10 sec
        }

        // Tactical Action Check
        if (remoteMessage.getData().size() > 0) {
            String action = remoteMessage.getData().get("action");
            String type = remoteMessage.getData().get("type");
            String customTitle = remoteMessage.getData().get("title");
            String customBody = remoteMessage.getData().get("body");
            
            if ("start_siren".equals(action) || "SOS_ALERT".equals(type)) {
                Log.i(TAG, "CODE RED: Background Siren Triggered via FCM.");
                String displayTitle = customTitle != null ? customTitle : "🚨 SIREN ACTIVATED";
                String displayBody = customBody != null ? customBody : "KAVACH has detected a nearby mission alert!";
                
                showEmergencyNotification(displayTitle, displayBody);
                triggerServiceSiren(KavachService.ACTION_START_SIREN);
            } else if ("stop_siren".equals(action)) {
                Log.i(TAG, "MISSION CLEAR: Background Siren Silenced via FCM.");
                triggerServiceSiren(KavachService.ACTION_STOP_SIREN);
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) manager.cancel(1002);
            }
        }
    }

    private void showEmergencyNotification(String title, String body) {
        String channelId = "emergency_siren_channel";
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        // Sound resource for the notification itself
        int resId = getResources().getIdentifier("tactical_siren", "raw", getPackageName());
        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + resId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Emergency Siren", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Continuous Emergency Siren Alerts");
            
            // Set sound for the channel
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            channel.setSound(soundUri, audioAttributes);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            
            notificationManager.createNotificationChannel(channel);
        }

        Notification notification = new NotificationCompat.Builder(this, channelId)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(Notification.CATEGORY_ALARM)
                .setSound(soundUri)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setOngoing(true)
                .setAutoCancel(false)
                .build();

        notificationManager.notify(1002, notification);
        
        // Trigger haptic pulse via Vibrator service
        android.os.Vibrator v = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(android.os.VibrationEffect.createOneShot(1000, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(1000);
            }
        }
    }

    private void triggerServiceSiren(String action) {
        Intent serviceIntent = new Intent(this, KavachService.class);
        serviceIntent.setAction(action);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "NEW TACTICAL TOKEN: " + token);
        // This token is handled by the frontend registration listener in App.tsx
    }
}
