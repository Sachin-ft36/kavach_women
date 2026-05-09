import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, User, MessageSquare, Clock, Mic, Volume2, Plus, UserPlus, Video, Grid, MoreVertical, MessageCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';

interface FakeCallUIProps {
  callerName?: string;
  callerNumber?: string;
  onEnd: () => void;
}

export default function FakeCallUI({ 
  callerName = "Papa (Guardian)", 
  callerNumber = "mobile",
  onEnd 
}: FakeCallUIProps) {
  const [status, setStatus] = useState<'ringing' | 'connected'>('ringing');
  const [timer, setTimer] = useState(0);
  const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const contactPhoto = "C:/Users/hp/.gemini/antigravity/brain/7af23aa6-1e66-44f5-bd2c-23316fe6978a/indian_father_contact_photo_1778135539739.png";

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
    audio.loop = true;
    ringtoneRef.current = audio;
    if (status === 'ringing') audio.play().catch(() => {});
    else audio.pause();
    return () => { audio.pause(); };
  }, [status]);

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
                <button onClick={() => setStatus('connected')} className="w-20 h-20 bg-[#34C759] rounded-full flex items-center justify-center animate-pulse"><Phone size={36} className="text-white" /></button>
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
    <div className="flex flex-col h-full bg-[#121212]">
      <div className="flex-1 relative flex flex-col items-center pt-32">
        {/* Full Screen Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2563EB]/20 to-black opacity-40 pointer-events-none" />
        
        <div className="w-48 h-48 rounded-[64px] border-4 border-white/5 overflow-hidden mb-10 shadow-2xl relative z-10">
           <img src={contactPhoto} alt="Caller" className="w-full h-full object-cover" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2 relative z-10">{callerName}</h1>
        <p className="text-lg text-gray-400 font-medium tracking-widest relative z-10 uppercase">
          {status === 'ringing' ? 'Calling...' : formatTime(timer)}
        </p>
      </div>

      <div className="pb-40 relative z-10">
        {status === 'ringing' ? (
           <div className="flex flex-col items-center">
              <div className="flex justify-between w-full max-w-sm px-12 mb-16 opacity-50 text-white text-[10px] font-bold uppercase tracking-[2px]">
                 <div className="flex flex-col items-center gap-2"><MessageCircle size={20} /><span>Send Message</span></div>
                 <div className="flex flex-col items-center gap-2"><MoreVertical size={20} /><span>More</span></div>
              </div>
              
              <div className="flex justify-between items-center w-full px-16">
                 {/* Android Accept Swipe Feel */}
                 <div className="flex flex-col items-center gap-4">
                    <motion.button 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      onClick={() => setStatus('connected')}
                      className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                    >
                       <Phone size={36} className="text-white" />
                    </motion.button>
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Swipe Up</span>
                 </div>

                 <div className="flex flex-col items-center gap-4">
                    <motion.button 
                      onClick={onEnd}
                      className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                    >
                       <PhoneOff size={36} className="text-white" />
                    </motion.button>
                    <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Decline</span>
                 </div>
              </div>
           </div>
        ) : (
           <div className="grid grid-cols-4 gap-6 px-10 mb-10">
              <AndroidAction icon={<Mic size={24} />} label="Mute" />
              <AndroidAction icon={<Grid size={24} />} label="Keypad" />
              <AndroidAction icon={<Volume2 size={24} />} label="Speaker" />
              <AndroidAction icon={<Plus size={24} />} label="Add call" />
              
              <div className="col-span-4 flex justify-center pt-20">
                 <button onClick={onEnd} className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-2xl">
                    <PhoneOff size={40} className="text-white" />
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
