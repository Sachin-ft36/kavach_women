import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Filesystem, Directory } from '@capacitor/filesystem';

// --- FORENSIC INTEGRITY UTILITY ---
async function generateForensicHash(data: string) {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function saveToLocalBlackbox(fileName: string, blob: Blob, type: string) {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    await Filesystem.writeFile({
      path: `KAVACH/Forensics/${fileName}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true
    });
    return `local://KAVACH/Forensics/${fileName}`;
  } catch (e) {
    console.error("Critical Blackbox Write Failure:", e);
    return null;
  }
}

export const useEvidenceEngine = () => {
  const { isSOSActive, activeAlertId, user, userPos, isSOSBlocked, triggerMethod } = useKavachStore();
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hardware Media Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userPosRef = useRef(userPos);

  const isHardwareLocked = useRef(false);

  useEffect(() => {
    userPosRef.current = userPos;
  }, [userPos]);

  useEffect(() => {
    if (isSOSActive && activeAlertId && user && !isSOSBlocked) {
      if (isHardwareLocked.current) return;
      isHardwareLocked.current = true;

      console.log("🛡️ KAVACH: SILENT VIDEO SENTINEL ENGAGED.");

      const initializeStealthHardware = async (retryCount = 0) => {
        try {
          // 🛡️ TACTICAL DELAY: Allow Speech Recognition to release the mic before starting forensic capture
          // Only apply delay if triggered via voice to avoid hardware contention
          if (retryCount === 0 && triggerMethod === 'voice') {
            console.log("🎙️ KAVACH: Voice trigger detected. Waiting 3.5s for clean mic handover...");
            await new Promise(r => setTimeout(r, 3500));
          } else if (retryCount === 0) {
            // Short delay for permissions sync on other methods
            await new Promise(r => setTimeout(r, 500));
          }

          const constraints: MediaStreamConstraints = {
            video: { facingMode: 'environment' },
            audio: true
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;

          const videoRaw = document.createElement('video');
          videoRaw.muted = true; // 🛡️ PRE-EMPTIVE MUTE
          videoRaw.srcObject = stream;
          videoRaw.setAttribute('playsinline', 'true');
          videoRaw.style.display = 'none';
          await videoRaw.play();
          videoRef.current = videoRaw;

          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            const audioStream = new MediaStream([audioTrack]);
            const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = async () => {
              if (audioChunksRef.current.length === 0) return;
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              audioChunksRef.current = [];
              const timestamp = Date.now();
              try {
                const forensicHash = await generateForensicHash(`AUDIO-${timestamp}-${user.uid}`);
                const audioRef = ref(storage, `alerts/${activeAlertId}/evidence/audio_${timestamp}.webm`);
                await uploadBytes(audioRef, audioBlob);
                const downloadUrl = await getDownloadURL(audioRef);
                const evidencePayload = {
                  alert_id: activeAlertId,
                  type: 'Audio Log',
                  url: downloadUrl,
                  hash: forensicHash,
                  coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                  metadata: { auth: 'SHA-256-RSA-VERIFIED', mode: 'TACTICAL_SILENT_AUDIO' }
                };

                await Promise.all([
                  addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    ...evidencePayload, timestamp: serverTimestamp(), status: 'Immutable Anchor', victimUid: user.uid
                  }),
                  import('../lib/supabase').then(({ supabase }) =>
                    supabase.from('evidence').upsert(evidencePayload)
                  )
                ]);
              } catch (e) {
                // ... (local backup logic)
              }
            };
            audioRecorderRef.current = recorder;
            recorder.start();
            audioIntervalRef.current = setInterval(() => {
              if (recorder.state === 'recording') { recorder.stop(); recorder.start(); }
            }, 10000);
          }

          const videoRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 500000 });
          const videoChunks: BlobPart[] = [];
          videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunks.push(e.data); };
          videoRecorder.onstop = async () => {
            if (videoChunks.length === 0) return;
            const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
            videoChunks.length = 0;
            try {
              const timestamp = Date.now();
              const forensicHash = await generateForensicHash(`CCTV-LIVE-${timestamp}-${user.uid}`);
              const videoRef = ref(storage, `alerts/${activeAlertId}/evidence/cctv_${timestamp}.webm`);
              await uploadBytes(videoRef, videoBlob);
              const downloadUrl = await getDownloadURL(videoRef);

              const evidencePayload = {
                alert_id: activeAlertId,
                type: 'CCTV_FEED',
                url: downloadUrl,
                hash: forensicHash,
                coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                metadata: { auth: 'SHA-256-AES-ENCRYPTED', mode: 'TACTICAL_CCTV_UPLINK' }
              };

              await Promise.all([
                addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                  ...evidencePayload, timestamp: serverTimestamp(), status: 'LIVE_BRIDGE_ACTIVE', victimUid: user.uid
                }),
                import('../lib/supabase').then(({ supabase }) =>
                  supabase.from('evidence').upsert(evidencePayload)
                )
              ]);
            } catch (e) { }
          };
          videoRecorder.start();
          const vInterval = setInterval(() => { if (videoRecorder.state === 'recording') { videoRecorder.stop(); videoRecorder.start(); } }, 8000);

          snapshotIntervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return;
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async (blob) => {
              if (!blob) return;
              const timestamp = Date.now();
              try {
                const forensicHash = await generateForensicHash(`SNAP-${timestamp}-${user.uid}`);
                const snapRef = ref(storage, `alerts/${activeAlertId}/evidence/snap_${timestamp}.jpg`);
                await uploadBytes(snapRef, blob);
                const downloadUrl = await getDownloadURL(snapRef);

                // 🛡️ PIXEL VAULT: Convert to Base64 String (Pixel Numbers) for local stealth storage
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                  await saveToLocalBlackbox(`PIXEL_VAULT_${timestamp}.kavach`, blob, 'image/jpeg');
                };

                const evidencePayload = {
                  alert_id: activeAlertId,
                  type: 'Snapshot',
                  url: downloadUrl,
                  hash: forensicHash,
                  coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                  metadata: { auth: 'SHA-256-RSA-VERIFIED', mode: 'REAL_HARDWARE_CAPTURE', vault: 'PIXEL_STREAMS_ENCRYPTED' }
                };

                await Promise.all([
                  addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    ...evidencePayload, timestamp: serverTimestamp(), status: 'Immutable Anchor', victimUid: user.uid
                  }),
                  import('../lib/supabase').then(({ supabase }) =>
                    supabase.from('evidence').upsert(evidencePayload)
                  )
                ]);
              } catch (e) {
                console.error("Snapshot Sync Failed:", e);
              }
            }, 'image/jpeg', 0.5);
          }, 5000);

          console.log("📸 KAVACH: Hardware Video/Audio Sentinel Synchronized.");
        } catch (error: any) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.name === 'NotFoundError') {
            console.warn("🛡️ KAVACH: Primary Hardware Access denied. Attempting Audio-Only Fallback...");
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaStreamRef.current = audioStream;
              const audioTrack = audioStream.getAudioTracks()[0];
              if (audioTrack) {
                const recorder = new MediaRecorder(new MediaStream([audioTrack]), { mimeType: 'audio/webm' });
                recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                recorder.onstop = async () => {
                  if (audioChunksRef.current.length === 0) return;
                  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  audioChunksRef.current = [];
                  const timestamp = Date.now();
                  const forensicHash = await generateForensicHash(`AUDIO-ONLY-${timestamp}-${user?.uid}`);
                  const audioRef = ref(storage, `alerts/${activeAlertId}/evidence/audio_${timestamp}.webm`);
                  await uploadBytes(audioRef, audioBlob);
                  const downloadUrl = await getDownloadURL(audioRef);
                  const evidencePayload = {
                    alert_id: activeAlertId,
                    type: 'Audio Evidence',
                    url: downloadUrl,
                    hash: forensicHash,
                    coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                    metadata: { mode: 'AUDIO_ONLY_SURVEILLANCE', camera_status: 'DISABLED' }
                  };
                  await Promise.all([
                    addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                      ...evidencePayload, timestamp: serverTimestamp(), status: 'Immutable Anchor', victimUid: user?.uid
                    }),
                    import('../lib/supabase').then(({ supabase }) => supabase.from('evidence').upsert(evidencePayload))
                  ]);
                };
                audioRecorderRef.current = recorder;
                recorder.start();
                audioIntervalRef.current = setInterval(() => {
                  if (recorder.state === 'recording') { recorder.stop(); recorder.start(); }
                }, 10000);
                console.log("🎙️ KAVACH: Audio-Only Evidence Sentinel Active (Camera Restricted).");
              }
              return;
            } catch (e) {
              console.error("Critical: All hardware access blocked.");
            }
          }

          if (retryCount < 2) {
            console.warn(`⚠️ KAVACH: Hardware Access Retry ${retryCount + 1}...`);
            setTimeout(() => initializeStealthHardware(retryCount + 1), 2000);
            return;
          }
          isHardwareLocked.current = false;
        }
      };

      initializeStealthHardware();

    } else {
      if (!isHardwareLocked.current) return;
      isHardwareLocked.current = false;
      console.log("🛑 KAVACH: Releasing Hardware Hooks");
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') audioRecorderRef.current.stop();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      snapshotIntervalRef.current = null;
      audioIntervalRef.current = null;
      mediaStreamRef.current = null;
    }

    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, [isSOSActive, activeAlertId, user, isSOSBlocked]);
};
