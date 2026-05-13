package com.kavach.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register Plugins
        registerPlugin(KavachNative.class);

        // 🛡️ TACTICAL OVERRIDE: Show App over Lock Screen
        // Using WindowManager flags for universal compatibility across all SDK levels
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);

        super.onCreate(savedInstanceState);
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
}
