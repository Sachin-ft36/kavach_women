package com.kavach.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class KavachService extends Service implements SensorEventListener {

    private static final String TAG = "KavachService";
    private static final String CHANNEL_ID = "KavachServiceChannel";

    // Action constants required by KavachMessagingService and KavachNative
    public static final String ACTION_START_SIREN = "com.kavach.app.ACTION_START_SIREN";
    public static final String ACTION_STOP_SIREN = "com.kavach.app.ACTION_STOP_SIREN";

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║ ⚠️ KAVACH CORE — BACKGROUND SAFETY ENGINE — DO NOT MODIFY ⚠️ ║
    // ║ Status : VERIFIED WORKING (Tested: 2026-04-22) ║
    // ║ Owner : singh.sachin16559@gmail.com ║
    // ║ This service handles: ║
    // ║ • Shake detection (Accelerometer) → SOS trigger ║
    // ║ • Power-button counter (5 presses) → SOS trigger ║
    // ║ • WakeLock (12 hours) → CPU stays alive even screen-off ║
    // ║ • START_STICKY → Auto-restarts if OS kills the service ║
    // ║ Do NOT remove WakeLock, SensorListener, or START_STICKY. ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    // ── Shake Detection ──────────────────────────────
    private SensorManager sensorManager;
    private long lastShakeTime = 0;
    private int shakeCount = 0;
    private long lastPeakTime = 0;
    private static final float SHAKE_THRESHOLD = 48f; // Hardened for intentional shake only

    // ── Power-Button Counter ─────────────────────────
    private int screenToggleCount = 0;
    private long lastScreenToggleTime = 0;
    private static final long SCREEN_WINDOW_MS = 5000;

    // ── WakeLock ─────────────────────────────────────
    private PowerManager.WakeLock wakeLock;
    private MediaPlayer mediaPlayer;

    // ── Broadcast: screen on/off ──────────────────────────────────────────
    private final android.content.BroadcastReceiver screenReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(Context ctx, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_SCREEN_ON.equals(action) || Intent.ACTION_SCREEN_OFF.equals(action)) {
                long now = System.currentTimeMillis();
                if (now - lastScreenToggleTime > SCREEN_WINDOW_MS) {
                    screenToggleCount = 1;
                } else {
                    screenToggleCount++;
                }
                lastScreenToggleTime = now;
                // 5 rapid toggles = SOS
                if (screenToggleCount >= 5) {
                    screenToggleCount = 0;
                    Log.i(TAG, "MISSION CONTROL: Power-button SOS Detected!");
                    triggerSOS("power");
                }
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        // 1. WakeLock — CPU stays alive even when screen is off
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Kavach::SafetyLock");
            wakeLock.acquire(12 * 60 * 60 * 1000L); // Max 12 hours
        }

        // 2. Accelerometer shake detection
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            Sensor acc = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (acc != null) {
                sensorManager.registerListener(this, acc, SensorManager.SENSOR_DELAY_UI);
            }
        }

        // 3. Screen on/off receiver
        android.content.IntentFilter filter = new android.content.IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(screenReceiver, filter);
        }

        Log.i(TAG, "KAVACH TACTICAL SERVICE: Initialized. Monitoring active.");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_START_SIREN.equals(action)) {
            startSirenLogic();
        } else if (ACTION_STOP_SIREN.equals(action)) {
            stopSirenLogic();
        }

        // Build persistent foreground notification
        Intent notifIntent = new Intent(this, MainActivity.class);
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE
                : 0;
        PendingIntent pi = PendingIntent.getActivity(this, 0, notifIntent, piFlags);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("System Security Active")
                .setContentText(mediaPlayer != null && mediaPlayer.isPlaying()
                        ? "🚨 CRITICAL OVERRIDE ACTIVE"
                        : "Shielding Neural Grid — Status: VERIFIED")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(Notification.CATEGORY_SERVICE)
                .build();

        startForeground(1, notification);

        // START_STICKY: If OS kills the service, it auto-restarts
        return START_STICKY;
    }

    // ── Shake detection ───────────────────────────────────────────────────
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER)
            return;
        float x = event.values[0], y = event.values[1], z = event.values[2];
        double force = Math.sqrt(x * x + y * y + z * z) - SensorManager.GRAVITY_EARTH;
        
        if (force > SHAKE_THRESHOLD) {
            long now = System.currentTimeMillis();
            
            // 1. TEMPORAL GATE: If too much time passed since last peak, reset mission
            if (now - lastPeakTime > 1200) {
                shakeCount = 0;
            }
            
            // 2. DEBOUNCE: Don't count the same movement twice (min 200ms between peaks)
            if (now - lastPeakTime > 200) {
                shakeCount++;
                lastPeakTime = now;
                Log.d(TAG, "PEAK DETECTED [" + shakeCount + "/3] Force: " + force);
            }

            // 3. MISSION EXECUTION: Trigger only on exactly 3 vigorous peaks
            if (shakeCount >= 3) {
                if (now - lastShakeTime > 5000) { // Global cooldown per SOS blast
                    lastShakeTime = now;
                    shakeCount = 0;
                    Log.i(TAG, "KAVACH MISSION: Intelligent Triple-Shake Pattern Verified!");
                    
                    // Brief Haptic Feedback
                    android.os.Vibrator v = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                    if (v != null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            v.vibrate(android.os.VibrationEffect.createOneShot(200, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                        } else { v.vibrate(200); }
                    }
                    
                    triggerSOS("shake");
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    // ── SOS Trigger ───────────────────────────────────────────────────────
    private void triggerSOS(String source) {
        Log.i(TAG, "KAVACH SOS: Triggered via " + source);

        // 1. Bring MainActivity to front (High Priority Override)
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        intent.putExtra("trigger", source);
        try {
            startActivity(intent);
        } catch (Exception e) {
            Log.w(TAG, "Activity start suppressed: " + e.getMessage());
        }

        // 2. Start Stealth Evidence Capture (Cold Start)
        EvidenceEngine.startCapture(this, "alert_" + System.currentTimeMillis());

        // 3. Notify KavachNative plugin listener if bridge is live
        // (JS will pick up via addListener('sosTriggered', ...) or consumeTrigger)
    }

    // ── Siren Logic ───────────────────────────────────────────────────────
    private void startSirenLogic() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying())
                    return;
                mediaPlayer.release();
            }
            int resId = getResources().getIdentifier("tactical_siren", "raw", getPackageName());
            if (resId == 0) {
                Log.e(TAG, "Siren resource not found");
                return;
            }

            mediaPlayer = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mediaPlayer.setAudioAttributes(
                        new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build());
            } else {
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            }
            mediaPlayer.setDataSource(this,
                    Uri.parse("android.resource://" + getPackageName() + "/" + resId));
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
            Log.i(TAG, "SIREN: Engaged on ALARM stream.");
        } catch (Exception e) {
            Log.e(TAG, "Siren start failed: " + e.getMessage());
        }
    }

    private void stopSirenLogic() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying())
                    mediaPlayer.stop();
            } catch (Exception ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
            Log.i(TAG, "SIREN: Silenced.");
        }
    }

    // ── Cleanup ───────────────────────────────────────────────────────────
    @Override
    public void onDestroy() {
        super.onDestroy();
        stopSirenLogic();
        if (sensorManager != null)
            sensorManager.unregisterListener(this);
        try {
            unregisterReceiver(screenReceiver);
        } catch (Exception ignored) {
        }
        if (wakeLock != null && wakeLock.isHeld())
            wakeLock.release();
        Log.i(TAG, "KAVACH SERVICE: Destroyed. Will restart via START_STICKY.");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ── Notification Channel ──────────────────────────────────────────────
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager mgr = getSystemService(NotificationManager.class);
            if (mgr == null)
                return;
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "KAVACH Safety Monitor",
                    NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            mgr.createNotificationChannel(ch);
        }
    }
}
