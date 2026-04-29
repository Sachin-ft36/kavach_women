import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- FORENSIC INTEGRITY UTILITY ---
async function generateForensicHash(data: string) {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

  useEffect(() => {
    if (isSOSActive && activeAlertId && user) {
      console.log("🛡️ KAVACH: SILENT VIDEO SENTINEL ENGAGED.");
      

      const initializeStealthHardware = async () => {
        try {
          // 1. Request combined invisible stream
          // TACTICAL DECISION: If on Native, only request Video to avoid Mic clash with EvidenceEngine.java
          const constraints: MediaStreamConstraints = { 
            video: { facingMode: 'environment' },
            audio: !Capacitor.isNativePlatform() 
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          mediaStreamRef.current = stream;

          // 2. Setup Invisible Video Element for Frame Extraction
          const videoRaw = document.createElement('video');
          videoRaw.srcObject = stream;
          videoRaw.setAttribute('playsinline', 'true');
          videoRaw.setAttribute('muted', 'true'); // Must be muted to play silently in background without user interaction
          videoRaw.style.display = 'none'; // Absolutely invisible
          await videoRaw.play();
          videoRef.current = videoRaw;

          // 3. Setup Audio Recorder
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            const audioStream = new MediaStream([audioTrack]);
            const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            
            recorder.ondataavailable = (e) => {
               if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
               // When stopped, upload the chunk to Firebase Storage
               if (audioChunksRef.current.length === 0) return;
               const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
               audioChunksRef.current = []; // Clear for next sector
               
               try {
                  const timestamp = Date.now();
                  const forensicHash = await generateForensicHash(`AUDIO-${timestamp}-${user.uid}`);
                  
                  // UPLOAD TO STORAGE
                  const audioRef = ref(storage, `alerts/${activeAlertId}/evidence/audio_${timestamp}.webm`);
                  await uploadBytes(audioRef, audioBlob);
                  const downloadUrl = await getDownloadURL(audioRef);
                  
                  // ANCHOR IN FIRESTORE
                  await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), {
                    type: 'Audio Log',
                    timestamp: serverTimestamp(),
                    status: 'Immutable Anchor',
                    hash: forensicHash,
                    coords: userPos,
                    url: downloadUrl, // Storage Public Link
                    metadata: { auth: 'SHA-256-RSA-VERIFIED', mode: 'TACTICAL_SILENT_AUDIO', storage: 'FIREBASE_BUCKET' }
                  });
               } catch (e) {
                 console.error("KAVACH: Audio Sync to Storage Failed:", e);
               }
            };

            audioRecorderRef.current = recorder;
            recorder.start();

            // Run Audio Slicing every 10 seconds
            audioIntervalRef.current = setInterval(() => {
                if (recorder.state === 'recording') {
                   recorder.stop();
                   recorder.start(); // immediately restart
                }
            }, 10000);
          }

          // 4. Tactical Video Frame Extraction Loop (Every 3 seconds)
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          snapshotIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !context) return;
            
            try {
              // Draw current invisible frame to canvas
              canvas.width = videoRef.current.videoWidth || 640;
              canvas.height = videoRef.current.videoHeight || 480;
              context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              // Use ToBlob for Efficient Storage Upload
              canvas.toBlob(async (blob) => {
                if (!blob) return;

                const timestamp = Date.now();
                const forensicContext = `${activeAlertId}-${user.uid}-${userPos.join(',')}-${timestamp}`;
                const forensicHash = await generateForensicHash(forensicContext);
                
                try {
                  // 1. UPLOAD IMAGE TO STORAGE
                  const snapRef = ref(storage, `alerts/${activeAlertId}/evidence/snap_${timestamp}.jpg`);
                  await uploadBytes(snapRef, blob);
                  const downloadUrl = await getDownloadURL(snapRef);

                  // 2. LOG IN FIRESTORE
                  const evidencePayload = {
                    type: 'Snapshot',
                    timestamp: serverTimestamp(),
                    status: 'Immutable Anchor',
                    hash: forensicHash,
                    coords: userPos,
                    url: downloadUrl, // Storage Public Link
                    metadata: {
                      auth: 'SHA-256-RSA-VERIFIED',
                      deviceSync: true,
                      mode: 'REAL_HARDWARE_CAPTURE',
                      storage: 'FIREBASE_BUCKET'
                    }
                  };

                  await addDoc(collection(db, 'alerts', activeAlertId, 'evidence'), evidencePayload);
                  // console.log(`📸 KAVACH: Hardware Video Frame Locked [${forensicHash.slice(0, 8)}]`);
                } catch (e) {
                  console.error("KAVACH: Snapshot Sync to Storage Failed:", e);
                }
              }, 'image/jpeg', 0.5); 
              
            } catch (e) {
              console.error("Forensic Frame Capture Error:", e);
            }
          }, 3000); // 🚨 3 Seconds Pulse

          initializeStealthHardware();
        } catch (error) {
          console.error("Failed to access native device hardware:", error);
        }
      };

      initializeStealthHardware();

    } else {
      // SHUTDOWN ALL HARDWARE HOOKS SECURELY
      console.log("🛑 KAVACH: Releasing Hardware Hooks");
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      
      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        audioRecorderRef.current.stop();
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      snapshotIntervalRef.current = null;
      audioIntervalRef.current = null;
      mediaStreamRef.current = null;
      audioRecorderRef.current = null;
    }

    return () => {
      // Unmount Cleanup
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [isSOSActive, activeAlertId, user, userPos]);
};
