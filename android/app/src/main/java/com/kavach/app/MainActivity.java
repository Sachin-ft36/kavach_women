package com.kavach.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
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

        Log.i("KAVACH_SYS", "TACTICAL GRID: Neural Bridge anchored. Lock-override ACTIVE.");
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
