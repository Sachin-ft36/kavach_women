import React from 'react';
import SOSButton from '../components/SOSButton';
import { Lock, Fingerprint, Shield, AlertTriangle, X, Mic, Radio, Signal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const KavachNative = registerPlugin<any>('KavachPlugin');

interface SOSScreenProps {
  isLocked: boolean;
  activeTab: string;
  isGhostMode: boolean;
  handleManualUnlock: () => void | Promise<void>;
}

export default function SOSScreen({ isLocked, activeTab, isGhostMode, handleManualUnlock }: SOSScreenProps) {
  const { t } = useLanguage();
  const { isSOSActive, setSOSActive, triggerMethod, safetyPin, userPos } = useKavachStore();
  const [showPinOverlay, setShowPinOverlay] = React.useState(false);
  const [enteredPin, setEnteredPin] = React.useState('');
  const [nearbyCount, setNearbyCount] = React.useState(0);
  const [nearbyCount, setNearbyCount] = React.useState(0);
  const recognitionRef = React.useRef<any>(null);

  // 📡 PROTECTOR RADAR LOGIC (CRITICAL RANGE SCAN)
  React.useEffect(() => {
    let unsubscribe: () => void = () => { };

    if (isSOSActive && userPos) {
      console.log("📡 RADAR: Scanning for local protectors within 1.5KM tactical range...");
      const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const count = snapshot.docs.filter(doc => {
          const data = doc.data();
          if (!data.coords) return false;
          const dist = calculateDistance(userPos[0], userPos[1], data.coords[0], data.coords[1]);
          return dist <= 1.5;
        }).length;
        setNearbyCount(count);
      });
    }

    return () => {
      console.log("📡 RADAR: Disengaging tactical scan.");
      unsubscribe();
    };
  }, [isSOSActive, userPos]);

  // 🎙️ MISSION CRITICAL: LIVE TRANSCRIPT ENGINE (RETIRED DUE TO HARDWARE CLASH)
  // Transcription during SOS is disabled to prioritize high-fidelity native recording.
  // This prevents the 'Mic Busy' error on critical SOS interceptors.

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAbort = async () => {
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({ reason: "Abort Emergency Alert", useFallback: true });

      // Hardware Cleanup First
      if (Capacitor.isNativePlatform()) {
        await KavachNative.stopForensicCapture().catch(() => { });
        await KavachNative.stopContinuousSiren().catch(() => { });
      }

      setSOSActive(false);
      toast.success("Identity Verified. Emergency Aborted.");
    } catch (e) {
      setShowPinOverlay(true);
    }
  };

  const handlePinSubmit = async (digit: string) => {
    const newPin = enteredPin + digit;
    if (newPin.length <= 4) {
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        if (newPin === safetyPin) {
          // Hardware Cleanup
          if (Capacitor.isNativePlatform()) {
            await KavachNative.stopForensicCapture().catch(() => { });
            await KavachNative.stopContinuousSiren().catch(() => { });
          }

          setSOSActive(false);
          toast.success("PIN Verified. Grid Restored.");
          setShowPinOverlay(false);
          setEnteredPin('');
        } else {
          toast.error("Invalid Secret PIN. Access Denied.");
          setEnteredPin('');
        }
      }
    }
  };

  // 🔒 DEVICE LOCK SCREEN
  if (isLocked && activeTab !== 'sos') {
    return (
      <div className="min-h-screen bg-[#060000] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-12">
          <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent-blue shadow-2xl">
            <Lock size={48} className="animate-pulse" />
          </div>
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{t('shield_locked')}</h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-12 opacity-60">{t('identity_verification')}</p>
        <button
          onClick={handleManualUnlock}
          className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-4 active:scale-95 transition-all shadow-2xl"
        >
          <Fingerprint size={20} /> {t('use_biometrics')}
        </button>
      </div>
    );
  }

  // 🔴 LIVE EMERGENCY RECORDING HUB (As per user request)
  if (isSOSActive) {
    return (
      <div className="fixed inset-0 z-[5000] bg-[#080000] flex flex-col p-6 overflow-hidden">
        {/* PIN Pad Overlay */}
        <AnimatePresence>
          {showPinOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex flex-col p-8"
            >
              <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                <div className="text-center">
                  <Lock size={40} className="text-accent-blue mx-auto mb-4" />
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Grid Security</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Enter Secret PIN to Abort</p>
                </div>

                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all duration-300",
                      enteredPin.length >= i ? "bg-accent-blue border-accent-blue shadow-[0_0_15px_rgba(45,212,191,0.5)]" : "border-white/20"
                    )} />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        if (k === 'C') setEnteredPin('');
                        else if (k === '⌫') setEnteredPin(prev => prev.slice(0, -1));
                        else handlePinSubmit(k.toString());
                      }}
                      className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white active:bg-accent-blue/20 transition-all active:scale-90"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setShowPinOverlay(false); setEnteredPin(''); }}
                className="py-6 text-gray-500 font-bold uppercase tracking-widest text-[8px] hover:text-white"
              >
                Back to Grid Monitor
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Neural Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-red/10 via-transparent to-accent-red/20 pointer-events-none" />

        {/* Header: Recording Stats */}
        <div className="relative z-10 flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-red-500 italic">LIVE FORENSIC RECORDING</span>
          </div>

          {/* Protector Radar Count */}
          <div className="flex items-center gap-2 px-3 py-1 bg-accent-blue/10 border border-accent-blue/30 rounded-full">
            <Shield size={10} className="text-accent-blue animate-pulse" />
            <span className="text-[8px] font-black text-accent-blue uppercase tracking-widest">
              {nearbyCount} PROTECTORS IN RANGE
            </span>
          </div>

          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold text-gray-500 uppercase tracking-widest">
            NODE: {triggerMethod?.toUpperCase() || 'MANUAL'}
          </div>
        </div>

        {/* Main Pulsator Copy (Centered) */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative z-10">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-[-60px] bg-red-600/20 rounded-full blur-[80px]"
            />
            <div className="w-56 h-56 bg-red-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_100px_rgba(220,38,38,0.5)] border-4 border-white/20">
              <Shield size={64} className="text-white animate-bounce" />
              <p className="mt-4 text-white font-black uppercase tracking-[4px] text-xs">GRID ACTIVE</p>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="p-5 bg-white/5 border border-white/10 rounded-[24px] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio size={16} className="text-green-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Uplink Status</span>
                </div>
                <span className="text-[8px] font-black text-green-500 uppercase italic">STABLE</span>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Police Control Dispatch</span>
                  <span className="text-white">ENROUTE</span>
                </div>
                <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Guardian SMS Alert</span>
                  <span className="text-white">DELIVERED</span>
                </div>
                <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Audio Log Storage</span>
                  <span className="text-white italic">LOGGING...</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="relative z-10 pb-8 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-2 text-red-500/60 animate-pulse">
            <AlertTriangle size={14} />
            <p className="text-[8px] font-black uppercase tracking-[3px]">Evidence processing under BNSS protocols</p>
          </div>

          <button
            onClick={handleAbort}
            className="w-full py-6 bg-white text-black rounded-[28px] font-black uppercase tracking-[4px] text-xs flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
          >
            <X size={20} /> ABORT EMERGENCY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <SOSButton />
    </div>
  );
}
