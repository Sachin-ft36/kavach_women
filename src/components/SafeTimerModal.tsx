import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldCheck, ChevronRight, AlertCircle, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { cn } from '../lib/utils';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';

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
    // 🔕 Removed top toast popup as requested. The fullscreen 'ARE YOU SAFE?' modal handles the alert.
    useKavachStore.getState().setIsSafeTimerAlertActive(true);
  };

  // Only show expiry toast once when it hits 0, but ensure popup persists on refresh
  useEffect(() => {
    if (isActive && timeLeft === 0 && localStorage.getItem('kavach_safe_timer_end')) {
      const alreadyWarned = sessionStorage.getItem('kavach_timer_warned');
      if (!alreadyWarned) {
        handleTimerExpiry();
        sessionStorage.setItem('kavach_timer_warned', 'true');
      } else {
        // If it was already warned but the timer is still expired (e.g. after refresh)
        // Ensure the popup stays visible
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
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: -20, y: 0 }}
              className="w-full max-w-xs space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={inputHrs === 0 ? '' : inputHrs}
                      onChange={(e) => setInputHrs(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-4 text-center text-white font-black text-2xl outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-gray-700"
                      placeholder="00"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-gray-500 tracking-widest pointer-events-none group-focus-within:text-white/70 transition-colors">
                      HRS
                    </div>
                  </div>
                  <span className="text-white/20 font-black text-2xl mb-1">:</span>
                  <div className="relative flex-1 group">
                    <input
                      type="number"
                      min="0"
                      value={inputMins === 0 ? '' : inputMins}
                      onChange={(e) => setInputMins(parseInt(e.target.value) || 0)}
                      onBlur={handleMinsBlur}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-4 text-center text-white font-black text-2xl outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-gray-700"
                      placeholder="00"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-gray-500 tracking-widest pointer-events-none group-focus-within:text-white/70 transition-colors">
                      MINS
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2 flex-wrap">
                  {[15, 30, 45, 60].map(m => (
                    <button 
                      key={m}
                      onClick={() => {
                        setInputHrs(Math.floor(m / 60));
                        setInputMins(m % 60);
                      }}
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all active:scale-95"
                    >
                      {m >= 60 ? (m % 60 === 0 ? `${m/60} Hr` : `${Math.floor(m/60)}H ${m%60}M`) : `${m} Min`}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setShowConfirmation(true)}
                className="w-full py-5 bg-white text-black rounded-[24px] text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 shadow-2xl"
              >
                <Play size={16} fill="currentColor" /> Start Safe Timer
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xs space-y-8"
            >
              <div className="p-6 bg-accent-red/5 border border-accent-red/20 rounded-3xl space-y-3">
                 <div className="flex items-center justify-center gap-2 text-accent-red">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Fail-Safe Protocol</span>
                 </div>
                 <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed px-4">If you don't confirm safety by timer end, a full SOS alert will be sent to all guardians.</p>
              </div>
              
              <button 
                onClick={stopTimer}
                className="w-full py-5 bg-accent-green text-black rounded-[24px] text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 shadow-xl shadow-accent-green/20"
              >
                <ShieldCheck size={18} /> I am Safe Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] text-center mb-8">
         <p className="text-[8px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest">Recommended for night travels, cab rides, or walking through isolated areas.</p>
      </div>

      {/* Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-[32px] p-8 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 mx-auto flex items-center justify-center mb-2">
                <AlertCircle className="text-accent-red" size={24} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white italic tracking-tight">KAVACH OFFLINE TRACKING</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                  Please read the rules carefully
                </p>
              </div>

              <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-[20px]">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">1</div>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                    Even if you close the app, the timer will keep running natively in the background.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">2</div>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                    If time ends, <span className="text-emerald-500 font-bold">Phase 1</span> begins: App opens and asks for your PIN. You get a 5-minute grace period to confirm safety or extend time.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">3</div>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                    <span className="text-amber-500 font-bold">Phase 1.5:</span> If no response after 5 minutes, your live location is sent via SMS and an auto-call is made to your guardian.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">4</div>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                    <span className="text-accent-red font-bold">Phase 2:</span> If not turned off within 30 minutes after the guardian alert, a <span className="font-bold">Full SOS Alarm</span> is triggered automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={startTimer}
                  className="w-full py-4 bg-accent-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent-red/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} /> I Understand, Start Timer
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="w-full py-4 bg-white/5 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
