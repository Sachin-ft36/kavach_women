package com.kavach.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;
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

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static KavachNative getInstance() {
        return instance;
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
        Intent intent = new Intent();
        boolean isSupported = false;

        if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi") || manufacturer.contains("poco")) {
            intent.setAction("miui.intent.action.APP_PERM_EDITOR");
            intent.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
            intent.putExtra("extra_pkgname", getContext().getPackageName());
            isSupported = true;
        } else if (manufacturer.contains("oppo") || manufacturer.contains("realme")) {
            intent.setClassName("com.coloros.safecenter", "com.coloros.safecenter.permission.PermissionManagerActivity");
            isSupported = true;
        } else if (manufacturer.contains("vivo") || manufacturer.contains("iqoo")) {
            intent.setClassName("com.iqoo.secure", "com.iqoo.secure.ui.PermissionManagerActivity");
            isSupported = true;
        }

        if (isSupported) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                Log.w(TAG, "OEM Lock Screen Permission activity not found for: " + manufacturer, e);
                call.reject("Not found");
            }
        } else {
            // Not a supported Chinese OEM or standard Android handles it
            call.resolve();
        }
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
            
            // If the role isn't citizen, ensure we stop any active voice sentinels
            if (!"citizen".equals(role)) {
                Intent si = new Intent(getContext(), KavachService.class);
                si.setAction("com.kavach.app.ACTION_STOP_VOICE");
                getContext().startService(si);
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
}
