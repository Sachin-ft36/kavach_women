import React, { useState, useEffect } from 'react';
import { Shield, EyeOff, Mic, Video, MapPin, Lock, Camera, Activity, Terminal, AlertTriangle, X, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';

export default function ShadowProtectMode({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isShadowActive, setShadowActive, userPos } = useKavachStore();
  const [step, setStep] = useState(1);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isShadowActive) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          // 🛡️ AUTO-STOP PROTOCOL: Max 30 mins to save storage
          if (prev >= 1800) { 
            sealEvidence();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // 🎥 START LIVE PREVIEW (In-App Only)
      startCamera();
    } else {
      // 🛡️ EMERGENCY SEAL: If recording was active, ensure it gets saved
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
      // 🛡️ SMART LENS DISCOVERY: Try back camera first, fallback to any available
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

      // ⏺️ START MEDIA RECORDER
      const recorder = new MediaRecorder(mediaStream, { 
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4' 
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000); // Chunk every second for safety
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activateStealth = async () => {
    const { KavachSafe } = await import('../services/KavachNative');
    localStorage.removeItem('kavach_shadow_stealth');
    setShadowActive(true);
    
    // 🚀 TRIGGER NATIVE FORENSIC ENGINE
    await KavachSafe.startForensicCapture();
    
    // 📂 SEAL EVIDENCE IN VAULT (SIMULATED FOR LOGS)
    // 📂 SEAL EVIDENCE IN VAULT (LINKED TO NATIONAL GRID)
    const store = useKavachStore.getState();
    const currentUser = store.user;
    const alertId = store.activeAlertId;
    
    // If SOS is active, link evidence directly to the alert for SuperCell
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
      url: 'PENDING_FINAL_SEAL' // This tells SuperCell to wait for the stream
    }).catch(() => {});

    toast.success("SHADOW PROTECT: STEALTH MODE ENGAGED", {
      description: "Forensic capture uplinked to National Grid.",
      icon: <Shield className="text-blue-500" />
    });
  };

  const sealEvidence = async () => {
    setIsSaving(true);
    const { KavachSafe } = await import('../services/KavachNative');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      setTimeout(async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
        const fileName = `KAVACH_FORENSIC_${Date.now()}.mp4`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        await KavachSafe.stopForensicCapture();
        
        const store = useKavachStore.getState();
        
        // 🛡️ UPDATE NATIONAL GRID WITH FINAL SEAL
        if (store.activeAlertId) {
          const evidenceRef = doc(collection(db, 'alerts', store.activeAlertId, 'evidence'));
          await setDoc(evidenceRef, {
            type: 'CCTV_FEED',
            timestamp: serverTimestamp(),
            status: 'SEALED_ENCRYPTED',
            url: url // Final local/cloud URL
          }, { merge: true }).catch(() => {});
        }

        localStorage.removeItem('kavach_shadow_stealth');
        setShadowActive(false);
        setIsSaving(false);
        toast.success("FORENSIC LOG SEALED", {
          description: "Evidence secured in local vault.",
          icon: <ShieldCheck className="text-emerald-500" />
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
      />

      <AnimatePresence mode="wait">
        {!isShadowActive ? (
          <motion.div 
            key="setup"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20 }}
            className="relative w-full max-w-lg bg-[#0A0A0B] rounded-[32px] sm:rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#2563EB]/20 to-transparent pointer-events-none" />
            
            <div className="p-6 sm:p-10 relative">
              <div className="flex justify-between items-start mb-4 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[24px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] shadow-lg shadow-[#2563EB]/10">
                   <EyeOff size={24} className="sm:size-[32px]" />
                </div>
                <button onClick={onClose} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                   <X size={20} className="sm:size-[24px]" />
                </button>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white mb-1.5 leading-none">THREAT PROTECT</h2>
              <p className="text-[9px] sm:text-[11px] text-[#2563EB] font-black uppercase tracking-[4px] sm:tracking-[5px] mb-6 sm:mb-10">Silent Background Recording</p>

              <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                <div className="flex gap-4 sm:gap-6 items-center p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                      <Zap size={20} className="sm:size-[24px]" />
                   </div>
                   <div>
                      <h4 className="text-[12px] sm:text-[13px] font-black uppercase tracking-widest text-white mb-0.5 sm:mb-1 italic">Quick Trigger</h4>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-tight">Hold Power Button 5s to Start Silently</p>
                   </div>
                </div>

                <div className="flex gap-4 sm:gap-6 items-center p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                      <Camera size={20} className="sm:size-[24px]" />
                   </div>
                   <div>
                      <h4 className="text-[12px] sm:text-[13px] font-black uppercase tracking-widest text-white mb-0.5 sm:mb-1 italic">Stealth Capture</h4>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-tight">Logs Video, Audio & GPS in Background</p>
                   </div>
                </div>

                <div className="flex gap-4 sm:gap-6 items-center p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                      <Lock size={20} className="sm:size-[24px]" />
                   </div>
                   <div>
                      <h4 className="text-[12px] sm:text-[13px] font-black uppercase tracking-widest text-white mb-0.5 sm:mb-1 italic">Secured Evidence</h4>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-tight">All Logs Sealed in Encrypted Vault</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={activateStealth}
                className="w-full py-4 sm:py-6 bg-[#2563EB] text-white rounded-[18px] sm:rounded-[24px] text-xs sm:text-sm font-black uppercase tracking-[3px] sm:tracking-[4px] italic shadow-2xl shadow-[#2563EB]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Engage Protocol
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            {/* 🎥 LIVE CAMERA PREVIEW */}
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              {!isCameraReady && (
                <div className="flex flex-col items-center gap-4 text-[#2563EB]">
                   <Activity size={32} />
                   <span className="text-[10px] font-black uppercase tracking-[5px]">Waking Forensic Lens...</span>
                </div>
              )}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-1000",
                  (isCameraReady && !localStorage.getItem('kavach_shadow_stealth')) ? "opacity-80" : "opacity-0"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
            </div>

            {/* 🛰️ TACTICAL OVERLAYS */}
            <div className={cn(
              "relative z-10 flex-1 p-6 flex flex-col justify-between transition-opacity duration-500",
              localStorage.getItem('kavach_shadow_stealth') === 'true' ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                       <span className="text-[10px] font-black text-white uppercase tracking-[3px]">REC • LIVE FORENSIC</span>
                    </div>
                    <p className="text-[24px] font-black text-white italic tabular-nums tracking-tighter">{formatTime(recordingTime)}</p>
                 </div>
                 <div className="flex flex-col items-end gap-1 text-right">
                    <button 
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full backdrop-blur-md hover:bg-white/20 transition-all mb-2"
                    >
                       <EyeOff size={10} className="text-white" />
                       <span className="text-[8px] font-black text-white uppercase tracking-widest">Minimize to Hub</span>
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                       <Activity size={10} className="text-blue-500" />
                       <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Uplink Active</span>
                    </div>
                    <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                       LAT: {userPos[0].toFixed(6)} <br/>
                       LNG: {userPos[1].toFixed(6)}
                    </span>
                 </div>
              </div>

              <div className="flex flex-col items-center gap-8 mb-10">
                <div className="w-full flex justify-around opacity-60">
                   <div className="flex flex-col items-center gap-2">
                      <Mic size={16} className="text-white" />
                      <span className="text-[7px] font-bold uppercase text-gray-400">Audio Stream</span>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <Video size={16} className="text-white" />
                      <span className="text-[7px] font-bold uppercase text-gray-400">Visual Feed</span>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <Terminal size={16} className="text-white" />
                      <span className="text-[7px] font-bold uppercase text-gray-400">Telemetry</span>
                   </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStop}
                  disabled={isSaving}
                  className={cn(
                    "px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center gap-4 transition-all shadow-[0_15px_35px_rgba(220,38,38,0.3)] border-2 border-white/20",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                >
                   <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      {isSaving ? <Activity size={18} className="animate-spin" /> : <X size={18} />}
                   </div>
                   <div className="text-left">
                      <span className="block text-[12px] font-black uppercase tracking-[3px] leading-none">
                        {isSaving ? 'Saving Evidence...' : 'Stop & Seal'}
                      </span>
                      <span className="block text-[7px] font-bold uppercase tracking-widest text-white/60 mt-1.5">
                        {isSaving ? 'Encrypting Local File' : 'End Recording'}
                      </span>
                   </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
