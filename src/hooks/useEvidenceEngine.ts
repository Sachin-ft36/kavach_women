/**
 * 🛡️ KAVACH EVIDENCE ENGINE — OPTIMIZED ARCHITECTURE
 *
 * Cloud Strategy (Firebase free tier):
 *   📸 SNAPSHOT → Compressed 320×240 JPEG (~5-8KB) → Firebase Storage → auto-delete in 24hr
 *   🎙️ AUDIO    → Compressed WebM Opus 15s chunks (~60-90KB) → Firebase Storage → auto-delete in 24hr
 *   🎥 VIDEO    → IndexedDB LOCAL ONLY (no cloud cost, no subscription needed)
 *   📋 METADATA → Firestore (free, text only, has expiresAt for cleanup)
 *
 * 24-hour auto-delete: EvidenceGallery checks expiresAt on load and purges expired items.
 */

import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { saveToVault } from '../lib/forensicVault';
import { cryptoService } from '../services/cryptoService';
import { offlineSyncService } from '../services/offlineSyncService';
import {
  generateForensicHash,
  compressSnapshot,
  uploadToCloud,
  saveToLocalBlackbox,
  getSupportedVideoMimeType,
  getSupportedAudioMimeType
} from './utils/evidenceUtils';

const EVIDENCE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_SNAPSHOTS_PER_SOS = 12; // Maximum snapshots uploaded per SOS session
const MAX_AUDIO_LOGS_PER_SOS = 8; // Maximum audio chunks uploaded per SOS session

