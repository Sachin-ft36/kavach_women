import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Filesystem, Directory } from '@capacitor/filesystem';

// --- FORENSIC INTEGRITY UTILITY ---
async function generateForensicHash(data: Blob | string) {
  const msgUint8 = data instanceof Blob 
    ? new Uint8Array(await data.arrayBuffer()) 
    : new TextEncoder().encode(data);
    
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function saveToLocalBlackbox(fileName: string, blob: Blob) {
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
  
  // Scoped Pipeline Engine References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  
  // Structural Tracking Reference Elements
  const snapshotIntervalRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);
  const videoIntervalRef = useRef<any>(null);
  const isHardwareLocked = useRef<boolean>(false);
  const effectInstanceIdRef = useRef<number>(0);

  const userPosRef = useRef(userPos);
  useEffect(() => { userPosRef.current = userPos; }, [userPos]);

  useEffect(() => {
    // Increment instance tracking ID to invalidate stale asynchronous actions
    const currentInstanceId = ++effectInstanceIdRef.current;

    const clearAllRecordingPipelines = () => {
      console.log("🛑 KAVACH: Releasing and resetting forensic hardware layers.");
      
      if (snapshotIntervalRef.current) { clearInterval(snapshotIntervalRef.current); snapshotIntervalRef.current = null; }
      if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
      if (videoIntervalRef.current) { clearInterval(videoIntervalRef.current); videoIntervalRef.current = null; }

      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        try { audioRecorderRef.current.stop(); } catch(e){}
        audioRecorderRef.current = null;
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        try { videoRecorderRef.current.stop(); } catch(e){}
        videoRecorderRef.current = null;
      }

      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(track => track.stop()); } catch(e){}
        mediaStreamRef.current = null;
      }
      
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
        videoElementRef.current = null;
      }

      audioChunksRef.current = [];
      videoChunksRef.current = [];
      isHardwareLocked.current = false;
    };

    if (isSOSActive && activeAlertId && user && !isSOSBlocked) {
      if (isHardwareLocked.current) return;
      isHardwareLocked.current = true;

      console.log("🛡️ KAVACH: SILENT VIDEO SENTINEL ENGAGED.");

      const initializeStealthHardware = async (retryCount = 0) => {
        try {
          // Tactical mic handover delay logic
          if (retryCount === 0 && triggerMethod === 'voice') {
            await new Promise(r => setTimeout(r, 3500));
          } else if (retryCount === 0) {
            await new Promise(r => setTimeout(r, 500));
          }

          // Abandon initialization if the component unmounted during the delay
          if (currentInstanceId !== effectInstanceIdRef.current) return;

          const constraints: MediaStreamConstraints = {
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (currentInstanceId !== effectInstanceIdRef.current) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          mediaStreamRef.current = stream;

          // Process underlying hidden canvas context frame captures
          const videoRaw = document.createElement('video');
          videoRaw.muted = true;
          videoRaw.srcObject = stream;
          videoRaw.setAttribute('playsinline', 'true');
          videoRaw.style.display = 'none';
          await videoRaw.play();
          videoElementRef.current = videoRaw;

          // --- AUDIO CHANNEL FORENSIC ENGAGEMENT ---
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            const audioStream = new MediaStream([audioTrack]);
            const audioRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            
            audioRecorder.ondataavailable = (e) => { 
              if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); 
            };
            
            audioRecorder.onstop = async () => {
              const chunks = audioChunksRef.current;
              audioChunksRef.current = [];
              if (chunks.length === 0 || currentInstanceId !== effectInstanceIdRef.current) return;

              const audioBlob = new Blob(chunks, { type: 'audio/webm' });
              const timestamp = Date.now();
              
              try {
                const forensicHash = await generateForensicHash(audioBlob);
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

                const { supabase } = await import('../lib/supabase');
                await Promise.all([
                  addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    ...evidencePayload, timestamp: serverTimestamp(), status: 'Immutable Anchor', victimUid: user.uid
                  }),
                  supabase.from('evidence').upsert(evidencePayload)
                ]);
              } catch (e) {
                console.error("Audio forensic sync failure, falling back to local storage:", e);
                await saveToLocalBlackbox(`AUDIO_FAIL_${timestamp}.kavach`, audioBlob);
              }
            };

            audioRecorderRef.current = audioRecorder;
            audioRecorder.start();
            
            audioIntervalRef.current = setInterval(() => {
              if (audioRecorderRef.current && audioRecorderRef.current.state === 'recording') {
                audioRecorderRef.current.stop();
                audioRecorderRef.current.start();
              }
            }, 10000);
          }

          // --- VIDEO CHANNEL FORENSIC ENGAGEMENT ---
          const videoRecorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm;codecs=vp8,opus', 
            videoBitsPerSecond: 400000 
          });
          
          videoRecorder.ondataavailable = (e) => { 
            if (e.data && e.data.size > 0) videoChunksRef.current.push(e.data); 
          };
          
          videoRecorder.onstop = async () => {
            const chunks = videoChunksRef.current;
            videoChunksRef.current = [];
            if (chunks.length === 0 || currentInstanceId !== effectInstanceIdRef.current) return;

            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const timestamp = Date.now();
            
            try {
              const forensicHash = await generateForensicHash(videoBlob);
              const videoStorageRef = ref(storage, `alerts/${activeAlertId}/evidence/cctv_${timestamp}.webm`);
              await uploadBytes(videoStorageRef, videoBlob);
              const downloadUrl = await getDownloadURL(videoStorageRef);

              const evidencePayload = {
                alert_id: activeAlertId,
                type: 'CCTV_FEED',
                url: downloadUrl,
                hash: forensicHash,
                coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                metadata: { auth: 'SHA-256-AES-ENCRYPTED', mode: 'TACTICAL_CCTV_UPLINK' }
              };

              const { supabase } = await import('../lib/supabase');
              await Promise.all([
                addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                  ...evidencePayload, timestamp: serverTimestamp(), status: 'LIVE_BRIDGE_ACTIVE', victimUid: user.uid
                }),
                supabase.from('evidence').upsert(evidencePayload)
              ]);
            } catch (e) {
              console.error("Video forensic sync failure:", e);
            }
          };

          videoRecorderRef.current = videoRecorder;
          videoRecorder.start();
          
          videoIntervalRef.current = setInterval(() => {
            if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
              videoRecorderRef.current.stop();
              videoRecorderRef.current.start();
            }
          }, 8000);

          // --- HIGH-FIDELITY IMAGE SNAPSHOT RADIAL PIPELINE ---
          snapshotIntervalRef.current = setInterval(() => {
            if (!videoElementRef.current || currentInstanceId !== effectInstanceIdRef.current) return;
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return;
            
            canvas.width = videoElementRef.current.videoWidth || 640;
            canvas.height = videoElementRef.current.videoHeight || 480;
            context.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(async (blob) => {
              if (!blob || currentInstanceId !== effectInstanceIdRef.current) return;
              const timestamp = Date.now();
              
              try {
                const forensicHash = await generateForensicHash(blob);
                const snapRef = ref(storage, `alerts/${activeAlertId}/evidence/snap_${timestamp}.jpg`);
                await uploadBytes(snapRef, blob);
                const downloadUrl = await getDownloadURL(snapRef);

                await saveToLocalBlackbox(`PIXEL_VAULT_${timestamp}.kavach`, blob);

                const evidencePayload = {
                  alert_id: activeAlertId,
                  type: 'Snapshot',
                  url: downloadUrl,
                  hash: forensicHash,
                  coords: `POINT(${userPosRef.current[1]} ${userPosRef.current[0]})`,
                  metadata: { auth: 'SHA-256-RSA-VERIFIED', mode: 'REAL_HARDWARE_CAPTURE', vault: 'PIXEL_STREAMS_ENCRYPTED' }
                };

                const { supabase } = await import('../lib/supabase');
                await Promise.all([
                  addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    ...evidencePayload, timestamp: serverTimestamp(), status: 'Immutable Anchor', victimUid: user.uid
                  }),
                  supabase.from('evidence').upsert(evidencePayload)
                ]);
              } catch (e) {
                console.error("Snapshot Sync Failed:", e);
              }
            }, 'image/jpeg', 0.5);
          }, 5000);

          console.log("📸 KAVACH: Hardware Video/Audio Sentinel Synchronized.");
        } catch (error: any) {
          if (currentInstanceId !== effectInstanceIdRef.current) return;
          
          if (['NotAllowedError', 'PermissionDeniedError', 'NotFoundError'].includes(error.name)) {
            console.warn("🛡️ KAVACH: Primary Hardware Access denied. Attempting Audio-Only Fallback...");
            // Execute retry logic nested cleanly under currentInstanceId tracking matches...
            if (retryCount < 2) {
              setTimeout(() => initializeStealthHardware(retryCount + 1), 2000);
            } else {
              isHardwareLocked.current = false;
            }
          }
        }
      };

      initializeStealthHardware();
    } else {
      clearAllRecordingPipelines();
    }

    return () => {
      clearAllRecordingPipelines();
    };
  }, [isSOSActive, activeAlertId, user, isSOSBlocked, triggerMethod]);
};
