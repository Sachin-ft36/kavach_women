import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldCheck, ChevronRight, AlertCircle, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { cn } from '../lib/utils';

interface SafeTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SafeTimerModal({ isOpen, onClose }: SafeTimerModalProps) {
  const { setSOSActive } = useKavachStore();
  const [timeLeft, setTimeLeft] = useState(0); // In seconds
  const [isActive, setIsActive] = useState(false);
  const [customMins, setCustomMins] = useState(30);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerExpiry();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerExpiry = () => {
    setIsActive(false);
    setSOSActive(true, null, 'silent'); // Trigger SOS automatically
    toast.error("SAFE TIMER EXPIRED: Automatic Emergency SOS Triggered!", {
      duration: 10000,
      icon: '🚨'
    });
  };

  const startTimer = () => {
    if (customMins <= 0) return;
    setTimeLeft(customMins * 60);
    setIsActive(true);
    toast.success(`Safe Timer Active: Alert will trigger in ${customMins} minutes.`);
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
                {isActive ? formatTime(timeLeft) : `${customMins}:00`}
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
              <div className="grid grid-cols-4 gap-3">
                 {[15, 30, 45, 60].map(m => (
                   <button 
                     key={m}
                     onClick={() => setCustomMins(m)}
                     className={cn(
                       "py-4 rounded-2xl border text-xs font-black transition-all",
                       customMins === m ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10"
                     )}
                   >
                     {m}m
                   </button>
                 ))}
              </div>
              <button 
                onClick={startTimer}
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
                onClick={() => {
                  setIsActive(false);
                  toast.success("Safe at Destination: Timer Deactivated.");
                }}
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
    </div>
  );
}
