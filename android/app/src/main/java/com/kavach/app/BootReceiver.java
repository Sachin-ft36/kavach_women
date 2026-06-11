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
            
            try {
                androidx.work.Constraints constraints = new androidx.work.Constraints.Builder()
                        .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                        .build();

                // Phase A: Use WorkManager to enqueue OfflineSyncWorker safely on Android 12+
                androidx.work.OneTimeWorkRequest syncWorkRequest = new androidx.work.OneTimeWorkRequest.Builder(OfflineSyncWorker.class)
                        .setConstraints(constraints)
                        .setBackoffCriteria(
                                androidx.work.BackoffPolicy.EXPONENTIAL,
                                androidx.work.WorkRequest.MIN_BACKOFF_MILLIS,
                                java.util.concurrent.TimeUnit.MILLISECONDS)
                        .build();
                
                androidx.work.WorkManager.getInstance(context).enqueue(syncWorkRequest);
                Log.i(TAG, "WorkManager successfully enqueued OfflineSyncWorker.");
            } catch (Exception e) {
                Log.e(TAG, "Failed to enqueue OfflineSyncWorker: " + e.getMessage());
            }
        }
    }
}
