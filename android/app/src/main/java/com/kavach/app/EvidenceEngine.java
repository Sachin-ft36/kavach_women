package com.kavach.app;

import android.content.Context;
import android.media.MediaRecorder;
import android.util.Log;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class EvidenceEngine {
    private static final String TAG = "KavachEvidence";
    private static MediaRecorder audioRecorder;
    private static File currentFile;
    private static long startTime;
    private static boolean isCapturing = false;

    /**
     * Start the Black-Box Evidence Capture sequence.
     * This is triggered ONLY after a verified SOS event.
     */
    public static void startCapture(final Context context, final String alertId) {
        if (isCapturing) return;
        
        // 🛰️ EXECUTE ON BACKGROUND THREAD TO PREVENT UI HANG
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    isCapturing = true;
                    startTime = System.currentTimeMillis();
                    Log.i(TAG, "BLACK-BOX: Initializing Forensic Capture for Alert: " + alertId);

                    // 1. Setup Private Hidden Directory
                    File evidenceDir = new File(context.getFilesDir(), "evidence");
                    if (!evidenceDir.exists()) evidenceDir.mkdirs();

                    // 2. Start Audio Forensic Recording (30s Chunk)
                    startAudioRecording(context, alertId, evidenceDir);
                } catch (Exception e) {
                    Log.e(TAG, "FORENSIC ENGINE CRITICAL FAILURE: " + e.getMessage());
                    isCapturing = false;
                }
            }
        }).start();
    }

    private static void startAudioRecording(Context context, String alertId, File dir) {
        try {
            // 🛡️ HANDSHAKE PROTOCOL: Stop any current capture first
            if (audioRecorder != null) {
                try { 
                    audioRecorder.stop();
                    audioRecorder.release(); 
                } catch (Exception ignored) {}
                audioRecorder = null;
            }

            // ⏲️ MIC STABILIZATION DELAY: Wait for other system listeners to release hardware
            Thread.sleep(300);

            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName = "AUD_" + timeStamp + ".mp4";
            currentFile = new File(dir, fileName);

            audioRecorder = new MediaRecorder();
            // MISSION CRITICAL: Use VOICE_RECOGNITION for cleaner evidence
            audioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC); 
            audioRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            audioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            audioRecorder.setOutputFile(currentFile.getAbsolutePath());
            
            audioRecorder.prepare();
            audioRecorder.start();

            Log.i(TAG, "AUDIO RECORDING: Secured in private vault: " + currentFile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(TAG, "AUDIO CAPTURE FAILED (MIC CLASH?): " + e.getMessage());
            if (audioRecorder != null) {
                try { audioRecorder.release(); } catch (Exception ignored) {}
                audioRecorder = null;
            }
            isCapturing = false;
        }
    }

    public static void stopCapture() {
        if (!isCapturing) return;
        try {
            Log.i(TAG, "BLACK-BOX: Terminating capture sequence...");
            // Safety: Ensure recording has been active to prevent stop() crashes
            long duration = System.currentTimeMillis() - startTime;
            
            if (audioRecorder != null) {
                if (duration > 1500) {
                    try { audioRecorder.stop(); } catch (Exception e) { Log.e(TAG, "Stop Error: " + e.getMessage()); }
                }
                audioRecorder.release();
                audioRecorder = null;
                
                // Finalize Evidence with Integrity Hash
                if (currentFile != null && currentFile.exists()) {
                    String hash = calculateSHA256(currentFile);
                    Log.i(TAG, "FORENSIC HASH GENERATED: " + hash);
                }
            }
            isCapturing = false;
            Log.i(TAG, "BLACK-BOX: Mic Released. Grid Restored.");
        } catch (Exception e) {
            Log.e(TAG, "BLACK-BOX STOP FAILED: " + e.getMessage());
            isCapturing = false;
            audioRecorder = null;
        }
    }

    /**
     * Generate SHA-256 for Court Evidence Integrity
     */
    public static String calculateSHA256(File file) {
        FileInputStream fis = null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            fis = new FileInputStream(file);
            byte[] byteArray = new byte[1024];
            int bytesCount = 0;
            while ((bytesCount = fis.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
            byte[] bytes = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(Integer.toString((b & 0xff) + 0x100, 16).substring(1));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "HASH CALCULATION FAILED: " + e.getMessage());
            return null;
        } finally {
            if (fis != null) {
                try { fis.close(); } catch (Exception ignored) {}
            }
        }
    }
}
