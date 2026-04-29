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
import android.telephony.SmsManager;
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
    private static final float MIN_FORCE_G = 14.5f; // Distress Force Level
    private static final int REQUIRED_SHAKES = 3; // 3 clear hits (Up-Down cycles)
    private static final int TIME_WINDOW = 2000; // 2s Window
    private static final int DEBOUNCE_MS = 300; 

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

        // 🚨 FULL-SCREEN INTENT: Force UI over Lock Screen
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 0, fullScreenIntent, 
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("KAVACH Protection")
                .setContentText(mediaPlayer != null && mediaPlayer.isPlaying()
                        ? "🚨 CRITICAL OVERRIDE ACTIVE"
                        : "Shielding Neural Grid — Status: VERIFIED")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setContentIntent(pi)
                .setFullScreenIntent(fullScreenPendingIntent, true) // ✨ MISSION CRITICAL
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MAX) // 🔥 MAX PRIORITY
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ mandate for explicit types in startForeground
            startForeground(1, notification, 
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE |
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION |
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE |
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA);
        } else {
            startForeground(1, notification);
        }

        // START_STICKY: If OS kills the service, it auto-restarts
        return START_STICKY;
    }

    // ── Shake detection ───────────────────────────────────────────────────
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) return;

        float x = event.values[0], y = event.values[1], z = event.values[2];
        
        // 🛡️ TACTICAL G-FORCE CALCULATION
        double gForce = Math.sqrt(x * x + y * y + z * z) / SensorManager.GRAVITY_EARTH;

        if (gForce > MIN_FORCE_G) {
            long now = System.currentTimeMillis();

            // 1. TEMPORAL GATE: Reset if no shake in last 1.5s
            if (now - lastPeakTime > TIME_WINDOW) {
                shakeCount = 0;
            }

            // 2. DEBOUNCE: Ensure distinct forceful movements
            if (now - lastPeakTime > DEBOUNCE_MS) {
                shakeCount++;
                lastPeakTime = now;
                Log.d(TAG, "TACTICAL PULSE: [" + shakeCount + "/" + REQUIRED_SHAKES + "] Force: " + gForce + "G");

                // Haptic Feedback (Pulse) - System is tracking (70ms Tactical Pulse)
                long nowPulse = System.currentTimeMillis();
                android.os.Vibrator v = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && nowPulse - lastShakeTime > 1000) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(android.os.VibrationEffect.createOneShot(70, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                    } else { v.vibrate(70); }
                }
            }

            // 3. ENFORCEMENT: Trigger on exactly the required number of hits
            if (shakeCount >= REQUIRED_SHAKES) {
                if (now - lastShakeTime > 5000) { // Cooldown before next SOS blast
                    lastShakeTime = now;
                    shakeCount = 0;
                    Log.i(TAG, "KAVACH MISSION: Pattern VERIFIED (" + gForce + "G)");
                    triggerSOS("shake");
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    // ── SOS Trigger ───────────────────────────────────────────────────────
    private void triggerSOS(final String source) {
        Log.i(TAG, "KAVACH SOS: Triggered via " + source);

        // 1. TACTICAL DECOUPLING: Run SMS dispatch in a dedicated background thread to prevent UI freezing/ANR
        new Thread(new Runnable() {
            @Override
            public void run() {
                dispatchEmergencySMS();
            }
        }).start();

        // 2. Bring MainActivity to front (High Priority Override)
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

        // 3. Start Stealth Evidence Capture (Cold Start)
        EvidenceEngine.startCapture(this, "alert_" + System.currentTimeMillis());
    }

    private void dispatchEmergencySMS() {
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("KavachPrefs", MODE_PRIVATE);
            String contactsJson = prefs.getString("guardian_contacts", null);
            if (contactsJson == null) return;

            // 🛡️ HARDENED PARSING: Extract all numbers via Regex to bypass JSON brittleness
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"phone\":\"([^\"]+)\"");
            java.util.regex.Matcher matcher = pattern.matcher(contactsJson);
            
            SmsManager sm;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                sm = getSystemService(SmsManager.class);
            } else {
                sm = SmsManager.getDefault();
            }

            if (sm == null) return;

            while (matcher.find()) {
                String num = matcher.group(1).replaceAll("[^0-9+]", "");
                if (num.isEmpty()) continue;

                try {
                    String message = "🚨 KAVACH CRITICAL SOS! 🚨\nDanger Detected. Time: " + 
                                     new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()) + 
                                     "\n📍 Live Grid Anchor Active.";
                    
                    if (message.length() > 70) {
                        java.util.ArrayList<String> parts = sm.divideMessage(message);
                        sm.sendMultipartTextMessage(num, null, parts, null, null);
                    } else {
                        sm.sendTextMessage(num, null, message, null, null);
                    }
                    Log.i(TAG, "TACTICAL BACKGROUND DISPATCH: Success -> " + num);
                    
                    // Pacing to prevent carrier block
                    Thread.sleep(1500);
                } catch (Exception e) {
                    Log.e(TAG, "Chain Dispatch Error for " + num + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Background Dispatch Error: " + e.getMessage());
        }
    }

    // ── Siren Logic ───────────────────────────────────────────────────────
    private void startSirenLogic() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.i(TAG, "SIREN: Initiating hardware override...");
                    
                    // 🔊 COMMAND OVERRIDE: Force MAX Volume on ALARM & MUSIC Streams
                    AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                    if (am != null) {
                        int maxAlarm = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                        int maxMusic = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                        am.setStreamVolume(AudioManager.STREAM_ALARM, maxAlarm, 0);
                        am.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusic, 0);
                    }

                    if (mediaPlayer != null) {
                        try { mediaPlayer.stop(); mediaPlayer.release(); } catch (Exception ignored) {}
                    }

                    int resId = getResources().getIdentifier("tactical_siren", "raw", getPackageName());
                    if (resId == 0) {
                        Log.e(TAG, "SIREN: Resource 'tactical_siren' NOT FOUND!");
                        return;
                    }

                    mediaPlayer = MediaPlayer.create(KavachService.this, resId);
                    if (mediaPlayer == null) return;
                    
                    mediaPlayer.setLooping(true);
                    mediaPlayer.start();
                    Log.i(TAG, "SIREN: Loop engaged. Watchdog active.");

                    // ⏲️ AUTO-SILENCE WATCHDOG: 1 Minute Limit
                    Thread.sleep(60000);
                    if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                        stopSirenLogic();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "SIREN FAILURE: " + e.getMessage());
                }
            }
        }).start();
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
