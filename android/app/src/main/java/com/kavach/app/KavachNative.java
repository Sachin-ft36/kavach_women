package com.kavach.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.content.Context;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.os.SystemClock;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import android.app.Activity;
import android.content.IntentSender;

@CapacitorPlugin(
    name = "KavachPlugin",
    permissions = {
        @Permission(alias = "sms",  strings = {Manifest.permission.SEND_SMS}),
        @Permission(alias = "call", strings = {Manifest.permission.CALL_PHONE}),
        @Permission(alias = "microphone", strings = {Manifest.permission.RECORD_AUDIO}),
        @Permission(alias = "phone_state", strings = {Manifest.permission.READ_PHONE_STATE})
    }
)
public class KavachNative extends Plugin {

    private static final String TAG = "KavachNative";
    private static final int PHONE_HINT_REQUEST_CODE = 9001;
    private PluginCall savedCall;
    private static KavachNative instance;
    private MediaPlayer ringtonePlayer;
    private int originalVolume = -1;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static KavachNative getInstance() {
        return instance;
    }

    @PluginMethod
    public void playEmergencyRingtone(PluginCall call) {
        try {
            Context context = getContext();
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            
            // Bypass Silent/DND by using STREAM_ALARM or STREAM_RING
            originalVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
            int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);

            if (ringtonePlayer == null) {
                Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                ringtonePlayer = new MediaPlayer();
                ringtonePlayer.setDataSource(context, ringtoneUri);
                ringtonePlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                ringtonePlayer.setLooping(true);
                ringtonePlayer.prepare();
            }
            if (!ringtonePlayer.isPlaying()) {
                ringtonePlayer.start();
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to play ringtone natively", e);
        }
    }

    @PluginMethod
    public void stopEmergencyRingtone(PluginCall call) {
        try {
            if (ringtonePlayer != null && ringtonePlayer.isPlaying()) {
                ringtonePlayer.stop();
                ringtonePlayer.release();
                ringtonePlayer = null;
            }
            if (originalVolume != -1) {
                Context context = getContext();
                AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, originalVolume, 0);
                originalVolume = -1;
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop ringtone natively", e);
        }
    }

    // ── Permissions ───────────────────────────────────────────────────────

