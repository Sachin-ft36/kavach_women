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
    private static boolean isCapturing = false;

    /**
     * Start the Black-Box Evidence Capture sequence.
     * This is triggered ONLY after a verified SOS event.
     */
    public static void startCapture(Context context, String alertId) {
        if (isCapturing) return;
        isCapturing = true;
        Log.i(TAG, "BLACK-BOX: Initializing Forensic Capture for Alert: " + alertId);

        // 1. Setup Private Hidden Directory
        File evidenceDir = new File(context.getFilesDir(), "evidence");
        if (!evidenceDir.exists()) evidenceDir.mkdirs();

        // 2. Start Audio Forensic Recording (30s Chunk)
        startAudioRecording(context, alertId, evidenceDir);
        
        // 3. TODO: Implement CameraX Snapshot capture in next iteration
        // (Snapshots require a hidden SurfaceTexture or CameraX background use)
    }

    private static void startAudioRecording(Context context, String alertId, File dir) {
        try {
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName = "AUD_" + timeStamp + ".mp4";
            File audioFile = new File(dir, fileName);

            audioRecorder = new MediaRecorder();
            audioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            audioRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            audioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            audioRecorder.setOutputFile(audioFile.getAbsolutePath());
            audioRecorder.prepare();
            audioRecorder.start();

            Log.i(TAG, "AUDIO RECORDING: Secured in private vault: " + audioFile.getAbsolutePath());
            
            // Logic to calculate hash after recording stops or chunking
        } catch (Exception e) {
            Log.e(TAG, "AUDIO CAPTURE FAILED: " + e.getMessage());
        }
    }

    public static void stopCapture() {
        if (!isCapturing) return;
        try {
            if (audioRecorder != null) {
                audioRecorder.stop();
                audioRecorder.release();
                audioRecorder = null;
            }
            isCapturing = false;
            Log.i(TAG, "BLACK-BOX: Forensic Capture Sequence Terminated.");
        } catch (Exception e) {
            Log.e(TAG, "BLACK-BOX STOP FAILED: " + e.getMessage());
        }
    }

    /**
     * Generate SHA-256 for Court Evidence Integrity
     */
    public static String calculateSHA256(File file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            FileInputStream fis = new FileInputStream(file);
            byte[] byteArray = new byte[1024];
            int bytesCount = 0;
            while ((bytesCount = fis.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
            fis.close();
            byte[] bytes = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(Integer.toString((b & 0xff) + 0x100, 16).substring(1));
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "HASH CALCULATION FAILED: " + e.getMessage());
            return null;
        }
    }
}
