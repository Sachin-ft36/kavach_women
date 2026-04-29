import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, User, MessageCircle, MoreHorizontal, Grid, Mic, Volume2, Plus, UserPlus, Video } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

interface FakeCallUIProps {
  callerName?: string;
  callerNumber?: string;
  onEnd: () => void;
}

export default function FakeCallUI({ 
  callerName = "Papa (Guardian)", 
  callerNumber = "+91 98765 43210",
  onEnd 
}: FakeCallUIProps) {
  const [status, setStatus] = useState<'ringing' | 'connected'>('ringing');
  const [timer, setTimer] = useState(0);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 🎵 REAL RINGTONE SIMULATION
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
    audio.loop = true;
    ringtoneRef.current = audio;
    
    if (status === 'ringing') {
      audio.play().catch(e => console.log("Audio play blocked. User interaction required."));
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
      if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
    };
  }, [status]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setStatus('connected');
    if (ringtoneRef.current) {
        ringtoneRef.current.pause();
    }
  };

  // 🛰️ TACTICAL PORTAL: Covers entire screen regardless of hierarchy
  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black text-white flex flex-col font-sans select-none"
    >
      {/* ── Status Bar Spacer ── */}
      <div className="h-12 w-full bg-black" />

      {/* ── Caller Info ── */}
      <div className="pt-16 pb-8 flex flex-col items-center">
        <div className="w-28 h-28 bg-[#1c1c1e] rounded-full flex items-center justify-center mb-6 shadow-2xl overflow-hidden border border-white/5">
          <User size={56} className="text-[#3a3a3c]" />
        </div>
        <h1 className="text-3xl font-normal mb-1">{callerName}</h1>
        <p className="text-lg text-gray-400 font-light tracking-wide">
          {status === 'ringing' ? 'mobile' : formatTime(timer)}
        </p>
      </div>

      <div className="flex-1" />

      {/* ── In-Call Controls ── */}
      <AnimatePresence>
        {status === 'connected' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-3 gap-y-10 px-10 mb-20"
          >
            <CallAction icon={<Mic size={28} />} label="mute" />
            <CallAction icon={<Grid size={28} />} label="keypad" />
            <CallAction icon={<Volume2 size={28} />} label="speaker" />
            <CallAction icon={<Plus size={28} />} label="add call" />
            <CallAction icon={<Video size={28} />} label="FaceTime" />
            <CallAction icon={<UserPlus size={28} />} label="contacts" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Buttons ── */}
      <div className="pb-24 px-12">
        {status === 'ringing' ? (
          <div className="flex justify-between items-center w-full max-w-sm mx-auto">
            {/* Decline */}
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={onEnd}
                className="w-18 h-18 bg-[#ff3b30] rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all outline-none"
              >
                <PhoneOff size={32} className="text-white rotate-[135deg]" />
              </button>
              <span className="text-[11px] font-normal text-white">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={handleAnswer}
                className="w-18 h-18 bg-[#34c759] rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all outline-none animate-pulse"
              >
                <Phone size={32} className="text-white" />
              </button>
              <span className="text-[11px] font-normal text-white">Accept</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
             <button 
                onClick={onEnd}
                className="w-20 h-20 bg-[#ff3b30] rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all outline-none animate-bounce"
              >
                <PhoneOff size={36} className="text-white" />
              </button>
          </div>
        )}
      </div>

      {/* ── Visual Safety Gap ── */}
      <div className="h-10 w-full bg-black" />
    </motion.div>,
    document.body
  );
}

function CallAction({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center active:bg-white/30 transition-all cursor-pointer border border-white/5">
        {icon}
      </div>
      <span className="text-[11px] font-normal text-gray-300 capitalize">{label}</span>
    </div>
  );
}
