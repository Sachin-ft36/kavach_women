import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { KavachNative } from '../services/KavachNative';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export default function SafeTimerPopup() {
  const isSafeTimerAlertActive = useKavachStore(state => state.isSafeTimerAlertActive);
  const setIsSafeTimerAlertActive = useKavachStore(state => state.setIsSafeTimerAlertActive);
  const safetyPin = useKavachStore(state => state.safetyPin);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const [mode, setMode] = useState<'verify' | 'extend'>('verify');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [extendMins, setExtendMins] = useState(30);
  const [graceTimeLeft, setGraceTimeLeft] = useState(300);
  const [timerStage, setTimerStage] = useState<'grace' | 'sos'>('grace');

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  React.useEffect(() => {
    if (!isSafeTimerAlertActive) return;

    const timerEndStr = localStorage.getItem('kavach_safe_timer_end');
    if (!timerEndStr) return;

    const originalEnd = parseInt(timerEndStr, 10);
    const graceEnd = originalEnd + (5 * 60 * 1000);
    const sosEnd = graceEnd + (10 * 60 * 1000);

    const interval = setInterval(() => {
      const now = Date.now();
      
      if (now >= graceEnd) {
        setTimerStage('sos');
        // Send SMS/Call ONCE
        const smsSent = sessionStorage.getItem('kavach_guardian_sms_sent');
        if (!smsSent) {
          sessionStorage.setItem('kavach_guardian_sms_sent', 'true');
          const store = useKavachStore.getState();
          import('../services/sosService').then(({ executeEmergencyBlast }) => {
            executeEmergencyBlast(store.user, store.userPos, { skipCloud: true, source: 'safe_timer' });
            toast.error("GUARDIANS ALERTED VIA SMS & CALL", { duration: 5000 });
          });
        }

        const remainingSosMs = sosEnd - now;
        if (remainingSosMs <= 0) {
          setGraceTimeLeft(0);
          clearInterval(interval);
          
          localStorage.removeItem('kavach_safe_timer_end');
          sessionStorage.removeItem('kavach_timer_warned');
          sessionStorage.removeItem('kavach_guardian_sms_sent');

          if (Capacitor.isNativePlatform()) {
            KavachNative.stopSafeTimer();
          }

          useKavachStore.getState().setSOSActive(true, null, 'silent');
          useKavachStore.getState().setIsSafeTimerAlertActive(false);
        } else {
          setGraceTimeLeft(Math.floor(remainingSosMs / 1000));
        }
      } else {
        setTimerStage('grace');
        const remainingGraceMs = graceEnd - now;
        const remainingSecs = Math.floor(remainingGraceMs / 1000);
        setGraceTimeLeft(remainingSecs);

        // Vibrate heavily 5 times at exactly 1 minute (60s) remaining
        if (remainingSecs === 60) {
          const pattern = [500, 200, 500, 200, 500, 200, 500, 200, 500];
          if (Capacitor.isNativePlatform()) {
            if (navigator.vibrate) navigator.vibrate(pattern);
          } else {
            if (navigator.vibrate) navigator.vibrate(pattern);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSafeTimerAlertActive]);

  React.useEffect(() => {
    if (isSafeTimerAlertActive) {
      setMode('verify');
      setPinInput('');
      setError(false);

      // 📳 AGGRESSIVE HAPTIC ALARM: Vibrate heavily immediately when timer expires so the user doesn't miss it
      try {
        if (navigator.vibrate) {
          // Vibrate for 800ms, pause 200ms, repeat 5 times (Extremely noticeable pattern)
          navigator.vibrate([800, 200, 800, 200, 800, 200, 800, 200, 800]);
        }
      } catch (e) { console.error("Haptic alarm failed", e); }
    }
  }, [isSafeTimerAlertActive]);

  React.useEffect(() => {
    if (pinInput.length === 4 && mode === 'verify') {
      if (pinInput !== safetyPin) {
        setError(true);
        toast.error("Invalid PIN", { description: "Verification failed." });
        setTimeout(() => {
          setPinInput('');
          setError(false);
        }, 600);
      }
    }
  }, [pinInput, safetyPin, mode]);

  if (!isSafeTimerAlertActive) return null;

  const checkPin = () => {
    if (pinInput === safetyPin) return true;
    return false;
  };

  const handleStop = () => {
    if (checkPin()) {
      localStorage.removeItem('kavach_safe_timer_end');
      sessionStorage.removeItem('kavach_timer_warned');
      sessionStorage.removeItem('kavach_guardian_sms_sent');

      if (Capacitor.isNativePlatform()) {
        KavachNative.stopSafeTimer();
      }
      setIsSafeTimerAlertActive(false);
      setPinInput('');
      toast.success("Identity Verified", { description: "Safe Timer Stopped." });
    }
  };

  const handleExtendClick = () => {
    if (checkPin()) {
      setMode('extend');
    }
  };

  const handleExtendConfirm = (mins: number, reason: string) => {
    const durationMs = mins * 60 * 1000;
    const endTime = Date.now() + durationMs;
    localStorage.setItem('kavach_safe_timer_end', endTime.toString());
    sessionStorage.removeItem('kavach_timer_warned');

    if (Capacitor.isNativePlatform()) {
      KavachNative.startSafeTimer({ durationMins: mins });
    }
    setIsSafeTimerAlertActive(false);
    setPinInput('');
    setMode('verify');
    toast.success("Timer Extended", { description: `Added ${mins} mins (${reason}).` });
  };

  return (
    <AnimatePresence>
      {isSafeTimerAlertActive && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-[90%] max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Background pulse effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>

              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Are You Safe?</h2>
              <p className="text-sm text-gray-400 mb-4 font-medium">
                Your safe timer has expired. Please enter your Security PIN to confirm your safety.
              </p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-2 mb-6 flex flex-col items-center">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">
                  {timerStage === 'grace' ? 'Guardians Alert In' : 'SOS Alert In'}
                </span>
                <span className="text-4xl font-black text-red-500 tabular-nums tracking-tight animate-pulse">
                  {formatTime(graceTimeLeft)}
                </span>
              </div>

              <div className="w-full flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300
                      ${error ? 'bg-red-500/20 text-red-500 border border-red-500/50' :
                        pinInput[index]
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 border border-gray-700 text-gray-500'
                      }`}
                  >
                    {pinInput[index] ? '•' : ''}
                  </div>
                ))}
              </div>

              {mode === 'verify' ? (
                <>
                  <div className="grid grid-cols-3 gap-3 w-full mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          if (pinInput.length < 4) setPinInput(p => p + num);
                        }}
                        className="h-14 rounded-xl bg-gray-800 active:bg-gray-700 text-white font-bold text-xl transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="col-start-2">
                      <button
                        onClick={() => {
                          if (pinInput.length < 4) setPinInput(p => p + '0');
                        }}
                        className="w-full h-14 rounded-xl bg-gray-800 active:bg-gray-700 text-white font-bold text-xl transition-colors"
                      >
                        0
                      </button>
                    </div>
                    <button
                      onClick={() => setPinInput(p => p.slice(0, -1))}
                      className="h-14 rounded-xl bg-red-500/10 active:bg-red-500/20 text-red-500 font-bold flex items-center justify-center transition-colors"
                    >
                      DEL
                    </button>
                  </div>

                  <div className="w-full flex flex-col gap-3">
                    <button
                      disabled={pinInput !== safetyPin}
                      onClick={handleExtendClick}
                      className="w-full h-14 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:text-gray-600 font-bold uppercase tracking-widest text-sm transition-all"
                    >
                      Extend Timer
                    </button>
                    <button
                      disabled={pinInput !== safetyPin}
                      onClick={handleStop}
                      className="w-full h-14 rounded-xl bg-white disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black uppercase tracking-widest text-sm transition-all"
                    >
                      Confirm I am Safe
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-gray-300 font-bold text-sm text-left">Select Reason:</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Traffic Jam', icon: '🚦' },
                      { label: 'Metro Delayed', icon: '🚇' },
                      { label: 'Bad Weather', icon: '🌧️' },
                      { label: 'Taking Detour', icon: '🚶' },
                      { label: 'Running Late', icon: '⏳' },
                      { label: 'Other', icon: '✏️' },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedReason(opt.label)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${selectedReason === opt.label
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                          }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>

                  {selectedReason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Type your reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  )}

                  <h3 className="text-gray-300 font-bold text-sm text-left mt-2">Time to Extend:</h3>
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl p-2 border border-gray-700">
                    <button onClick={() => setExtendMins(m => Math.max(5, m - 5))} className="w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-xl transition-colors">-</button>
                    <div className="text-2xl font-black text-white tracking-tight">{extendMins} <span className="text-sm font-bold text-gray-400">mins</span></div>
                    <button onClick={() => setExtendMins(m => Math.min(180, m + 5))} className="w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-xl transition-colors">+</button>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setMode('verify');
                        setPinInput('');
                      }}
                      className="flex-1 py-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
                      onClick={() => handleExtendConfirm(extendMins, selectedReason === 'Other' ? customReason.trim() : selectedReason!)}
                      className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none"
                    >
                      Start
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
