package com.kavach.app;

import android.content.Context;
import android.util.Log;
import com.scottyab.rootbeer.RootBeer;
import okhttp3.CertificatePinner;
import okhttp3.OkHttpClient;

public class SecuritySentinel {
    private static final String TAG = "SecuritySentinel";

    /**
     * Checks if the device is rooted using RootBeer.
     * @param context Application context
     * @return true if rooted, false otherwise.
     */
    public static boolean isDeviceRooted(Context context) {
        RootBeer rootBeer = new RootBeer(context);
        if (rootBeer.isRooted()) {
            Log.e(TAG, "CRITICAL: Root access detected! Device is unsafe.");
            return true;
        }
        return false;
    }

    /**
     * Creates an OkHttpClient with SSL Pinning enforced for backend servers.
     * @return OkHttpClient instance with CertificatePinner
     */
    public static OkHttpClient getSecureHttpClient() {
        // Replace with actual domain and sha256 hash pins
        CertificatePinner certificatePinner = new CertificatePinner.Builder()
            .add("api.kavach.gov.in", "sha256/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=")
            .build();

        return new OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .build();
    }
}
