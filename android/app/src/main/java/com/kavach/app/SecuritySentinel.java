package com.kavach.app;

import android.content.Context;
import android.util.Log;
import com.scottyab.rootbeer.RootBeer;
import okhttp3.CertificatePinner;
import okhttp3.OkHttpClient;

import com.google.android.play.core.integrity.IntegrityManager;
import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.IntegrityTokenRequest;
import com.google.android.play.core.integrity.IntegrityTokenResponse;
import com.google.android.gms.tasks.Task;

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
        // PRODUCTION TO-DO: Replace with actual production domain and valid SHA-256 hash.
        // Command to generate: openssl s_client -servername api.kavach.gov.in -connect api.kavach.gov.in:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
        CertificatePinner certificatePinner = new CertificatePinner.Builder()
            .add("api.kavach.gov.in", "sha256/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=")
            .build();

        return new OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .build();
    }

    /**
     * Verifies the app is untampered and downloaded from Google Play Store.
     * Requires Google Cloud backend to decrypt the token.
     */
    public static void verifyPlayIntegrity(Context context, String nonce) {
        // PRODUCTION TO-DO: Implement Play Integrity API request here
        IntegrityManager integrityManager = IntegrityManagerFactory.create(context);
        Task<IntegrityTokenResponse> integrityTokenResponse = integrityManager.requestIntegrityToken(
            IntegrityTokenRequest.builder()
                .setCloudProjectNumber(10000000000L) // TODO: Phase C Replace with real GCP project number
                .setNonce(nonce)
                .build());

        integrityTokenResponse.addOnSuccessListener(response -> {
            String integrityToken = response.token();
            Log.d(TAG, "Play Integrity Token retrieved. Send to backend for verification.");
            // TODO: Send to Cloud Function for Verification (Sprint 2 implementation node)
        }).addOnFailureListener(e -> {
            Log.e(TAG, "Play Integrity Token request failed.", e);
        });
        Log.i(TAG, "Play Integrity API verification initialized.");
    }
}
