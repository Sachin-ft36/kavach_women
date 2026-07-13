package com.kavach.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.app.AlertDialog;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1. Register Plugins BEFORE super.onCreate
        registerPlugin(KavachNative.class);
        
        // 2. super.onCreate must be called next
        super.onCreate(savedInstanceState);

        // 🛡️ SCREEN SECURITY: Prevent screenshots and screen recording (Black screen on record)
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

        // 🛡️ SECURITY SENTINEL: Root Detection
        if (SecuritySentinel.isDeviceRooted(this)) {
            Log.e("KAVACH_SYS", "CRITICAL SECURITY BREACH: Device is rooted. Terminating.");
            finishAffinity();
            System.exit(0);
        }

        // 3. 🛡️ TACTICAL OVERRIDE: Show App over Lock Screen
        setupLockScreenVisibility();

        // 4. 🔋 BATTERY OPTIMIZATION CHECK: Request "Unrestricted" status
        checkBatteryOptimizations();

        // 5. 🔔 NOTIFICATION PERMISSION: Required for Android 13+ SOS alerts
        checkNotificationPermission();

        // 6. 🛡️ CRITICAL PERMISSIONS: SMS, Call, Location, Mic
        checkAndRequestCriticalPermissions();

        Log.i("KAVACH_SYS", "TACTICAL GRID: Neural Bridge anchored. Lock-override ACTIVE.");
    }

    private void checkAndRequestCriticalPermissions() {
        String[] permissions = {
            android.Manifest.permission.SEND_SMS,
            android.Manifest.permission.CALL_PHONE,
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.RECORD_AUDIO,
            android.Manifest.permission.CAMERA
        };

        java.util.ArrayList<String> listPermissionsNeeded = new java.util.ArrayList<>();
        for (String p : permissions) {
            if (checkSelfPermission(p) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(p);
            }
        }

        if (!listPermissionsNeeded.isEmpty()) {
            requestPermissions(listPermissionsNeeded.toArray(new String[0]), 102);
        }

        // Special handling for Background Location (Android 10+)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            if (checkSelfPermission(android.Manifest.permission.ACCESS_BACKGROUND_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                // Background location must be requested separately on some versions
                requestPermissions(new String[]{android.Manifest.permission.ACCESS_BACKGROUND_LOCATION}, 103);
            }
        }

        // 🚨 DEVICE SPECIFIC FIX: MIUI, ColorOS, etc. often block background SMS
        checkManufacturerSettings();
    }

    private void checkManufacturerSettings() {
        String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
        if (manufacturer.contains("xiaomi") || manufacturer.contains("oppo") || manufacturer.contains("vivo") || manufacturer.contains("realme")) {
            new AlertDialog.Builder(this)
                .setTitle("Critical Device Settings")
                .setMessage("Your device manufacturer (" + android.os.Build.MANUFACTURER + ") may block background SMS and SOS alerts by default.\n\n" +
                           "To ensure KAVACH works reliably:\n" +
                           "1. Go to 'App Info' -> 'Other Permissions'.\n" +
                           "2. Enable 'Service SMS' and 'Display over lock screen'.\n" +
                           "3. Enable 'Autostart' if available.")
                .setPositiveButton("Go to Settings", (dialog, which) -> {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    Uri uri = Uri.fromParts("package", getPackageName(), null);
                    intent.setData(uri);
                    startActivity(intent);
                })
                .setNegativeButton("Already Done", null)
                .setCancelable(false)
                .show();
        }
    }

    private void checkNotificationPermission() {
        if (android.os.Build.VERSION.SDK_INT >= 33) { // android.os.Build.VERSION_CODES.TIRAMISU
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    private void setupLockScreenVisibility() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            android.app.KeyguardManager keyguardManager = (android.app.KeyguardManager) getSystemService(android.content.Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
    }

    private void checkBatteryOptimizations() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(android.content.Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                Log.w("KAVACH_SYS", "Neural Pulse Weak: Battery Optimization is active. Requesting bypass...");
                try {
                    android.content.Intent intent = new android.content.Intent();
                    intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e("KAVACH_SYS", "Failed to launch battery optimization settings: " + e.getMessage());
                }
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // Ensure screen wakes up on new SOS triggers
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (intent != null && intent.hasExtra("trigger")) {
             String source = intent.getStringExtra("trigger");
             Log.i("KAVACH_SYS", "CODE RED: Signal received via Intent from " + source);
             
             KavachNative plugin = (KavachNative) getBridge().getPlugin("KavachPlugin").getInstance();
             if (plugin != null) {
                 com.getcapacitor.JSObject data = new com.getcapacitor.JSObject();
                 data.put("source", source);
                 plugin.notifySosTrigger(data);
             }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("trigger")) {
             String source = intent.getStringExtra("trigger");
             Log.i("KAVACH_SYS", "CODE RED (Cold Start): Signal received via Intent from " + source);
             
             KavachNative plugin = (KavachNative) getBridge().getPlugin("KavachPlugin").getInstance();
             if (plugin != null) {
                 com.getcapacitor.JSObject data = new com.getcapacitor.JSObject();
                 data.put("source", source);
                 plugin.notifySosTrigger(data);
                 intent.removeExtra("trigger"); // Prevent loop
             }
        }
    }
}
