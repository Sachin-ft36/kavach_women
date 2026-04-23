package com.kavach.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // CRITICAL: registerPlugin MUST be called BEFORE super.onCreate()
        // so the Capacitor bridge initializes with the plugin registered.
        registerPlugin(KavachNative.class);

        super.onCreate(savedInstanceState);
        Log.i("KAVACH", "TACTICAL GRID: Neural Bridge anchored.");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.hasExtra("trigger")) {
             Log.i("KAVACH", "CODE RED: Signal received via Intent.");
        }
    }
}
