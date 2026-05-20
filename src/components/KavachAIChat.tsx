import React, { useState, useEffect, useRef } from 'react';
import { User, Send, X, Shield, Gavel, AlertTriangle, MessageSquare, Zap, Cpu, Terminal, Radio, Trash2, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id?: string;
  text: string;
  sender: 'user' | 'supercell';
  timestamp: any;
  userId: string;
}

export default function KavachAIChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { user, userPos } = useKavachStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🛠️ AUTO-SCROLL LOGIC
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  // 🔥 FIRESTORE REALTIME LISTENER (WHATSAPP BEHAVIOR)
  useEffect(() => {
    if (!user?.uid || !isOpen) return;

    // Establishing the specific path: commandhub_chats/{userId}/messages
    const q = query(
      collection(db, "commandhub_chats", user.uid, "messages"),
      orderBy("timestamp", "asc"),
      limit(200)
    );

    const handlePermissionError = async () => {
       console.warn("KAVACH: Realtime Listener Blocked due to FireStore Permissions.");
    };

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text || "",
            sender: data.sender || (data.role === 'responder' ? 'supercell' : 'user'),
            userId: data.userId || user.uid,
            timestamp: data.timestamp
          } as Message;
        });
        console.log(`KAVACH: Received ${msgs.length} messages from Cloud.`);
        setMessages(msgs);
      },
      error: (err) => {
        console.error("KAVACH: Firebase Security Blocked Access. Please update Rules in Console.", err);
        if (err.code === 'permission-denied' || err.code === 'unauthenticated') {
           handlePermissionError();
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const currentInput = input;
    setInput('');

    try {
      // 🚀 PERMANENT FIRESTORE SAVE
      const sessionRef = doc(db, "commandhub_chats", user.uid);
      const msgRef = collection(db, "commandhub_chats", user.uid, "messages");

      // Update Session Metadata (Ensures visibility in SuperCell list)
      await setDoc(sessionRef, {
        userId: user.uid,
        userName: user.displayName || (user as any).name || 'Authorized Citizen',
        lastMsg: currentInput,
        lastTimestamp: serverTimestamp(),
        active: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Add actual message
      await addDoc(msgRef, {
        text: currentInput,
        sender: "user",
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || (user as any).name || 'Authorized Citizen',
        sentAt: new Date().toISOString()
      });

      if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error("ALL CHANNELS BLOCKED:", error);
      toast.error("COMMUNICATION BLACKOUT");
    }
  };

  const handleUnsend = async (msgId: string) => {
    if (!user || !msgId) return;
    try {
      await deleteDoc(doc(db, "commandhub_chats", user.uid, "messages", msgId));
      if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
      toast.success("PURGED FROM GRID");
    } catch (e) {
      toast.error("COULD NOT PURGE");
    }
  };

  const quickActions = [
    { label: "Urgent Help", icon: <AlertTriangle size={12} />, prompt: "I am in an emergency. Need immediate SuperCell assistance." },
    { label: "Report Activity", icon: <Radio size={12} />, prompt: "Reporting suspicious activity at my current coordinates." },
    { label: "Legal Advice", icon: <Gavel size={12} />, prompt: "Need immediate legal protocol regarding my current situation." }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#080000]" />
      
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="relative w-full h-full bg-white flex flex-col shadow-2xl overflow-hidden">
        
        {/* 📟 MISSION HEADER */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-gray-50/50 to-transparent">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/5 flex items-center justify-center text-[#2563EB] border border-[#2563EB]/10 shadow-inner">
                <Shield size={28} />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[3px] text-[#2563EB]">Mission Uplink: Active</span>
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Command Hub</h2>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Direct SuperCell Connection</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"><X size={24} /></button>
        </div>

        {/* 💬 MISSION LOG (MESSAGES) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]/30 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
               <Radio size={48} className="mb-4 text-gray-400 animate-pulse" />
               <p className="text-xs font-black uppercase tracking-[5px] text-gray-500">Establishing Secure Channel</p>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">All comms are forensicly recorded</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={cn("flex gap-3 max-w-[85%]", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm", msg.sender === 'user' ? "bg-white border-gray-100 text-[#2563EB]" : "bg-[#2563EB] border-[#2563EB] text-white")}>
                {msg.sender === 'user' ? <User size={18} /> : <Shield size={18} />}
              </div>
              <div className={cn("p-5 rounded-[28px] text-[12px] font-medium leading-relaxed shadow-sm relative group/msg", msg.sender === 'user' ? "bg-[#2563EB] text-white rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none border border-gray-100")}>
                {msg.sender === 'user' && (
                  <button onClick={() => msg.id && handleUnsend(msg.id)} className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center">
                    <Trash2 size={16} />
                  </button>
                )}
                {msg.sender === 'supercell' && (
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#2563EB] mb-2 border-b border-[#2563EB]/10 pb-1">Command Responder:</p>
                )}
                {msg.text}
                <div className={cn("text-[7px] font-black uppercase tracking-widest mt-3 opacity-40 flex items-center gap-2", msg.sender === 'user' ? "text-white justify-end" : "text-gray-400")}>
                  <Clock size={8} />
                  {msg.timestamp ? new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDING'}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* 📟 INPUT INTERFACE */}
        <div className="p-8 border-t border-gray-100 bg-white">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
             {quickActions.map((action, i) => (
               <button key={i} onClick={() => setInput(action.prompt)} className="whitespace-nowrap px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-[#2563EB]/5 hover:text-[#2563EB] hover:border-[#2563EB]/20 transition-all flex items-center gap-2">
                 {action.icon} {action.label}
               </button>
             ))}
          </div>

          <div className="flex gap-4">
             <div className="flex-1 relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Transmit mission details to Command..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-6 py-5 text-sm font-medium outline-none focus:border-[#2563EB]/30 transition-all shadow-inner"
                />
             </div>
             <button onClick={handleSendMessage} disabled={!input.trim()} className="w-16 h-16 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-[#2563EB]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100">
                <Send size={24} />
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
