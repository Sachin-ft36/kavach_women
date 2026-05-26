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

        Log.i(TAG, "KAVACH TACTICAL SERVICE: Initialized. Monitoring active.");
    }

    private void initVoiceSentinel() {
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("KavachPrefs", MODE_PRIVATE);
            String role = prefs.getString("kavach_user_role", "citizen");
            if (!"citizen".equals(role)) return;

            new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                if (voskModel == null) {
                    // 🇮🇳 Indian English Model loaded for perfect Hindi/Hinglish accuracy
                    org.vosk.android.StorageService.unpack(this, "sync/vosk-model-small-en-in-0.4", "model",
                        (model) -> {
                            voskModel = model;
                            startVoiceSentinel();
                        },
                        (exception) -> Log.e(TAG, "Vosk Unpack Error: " + exception.getMessage()));
                } else {
                    startVoiceSentinel();
                }
            });
        } catch (Exception e) { Log.e(TAG, "Voice Sentinel Init Failed: " + e.getMessage()); }
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
        // Pocket/Bag Mode: Threshold 4.5G force and requires 4 consecutive hits
        // Normal Mode: Threshold 3.5G force and requires 3 consecutive hits
        float requiredForce = isPhoneInPocket ? 4.5f : 3.5f;
        int requiredShakes = isPhoneInPocket ? 4 : 3;

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

    // ── SOS Trigger (HARDENED HANDSHAKE) ──────────────────────────────────
    private void triggerSOS(final String source) {
        if (isSOSMissionActive) return; // Prevent duplicate trigger blasts
        isSOSMissionActive = true;
        Log.i(TAG, "KAVACH SOS: Triggered via " + source);

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

        // 3. Start Stealth Evidence Capture (Delayed for 1s to ensure Clean Mic Release)
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "FORENSIC NODE: Initiating High-Fidelity Capture...");
                EvidenceEngine.startCapture(KavachService.this, "alert_" + System.currentTimeMillis());
            }
        }, 1000);
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