// ================================================================
export const useEvidenceEngine = () => {
  const { isSOSActive, activeAlertId, user, userPos, isSOSBlocked, triggerMethod } = useKavachStore();

  const mediaStreamRef      = useRef<MediaStream | null>(null);
  const videoElementRef     = useRef<HTMLVideoElement | null>(null);
  const audioRecorderRef    = useRef<MediaRecorder | null>(null);
  const videoRecorderRef    = useRef<MediaRecorder | null>(null);
  const audioChunksRef      = useRef<Blob[]>([]);
  const videoChunksRef      = useRef<Blob[]>([]);

  // Timeouts for dynamic schedules
  const snapshotTimeoutRef  = useRef<any>(null);
  const audioTimeoutRef     = useRef<any>(null);
  const videoIntervalRef    = useRef<any>(null);

  // Session counters
  const snapshotCountRef    = useRef<number>(0);
  const audioCountRef       = useRef<number>(0);

  const isHardwareLocked    = useRef<boolean>(false);
  const effectInstanceIdRef = useRef<number>(0);

  const userPosRef = useRef(userPos);
  useEffect(() => { userPosRef.current = userPos; }, [userPos]);

  useEffect(() => {
    // ℹ️ Disabled for initial Play Store release.
    // Will be re-enabled during government integration.
    return;

    const currentInstanceId = ++effectInstanceIdRef.current;

    const clearAll = () => {
      if (snapshotTimeoutRef.current) { clearTimeout(snapshotTimeoutRef.current); snapshotTimeoutRef.current = null; }
      if (audioTimeoutRef.current)    { clearTimeout(audioTimeoutRef.current);    audioTimeoutRef.current = null; }
      if (videoIntervalRef.current)    { clearInterval(videoIntervalRef.current);    videoIntervalRef.current = null; }
      
      snapshotCountRef.current = 0;
      audioCountRef.current = 0;

      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        try { audioRecorderRef.current.stop(); } catch(e) {}
        audioRecorderRef.current = null;
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        try { videoRecorderRef.current.stop(); } catch(e) {}
        videoRecorderRef.current = null;
      }
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(t => t.stop()); } catch(e) {}
        mediaStreamRef.current = null;
      }
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
        try { if (videoElementRef.current.parentNode) videoElementRef.current.parentNode.removeChild(videoElementRef.current); } catch(e) {}
        videoElementRef.current = null;
      }
      audioChunksRef.current = [];
      videoChunksRef.current = [];
      isHardwareLocked.current = false;
      console.log('🛑 KAVACH: Forensic hardware released.');
    };

    if (isSOSActive && activeAlertId && user && !isSOSBlocked) {
      if (isHardwareLocked.current) return;
      isHardwareLocked.current = true;

      const init = async (retryCount = 0) => {
        try {
          if (retryCount === 0) await new Promise(r => setTimeout(r, triggerMethod === 'voice' ? 3500 : 600));
          if (currentInstanceId !== effectInstanceIdRef.current) return;

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
          });

          if (currentInstanceId !== effectInstanceIdRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
          mediaStreamRef.current = stream;

          // Hidden video element for snapshot captures
          const videoEl = document.createElement('video');
          videoEl.muted = true;
          videoEl.srcObject = stream;
          videoEl.setAttribute('playsinline', 'true');
          videoEl.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;';
          document.body.appendChild(videoEl);
          await videoEl.play();
          videoElementRef.current = videoEl;

          // ─── 🎙️ AUDIO → CLOUD (compressed webm opus, 15s chunks with dynamic schedule) ─────────────
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            const audioMime = getSupportedAudioMimeType();
            const audioRecorder = new MediaRecorder(
              new MediaStream([audioTrack]),
              audioMime ? { mimeType: audioMime } : {}
            );
            audioRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            audioRecorder.onstop = async () => {
              const chunks = [...audioChunksRef.current];
              audioChunksRef.current = [];
              if (chunks.length === 0 || currentInstanceId !== effectInstanceIdRef.current) return;

              const audioBlob = new Blob(chunks, { type: audioMime || 'audio/webm' });
              const timestamp = Date.now();
              const fileName = `aud_${timestamp}.webm`;
              // Hoist variables so catch block can reference them
              let cloudUrl = '';
              let forensicHash = '';
              let digitalSignature = '';

              try {
                forensicHash = await generateForensicHash(audioBlob);
                digitalSignature = await cryptoService.signPayload(forensicHash);
                cloudUrl = await uploadToCloud(audioBlob, `kavach_evidence/${activeAlertId}/${fileName}`);

                const evidenceData = {
                  id: Math.random().toString(36).substring(2, 15),
                  alert_id: activeAlertId,
                  type: 'Audio Log',
                  url: cloudUrl,
                  hash: forensicHash,
                  digital_signature: digitalSignature,
                  metadata: {
                    fileName,
                    sizeBytes: audioBlob.size,
                    coords: userPosRef.current?.lat && userPosRef.current?.lng ? `POINT(${userPosRef.current.lng} ${userPosRef.current.lat})` : null,
                    mode: 'TACTICAL_AUDIO',
                    storage: 'Firebase',
                    compressed: true,
                    expiresAt: timestamp + EVIDENCE_TTL_MS,
                    status: 'Active',
                    victimUid: user.uid
                  },
                  timestamp: new Date().toISOString()
                };

                if (!navigator.onLine) {
                  console.warn('📶 Device offline. Queueing Audio Log to offline sync vault.');
                  await offlineSyncService.queuePayload('EVIDENCE_UPLOAD', evidenceData);
                  audioCountRef.current += 1;
                } else {
                  const { supabase } = await import('../lib/supabase');
                  const { error } = await supabase.from('evidence').insert(evidenceData);
                  if (error) throw error;
                  audioCountRef.current += 1;
                  console.log(`✅ Audio ${audioCountRef.current}/${MAX_AUDIO_LOGS_PER_SOS} uploaded: ${(audioBlob.size / 1024).toFixed(1)}KB`);
                }
              } catch (e) {
                console.error('Audio upload failed, queueing to offline sync vault:', e);
                const fallbackData = {
                  id: Math.random().toString(36).substring(2, 15),
                  alert_id: activeAlertId,
                  type: 'Audio Log',
                  url: cloudUrl,
                  hash: forensicHash,
                  digital_signature: digitalSignature,
                  metadata: {
                    fileName,
                    sizeBytes: audioBlob.size,
                    coords: userPosRef.current?.lat && userPosRef.current?.lng ? `POINT(${userPosRef.current.lng} ${userPosRef.current.lat})` : null,
                    mode: 'TACTICAL_AUDIO',
                    storage: 'Firebase',
                    compressed: true,
                    expiresAt: timestamp + EVIDENCE_TTL_MS,
                    status: 'Active',
                    victimUid: user.uid
                  },
                  timestamp: new Date().toISOString()
                };
                await offlineSyncService.queuePayload('EVIDENCE_UPLOAD', fallbackData);
                audioCountRef.current += 1;
              }
            };
            audioRecorderRef.current = audioRecorder;

            // Adaptive Audio Recording Loop
            const audioRecordingCycle = () => {
              if (currentInstanceId !== effectInstanceIdRef.current || !isSOSActive || !activeAlertId) return;

              // Record a 15-second chunk.
              const recordDuration = 15000;
              // If cap is reached, wait 5 minutes before capturing another chunk. Otherwise, start immediately.
              const pauseDuration = audioCountRef.current >= MAX_AUDIO_LOGS_PER_SOS ? 300000 : 0;

              audioTimeoutRef.current = setTimeout(() => {
                if (currentInstanceId !== effectInstanceIdRef.current) return;
                
                try {
                  audioRecorder.start();
                  
                  // Stop the recorder after 15s to trigger upload
                  audioTimeoutRef.current = setTimeout(() => {
                    if (audioRecorder.state === 'recording') {
                      audioRecorder.stop();
                    }
                    // Loop next cycle
                    audioRecordingCycle();
                  }, recordDuration);

                } catch (err) {
                  console.error('Audio recording cycle error:', err);
                  audioRecordingCycle();
                }
              }, pauseDuration);
            };

            audioRecordingCycle();
          }

          // ─── 🎥 VIDEO → LOCAL INDEXEDDB ONLY (no cloud cost, stays local) ────────────────
          const videoMime = getSupportedVideoMimeType();
          const videoRecorder = new MediaRecorder(
            stream,
            videoMime ? { mimeType: videoMime, videoBitsPerSecond: 300000 } : {}
          );
          videoRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) videoChunksRef.current.push(e.data);
          };
          videoRecorder.onstop = async () => {
            const chunks = [...videoChunksRef.current];
            videoChunksRef.current = [];
            if (chunks.length === 0 || currentInstanceId !== effectInstanceIdRef.current) return;

            const videoBlob = new Blob(chunks, { type: videoMime || 'video/webm' });
            const timestamp = Date.now();
            const fileName = `KAVACH_VIDEO_${timestamp}.webm`;

            try {
              const forensicHash = await generateForensicHash(videoBlob);
              const digitalSignature = await cryptoService.signPayload(forensicHash);
              
              // 💾 Local IndexedDB
              await saveToVault({
                id: `vid_${activeAlertId}_${timestamp}`,
                alertId: activeAlertId,
                type: 'CCTV_FEED',
                blob: videoBlob,
                fileName,
                mimeType: videoMime || 'video/webm',
                hash: forensicHash,
                digitalSignature,
                timestamp,
                status: 'Local'
              });
              
              // 💾 Physical device storage
              if (Capacitor.isNativePlatform()) {
                 await saveToLocalBlackbox(fileName, videoBlob);
                 console.log(`✅ Video saved to phone storage: Documents/KAVACH/Forensics/${fileName}`);
              } else {
                 console.log(`✅ Video saved locally (IndexedDB): ${(videoBlob.size / 1024).toFixed(1)}KB`);
              }
            } catch (e) {
              console.error('Video local save failed:', e);
            }
          };
          videoRecorderRef.current = videoRecorder;
          videoRecorder.start();
          // Local video chunk every 60 seconds (keeps local database size in check)
          videoIntervalRef.current = setInterval(() => {
            if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
              videoRecorderRef.current.stop();
              videoRecorderRef.current.start();
            }
          }, 60000);

          // ─── 📸 SNAPSHOTS → CLOUD (Dynamic / Adaptive Capture Schedule) ──
          const captureSnapshotCycle = async () => {
            if (currentInstanceId !== effectInstanceIdRef.current || !isSOSActive || !activeAlertId) return;

            // Default: every 30 seconds. If cap is exceeded: throttle down to every 5 minutes.
            const nextDelay = snapshotCountRef.current >= MAX_SNAPSHOTS_PER_SOS ? 300000 : 30000;

            snapshotTimeoutRef.current = setTimeout(async () => {
              if (!videoElementRef.current || currentInstanceId !== effectInstanceIdRef.current) {
                captureSnapshotCycle();
                return;
              }

              // Capture frame
              const canvas = document.createElement('canvas');
              canvas.width  = videoElementRef.current.videoWidth  || 640;
              canvas.height = videoElementRef.current.videoHeight || 480;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                captureSnapshotCycle();
                return;
              }
              ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(async (rawBlob) => {
                if (!rawBlob || currentInstanceId !== effectInstanceIdRef.current) {
                  captureSnapshotCycle();
                  return;
                }
                const timestamp = Date.now();
                // Hoist variables so catch block can reference them
                let compressedBlob: Blob = rawBlob;
                let fileName = `snap_${timestamp}.jpg`;
                let cloudUrl = '';
                let forensicHash = '';
                let digitalSignature = '';

                try {
                  // Compress to 320x240, JPEG 0.3 -> ~5-8KB
                  compressedBlob = await compressSnapshot(rawBlob);
                  fileName = `snap_${timestamp}.jpg`;
                  forensicHash = await generateForensicHash(compressedBlob);
                  digitalSignature = await cryptoService.signPayload(forensicHash);

                  // Upload compressed snapshot to Firebase Storage
                  cloudUrl = await uploadToCloud(compressedBlob, `kavach_evidence/${activeAlertId}/${fileName}`);
                  
                  const evidenceData = {
                    id: Math.random().toString(36).substring(2, 15),
                    alert_id: activeAlertId,
                    type: 'Snapshot',
                    url: cloudUrl,
                    hash: forensicHash,
                    digital_signature: digitalSignature,
                    metadata: {
                      fileName,
                      sizeBytes: compressedBlob.size,
                      coords: userPosRef.current?.lat && userPosRef.current?.lng ? `POINT(${userPosRef.current.lng} ${userPosRef.current.lat})` : null,
                      mode: 'SNAPSHOT',
                      storage: 'Firebase',
                      compressed: true,
                      originalSize: rawBlob.size,
                      compressedSize: compressedBlob.size,
                      resolution: '320x240',
                      expiresAt: timestamp + EVIDENCE_TTL_MS,
                      status: 'Active',
                      victimUid: user.uid
                    },
                    timestamp: new Date().toISOString()
                  };

                  if (!navigator.onLine) {
                    console.warn('📶 Device offline. Queueing Snapshot to offline sync vault.');
                    await offlineSyncService.queuePayload('EVIDENCE_UPLOAD', evidenceData);
                    snapshotCountRef.current += 1;
                  } else {
                    const { supabase } = await import('../lib/supabase');
                    const { error } = await supabase.from('evidence').insert(evidenceData);
                    if (error) throw error;
                    snapshotCountRef.current += 1;
                    console.log(`📸 Snapshot ${snapshotCountRef.current}/${MAX_SNAPSHOTS_PER_SOS} uploaded: ${(compressedBlob.size/1024).toFixed(0)}KB`);
                  }
                } catch (e) {
                  console.error('Snapshot upload failed, queueing to offline sync vault:', e);
                  const fallbackData = {
                    id: Math.random().toString(36).substring(2, 15),
                    alert_id: activeAlertId,
                    type: 'Snapshot',
                    url: cloudUrl,
                    hash: forensicHash,
                    digital_signature: digitalSignature,
                    metadata: {
                      fileName,
                      sizeBytes: compressedBlob.size,
                      coords: userPosRef.current?.lat && userPosRef.current?.lng ? `POINT(${userPosRef.current.lng} ${userPosRef.current.lat})` : null,
                      mode: 'SNAPSHOT',
                      storage: 'Firebase',
                      compressed: true,
                      originalSize: rawBlob.size,
                      compressedSize: compressedBlob.size,
                      resolution: '320x240',
                      expiresAt: timestamp + EVIDENCE_TTL_MS,
                      status: 'Active',
                      victimUid: user.uid
                    },
                    timestamp: new Date().toISOString()
                  };
                  await offlineSyncService.queuePayload('EVIDENCE_UPLOAD', fallbackData);
                  snapshotCountRef.current += 1;
                }

                captureSnapshotCycle();
              }, 'image/jpeg', 1.0);
            }, nextDelay);
          };

          captureSnapshotCycle();
          console.log('📸 KAVACH Sentinel active. Cloud: Snapshots (30s) + Audio (60s). Cap active: Snap/Audio will throttle after limit.');

        } catch (error: any) {
          if (currentInstanceId !== effectInstanceIdRef.current) return;
          if (['NotAllowedError', 'PermissionDeniedError', 'NotFoundError'].includes(error.name)) {
            console.warn('🛡️ Camera/Mic denied. Retrying...');
            if (retryCount < 2) setTimeout(() => init(retryCount + 1), 2000);
            else isHardwareLocked.current = false;
          } else {
            console.error('KAVACH Evidence Engine Error:', error);
            isHardwareLocked.current = false;
          }
        }
      };

      init();
    } else {
      clearAll();
    }

    return () => clearAll();
  }, [isSOSActive, activeAlertId, user, isSOSBlocked, triggerMethod]);
};
