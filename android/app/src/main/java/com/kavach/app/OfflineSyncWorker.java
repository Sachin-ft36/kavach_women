package com.kavach.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class OfflineSyncWorker extends Worker {
    private static final String TAG = "OfflineSyncWorker";

    public OfflineSyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "OfflineSyncWorker triggered! Bootstrapping background safety components.");
        try {
            Context context = getApplicationContext();
            Intent serviceIntent = new Intent(context, KavachService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.i(TAG, "Safety core service stack initialized from WorkManager successfully.");
            
            // TODO: In a fully native implementation, we would also flush the SQLite queue here.
            // Since our queue is currently handled by Capacitor Preferences in the WebView,
            // we start the Foreground Service which will eventually spin up the JS context or
            // wake the app up to flush the queue.

            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Worker execution rejected service startup: " + e.getMessage());
            return Result.retry();
        }
    }
}
