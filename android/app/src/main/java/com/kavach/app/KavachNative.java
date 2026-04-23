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

@CapacitorPlugin(
    name = "KavachPlugin",
    permissions = {
        @Permission(alias = "sms",  strings = {Manifest.permission.SEND_SMS}),
        @Permission(alias = "call", strings = {Manifest.permission.CALL_PHONE})
    }
)
public class KavachNative extends Plugin {

    private static final String TAG = "KavachNative";

    // ── Permissions ───────────────────────────────────────────────────────

    @PluginMethod
    public void checkSafetyPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("sms",  getPermissionState("sms").toString());
        ret.put("call", getPermissionState("call").toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSensitivePermissions(PluginCall call) {
        requestPermissionForAliases(new String[]{"sms", "call"}, call, "permissionsCallback");
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
    public void directCall(PluginCall call) {
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
    public void sendSilentSMS(PluginCall call) {
        String phone   = call.getString("number");
        String message = call.getString("message");
        if (phone == null || message == null) { call.reject("Phone and message required"); return; }
        try {
            SmsManager sm;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                sm = getContext().getSystemService(SmsManager.class);
            } else {
                sm = SmsManager.getDefault();
            }
            if (sm == null) { call.reject("SmsManager unavailable"); return; }

            // Split long messages automatically
            if (message.length() > 160) {
                java.util.ArrayList<String> parts = sm.divideMessage(message);
                sm.sendMultipartTextMessage(phone, null, parts, null, null);
            } else {
                sm.sendTextMessage(phone, null, message, null, null);
            }
            Log.i(TAG, "SMS dispatched to " + phone);
            call.resolve();
        } catch (Exception e) {
            call.reject("SMS failed: " + e.getMessage());
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
    public void startService(PluginCall call) {
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
    public void stopService(PluginCall call) {
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
            } catch (Exception e2) { call.reject(e2.getMessage()); }
        }
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) { call.reject(e.getMessage()); }
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
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager)
                    getContext().getSystemService(android.content.Context.POWER_SERVICE);
            ret.put("isExempt", pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        } else { ret.put("isExempt", true); }
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
                // Use the high-importance channel created by KavachService
                builder = new android.app.Notification.Builder(getContext(), "KavachServiceChannel");
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
}
