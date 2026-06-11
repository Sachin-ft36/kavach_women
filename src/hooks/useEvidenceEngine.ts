/**
 * 🛡️ KAVACH EVIDENCE ENGINE — OPTIMIZED ARCHITECTURE
 *
 * Cloud Strategy (Firebase free tier):
 *   📸 SNAPSHOT → Compressed 320×240 JPEG (~5-8KB) → Firebase Storage → auto-delete in 24hr
 *   🎙️ AUDIO    → Compressed WebM Opus 10s chunks (~40-60KB) → Firebase Storage → auto-delete in 24hr
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
import { Filesystem, Directory } from '@capacitor/filesystem';
import { saveToVault } from '../lib/forensicVault';
import { cryptoService } from '../services/cryptoService';

const EVIDENCE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// --- SHA-256 HASH ---
async function generateForensicHash(data: Blob | string): Promise<string> {
  const msgUint8 = data instanceof Blob
    ? new Uint8Array(await data.arrayBuffer())
    : new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- COMPRESS IMAGE TO 320×240 JPEG (~5-8KB) ---
async function compressSnapshot(rawBlob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(rawBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d')!;
      // Fill black background first
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 320, 240);
      // Letterbox scale
      const scale = Math.min(320 / img.width, 240 / img.height);
      const w = img.width  * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (320 - w) / 2, (240 - h) / 2, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => resolve(b || rawBlob),
        'image/jpeg',
        0.3   // quality 0.3 → ~5-8KB
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(rawBlob); };
    img.src = url;
  });
}

// --- UPLOAD TO CLOUD (Bypass Firebase Storage -> Use Base64 in Firestore) ---
async function uploadToCloud(blob: Blob, path: string): Promise<string> {
  // Since you don't have a Pro plan for Storage, we convert the small compressed
  // audio (~50KB) and images (~8KB) directly into base64 Data URIs. 
  // These will be saved directly inside the Firestore document (which allows up to 1MB).
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      console.warn('Base64 conversion failed');
      resolve('');
    };
    reader.readAsDataURL(blob);
  });
}

// --- NATIVE BLACKBOX (Android/iOS) ---
async function saveToLocalBlackbox(fileName: string, blob: Blob): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    await Filesystem.writeFile({
      path: `KAVACH/Forensics/${fileName}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true
    });
  } catch (e) {
    console.error('Blackbox write failure:', e);
  }
}

// --- BEST SUPPORTED MIME TYPES ---
function getSupportedVideoMimeType(): string {
  const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

function getSupportedAudioMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

// ================================================================
export const useEvidenceEngine = () => {
  const { isSOSActive, activeAlertId, user, userPos, isSOSBlocked, triggerMethod } = useKavachStore();

  const mediaStreamRef      = useRef<MediaStream | null>(null);
  const videoElementRef     = useRef<HTMLVideoElement | null>(null);
  const audioRecorderRef    = useRef<MediaRecorder | null>(null);
  const videoRecorderRef    = useRef<MediaRecorder | null>(null);
  const audioChunksRef      = useRef<Blob[]>([]);
  const videoChunksRef      = useRef<Blob[]>([]);
  const snapshotIntervalRef = useRef<any>(null);
  const audioIntervalRef    = useRef<any>(null);
  const videoIntervalRef    = useRef<any>(null);
  const isHardwareLocked    = useRef<boolean>(false);
  const effectInstanceIdRef = useRef<number>(0);

  const userPosRef = useRef(userPos);
  useEffect(() => { userPosRef.current = userPos; }, [userPos]);

  useEffect(() => {
    const currentInstanceId = ++effectInstanceIdRef.current;

    const clearAll = () => {
      if (snapshotIntervalRef.current) { clearInterval(snapshotIntervalRef.current); snapshotIntervalRef.current = null; }
      if (audioIntervalRef.current)    { clearInterval(audioIntervalRef.current);    audioIntervalRef.current = null; }
      if (videoIntervalRef.current)    { clearInterval(videoIntervalRef.current);    videoIntervalRef.current = null; }
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
        // Remove from DOM if appended
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

          // ─── 🎙️ AUDIO → CLOUD (compressed webm opus, 10s chunks) ─────────────
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

              try {
                const forensicHash = await generateForensicHash(audioBlob);
                const digitalSignature = await cryptoService.signPayload(forensicHash);
                
                // ☁️ Upload to Firebase Storage (compressed audio ~40-60KB)
                const cloudUrl = await uploadToCloud(audioBlob, `kavach_evidence/${activeAlertId}/${fileName}`);

                await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                  alert_id: activeAlertId,
                  type: 'Audio Log',
                  url: cloudUrl,
                  fileName,
                  hash: forensicHash,
                  digitalSignature,
                  sizeBytes: audioBlob.size,
                  coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                  metadata: { mode: 'TACTICAL_AUDIO', storage: 'Firebase', compressed: true },
                  timestamp: serverTimestamp(),
                  expiresAt: timestamp + EVIDENCE_TTL_MS,  // 24hr auto-delete marker
                  status: 'Active',
                  victimUid: user.uid
                });
                console.log(`✅ Audio uploaded: ${(audioBlob.size / 1024).toFixed(1)}KB`);
              } catch (e) {
                console.error('Audio upload failed:', e);
              }
            };
            audioRecorderRef.current = audioRecorder;
            audioRecorder.start();
            // New 10-second chunk every 10 seconds
            audioIntervalRef.current = setInterval(() => {
              if (audioRecorderRef.current && audioRecorderRef.current.state === 'recording') {
                audioRecorderRef.current.stop();
                audioRecorderRef.current.start();
              }
            }, 10000);
          }

          // ─── 🎥 VIDEO → LOCAL INDEXEDDB ONLY (no cloud cost) ────────────────
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
              
              // 💾 1. Local IndexedDB (for browser Command Center playback)
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
              
              // 💾 2. Physical device storage (for Native Android/iOS Phone App)
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
          // New 30-second chunk for video (bigger, stays local)
          videoIntervalRef.current = setInterval(() => {
            if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
              videoRecorderRef.current.stop();
              videoRecorderRef.current.start();
            }
          }, 30000);

          // ─── 📸 SNAPSHOTS → CLOUD (compressed 320×240 JPEG ~5-8KB every 7s) ──
          snapshotIntervalRef.current = setInterval(async () => {
            if (!videoElementRef.current || currentInstanceId !== effectInstanceIdRef.current) return;

            // Capture raw frame
            const canvas = document.createElement('canvas');
            canvas.width  = videoElementRef.current.videoWidth  || 640;
            canvas.height = videoElementRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (rawBlob) => {
              if (!rawBlob || currentInstanceId !== effectInstanceIdRef.current) return;
              const timestamp = Date.now();

              try {
                // 🗜️ Compress to 320×240, JPEG quality 0.3 → ~5-8KB
                const compressedBlob = await compressSnapshot(rawBlob);
                const fileName = `snap_${timestamp}.jpg`;
                const forensicHash = await generateForensicHash(compressedBlob);
                const digitalSignature = await cryptoService.signPayload(forensicHash);

                // ☁️ Upload compressed snapshot to Firebase Storage
                const cloudUrl = await uploadToCloud(compressedBlob, `kavach_evidence/${activeAlertId}/${fileName}`);

                await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                  alert_id: activeAlertId,
                  type: 'Snapshot',
                  url: cloudUrl,
                  fileName,
                  hash: forensicHash,
                  digitalSignature,
                  sizeBytes: compressedBlob.size,
                  coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                  metadata: {
                    mode: 'SNAPSHOT',
                    storage: 'Firebase',
                    compressed: true,
                    originalSize: rawBlob.size,
                    compressedSize: compressedBlob.size,
                    resolution: '320x240'
                  },
                  timestamp: serverTimestamp(),
                  expiresAt: timestamp + EVIDENCE_TTL_MS,  // 24hr auto-delete marker
                  status: 'Active',
                  victimUid: user.uid
                });
                console.log(`📸 Snapshot: ${(rawBlob.size/1024).toFixed(0)}KB → ${(compressedBlob.size/1024).toFixed(0)}KB (${((1-(compressedBlob.size/rawBlob.size))*100).toFixed(0)}% smaller)`);
              } catch (e) {
                console.error('Snapshot upload failed:', e);
              }
            }, 'image/jpeg', 1.0); // Capture raw first, compress via canvas in compressSnapshot()
          }, 7000); // Every 7 seconds

          console.log('📸 KAVACH Sentinel active. Cloud: Snapshots + Audio (compressed, 24hr TTL). Local: Video (IndexedDB).');

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
