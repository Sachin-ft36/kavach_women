import React, { useState } from 'react';
import { 
  ArrowLeft, MessageCircle, Phone, Video, ShieldCheck, Heart, 
  Search, Star, CheckCircle2, Send, Sparkles, AlertCircle, Headphones,
  Shield, Lock, ArrowRight, ChevronRight, Check
} from 'lucide-react';
import { SafeSpaceWelcome } from "../features/mood-checkin/SafeSpaceWelcome";
import { SafeSpaceOptions } from "../features/mood-checkin/SafeSpaceOptions";
import { TalkToTrustedNetwork } from "../features/mood-checkin/TalkToTrustedNetwork";
import { CalmDownStep } from "../features/mood-checkin/CalmDownStep";
import { BreathingExerciseStep } from "../features/mood-checkin/BreathingExerciseStep";
import { ExpressMyselfStep } from "../features/mood-checkin/ExpressMyselfStep";
import { DrawDoodleStep } from "../features/mood-checkin/DrawDoodleStep";
import { useKavachStore } from '../state/useKavachStore';

interface SupportContact {
  id: string;
  name: string;
  role: string;
  specialty: string;
  rating: number;
  reviews: number;
  avatar: string;
  isOnline: boolean;
  responseTime: string;
  bio: string;
  category: 'counselor' | 'listener' | 'helpline';
  phoneNo?: string;
}

const SUPPORT_CONTACTS: SupportContact[] = [
  {
    id: 'f1',
    name: 'Mom',
    role: 'Mother • Trusted Guardian',
    specialty: 'Primary Emergency Contact',
    rating: 5.0,
    reviews: 999,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    isOnline: true,
    responseTime: 'Instant responder',
    bio: 'Always call Mom when you need someone who knows you best and can coordinate family help immediately.',
    category: 'counselor', // Family
    phoneNo: '9876543210'
  },
  {
    id: 'f2',
    name: 'Dad',
    role: 'Father • Family Guardian',
    specialty: 'Primary Safety Dispatcher',
    rating: 5.0,
    reviews: 999,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    isOnline: true,
    responseTime: 'Instant responder',
    bio: 'Your rock in any storm. Reach out to Dad to coordinate security, transport, or immediate relief.',
    category: 'counselor', // Family
    phoneNo: '9876543211'
  },
  {
    id: 'f3',
    name: 'Brother',
    role: 'Sibling • Quick Responder',
    specialty: 'Local Area Backup Helper',
    rating: 4.9,
    reviews: 450,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=150&auto=format&fit=crop',
    isOnline: true,
    responseTime: '1 min',
    bio: 'Ready to drive out, share location tracking, or stand by on a phone call while you travel.',
    category: 'counselor', // Family
    phoneNo: '9876543212'
  },
  {
    id: 'f4',
    name: 'Sister',
    role: 'Sibling • Empathetic Listener',
    specialty: 'Safe Space Support',
    rating: 4.9,
    reviews: 320,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    isOnline: true,
    responseTime: 'Instant',
    bio: 'Here to listen, offer sound advice, and keep you calm. Completely safe companion space.',
    category: 'counselor', // Family
    phoneNo: '9876543213'
  },
  {
    id: 'f5',
    name: 'Priya (Best Friend)',
    role: 'Close Friend • Daily Listener',
    specialty: 'Emotional Support & Chat Support',
    rating: 4.8,
    reviews: 280,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    isOnline: true,
    responseTime: 'Instant',
    bio: 'Best friend status. Always online to chat, distract, or listen when you are having a tough moment.',
    category: 'listener', // Friends
    phoneNo: '9876543214'
  },
  {
    id: 'h1',
    name: 'National Women Helpline',
    role: 'Government of India Emergency Service',
    specialty: '24/7 Domestic Violence & Crisis Support',
    rating: 5.0,
    reviews: 12000,
    avatar: 'gov_shield',
    isOnline: true,
    responseTime: 'Call connects instantly',
    bio: 'Direct toll-free service offering immediate response, referral, and shelter links.',
    category: 'helpline',
    phoneNo: '181'
  },
  {
    id: 'h2',
    name: 'Kavach Quick Emergency Dispatch',
    role: 'Kavach Specialized Crisis Team',
    specialty: 'SOS Verification & Physical Rescue Assist',
    rating: 5.0,
    reviews: 8400,
    avatar: 'kavach_shield',
    isOnline: true,
    responseTime: 'Instant',
    bio: 'Direct channel to notify all close-range community protectors and emergency vehicles.',
    category: 'helpline',
    phoneNo: '112'
  }
];

