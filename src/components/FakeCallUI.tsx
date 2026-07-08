import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, User, MessageSquare, Clock, Mic, Volume2, Plus, UserPlus, Video, Grid, MoreVertical, MessageCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';
import { KavachSafe } from '../services/KavachNative';

interface FakeCallUIProps {
  callerName?: string;
  callerNumber?: string;
  onEnd: () => void;
}

export default function FakeCallUI({ 
  callerName = "Papa", 
  callerNumber = "mobile",
  onEnd 
}: FakeCallUIProps) {
  const [status, setStatus] = useState<'ringing' | 'connected'>('ringing');
  const [timer, setTimer] = useState(0);
  const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const contactPhoto = "/father_back_profile_contact.png";

  useEffect(() => {
    if (status === 'ringing') {
      if (platform === 'web') {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        audio.loop = true;
        ringtoneRef.current = audio;
        audio.play().catch(() => {});
      } else {
        KavachSafe.playEmergencyRingtone();
      }
    } else {
      if (platform === 'web' && ringtoneRef.current) {
        ringtoneRef.current.pause();
      } else {
        KavachSafe.stopEmergencyRingtone();
      }
    }

    return () => { 
      if (platform === 'web' && ringtoneRef.current) ringtoneRef.current.pause();
      else KavachSafe.stopEmergencyRingtone();
    };
  }, [status, platform]);

  useEffect(() => {
    let interval: any;
    if (status === 'connected') interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderUI = () => {
    if (platform === 'ios') return <IOSUI />;
    return <AndroidUI />; // Default to Android for Web/Android
  };

  // 🍎 IOS 17 STYLE
  const IOSUI = () => (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-4 flex justify-between items-center opacity-80">
        <span className="text-[14px] font-bold">12:45</span>
        <div className="flex items-center gap-1.5">
           <div className="w-4 h-3 border border-white/40 rounded-[2px] relative"><div className="absolute left-0 top-0 bottom-0 bg-white w-3/4" /></div>
           <div className="flex gap-0.5 items-end h-2.5"><div className="w-0.5 h-1 bg-white" /><div className="w-0.5 h-1.5 bg-white" /><div className="w-0.5 h-2 bg-white" /><div className="w-0.5 h-2.5 bg-white" /></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center pt-20">
        <div className="w-40 h-40 rounded-full border-2 border-white/10 shadow-2xl overflow-hidden mb-8 relative">
          <img src={contactPhoto} alt="Caller" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-[42px] font-medium tracking-tight mb-2">{callerName}</h1>
        <p className="text-[20px] font-light text-gray-400">{status === 'ringing' ? callerNumber : formatTime(timer)}</p>
      </div>
      <div className="pb-32 px-12">
        {status === 'ringing' ? (
          <div className="space-y-12">
            <div className="flex justify-around items-center opacity-60 mb-20">
              <div className="flex flex-col items-center gap-2"><Clock size={24} /><span className="text-[11px] font-medium">Remind Me</span></div>
              <div className="flex flex-col items-center gap-2"><MessageSquare size={24} /><span className="text-[11px] font-medium">Message</span></div>
            </div>
            <div className="flex justify-between items-center w-full max-w-xs mx-auto">
              <div className="flex flex-col items-center gap-4">
                <button onClick={onEnd} className="w-20 h-20 bg-[#FF3B30] rounded-full flex items-center justify-center"><PhoneOff size={36} className="text-white rotate-[135deg]" /></button>
                <span className="text-[13px] font-medium">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <button onClick={() => setStatus('connected')} className="w-20 h-20 bg-[#34C759] rounded-full flex items-center justify-center "><Phone size={36} className="text-white" /></button>
                <span className="text-[13px] font-medium">Accept</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="grid grid-cols-3 gap-y-12 gap-x-8 max-w-sm mx-auto">
              <InCallBtn icon={<Mic size={32} />} label="mute" />
              <InCallBtn icon={<Grid size={32} />} label="keypad" />
              <InCallBtn icon={<Volume2 size={32} />} label="speaker" />
              <InCallBtn icon={<Plus size={32} />} label="add call" />
              <InCallBtn icon={<Video size={32} />} label="FaceTime" />
              <InCallBtn icon={<UserPlus size={32} />} label="contacts" />
            </div>
            <div className="flex justify-center pt-8"><button onClick={onEnd} className="w-20 h-20 bg-[#FF3B30] rounded-full flex items-center justify-center"><PhoneOff size={36} className="text-white" /></button></div>
          </div>
        )}
      </div>
    </div>
  );

  // 🤖 ANDROID / SAMSUNG STYLE
  const AndroidUI = () => (
    <div className="flex flex-col h-full bg-[#1A1A1A] relative overflow-hidden font-sans">
      {/* Dynamic blurred background based on contact photo */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-125"
        style={{ backgroundImage: `url(${contactPhoto})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#1A1A1A]/80 to-[#1A1A1A] pointer-events-none" />

      <div className="flex-1 relative flex flex-col items-center pt-24 z-10">
        <h1 className="text-[32px] font-normal text-white tracking-wide mb-1 drop-shadow-md">{callerName}</h1>
        <p className="text-sm text-white/70 font-medium tracking-wide mb-12 drop-shadow-sm">
          {status === 'ringing' ? 'Mobile • Incoming call' : formatTime(timer)}
        </p>

        <div className="w-32 h-32 rounded-full border border-white/10 overflow-hidden shadow-2xl relative">
           <img src={contactPhoto} alt="Caller" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="pb-24 relative z-10 w-full px-8">
        {status === 'ringing' ? (
           <div className="flex flex-col">
              <div className="flex justify-between w-full mb-20 px-8 text-white/80">
                 <div className="flex flex-col items-center gap-2 active:opacity-50">
                    <MessageCircle size={24} strokeWidth={1.5} />
                    <span className="text-[12px] font-medium tracking-wide">Reply</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 active:opacity-50">
                    <Clock size={24} strokeWidth={1.5} />
                    <span className="text-[12px] font-medium tracking-wide">Remind</span>
                 </div>
              </div>
              
              <div className="flex justify-between items-center w-full px-6">
                 {/* Decline Button */}
                 <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={onEnd}
                      className="w-[72px] h-[72px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                       <PhoneOff size={32} className="text-white" strokeWidth={2} />
                    </button>
                    <span className="text-[12px] font-medium tracking-wide text-white/90">Decline</span>
                 </div>

                 {/* Accept Button with Bounce Animation */}
                 <div className="flex flex-col items-center gap-3">
                    <motion.button 
                      animate={{ y: [0, -12, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      onClick={() => setStatus('connected')}
                      className="w-[72px] h-[72px] bg-[#34C759] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(52,199,89,0.3)] active:scale-95 transition-transform"
                    >
                       <Phone size={32} className="text-white fill-white" strokeWidth={1} />
                    </motion.button>
                    <span className="text-[12px] font-medium tracking-wide text-white/90">Swipe up to answer</span>
                 </div>
              </div>
           </div>
        ) : (
           <div className="w-full max-w-sm mx-auto">
             <div className="grid grid-cols-3 gap-y-10 gap-x-6 mb-16">
                <AndroidAction icon={<Mic size={28} strokeWidth={1.5} />} label="Mute" />
                <AndroidAction icon={<Grid size={28} strokeWidth={1.5} />} label="Keypad" />
                <AndroidAction icon={<Volume2 size={28} strokeWidth={1.5} />} label="Speaker" />
                <AndroidAction icon={<Plus size={28} strokeWidth={1.5} />} label="Add call" />
                <AndroidAction icon={<Video size={28} strokeWidth={1.5} />} label="Video call" />
                <AndroidAction icon={<User size={28} strokeWidth={1.5} />} label="Contacts" />
             </div>
             
             <div className="flex justify-center">
                <button 
                  onClick={onEnd} 
                  className="w-[72px] h-[72px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                   <PhoneOff size={32} className="text-white" strokeWidth={2} />
                </button>
             </div>
           </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999999] bg-black text-white select-none overflow-hidden"
    >
      {renderUI()}
    </motion.div>,
    document.body
  );
}

function InCallBtn({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center active:bg-white/30 border border-white/5">{icon}</div>
      <span className="text-[12px] font-medium text-gray-300 capitalize">{label}</span>
    </div>
  );
}

function AndroidAction({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">{icon}</div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
