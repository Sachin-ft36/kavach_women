import React, { useState, useEffect, useRef } from 'react';
import { User, Send, X, Shield, AlertTriangle, Radio, Mic, MapPin, Phone, ShieldCheck, Lock, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../state/useKavachStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id?: string;
  text: string;
  sender: 'user' | 'supercell';
  timestamp: any;
  userId: string;
  isEmergency?: boolean;
}

const SUGGESTION_CHIPS = [
  { label: 'Emergency Help', icon: AlertTriangle, query: 'I need emergency help' },
  { label: 'Ride Safe', icon: MapPin, query: 'How do I use Ride Safe?' },
  { label: 'Family Safety', icon: User, query: 'How is my family doing?' },
  { label: 'Emergency Numbers', icon: Phone, query: 'What are India emergency numbers?' },
  { label: 'Safety Tips', icon: ShieldCheck, query: 'Give me daily safety tips' },
  { label: 'Voice SOS', icon: Mic, query: 'How does Voice SOS work?' },
  { label: 'Evidence Vault', icon: Lock, query: 'How do I use the Evidence Vault?' },
  { label: 'Settings Help', icon: Settings, query: 'Help me with app settings' },
];

const EMERGENCY_TRIGGERS = [
  'help', 'sos', 'kidnap', 'danger', 'attack', 'followed', 'following',
  'unsafe', 'abuse', 'harassment', 'harassed', 'emergency', 'stalking',
  'stalker', 'assault', 'panic', 'scared', 'threat', 'save me',
];

