import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode, Camera, Shield, RefreshCw, X, CheckCircle2,
  AlertCircle, Sparkles, ChevronLeft, Zap, Lightbulb, Focus,
  Clock, Keyboard, Users, Flashlight, ChevronRight, Check
} from 'lucide-react';
import ScanQR from './scanQR';
import GenerateQR from './GenerateQR';
import { supabase } from '../../lib/supabase';
import { db } from '../../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { QrSecurityService } from '../../services/native/QrSecurityService';
import { Capacitor } from '@capacitor/core';
import { useKavachStore } from '../../state/useKavachStore';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';

// Declare global variables for TS integration
declare global {
  interface Window {
    jsQR: any;
    BarcodeDetector: any;
  }
}

interface QuickPairQrProps {
  mode: 'generate' | 'scan';
  onClose: () => void;
  currentUserProfile: any;
}

// --- Custom Animations & Styles ---
const inlineStyles = `
  @keyframes scanline {
    0% { transform: translateY(0); opacity: 0; }
    10% { opacity: 1; box-shadow: 0 0 20px 2px var(--scan-color, rgba(168, 85, 247, 0.4)); }
    50% { box-shadow: 0 0 30px 4px var(--scan-color, rgba(168, 85, 247, 0.9)); opacity: 1; }
    90% { opacity: 1; box-shadow: 0 0 20px 2px var(--scan-color, rgba(168, 85, 247, 0.4)); }
    100% { transform: translateY(260px); opacity: 0; }
  }
  .animate-scanline {
    animation: scanline 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  
  .scanner-cutout {
    box-shadow: 0 0 0 9999px rgba(5, 5, 10, 0.88);
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .bracket {
    position: absolute;
    width: 40px;
    height: 40px;
    border-style: solid;
    border-radius: 12px;
    transition: all 0.4s ease;
  }
  .bracket-tl { top: -4px; left: -4px; border-width: 4px 0 0 4px; border-top-left-radius: 16px; border-bottom-left-radius: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }
  .bracket-tr { top: -4px; right: -4px; border-width: 4px 4px 0 0; border-top-right-radius: 16px; border-bottom-left-radius: 0; border-top-left-radius: 0; border-bottom-right-radius: 0; }
  .bracket-bl { bottom: -4px; left: -4px; border-width: 0 0 4px 4px; border-bottom-left-radius: 16px; border-top-left-radius: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }
  .bracket-br { bottom: -4px; right: -4px; border-width: 0 4px 4px 0; border-bottom-right-radius: 16px; border-top-left-radius: 0; border-top-right-radius: 0; border-bottom-left-radius: 0; }
`;

