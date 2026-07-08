import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Headphones, 
  Search, 
  Mic, 
  Shield, 
  MapPin, 
  Users, 
  Settings, 
  ChevronRight, 
  PhoneCall, 
  Bell, 
  Lock, 
  MessageSquare, 
  Mail, 
  ShieldCheck,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    {
      id: 'account',
      title: 'Account & Security',
      desc: 'Manage your account',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5 text-[#b392ff]">
          <path d="M50 10 L82 22 V55 C82 72, 50 86, 50 86 C50 86, 18 72, 18 55 V22 Z" fill="#7C4DFF" />
          <path d="M50 10 L50 86 C50 86, 18 72, 18 55 V22 Z" fill="#e0d5ff" />
        </svg>
      ),
      iconBg: 'bg-[#1e1440] border border-[#3b2b73]/30',
      descLines: ['Manage your', 'account']
    },
    {
      id: 'sos',
      title: 'SOS & Alerts',
      desc: 'Learn about SOS and alerts',
      icon: (
        <div className="w-6.5 h-6.5 rounded-full bg-red-650 flex items-center justify-center text-white font-black text-[7.5px] leading-none shadow-[0_0_8px_rgba(220,38,38,0.4)]">
          SOS
        </div>
      ),
      iconBg: 'bg-[#33111b] border border-red-900/30',
      descLines: ['Learn about SOS', 'and alerts']
    },
    {
      id: 'tracking',
      title: 'Tracking & Location',
      desc: 'Location sharing and tracking',
      icon: <MapPin size={18} className="text-blue-400 fill-blue-500/20" />,
      iconBg: 'bg-[#0f1b35] border border-blue-900/30',
      descLines: ['Location sharing', 'and tracking']
    },
    {
      id: 'guardians',
      title: 'Guardians & Protectors',
      desc: 'Manage your network',
      icon: <Users size={18} className="text-emerald-400 fill-emerald-500/20" />,
      iconBg: 'bg-[#0c241b] border border-emerald-900/30',
      descLines: ['Manage your', 'network']
    },
    {
      id: 'settings',
      title: 'App & Settings',
      desc: 'Preferences and troubleshooting',
      icon: <Settings size={18} className="text-amber-500 fill-amber-500/20 animate-spin-slow" />,
      iconBg: 'bg-[#2b1b11] border border-amber-900/30',
      descLines: ['Preferences and', 'troubleshooting']
    }
  ];

  const popularTopics = [
    {
      title: 'How to trigger SOS?',
      desc: 'Different ways to trigger SOS in an emergency',
      icon: <PhoneCall size={16} className="text-purple-405" />,
      iconBg: 'bg-purple-500/10 border border-purple-500/20'
    },
    {
      title: 'How does live location sharing work?',
      desc: 'Share your live location with your trusted contacts',
      icon: <Users size={16} className="text-emerald-450" />,
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20'
    },
    {
      title: 'Who will be notified when I trigger SOS?',
      desc: 'Understand alert flow and notifications',
      icon: <Bell size={16} className="text-blue-455" />,
      iconBg: 'bg-blue-500/10 border border-blue-500/20'
    },
    {
      title: 'How to add or remove guardians?',
      desc: 'Manage your guardian network',
      icon: <Lock size={16} className="text-amber-505" />,
      iconBg: 'bg-amber-500/10 border border-amber-500/20'
    },
    {
      title: 'App permissions required',
      desc: 'Why KAVACH needs certain permissions',
      icon: <Settings size={16} className="text-purple-405" />,
      iconBg: 'bg-purple-500/10 border border-purple-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-[#07050f] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200 selection:bg-[#8b5cf6]/30">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header Section */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-slate-300 bg-[#121020]/90 border border-[#2b254d] hover:bg-[#1a1630] rounded-full transition-colors cursor-pointer shadow-md"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-left">
              <h1 className="text-lg font-black text-white tracking-tight leading-tight">Help Center</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">We're here to help you stay safe</p>
            </div>
          </div>
          {/* Header Headphones Badge with Star Glow */}
          <div className="w-11 h-11 rounded-full bg-[#1b0e35] border border-[#522d99] flex items-center justify-center text-[#c084fc] shrink-0 shadow-lg relative">
            <div className="absolute inset-0 bg-[#8b5cf6]/10 rounded-full blur-md"></div>
            {/* Tiny stars decorations */}
            <span className="absolute -top-1.5 -left-1 text-[7px] text-purple-400 opacity-60">✦</span>
            <span className="absolute -bottom-1 -right-1 text-[7px] text-purple-300 opacity-60">✦</span>
            <Headphones size={18} className="relative z-10" />
          </div>
        </header>

        {/* Search Bar */}
        <div className="flex items-center gap-3.5 bg-[#0e0c1f] border border-[#222135] rounded-[18px] p-2 pl-3 shadow-lg h-14">
          <div className="w-9 h-9 rounded-full bg-[#17152b] border border-white/5 flex items-center justify-center shrink-0">
            <Search size={16} className="text-[#a855f7]" />
          </div>
          <input 
            type="text" 
            placeholder="Search for help, topics or questions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[12.5px] text-white placeholder-slate-500 w-full focus:ring-0"
          />
          <button 
            onClick={() => toast.info("Listening for voice search...")}
            className="w-10 h-10 rounded-full bg-[#7c4dff] hover:bg-[#8b5cf6] text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all active:scale-95 border-none"
          >
            <Mic size={16} />
          </button>
        </div>

        {/* Categories Section */}
        <section className="text-left bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-4 px-3 shadow-xl">
          <h3 className="text-[13px] font-black text-white mb-4 tracking-wide px-2">How can we help you today?</h3>
          
          <div className="flex flex-col gap-2.5">
            {/* Top Row: 3 Items */}
            <div className="grid grid-cols-3 gap-2.5">
              {categories.slice(0, 3).map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => toast.info(`Opening category: ${cat.title}`)}
                  className="bg-[#0f0e26] border border-[#22213b] hover:border-[#8b5cf6]/40 rounded-[20px] p-2 pt-3.5 pb-4 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-md group hover:-translate-y-0.5 min-h-[145px]"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cat.iconBg} mb-3.5 shadow-inner`}>
                    {cat.icon}
                  </div>
                  <div className="flex flex-col items-center justify-start flex-1 w-full">
                    <h4 className="text-[10px] font-bold text-white leading-tight mb-2 tracking-tight">
                      {cat.id === 'account' ? (
                        <>Account &amp;<br />Security</>
                      ) : cat.id === 'sos' ? (
                        <>SOS &amp;<br />Alerts</>
                      ) : (
                        <>Tracking &amp;<br />Location</>
                      )}
                    </h4>
                    <div className="text-[8px] text-slate-450 leading-tight w-full flex flex-col items-center justify-center mt-auto font-medium">
                      {cat.descLines.map((line, idx) => (
                        <span key={idx} className="block truncate w-full">{line}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row: 2 Items Centered with exact same width */}
            <div className="grid grid-cols-2 gap-2.5 w-[66.6%] mx-auto">
              {categories.slice(3, 5).map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => toast.info(`Opening category: ${cat.title}`)}
                  className="bg-[#0f0e26] border border-[#22213b] hover:border-[#8b5cf6]/40 rounded-[20px] p-2 pt-3.5 pb-4 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-md group hover:-translate-y-0.5 min-h-[145px]"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cat.iconBg} mb-3.5 shadow-inner`}>
                    {cat.icon}
                  </div>
                  <div className="flex flex-col items-center justify-start flex-1 w-full">
                    <h4 className="text-[10px] font-bold text-white leading-tight mb-2 tracking-tight">
                      {cat.id === 'guardians' ? (
                        <>Guardians &amp;<br />Protectors</>
                      ) : (
                        <>App &amp;<br />Settings</>
                      )}
                    </h4>
                    <div className="text-[8px] text-slate-455 leading-tight w-full flex flex-col items-center justify-center mt-auto font-medium">
                      {cat.descLines.map((line, idx) => (
                        <span key={idx} className="block truncate w-full">{line}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Topics Section */}
        <section className="text-left bg-[#0d0c1b] border border-[#222135] rounded-[20px] p-4 shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[12.5px] font-extrabold text-white tracking-wide">Popular Topics</h3>
            <button 
              onClick={() => toast.info("Viewing all help topics")}
              className="text-[#a855f7] hover:text-[#c084fc] text-[11px] font-semibold bg-transparent border-none cursor-pointer"
            >
              View all
            </button>
          </div>
          
          <div className="flex flex-col divide-y divide-[#222135]">
            {popularTopics.map((topic, index) => (
              <div 
                key={index}
                onClick={() => toast.info(`Help guide: ${topic.title}`)}
                className="flex items-center justify-between py-3 hover:bg-white/[0.01] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 ${topic.iconBg}`}>
                    {topic.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[12.5px] font-semibold text-slate-100 group-hover:text-white transition-colors">{topic.title}</h4>
                    <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">{topic.desc}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-650 group-hover:text-white transition-colors ml-2 shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Safety priority banner */}
        <div className="bg-gradient-to-r from-[#170e30] to-[#0a061a] border border-[#3c228a]/40 rounded-[20px] p-4.5 flex items-center justify-between gap-4 shadow-lg text-left relative overflow-hidden">
          {/* Ambient Purple Glow */}
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-[#8b5cf6]/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
            {/* Double Circle Shield Badge */}
            <div className="relative shrink-0 flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/5  opacity-60"></div>
              <div className="w-11 h-11 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 flex items-center justify-center text-[#c084fc] shadow-inner">
                <ShieldCheck size={22} className="fill-[#8b5cf6]/10" />
              </div>
            </div>
            
            <div className="min-w-0">
              <h4 className="text-[13px] font-extrabold text-white leading-tight">Your safety is our priority</h4>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-normal pr-1">
                Can't find what you're looking for? Our support team is ready to help you.
              </p>
            </div>
          </div>

          <button 
            onClick={() => toast.success("Connecting to Support...")}
            className="bg-[#7c4dff] hover:bg-[#8b5cf6] text-white px-4 py-2.5 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border-none"
          >
            <Headphones size={12} /> Contact Support
          </button>
        </div>

        {/* Need more help columns */}
        <section className="text-left">
          <h3 className="text-[12px] font-bold text-white mb-2.5 px-1">Need more help?</h3>
          <div className="grid grid-cols-2 gap-3">
            
            {/* Live Chat */}
            <div 
              onClick={() => toast.info("Starting live chat support...")}
              className="bg-[#0d0c1b] border border-[#222135] rounded-[18px] p-4 flex items-center gap-3.5 hover:border-[#8b5cf6]/30 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-white group-hover:text-[#a855f7] transition-colors leading-tight">Live Chat</h4>
                <p className="text-[9.5px] text-[#10b981] font-bold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block "></span>
                  Available 24/7
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">Chat with support team</p>
              </div>
            </div>

            {/* Email Support */}
            <div 
              onClick={() => toast.info("Opening email draft to support@kavach.app")}
              className="bg-[#0d0c1b] border border-[#222135] rounded-[18px] p-4 flex items-center gap-3.5 hover:border-[#8b5cf6]/30 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-white group-hover:text-[#a855f7] transition-colors leading-tight">Email Support</h4>
                <p className="text-[9.5px] text-slate-400 font-bold mt-0.5 truncate">support@kavach.app</p>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">We'll reply within 24 hours</p>
              </div>
            </div>

          </div>
        </section>

        {/* Footer Security Badge */}
        <div 
          onClick={() => toast.info("All support data is encrypted End-to-End.")}
          className="flex items-center justify-between bg-[#0d0c1b]/60 border border-[#222135]/40 rounded-[14px] px-3.5 py-2.5 hover:bg-[#0d0c1b] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 text-slate-400 text-[10px] font-semibold">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>All your conversations are secure and confidential.</span>
          </div>
          <ChevronRight size={13} className="text-slate-600 group-hover:text-white transition-colors" />
        </div>

      </div>
    </div>
  );
}