const SUGGESTED_CHIPS = [
  "I'm feeling very anxious right now",
  "I just need someone to talk to",
  "I had a scary encounter today",
  "Can you help me calm down?"
];

export default function TalkToSomeoneScreen() {
  const { activeTab, setActiveTab } = useKavachStore();
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'counselor' | 'listener' | 'helpline'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const startAIChat = () => {
    const aiContact: SupportContact = {
      id: 'ai_bot',
      name: 'KAVACH AI Companion',
      role: 'Empathetic AI Assistant',
      specialty: 'Cognitive Calmness & Safety Guidance',
      rating: 4.9,
      reviews: 1540,
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop',
      isOnline: true,
      responseTime: 'Instant Response',
      bio: 'Always here to talk, guide you through breathing exercises, or offer safe support.',
      category: 'listener'
    };
    setActiveChatContact(aiContact);
    setMessages([
      { sender: 'agent', text: 'Hello! I am KAVACH AI, your safe space companion. How are you feeling right now?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setShowWelcome(false);
  };

  const startJournalChat = () => {
    // Show the new Express Myself UI
    setWelcomeStep(6);
  };
  
  // Chat Room state
  const [activeChatContact, setActiveChatContact] = useState<SupportContact | null>(null);
  const [messages, setMessages] = useState<{ sender: 'user' | 'agent'; text: string; time: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const filteredContacts = SUPPORT_CONTACTS.filter(contact => {
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const startChat = (contact: SupportContact) => {
    setActiveChatContact(contact);
    setMessages([
      {
        sender: 'agent',
        text: `Hello! I am ${contact.name}, a ${contact.role}. How are you feeling today? Please know that this is a completely safe, encrypted, and private space.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Trigger counselor response after a brief delay
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "Thank you for sharing that with me. I completely understand why you feel that way. Take a slow, deep breath. You are safe here.",
        "I am right here with you. Tell me more about what happened so we can figure this out together step-by-step.",
        "That sounds challenging, but you are being very strong by speaking about it. I am listening, please go on.",
        "Please remember that your feelings are valid. Would you like me to guide you through a quick breathing exercise, or would you just like to express what is on your mind?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Render Welcome Page Design
  if (showWelcome && welcomeStep === 1) {
    return (
      <SafeSpaceWelcome 
        onBack={() => setActiveTab('dashboard')}
        onContinue={() => setWelcomeStep(2)}
      />
    );
  }

  // Render Welcome Options Page (Step 2)
  if (showWelcome && welcomeStep === 2) {
    return (
      <SafeSpaceOptions 
        onBack={() => setWelcomeStep(1)}
        onTalkToSomeone={() => setWelcomeStep(3)}
        onCalmDown={() => setWelcomeStep(4)}
        onStartAIChat={startAIChat}
        onStartJournalChat={startJournalChat}
      />
    );
  }

  // Render Talk to Trusted Network (Step 3)
  if (showWelcome && welcomeStep === 3) {
    return (
      <TalkToTrustedNetwork 
        onBack={() => setWelcomeStep(2)}
        onSend={(contactId, method, message) => {
          console.log('Sending to', contactId, 'via', method, ':', message);
          // For now, after sending, we return to the dashboard
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // Render Let's Calm Down (Step 4)
  if (showWelcome && welcomeStep === 4) {
    return (
      <CalmDownStep 
        onBack={() => setWelcomeStep(2)}
        onContinue={() => {
          setWelcomeStep(5);
        }}
      />
    );
  }

  // Render Breathing Exercise (Step 5)
  if (showWelcome && welcomeStep === 5) {
    return (
      <BreathingExerciseStep 
        onBack={() => setWelcomeStep(4)}
        onComplete={() => {
          setActiveTab('dashboard');
        }}
      />
    );
  }
  // Render Express Myself (Step 6)
  if (showWelcome && welcomeStep === 6) {
    return (
      <ExpressMyselfStep 
        onBack={() => setWelcomeStep(2)}
        onSave={() => {
          setActiveTab('dashboard');
        }}
        onDrawDoodle={() => setWelcomeStep(7)}
      />
    );
  }

  // Render Draw / Doodle (Step 7)
  if (showWelcome && welcomeStep === 7) {
    return (
      <DrawDoodleStep 
        onBack={() => setWelcomeStep(6)}
        onSave={() => {
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // Render Chat Interface
  if (!activeChatContact) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#080713] text-white flex flex-col font-sans select-none relative overflow-hidden">

      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-20%] w-[350px] h-[350px] bg-[#7A3EFF] opacity-15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[350px] h-[350px] bg-[#FF4FC9] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      {/* RENDER CHAT INTERFACE IF ACTIVE */}
      <div className="flex-1 flex flex-col h-full z-10 bg-[#0C0A1C]">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#201938] bg-[#120F26] backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveChatContact(null);
                setShowWelcome(true);
                setWelcomeStep(2);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1D1737] text-purple-300 hover:text-white transition-all cursor-pointer border-none"
            >
              <ArrowLeft size={16} />
            </button>
            
            <div className="relative">
              {activeChatContact.avatar === 'gov_shield' || activeChatContact.avatar === 'kavach_shield' ? (
                <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#7A3EFF] to-[#FF4FC9] flex items-center justify-center shadow-lg">
                  <ShieldCheck size={20} className="text-white" />
                </div>
              ) : (
                <img 
                  src={activeChatContact.avatar} 
                  alt={activeChatContact.name} 
                  className="w-[38px] h-[38px] rounded-full object-cover border-2 border-purple-500"
                />
              )}
              {activeChatContact.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#120F26] rounded-full" />
              )}
            </div>

            <div className="text-left">
              <h4 className="text-[12px] font-black tracking-wide text-white leading-tight flex items-center gap-1">
                {activeChatContact.name}
                <CheckCircle2 size={12} className="text-[#A855F7] fill-[#A855F7]/10" />
              </h4>
              <p className="text-[8px] text-purple-300 leading-none mt-0.5 font-bold uppercase tracking-wider">
                {activeChatContact.isOnline ? 'Online • Active support' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={`tel:${activeChatContact.phoneNo || '181'}`}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#251A46] text-purple-300 hover:text-white transition-all border-none"
            >
              <Phone size={14} />
            </a>
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[#251A46] text-purple-300 hover:text-white transition-all border-none cursor-pointer">
              <Video size={14} />
            </button>
          </div>
        </div>

        {/* Encryption Notice */}
        <div className="py-2 px-4 bg-[#181335]/30 border-b border-[#201938] flex items-center justify-center gap-1.5 text-[8.5px] text-purple-300 font-bold uppercase tracking-wider">
          <ShieldCheck size={11} className="text-emerald-400" />
          End-to-End Encrypted Secure Safe Space
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-start">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex flex-col max-w-[80%] ${
                msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div 
                className={`px-3.5 py-2.5 rounded-[18px] text-[11px] font-medium leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-[#7A3EFF] to-[#5E3BFF] text-white rounded-tr-none'
                    : 'bg-[#1D1735] text-purple-10 border border-[#2B234C] rounded-tl-none shadow-md'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[7.5px] text-purple-400/80 mt-1 font-semibold tracking-wide">
                {msg.time}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 mr-auto bg-[#1D1735] px-3.5 py-2 rounded-[18px] border border-[#2B234C]">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Suggested Quick Reply Chips */}
        <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-[#201938] bg-[#0E0C22]">
          {SUGGESTED_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#1C163A] hover:bg-[#2A2154] border border-[#2F255C] text-purple-200 hover:text-white text-[9px] font-black transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Text Input Row */}
        <div className="p-3 border-t border-[#201938] bg-[#120F26] flex items-center gap-2.5">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder="Type your message securely..."
            className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#0B081A] border border-[#2B234C] text-white text-[11px] outline-none placeholder:text-purple-400/50 focus:border-[#7A3EFF] transition-colors"
          />
          <button 
            onClick={() => handleSendMessage(inputText)}
            className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center bg-[#7A3EFF] hover:bg-[#5E3BFF] text-white transition-colors cursor-pointer border-none shadow-[0_4px_10px_rgba(122,62,255,0.4)]"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
