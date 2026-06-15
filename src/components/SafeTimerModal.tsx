import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { cn } from '../lib/utils';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';

import SafeTimerSetupView from './safetimer/SafeTimerSetupView';
import SafeTimerActiveView from './safetimer/SafeTimerActiveView';
import SafeTimerConfirmationView from './safetimer/SafeTimerConfirmationView';

interface SafeTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SafeTimerModal({ isOpen, onClose }: SafeTimerModalProps) {
  const { setSOSActive } = useKavachStore();
  const [timeLeft, setTimeLeft] = useState(0); // In seconds
  const [isActive, setIsActive] = useState(false);
  const [inputHrs, setInputHrs] = useState(0);
  const [inputMins, setInputMins] = useState(30);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sync state from localStorage on mount and interval
  useEffect(() => {
    const checkTimer = () => {
      const endTimeStr = localStorage.getItem('kavach_safe_timer_end');
      if (endTimeStr) {
        const endTime = parseInt(endTimeStr, 10);
        const now = Date.now();
        if (endTime > now) {
          setTimeLeft(Math.floor((endTime - now) / 1000));
          setIsActive(true);
        } else {
          setIsActive(true);
          setTimeLeft(0);
        }
      } else {
        setIsActive(false);
      }
    };
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTimerExpiry = () => {
    useKavachStore.getState().setIsSafeTimerAlertActive(true);
  };

  useEffect(() => {
    if (isActive && timeLeft === 0 && localStorage.getItem('kavach_safe_timer_end')) {
      const alreadyWarned = sessionStorage.getItem('kavach_timer_warned');
      if (!alreadyWarned) {
        handleTimerExpiry();
        sessionStorage.setItem('kavach_timer_warned', 'true');
      } else {
        useKavachStore.getState().setIsSafeTimerAlertActive(true);
      }
    }
  }, [isActive, timeLeft]);

  const startTimer = () => {
    const totalMins = (inputHrs * 60) + inputMins;
    if (totalMins <= 0) return;
    const durationMs = totalMins * 60 * 1000;
    const endTime = Date.now() + durationMs;

    localStorage.setItem('kavach_safe_timer_end', endTime.toString());
    sessionStorage.removeItem('kavach_timer_warned');
    setTimeLeft(totalMins * 60);
    setIsActive(true);
    setShowConfirmation(false);

    if (Capacitor.isNativePlatform()) {
      KavachSafe.startSafeTimer({ durationMins: totalMins }).catch(console.error);
    }

    toast.success(`Safe Timer Active: Tracking started for ${totalMins} mins.`);
  };

  const stopTimer = () => {
    localStorage.removeItem('kavach_safe_timer_end');
    sessionStorage.removeItem('kavach_timer_warned');
    setIsActive(false);
    setTimeLeft(0);

    if (Capacitor.isNativePlatform()) {
      KavachSafe.stopSafeTimer().catch(console.error);
    }

    toast.success("Safe at Destination: Timer Deactivated.");
  };

  const handleMinsBlur = () => {
    if (inputMins >= 60) {
      const extraHrs = Math.floor(inputMins / 60);
      const remainingMins = inputMins % 60;
      setInputHrs(prev => prev + extraHrs);
      setInputMins(remainingMins);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0A0A0B] flex flex-col p-6 pt-12 overflow-hidden font-sans">
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onClose}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white flex items-center gap-2"
        >
          <ChevronRight size={18} className="rotate-180" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <div className="px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic">Safety Timer Active</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
        <div className="relative">
          <div className={cn(
            "w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500",
            isActive ? "border-accent-red animate-pulse bg-accent-red/5" : "border-white/10 bg-white/5"
          )}>
            <Clock size={48} className={cn("mb-4", isActive ? "text-accent-red" : "text-gray-500")} />
            <h2 className="text-5xl font-black text-white italic tracking-tighter">
              {isActive ? formatTime(timeLeft) : `${Math.floor(((inputHrs * 60) + inputMins) / 60).toString().padStart(2, '0')}:${(((inputHrs * 60) + inputMins) % 60).toString().padStart(2, '0')}`}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
              {isActive ? "Remaining Time" : "Set Duration"}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isActive ? (
            <SafeTimerSetupView
              inputHrs={inputHrs}
              inputMins={inputMins}
              setInputHrs={setInputHrs}
              setInputMins={setInputMins}
              handleMinsBlur={handleMinsBlur}
              setShowConfirmation={setShowConfirmation}
            />
          ) : (
            <SafeTimerActiveView stopTimer={stopTimer} />
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] text-center mb-8">
        <p className="text-[8px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest">Recommended for night travels, cab rides, or walking through isolated areas.</p>
      </div>

      <SafeTimerConfirmationView
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        startTimer={startTimer}
      />
    </div>
  );
}