    @PluginMethod
    public void checkSafetyPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("sms",  getPermissionState("sms").toString());
        ret.put("call", getPermissionState("call").toString());
        ret.put("microphone", getPermissionState("microphone").toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSensitivePermissions(PluginCall call) {
        // Bridges to Manifest.permission.SEND_SMS, CALL_PHONE, and RECORD_AUDIO
        requestPermissions(call);
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        checkSafetyPermissions(call);
    }

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║  ⚠️  KAVACH CORE — TELEPHONY ENGINE — DO NOT MODIFY ⚠️              ║
    // ║  Status : VERIFIED WORKING (Tested: 2026-04-22)                     ║
    // ║  Owner  : singh.sachin16559@gmail.com                               ║
    // ║  These 3 methods (directCall, sendSilentSMS, sendWhatsApp) are the  ║
    // ║  heart of the SOS dispatch system. Any change WILL break emergency  ║
    // ║  alerts. DO NOT refactor, rename, or remove ANY line below.         ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    @PluginMethod
    public void requestLockScreenPermission(PluginCall call) {
        String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
        java.util.List<Intent> intentsToTry = new java.util.ArrayList<>();

        if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi") || manufacturer.contains("poco")) {
            Intent i1 = new Intent("miui.intent.action.APP_PERM_EDITOR");
            i1.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
            i1.putExtra("extra_pkgname", getContext().getPackageName());
            intentsToTry.add(i1);

            Intent i2 = new Intent();
            i2.setClassName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity");
            intentsToTry.add(i2);
        } else if (manufacturer.contains("oppo") || manufacturer.contains("realme")) {
            Intent i1 = new Intent(); i1.setClassName("com.coloros.safecenter", "com.coloros.safecenter.permission.PermissionManagerActivity"); intentsToTry.add(i1);
            Intent i2 = new Intent(); i2.setClassName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"); intentsToTry.add(i2);
            Intent i3 = new Intent(); i3.setClassName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"); intentsToTry.add(i3);
            Intent i4 = new Intent(); i4.setClassName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"); intentsToTry.add(i4);
        } else if (manufacturer.contains("vivo") || manufacturer.contains("iqoo")) {
            Intent i1 = new Intent(); i1.setClassName("com.iqoo.secure", "com.iqoo.secure.ui.PermissionManagerActivity"); intentsToTry.add(i1);
            Intent i2 = new Intent(); i2.setClassName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"); intentsToTry.add(i2);
            Intent i3 = new Intent(); i3.setClassName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.PurviewTabActivity"); intentsToTry.add(i3);
            Intent i4 = new Intent(); i4.setClassName("com.iqoo.secure", "com.iqoo.secure.MainActivity"); intentsToTry.add(i4);
        }

        boolean launched = false;
        for (Intent intent : intentsToTry) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                launched = true;
                break;
            } catch (Exception e) {
                // Ignore and try next
            }
        }

        if (!launched) {
            // Ultimate fallback for Chinese OEMs if all specific intents fail (e.g. Android 15 changes)
            try {
                Intent fallback = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
            } catch (Exception e) {
                Log.w(TAG, "All OEM Lock Screen Permission intents failed for: " + manufacturer, e);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void initiateEmergencyCall(PluginCall call) {
        String phone = call.getString("number");
        if (phone == null) { call.reject("Phone number required"); return; }
        try {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + phone));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Dialer failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void broadcastEmergencySMS(PluginCall call) {
        com.getcapacitor.JSArray numbers = call.getArray("numbers");
        String message = call.getString("message");
        if (numbers == null || message == null) {
            call.reject("Numbers array and message required");
            return;
        }

        try {
            SmsManager sm;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                sm = getContext().getSystemService(SmsManager.class);
            } else {
                sm = SmsManager.getDefault();
            }

            if (sm == null) {
                call.reject("CRITICAL: SmsManager unavailable.");
                return;
            }

            for (int i = 0; i < numbers.length(); i++) {
                String phone = numbers.getString(i);
                String cleanPhone = phone.replaceAll("[^0-9+]", "");

                if (message.length() > 70 || message.codePointCount(0, message.length()) != message.length()) {
                    java.util.ArrayList<String> parts = sm.divideMessage(message);
                    sm.sendMultipartTextMessage(cleanPhone, null, parts, null, null);
                } else {
                    sm.sendTextMessage(cleanPhone, null, message, null, null);
                }
                Log.i(TAG, "TACTICAL DISPATCH: Sent to " + cleanPhone);
            }
            
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "DISPATCH FAILURE: " + e.getMessage());
            call.reject("SMS Dispatch Failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendWhatsApp(PluginCall call) {
        String phone   = call.getString("number");
        String message = call.getString("message");
        if (phone == null || message == null) { call.reject("Phone and message required"); return; }
        try {
            // Strip non-numeric characters for WA API
            String clean = phone.replaceAll("[^0-9]", "");
            String url = "https://api.whatsapp.com/send?phone=" + clean
                       + "&text=" + Uri.encode(message);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("WhatsApp failure: " + e.getMessage());
        }
    }

    // ╚══════════════ END LOCKED TELEPHONY ENGINE ══════════════════════════╝


    // ── Service Control ───────────────────────────────────────────────────

    @PluginMethod
    public void startBackgroundSentinel(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(si);
            } else {
                getContext().startService(si);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Service start failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopBackgroundSentinel(PluginCall call) {
        try {
            getContext().stopService(new Intent(getContext(), KavachService.class));
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void startSafeTimer(PluginCall call) {
        int durationMins = call.getInt("durationMins", 30);
        long durationMs = durationMins * 60 * 1000L;
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_START_SAFE_TIMER");
            si.putExtra("duration_ms", durationMs);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(si);
            } else {
                getContext().startService(si);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Timer start failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopSafeTimer(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_STOP_SAFE_TIMER");
            getContext().startService(si);
            call.resolve();
        } catch (Exception e) {
            call.reject("Timer stop failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startContinuousSiren(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction(KavachService.ACTION_START_SIREN);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(si);
            } else {
                getContext().startService(si);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Siren start failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopContinuousSiren(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction(KavachService.ACTION_STOP_SIREN);
            getContext().startService(si);
            call.resolve();
        } catch (Exception e) {
            call.reject("Siren stop failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startVoiceSentinel(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_START_VOICE");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(si);
            } else {
                getContext().startService(si);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Voice sentinel start failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopVoiceSentinel(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_STOP_VOICE");
            getContext().startService(si);
            call.resolve();
        } catch (Exception e) {
            call.reject("Voice sentinel stop failure: " + e.getMessage());
        }
    }

    // ── Settings ──────────────────────────────────────────────────────────

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception e2) {
                try {
                    // Ultimate Fallback: App Details Settings
                    Intent finalFallback = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    finalFallback.setData(Uri.parse("package:" + getContext().getPackageName()));
                    finalFallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(finalFallback);
                    call.resolve();
                } catch (Exception e3) {
                    call.reject("Could not open any settings screen: " + e3.getMessage());
                }
            }
        }
    }

    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
        ret.put("isExempt", pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        call.resolve(ret);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void isOverlayPermissionGranted(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ret.put("granted", android.provider.Settings.canDrawOverlays(getContext()));
        } else { ret.put("granted", true); }
        call.resolve(ret);
    }

    @PluginMethod
    public void hasFullScreenIntentPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+
            android.app.NotificationManager nm = (android.app.NotificationManager) getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            ret.put("granted", nm.canUseFullScreenIntent());
        } else {
            ret.put("granted", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 34) {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                call.reject("Could not open full screen intent settings: " + e.getMessage());
            }
        }
        call.resolve();
    }

    // ── SOS Trigger Bridge ────────────────────────────────────────────────
    // Stores a pending trigger so App.tsx can consume it on cold start
    private JSObject pendingTrigger = null;

    public void notifySosTrigger(JSObject data) {
        if (hasListeners("sosTriggered")) {
            Log.i(TAG, "KAVACH: Live listener active — dispatching trigger.");
            notifyListeners("sosTriggered", data);
            pendingTrigger = null;
        } else {
            Log.w(TAG, "KAVACH: No listeners — buffering trigger for cold-start pulse.");
            pendingTrigger = data;
        }
    }

    @PluginMethod
    public void consumeTrigger(PluginCall call) {
        if (pendingTrigger != null) {
            Log.i(TAG, "KAVACH: Pending trigger consumed.");
            JSObject ret = pendingTrigger;
            pendingTrigger = null;
            call.resolve(ret);
        } else {
            call.reject("NO_PENDING_TRIGGER");
        }
    }

    // ── Evidence Vault Bridge ─────────────────────────────────────────────

    @PluginMethod
    public void stopForensicCapture(PluginCall call) {
        try {
            EvidenceEngine.stopCapture();
            call.resolve();
        } catch (Exception e) {
            call.reject("Stop capture failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void syncEvidence(PluginCall call) {
        // This will be implemented to push files from Context.getFilesDir()/evidence to Firebase
        Log.i(TAG, "MISSION CONTROL: Initiating Evidence Synchronization...");
        call.resolve();
    }

    // ── Notification Alert ────────────────────────────────────────────────

    @PluginMethod
    public void triggerAlarmStation(PluginCall call) {
        String title = call.getString("title", "🚨 KAVACH EMERGENCY");
        String body  = call.getString("body",  "Immediate response required!");
        try {
            android.app.NotificationManager nm = (android.app.NotificationManager)
                    getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            if (nm == null) { call.reject("NotificationManager unavailable"); return; }

            android.app.Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.app.NotificationChannel alarmChannel = new android.app.NotificationChannel(
                        "KavachAlarmChannel",
                        "Emergency Alerts",
                        android.app.NotificationManager.IMPORTANCE_HIGH
                );
                nm.createNotificationChannel(alarmChannel);
                builder = new android.app.Notification.Builder(getContext(), "KavachAlarmChannel");
            } else {
                builder = new android.app.Notification.Builder(getContext());
            }
            android.app.Notification notif = builder
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setPriority(android.app.Notification.PRIORITY_MAX)
                .setCategory(android.app.Notification.CATEGORY_ALARM)
                .setVisibility(android.app.Notification.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .build();
            nm.notify(999, notif);
            call.resolve();
        } catch (Exception e) { call.reject("Alarm station failure: " + e.getMessage()); }
    }

    @PluginMethod
    public void updateGuardianContacts(PluginCall call) {
        String contactsJson = call.getString("contacts");
        if (contactsJson == null) {
            call.reject("Contacts JSON required");
            return;
        }

        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("KavachPrefs", android.content.Context.MODE_PRIVATE);
            prefs.edit().putString("guardian_contacts", contactsJson).apply();
            Log.i(TAG, "MISSION CONTROL: Guardian contacts synced to hardware cache.");
            call.resolve();
        } catch (Exception e) {
            call.reject("Sync failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setUserRole(PluginCall call) {
        String role = call.getString("role");
        if (role == null) {
            call.reject("Role required");
            return;
        }

        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("KavachPrefs", android.content.Context.MODE_PRIVATE);
            prefs.edit().putString("kavach_user_role", role).apply();
            Log.i(TAG, "MISSION CONTROL: Hardware Role set to " + role);
            
            if (!"citizen".equals(role)) {
                Intent si = new Intent(getContext(), KavachService.class);
                si.setAction("com.kavach.app.ACTION_STOP_VOICE");
                getContext().startService(si);

                if ("protector".equals(role)) {
                    Intent scanIntent = new Intent(getContext(), KavachService.class);
                    scanIntent.setAction("com.kavach.app.ACTION_START_BLE_SCAN");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        getContext().startForegroundService(scanIntent);
                    } else {
                        getContext().startService(scanIntent);
                    }
                }
            } else {
                Intent stopScan = new Intent(getContext(), KavachService.class);
                stopScan.setAction("com.kavach.app.ACTION_STOP_BLE_SCAN");
                getContext().startService(stopScan);

                Intent si = new Intent(getContext(), KavachService.class);
                si.setAction("com.kavach.app.ACTION_START_VOICE");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(si);
                } else {
                    getContext().startService(si);
                }
            }
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Role Sync failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void triggerHapticPulse(PluginCall call) {
        try {
            android.os.Vibrator v = (android.os.Vibrator) getContext().getSystemService(android.content.Context.VIBRATOR_SERVICE);
            if (v != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(android.os.VibrationEffect.createOneShot(200, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(200);
                }
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Haptic failure: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setAppStealthMode(PluginCall call) {
        boolean enableStealth = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        try {
            PackageManager pm = getContext().getPackageManager();
            String packageName = getContext().getPackageName();
            
            ComponentName defaultAlias = new ComponentName(packageName, packageName + ".DefaultActivity");
            ComponentName stealthAlias = new ComponentName(packageName, packageName + ".StealthActivity");
            
            if (enableStealth) {
                pm.setComponentEnabledSetting(stealthAlias, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                pm.setComponentEnabledSetting(defaultAlias, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            } else {
                pm.setComponentEnabledSetting(defaultAlias, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                pm.setComponentEnabledSetting(stealthAlias, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            }

            call.resolve();

            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                try {
                    if (getActivity() != null) {
                        getActivity().finishAffinity();
                        getActivity().finishAndRemoveTask();
                    }
                } catch(Exception ignored) {}
            }, 1500);
        } catch (Exception e) {
            call.reject("Failed to toggle stealth mode: " + e.getMessage());
        }
    }

    @PluginMethod
    public void scheduleFakeCall(PluginCall call) {
        Integer seconds = call.getInt("seconds", 10);
        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(context, FakeCallReceiver.class);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context, 
                    1001, 
                    intent, 
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            long triggerAtMillis = SystemClock.elapsedRealtime() + (seconds * 1000L);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            }
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to schedule fake call natively", e);
        }
    }

    @PluginMethod
    public void getPhoneHint(PluginCall call) {
        saveCall(call);
        GetPhoneNumberHintIntentRequest request = GetPhoneNumberHintIntentRequest.builder().build();

        Identity.getSignInClient(getContext())
            .getPhoneNumberHintIntent(request)
            .addOnSuccessListener(result -> {
                try {
                    getBridge().getActivity().startIntentSenderForResult(
                        result.getIntentSender(),
                        9001,
                        null, 0, 0, 0
                    );
                } catch (Exception e) {
                    call.reject("ERROR_LAUNCHING_HINT: " + e.getMessage());
                }
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "Phone hint unavailable: " + e.getMessage());
                call.reject("IDENTITY_UNAVAILABLE");
            });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == 9001) {
            PluginCall call = getSavedCall();
            if (call == null) return;

            if (resultCode == Activity.RESULT_OK && data != null) {
                try {
                    String phoneNumber = Identity.getSignInClient(getContext()).getPhoneNumberFromIntent(data);
                    JSObject ret = new JSObject();
                    ret.put("number", phoneNumber);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("ERROR_PARSING_NUMBER");
                }
            } else {
                call.reject("USER_CANCELLED");
            }
        }
    }
    @PluginMethod
    public void encryptQueue(PluginCall call) {
        try {
            String plainText = call.getString("data");
            if (plainText == null) {
                call.reject("Must provide data to encrypt");
                return;
            }

            java.security.KeyStore keyStore = java.security.KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            
            String alias = "kavach_queue_key";
            if (!keyStore.containsAlias(alias)) {
                android.security.keystore.KeyGenParameterSpec keyGenParameterSpec = new android.security.keystore.KeyGenParameterSpec.Builder(
                        alias,
                        android.security.keystore.KeyProperties.PURPOSE_ENCRYPT | android.security.keystore.KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                        .build();

                javax.crypto.KeyGenerator keyGenerator = javax.crypto.KeyGenerator.getInstance(
                        android.security.keystore.KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                keyGenerator.init(keyGenParameterSpec);
                keyGenerator.generateKey();
            }

            java.security.Key secretKey = keyStore.getKey(alias, null);
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, secretKey);

            byte[] iv = cipher.getIV();
            byte[] encryption = cipher.doFinal(plainText.getBytes("UTF-8"));

            JSObject ret = new JSObject();
            ret.put("ciphertext", android.util.Base64.encodeToString(encryption, android.util.Base64.NO_WRAP));
            ret.put("iv", android.util.Base64.encodeToString(iv, android.util.Base64.NO_WRAP));
            ret.put("version", 1);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Queue Encryption Failed", e);
            call.reject("Queue Encryption Failed", e);
        }
    }

    @PluginMethod
    public void decryptQueue(PluginCall call) {
        try {
            String cipherTextBase64 = call.getString("ciphertext");
            String ivBase64 = call.getString("iv");
            if (cipherTextBase64 == null || ivBase64 == null) {
                call.reject("Must provide ciphertext and iv");
                return;
            }

            java.security.KeyStore keyStore = java.security.KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            
            String alias = "kavach_queue_key";
            if (!keyStore.containsAlias(alias)) {
                call.reject("Key not found");
                return;
            }

            java.security.Key secretKey = keyStore.getKey(alias, null);
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
            
            byte[] iv = android.util.Base64.decode(ivBase64, android.util.Base64.NO_WRAP);
            android.security.keystore.KeyGenParameterSpec spec; // we use GCMParameterSpec instead
            javax.crypto.spec.GCMParameterSpec gcmSpec = new javax.crypto.spec.GCMParameterSpec(128, iv);
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            byte[] cipherTextBytes = android.util.Base64.decode(cipherTextBase64, android.util.Base64.NO_WRAP);
            byte[] decrypted = cipher.doFinal(cipherTextBytes);

            JSObject ret = new JSObject();
            ret.put("data", new String(decrypted, "UTF-8"));
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Queue Decryption Failed", e);
            call.reject("Queue Decryption Failed", e);
        }
    }

    @PluginMethod
    public void logCrashlyticsError(PluginCall call) {
        String message = call.getString("message");
        if (message != null) {
            FirebaseCrashlytics.getInstance().log(message);
            FirebaseCrashlytics.getInstance().recordException(new Exception(message));
            call.resolve();
        } else {
            call.reject("Message required");
        }
    }

    @PluginMethod
    public void setCrashlyticsUser(PluginCall call) {
        String userId = call.getString("userId");
        if (userId != null) {
            FirebaseCrashlytics.getInstance().setUserId(userId);
            call.resolve();
        } else {
            call.reject("UserId required");
        }
    }

    @PluginMethod
    public void isDeviceSecure(PluginCall call) {
        JSObject ret = new JSObject();
        boolean isRooted = SecuritySentinel.isDeviceRooted(getContext());
        ret.put("isRooted", isRooted);
        ret.put("isEmulator", Build.PRODUCT.contains("sdk") || Build.MODEL.contains("Emulator"));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPlayIntegrityToken(PluginCall call) {
        try {
            String nonce = call.getString("nonce");
            Long gcpProjectNumber = call.getLong("gcpProjectNumber");
            
            if (nonce == null || gcpProjectNumber == null) {
                call.reject("Must provide nonce and gcpProjectNumber");
                return;
            }

            SecuritySentinel.verifyPlayIntegrity(getContext(), nonce, gcpProjectNumber, call);
        } catch (Exception e) {
            call.reject("Play Integrity error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startBleSOSAdvertising(PluginCall call) {
        String victimUid = call.getString("victimUid");
        Double latitude = call.getDouble("latitude");
        Double longitude = call.getDouble("longitude");

        if (victimUid == null || latitude == null || longitude == null) {
            call.reject("Missing required params: victimUid, latitude, longitude");
            return;
        }

        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_START_BLE_ADV");
            si.putExtra("victim_uid", victimUid);
            si.putExtra("latitude", latitude);
            si.putExtra("longitude", longitude);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(si);
            } else {
                getContext().startService(si);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start BLE advertising: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopBleSOSAdvertising(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_STOP_BLE_ADV");
            getContext().startService(si);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop BLE advertising: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startBleSOSScanning(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_START_BLE_SCAN");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(si);
            } else {
                getContext().startService(si);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start BLE scanning: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopBleSOSScanning(PluginCall call) {
        try {
            Intent si = new Intent(getContext(), KavachService.class);
            si.setAction("com.kavach.app.ACTION_STOP_BLE_SCAN");
            getContext().startService(si);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop BLE scanning: " + e.getMessage());
        }
    }

    private float originalBrightness = -1f;

    @PluginMethod
    public void setScreenBrightness(PluginCall call) {
        Double level = call.getDouble("level");
        getActivity().runOnUiThread(() -> {
            try {
                android.view.Window window = getActivity().getWindow();
                android.view.WindowManager.LayoutParams layoutParams = window.getAttributes();
                if (level != null && level >= 0.0) {
                    if (originalBrightness == -1f) {
                        originalBrightness = layoutParams.screenBrightness;
                    }
                    layoutParams.screenBrightness = level.floatValue();
                } else {
                    if (originalBrightness != -1f) {
                        layoutParams.screenBrightness = originalBrightness;
                        originalBrightness = -1f;
                    }
                }
                window.setAttributes(layoutParams);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to set screen brightness: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void keepScreenOn(PluginCall call) {
        Boolean enable = call.getBoolean("enable", true);
        getActivity().runOnUiThread(() -> {
            try {
                android.view.Window window = getActivity().getWindow();
                if (enable != null && enable) {
                    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to set keep screen awake: " + e.getMessage());
            }
        });
    }
}