export default function KavachAIChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useKavachStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user?.uid || !isOpen) return;

    const q = query(
      collection(db, "commandhub_chats", user.uid, "messages"),
      orderBy("timestamp", "asc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          const text = data.text || "";
          // Check emergency on incoming text as well
          const isEmg = EMERGENCY_TRIGGERS.some(kw => text.toLowerCase().includes(kw));
          if (isEmg) setEmergencyMode(true);

          return {
            id: doc.id,
            text,
            sender: data.sender || (data.role === 'responder' ? 'supercell' : 'user'),
            userId: data.userId || user.uid,
            timestamp: data.timestamp,
            isEmergency: isEmg
          } as Message;
        });
        setMessages(msgs);
      },
      error: (err) => {
        console.error("KAVACH: Firebase Access Blocked.", err);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, isOpen]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !user) return;

    setInput('');
    setSending(true);

    const isEmg = EMERGENCY_TRIGGERS.some(kw => textToSend.toLowerCase().includes(kw));
    if (isEmg) setEmergencyMode(true);

    try {
      const sessionRef = doc(db, "commandhub_chats", user.uid);
      const msgRef = collection(db, "commandhub_chats", user.uid, "messages");

      await setDoc(sessionRef, {
        userId: user.uid,
        userName: user.displayName || (user as any).name || 'Authorized Citizen',
        lastMsg: textToSend,
        lastTimestamp: serverTimestamp(),
        active: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await addDoc(msgRef, {
        text: textToSend,
        sender: "user",
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || (user as any).name || 'Authorized Citizen',
        sentAt: new Date().toISOString()
      });

      // Call local backend for AI response
      try {
        const historyData = messages.slice(-10).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

        const res = await fetch('http://localhost:8001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            history: historyData
          })
        });
        const data = await res.json();

        await addDoc(msgRef, {
          text: data.reply || "Sorry, I am facing connectivity issues. Please call 112 if this is an emergency.",
          sender: "supercell",
          timestamp: serverTimestamp(),
          userId: user.uid,
          sentAt: new Date().toISOString()
        });
      } catch (backendError) {
        console.error("Backend Error:", backendError);
        // Fallback if backend is not running
        await addDoc(msgRef, {
          text: "I could not connect to my AI servers. Please ensure the local backend is running (localhost:8001).",
          sender: "supercell",
          timestamp: serverTimestamp(),
          userId: user.uid,
          sentAt: new Date().toISOString()
        });
      }
      setSending(false);

    } catch (error) {
      console.error("COMMUNICATION ERROR:", error);
      toast.error("Network Error. Check connection.");
      setSending(false);
    }
  };

  const showWelcome = messages.length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-0 font-sans">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full h-full max-w-md mx-auto bg-[#000000] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* HERO BACKGROUND & GRADIENT OVERLAY */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1637825891028-564f672aa42c?w=800&q=80" alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/85 to-black" />
        </div>

        {/* EMERGENCY RED PULSE OVERLAY */}
        <AnimatePresence>
          {emergencyMode && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 bg-red-600/15 pointer-events-none"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-full h-full bg-red-500/10"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="relative z-10 p-5 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#9333EA] flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Shield size={20} className="drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-[17px] font-black tracking-tight text-white leading-none mb-1">KAVACH AI</h2>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", emergencyMode ? "bg-red-500 " : "bg-emerald-500")} />
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  {emergencyMode ? 'Emergency Mode' : 'Safety Companion • Online'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10 transition-all border border-white/10 active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* EMERGENCY BAR (if active) */}
        {emergencyMode && (
          <div onClick={() => setEmergencyMode(false)} className="relative z-10 w-full bg-red-500/10 border-y border-red-500/20 px-4 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/20 transition-all">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest">Emergency Mode Active • Tap to exit</span>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto relative z-10 px-4 pt-4 pb-32 scrollbar-hide">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center pt-8 pb-10 px-2 text-center h-full">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#A855F7] to-[#9333EA] flex items-center justify-center text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-6">
                <Shield size={40} className="drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 font-display">Welcome to KAVACH AI</h3>
              <p className="text-sm text-gray-300 font-medium mb-1">How can I help keep you safe today?</p>
              <p className="text-xs text-gray-500 mb-8 max-w-[280px]">Emergencies, family safety, ride safety, app guidance — I'm here, 24/7.</p>

              <div className="flex flex-wrap justify-center gap-2.5 w-full">
                {SUGGESTION_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(chip.query)}
                    className="relative overflow-hidden px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95 group"
                  >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md -z-10" />
                    <chip.icon size={16} className="text-[#A855F7]" />
                    <span className="text-[12.5px] font-semibold text-white/90">{chip.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 mt-12 opacity-50">
                <Lock size={10} className="text-white" />
                <span className="text-[10px] font-semibold text-white uppercase tracking-widest">Government-grade • End-to-end encrypted</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || idx}
                    className={cn("flex gap-2.5 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A855F7] to-[#9333EA] flex items-center justify-center shrink-0 shadow-md">
                        <Shield size={14} className="text-white" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className={cn(
                        "px-4 py-3 text-[14px] font-medium leading-relaxed shadow-sm",
                        isUser
                          ? "bg-[#3B0764] text-[#E9D5FF] rounded-2xl rounded-tr-sm border border-[#581C87]"
                          : "bg-white/10 backdrop-blur-lg text-white rounded-2xl rounded-tl-sm border border-white/10"
                      )}>
                        {msg.text}
                      </div>
                      <span className={cn("text-[9px] font-semibold mt-1 opacity-50", isUser ? "text-right text-gray-400" : "text-left text-gray-400")}>
                        {isUser ? "✓ Delivered • " : ""}
                        {msg.timestamp ? new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A855F7] to-[#9333EA] flex items-center justify-center shrink-0 shadow-md">
                    <Shield size={14} className="text-white" />
                  </div>
                  <div className="px-5 py-3.5 bg-white/10 backdrop-blur-lg rounded-2xl rounded-tl-sm border border-white/10 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#A855F7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#A855F7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#A855F7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* FLOATING INPUT BAR */}
        <div className="absolute bottom-6 left-4 right-4 z-20">
          <div className="relative flex items-end gap-2 p-2 rounded-[28px] bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={emergencyMode ? "Describe the emergency..." : "Ask KAVACH anything..."}
                className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-white placeholder-gray-400 outline-none h-full"
              />
            </div>

            {!input.trim() ? (
              <button
                onClick={() => handleSendMessage("Activate Voice SOS now")}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-[#A855F7] flex items-center justify-center hover:bg-white/10 transition-all shrink-0 active:scale-95"
              >
                <Mic size={20} />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={sending}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A855F7] to-[#9333EA] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={18} className="ml-1" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
