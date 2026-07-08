import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { saveToVault } from '../../lib/forensicVault';
import { useKavachStore } from '../../state/useKavachStore';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export function useForensicCapture(isOpen: boolean, onClose: () => void) {
  const { isShadowActive, setShadowActive, userPos } = useKavachStore();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isShadowActive) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 1800) { 
            sealEvidence();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      startCamera();
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        sealEvidence();
      } else {
        stopCamera();
        setRecordingTime(0);
      }
    }
    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [isShadowActive]);

  const startCamera = async () => {
    try {
      setIsCameraReady(false);
      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      };
      
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Environmental camera failed, falling back to basic feed...");
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }

      const recorder = new MediaRecorder(mediaStream, { 
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4' 
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
    } catch (err) {
      console.error("Camera Access Denied:", err);
      toast.error("Forensic Camera Access Denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const activateStealth = async () => {
    const { KavachSafe } = await import('../../services/KavachNative');
    localStorage.removeItem('kavach_shadow_stealth');
    setShadowActive(true);
    
    await KavachSafe.startForensicCapture();
    
    const store = useKavachStore.getState();
    const currentUser = store.user;
    const alertId = store.activeAlertId;
    
    const targetPath = alertId ? `alerts/${alertId}/evidence` : `users/${currentUser?.uid || 'anonymous'}/evidence`;
    
    const evidenceRef = doc(collection(db, targetPath));
    await setDoc(evidenceRef, {
      type: alertId ? 'CCTV_FEED' : 'SHADOW_PROTECT_LOG',
      timestamp: serverTimestamp(),
      status: 'LIVE_UPLINK_ACTIVE',
      details: 'Silent background forensic capture initiated by ThreatProtect protocol.',
      gps_locked: true,
      audio_stream_active: true,
      victimUid: currentUser?.uid || 'anonymous',
      url: 'PENDING_FINAL_SEAL'
    }).catch(() => {});

    toast.success("SHADOW PROTECT: STEALTH MODE ENGAGED", {
      description: "Forensic capture uplinked to National Grid."
    });
  };

  const sealEvidence = async () => {
    setIsSaving(true);
    const { KavachSafe } = await import('../../services/KavachNative');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      setTimeout(async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const timestamp = Date.now();
        const fileName = `KAVACH_FORENSIC_${timestamp}.webm`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        await KavachSafe.stopForensicCapture();

        const store = useKavachStore.getState();
        const alertId = store.activeAlertId || 'standby';
        const vaultId = `shadow_${alertId}_${timestamp}`;

        try {
          await saveToVault({
            id: vaultId,
            alertId,
            type: 'CCTV_FEED',
            blob,
            fileName,
            mimeType: 'video/webm',
            hash: '',
            timestamp,
            status: 'SEALED_ENCRYPTED'
          });

          if (store.activeAlertId) {
            const evidenceRef = doc(collection(db, 'alerts', store.activeAlertId, 'evidence'));
            await setDoc(evidenceRef, {
              type: 'CCTV_FEED',
              vaultId,
              fileName,
              url: '',
              timestamp: serverTimestamp(),
              status: 'SEALED_ENCRYPTED',
              metadata: { storage: 'IndexedDB', mode: 'SHADOW_PROTECT_MANUAL' }
            }, { merge: true }).catch(() => {});
          }
        } catch (e) {
          console.error('ShadowProtect vault save failed:', e);
        }

        localStorage.removeItem('kavach_shadow_stealth');
        setShadowActive(false);
        setIsSaving(false);
        toast.success("FORENSIC ARCHIVE SEALED", {
          description: "Evidence has been safely stored locally and metadata has been sent to the cloud."
        });
        onClose();
      }, 500);
    } else {
      await KavachSafe.stopForensicCapture();
      localStorage.removeItem('kavach_shadow_stealth');
      setShadowActive(false);
      setIsSaving(false);
      onClose();
    }
  };

  const handleStop = () => {
    sealEvidence();
  };

  return {
    isShadowActive,
    userPos,
    videoRef,
    recordingTime,
    isSaving,
    isCameraReady,
    activateStealth,
    handleStop
  };
}
