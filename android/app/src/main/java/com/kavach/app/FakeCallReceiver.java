package com.kavach.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class FakeCallReceiver extends BroadcastReceiver {
    private static final String TAG = "FakeCallReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "Fake Call Alarm Triggered!");

        // 🛡️ Launch MainActivity with a specific extra
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("trigger", "fake_call");
        context.startActivity(launchIntent);
    }
}
