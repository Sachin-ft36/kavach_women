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

        // Tactical Action Check
        if (remoteMessage.getData().size() > 0) {
            String action = remoteMessage.getData().get("action");
            if ("start_siren".equals(action)) {
                Log.i(TAG, "CODE RED: Background Siren Triggered via FCM.");
                showEmergencyNotification("🚨 SIREN ACTIVATED", "KAVACH has detected a nearby mission alert!");
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

        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.tactical_siren);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Emergency Siren", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Continuous Emergency Siren Alerts");
            channel.setSound(soundUri, new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            notificationManager.createNotificationChannel(channel);
        }

        Notification notification = new NotificationCompat.Builder(this, channelId)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(Notification.CATEGORY_ALARM)
                .setSound(soundUri)
                .setOngoing(true)
                .setAutoCancel(false)
                .build();

        notificationManager.notify(1002, notification);
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
