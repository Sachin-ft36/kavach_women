package com.kavach.app;

import android.content.Intent;
import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.app.Notification;
import android.app.PendingIntent;
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
    public void onMessageReceived(@androidx.annotation.NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.i(TAG, "SIGNAL RECEIVED: Processing background tactical data...");

        // 🛡️ CPU SHOCK: Wake the processor for 10s to ensure service transition stability
        android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
        android.os.PowerManager.WakeLock wl = null;
        try {
            if (pm != null) {
                // Remove ACQUIRE_CAUSES_WAKEUP as it should be used with screen-on wakelocks, not PARTIAL_WAKE_LOCK
                wl = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "Kavach:FCMWakeup");
                wl.acquire(10000); // Hold for 10 sec
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock acquisition bypassed: " + e.getMessage());
        }

        // Tactical Action Payload Check
        if (!remoteMessage.getData().isEmpty()) {
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

        // Clean release context safety safeguard 
        if (wl != null && wl.isHeld()) {
            try {
                wl.release();
            } catch (Exception ignored) {}
        }
    }

    private void showEmergencyNotification(String title, String body) {
        String channelId = "emergency_siren_channel";
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        // Sound resources fallback framework
        int resId = getResources().getIdentifier("tactical_siren", "raw", getPackageName());
        Uri soundUri = (resId != 0) 
                ? Uri.parse("android.resource://" + getPackageName() + "/" + resId)
                : android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = notificationManager.getNotificationChannel(channelId);
            if (channel == null) {
                channel = new NotificationChannel(channelId, "Emergency Siren", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Continuous Emergency Siren Alerts");
                
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build();
                channel.setSound(soundUri, audioAttributes);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 500, 200, 500});
                
                notificationManager.createNotificationChannel(channel);
            }
        }

        // Create full screen intent to wake up lock screen and open MainActivity directly
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("action", "GO_TO_EMERGENCY_SCREEN");
        fullScreenIntent.putExtra("trigger", "FCM_ALERT");

        // 🔐 SECURE PENDINGINTENT FLAGS SETUP: Explicit separation matching API rules
        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 0, fullScreenIntent, pendingIntentFlags);

        Notification notification = new NotificationCompat.Builder(this, channelId)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(soundUri)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setFullScreenIntent(fullScreenPendingIntent, true) // 🚨 Forces lockscreen presentation overlay
                .setOngoing(true)
                .setAutoCancel(false)
                .build();

        notificationManager.notify(1002, notification);
        
        // Trigger native vibration alert pattern
        android.os.Vibrator v = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(android.os.VibrationEffect.createOneShot(1000, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(1000);
                }
            } catch (Exception e) {
                Log.w(TAG, "Haptic pulse execution failure: " + e.getMessage());
            }
        }
    }

    private void triggerServiceSiren(String action) {
        Intent serviceIntent = new Intent(this, KavachService.class);
        serviceIntent.setAction(action);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Background execution constraints rejected service startup request: " + e.getMessage());
            // Fallback: If OS refuses background startup directly, context execution relies heavily 
            // on the fullScreenPendingIntent notification channel instantiation configured above.
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "NEW TACTICAL TOKEN: " + token);
    }
}
