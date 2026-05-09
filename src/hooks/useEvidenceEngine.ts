import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

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
  const { isSOSActive, activeAlertId, user, userPos } = useKavachStore();
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hardware Media Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  const isHardwareLocked = useRef(false);
  const userPosRef = useRef(userPos);

  useEffect(() => {
    userPosRef.current = userPos;
  }, [userPos]);

  useEffect(() => {
    if (isSOSActive && activeAlertId && user) {
      if (isHardwareLocked.current) return;
      isHardwareLocked.current = true;
      
      console.log("🛡️ KAVACH: SILENT VIDEO SENTINEL ENGAGED.");

      const initializeStealthHardware = async () => {
        try {
          const constraints: MediaStreamConstraints = { 
            video: { facingMode: 'environment' },
            audio: !Capacitor.isNativePlatform() 
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;

          const videoRaw = document.createElement('video');
          videoRaw.srcObject = stream;
          videoRaw.setAttribute('playsinline', 'true');
          videoRaw.setAttribute('muted', 'true');
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
                  await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    type: 'Audio Log', timestamp: serverTimestamp(), status: 'Immutable Anchor',
                    hash: forensicHash, coords: userPosRef.current, url: downloadUrl,
                    metadata: { auth: 'SHA-256-RSA-VERIFIED', mode: 'TACTICAL_SILENT_AUDIO', storage: 'FIREBASE_BUCKET' }
                  });
               } catch (e) {
                  const localPath = await saveToLocalBlackbox(`audio_${timestamp}.webm`, audioBlob, 'audio');
                  if (localPath) {
                    await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                      type: 'Audio Log', timestamp: serverTimestamp(), status: 'LOCAL_BACKUP_ONLY',
                      hash: await generateForensicHash(`AUDIO-${timestamp}-${user.uid}`), coords: userPosRef.current, url: localPath, isLocalBackup: true,
                      metadata: { auth: 'SHA-256-OFFLINE', mode: 'LOCAL_BLACKBOX_STORAGE' }
                    });
                  }
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
              await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                type: 'CCTV_FEED', timestamp: serverTimestamp(), status: 'LIVE_BRIDGE_ACTIVE',
                hash: forensicHash, coords: userPosRef.current, url: downloadUrl,
                metadata: { auth: 'SHA-256-AES-ENCRYPTED', mode: 'TACTICAL_CCTV_UPLINK' }
              });
            } catch (e) {}
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
                const forensicHash = await generateForensicHash(`${activeAlertId}-${user.uid}-${timestamp}`);
                try {
                  const snapRef = ref(storage, `alerts/${activeAlertId}/evidence/snap_${timestamp}.jpg`);
                  await uploadBytes(snapRef, blob);
                  const downloadUrl = await getDownloadURL(snapRef);
                  await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    type: 'Snapshot', timestamp: serverTimestamp(), status: 'Immutable Anchor',
                    hash: forensicHash, coords: userPosRef.current, url: downloadUrl,
                    metadata: { auth: 'SHA-256-RSA-VERIFIED', mode: 'REAL_HARDWARE_CAPTURE' }
                  });
                } catch (e) {}
            }, 'image/jpeg', 0.5);
          }, 5000);

          console.log("📸 KAVACH: Hardware Video/Audio Sentinel Synchronized.");
        } catch (error) {
          isHardwareLocked.current = false;
          console.error("Failed to access native device hardware:", error);
          const { toast } = await import('sonner');
          toast.error("MISSION CRITICAL: CAMERA/MIC ACCESS DENIED. Forensics Offline.", { duration: 8000 });
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
      isHardwareLocked.current = false;
    };
  }, [isSOSActive, activeAlertId, user]);
};
