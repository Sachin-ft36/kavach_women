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
import android.telephony.TelephonyManager;
import android.telephony.PhoneStateListener;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.os.ParcelUuid;
import java.nio.ByteBuffer;
import java.util.UUID;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

// Agora WebRTC Native Imports
import io.agora.rtc2.Constants;
import io.agora.rtc2.IRtcEngineEventHandler;
import io.agora.rtc2.RtcEngine;
import io.agora.rtc2.RtcEngineConfig;
import io.agora.rtc2.ChannelMediaOptions;

public class KavachService extends Service implements SensorEventListener {

    private static final String TAG = "KavachService";
    private static final String CHANNEL_ID = "KavachServiceChannel_Silent";

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
    private static final float MIN_FORCE_G = 3.5f; // Distress Force Level
    private static final int REQUIRED_SHAKES = 3; // 3 clear hits (Up-Down cycles)
    private static final int TIME_WINDOW = 2000; // 2s Window
    private static final int DEBOUNCE_MS = 300; 

    // ── Proximity pocket/bag filter ──────────────────
    private boolean isPhoneInPocket = false;

    // ── BLE Mesh SOS Relays ──────────────────────────
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeAdvertiser bleAdvertiser;
    private BluetoothLeScanner bleScanner;
    private AdvertiseCallback advertiseCallback;
    private ScanCallback scanCallback;
    private final Set<String> processedBeacons = new HashSet<>();
    private final Handler deduplicationCleanupHandler = new Handler(Looper.getMainLooper());

    // ── Power-Button Counter ─────────────────────────
    private int screenToggleCount = 0;
    private long lastScreenToggleTime = 0;
    private static final long SCREEN_WINDOW_MS = 3000;

    // ── Voice Detection (Native Vosk Engine) ─────────────
    private org.vosk.Model voskModel;
    private org.vosk.android.SpeechService speechService;
    private boolean isListening = false;

    // ── Voice Sliding Window States ───────────────────
    private int helpWordCount = 0;
    private int bachaoWordCount = 0;
    private int kavachWordCount = 0;
    private int regionalWordCount = 0;
    private long lastVoiceEventTime = 0;
    private static final long VOICE_WINDOW_MS = 6000; // 6s rolling time window

    // ── WakeLock ─────────────────────────────────────
    private PowerManager.WakeLock wakeLock;
    private MediaPlayer mediaPlayer;

    // ── Auto-Kill Failsafe ───────────────────────────
    private Handler autoKillHandler;
    private Runnable autoKillRunnable;
    private static final long AUTO_KILL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

    // ── Agora WebRTC Native Engine ───────────────────
    private RtcEngine mRtcEngine;
    private static final String AGORA_APP_ID = "989160effa7f461490a2d0cc54994cdb";

    // ── Broadcast: System Status ──────────────────────────────────────────
    private final android.content.BroadcastReceiver systemReceiver = new android.content.BroadcastReceiver() {
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
                
                // 🔐 RE-INIT SPEECH ON SCREEN TOGGLE: Ensures listener doesn't go stale
                if (isListening) startVoiceSentinel();

                // 3 rapid toggles = SOS (Synchronizes perfectly with Native Android SOS)
                if (screenToggleCount >= 3) {
                    screenToggleCount = 0;
                    Log.i(TAG, "MISSION CONTROL: Power-button SOS Detected!");
                    triggerSOS("power");
                }
            } else if (Intent.ACTION_SHUTDOWN.equals(action) || Intent.ACTION_BATTERY_LOW.equals(action)) {
                if (isSOSMissionActive) {
                    Log.w(TAG, "CRITICAL: Device shutting down during active SOS. Firing final offline SMS...");
                    dispatchEmergencySMSWithLocation(false, true); 
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

        // Initialize Bluetooth LE components
        BluetoothManager bm = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        if (bm != null) {
            bluetoothAdapter = bm.getAdapter();
        }

        // 2. Accelerometer shake detection
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            Sensor acc = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (acc != null) {
                sensorManager.registerListener(this, acc, SensorManager.SENSOR_DELAY_GAME);
            }
            // Register Proximity Sensor to filter out false pocket shakes
            Sensor prox = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);
            if (prox != null) {
                sensorManager.registerListener(this, prox, SensorManager.SENSOR_DELAY_GAME);
            }
        }

        // 3. Native Voice Sentinel initialization
        initVoiceSentinel();

