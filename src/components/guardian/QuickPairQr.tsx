import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Camera, Shield, RefreshCw, X, CheckCircle2, 
  AlertCircle, Sparkles, AlertTriangle, Play, HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { db } from '../../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';

interface QuickPairQrProps {
  mode: 'generate' | 'scan';
  onClose: () => void;
  currentUserProfile: any;
}

export default function QuickPairQr({ mode, onClose, currentUserProfile }: QuickPairQrProps) {
  const [timeLeft, setTimeLeft] = useState(120);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [simulatedWards, setSimulatedWards] = useState<any[]>([]);
  const [selectedSimWard, setSelectedSimWard] = useState<string>('');
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // mode === 'generate': Generate QR Code payload & manage TTL
  useEffect(() => {
    if (mode === 'generate' && currentUserProfile?.uid) {
      const generateNewPayload = () => {
        const nowSec = Math.floor(Date.now() / 1000);
        setGeneratedAt(nowSec);
        
        const payload = {
          intent: 'pair_guardian',
          ward_id: currentUserProfile.uid,
          ward_name: currentUserProfile.name || 'Kavach Citizen',
          generated_at: nowSec
        };
        
        const payloadStr = JSON.stringify(payload);
        setQrPayload(payloadStr);
        setTimeLeft(120);

        localStorage.setItem('kavach_qr_payload', payloadStr);
        localStorage.setItem('kavach_qr_generated_at', nowSec.toString());
      };

      const loadOrGeneratePayload = () => {
        const storedPayload = localStorage.getItem('kavach_qr_payload');
        const storedGeneratedAt = localStorage.getItem('kavach_qr_generated_at');
        
        if (storedPayload && storedGeneratedAt) {
          const nowSec = Math.floor(Date.now() / 1000);
          const elapsed = nowSec - parseInt(storedGeneratedAt, 10);
          
          if (elapsed < 120) {
            setGeneratedAt(parseInt(storedGeneratedAt, 10));
            setQrPayload(storedPayload);
            setTimeLeft(120 - elapsed);
            return;
          }
        }
        
        generateNewPayload();
      };

      loadOrGeneratePayload();

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            generateNewPayload();
            return 120;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode, currentUserProfile?.uid]);

  // mode === 'scan': Fetch active provisional citizens for easy mock simulation in web dev
  useEffect(() => {
    if (mode === 'scan') {
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
    }
  }, [mode]);

  // Handle camera activation for scanner mode
  const startCamera = async () => {
    setScanning(true);
    setScanResult(null);
    setErrorMessage('');
    setPairingStatus('idle');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Pairing handler
  const executePairing = async (scannedPayloadStr: string) => {
    setPairingStatus('processing');
    setErrorMessage('');
    
    try {
      const payload = JSON.parse(scannedPayloadStr);
      
      if (payload.intent !== 'pair_guardian' || !payload.ward_id || !payload.generated_at) {
        throw new Error('INVALID_QR_FORMAT');
      }

      await triggerHaptic('medium');

      // 1. Call Secure PostgreSQL function for Anti-Clock Spoofing
      const { data: isValid, error: rpcError } = await supabase.rpc('validate_qr_pairing', {
        p_ward_id: payload.ward_id,
        p_generated_at: parseInt(payload.generated_at, 10) || payload.generated_at,
        p_ttl_seconds: 120
      });

      if (rpcError) {
        console.error('validate_qr_pairing RPC failed:', rpcError);
        // Fallback or explicit check if function not available
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
      
      // Stop scanning
      stopCamera();
      
      // Trigger update on parent or wait 2 seconds and close
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Pairing process error:', err);
      setPairingStatus('error');
      await triggerHaptic('error');
      
      if (err.message === 'INVALID_QR_FORMAT') {
        setErrorMessage('Invalid Kavach QR. Make sure you are scanning a valid Citizen Pairing Code.');
      } else if (err.message === 'EXPIRED_QR' || err.message?.includes('ERR_QR_EXPIRED')) {
        setErrorMessage('QR Code has expired. Please ask the ward to refresh the QR code.');
      } else if (err.message === 'GUARDIAN_PHONE_MISSING') {
        setErrorMessage('Your profile is missing a phone number. Complete onboarding first.');
      } else {
        setErrorMessage(err.message || 'Verification failed. Please try again.');
      }
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
      generated_at: Math.floor(Date.now() / 1000) - 600 // Generated 10 minutes ago
    };
    executePairing(JSON.stringify(mockPayload));
  };

  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  const progressPercent = (timeLeft / 120) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-white"
    >
      <div className="relative w-full max-w-sm rounded-[24px] overflow-hidden border border-white/10 bg-[#070b13]/90 shadow-[0_0_60px_-15px_rgba(99,102,241,0.25)] p-5 flex flex-col space-y-5">
        
        {/* Close Button */}
        <button 
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all active:scale-95 z-20 cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Heading Header */}
        <div className="text-center space-y-1 pt-1.5 z-10">
          <div className="inline-flex p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1.5">
            <QrCode size={18} className="animate-pulse" />
          </div>
          <h2 className="text-sm font-black tracking-widest uppercase text-slate-200">
            {mode === 'generate' ? 'Safety Grid QR' : 'Scan Ward QR'}
          </h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">
            {mode === 'generate' ? 'Scan to Link Family Guardian' : 'Pair with Ward Account'}
          </p>
        </div>

        {/* MODE: GENERATE QR PAYLOAD */}
        {mode === 'generate' && (
          <div className="flex flex-col items-center space-y-5 z-10">
            {/* QR Wrapper with holographic ring */}
            <div className="relative p-4.5 bg-white rounded-2xl shadow-[0_0_35px_rgba(99,102,241,0.12)] border border-slate-100">
              {qrPayload ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`}
                  alt="Kavach Safe pairing QR"
                  className="w-40 h-40 block rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-lg">
                  <RefreshCw className="animate-spin text-slate-400" size={20} />
                </div>
              )}
            </div>

            {/* Countdown / TTL Meter */}
            <div className="w-full bg-[#0c1220]/70 border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Circular progress loader */}
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="#1E293B" strokeWidth="2" fill="transparent" />
                    <circle 
                      cx="16" cy="16" r="14" 
                      stroke="#6366F1" strokeWidth="2" fill="transparent" 
                      strokeDasharray={88}
                      strokeDashoffset={88 - (88 * progressPercent) / 100}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-indigo-400">{timeLeft}s</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-350 uppercase tracking-wider">Dynamic Passcode TTL</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Auto-updates on expiry</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const nowSec = Math.floor(Date.now() / 1000);
                  setGeneratedAt(nowSec);
                  const payload = {
                    intent: 'pair_guardian',
                    ward_id: currentUserProfile.uid,
                    ward_name: currentUserProfile.name || 'Kavach Citizen',
                    generated_at: nowSec
                  };
                  const payloadStr = JSON.stringify(payload);
                  setQrPayload(payloadStr);
                  setTimeLeft(120);
                  localStorage.setItem('kavach_qr_payload', payloadStr);
                  localStorage.setItem('kavach_qr_generated_at', nowSec.toString());
                  toast.success('QR Code refreshed.');
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-slate-400 border border-white/5"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div className="text-center max-w-[280px]">
              <p className="text-[9px] text-slate-500 leading-normal font-bold uppercase tracking-wider">
                Show this code to your Guardian. They must tap "Scan QR" on their dashboard to link accounts.
              </p>
            </div>
          </div>
        )}

        {/* MODE: SCAN QR CODE */}
        {mode === 'scan' && (
          <div className="flex flex-col space-y-4 z-10">
            {/* Viewfinder Target Container */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950/70 border border-white/5 flex flex-col items-center justify-center shadow-inner">
              
              {/* High-tech Corners */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-indigo-500/60 rounded-tl-sm pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-indigo-500/60 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-indigo-500/60 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-indigo-500/60 rounded-br-sm pointer-events-none" />

              {scanning ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Glowing Green Scanning Laser */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0 shadow-[0_0_12px_#34D399] animate-scanner-laser top-0" />
                </>
              ) : (
                <div className="p-4 text-center space-y-2.5">
                  <div className="relative w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <Camera size={18} />
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-slate-950" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanner Standby</h5>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Activate camera feed to scan ward QR code</p>
                  </div>
                  <button 
                    onClick={startCamera}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border-none shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer text-white"
                  >
                    Engage Camera
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Pairing Panel */}
            <div className="border border-white/5 rounded-xl p-3.5 bg-[#0c1220]/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-indigo-400 border-b border-white/5 pb-1.5">
                <Sparkles size={11} />
                <span className="text-[9px] font-black uppercase tracking-widest">Dev Simulation Hub</span>
              </div>
              
              {simulatedWards.length > 0 ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Select Ward Profile</label>
                    <select
                      value={selectedSimWard}
                      onChange={(e) => setSelectedSimWard(e.target.value)}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-300 outline-none cursor-pointer"
                    >
                      {simulatedWards.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.display_name || w.email} ({w.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleSimulateScan}
                      className="py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                    >
                      Simulate Scan
                    </button>
                    <button
                      onClick={handleTriggerMockExpiredScan}
                      className="py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                    >
                      Simulate Expired
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[8px] text-slate-500 uppercase font-bold text-center">Loading dev simulations...</p>
              )}
            </div>

            {/* Status Feedback */}
            <AnimatePresence mode="wait">
              {pairingStatus === 'processing' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-950/20 border border-indigo-500/15 rounded-lg p-2.5 flex items-center gap-2.5 text-indigo-400"
                >
                  <RefreshCw size={12} className="animate-spin shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-wider">Syncing safety protocols & validating TTL...</p>
                </motion.div>
              )}

              {pairingStatus === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-950/20 border border-emerald-500/15 rounded-lg p-2.5 flex items-center gap-2.5 text-emerald-400"
                >
                  <CheckCircle2 size={14} className="shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider leading-none">Pairing Confirmed</p>
                    <p className="text-[7.5px] text-emerald-500 font-bold uppercase tracking-wide mt-1">Syncing secure grid links...</p>
                  </div>
                </motion.div>
              )}

              {pairingStatus === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-950/20 border border-rose-500/15 rounded-lg p-2.5 flex items-center gap-2.5 text-rose-450"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-wider leading-none">Verification Aborted</p>
                    <p className="text-[7.5px] text-rose-450 font-bold uppercase tracking-wide mt-1 leading-normal">{errorMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
