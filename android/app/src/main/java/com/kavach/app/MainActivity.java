package com.kavach.app;

import android.content.Intent;
import android.os.Build;
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }

        super.onCreate(savedInstanceState);
        Log.i("KAVACH", "TACTICAL GRID: Neural Bridge anchored. Lock-override ACTIVE.");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // Ensure screen wakes up on new SOS triggers
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }

        if (intent != null && intent.hasExtra("trigger")) {
             String source = intent.getStringExtra("trigger");
             Log.i("KAVACH", "CODE RED: Signal received via Intent from " + source);
             
             KavachNative plugin = (KavachNative) getBridge().getPlugin("KavachPlugin").getInstance();
             if (plugin != null) {
                 com.getcapacitor.JSObject data = new com.getcapacitor.JSObject();
                 data.put("source", source);
                 plugin.notifySosTrigger(data);
             }
        }
    }
}
