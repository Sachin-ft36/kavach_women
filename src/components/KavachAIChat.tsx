import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, X, Shield, Gavel, AlertTriangle, MessageSquare, Zap, Cpu, Terminal } from 'lucide-react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { useLanguage } from '../contexts/LanguageContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';

import { kavachBrain } from '../services/kavach-brain';

const API_KEY = "AIzaSyCNEVlQJY-dtfXHOYKZzpIn36xwtqpf0Ks"; // NEW PRODUCTION KEY
const genAI = new GoogleGenerativeAI(API_KEY);

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
}

export default function KavachAIChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "NEURAL COMMANDER: ACTIVE. Safety protocols engaged. State your situation or legal query.", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSession = useRef<any>(null);

  const initAI = async () => {
    if (!API_KEY) return;
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest", // TACTICAL FIX: Updated to latest stable model ID
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      systemInstruction: `
        ROLE: KAVACH Neural Commander (Women's Safety Specialist & Legal Protocol Intercept).
        KNOWLEDGE: Indian Laws (BNS 2023, BNSS, Zero-FIR, Section 354, POSH Act).
        PROTOCOLS:
        1. If user is in danger: Give 3-word immediate action (e.g., "Run to crowd", "Trigger SOS Grid").
        2. Legal Intelligence: Strictly cite specific sections of BNS (Bharatiya Nyaya Sanhita).
        3. Emergency Flow: If a crime is reported, explain Zero-FIR procedure immediately.
        4. Tone: Tactical, Swift, Multi-threaded (Supportive + Forensic).
        5. Multilingual Output: Always respond in: ${language}.
        6. SAFETY: Do NOT block critical emergency keywords. (SAFETY FILTERS: DISABLED).
      `
    });
    
    chatSession.current = model.startChat({
      history: messages.slice(1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
    });
  };

  useEffect(() => {
    if (isOpen && !chatSession.current) initAI();
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || isTyping) return;
    const { isHubReady } = useKavachStore.getState();

    if (Capacitor.isNativePlatform() && isHubReady) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    const userMsg: Message = { role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // TACTICAL UPGRADE: Using KavachBrain for internal processing and fallbacks
      const botResponse = await kavachBrain.processQuery(text);

      if (Capacitor.isNativePlatform() && isHubReady) {
        await Haptics.vibrate({ duration: 50 });
      }
      setMessages(prev => [...prev, { role: 'bot', text: botResponse, timestamp: Date.now() }]);
    } catch (e: any) {
      console.error("Neural Link Failed:", e);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: `SYTEM_ALERT: Neural connection interrupted. Reason: ${e.message || "Interruption in Tactical Grid"}. Move to safety immediately.`, 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { label: "BNS Legal Help", icon: <Gavel size={12} />, prompt: "Explain my legal rights under BNS 2023 for safety." },
    { label: "Draft Complaint", icon: <Terminal size={12} />, prompt: "Help me draft a formal Zero-FIR complaint." },
    { label: "Emergency Intercept", icon: <Zap size={12} />, prompt: "I am feeling unsafe. Give me a 3-step survival protocol." }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-3xl flex items-end justify-center p-4">
      <div className="w-full max-w-lg bg-[#0a0f1d] border border-white/10 rounded-[40px] h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-none">
        {/* Tactical Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-accent-blue/10 to-transparent">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue shadow-[0_0_15px_rgba(0,122,255,0.3)] border border-accent-blue/30">
               <Cpu size={20} />
             </div>
             <div>
               <h3 className="text-sm font-black italic uppercase tracking-tighter text-white">KAVACH AI HUD</h3>
               <p className="text-[8px] text-accent-blue font-bold uppercase tracking-[3px]">BNS Legal Engine Active</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Message Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                msg.role === 'user' 
                  ? "bg-white/5 border-white/10 text-white" 
                  : "bg-accent-blue/10 border-accent-blue/20 text-accent-blue"
              )}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn(
                "p-4 rounded-3xl text-[11px] font-bold leading-relaxed shadow-sm",
                msg.role === 'user'
                  ? "bg-accent-blue text-white rounded-tr-none"
                  : "bg-white/5 text-white/90 rounded-tl-none border border-white/5"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
                 <Bot size={14} />
               </div>
               <div className="flex gap-1 items-center p-4 bg-white/5 rounded-3xl rounded-tl-none">
                  <div className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                  <div className="w-1.5 h-1.5 bg-accent-blue rounded-full opacity-60" />
                  <div className="w-1.5 h-1.5 bg-accent-blue rounded-full opacity-30" />
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Tactical Footer */}
        <div className="p-6 border-t border-white/5 space-y-4 bg-black/40">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-show">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(action.prompt)}
                className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-2"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
             <input 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder="Identify threat or ask legal section..."
               className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-accent-blue/50 placeholder:text-white/10 text-white"
             />
             <button 
               onClick={() => handleSendMessage()}
               disabled={isTyping}
               className="w-14 h-14 bg-accent-blue rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
             >
               <Send size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
