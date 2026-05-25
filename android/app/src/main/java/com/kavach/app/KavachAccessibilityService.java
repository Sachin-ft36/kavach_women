package com.kavach.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.view.KeyEvent;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import com.getcapacitor.JSObject;

public class KavachAccessibilityService extends AccessibilityService {
    private static final String TAG = "KavachAccessService";
    
    // Time threshold to determine a verified long-press sequence (1.5 seconds)
    private static final long LONG_PRESS_THRESHOLD_MS = 1500;
    private long volumeDownPressedTimestamp = 0;
    private boolean isSosTriggered = false;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "Kavach Accessibility Service Connected. Initializing key filter...");
        
        // Dynamic configuration injection to guarantee key interception
        AccessibilityServiceInfo info = getServiceInfo();
        if (info != null) {
            info.flags |= AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS;
            setServiceInfo(info);
        }
    }

    @Override
    public boolean onKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        int action = event.getAction();

        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            if (action == KeyEvent.ACTION_DOWN) {
                // Initialize timestamp on initial down event
                if (volumeDownPressedTimestamp == 0) {
                    volumeDownPressedTimestamp = System.currentTimeMillis();
                    isSosTriggered = false;
                } else {
                    long duration = System.currentTimeMillis() - volumeDownPressedTimestamp;
                    
                    // Trigger if threshold is crossed and we haven't fired for this sequence yet
                    if (duration >= LONG_PRESS_THRESHOLD_MS && !isSosTriggered) {
                        isSosTriggered = true;
                        executeEmergencySequence();
                        return true; // Intercept and consume event completely
                    }
                }
                // Consume events while holding down to block native volume slider flashes
                return true; 
                
            } else if (action == KeyEvent.ACTION_UP) {
                // Clear state on physical key release
                volumeDownPressedTimestamp = 0;
                boolean handled = isSosTriggered;
                isSosTriggered = false;
                return handled; // Return true if we consumed the sequence, false otherwise
            }
        }
        return super.onKeyEvent(event);
    }

    private void executeEmergencySequence() {
        Log.i(TAG, "🛡️ ACCESSIBILITY SENTINEL: Verified Long-Press Volume Down Sequence Authenticated.");

        // 1. Send tactile confirmation feedback vibration pulse
        Vibrator vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        if (vibrator != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(400, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(400);
                }
            } catch (Exception e) {
                Log.w(TAG, "Tactile feedback failed: " + e.getMessage());
            }
        }

        // 2. Broadcast internal command payload to modern Capacitor/Bridge layer
        try {
            KavachNative plugin = KavachNative.getInstance();
            if (plugin != null) {
                JSObject data = new JSObject();
                data.put("source", "shadow");
                plugin.notifySosTrigger(data);
                Log.i(TAG, "Capacitor bridge notified directly with shadow intent payload.");
            } else {
                Log.w(TAG, "KavachNative plugin instance null; running intent fallback strategy.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Plugin bridge communication dispatch failed: " + e.getMessage());
        }

        // 3. Bring MainActivity to the frontend (Bypassing background restrictions)
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        intent.putExtra("trigger", "shadow");
        
        try {
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Activity execution lifecycle start suppressed: " + e.getMessage());
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {}

    @Override
    public void onInterrupt() {}
}