export default function QuickPairQr({ mode, onClose, currentUserProfile }: QuickPairQrProps) {
  const [activeView, setActiveView] = useState<'generate' | 'scan'>(mode);
  // Time/QR states
  const [timeLeft, setTimeLeft] = useState(600);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [simulatedWards, setSimulatedWards] = useState<any[]>([]);
  const [selectedSimWard, setSelectedSimWard] = useState<string>('');
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'waiting_approval' | 'welcome_family'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingInvitePayload, setPendingInvitePayload] = useState<any>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState<string>('');

  // Scanner dynamic controls states
  const [zoom, setZoom] = useState(1);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [autoTorchStatus, setAutoTorchStatus] = useState('auto');
  const [isLowLight, setIsLowLight] = useState(false);
  const [scanState, setScanState] = useState('searching'); // 'searching' | 'zooming' | 'locked' | 'success'

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Real-time loop sync refs (To prevent stale closure & performance overload)
  const isProcessing = useRef(false);
  const lastScanTime = useRef(0);
  const scanStateRef = useRef('searching'); // Real-time logic state
  const barcodeDetector = useRef<any>(null);

  // Helper to sync React state with Loop state instantly
  const updateScanState = useCallback((newState: string) => {
    setScanState(newState);
    scanStateRef.current = newState;
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = async (type: 'success' | 'error' | 'medium') => {
    try {
      if (Capacitor.isNativePlatform()) {
        if (type === 'success') {
          await Haptics.notification({ type: NotificationType.Success });
        } else if (type === 'error') {
          await Haptics.notification({ type: NotificationType.Error });
        } else {
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
      }
    } catch (e) {
      console.warn('Haptic feedback not supported on this platform', e);
    }
  };

  // activeView === 'generate': Generate QR Code payload & manage TTL
  useEffect(() => {
    if (activeView === 'generate' && currentUserProfile?.uid) {
      const generateNewPayload = async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const expiresAt = nowSec + 600; // 10 minutes TTL
        const nonce = Math.random().toString(36).substring(2, 10).toUpperCase();

        const signature = await QrSecurityService.generateSignature(currentUserProfile.uid, nonce, expiresAt);
        setGeneratedAt(nowSec);

        const payload = {
          version: 2,
          intent: 'pair_guardian',
          ward_id: currentUserProfile.uid,
          ward_name: currentUserProfile.name || 'Kavach Citizen',
          generated_at: nowSec,
          expires_at: expiresAt,
          nonce: nonce,
          signature: signature
        };

        const payloadStr = JSON.stringify(payload);
        setQrPayload(payloadStr);
        setTimeLeft(600);

        localStorage.setItem('kavach_qr_payload', payloadStr);
        localStorage.setItem('kavach_qr_generated_at', nowSec.toString());
      };

      const loadOrGeneratePayload = async () => {
        const storedPayload = localStorage.getItem('kavach_qr_payload');
        const storedGeneratedAt = localStorage.getItem('kavach_qr_generated_at');

        if (storedPayload && storedGeneratedAt) {
          const nowSec = Math.floor(Date.now() / 1000);
          const elapsed = nowSec - parseInt(storedGeneratedAt, 10);

          if (elapsed < 600) {
            setGeneratedAt(parseInt(storedGeneratedAt, 10));
            setQrPayload(storedPayload);
            setTimeLeft(600 - elapsed);
            return;
          }
        }

        await generateNewPayload();
      };

      loadOrGeneratePayload();

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            generateNewPayload();
            return 600;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeView, currentUserProfile?.uid]);

  // activeView === 'scan': Fetch active provisional citizens for easy mock simulation in web dev
  useEffect(() => {
    if (activeView === 'scan') {
      const loadSimulatedWards = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('gender', 'female')
            .limit(10);

          if (data && !error) {
            setSimulatedWards(data);
            if (data.length > 0) {
              setSelectedSimWard(data[0].id);
            }
          }
        } catch (e) {
          console.warn('Failed to load simulated wards', e);
        }
      };
      loadSimulatedWards();

      // Inject jsQR for Laptops/Apple devices
      if (!window.jsQR) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.async = true;
        document.body.appendChild(script);
      }

      // Advanced Native API Check
      if ('BarcodeDetector' in window) {
        window.BarcodeDetector.getSupportedFormats()
          .then((formats: string[]) => {
            if (formats.includes('qr_code')) {
              barcodeDetector.current = new window.BarcodeDetector({ formats: ['qr_code'] });
            } else {
              console.log("Barcode API found, but QR not supported natively. Will use jsQR.");
            }
          })
          .catch(() => console.log("Failed to query Barcode formats."));
      }
    }
  }, [activeView]);

  // Listen for pairing request status changes
  useEffect(() => {
    if (!requestId) return;
    const unsub = onSnapshot(doc(db, 'pairing_requests', requestId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'approved') {
          setPairingStatus('welcome_family');
          triggerHaptic('success');
          toast.success('🎉 Pairing request approved!');
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 4500);
        } else if (data.status === 'declined') {
          setPairingStatus('error');
          setErrorMessage('Pairing request was declined by the family owner.');
          triggerHaptic('error');
          toast.error('Pairing request declined.');
        }
      }
    });
    return () => unsub();
  }, [requestId]);

  // Handle camera activation for scanner mode
  const startCamera = async () => {
    setScanning(true);
    setScanResult(null);
    setErrorMessage('');
    setPairingStatus('idle');
    updateScanState('searching');

    try {
      let stream: MediaStream;
      try {
        // Attempt 1: Back camera (Mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' }, width: { ideal: 720 }, height: { ideal: 720 } }
        });
      } catch (e) {
        // Attempt 2: Generic Webcam (Laptop)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 720 }, height: { ideal: 720 } }
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startRealTimeAnalysis();
        };
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable. Falling back to simulation mode.', err);
      toast.info('Camera unavailable. Using premium simulation hub.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // --- THE ENGINE (THROTTLED PROCESSING) ---
  const startRealTimeAnalysis = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const analyzeFrame = async () => {
      // Keep loop running
      animationFrameId.current = requestAnimationFrame(analyzeFrame);

      if (video.readyState !== video.HAVE_ENOUGH_DATA || isProcessing.current) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      // THROTTLE: Only run heavy QR detection every 300ms (Saves Laptop CPU)
      const now = Date.now();
      if (now - lastScanTime.current < 300) return;

      isProcessing.current = true;
      lastScanTime.current = now;

      // Match canvas to video size
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // --- A. LIGHT DETECTION (Runs once per second) ---
      if (autoTorchStatus === 'auto' && !isTorchOn && (now % 1000 < 300)) {
        const imgData = ctx.getImageData((canvas.width / 2) - 50, (canvas.height / 2) - 50, 100, 100);
        let sum = 0;
        for (let i = 0; i < imgData.data.length; i += 4) {
          sum += 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
        }
        if ((sum / 10000) < 45) {
          triggerHardwareTorch(true);
        }
      }

      // --- B. QR DETECTION ---
      if (scanStateRef.current === 'searching' || scanStateRef.current === 'zooming') {
        try {
          let detectedData: string | null = null;
          let qrWidth = 0;
          let qrHeight = 0;

          // Native Android Engine
          if (barcodeDetector.current) {
            const barcodes = await barcodeDetector.current.detect(canvas);
            if (barcodes.length > 0) {
              detectedData = barcodes[0].rawValue;
              qrWidth = barcodes[0].boundingBox.width;
              qrHeight = barcodes[0].boundingBox.height;
            }
          }
          // Laptop/Apple Fallback Engine
          else if (window.jsQR) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code) {
              detectedData = code.data;
              qrWidth = Math.abs(code.location.topRightCorner.x - code.location.topLeftCorner.x);
              qrHeight = Math.abs(code.location.bottomLeftCorner.y - code.location.topLeftCorner.y);
            }
          }

          if (detectedData) {
            const sizeRatio = (qrWidth * qrHeight) / (canvas.width * canvas.height);

            // ZOOM LOGIC
            if (sizeRatio > 0 && sizeRatio < 0.03) {
              updateScanState('zooming');
              triggerHardwareZoom(2.0);
            } else {
              // LOCK & SUCCESS LOGIC
              updateScanState('locked');
              setScanResult(detectedData);

              if (navigator.vibrate) navigator.vibrate([50, 40, 50]);

              setTimeout(() => {
                updateScanState('success');
              }, 400);

              // Execute pairing
              executePairing(detectedData);
            }
          }
        } catch (e) {
          console.error("Scanning Error:", e);
        }
      }

      isProcessing.current = false;
    };

    analyzeFrame();
  };

  // --- NATIVE HARDWARE CONTROLS ---
  const triggerHardwareTorch = (turnOn: boolean) => {
    setIsTorchOn(turnOn);
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          track.applyConstraints({
            advanced: [{ torch: turnOn }]
          } as any);
        }
      }
    } catch (e) { }
  };

  const triggerHardwareZoom = (targetZoom: number) => {
    setZoom(targetZoom);
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.zoom) {
          const safeZoom = Math.min(
            Math.max(targetZoom, capabilities.zoom.min),
            capabilities.zoom.max
          );
          track.applyConstraints({
            advanced: [{ zoom: safeZoom }]
          } as any);
        }
      }
    } catch (e) { }
  };

  const handleToggleTorch = () => {
    const newState = !isTorchOn;
    setAutoTorchStatus(newState ? 'manual_on' : 'manual_off');
    triggerHardwareTorch(newState);
  };

  const handleManualZoom = (level: number) => {
    updateScanState('zooming');
    triggerHardwareZoom(level);
    setTimeout(() => updateScanState('searching'), 500);
  };

  // Pairing handler
  const executePairing = async (scannedPayloadStr: string) => {
    setPairingStatus('processing');
    setErrorMessage('');

    try {
      const payload = JSON.parse(scannedPayloadStr);

      if (payload.intent !== 'pair_guardian' || !payload.ward_id || !payload.generated_at) {
        throw new Error('INVALID_QR_FORMAT');
      }

      // 1. Signature check (Digital Signature & Tamper Proofing)
      if (payload.version === 2 && payload.signature && payload.expires_at) {
        const isSignatureValid = await QrSecurityService.verifySignature(
          payload.ward_id,
          payload.nonce,
          payload.expires_at,
          payload.signature
        );
        if (!isSignatureValid) {
          throw new Error('TAMPERED_QR_SIGNATURE');
        }
      }

      // 2. Expiry check
      const nowSec = Math.floor(Date.now() / 1000);
      const expiresAt = payload.expires_at || (payload.generated_at + 120);
      if (nowSec > expiresAt) {
        throw new Error('EXPIRED_QR');
      }

      // 3. Prevent self-pairing
      if (payload.ward_id === currentUserProfile.uid) {
        throw new Error('CANNOT_PAIR_SELF');
      }

      await triggerHaptic('medium');

      // 4. One-time Nonce Check (Replay attack protection)
      if (payload.nonce) {
        const nonceDocRef = doc(db, 'used_nonces', payload.nonce);
        const nonceSnap = await getDoc(nonceDocRef);
        if (nonceSnap.exists()) {
          throw new Error('REPLAY_ATTACK_REJECTED');
        }
        await setDoc(nonceDocRef, {
          consumedAt: serverTimestamp(),
          wardId: payload.ward_id,
          guardianId: currentUserProfile.uid
        });
      }

      // 5. Check if already paired
      const wardDocRef = doc(db, 'users', payload.ward_id);
      const wardDocSnap = await getDoc(wardDocRef);
      if (wardDocSnap.exists()) {
        const data = wardDocSnap.data();
        if (data?.primaryGuardian?.phone?.includes(currentUserProfile.phoneNumber || '')) {
          throw new Error('ALREADY_CONNECTED');
        }
      }

      // 6. Get receiver (ward owner) details for display
      let ownerName = payload.ward_name || 'Family Member';
      try {
        const wardSnap = await getDoc(doc(db, 'users', payload.ward_id));
        if (wardSnap.exists()) {
          ownerName = wardSnap.data()?.name || ownerName;
        }
      } catch (e) {
        // use ward_name from payload
      }
      setReceiverName(ownerName);

      // 7. Create a pending pairing request in Firestore
      const requestRef = await addDoc(collection(db, 'pairing_requests'), {
        senderId: currentUserProfile.uid,
        senderName: currentUserProfile.name || currentUserProfile.displayName || 'User',
        senderPhone: currentUserProfile.phoneNumber || currentUserProfile.phone || '',
        senderPhoto: currentUserProfile.photoURL || currentUserProfile.photoUrl || '',
        receiverId: payload.ward_id,
        receiverName: ownerName,
        status: 'pending',
        wardPayload: payload,
        timestamp: serverTimestamp(),
      });

      setRequestId(requestRef.id);
      setPairingStatus('waiting_approval');
      stopCamera();

    } catch (err: any) {
      console.error('Pairing process error:', err);
      setPairingStatus('error');
      await triggerHaptic('error');

      if (err.message === 'INVALID_QR_FORMAT') {
        setErrorMessage('Invalid Kavach QR. Make sure you are scanning a valid Citizen Pairing Code.');
      } else if (err.message === 'TAMPERED_QR_SIGNATURE') {
        setErrorMessage('Tampered QR detected! Security signature validation failed.');
      } else if (err.message === 'EXPIRED_QR') {
        setErrorMessage('QR Code has expired. Please ask the ward to refresh the QR code.');
      } else if (err.message === 'CANNOT_PAIR_SELF') {
        setErrorMessage('Cannot pair with your own device.');
      } else if (err.message === 'REPLAY_ATTACK_REJECTED') {
        setErrorMessage('Replay attack detected! This QR code has already been consumed.');
      } else if (err.message === 'ALREADY_CONNECTED') {
        setErrorMessage('This citizen is already linked to your safety circle.');
      } else {
        setErrorMessage(err.message || 'Verification failed. Please try again.');
      }
    }
  };

  const confirmPairing = async () => {
    if (!pendingInvitePayload) return;
    setPairingStatus('processing');
    setShowConfirmation(false);

    try {
      const payload = pendingInvitePayload;

      // 1. Call Secure PostgreSQL function for Anti-Clock Spoofing
      const { data: isValid, error: rpcError } = await supabase.rpc('validate_qr_pairing', {
        p_ward_id: payload.ward_id,
        p_generated_at: parseInt(payload.generated_at, 10) || payload.generated_at,
        p_ttl_seconds: 600
      });

      if (rpcError) {
        console.error('validate_qr_pairing RPC failed:', rpcError);
        if (rpcError.message?.includes('expired') || rpcError.message?.includes('ERR_QR_EXPIRED')) {
          throw new Error('EXPIRED_QR');
        }
      }

      if (isValid === false) {
        throw new Error('EXPIRED_QR');
      }

      // 2. Perform linking in Firebase
      const wardId = payload.ward_id;
      const guardianPhone = currentUserProfile.phoneNumber || currentUserProfile.phone || '';

      if (!guardianPhone) {
        throw new Error('GUARDIAN_PHONE_MISSING');
      }

      const guardianCleanPhone = `+91${guardianPhone.replace(/\D/g, '').slice(-10)}`;

      // Update Citizen's document
      const wardDocRef = doc(db, 'users', wardId);
      await updateDoc(wardDocRef, {
        primaryGuardian: {
          name: currentUserProfile.name || 'Guardian',
          phone: guardianCleanPhone,
          relation: 'Guardian'
        }
      });

      // Add to Citizen's guardians subcollection
      await addDoc(collection(db, 'users', wardId, 'guardians'), {
        name: currentUserProfile.name || 'Guardian',
        phone: guardianCleanPhone,
        relation: 'Guardian',
        createdAt: serverTimestamp()
      });

      // Update local storage guardian cache for the Citizen to maintain instant recovery
      try {
        const responseProfileSnap = await supabase
          .from('profiles')
          .select('metadata')
          .eq('id', wardId)
          .single();

        if (responseProfileSnap.data) {
          const currentMeta = responseProfileSnap.data.metadata || {};
          const updatedMeta = {
            ...currentMeta,
            primaryGuardian: {
              name: currentUserProfile.name || 'Guardian',
              phone: guardianCleanPhone,
              relation: 'Guardian'
            }
          };

          await supabase
            .from('profiles')
            .update({ metadata: updatedMeta })
            .eq('id', wardId);
        }
      } catch (subErr) {
        console.warn('Supabase profiles metadata update failed:', subErr);
      }

      setPairingStatus('success');
      await triggerHaptic('success');
      toast.success('Ward paired successfully!');

      stopCamera();

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Pairing confirmation error:', err);
      setPairingStatus('error');
      await triggerHaptic('error');
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    }
  };

  // Simulate scanning a specific ward (useful for desktop / web development)
  const handleSimulateScan = () => {
    if (!selectedSimWard) {
      toast.error('Select a ward to simulate pairing');
      return;
    }

    const wardObj = simulatedWards.find(w => w.id === selectedSimWard);
    const mockPayload = {
      intent: 'pair_guardian',
      ward_id: selectedSimWard,
      ward_name: wardObj?.display_name || 'Kavach Ward',
      generated_at: Math.floor(Date.now() / 1000)
    };

    executePairing(JSON.stringify(mockPayload));
  };

  // Simulated Scanning trigger for demo loop
  const handleTriggerMockExpiredScan = () => {
    const mockPayload = {
      intent: 'pair_guardian',
      ward_id: currentUserProfile.uid || 'dummy_ward_id',
      ward_name: 'Expired Ward Profile',
      generated_at: Math.floor(Date.now() / 1000) - 600
    };
    executePairing(JSON.stringify(mockPayload));
  };

  const progressPercent = (timeLeft / 120) * 100;

  // Scanner dynamic values
  const isSuccess = scanState === 'locked' || scanState === 'success';
  const bracketColor = isSuccess ? '#22c55e' : '#a855f7';
  const bracketShadow = isSuccess ? 'rgba(34, 197, 94, 0.8)' : 'rgba(168, 85, 247, 0.8)';

  const overlayContent = (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="fixed inset-0 z-[9999] w-full h-full text-white flex flex-col overflow-y-auto"
      style={{ background: "#000000" }}
    >
      <style>{inlineStyles}</style>

      {/* Hidden Canvas - Necessary for pixel analysis */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {activeView === 'generate' ? (
        <GenerateQR currentUserProfile={currentUserProfile} onClose={onClose} onShowScanner={() => setActiveView('scan')} />
      ) : (
        <>
          <ScanQR onSuccess={executePairing} onClose={onClose} onShowMyQr={() => setActiveView('generate')} />

          {/* Status Feedback for QR Pairing */}
          <AnimatePresence mode="wait">
            {pairingStatus === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 bg-[#141A3A]/95 backdrop-blur-md border border-[#232A56] rounded-xl p-3 flex items-center gap-3 text-[#7C4DFF] text-left shadow-2xl"
              >
                <RefreshCw size={13} className="animate-spin shrink-0" />
                <p className="text-[9.5px] font-black uppercase tracking-wider">Syncing safety protocols & validating TTL...</p>
              </motion.div>
            )}

            {pairingStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 bg-[#FF2D2D]/10 backdrop-blur-md border border-[#FF2D2D]/30 rounded-xl p-3 flex items-center gap-3 text-[#FF2D2D] text-left shadow-2xl"
              >
                <AlertCircle size={15} className="shrink-0" />
                <div className="flex-1">
                  <p className="text-[9.5px] font-black uppercase tracking-wider leading-none">Verification Failed</p>
                  <p className="text-[8px] text-[#FF2D2D] font-bold uppercase tracking-wide mt-1.5 leading-normal">{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WAITING FOR APPROVAL SCREEN */}
          <AnimatePresence>
            {pairingStatus === 'waiting_approval' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] bg-[#090B1F] flex flex-col items-center justify-center px-6 text-center"
              >
                {/* Pulsing Ring Animation */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 w-28 h-28 rounded-full bg-[#7C4DFF]/20 " />
                  <div className="w-28 h-28 rounded-full bg-[#141A3A] border-2 border-[#7C4DFF]/40 flex items-center justify-center shadow-[0_0_40px_rgba(124,77,255,0.3)]">
                    <Clock size={36} className="text-[#7C4DFF]" />
                  </div>
                </div>

                <h2 className="text-[22px] font-black text-white tracking-tight mb-2">Waiting for Approval</h2>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed mb-6">Request sent to</p>
                <div className="bg-[#141A3A] border border-[#232A56] rounded-2xl px-8 py-4 mb-8 min-w-[200px]">
                  <p className="text-[18px] font-black text-white">{receiverName}</p>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">Family Owner</p>
                </div>
                <p className="text-[12px] text-slate-500 font-medium ">Please wait for them to approve...</p>

                <button
                  onClick={() => {
                    setPairingStatus('idle');
                    setRequestId(null);
                    toast.info('Request cancelled.');
                  }}
                  className="mt-10 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[13px] text-slate-400 font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  Cancel Request
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WELCOME TO FAMILY SCREEN */}
          <AnimatePresence>
            {pairingStatus === 'welcome_family' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10001] bg-[#090B1F] flex flex-col items-center justify-center px-6 text-center"
              >
                {/* Celebration Icon */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                  className="relative mb-8"
                >
                  <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#00D26A]/15 " />
                  <div className="w-32 h-32 rounded-full bg-[#141A3A] border-2 border-[#00D26A]/50 flex items-center justify-center shadow-[0_0_50px_rgba(0,210,106,0.3)]">
                    <Users size={44} className="text-[#00D26A]" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-[#00D26A] flex items-center justify-center shadow-lg">
                    <Check size={18} className="text-white" strokeWidth={3} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-[14px] text-slate-400 font-medium mb-1">🎉 You are now part of</p>
                  <h2 className="text-[26px] font-black text-white tracking-tight mb-2">
                    {receiverName}'s Family
                  </h2>
                  <p className="text-[13px] text-slate-500 font-medium">Stay connected, stay safe.</p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                  className="mt-10 w-full max-w-xs py-4 bg-[#00D26A] hover:bg-[#00D26A]/90 text-white text-[15px] font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-[#00D26A]/25 cursor-pointer"
                >
                  Go to Family Circle
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

        </>
      )}

    </motion.div>
  );

  return createPortal(overlayContent, document.body);
}