        // 4. System status receiver (Screen, Shutdown, Battery)
        android.content.IntentFilter filter = new android.content.IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SHUTDOWN);
        filter.addAction(Intent.ACTION_BATTERY_LOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(systemReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(systemReceiver, filter);
        }

        // 5. Phone State Listener for Call detection (Mic collision prevention)
        TelephonyManager telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        if (telephonyManager != null) {
            telephonyManager.listen(new PhoneStateListener() {
                @Override
                public void onCallStateChanged(int state, String phoneNumber) {
                    if (state == TelephonyManager.CALL_STATE_RINGING || state == TelephonyManager.CALL_STATE_OFFHOOK) {
                        Log.i(TAG, "📞 TELEPHONY: Call Active. Suspending Voice Sentinel...");
                        if (speechService != null) {
                            speechService.stop();
                            speechService = null;
                            isListening = false;
                        }
                    } else if (state == TelephonyManager.CALL_STATE_IDLE) {
                        Log.i(TAG, "📞 TELEPHONY: Call Ended. Resuming Voice Sentinel...");
                        if (!isListening && !isSOSMissionActive) {
                            startVoiceSentinel();
                        }
                    }
                }
            }, PhoneStateListener.LISTEN_CALL_STATE);
        }

        Log.i(TAG, "KAVACH TACTICAL SERVICE: Initialized. Monitoring active.");
    }

    private void initVoiceSentinel() {
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("KavachPrefs", MODE_PRIVATE);
            String role = prefs.getString("kavach_user_role", "citizen");
            if (!"citizen".equals(role)) return;

            new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                if (voskModel == null) {
                    java.io.File modelDir = new java.io.File(getFilesDir(), "model");
                    if (modelDir.exists() && modelDir.isDirectory() && new java.io.File(modelDir, "uuid").exists()) {
                        try {
                            voskModel = new org.vosk.Model(modelDir.getAbsolutePath());
                            startVoiceSentinel();
                        } catch (Exception ex) {
                            Log.e(TAG, "Failed to load cached Vosk model: " + ex.getMessage());
                            downloadAndInstallVoskModel();
                        }
                    } else {
                        downloadAndInstallVoskModel();
                    }
                } else {
                    startVoiceSentinel();
                }
            });
        } catch (Exception e) { Log.e(TAG, "Voice Sentinel Init Failed: " + e.getMessage()); }
    }

    private void downloadAndInstallVoskModel() {
        Log.i(TAG, "🎙️ KAVACH SPEECH ENGINE: Initiating dynamic download of Vosk Model...");
        new Thread(() -> {
            java.io.File modelDir = new java.io.File(getFilesDir(), "model");
            java.io.File tempZip = new java.io.File(getCacheDir(), "vosk-model.zip");
            
            try {
                java.net.URL url = new java.net.URL("https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.connect();
                
                if (conn.getResponseCode() != java.net.HttpURLConnection.HTTP_OK) {
                    throw new java.io.IOException("Server returned HTTP " + conn.getResponseCode() + " " + conn.getResponseMessage());
                }
                
                try (java.io.InputStream input = conn.getInputStream();
                     java.io.OutputStream output = new java.io.FileOutputStream(tempZip)) {
                    byte[] data = new byte[4096];
                    int count;
                    while ((count = input.read(data)) != -1) {
                        output.write(data, 0, count);
                    }
                }
                
                if (modelDir.exists()) {
                    deleteRecursive(modelDir);
                }
                modelDir.mkdirs();
                
                unzip(tempZip, getFilesDir());
                
                java.io.File extractedDir = new java.io.File(getFilesDir(), "vosk-model-small-en-in-0.4");
                if (extractedDir.exists()) {
                    extractedDir.renameTo(modelDir);
                }
                
                if (tempZip.exists()) {
                    tempZip.delete();
                }
                
                Log.i(TAG, "🎙️ KAVACH SPEECH ENGINE: Vosk Model downloaded and unpacked successfully.");
                new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                    try {
                        voskModel = new org.vosk.Model(modelDir.getAbsolutePath());
                        startVoiceSentinel();
                    } catch (Exception ex) {
                        Log.e(TAG, "Failed to load newly downloaded model: " + ex.getMessage());
                    }
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to download and unpack Vosk model dynamically: " + e.getMessage());
            }
        }).start();
    }

    private void unzip(java.io.File zipFile, java.io.File targetDirectory) throws java.io.IOException {
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.BufferedInputStream(new java.io.FileInputStream(zipFile)))) {
            java.util.zip.ZipEntry ze;
            int count;
            byte[] buffer = new byte[8192];
            while ((ze = zis.getNextEntry()) != null) {
                java.io.File file = new java.io.File(targetDirectory, ze.getName());
                java.io.File dir = ze.isDirectory() ? file : file.getParentFile();
                if (!dir.isDirectory() && !dir.mkdirs()) {
                    throw new java.io.FileNotFoundException("Failed to ensure directory: " + dir.getAbsolutePath());
                }
                if (ze.isDirectory()) {
                    continue;
                }
                try (java.io.FileOutputStream fout = new java.io.FileOutputStream(file)) {
                    while ((count = zis.read(buffer)) != -1) {
                        fout.write(buffer, 0, count);
                    }
                }
            }
        }
    }

    private void deleteRecursive(java.io.File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            for (java.io.File child : fileOrDirectory.listFiles()) {
                deleteRecursive(child);
            }
        }
        fileOrDirectory.delete();
    }

    private void startVoiceSentinel() {
        try {
            if (isSOSMissionActive) return;

            if (speechService != null) {
                speechService.stop();
                speechService = null;
            }

            if (voskModel != null) {
                // 🛡️ Grammar Lock is OFF. The en-in model is powerful enough to natively detect Indian phonetics
                // without crashing from unknown regional words.
                org.vosk.Recognizer rec = new org.vosk.Recognizer(voskModel, 16000.0f);
                speechService = new org.vosk.android.SpeechService(rec, 16000.0f);
                speechService.startListening(new org.vosk.android.RecognitionListener() {
                    @Override public void onPartialResult(String hypothesis) { processVoskResult(hypothesis, true); }
                    @Override public void onResult(String hypothesis) { processVoskResult(hypothesis, false); }
                    @Override public void onFinalResult(String hypothesis) { processVoskResult(hypothesis, false); }
                    
                    @Override
                    public void onError(Exception e) {
                        Log.e(TAG, "Vosk Error: " + e.getMessage());
                        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                            if (!isSOSMissionActive) startVoiceSentinel();
                        }, 2000);
                    }
                    @Override
                    public void onTimeout() {
                        if (!isSOSMissionActive) startVoiceSentinel();
                    }
                });
                isListening = true;
            }
        } catch (Exception e) { Log.e(TAG, "Voice Start Fail: " + e.getMessage()); }
    }

    private int getLevenshteinDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            int lastValue = i;
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        int newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s2.length()] = lastValue;
            }
        }
        return costs[s2.length()];
    }

    private double getPhoneticSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        if (s1.isEmpty() && s2.isEmpty()) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;
        int longerLength = Math.max(s1.length(), s2.length());
        int distance = getLevenshteinDistance(s1, s2);
        return (longerLength - distance) / (double) longerLength;
    }

    private void processVoskResult(String json, boolean isPartial) {
        if (isSOSMissionActive) return;
        
        // 🛡️ MEDIA PLAYBACK FILTER: Ignore words if they are coming from the phone's speaker (YouTube, Music, etc.)
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null && audioManager.isMusicActive()) {
            // Drop processing silently so we don't trigger SOS on a movie
            return;
        }
        
        try {
            org.json.JSONObject obj = new org.json.JSONObject(json);
            String text = obj.optString(isPartial ? "partial" : "text", "");
            if (text.isEmpty()) return;
            
            Log.d(TAG, "🎙️ VOSK " + (isPartial ? "PARTIAL" : "FINAL") + ": " + text);
            analyzeSpeech(text, !isPartial);
        } catch (Exception e) {
            Log.e(TAG, "JSON Parse Error: " + e.getMessage());
        }
    }

    private void analyzeSpeech(String phrase, boolean isFinal) {
        if (phrase == null || phrase.trim().isEmpty()) return;
        phrase = phrase.toLowerCase().trim();
        
        long now = System.currentTimeMillis();
        if (now - lastVoiceEventTime > VOICE_WINDOW_MS) {
            helpWordCount = 0;
            bachaoWordCount = 0;
            kavachWordCount = 0;
            regionalWordCount = 0;
        }
        lastVoiceEventTime = now;

        // Devnagari/Regional Direct Match
        if (phrase.contains("बचाओ") || phrase.contains("वाचवा") || phrase.contains("కాపాడు") || phrase.contains("காப்பாற்று") || phrase.contains("ರಕ್ಷಿಸು")) {
            triggerSOS("voice");
            return;
        }

        // Fast immediate trigger for partial results without accumulating counts
        if (!isFinal) {
            boolean hasKavach = phrase.contains("kavach");
            boolean hasHelp = phrase.contains("help") || phrase.contains("madad") || phrase.contains("police") || phrase.contains("bachao");
            if (hasKavach && hasHelp) {
                triggerSOS("voice");
                return;
            }
            if (phrase.contains("bachao") || phrase.contains("madad") || phrase.contains("bhaago") || phrase.contains("help help help") || phrase.contains("but job") || phrase.contains("but chow")) {
                triggerSOS("voice");
                return;
            }
            return; 
        }

        // Phrase level checks for common Vosk misinterpretations of "Bachao Bachao"
        if (phrase.contains("but job") || phrase.contains("but chow") || phrase.contains("but joe")) {
            bachaoWordCount += 2;
        }

        String[] tokens = phrase.split("\\s+");
        for (String token : tokens) {
            if (token.length() < 3) continue;

            double similarityKavach = getPhoneticSimilarity(token, "kavach");
            double similarityHelp = Math.max(getPhoneticSimilarity(token, "help"), getPhoneticSimilarity(token, "madad"));
            double similarityBachao = Math.max(getPhoneticSimilarity(token, "bachao"), getPhoneticSimilarity(token, "bhaago"));
            
            double simVachva = getPhoneticSimilarity(token, "vachva");
            double simKaapadu = getPhoneticSimilarity(token, "kaapadu");
            double simKaappattru = getPhoneticSimilarity(token, "kaappattru");
            double simRakshisu = getPhoneticSimilarity(token, "rakshisu");

            if (similarityKavach >= 0.70 || token.equals("kavach") || token.equals("cover") || token.equals("cabbage")) kavachWordCount++;
            
            if (similarityHelp >= 0.70 || token.equals("help") || token.equals("madad") || token.equals("police") || token.equals("emergency") 
                || token.equals("halp") || token.equals("hell") || token.equals("mother") || token.equals("murder")) helpWordCount++;
                
            if (similarityBachao >= 0.70 || token.equals("bachao") || token.equals("bhaago") || token.equals("chhod") 
                || token.equals("bachow") || token.equals("bacao")) bachaoWordCount++;
                
            if (simVachva >= 0.70 || simKaapadu >= 0.70 || simKaappattru >= 0.70 || simRakshisu >= 0.70) regionalWordCount++;
        }

        int totalEmergencyWords = kavachWordCount + helpWordCount + bachaoWordCount + regionalWordCount;

        if (kavachWordCount >= 1 && helpWordCount >= 1) {
            Log.i(TAG, "VOICE SENTINEL: Triggered via Rule A (Kavach + Help)");
            triggerSOS("voice");
        } else if (totalEmergencyWords >= 3) {
            Log.i(TAG, "VOICE SENTINEL: Triggered via Rule B (Any 3 Emergency Words)");
            triggerSOS("voice");
        } else if (bachaoWordCount >= 2 || regionalWordCount >= 2) {
            Log.i(TAG, "VOICE SENTINEL: Triggered via Rule C (Bachao/Regional x2)");
            triggerSOS("voice");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_START_SIREN.equals(action)) {
            startSirenLogic();
        } else if (ACTION_STOP_SIREN.equals(action)) {
            stopSirenLogic();
            stopOfflineSurvivalMode();
            isSOSMissionActive = false; // 🛡️ MISSION COMPLETE: Reset state for next trigger
            initVoiceSentinel(); // Re-arm the listener
        } else if ("com.kavach.app.ACTION_START_VOICE".equals(action)) {
            initVoiceSentinel();
        } else if ("com.kavach.app.ACTION_STOP_VOICE".equals(action)) {
            if (speechService != null) {
                isListening = false;
                speechService.stop();
                speechService = null;
            }
        } else if ("com.kavach.app.ACTION_START_SAFE_TIMER".equals(action)) {
            long durationMs = intent.getLongExtra("duration_ms", 30 * 60 * 1000L);
            startSafeTimer(durationMs);
        } else if ("com.kavach.app.ACTION_STOP_SAFE_TIMER".equals(action)) {
            stopSafeTimer();
        } else if ("com.kavach.app.ACTION_START_BLE_ADV".equals(action)) {
            String victimUid = intent.getStringExtra("victim_uid");
            double lat = intent.getDoubleExtra("latitude", 0.0);
            double lng = intent.getDoubleExtra("longitude", 0.0);
            startBleSOSAdvertising(victimUid, lat, lng);
        } else if ("com.kavach.app.ACTION_STOP_BLE_ADV".equals(action)) {
            stopBleSOSAdvertising();
        } else if ("com.kavach.app.ACTION_START_BLE_SCAN".equals(action)) {
            startBackgroundBleScanner();
        } else if ("com.kavach.app.ACTION_STOP_BLE_SCAN".equals(action)) {
            stopBackgroundBleScanner();
        }

        // Build persistent foreground notification
        Intent notifIntent = new Intent(this, MainActivity.class);
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE
                : 0;
        PendingIntent pi = PendingIntent.getActivity(this, 0, notifIntent, piFlags);

        // Remove FULL-SCREEN INTENT from the persistent notification to stop the app from auto-opening on lock screen.
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("KAVACH Protection")
                .setContentText(mediaPlayer != null && mediaPlayer.isPlaying()
                        ? "🚨 CRITICAL OVERRIDE ACTIVE"
                        : "Shielding Neural Grid — Active: Monitoring Shake & Voice Triggers")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MIN) 
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ mandate for explicit types in startForeground
            int fgsTypes = android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE;
            
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
                androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                fgsTypes |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION;
            }
            
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                fgsTypes |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            }
            
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                fgsTypes |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
            }

            try {
                startForeground(1, notification, fgsTypes);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start FGS with dynamic types: " + e.getMessage());
                // Fallback to special use only if restricted by background rules
                startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            }
        } else {
            startForeground(1, notification);
        }

        // START_STICKY: If OS kills the service, it auto-restarts
        return START_STICKY;
    }

    // ── Shake detection ───────────────────────────────────────────────────
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_PROXIMITY) {
            float distance = event.values[0];
            float maxRange = event.sensor.getMaximumRange();
            // If distance is close to 0, the screen is covered (phone in pocket or bag)
            isPhoneInPocket = (distance < 5.0f && distance < maxRange);
            Log.d(TAG, "PROXIMITY DETECTOR: Phone in pocket state updated to: " + isPhoneInPocket + " (Value: " + distance + ")");
            return;
        }

        if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) return;

        float x = event.values[0], y = event.values[1], z = event.values[2];
        
        // 🛡️ TACTICAL G-FORCE CALCULATION
        double gForce = Math.sqrt(x * x + y * y + z * z) / SensorManager.GRAVITY_EARTH;

        // 🛰️ DYNAMIC ADAPTIVE FILTERING:
        // Pocket/Bag Mode: Threshold 6.5G force and requires 5 consecutive hits
        // Normal Mode: Threshold 5.5G force and requires 5 consecutive hits (Filters casual TV sofa bouncing)
        float requiredForce = isPhoneInPocket ? 6.5f : 5.5f;
        int requiredShakes = 5;

        if (gForce > requiredForce) {
            long now = System.currentTimeMillis();

            // 1. TEMPORAL GATE: Reset if no shake in last 1.5s
            if (now - lastPeakTime > TIME_WINDOW) {
                shakeCount = 0;
            }

            // 2. DEBOUNCE: Ensure distinct forceful movements
            if (now - lastPeakTime > DEBOUNCE_MS) {
                shakeCount++;
                lastPeakTime = now;
                Log.d(TAG, "TACTICAL PULSE: [" + shakeCount + "/" + requiredShakes + "] Force: " + gForce + "G (Pocket Filter: " + isPhoneInPocket + ")");

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
            if (shakeCount >= requiredShakes) {
                if (now - lastShakeTime > 5000) { // Cooldown before next SOS blast
                    lastShakeTime = now;
                    shakeCount = 0;
                    Log.i(TAG, "KAVACH MISSION: Pattern VERIFIED (" + gForce + "G, Pocket Filter: " + isPhoneInPocket + ")");
                    triggerSOS("shake");
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private boolean isSOSMissionActive = false;

    // ── SOS Cancellation Logic (Failsafe & Remote Override) ───────────────
    public void cancelSOSMission() {
        if (!isSOSMissionActive) return;
        isSOSMissionActive = false;
        
        // 1. Terminate audio/sirens if playing
        stopSirenLogic();
        
        // 1.5 Terminate WebRTC Broadcasting
        stopAgoraStealthBroadcast();
        
        // 1.6 Stop BLE advertising
        stopBleSOSAdvertising();
        
        // 2. Kill the 15-minute timer
        if (autoKillHandler != null && autoKillRunnable != null) {
            autoKillHandler.removeCallbacks(autoKillRunnable);
        }
        
        // 3. Re-arm the native Voice listener so it's ready for next time
        if (!isListening) {
            startVoiceSentinel();
        }

        Log.i(TAG, "KAVACH SOS: Mission Cancelled. System returned to standby.");
        
        // 4. Notify React/JS layer to stop Agora streaming
        Intent intent = new Intent("com.kavach.app.SOS_CANCELLED");
        sendBroadcast(intent);
    }

    // ── SOS Trigger (HARDENED HANDSHAKE) ──────────────────────────────────
    private void triggerSOS(final String source) {
        if (isSOSMissionActive) return; // Prevent duplicate trigger blasts
        isSOSMissionActive = true;
        Log.i(TAG, "KAVACH SOS: Triggered via " + source);

        // 🛡️ THE AUTO-KILL FAILSAFE (15 Minutes)
        if (autoKillHandler == null) {
            autoKillHandler = new Handler(Looper.getMainLooper());
        }
        if (autoKillRunnable == null) {
            autoKillRunnable = new Runnable() {
                @Override
                public void run() {
                    Log.w(TAG, "KAVACH AUTO-KILL: 15-minute safety timeout reached. Securing resources.");
                    cancelSOSMission();
                }
            };
        }
        // Reset timer if triggered again
        autoKillHandler.removeCallbacks(autoKillRunnable);
        autoKillHandler.postDelayed(autoKillRunnable, AUTO_KILL_TIMEOUT_MS);

        // 🛡️ MIC HANDSHAKE: Release native listener immediately
        try {
            if (speechService != null) {
                isListening = false;
                speechService.stop();
                speechService.shutdown();
                speechService = null;
                Log.d(TAG, "MIC RELEASE: Vosk Service destroyed for Forensic Capture.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Mic Release Error: " + e.getMessage());
        }

        // 1. TACTICAL DECOUPLING: Start Offline Survival Mode (Continuous SMS Fallback)
        startOfflineSurvivalMode();

        // 1.2 Start BLE SOS advertising with location
        android.location.Location lastLoc = getLastKnownLocation();
        double lat = lastLoc != null ? lastLoc.getLatitude() : 0.0;
        double lng = lastLoc != null ? lastLoc.getLongitude() : 0.0;
        android.content.SharedPreferences prefs = getSharedPreferences("KavachPrefs", MODE_PRIVATE);
        String victimUid = prefs.getString("kavach_user_uid", "unknown_victim");
        startBleSOSAdvertising(victimUid, lat, lng);

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

        // 🚀 TACTICAL WAKE: Force Screen ON before firing Full-Screen Intent
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "Kavach::SOS_Wake");
                wl.acquire(3000); // Wake screen for 3 seconds
            }
        } catch (Exception ignore) {}

        // 🚀 ANDROID 10+ BACKGROUND START BYPASS: Full-Screen Intent Notification
        // If the screen is locked or app is in background, Android blocks startActivity.
        // We must fire a High-Priority notification with a Full-Screen Intent to force open the UI.
        try {
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 999,
                    intent, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_alert)
                    .setContentTitle("KAVACH SOS TRIGGERED")
                    .setContentText("Emergency Protocol Activated via " + source)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setFullScreenIntent(fullScreenPendingIntent, true)
                    .setAutoCancel(true)
                    .setOngoing(true);

            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(999, builder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch Full-Screen Intent: " + e.getMessage());
        }

        // 3. Start Stealth Evidence Capture (Delayed for 1s to ensure Clean Mic Release)
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "FORENSIC NODE: Initiating High-Fidelity Capture...");
                EvidenceEngine.startCapture(KavachService.this, "alert_" + System.currentTimeMillis());
            }
        }, 1000);
        
        // 4. 🌐 START NATIVE WEBRTC AUDIO BROADCASTING IN BACKGROUND
        startAgoraStealthBroadcast();
    }

    // ── NATIVE WEBRTC AUDIO BROADCASTING (SCREEN-OFF SUPPORT) ─────────────
    private void startAgoraStealthBroadcast() {
        new Thread(() -> {
            try {
                if (mRtcEngine == null) {
                    RtcEngineConfig config = new RtcEngineConfig();
                    config.mContext = getApplicationContext();
                    config.mAppId = AGORA_APP_ID;
                    config.mEventHandler = new IRtcEngineEventHandler() {
                        @Override
                        public void onJoinChannelSuccess(String channel, int uid, int elapsed) {
                            Log.i(TAG, "🎙️ KAVACH WEBRTC: Joined secure stealth channel -> " + channel);
                        }
                        @Override
                        public void onError(int err) {
                            Log.e(TAG, "🚨 KAVACH WEBRTC ERROR: Code " + err);
                        }
                    };
                    mRtcEngine = RtcEngine.create(config);
                    mRtcEngine.setChannelProfile(Constants.CHANNEL_PROFILE_LIVE_BROADCASTING);
                    mRtcEngine.setClientRole(Constants.CLIENT_ROLE_BROADCASTER);
                    mRtcEngine.enableAudio();
                }
                
                ChannelMediaOptions options = new ChannelMediaOptions();
                options.publishMicrophoneTrack = true;
                options.autoSubscribeAudio = false; // Victim should NEVER hear the police/admin (Stealth)
                options.clientRoleType = Constants.CLIENT_ROLE_BROADCASTER;
                
                mRtcEngine.joinChannel(null, "channel-emergency", 0, options);
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize Agora RTC: " + e.getMessage());
            }
        }).start();
    }

    private void stopAgoraStealthBroadcast() {
        if (mRtcEngine != null) {
            new Thread(() -> {
                try {
                    mRtcEngine.leaveChannel();
                    RtcEngine.destroy();
                    mRtcEngine = null;
                    Log.i(TAG, "🛑 KAVACH WEBRTC: Native Audio Stream Terminated.");
                } catch(Exception e) {}
            }).start();
        }
    }

    // ── Zero-Internet Survival Mode (Offline Fallback) ────────────────────
    private android.os.Handler survivalHandler;
    private Runnable survivalRunnable;

    private boolean isNetworkAvailable() {
        android.net.ConnectivityManager connectivityManager = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.net.NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.getActiveNetwork());
                return capabilities != null && (capabilities.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) || capabilities.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR));
            } else {
                android.net.NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
                return activeNetworkInfo != null && activeNetworkInfo.isConnected();
            }
        }
        return false;
    }

    private android.location.Location getLastKnownLocation() {
        android.location.LocationManager locationManager = (android.location.LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) return null;
        try {
            android.location.Location bestLocation = null;
            for (String provider : locationManager.getProviders(true)) {
                android.location.Location l = locationManager.getLastKnownLocation(provider);
                if (l == null) continue;
                if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                    bestLocation = l;
                }
            }
            return bestLocation;
        } catch (SecurityException e) {
            return null;
        }
    }

    private void startOfflineSurvivalMode() {
        if (survivalHandler == null) {
            survivalHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        }
        survivalRunnable = new Runnable() {
            @Override
            public void run() {
                // Only dispatch offline SMS beacon if internet is actually disconnected
                if (!isNetworkAvailable()) {
                    Log.w(TAG, "OFFLINE SURVIVAL MODE: Network dead. Dispatching Location SMS beacon...");
                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            dispatchEmergencySMSWithLocation(false, false);
                        }
                    }).start();
                } else {
                    Log.i(TAG, "OFFLINE SURVIVAL MODE: Internet is stable. Holding SMS beacon.");
                }
                // Schedule next ping in 2 minutes
                survivalHandler.postDelayed(this, 120000);
            }
        };
        // 🛡️ DELAY INITIAL CHECK: Wait 2 minutes before starting the offline ping cycle.
        // This gives the React UI full control to handle the first immediate Call/SMS blast.
        survivalHandler.postDelayed(survivalRunnable, 120000);
    }
    
    private void stopOfflineSurvivalMode() {
        if (survivalHandler != null && survivalRunnable != null) {
            survivalHandler.removeCallbacks(survivalRunnable);
        }
    }

    // ── Safe Timer Logic (Phase 1 & Phase 2) ─────────────────────────────
    private Handler safeTimerHandler;
    private Runnable phase1Runnable;
    private Runnable phase15Runnable;
    private Runnable phase2Runnable;

    private void startSafeTimer(long durationMs) {
        stopSafeTimer();
        if (safeTimerHandler == null) safeTimerHandler = new Handler(Looper.getMainLooper());
        
        Log.i(TAG, "SAFE TIMER: Started natively for " + durationMs + "ms");

        phase15Runnable = new Runnable() {
            @Override
            public void run() {
                Log.w(TAG, "SAFE TIMER: Phase 1.5 (5m Grace) Expired. Sending Location SMS and making Call to Guardians.");
                dispatchSafeTimerWarningSMS();
                
                // Set Phase 2 (30 mins = 1800000 ms)
                safeTimerHandler.postDelayed(phase2Runnable, 30 * 60 * 1000L);
            }
        };

        phase1Runnable = new Runnable() {
            @Override
            public void run() {
                Log.w(TAG, "SAFE TIMER: Phase 1 Expired. Waking Screen & Launching App for PIN Verification.");
                
                // 🚀 WAKE SCREEN
                try {
                    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                    if (pm != null) {
                        PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "Kavach::SafeTimer_Wake");
                        wl.acquire(5000); 
                    }
                } catch (Exception ignore) {}

                // Launch App to show PIN Popup
                Intent intent = new Intent(KavachService.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                intent.putExtra("trigger", "safe_timer_expired");
                
                try {
                    startActivity(intent);
                } catch (Exception e) {}

                triggerSafeTimerWarningNotification(intent);
                
                // Set Phase 1.5 (5 mins = 300000 ms) to alert Guardians if no response
                safeTimerHandler.postDelayed(phase15Runnable, 5 * 60 * 1000L);
            }
        };

        phase2Runnable = new Runnable() {
            @Override
            public void run() {
                Log.e(TAG, "SAFE TIMER: Phase 2 (30m Grace Period) Expired. Triggering Full SOS.");
                triggerSOS("safe_timer_escalation");
            }
        };

        safeTimerHandler.postDelayed(phase1Runnable, durationMs);
    }

    private void stopSafeTimer() {
        if (safeTimerHandler != null) {
            if (phase1Runnable != null) safeTimerHandler.removeCallbacks(phase1Runnable);
            if (phase15Runnable != null) safeTimerHandler.removeCallbacks(phase15Runnable);
            if (phase2Runnable != null) safeTimerHandler.removeCallbacks(phase2Runnable);
        }
        Log.i(TAG, "SAFE TIMER: Stopped/Cancelled");
    }

    private void dispatchSafeTimerWarningSMS() {
        new Thread(() -> {
            try {
                android.content.SharedPreferences prefs = getSharedPreferences("KavachPrefs", MODE_PRIVATE);
                String contactsJson = prefs.getString("guardian_contacts", null);
                if (contactsJson == null) return;

                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"phone\":\"([^\"]+)\"");
                java.util.regex.Matcher matcher = pattern.matcher(contactsJson);
                
                SmsManager sm;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    sm = getSystemService(SmsManager.class);
                } else {
                    sm = SmsManager.getDefault();
                }
                if (sm == null) return;

                String locationString = "Location Unknown";
                android.location.Location loc = getLastKnownLocation();
                if (loc != null) {
                    locationString = "https://maps.google.com/?q=" + loc.getLatitude() + "," + loc.getLongitude();
                }

                String message = "⚠️ KAVACH SAFE TIMER ALERT ⚠️\nMy timer ended and I haven't reached home yet. Please call me! Location: " + locationString;

                boolean callMade = false;
                while (matcher.find()) {
                    String num = matcher.group(1).replaceAll("[^0-9+]", "");
                    if (num.isEmpty()) continue;
                    
                    if (message.length() > 70) {
                        java.util.ArrayList<String> parts = sm.divideMessage(message);
                        sm.sendMultipartTextMessage(num, null, parts, null, null);
                    } else {
                        sm.sendTextMessage(num, null, message, null, null);
                    }
                    Log.i(TAG, "SAFE TIMER SMS: Sent to " + num);
                    Thread.sleep(1500);
                    
                    if (!callMade) {
                        try {
                            Intent callIntent = new Intent(Intent.ACTION_CALL);
                            callIntent.setData(Uri.parse("tel:" + num));
                            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(callIntent);
                            Log.i(TAG, "SAFE TIMER CALL: Initiated to " + num);
                            callMade = true;
                        } catch (Exception e) {
                            Log.e(TAG, "Safe Timer Call Failed: " + e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Safe Timer Dispatch Error: " + e.getMessage());
            }
        }).start();
    }

    private void triggerSafeTimerWarningNotification(Intent baseIntent) {
        try {
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 1002,
                    baseIntent, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_alert)
                    .setContentTitle("Safe Timer Expired!")
                    .setContentText("Enter PIN to confirm safety. Guardians will be alerted in 5 minutes.")
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setFullScreenIntent(fullScreenPendingIntent, true)
                    .setAutoCancel(true);

            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(1002, builder.build());
            }
        } catch (Exception e) {}
    }

    private void dispatchEmergencySMSWithLocation(boolean isInitialBlast, boolean isShutdown) {
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

            String locationString = "Location Unknown";
            android.location.Location loc = getLastKnownLocation();
            if (loc != null) {
                locationString = "https://maps.google.com/?q=" + loc.getLatitude() + "," + loc.getLongitude();
            }

            while (matcher.find()) {
                String num = matcher.group(1).replaceAll("[^0-9+]", "");
                if (num.isEmpty()) continue;

                try {
                    String modeTag = isInitialBlast ? "🚨 KAVACH CRITICAL SOS! 🚨" : "🚨 KAVACH OFFLINE SOS (UPDATE) 🚨";
                    if (isShutdown) modeTag = "⚠️ KAVACH ALERT: BATTERY DEAD / PHONE SHUTDOWN! ⚠️";
                    String message = modeTag + "\nDanger Detected. Time: " + 
                                     new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()) + 
                                     "\n📍 Live: " + locationString;
                    
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
                        int maxMusicVol = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                        int maxAlarmVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                        
                        am.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusicVol, 0);
                        am.setStreamVolume(AudioManager.STREAM_ALARM, maxAlarmVol, 0);
                    }

                    // 🚨 Stop existing instances before launching a fresh one
                    if (mediaPlayer != null) {
                        try {
                            if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                        } catch (Exception ignored) {}
                        mediaPlayer.release();
                        mediaPlayer = null;
                    }

                    // Initialize MediaPlayer utilizing standard system alert tones 
                    // or specify your own res/raw/siren.mp3 file
                    Uri alertUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM);
                    if (alertUri == null) {
                        alertUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE);
                    }

                    mediaPlayer = new MediaPlayer();
                    mediaPlayer.setDataSource(KavachService.this, alertUri);
                    mediaPlayer.setLooping(true);

                    // Map audio properties to bypass modern system "Do Not Disturb" profiles
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build());
                    } else {
                        mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                    }

                    mediaPlayer.prepare();
                    mediaPlayer.start();
                    Log.i(TAG, "SIREN SYSTEM ACTIVE: Audio blasting.");

                } catch (Exception e) {
                    Log.e(TAG, "Siren Audio Blast Failed: " + e.getMessage());
                }
            }
        }).start();
    }

    private void stopSirenLogic() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
                Log.i(TAG, "SIREN SYSTEM STANDBY: Audio terminated safely.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Error stopping siren logic: " + e.getMessage());
        }
    }

    private boolean isAdvertising = false;
    private boolean isScanning = false;

    private void startBleSOSAdvertising(String victimUid, double lat, double lng) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Log.e(TAG, "BLE ADVERTISER: Bluetooth not available or disabled.");
            return;
        }

        bleAdvertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        if (bleAdvertiser == null) {
            Log.e(TAG, "BLE ADVERTISER: LeAdvertiser not supported by hardware.");
            return;
        }

        if (isAdvertising) {
            stopBleSOSAdvertising();
        }

        try {
            AdvertiseSettings settings = new AdvertiseSettings.Builder()
                    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                    .setConnectable(false)
                    .build();

            // Pack victimUid hash (8 bytes) + latitude (4 bytes) + longitude (4 bytes) = 16 bytes
            byte[] payload = new byte[16];
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            
            // Generate a 8-byte hash of victimUid (or use standard UUID conversion if hash is required)
            long uidHash = victimUid.hashCode();
            buffer.putLong(uidHash);
            buffer.putFloat((float) lat);
            buffer.putFloat((float) lng);

            ParcelUuid pUuid = new ParcelUuid(UUID.fromString("48e3e4a2-198c-4a31-90a1-9a746522bc01"));

            AdvertiseData data = new AdvertiseData.Builder()
                    .setIncludeDeviceName(false)
                    .setIncludeTxPowerLevel(false)
                    .addServiceUuid(pUuid)
                    .addServiceData(pUuid, payload)
                    .build();

            advertiseCallback = new AdvertiseCallback() {
                @Override
                public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                    super.onStartSuccess(settingsInEffect);
                    isAdvertising = true;
                    Log.i(TAG, "BLE ADVERTISER: Successfully advertising SOS Beacon on UUID 48e3e4a2-198c-4a31-90a1-9a746522bc01");
                }

                @Override
                public void onStartFailure(int errorCode) {
                    super.onStartFailure(errorCode);
                    isAdvertising = false;
                    Log.e(TAG, "BLE ADVERTISER: Advertisement failed with code: " + errorCode);
                }
            };

            bleAdvertiser.startAdvertising(settings, data, advertiseCallback);

        } catch (Exception e) {
            Log.e(TAG, "BLE ADVERTISER: Error setting up BLE advertising", e);
        }
    }

    private void stopBleSOSAdvertising() {
        if (bleAdvertiser != null && advertiseCallback != null) {
            try {
                bleAdvertiser.stopAdvertising(advertiseCallback);
                Log.i(TAG, "BLE ADVERTISER: SOS Beacon Advertising Stopped.");
            } catch (Exception e) {
                Log.e(TAG, "BLE ADVERTISER: Error stopping advertising", e);
            }
        }
        isAdvertising = false;
    }

    private void startBackgroundBleScanner() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Log.e(TAG, "BLE SCANNER: Bluetooth not enabled.");
            return;
        }

        bleScanner = bluetoothAdapter.getBluetoothLeScanner();
        if (bleScanner == null) {
            Log.e(TAG, "BLE SCANNER: BluetoothLeScanner unsupported.");
            return;
        }

        if (isScanning) {
            stopBackgroundBleScanner();
        }

        try {
            ScanSettings settings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                    .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES)
                    .setMatchMode(ScanSettings.MATCH_MODE_AGGRESSIVE)
                    .build();

            ScanFilter filter = new ScanFilter.Builder()
                    .setServiceUuid(new ParcelUuid(UUID.fromString("48e3e4a2-198c-4a31-90a1-9a746522bc01")))
                    .build();

            scanCallback = new ScanCallback() {
                @Override
                public void onScanResult(int callbackType, ScanResult result) {
                    super.onScanResult(callbackType, result);
                    processScanResult(result);
                }

                @Override
                public void onBatchScanResults(java.util.List<ScanResult> results) {
                    super.onBatchScanResults(results);
                    for (ScanResult result : results) {
                        processScanResult(result);
                    }
                }

                @Override
                public void onScanFailed(int errorCode) {
                    super.onScanFailed(errorCode);
                    Log.e(TAG, "BLE SCANNER: Scan failed with error: " + errorCode);
                }
            };

            bleScanner.startScan(Collections.singletonList(filter), settings, scanCallback);
            isScanning = true;
            Log.i(TAG, "BLE SCANNER: Aggressive Background Scan Engaged for 48e3e4a2-198c-4a31-90a1-9a746522bc01");

        } catch (Exception e) {
            Log.e(TAG, "BLE SCANNER: Error launching scanner", e);
        }
    }

    private void processScanResult(ScanResult result) {
        if (result == null || result.getScanRecord() == null) return;

        ParcelUuid pUuid = new ParcelUuid(UUID.fromString("48e3e4a2-198c-4a31-90a1-9a746522bc01"));
        byte[] payload = result.getScanRecord().getServiceData(pUuid);
        if (payload == null || payload.length < 16) return;

        ByteBuffer buffer = ByteBuffer.wrap(payload);
        long uidHash = buffer.getLong();
        float lat = buffer.getFloat();
        float lng = buffer.getFloat();

        String beaconKey = uidHash + "_" + lat + "_" + lng;

        synchronized (processedBeacons) {
            if (processedBeacons.contains(beaconKey)) {
                return; // deduplication loop protection
            }
            processedBeacons.add(beaconKey);
            deduplicationCleanupHandler.postDelayed(() -> {
                synchronized (processedBeacons) {
                    processedBeacons.remove(beaconKey);
                }
            }, 30 * 60 * 1000L); // 30-minute skew tolerance / deduplication cache lifetime
        }

        Log.w(TAG, "🚨 BLE MESH: SOS beacon intercepted! UID Hash: " + uidHash + " Location: " + lat + ", " + lng);

        // Re-broadcast (Mesh Hopping)
        reBroadcastBleBeacon(uidHash, lat, lng);

        // 🌐 INTERNET UPLINK RELAY (Senior Architect Bridge):
        // If this scanning device has active internet connectivity, instantly relay the intercepted victim's location to the SuperCell command center.
        if (isNetworkAvailable()) {
            Log.i(TAG, "📶 BLE MESH UPLINK: Active internet detected on relay node. Pushing offline beacon to SuperCell cloud...");
            new Thread(() -> {
                try {
                    // Send HTTP POST relay to the backend function/Supabase Edge function or direct webhook
                    java.net.URL url = new java.net.URL("https://gen-lang-client-0115433512.web.app/api/relay-ble-sos");
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; utf-8");
                    conn.setDoOutput(true);

                    org.json.JSONObject jsonParam = new org.json.JSONObject();
                    jsonParam.put("victimUidHash", String.valueOf(uidHash));
                    jsonParam.put("latitude", lat);
                    jsonParam.put("longitude", lng);
                    jsonParam.put("relayDeviceUid", getSharedPreferences("KavachPrefs", MODE_PRIVATE).getString("kavach_user_uid", "relay_node"));
                    jsonParam.put("timestamp", System.currentTimeMillis());

                    try (java.io.OutputStream os = conn.getOutputStream()) {
                        byte[] input = jsonParam.toString().getBytes("utf-8");
                        os.write(input, 0, input.length);
                    }

                    int code = conn.getResponseCode();
                    Log.i(TAG, "📶 BLE MESH UPLINK: Relay request dispatched. Response Code: " + code);
                    conn.disconnect();
                } catch (Exception e) {
                    Log.e(TAG, "📶 BLE MESH UPLINK ERROR: Failed to forward BLE payload to SuperCell: " + e.getMessage());
                }
            }).start();
        }

        // Notify UI/Command Centre
        Intent intent = new Intent("com.kavach.app.BLE_SOS_INTERCEPTED");
        intent.putExtra("victim_uid_hash", uidHash);
        intent.putExtra("latitude", (double) lat);
        intent.putExtra("longitude", (double) lng);
        sendBroadcast(intent);
    }

    private void reBroadcastBleBeacon(long uidHash, float lat, float lng) {
        if (bleAdvertiser == null) return;
        try {
            AdvertiseSettings settings = new AdvertiseSettings.Builder()
                    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                    .setConnectable(false)
                    .build();

            byte[] payload = new byte[16];
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            buffer.putLong(uidHash);
            buffer.putFloat(lat);
            buffer.putFloat(lng);

            ParcelUuid pUuid = new ParcelUuid(UUID.fromString("48e3e4a2-198c-4a31-90a1-9a746522bc01"));
            AdvertiseData data = new AdvertiseData.Builder()
                    .setIncludeDeviceName(false)
                    .setIncludeTxPowerLevel(false)
                    .addServiceUuid(pUuid)
                    .addServiceData(pUuid, payload)
                    .build();

            AdvertiseCallback hopCallback = new AdvertiseCallback() {
                @Override
                public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                    super.onStartSuccess(settingsInEffect);
                    Log.i(TAG, "BLE MESH: Re-broadcast hop active for hash: " + uidHash);
                }
            };

            bleAdvertiser.startAdvertising(settings, data, hopCallback);
            // Stop re-broadcasting after 60s to prevent air congestion
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    bleAdvertiser.stopAdvertising(hopCallback);
                } catch (Exception ignored) {}
            }, 60000);

        } catch (Exception e) {
            Log.e(TAG, "BLE MESH: Re-broadcast fail", e);
        }
    }

    private void stopBackgroundBleScanner() {
        if (bleScanner != null && scanCallback != null) {
            try {
                bleScanner.stopScan(scanCallback);
                Log.i(TAG, "BLE SCANNER: Background scanning halted.");
            } catch (Exception e) {
                Log.e(TAG, "BLE SCANNER: Error stopping scan", e);
            }
        }
        isScanning = false;
    }

    // ── Resurrect on Swipe ───────────────────────────────────────────────
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.e(TAG, "TASK REMOVED: OS killed the app. Kavach is deploying AlarmManager to resurrect the Service.");
        Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
        restartServiceIntent.setPackage(getPackageName());
        
        int pendingFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? android.app.PendingIntent.FLAG_ONE_SHOT | android.app.PendingIntent.FLAG_IMMUTABLE : android.app.PendingIntent.FLAG_ONE_SHOT;
        android.app.PendingIntent restartServicePendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            restartServicePendingIntent = android.app.PendingIntent.getForegroundService(getApplicationContext(), 1, restartServiceIntent, pendingFlags);
        } else {
            restartServicePendingIntent = android.app.PendingIntent.getService(getApplicationContext(), 1, restartServiceIntent, pendingFlags);
        }
        android.app.AlarmManager alarmService = (android.app.AlarmManager) getApplicationContext().getSystemService(Context.ALARM_SERVICE);
        alarmService.set(
            android.app.AlarmManager.ELAPSED_REALTIME,
            android.os.SystemClock.elapsedRealtime() + 1000,
            restartServicePendingIntent);

        Intent broadcastIntent = new Intent("com.kavach.app.RESTART_SENSOR");
        broadcastIntent.setPackage(getPackageName());
        sendBroadcast(broadcastIntent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Kavach Tactical Background Engine",
                    NotificationManager.IMPORTANCE_MIN
            );
            // Hide notification badge for stealth
            serviceChannel.setShowBadge(false);
            serviceChannel.setDescription("Guarantees sensor arrays, voice triggers, and rescue handshakes stay processing continuously.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Pure decoupled context background worker model
    }

    @Override
    public void onDestroy() {
        // Clean up locks and broadcast listeners to prevent context leaks
        stopOfflineSurvivalMode();
        stopSirenLogic();
        stopBleSOSAdvertising();
        stopBackgroundBleScanner();
        
        try {
            unregisterReceiver(systemReceiver);
        } catch (Exception ignored) {}

        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }

        if (speechService != null) {
            try {
                speechService.stop();
                speechService.shutdown();
                speechService = null;
            } catch (Exception ignored) {}
        }
        if (voskModel != null) {
            voskModel.close();
            voskModel = null;
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        Log.w(TAG, "KAVACH CORE STANDBY: Service destroyed completely.");
        super.onDestroy();
    }
}
