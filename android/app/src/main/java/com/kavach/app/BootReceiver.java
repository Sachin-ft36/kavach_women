package com.kavach.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "KavachBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        
        String action = intent.getAction();
        Log.d(TAG, "Intercepted system broadcast action: " + action);

        // Match cold boot, quick boot protocols, or custom self-healing intents
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) 
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.kavach.app.RESTART_SENSOR".equals(action)) {
            
            Log.i(TAG, "KAVACH Auto-Boot: Initializing background safety core components...");
            
            Intent serviceIntent = new Intent(context, KavachService.class);
            
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    // Note: Android 14 requires appropriate FOREGROUND_SERVICE permissions 
                    // declared in manifest for this call to execute successfully from boot.
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
                Log.i(TAG, "Safety core service stack initialized successfully.");
            } catch (Exception e) {
                Log.e(TAG, "OS Background execution restrictions rejected service startup: " + e.getMessage());
                
                // Fallback Strategy: Schedule a low-latency worker or trigger a high-priority 
                // notification to prompt user engagement if the direct foreground launch fails.
            }
        }
    }
}
