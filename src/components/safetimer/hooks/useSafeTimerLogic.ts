import { useState, useEffect } from 'react';
import { useKavachStore } from '../../../store/useKavachStore';
import { KavachNative } from '../../../services/KavachNative';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export function useSafeTimerLogic() {
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

  useEffect(() => {
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
        const smsSent = sessionStorage.getItem('kavach_guardian_sms_sent');
        if (!smsSent) {
          sessionStorage.setItem('kavach_guardian_sms_sent', 'true');
          const store = useKavachStore.getState();
          import('../../../services/sosService').then(({ executeEmergencyBlast }) => {
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

        if (remainingSecs === 60) {
          const pattern = [500, 200, 500, 200, 500, 200, 500, 200, 500];
          if (navigator.vibrate) navigator.vibrate(pattern);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSafeTimerAlertActive]);

  useEffect(() => {
    if (isSafeTimerAlertActive) {
      setMode('verify');
      setPinInput('');
      setError(false);
      try {
        if (navigator.vibrate) {
          navigator.vibrate([800, 200, 800, 200, 800, 200, 800, 200, 800]);
        }
      } catch (e) { console.error("Haptic alarm failed", e); }
    }
  }, [isSafeTimerAlertActive]);

  useEffect(() => {
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

  const checkPin = () => pinInput === safetyPin;

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

  return {
    isSafeTimerAlertActive,
    timerStage,
    graceTimeLeft,
    pinInput,
    setPinInput,
    error,
    mode,
    setMode,
    safetyPin,
    handleExtendClick,
    handleStop,
    selectedReason, setSelectedReason,
    customReason, setCustomReason,
    extendMins, setExtendMins,
    handleExtendConfirm
  };
}
