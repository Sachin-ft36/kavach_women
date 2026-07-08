import React from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Bell, 
  Users, 
  MapPin,
  Video,
  Battery,
  Info,
  Calendar,
  HardDrive,
  Smartphone,
  ChevronRight,
  Shield,
  FileText,
  Code,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface AboutKavachProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutKavach({ isOpen, onClose }: AboutKavachProps) {
  if (!isOpen) return null;

  const whatsNew = [
    {
      id: 'tracking',
      title: 'Improved Live Tracking',
      desc: 'More accurate location sharing with real-time route updates.',
      icon: <MapPin size={16} className="text-[#a855f7]" />,
      iconBg: 'bg-[#a855f7]/15'
    },
    {
      id: 'sos',
      title: 'Smart SOS Enhancements',
      desc: 'Faster alerts, voice activation improvements and auto-call retry.',
      icon: <Shield size={16} className="text-red-400" />,
      iconBg: 'bg-red-500/15'
    },
    {
      id: 'network',
      title: 'Guardian Network Upgrade',
      desc: 'Easier guardian management and instant notification delivery.',
      icon: <Users size={16} className="text-[#3b82f6]" />,
      iconBg: 'bg-blue-500/15'
    },
    {
      id: 'capture',
      title: 'Evidence Capture Improvements',
      desc: 'Better media quality, auto-backup and secure storage.',
      icon: <Video size={16} className="text-emerald-400" />,
      iconBg: 'bg-emerald-500/15'
    },
    {
      id: 'battery',
      title: 'Battery Optimization',
      desc: 'Enhanced background performance with better battery efficiency.',
      icon: <Battery size={16} className="text-amber-500" />,
      iconBg: 'bg-amber-500/15'
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-[#07050f] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200 selection:bg-[#8b5cf6]/30">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header Section */}
        <header className="flex items-center gap-3 mb-2">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-300 bg-[#121020]/90 border border-[#2b254d] hover:bg-[#1a1630] rounded-full transition-colors cursor-pointer shadow-md shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-left">
            <h1 className="text-lg font-black text-white tracking-tight leading-tight">About KAVACH</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Know more about your safety companion</p>
          </div>
        </header>

        {/* Hero Banner (Top Card) */}
        <div className="bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl flex gap-5">
          {/* Left Brand Identity */}
          <div className="flex flex-col items-center justify-center w-[120px] shrink-0 border-r border-[#22213b] pr-5 relative">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[#7c4dff]/20 blur-[30px] rounded-full pointer-events-none"></div>
            
            {/* Woman Shield SVG Logo */}
            <div className="w-20 h-24 relative z-10 drop-shadow-[0_4px_15px_rgba(124,77,255,0.4)] mb-2">
              <svg viewBox="0 0 100 120" className="w-full h-full">
                {/* Shield Base */}
                <path d="M 50 5 C 75 5 90 20 90 35 C 90 70 65 105 50 115 C 35 105 10 70 10 35 C 10 20 25 5 50 5 Z" fill="#2b1650" stroke="#8b5cf6" strokeWidth="4" />
                <path d="M 50 5 C 75 5 90 20 90 35 C 90 70 65 105 50 115 C 35 105 10 70 10 35 C 10 20 25 5 50 5 Z" fill="url(#shieldGrad)" opacity="0.6" />
                
                {/* Defs for Gradient */}
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c4dff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#2b1650" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Woman Profile Silhouette */}
                <path d="M 50 25 C 65 25 70 40 68 55 C 66 65 60 70 52 75 C 50 78 48 82 45 80 C 42 78 45 72 45 68 C 45 60 55 58 55 45 C 55 35 48 35 45 40 C 40 45 35 55 38 65 C 40 70 35 75 32 70 C 28 60 30 40 40 30 C 45 25 50 25 50 25 Z" fill="white" />
                <path d="M 45 80 C 50 82 55 85 55 90 C 55 95 45 95 45 90 C 45 85 40 82 45 80 Z" fill="white" />
                
                {/* Pink Dot (Bindi/Safety Marker) */}
                <circle cx="50" cy="110" r="5" fill="#f43f5e" />
              </svg>
            </div>
            
            <h2 className="text-[15px] font-black text-white tracking-widest mt-1">KAVACH</h2>
            <p className="text-[7.5px] font-bold text-[#a855f7] tracking-wider mt-1 text-center whitespace-nowrap">Suraksha. Sahayata. Saath.</p>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col py-1">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#a855f7] bg-[#1a123a] px-2 py-0.5 rounded-md">Version</span>
                <span className="text-[22px] font-black text-white leading-none tracking-tight">1.2.0</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[#10b981]">
                <ShieldCheck size={9} />
                <span className="text-[8.5px] font-bold">You're up to date</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-[1.6] mb-auto font-medium">
              KAVACH is your personal safety companion, designed to protect, alert and connect you with your trusted network in any situation.
            </p>

            <div className="flex items-center justify-between gap-1 mt-4 pt-4 border-t border-[#22213b]">
              <div className="flex items-center gap-1.5 text-slate-200">
                <ShieldCheck size={12} className="text-[#a855f7]" />
                <span className="text-[9.5px] font-bold">Protect</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <Bell size={12} className="text-[#a855f7]" />
                <span className="text-[9.5px] font-bold">Alert</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <Users size={12} className="text-[#a855f7]" />
                <span className="text-[9.5px] font-bold">Connect</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's New Section */}
        <section className="bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl">
          <div className="flex items-center gap-2.5 mb-5">
            <h3 className="text-[13px] font-extrabold text-white">What's New in 1.2.0</h3>
            <span className="bg-[#a855f7] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">NEW</span>
          </div>
          
          <div className="flex flex-col">
            {whatsNew.map((item, idx) => (
              <div key={item.id} className={`flex items-start gap-3.5 py-3.5 ${idx !== whatsNew.length - 1 ? 'border-b border-[#1e1a3a]' : ''}`}>
                <div className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-[11px] font-bold text-slate-200 leading-tight mb-1">{item.title}</h4>
                  <p className="text-[9px] text-slate-450 leading-[1.4] pr-2">{item.desc}</p>
                </div>
                <div className="shrink-0 pt-1">
                  <span className="text-[9.5px] font-bold text-emerald-400">NEW</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About KAVACH Detailed Info */}
        <section className="bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-[#a855f7]" />
                <h3 className="text-[13px] font-extrabold text-white">About KAVACH</h3>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-[1.6]">
                KAVACH is built with a mission to make every individual feel safe and empowered. Your safety is our priority.
              </p>
            </div>
            
            {/* 3D Glowing Shield Icon Graphic */}
            <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
              {/* Orbital rings */}
              <div className="absolute w-full h-full border border-[#8b5cf6]/20 rounded-full scale-[1.2]"></div>
              <div className="absolute w-full h-full border border-[#8b5cf6]/40 rounded-full scale-[0.9]"></div>
              {/* Shield Body */}
              <div className="absolute z-10 w-11 h-12 bg-gradient-to-br from-[#a855f7] to-[#6d28d9] rounded-b-xl rounded-t-sm clip-path-shield shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 15%, 100% 60%, 50% 100%, 0% 60%, 0% 15%)' }}>
                <Check size={20} strokeWidth={4} className="text-white drop-shadow-md" />
              </div>
              {/* Particles */}
              <div className="absolute top-1 right-0 w-1 h-1 bg-[#c084fc] rounded-full "></div>
              <div className="absolute bottom-2 left-0 w-1.5 h-1.5 bg-[#a855f7] rounded-full  delay-300"></div>
            </div>
          </div>

          <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-[#222135]">
              <div className="flex items-center gap-3">
                <Info size={14} className="text-[#a855f7]" />
                <span className="text-[11px] font-semibold text-slate-200">App Version</span>
              </div>
              <span className="text-[11px] text-slate-400">1.2.0 (Build 120)</span>
            </div>
            <div className="flex items-center justify-between p-3.5 border-b border-[#222135]">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-[#a855f7]" />
                <span className="text-[11px] font-semibold text-slate-200">Release Date</span>
              </div>
              <span className="text-[11px] text-slate-400">24 May 2025</span>
            </div>
            <div className="flex items-center justify-between p-3.5 border-b border-[#222135]">
              <div className="flex items-center gap-3">
                <HardDrive size={14} className="text-[#a855f7]" />
                <span className="text-[11px] font-semibold text-slate-200">App Size</span>
              </div>
              <span className="text-[11px] text-slate-400">48.7 MB</span>
            </div>
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <Smartphone size={14} className="text-[#a855f7]" />
                <span className="text-[11px] font-semibold text-slate-200">Platform</span>
              </div>
              <span className="text-[11px] text-slate-400">Android 7.0+</span>
            </div>
          </div>
        </section>

        {/* Footer Navigation Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div onClick={() => toast.info("Privacy Policy")} className="bg-[#0c0a1a] border border-[#1e1a3a] rounded-[16px] p-3 flex flex-col gap-2 cursor-pointer hover:bg-[#121026] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} className="text-purple-400" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                Privacy Policy <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400" />
              </h4>
              <p className="text-[8px] text-slate-500 mt-0.5">Read our privacy policy</p>
            </div>
          </div>

          <div onClick={() => toast.info("Terms of Service")} className="bg-[#0c0a1a] border border-[#1e1a3a] rounded-[16px] p-3 flex flex-col gap-2 cursor-pointer hover:bg-[#121026] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                Terms of Service <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400" />
              </h4>
              <p className="text-[8px] text-slate-500 mt-0.5">Read our terms</p>
            </div>
          </div>

          <div onClick={() => toast.info("Licenses")} className="bg-[#0c0a1a] border border-[#1e1a3a] rounded-[16px] p-3 flex flex-col gap-2 cursor-pointer hover:bg-[#121026] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Code size={14} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                Licenses <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400" />
              </h4>
              <p className="text-[8px] text-slate-500 mt-0.5">Open source licenses</p>
            </div>
          </div>
        </div>

        {/* Bottom Brand */}
        <div className="mt-2 mb-4 flex items-center justify-between px-2">
          <p className="text-[10.5px] font-medium text-slate-400">
            Made with <span className="text-rose-500 mx-0.5">❤️</span> in India for your safety
          </p>
          <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-white flex items-center justify-center shadow-sm">
            <span className="text-[12px] leading-none">🇮🇳</span>
          </div>
        </div>

      </div>
    </div>
  );
}
