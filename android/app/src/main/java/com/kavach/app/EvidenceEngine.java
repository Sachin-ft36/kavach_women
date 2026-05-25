package com.kavach.app;

import android.content.Context;
import android.media.MediaRecorder;
import android.util.Log;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class EvidenceEngine {
    private static final String TAG = "KavachEvidence";
    private static MediaRecorder audioRecorder;
    private static File currentFile;
    private static long startTime;
    
    // Volatile primitive flag guarantees unified state visibility across separate threads
    private static volatile boolean isCapturing = false;
    // Execution lock to prevent simultaneous state modification conditions
    private static final Object STATE_LOCK = new Object();

    /**
     * Start the Black-Box Evidence Capture sequence.
     * Executed safely on a decoupled worker thread.
     */
    public static void startCapture(final Context context, final String alertId) {
        synchronized (STATE_LOCK) {
            if (isCapturing) {
                Log.w(TAG, "Capture sequence initialization skipped: Engine already running.");
                return;
            }
            isCapturing = true;
        }
        
        // Decouple from the caller thread environment entirely
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    startTime = System.currentTimeMillis();
                    Log.i(TAG, "BLACK-BOX: Initializing Forensic Capture for Alert: " + alertId);

                    // 1. Setup Private Hidden Directory
                    File evidenceDir = new File(context.getApplicationContext().getFilesDir(), "evidence");
                    if (!evidenceDir.exists()) {
                        boolean created = evidenceDir.mkdirs();
                        if (!created && !evidenceDir.exists()) {
                            throw new RuntimeException("Failed to construct isolated local storage directories.");
                        }
                    }

                    // 2. Start Audio Forensic Recording
                    startAudioRecording(context.getApplicationContext(), alertId, evidenceDir);
                } catch (Exception e) {
                    Log.e(TAG, "FORENSIC ENGINE CRITICAL FAILURE: " + e.getMessage());
                    synchronized (STATE_LOCK) {
                        isCapturing = false;
                    }
                }
            }
        }).start();
    }

    private static void startAudioRecording(Context context, String alertId, File dir) {
        synchronized (STATE_LOCK) {
            try {
                // Stop any current active recording components safely
                if (audioRecorder != null) {
                    try { 
                        audioRecorder.stop();
                        audioRecorder.release(); 
                    } catch (Exception ignored) {}
                    audioRecorder = null;
                }

                // Hardware audio device stabilization delay
                Thread.sleep(300);

                String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
                String fileName = "AUD_" + timeStamp + ".mp4";
                currentFile = new File(dir, fileName);

                // Initialize utilizing the modern application context factory pattern
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                    audioRecorder = new MediaRecorder(context);
                } else {
                    @SuppressWarnings("deprecation")
                    MediaRecorder legacyRecorder = new MediaRecorder();
                    audioRecorder = legacyRecorder;
                }

                audioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC); 
                audioRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
                audioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                audioRecorder.setOutputFile(currentFile.getAbsolutePath());
                
                audioRecorder.prepare();
                audioRecorder.start();

                Log.i(TAG, "AUDIO RECORDING: Secured in private vault: " + currentFile.getAbsolutePath());
            } catch (Exception e) {
                Log.e(TAG, "AUDIO CAPTURE FAILED (Hardware resource conflict): " + e.getMessage());
                if (audioRecorder != null) {
                    try { audioRecorder.release(); } catch (Exception ignored) {}
                    audioRecorder = null;
                }
                isCapturing = false;
            }
        }
    }

    public static void stopCapture() {
        synchronized (STATE_LOCK) {
            if (!isCapturing) return;
            
            try {
                Log.i(TAG, "BLACK-BOX: Terminating capture sequence...");
                long duration = System.currentTimeMillis() - startTime;
                
                if (audioRecorder != null) {
                    // Prevent hardware runtime crashes caused by stop actions executed too quickly
                    if (duration > 1500) {
                        try { 
                            audioRecorder.stop(); 
                        } catch (Exception e) { 
                            Log.e(TAG, "Media capture framework stop failed: " + e.getMessage()); 
                        }
                    } else {
                        Log.w(TAG, "Capture duration too brief. Hardware frame capture aborted.");
                    }
                    
                    audioRecorder.release();
                    audioRecorder = null;
                    
                    // Finalize Evidence with Integrity Checksum Hash
                    if (currentFile != null && currentFile.exists()) {
                        String hash = calculateSHA256(currentFile);
                        Log.i(TAG, "FORENSIC HASH GENERATED: " + hash);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "BLACK-BOX STOP SEQUENCE EXCEPTION: " + e.getMessage());
            } finally {
                isCapturing = false;
                audioRecorder = null;
                Log.i(TAG, "BLACK-BOX: Mic Released. Grid Restored.");
            }
        }
    }

    /**
     * Generate SHA-256 for Court Evidence Integrity Verification
     */
    public static String calculateSHA256(File file) {
        // Safe execution context utilizing try-with-resources auto-closure patterns
        try (FileInputStream fis = new FileInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] byteArray = new byte[4096]; // Increased buffer block allocation to optimize processing throughput
            int bytesCount;
            
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
            Log.e(TAG, "HASH EXTRACTION FAILURE: " + e.getMessage());
            return null;
        }
    }
}
