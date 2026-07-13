import React from 'react';
import { ArrowLeft, Check, Shield, Star, ChevronRight, Lock, ShieldCheck } from 'lucide-react';

interface SafeSpaceOptionsProps {
  onBack: () => void;
  onTalkToSomeone: () => void;
  onCalmDown: () => void;
  onStartAIChat: () => void;
  onStartJournalChat: () => void;
}

export const SafeSpaceOptions: React.FC<SafeSpaceOptionsProps> = ({ 
  onBack, 
  onTalkToSomeone, 
  onCalmDown, 
  onStartAIChat, 
  onStartJournalChat 
}) => {
  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#030108] text-white font-sans flex flex-col justify-between overflow-hidden selection:bg-purple-500/30 relative p-4 pb-2">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Responsive adjustments for options view */
        @media (max-height: 740px) {
          .options-hero {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            margin-top: 2px !important;
            margin-bottom: 2px !important;
          }
          .options-hero-heart-wrapper {
            width: 55px !important;
            height: 55px !important;
          }
          .options-hero-heart-svg {
            width: 48px !important;
            height: 48px !important;
          }
          .options-hero-hands-svg {
            width: 70px !important;
            height: 23px !important;
            bottom: -2px !important;
          }
          .options-hero-heading {
            font-size: 15px !important;
          }
          .options-hero-para {
            font-size: 9.5px !important;
            line-height: 1.2 !important;
          }
          .options-list-container {
            gap: 6px !important;
          }
          .option-card-button {
            height: 62px !important;
            min-height: 62px !important;
            padding: 8px 12px !important;
            border-radius: 12px !important;
          }
          .option-card-icon-container {
            width: 40px !important;
            height: 40px !important;
            border-radius: 10px !important;
          }
          .option-card-icon-container svg {
            width: 22px !important;
            height: 22px !important;
          }
          .option-card-button .text-[14px] {
            font-size: 12px !important;
          }
          .option-card-desc {
            display: none !important; /* Hide description to save significant vertical space */
          }
          .option-card-chevron {
            width: 24px !important;
            height: 24px !important;
          }
          .option-card-chevron svg {
            width: 14px !important;
            height: 14px !important;
          }
        }

        @media (max-height: 640px) {
          .options-hero {
            display: none !important; /* On extremely short screens, hide the hero header to fit all cards perfectly */
          }
          .options-list-container {
            gap: 5px !important;
          }
          .option-card-button {
            height: 56px !important;
            min-height: 56px !important;
            padding: 6px 10px !important;
          }
          .option-card-icon-container {
            width: 36px !important;
            height: 36px !important;
            border-radius: 8px !important;
          }
          .option-card-icon-container svg {
            width: 20px !important;
            height: 20px !important;
          }
          .option-card-button .text-[14px] {
            font-size: 11.5px !important;
          }
        }
      `}} />

      {/* Deep Ambient Background Glows */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-pink-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* 1. Header Navigation & Progress Bar */}
      <div className="flex-none flex justify-between items-center px-2 pt-2 pb-1.5 z-20">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors border-none cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" />
        </button>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5">
          {/* Step 1 Check */}
          <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.5)]">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
          </div>
          
          {/* Connection Line */}
          <div className="w-6 h-[2px] bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
          
          {/* Step 3 (Current) */}
          <div className="w-7 h-7 rounded-full bg-transparent border-2 border-[#A855F7] text-white flex items-center justify-center text-[12px] font-bold shadow-[0_0_15px_rgba(168,85,247,0.6)] relative">
            <div className="absolute inset-0 bg-[#A855F7]/30 rounded-full blur-[4px]"></div>
            <span className="relative z-10">3</span>
          </div>
          
          {/* Connection Line */}
          <div className="w-6 h-[2px] bg-white/10"></div>
          
          {/* Step 4 */}
          <div className="w-6 h-6 rounded-full bg-transparent border border-white/20 text-white/40 flex items-center justify-center text-[11px] font-semibold">
            4
          </div>
        </div>

        <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors relative border-none">
          <Shield className="w-4.5 h-4.5 text-[#A855F7]" />
          <Star className="w-2 h-2 text-[#A855F7] absolute fill-current" />
        </button>
      </div>

      {/* Step Badge */}
      <div className="flex-none flex justify-center z-20 mb-1">
        <div className="bg-[#1A0B2E] border border-purple-500/30 px-3.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest text-[#D8B4FE]">
          STEP 3 OF 5
        </div>
      </div>

      {/* Scrollable Container (Hero Section + Options List) */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 sm:space-y-4 px-0.5 min-h-0 z-10">
        
        {/* 2. Hero Section */}
        <div className="options-hero flex-none flex items-center px-3 py-1 relative">
          
          {/* Heart Illustration (Left) */}
          <div className="options-hero-heart-wrapper w-[85px] h-[85px] relative animate-float flex-shrink-0 flex items-center justify-center">
            {/* Glows */}
            <div className="absolute w-[60px] h-[60px] bg-purple-500/35 rounded-full blur-[20px]"></div>
            
            <svg viewBox="0 0 100 100" className="options-hero-heart-svg w-[72px] h-[72px] drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] z-10">
              <defs>
                <radialGradient id="heartGlowDetail" cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#E9D5FF" />
                  <stop offset="35%" stopColor="#C084FC" />
                  <stop offset="75%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#4C1D95" />
                </radialGradient>
              </defs>
              {/* Main Heart */}
              <path d="M50 82 C50 82 15 52 15 30 C15 14 27 6 40 16 C50 24 50 24 50 24 C50 24 50 24 60 16 C73 6 85 14 85 30 C85 52 50 82 50 82 Z" fill="url(#heartGlowDetail)" />
              {/* Cute sleeping face */}
              <path d="M 38 44 Q 42 48 46 44" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 54 44 Q 58 48 62 44" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 45 52 Q 50 56 55 52" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>

            {/* Glowing Palms cradling heart */}
            <svg viewBox="0 0 200 80" className="options-hero-hands-svg absolute -bottom-1 w-[110px] h-[36px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] z-20">
              <defs>
                <linearGradient id="handGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D8B4FE" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              {/* Left hand */}
              <path d="M 45 70 C 45 70 38 40 68 25 C 78 18 88 23 88 23 C 88 23 83 28 73 38 C 63 48 55 70 55 70 Z" fill="url(#handGradient)" />
              {/* Right hand */}
              <path d="M 155 70 C 155 70 162 40 132 25 C 122 18 112 23 112 23 C 112 23 117 28 127 38 C 137 48 145 70 145 70 Z" fill="url(#handGradient)" />
            </svg>

            {/* Floating tiny sparkles & hearts */}
            <svg viewBox="0 0 24 24" className="absolute top-0 right-1.5 w-3.5 h-3.5 text-[#C084FC] fill-current"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <svg viewBox="0 0 24 24" className="absolute top-4 -left-1 w-2.5 h-2.5 text-[#F472B6] fill-current" style={{ animationDelay: '1.5s' }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>

          {/* Text Content (Right) */}
          <div className="pl-3.5 flex-1 relative">
            <h1 className="options-hero-heading text-[19px] font-extrabold leading-tight tracking-tight text-white mb-0.5 font-inter">
              What would help
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] via-[#C084FC] to-[#8B5CF6] pb-0.5">
                you right now?
              </span>
            </h1>
            
            {/* Sparkle Outline Doodle next to header */}
            <svg className="absolute right-1.5 top-0.5 w-5 h-5 text-purple-400 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3c.13 0 .25.1.29.22l1.6 4.93a.3.3 0 00.28.2l5.18.33a.3.3 0 01.17.52l-3.9 3.46a.3.3 0 00-.1.3l1.14 5.07a.3.3 0 01-.45.33L12 15.75a.3.3 0 00-.3 0l-4.41 2.6a.3.3 0 01-.45-.32l1.14-5.08a.3.3 0 00-.1.3L4.01 9.2a.3.3 0 01.17-.52l5.18-.33a.3.3 0 00.28-.2l1.6-4.93c.04-.12.16-.22.29-.22z" />
            </svg>

            <p className="options-hero-para text-[#9CA3AF] text-[11px] leading-relaxed mt-0.5 font-medium font-inter">
              Choose what feels right for you.<br/>
              You can always change later.
            </p>
          </div>
        </div>

        {/* 3. Options List */}
        <div className="options-list-container flex flex-col gap-2.5 sm:gap-4.5 px-2">
          
          {/* Card 1: Baat karna (Talk) - Pink Glow Theme */}
          <button 
            onClick={onTalkToSomeone}
            className="option-card-button group h-[88px] sm:h-[110px] min-h-[88px] sm:min-h-[110px] bg-[#14051a] border border-[#f472b6]/20 hover:border-[#f472b6]/40 rounded-2xl sm:rounded-[22px] p-3.5 sm:p-5 flex items-center gap-4 sm:gap-6 relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer text-left w-full shadow-[0_0_15px_rgba(244,114,182,0.05)] border-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#f472b6]/10 to-transparent opacity-60 pointer-events-none" />
            <div className="option-card-icon-container w-[54px] h-[54px] sm:w-[72px] sm:h-[72px] rounded-[16px] sm:rounded-[20px] bg-gradient-to-b from-[#831843]/60 to-[#4c0519]/80 flex items-center justify-center shadow-[inset_0_0_12px_rgba(244,114,182,0.25),0_4px_12px_rgba(244,114,182,0.15)] flex-shrink-0 relative border border-[#f472b6]/30">
              <svg viewBox="0 0 64 64" className="w-9 h-9 sm:w-12 sm:h-12" fill="none">
                <circle cx="32" cy="32" r="24" fill="url(#pinkGlow)" opacity="0.15" />
                {/* Person 1 (Left) */}
                <circle cx="23" cy="32" r="6.5" fill="#F472B6" />
                <path d="M11 50 C11 41 17 38 23 38 C28.5 38 33.5 40.5 34.5 46" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
                {/* Person 2 (Right) */}
                <circle cx="41" cy="32" r="6.5" fill="#FF5A90" />
                <path d="M29.5 46 C31 40 35 38 41 38 C47 38 53 41 53 50" stroke="#FF5A90" strokeWidth="3" strokeLinecap="round" />
                {/* Big Heart on top */}
                <path d="M32 21 C32 21 28.5 17 26 19.5 C23.5 22 27.5 26.5 32 29.5 C36.5 26.5 40.5 22 38 19.5 C35.5 17 32 21 32 21 Z" fill="#FF2D75" />
                <defs>
                  <radialGradient id="pinkGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="flex-1 text-left flex flex-col justify-center font-inter">
              <div className="text-[14px] sm:text-[17.5px] font-semibold leading-[1.2] tracking-tight">
                <span className="text-white block">I want someone</span>
                <span className="text-[#FF5A90]">to talk to</span>
              </div>
              <div className="option-card-desc text-[#9CA3AF] text-[10.5px] sm:text-[13px] mt-0.5 font-medium">Connect with someone you trust.</div>
            </div>
            <div className="option-card-chevron w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#FF5A90]" />
            </div>
          </button>

          {/* Card 2: Shant hona (Calm down) - Indigo Glow Theme */}
          <button 
            onClick={onCalmDown}
            className="option-card-button group h-[88px] sm:h-[110px] min-h-[88px] sm:min-h-[110px] bg-[#07091F] border border-[#6366f1]/20 hover:border-[#6366f1]/40 rounded-2xl sm:rounded-[22px] p-3.5 sm:p-5 flex items-center gap-4 sm:gap-6 relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer text-left w-full shadow-[0_0_15px_rgba(99,102,241,0.05)] border-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/10 to-transparent opacity-60 pointer-events-none" />
            <div className="option-card-icon-container w-[54px] h-[54px] sm:w-[72px] sm:h-[72px] rounded-[16px] sm:rounded-[20px] bg-gradient-to-b from-[#1e1b4b]/60 to-[#0f172a]/80 flex items-center justify-center shadow-[inset_0_0_12px_rgba(99,102,241,0.25),0_4px_12px_rgba(99,102,241,0.15)] flex-shrink-0 relative border border-[#6366f1]/30">
              <svg viewBox="0 0 64 64" className="w-9 h-9 sm:w-12 sm:h-12" fill="none">
                <circle cx="32" cy="32" r="24" fill="url(#blueGlow)" opacity="0.15" />
                {/* Meditating Figure */}
                <circle cx="32" cy="22" r="5" fill="#818CF8" />
                <path d="M32 29 C27 29 25 33 25 39 C25 43 27 45 32 45 C37 45 39 43 39 39 C39 33 37 29 32 29 Z" fill="#818CF8" />
                <path d="M19 46 C19 41 22 39 26 39 C29 39 31 41 32 41 C33 41 35 39 38 39 C42 39 45 41 45 46 C45 49.5 41 51 32 51 C23 51 19 49.5 19 46 Z" fill="#6366F1" />
                {/* Sparkles */}
                <path d="M14 22 L16 24 L14 26 L12 24 Z" fill="#93C5FD" />
                <path d="M50 22 L52 24 L50 26 L48 24 Z" fill="#93C5FD" />
                <path d="M18 36 L19.5 37.5 L18 39 L16.5 37.5 Z" fill="#93C5FD" />
                <path d="M46 36 L47.5 37.5 L46 39 L44.5 37.5 Z" fill="#93C5FD" />
                <defs>
                  <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="flex-1 text-left flex flex-col justify-center font-inter">
              <div className="text-[14px] sm:text-[17.5px] font-semibold leading-[1.2] tracking-tight">
                <span className="text-white block">I want to</span>
                <span className="text-[#818CF8]">calm down</span>
              </div>
              <div className="option-card-desc text-[#9CA3AF] text-[10.5px] sm:text-[13px] mt-0.5 font-medium">Relax your mind and body.</div>
            </div>
            <div className="option-card-chevron w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#818CF8]" />
            </div>
          </button>

          {/* Card 3: AI Support - Purple Glow Theme */}
          <button 
            onClick={onStartAIChat}
            className="option-card-button group h-[88px] sm:h-[110px] min-h-[88px] sm:min-h-[110px] bg-[#0c051a] border border-[#a855f7]/20 hover:border-[#a855f7]/40 rounded-2xl sm:rounded-[22px] p-3.5 sm:p-5 flex items-center gap-4 sm:gap-6 relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer text-left w-full shadow-[0_0_15px_rgba(168,85,247,0.05)] border-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/10 to-transparent opacity-60 pointer-events-none" />
            <div className="option-card-icon-container w-[54px] h-[54px] sm:w-[72px] sm:h-[72px] rounded-[16px] sm:rounded-[20px] bg-gradient-to-b from-[#3b0764]/60 to-[#1e1b4b]/80 flex items-center justify-center shadow-[inset_0_0_12px_rgba(168,85,247,0.25),0_4px_12px_rgba(168,85,247,0.15)] flex-shrink-0 relative border border-[#a855f7]/30">
              <svg viewBox="0 0 64 64" className="w-9 h-9 sm:w-12 sm:h-12" fill="none">
                <circle cx="32" cy="32" r="24" fill="url(#purpleGlow)" opacity="0.15" />
                <path d="M18 32 C18 18 46 18 46 32" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" />
                <rect x="20" y="24" width="24" height="20" rx="9" fill="#C084FC" />
                <rect x="23" y="27" width="18" height="13" rx="5" fill="#1E1B4B" />
                <path d="M26 33 C27 31 29 31 30 33" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M34 33 C35 31 37 31 38 33" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M30 37 C31 38 33 38 34 37" stroke="#E9D5FF" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M32 24 V16" stroke="#A855F7" strokeWidth="2" />
                <circle cx="32" cy="14" r="2.5" fill="#F3E8FF" />
                <rect x="14" y="28" width="6" height="10" rx="3" fill="#A855F7" />
                <rect x="44" y="28" width="6" height="10" rx="3" fill="#A855F7" />
                <defs>
                  <radialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="flex-1 text-left flex flex-col justify-center font-inter">
              <div className="text-[14px] sm:text-[17.5px] font-semibold leading-[1.2] tracking-tight">
                <span className="text-white block">I want AI</span>
                <span className="text-[#C084FC]">support</span>
              </div>
              <div className="option-card-desc text-[#9CA3AF] text-[10.5px] sm:text-[13px] mt-0.5 font-medium">Talk to KAVACH AI.</div>
            </div>
            <div className="option-card-chevron w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#C084FC]" />
            </div>
          </button>

          {/* Card 4: Apni baat likhna (Express) - Orange Glow Theme */}
          <button 
            onClick={onStartJournalChat}
            className="option-card-button group h-[88px] sm:h-[110px] min-h-[88px] sm:min-h-[110px] bg-[#1a0803] border border-[#f97316]/20 hover:border-[#f97316]/40 rounded-2xl sm:rounded-[22px] p-3.5 sm:p-5 flex items-center gap-4 sm:gap-6 relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer text-left w-full shadow-[0_0_15px_rgba(249,115,22,0.05)] border-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#f97316]/10 to-transparent opacity-60 pointer-events-none" />
            <div className="option-card-icon-container w-[54px] h-[54px] sm:w-[72px] sm:h-[72px] rounded-[16px] sm:rounded-[20px] bg-gradient-to-b from-[#7c2d12]/60 to-[#431407]/80 flex items-center justify-center shadow-[inset_0_0_12px_rgba(249,115,22,0.25),0_4px_12px_rgba(249,115,22,0.15)] flex-shrink-0 relative border border-[#f97316]/30">
              <svg viewBox="0 0 64 64" className="w-9 h-9 sm:w-12 sm:h-12" fill="none">
                <circle cx="32" cy="32" r="24" fill="url(#orangeGlow)" opacity="0.15" />
                <rect x="18" y="14" width="30" height="38" rx="4" fill="#FDBA74" />
                <rect x="22" y="18" width="24" height="30" rx="2" fill="#FFE5D9" />
                <line x1="26" y1="24" x2="40" y2="24" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="30" x2="40" y2="30" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="36" x2="36" y2="36" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="20" r="2" fill="#94A3B8" />
                <circle cx="18" cy="28" r="2" fill="#94A3B8" />
                <circle cx="18" cy="36" r="2" fill="#94A3B8" />
                <circle cx="18" cy="44" r="2" fill="#94A3B8" />
                <g transform="translate(12, 10) rotate(-15)">
                  <rect x="28" y="15" width="5" height="22" rx="1" fill="#F97316" />
                  <path d="M28 37 L30.5 42 L33 37 Z" fill="#FED7AA" />
                  <path d="M30 40 L30.5 42 L31 40 Z" fill="#475569" />
                  <rect x="28" y="13" width="5" height="2" fill="#FDA4AF" />
                </g>
                <defs>
                  <radialGradient id="orangeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="flex-1 text-left flex flex-col justify-center font-inter">
              <div className="text-[14px] sm:text-[17.5px] font-semibold leading-[1.2] tracking-tight">
                <span className="text-white block">I just want to</span>
                <span className="text-[#FFBA74]">express myself</span>
              </div>
              <div className="option-card-desc text-[#9CA3AF] text-[10.5px] sm:text-[13px] mt-0.5 font-medium">Write down what's on your mind.</div>
            </div>
            <div className="option-card-chevron w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#FFBA74]" />
            </div>
          </button>

        </div>

      </div>

      {/* 4. Footer Banner */}
      <div className="flex-none px-2 pt-1 pb-1 z-10">
        <div className="bg-gradient-to-r from-[#17092e] to-[#0f0421] border border-purple-900/30 rounded-[16px] p-3 flex items-center justify-between relative overflow-hidden shadow-lg">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-950/60 flex items-center justify-center flex-shrink-0 border border-[#A855F7]/30">
              <Lock className="w-4.5 h-4.5 text-purple-300" />
            </div>
            <div className="font-inter">
              <h4 className="text-[12.5px] font-bold text-white leading-tight">This is your safe space.</h4>
              <p className="text-[#9386b0] text-[10px] mt-0.5 leading-snug">
                Everything you share is private and secure.
              </p>
            </div>
          </div>

          {/* Glowing Shield/Heart Illustration on the right */}
          <div className="flex items-center gap-1.5 opacity-90 relative pr-1">
            <div className="absolute -inset-1 bg-[#A855F7]/20 blur-[5px] rounded-full"></div>
            {/* Cute glowing heart */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-pink-400 fill-current"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            {/* Glowing lock */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#A855F7] fill-none stroke-current" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          
        </div>
      </div>

    </div>
  );
};
