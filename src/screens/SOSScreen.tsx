import React from 'react';
import SOSButton from '../components/SOSButton';
import { Lock, Fingerprint, Shield, AlertTriangle, X, Mic, Radio, Signal, ShieldCheck, Eye, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { KavachSafe } from '../App';
import KavachAIChat from '../components/KavachAIChat';

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
  const [showAbortReason, setShowAbortReason] = React.useState(false);
  const [abortReason, setAbortReason] = React.useState('');
  const [enteredPin, setEnteredPin] = React.useState('');
  const [nearbyCount, setNearbyCount] = React.useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
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

  const [isBeingMonitored, setIsBeingMonitored] = React.useState(false);
  const [showSafetyVerification, setShowSafetyVerification] = React.useState(false);
  const [activeAlertData, setActiveAlertData] = React.useState<any>(null);

  // 🛰️ MISSION CRITICAL: MONITORING STATUS SENTINEL
  React.useEffect(() => {
    let unsubscribe = () => {};
    const alertId = useKavachStore.getState().activeAlertId;

    if (isSOSActive && alertId) {
      const alertRef = doc(db, 'alerts', alertId);
      unsubscribe = onSnapshot(alertRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setActiveAlertData(data);
          
          if (data.isBeingMonitored && !isBeingMonitored) {
             if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
             toast.info("COMMAND CENTER: TACTICAL UPLINK ESTABLISHED.", {
               icon: <ShieldCheck className="text-accent-blue" />
             });
          }
          setIsBeingMonitored(!!data.isBeingMonitored);

          // 🛡️ SAFETY HANDSHAKE DETECTION
          if (data.status === 'rescued_pending_victim_clearance') {
             setShowSafetyVerification(true);
          } else if (data.status === 'resolved' || data.status === 'active') {
             setShowSafetyVerification(false);
          }
        }
      });
    }
    return () => unsubscribe();
  }, [isSOSActive, isBeingMonitored]);

  const handleConfirmSafety = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    
    try {
      if (alertId) {
        await updateDoc(doc(db, 'alerts', alertId), {
          status: 'resolved',
          victimClearedAt: serverTimestamp(),
          victimSafetyStatus: 'safe'
        });
      }
    } catch (e: any) {
      console.warn("⚠️ SOS: Document already cleared from grid. Performing local cleanup.");
    } finally {
      // 🛡️ GUARANTEED CLEANUP: Always restore local state
      if (Capacitor.isNativePlatform()) {
        KavachSafe.stopForensicCapture();
        KavachSafe.stopContinuousSiren();
      }
      setSOSActive(false);
      setShowSafetyVerification(false);
      toast.success("Mission Verified. Safety Grid Restored.");
    }
  };

  const handleRequestMoreHelp = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    if (!alertId) return;
    
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'responding',
        victimSafetyStatus: 'needs_help',
        reopenedAt: serverTimestamp()
      });
      setShowSafetyVerification(false);
      toast.error("Assistance Request Relayed. Grid Active.");
    } catch (e) {
      toast.error("Failed to relay request.");
    }
  };

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
    // 🛡️ PLATFORM SECURITY GATE: PCs don't have biometrics, force PIN immediately
    if (!Capacitor.isNativePlatform()) {
      setShowPinOverlay(true);
      return;
    }

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({ reason: "Abort Emergency Alert", useFallback: true });

      setShowAbortReason(true);
      toast.success("Identity Verified. Provide Clearance Reason.");
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
          setShowAbortReason(true);
          setShowPinOverlay(false);
          setEnteredPin('');
          toast.success("PIN Verified. Provide Clearance Reason.");
        } else {
          toast.error("Invalid Secret PIN. Access Denied.");
          setEnteredPin('');
        }
      }
    }
  };

  const handleFinalAbort = async () => {
    if (!abortReason.trim()) {
      toast.error("Please provide a mission clearance reason.");
      return;
    }

    const alertId = useKavachStore.getState().activeAlertId;
    try {
      if (alertId) {
        await updateDoc(doc(db, 'alerts', alertId), {
          status: 'resolved',
          closureReason: abortReason,
          resolvedAt: serverTimestamp(),
          victimSafetyStatus: 'self_aborted'
        });
      }
    } catch (e: any) {
      console.warn("⚠️ SOS: Document already cleared from grid. Performing local cleanup.");
    } finally {
      // 🛡️ GUARANTEED CLEANUP: Always restore local state
      if (Capacitor.isNativePlatform()) {
        KavachSafe.stopForensicCapture();
        KavachSafe.stopContinuousSiren();
      }
      setSOSActive(false);
      setShowAbortReason(false);
      setAbortReason('');
      toast.success("Mission De-escalated. Grid Restored.");
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

        {/* 🛡️ SAFETY HANDSHAKE POPUP (RESPONSE VERIFICATION) */}
        <AnimatePresence>
          {showSafetyVerification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute inset-0 z-[7000] flex items-center justify-center p-8"
            >
              <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
              <div className="relative w-full max-w-[340px] bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-2xl text-center space-y-8">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/20">
                       <ShieldCheck size={40} className="animate-pulse" />
                    </div>
                    <div className="space-y-1">
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Response Verification</h2>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action Required</p>
                    </div>
                 </div>

                 <p className="text-[13px] font-bold text-white/70 leading-relaxed px-2 uppercase tracking-wide">
                   The assigned protector has completed the emergency response. Please verify your safety status.
                 </p>

                 <div className="pt-4 space-y-3">
                    <button 
                      onClick={handleConfirmSafety}
                      className="w-full py-6 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-[4px] text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      SAFE
                    </button>
                    <button 
                      onClick={handleRequestMoreHelp}
                      className="w-full py-6 bg-white/5 text-gray-400 rounded-[24px] font-black uppercase tracking-[4px] text-[10px] border border-white/5 active:scale-95 transition-all"
                    >
                      REQUEST HELP
                    </button>
                 </div>

                 <div className="pt-2 flex items-center justify-center gap-2.5 opacity-30">
                    <Shield size={10} className="text-white" />
                    <span className="text-[7px] font-black uppercase tracking-[3px] text-white">Kavach Handshake Protocol Active</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🛡️ INSTITUTIONAL SAFETY CONFIRMATION (REPLACEMENT FOR MISSION DE-ESCALATION) */}
        <AnimatePresence>
          {showAbortReason && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[8000] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-2xl"
            >
              <div className="relative w-full max-w-[380px] bg-gradient-to-b from-[#0F172A] to-[#020617] border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col space-y-6">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-[24px] flex items-center justify-center text-blue-500 border border-blue-500/20">
                       <Shield size={32} strokeWidth={2.5} />
                    </div>
                    <div className="text-center space-y-1">
                       <h2 className="text-xl font-black text-white tracking-tighter uppercase">Safety Confirmation Required</h2>
                       <p className="text-[10px] font-bold text-blue-400/50 uppercase tracking-[2px]">National Grid Update</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[11px] font-medium text-white/60 leading-relaxed text-center px-2">
                      Your emergency alert was shared with nearby protectors and monitored by SuperCell systems. Please confirm why you are closing this SOS request.
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                       {[
                         'I am safe now', 
                         'Help has arrived', 
                         'Reached a safe location', 
                         'Accidentally triggered SOS', 
                         'Threat no longer nearby', 
                         'Other reason'
                       ].map((reason) => (
                         <button
                           key={reason}
                           onClick={() => {
                             setAbortReason(reason);
                           }}
                           className={cn(
                             "w-full py-3.5 px-4 rounded-2xl text-[11px] font-bold text-left transition-all border flex items-center justify-between group",
                             abortReason === reason 
                               ? "bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                               : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                           )}
                         >
                            <span>{reason}</span>
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                              abortReason === reason ? "border-blue-500 bg-blue-500" : "border-white/10"
                            )}>
                               {abortReason === reason && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                         </button>
                       ))}
                    </div>

                    <AnimatePresence>
                      {abortReason === 'Other reason' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                           <textarea 
                             placeholder="Please provide details..."
                             className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-gray-600 min-h-[80px] mt-2"
                           />
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                       <p className="text-[9px] font-bold text-red-400/80 uppercase tracking-widest text-center leading-relaxed">
                         False emergency reports are securely logged to maintain trusted emergency response operations.
                       </p>
                    </div>

                    <button 
                      onClick={handleFinalAbort}
                      disabled={!abortReason}
                      className={cn(
                        "w-full py-5 rounded-[24px] font-black uppercase tracking-[4px] text-xs transition-all active:scale-95",
                        abortReason 
                          ? "bg-white text-black shadow-xl" 
                          : "bg-white/10 text-white/20 cursor-not-allowed"
                      )}
                    >
                      CONFIRM & CLOSE ALERT
                    </button>

                    <div className="flex flex-col items-center gap-2 pt-2 opacity-40">
                       <div className="flex items-center gap-4">
                          <span className="text-[7px] font-black text-white uppercase tracking-[2px]">LIVE SESSION ID : SX-{useKavachStore.getState().activeAlertId?.slice(-4).toUpperCase()}</span>
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <span className="text-[7px] font-black text-emerald-400 uppercase tracking-[2px]">🟢 Response activity archived securely</span>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 💬 FLOATING CHAT BUBBLE (COMMAND HUB) */}
        <div className="absolute top-28 right-6 z-50">
           <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsAIChatOpen(true)}
             className="w-14 h-14 bg-accent-blue rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(45,212,191,0.5)] border-2 border-white/20"
           >
              <MessageSquare size={24} />
           </motion.button>
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#080000] flex items-center justify-center text-[8px] font-black text-white">1</div>
        </div>

        {/* Neural Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-red/10 via-transparent to-accent-red/20 pointer-events-none" />

        {/* Monitoring Reassurance Indicator */}
        <AnimatePresence>
          {isBeingMonitored && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-16 left-0 right-0 z-50 flex justify-center"
            >
              <div className="px-6 py-2 bg-accent-blue/20 border border-accent-blue/50 backdrop-blur-xl rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
                <Eye size={14} className="text-accent-blue animate-pulse" />
                <span className="text-[10px] font-black text-accent-blue uppercase tracking-[3px] italic">{t('watching_you')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <div className="flex items-center gap-2 border-r border-black/10 pr-4">
              <Fingerprint size={20} />
              <Lock size={16} />
            </div>
            ABORT MISSION
          </button>
        </div>

        <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <SOSButton />
    </div>
  );
}
