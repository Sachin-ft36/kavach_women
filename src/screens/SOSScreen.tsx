import React from 'react';
import SOSButton from '../components/SOSButton';
import { Lock, Fingerprint, Shield, AlertTriangle, X, Mic, Radio, Signal, ShieldCheck, Eye, MessageSquare, Phone, User, UserCheck, Volume2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';
import KavachAIChat from '../components/KavachAIChat';
import SecurityRadarMap from '../components/maps/SecurityRadarMap';
import { useCall } from '../contexts/CallContext';

interface SOSScreenProps {
  isLocked: boolean;
  activeTab: string;
  isGhostMode: boolean;
  handleManualUnlock: () => void | Promise<void>;
}

export default function SOSScreen({ isLocked, activeTab, isGhostMode, handleManualUnlock }: SOSScreenProps) {
  const { t } = useLanguage();
  const { role, isSOSActive, activeAlertId, setSOSActive, triggerMethod, safetyPin, userPos, activeRadius, setActiveRadius, handshakeCode } = useKavachStore();

  // 🛡️ TACTICAL PURITY: Responders must NEVER see the victim's emergency UI.
  // We check both the store and the persistent storage to prevent identity leakage.
  const storedRole = localStorage.getItem('kavach_user_role');
  if (role === 'protector' || storedRole === 'protector') return null;

  const [showPinOverlay, setShowPinOverlay] = React.useState(false);
  const [showAbortReason, setShowAbortReason] = React.useState(false);
  const [abortReason, setAbortReason] = React.useState('');
  const [enteredPin, setEnteredPin] = React.useState('');
  const [nearbyCount, setNearbyCount] = React.useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [smsStatus, setSmsStatus] = React.useState('INITIALIZING...');
  const [protectors, setProtectors] = React.useState<any[]>([]);
  const recognitionRef = React.useRef<any>(null);
  const { initiateCall, callState } = useCall();

  // 🕶️ STEALTH DISGUISE DECOY STATE
  const [isStealthDisguised, setIsStealthDisguised] = React.useState(false);
  const [calcInput, setCalcInput] = React.useState('');

  // 📡 SOS DISPATCH HANDSHAKE SEQUENCE
  React.useEffect(() => {
    if (isSOSActive) {
      const smsTimer1 = setTimeout(() => setSmsStatus('SENDING...'), 2000);
      const smsTimer2 = setTimeout(() => setSmsStatus('DELIVERED'), 5000);
      
      return () => {
        clearTimeout(smsTimer1);
        clearTimeout(smsTimer2);
      };
    } else {
      setSmsStatus('INITIALIZING...');
    }
  }, [isSOSActive]);

  // ⚡ TACTICAL RANGE HARDENING: Fixed 5KM Scanning (Optimized for performance)
  React.useEffect(() => {
    if (isSOSActive && activeAlertId && activeRadius < 5.0) {
      setActiveRadius(5.0);
      
      // 🛡️ SYNC FINAL RADIUS TO NATIONAL GRID IMMEDIATELY
      setDoc(doc(db, 'alerts', activeAlertId), {
        dispatchRadius: 5.0,
        lastEscalatedAt: serverTimestamp(),
        escalationReason: 'MAX_RANGE_FORCE_OVERRIDE'
      }, { merge: true }).catch(e => console.error("🛰️ RADIUS_FORCE_SYNC_ERROR:", e));

      console.log("⚡ KAVACH: Search Perimeter Hardened to 5.0KM (Max Range)");
    }
  }, [isSOSActive, activeAlertId, activeRadius]);

  // 📡 PROTECTOR RADAR LOGIC (ADAPTIVE RANGE SCAN)
  React.useEffect(() => {
    let unsubscribe: () => void = () => { };

    if (isSOSActive && userPos) {
      console.log(`📡 RADAR: Scanning for local protectors within ${activeRadius}KM tactical tier...`);
      const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allFound = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const inRange = allFound.filter((data: any) => {
          if (!data.coords) return false;
          
          // 🎖️ ELITE PRIORITY BYPASS: Army/Police always visible up to 5km
          const occupation = data.protectorVetting?.occupation || '';
          const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(role => 
            occupation.toLowerCase().includes(role.toLowerCase())
          );

          const dist = calculateDistance(userPos[0], userPos[1], data.coords[0], data.coords[1]);
          return isElite ? (dist <= 5.0) : (dist <= activeRadius);
        });

        setNearbyCount(inRange.length);
        setProtectors(inRange);
        console.log(`📡 RADAR UPDATE: Found ${inRange.length} verified protectors in tactical range.`);
      });
    }

    return () => {
      console.log("📡 RADAR: Disengaging tactical scan.");
      unsubscribe();
      setProtectors([]);
    };
  }, [isSOSActive, userPos, activeRadius]);

  // 📡 MISSION CRITICAL: 2-Second High-Precision Location Uplink
  React.useEffect(() => {
    let updateTimer: any;
    if (isSOSActive && activeAlertId && userPos) {
      updateTimer = setInterval(async () => {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          
          await setDoc(doc(db, 'alerts', activeAlertId), {
            latitude: userPos[0],
            longitude: userPos[1],
            'location.latitude': userPos[0],
            'location.longitude': userPos[1],
            lastLocationUpdate: serverTimestamp()
          }, { merge: true });
          console.log("🛰️ KAVACH UPLINK: Precision coordinates transmitted.");
        } catch (e) {
          console.error("🛰️ UPLINK_SYNC_ERROR:", e);
        }
      }, 2000); // 🕒 2-Second Tactical Interval
    }
    return () => clearInterval(updateTimer);
  }, [isSOSActive, activeAlertId, userPos]);

  // 🎙️ MISSION CRITICAL: LIVE TRANSCRIPT ENGINE (RETIRED DUE TO HARDWARE CLASH)
  // Transcription during SOS is disabled to prioritize high-fidelity native recording.
  // This prevents the 'Mic Busy' error on critical SOS interceptors.

  const [isBeingMonitored, setIsBeingMonitored] = React.useState(false);
  const [showSafetyVerification, setShowSafetyVerification] = React.useState(false);
  const [activeAlertData, setActiveAlertData] = React.useState<any>(null);

  // 📡 ACTIVE MISSION SYNC: Real-time Alert Data Stream
  React.useEffect(() => {
    let unsubscribe = () => {};

    if (isSOSActive && activeAlertId) {
      console.log(`🛰️ SOS GRID: Establishing Uplink for Mission [${activeAlertId}]`);
      const alertRef = doc(db, 'alerts', activeAlertId);
      unsubscribe = onSnapshot(alertRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          console.log(`🛡️ SOS GRID: Mission Status Update [${data.status}]`, data);
          setActiveAlertData(data);
          
          if (data.isBeingMonitored && !isBeingMonitored) {
             if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
             toast.info("COMMAND CENTER: TACTICAL UPLINK ESTABLISHED.");
          }
          setIsBeingMonitored(!!data.isBeingMonitored);

          // 🛰️ SYNC HANDSHAKE CODE FROM CLOUD
          if (data.handshakeCode && !useKavachStore.getState().handshakeCode) {
            useKavachStore.setState({ handshakeCode: data.handshakeCode });
          }

          // 🛡️ SAFETY HANDSHAKE DETECTION (Inclusive Check)
          if (data.status === 'rescued_pending_victim_clearance' || data.verification?.verifiedBy) {
             console.log("🛡️ SOS GRID: Safety Verification Required - Opening HUD");
             setShowSafetyVerification(true);
          } else {
             setShowSafetyVerification(false);
          }
        }
      });
    }
    return () => unsubscribe();
  }, [isSOSActive, activeAlertId]); // Removed isBeingMonitored to prevent flicker/resub

  const handleConfirmSafety = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    setShowSafetyVerification(false);
    
    // 🛡️ FAST-TRACK RESOLUTION: Protector already verified, just close it
    try {
      toast.info("Finalizing Mission Clearance...");
      await setSOSActive(false, alertId, triggerMethod, 'Verified Safe: Rescue Completed');
      toast.success("Mission Verified. Safety Grid Restored.");
    } catch (e) {
      console.error("Safety Clearance Error:", e);
      // Fallback: Force local state reset if network fails
      setSOSActive(false);
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

  const [isAborting, setIsAborting] = React.useState(false);

  const handleFinalAbort = async () => {

    if (!abortReason.trim()) {
      toast.error("Please provide a mission clearance reason.");
      return;
    }

    setIsAborting(true);
    const alertId = useKavachStore.getState().activeAlertId;

    // 🛡️ PHASE 1: INSTANT LOCAL HARDWARE RELEASE (Optimistic UI)
    // We kill the siren and recording IMMEDIATELY so the user isn't stuck with noise/hangs.
    if (Capacitor.isNativePlatform()) {
      KavachSafe.stopForensicCapture();
      KavachSafe.stopContinuousSiren();
    }
    
    // 🛡️ PHASE 2: INSTANT LOCAL SNAPBACK (Optimistic UI)
    // We clear the local state first so the UI changes within milliseconds.
    setSOSActive(false); 
    setShowAbortReason(false);
    setAbortReason('');
    setIsAborting(false);
    toast.success("Mission De-escalated. Grid Restored.");

    // 🛡️ PHASE 3: GRID SYNC & ACCOUNTABILITY (Background)
    try {
      await setSOSActive(false, alertId, triggerMethod, abortReason);
    } catch (e: any) {
      console.warn("⚠️ SOS Grid Sync: Background update failed.", e);
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
          onClick={async () => {
            try {
              await handleManualUnlock();
            } catch (e) {
              setShowPinOverlay(true);
              toast.error("Biometric handshake failed. Fallback to PIN active.");
            }
          }}
          className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-4 active:scale-95 transition-all shadow-2xl"
        >
          <Fingerprint size={20} /> {t('use_biometrics')}
        </button>
      </div>
    );
  }

  if (isSOSActive) {
    if (isStealthDisguised) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col justify-end p-6 select-none font-sans text-white">
          {/* Decoy Calculator Display */}
          <div className="flex-1 flex flex-col justify-end items-end mb-8 px-4">
            <span className="text-gray-400 text-lg font-light tracking-wide min-h-[28px]">{calcInput || '0'}</span>
            <span className="text-white text-5xl font-extralight tracking-tighter mt-3 truncate max-w-full">
              {(() => {
                try {
                  if (!calcInput) return '0';
                  if (/^[0-9\+\-\*\/\.\s]+$/.test(calcInput)) {
                    // eslint-disable-next-line no-eval
                    const result = eval(calcInput);
                    return String(result).slice(0, 12);
                  }
                  return '0';
                } catch (e) {
                  return '0';
                }
              })()}
            </span>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-4 mb-8 max-w-md mx-auto w-full">
            {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '🔓'].map((key) => {
              const isOperator = ['/', '*', '-', '+', '='].includes(key);
              const isClear = ['C', '(', ')'].includes(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'C') {
                      setCalcInput('');
                    } else if (key === '=') {
                      // Handled in dynamic eval display
                    } else if (key === '🔓') {
                      setIsStealthDisguised(false);
                      setCalcInput('');
                      toast.success("DISGUISE DISENGAGED");
                    } else {
                      const nextInput = calcInput + key;
                      setCalcInput(nextInput);
                      // Custom trigger: entering safetyPin (e.g. 1234) escapes disguise
                      if (nextInput === safetyPin) {
                        setIsStealthDisguised(false);
                        setCalcInput('');
                        toast.success("DISGUISE DISENGAGED");
                      }
                    }
                  }}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90",
                    isOperator ? "bg-amber-500 text-white active:bg-amber-400" :
                    isClear ? "bg-gray-700 text-gray-200 active:bg-gray-600" :
                    "bg-gray-800 text-white active:bg-gray-700"
                  )}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[5000] bg-[#080000] flex flex-col p-6 overflow-hidden">
        {/* PIN Pad Overlay */}
        {showPinOverlay && (
          <div className="absolute inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex flex-col p-8">
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
            </div>
          )}

        {/* 🛡️ SAFETY HANDSHAKE POPUP (RESPONSE VERIFICATION) */}
        {showSafetyVerification && (
          <div className="absolute inset-0 z-[7000] flex items-center justify-center p-8">
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
          </div>
        )}

        {/* 🛡️ INSTITUTIONAL SAFETY CONFIRMATION */}
        <AnimatePresence>
          {showAbortReason && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[8000] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-2xl"
            >
              <div className="relative w-full max-w-[400px] max-h-[92vh] bg-gradient-to-b from-[#0F172A] to-[#020617] border border-white/10 rounded-[32px] sm:rounded-[40px] p-5 sm:p-8 shadow-2xl flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-2xl sm:rounded-[24px] flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Shield size={28} className="sm:w-8 sm:h-8" strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tighter uppercase leading-none">Safety Confirmation</h2>
                    <p className="text-[7px] sm:text-[8px] font-bold text-blue-400/50 uppercase tracking-[2px]">National Grid Update</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-6">
                  <p className="text-[10px] sm:text-[11px] font-medium text-white/60 leading-relaxed text-center px-2">
                    {activeAlertData?.status === 'rescued_pending_victim_clearance' 
                      ? "The Protector has confirmed your safety. Please provide a final closure note."
                      : "Please confirm why you are closing this SOS request."
                    }
                  </p>

                  <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
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
                        onClick={() => setAbortReason(reason)}
                        className={cn(
                          "w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-bold text-left transition-all border flex items-center justify-between group",
                          abortReason === reason 
                            ? "bg-blue-600/20 border-blue-500 text-white" 
                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        <span>{reason}</span>
                        <div className={cn(
                          "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center transition-all",
                          abortReason === reason ? "border-blue-500 bg-blue-500" : "border-white/10"
                        )}>
                          {abortReason === reason && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {abortReason === 'Other reason' && (
                    <div className="mt-2">
                      <textarea 
                        placeholder="Please provide details..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-gray-600 min-h-[80px]"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-red-500/5 border border-red-500/10 rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[9px] font-bold text-red-400/80 uppercase tracking-widest text-center leading-relaxed">
                      False reports are logged for emergency accountability.
                    </p>
                  </div>

                  <button 
                    onClick={handleFinalAbort}
                    disabled={!abortReason || isAborting}
                    className={cn(
                      "w-full py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-black uppercase tracking-[3px] sm:tracking-[4px] text-[10px] sm:text-xs transition-all active:scale-95",
                      abortReason 
                        ? "bg-white text-black shadow-xl" 
                        : "bg-white/10 text-white/20 cursor-not-allowed",
                      isAborting && "opacity-50 cursor-wait"
                    )}
                  >
                    {isAborting ? 'PROCESSING...' : 'CONFIRM & CLOSE ALERT'}
                  </button>

                  <div className="flex flex-col items-center gap-1.5 pt-1 opacity-30">
                    <div className="flex items-center gap-3">
                      <span className="text-[6px] sm:text-[7px] font-black text-white uppercase tracking-[2px]">SESSION ID: {useKavachStore.getState().activeAlertId?.slice(-4).toUpperCase()}</span>
                      <div className="w-0.5 h-0.5 bg-white rounded-full" />
                      <span className="text-[6px] sm:text-[7px] font-black text-emerald-400 uppercase tracking-[2px]">Archived Securely</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 💬 FLOATING CHAT BUBBLE (COMMAND HUB) */}
        <div className="absolute top-28 right-6 z-50">
           <button
             onClick={() => setIsAIChatOpen(true)}
             className="w-14 h-14 bg-accent-blue rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(45,212,191,0.5)] border-2 border-white/20 active:scale-95 transition-all"
           >
              <MessageSquare size={24} />
           </button>
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#080000] flex items-center justify-center text-[8px] font-black text-white">1</div>
        </div>

        {/* 🛰️ TACTICAL RADAR GRID (DYNAMIC VISUALIZATION) */}
        <div className="absolute inset-0 z-0">
           <SecurityRadarMap protectors={protectors} activeRadius={activeRadius} />
           <div className="absolute inset-0 bg-gradient-to-b from-[#080000]/60 via-transparent to-[#080000]/80 pointer-events-none" />
        </div>

        {/* Monitoring Reassurance Indicator */}
        {isBeingMonitored && (
          <div className="absolute top-16 left-0 right-0 z-50 flex justify-center">
            <div className="px-6 py-2 bg-accent-blue/20 border border-accent-blue/50 backdrop-blur-xl rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
              <Eye size={14} className="text-accent-blue" />
              <span className="text-[10px] font-black text-accent-blue uppercase tracking-[3px] italic">{t('watching_you')}</span>
            </div>
          </div>
        )}

        {/* Header: Recording Stats */}
        <div className="relative z-10 flex items-center justify-between pt-2">
          <button 
            onClick={() => {
              setIsStealthDisguised(true);
              toast.success("STEALTH DISGUISE ENGAGED");
            }}
            className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-full"
          >
            <Eye size={10} className="text-white/40" />
            <span className="text-[8px] font-black uppercase tracking-[2px] text-white/40 italic">STEALTH DISGUISE</span>
          </button>

          {/* Protector Radar Count */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent-blue/10 border border-accent-blue/30 rounded-full">
            <Shield size={8} className="text-accent-blue" />
            <span className="text-[7px] font-black text-accent-blue uppercase tracking-widest">
              {nearbyCount} IN RANGE
            </span>
          </div>

          <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[6px] font-bold text-gray-500 uppercase tracking-widest">
             {triggerMethod?.toUpperCase() || 'MANUAL'}
          </div>
        </div>

        {/* Main Pulsator Copy (Centered) - Now Composed */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative z-10 pointer-events-none">
          <div className="relative">
            <div className="w-36 h-36 bg-white/[0.03] rounded-full flex flex-col items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl">
              <Shield size={36} className="text-white/20" />
              <p className="mt-3 text-white/20 font-black uppercase tracking-[3px] text-[7px]">GRID ACTIVE</p>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4 pointer-events-auto">
            <div className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[20px] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-green-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Uplink Status</span>
                </div>
                <span className="text-[7px] font-black text-green-500 uppercase italic">STABLE</span>
              </div>
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between text-[6px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Police Dispatch</span>
                  <span className={cn(
                    "transition-colors duration-500", 
                    !Capacitor.isNativePlatform() ? "text-gray-600" : (callState === 'connected' ? "text-green-500 font-black" : "text-white italic")
                  )}>
                    {Capacitor.isNativePlatform() 
                      ? (callState === 'connected' ? '🛡️ SECURED' : callState === 'calling' ? 'DIALING...' : callState === 'ringing' ? 'RINGING...' : 'ENROUTE') 
                      : 'UNAVAILABLE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[6px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Guardian SMS</span>
                  <span className={cn(
                    "transition-colors duration-500", 
                    !Capacitor.isNativePlatform() ? "text-gray-600" : (smsStatus === 'DELIVERED' ? "text-green-500" : "text-white italic")
                  )}>
                    {Capacitor.isNativePlatform() ? smsStatus : 'UNAVAILABLE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[6px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Audio Storage</span>
                  <span className="text-white italic">LOGGING...</span>
                </div>
              </div>
            </div>
            
            {/* 🛡️ RESPONDER HUB: Live Tactical Support */}
            <AnimatePresence mode="wait">
              {(activeAlertData?.activeResponders?.length > 0) && (
                <motion.div 
initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[2px] flex items-center gap-1.5">
                      <ShieldCheck size={12} /> {(() => {
                        const unique = activeAlertData.activeResponders.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i);
                        return unique.length;
                      })()} Protector{activeAlertData.activeResponders.length > 1 ? 's' : ''} Responding
                    </p>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping delay-75" />
                    </div>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {activeAlertData.activeResponders.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i).map((responder: any) => (
                      <motion.div 
                        key={responder.uid}
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-3 rounded-[24px] flex items-center justify-between shadow-xl relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                             <UserCheck size={20} className="text-emerald-500" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[11px] font-black text-white uppercase italic tracking-tight">{responder.name}</h4>
                              
                              {(responder.xp || 0) >= 25000 && (
                                <div className="px-1.5 py-0.5 bg-emerald-500 rounded-full flex items-center shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                  <ShieldCheck size={6} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                              <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Active Dispatch</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                          <button 
                            onClick={() => {
                              console.log("📞 KAVACH UI: Secure Link Initiated for", responder.name);
                              initiateCall(responder.uid, responder.name);
                            }}
                            className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-90 transition-all hover:bg-emerald-400"
                          >
                             <Phone size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🛡️ TACTICAL HANDSHAKE HUB */}
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="p-4 bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-[20px] flex flex-col items-center justify-center space-y-1.5"
            >
               <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest leading-none">Handshake Code</span>
               <div className="flex items-center gap-3 py-0.5">
                  <Fingerprint size={16} className="text-blue-400" />
                  <span className="text-3xl font-black text-white italic tracking-[0.2em] ml-1">
                     {handshakeCode || activeAlertData?.verification?.handshakeCode || '----'}
                  </span>
               </div>
               <p className="text-[6px] font-bold text-blue-400/50 uppercase tracking-widest text-center px-4 leading-tight">
                  Share ONLY with verified protectors.
               </p>
            </motion.div>
          </div>
        </div>

        {/* 🚨 MISSION CONTROL HUB (RE-ENGINEERED) */}
        <div className="relative z-10 mt-auto pb-12 space-y-4">
          
          {/* 🚨 ACOUSTIC PANIC CONTROLLER */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={async () => {
                await KavachSafe.startContinuousSiren();
                (window as any)._kavach_manual_siren = true;
                toast.error("MANUAL PANIC ALARM ACTIVE", { icon: '🚨', duration: 5000 });
              }}
              className="py-5 bg-red-600/20 border-2 border-red-500/30 rounded-[32px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            >
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <AlertTriangle size={20} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[3px] text-red-500 italic">Panic Alarm</span>
            </button>

            <button 
              onClick={async () => {
                await KavachSafe.stopContinuousSiren();
                (window as any)._kavach_manual_siren = false;
                toast.success("All Audible Alarms Silenced.");
              }}
              className="py-5 bg-white/5 border-2 border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/40">
                <Volume2 size={20} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 italic">Stop Siren</span>
            </button>
          </div>

          {/* 🛡️ CENTRAL SAFETY VAULT: ABORT MISSION */}
          <div className="p-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl">
            <button
              onClick={handleAbort}
              className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-[5px] text-xs flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              <div className="flex items-center gap-2 border-r border-black/10 pr-4">
                <Fingerprint size={20} />
                <Shield size={16} />
              </div>
              ABORT MISSION
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-[7px] font-black text-white/20 uppercase tracking-[4px] italic">Kavach Neural Link Active • SECURE</p>
          </div>
        </div>

        <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
        
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 2px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <SOSButton />
    </div>
  );
}
