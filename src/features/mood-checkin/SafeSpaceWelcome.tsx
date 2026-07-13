import React from 'react';
import { ArrowLeft, Shield, Star, Heart, ArrowRight, ShieldCheck } from 'lucide-react';

interface SafeSpaceWelcomeProps {
  onBack: () => void;
  onContinue: () => void;
}

export const SafeSpaceWelcome: React.FC<SafeSpaceWelcomeProps> = ({ onBack, onContinue }) => {
  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#090212] text-white font-sans flex flex-col justify-between overflow-hidden selection:bg-purple-500/30 relative p-3 pb-4">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-caveat {
          font-family: 'Caveat', cursive;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 3s;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        /* Responsive adjustments via Media Queries */
        @media (max-height: 740px) {
          .hero-container {
            height: 90px !important;
            margin-top: 2px !important;
            margin-bottom: 2px !important;
          }
          .hero-svg {
            width: 160px !important;
            height: 90px !important;
          }
          .hero-heart {
            width: 60px !important;
            height: 60px !important;
          }
          .hero-hands {
            width: 85px !important;
            height: 25px !important;
          }
          .typography-section {
            margin-top: 2px !important;
          }
          .typography-heading {
            font-size: 1.4rem !important;
          }
          .features-card {
            margin-top: 6px !important;
            padding: 6px !important;
          }
          .intention-card {
            margin-top: 6px !important;
            padding: 8px !important;
          }
          .action-button-area {
            margin-top: 8px !important;
          }
        }

        @media (min-width: 768px) {
          .typography-heading {
            font-size: 2.2rem !important;
          }
          .hero-container {
            height: 160px !important;
          }
          .hero-heart {
            width: 100px !important;
            height: 100px !important;
          }
        }
      `}} />

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-purple-600/20 blur-[90px] rounded-full pointer-events-none" />
      
      {/* Horizon Planet Curve */}
      <div className="absolute top-[220px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#170636] to-[#090212] rounded-[50%] blur-[2px] opacity-90 border-t border-purple-400/20 shadow-[0_-20px_50px_rgba(168,85,247,0.2)] pointer-events-none" />

      {/* Header Navigation */}
      <div className="flex justify-between items-center px-4 mt-2 z-20">
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors border-none cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-white/90" />
        </button>
        <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors relative border-none">
          <Shield className="w-4.5 h-4.5 text-[#A855F7]" />
          <Star className="w-2 h-2 text-[#A855F7] absolute fill-current" />
        </button>
      </div>

      {/* Content wrapper with flex layout for perfect height distribution */}
      <div className="flex-1 z-10 flex flex-col justify-between mt-1 mb-1">
          
          {/* Hero Illustration */}
          <div className="hero-container relative h-[120px] w-full flex items-center justify-center mt-1 mb-1">
            
            {/* Background Silhouetted Leaves */}
            <svg className="hero-svg absolute w-[220px] h-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-45 pointer-events-none" viewBox="0 0 350 200">
               {/* Left branch */}
               <path d="M 50 180 Q 70 120 120 100" fill="none" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round"/>
               <path d="M 80 140 Q 60 130 55 150 Q 70 160 80 140" fill="#6b21a8"/>
               <path d="M 95 115 Q 85 95 70 100 Q 80 120 95 115" fill="#6b21a8"/>
               <path d="M 120 100 Q 110 80 95 85 Q 105 105 120 100" fill="#6b21a8"/>
               {/* Right branch */}
               <path d="M 300 180 Q 280 120 230 100" fill="none" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round"/>
               <path d="M 270 140 Q 290 130 295 150 Q 280 160 270 140" fill="#6b21a8"/>
               <path d="M 255 115 Q 265 95 280 100 Q 270 120 255 115" fill="#6b21a8"/>
               <path d="M 230 100 Q 240 80 255 85 Q 245 105 230 100" fill="#6b21a8"/>
            </svg>

            {/* Floating Particles */}
            <div className="absolute w-1 h-1 bg-pink-400 rounded-full blur-[0.5px] top-4 left-[28%]"></div>
            <div className="absolute w-1 h-1 bg-purple-300 rounded-full blur-[0.5px] top-10 right-[33%] shadow-[0_0_8px_#d8b4fe]"></div>
            <div className="absolute w-1 h-1 bg-pink-300 rounded-full top-[20%] right-[28%] shadow-[0_0_6px_#f9a8d4]"></div>

            <div className="absolute top-[10px] left-[24%] text-purple-400 opacity-60 animate-float-delayed">
              <Heart className="w-2.5 h-2.5 fill-current" />
            </div>
            <div className="absolute top-[5px] right-[30%] text-purple-400 opacity-80 animate-float">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>

            {/* Main Glowing Heart & Face */}
            <div className="relative animate-float flex flex-col items-center">
              <svg viewBox="0 0 100 100" className="hero-heart w-[80px] h-[80px] drop-shadow-[0_0_25px_rgba(168,85,247,0.55)]">
                <defs>
                  <radialGradient id="heartGlow" cx="50%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#e9d5ff" />
                    <stop offset="30%" stopColor="#c084fc" />
                    <stop offset="70%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#581c87" />
                  </radialGradient>
                  <linearGradient id="handGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#6b21a8" />
                  </linearGradient>
                </defs>
                {/* Heart Base */}
                <path d="M50 85 C50 85 10 55 10 30 C10 13 26 5 40 16 C50 24 50 24 50 24 C50 24 50 24 60 16 C74 5 90 13 90 30 C90 55 50 85 50 85 Z" fill="url(#heartGlow)" />
                
                {/* Face */}
                {/* Left Eye */}
                <path d="M 38 45 Q 42 49 46 45" stroke="#2e1065" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Right Eye */}
                <path d="M 54 45 Q 58 49 62 45" stroke="#2e1065" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Smile */}
                <path d="M 46 54 Q 50 58 54 54" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>

              {/* Stylized Hands holding the heart */}
              <svg viewBox="0 0 200 60" className="hero-hands absolute -bottom-5 w-[110px] h-[33px] drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]">
                 <path d="M 40 60 C 40 60 40 30 70 20 C 80 15 90 20 90 20 C 90 20 85 25 75 35 C 65 45 60 60 60 60 Z" fill="url(#handGrad)" />
                 <path d="M 160 60 C 160 60 160 30 130 20 C 120 15 110 20 110 20 C 110 20 115 25 125 35 C 135 45 140 60 140 60 Z" fill="url(#handGrad)" />
              </svg>
            </div>
          </div>

          {/* Typography Section */}
          <div className="typography-section text-center px-6 mt-0.5">
            <h2 className="text-[12px] font-medium text-white/90">Welcome to</h2>
            <h1 className="typography-heading text-[1.8rem] font-bold leading-tight tracking-tight mt-0.5 bg-gradient-to-r from-[#FF5A90] via-[#D862FF] to-[#8C3AFF] bg-clip-text text-transparent drop-shadow-sm">
              Safe Space
            </h1>
            
            {/* Divider */}
            <div className="flex items-center justify-center gap-2 mt-1.5 opacity-80">
              <div className="h-[1px] w-4 bg-purple-400/40 rounded-full"></div>
              <Heart className="w-[7px] h-[7px] fill-[#c084fc] text-[#c084fc]" />
              <div className="h-[1px] w-4 bg-purple-400/40 rounded-full"></div>
            </div>
            
            <p className="text-[#a196bc] mt-2 text-[11px] font-medium leading-relaxed">
              You're not alone. Let's take <br/>one small step together.
            </p>
          </div>

          {/* Features Card */}
          <div className="features-card mx-4 mt-3 rounded-[20px] bg-[#120724] border border-[#2c174d] flex items-center shadow-lg relative overflow-hidden">
             {/* Subtle internal gradient */}
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>
             
             {/* Left Feature */}
             <div className="flex-1 py-2 pl-3 pr-1 flex items-center gap-2 relative z-10">
                <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-br from-[#571e96] to-[#2e0961] flex items-center justify-center border border-purple-400/20 shadow-[inset_0_0_6px_rgba(168,85,247,0.4)] flex-shrink-0 relative">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-[#e9d5ff] drop-shadow-[0_0_6px_rgba(233,213,255,0.7)]" fill="currentColor">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" transform="rotate(15 12 10)" />
                    <path d="M18.5 16L19 18.5L21.5 19L19 19.5L18.5 22L18 19.5L15.5 19L18 18.5L18.5 16Z" />
                  </svg>
                </div>
                <div className="text-left flex flex-col justify-center">
                  <h3 className="font-semibold text-[11.5px] text-white/95 leading-none">You matter.</h3>
                  <p className="text-[9.5px] text-[#a196bc] leading-[1.3] mt-0.5">Your feelings<br/>are valid.</p>
                </div>
             </div>

             {/* Divider */}
             <div className="w-[1px] h-7 bg-white/[0.08] flex-shrink-0"></div>

             {/* Right Feature */}
             <div className="flex-1 py-2 pl-2.5 pr-2 flex items-center gap-2 relative z-10">
                <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-br from-[#571e96] to-[#2e0961] flex items-center justify-center border border-purple-400/20 shadow-[inset_0_0_6px_rgba(168,85,247,0.4)] flex-shrink-0 relative">
                  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-[#e9d5ff]" fill="currentColor">
                    <path d="M17 10H16V7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7V10H7C5.9 10 5 10.9 5 12V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V12C19 10.9 18.1 10 17 10ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM14 10H10V7C10 5.9 10.9 5 12 5C13.1 5 14 5.9 14 7V10Z" />
                  </svg>
                </div>
                <div className="text-left flex flex-col justify-center">
                  <h3 className="font-semibold text-[11.5px] text-white/95 leading-none">Private & Safe</h3>
                  <p className="text-[9.5px] text-[#a196bc] leading-[1.3] mt-0.5">Everything stays<br/>between us.</p>
                </div>
             </div>
          </div>

          {/* Intention Card */}
          <div className="intention-card mx-2 mt-2 p-3 pt-2.5 rounded-[16px] bg-[#110722] border border-[#2c174d] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-center gap-2 mb-2">
              <div className="w-[24px] h-[24px] rounded-full bg-[#0a0314] border border-[#3f1d6b] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-[12px] h-[12px] text-[#d8b4fe]" fill="currentColor">
                  <path d="M12 3L13.2 8.8L19 10L13.2 11.2L12 17L10.8 11.2L5 10L10.8 8.8L12 3Z" />
                  <path d="M6.5 5.5L7 7L8.5 7.5L7 8L6.5 9.5L6 8L4.5 7.5L6 7L6.5 5.5Z" />
                </svg>
              </div>
              <span className="font-medium text-[12px] text-white/95 tracking-wide">Today's Intention</span>
            </div>

            <div className="flex flex-col items-center justify-center py-2 relative mt-0.5 mb-0.5">
              <div className="font-caveat text-[17px] text-[#cb8afb] leading-[1.3] flex flex-col items-center -rotate-[2.5deg] relative z-10 font-bold tracking-wide drop-shadow-[0_0_10px_rgba(203,138,251,0.3)]">
                <span className="pr-6">It's okay to have a bad day.</span>
                <div className="flex items-center justify-center gap-2 mt-0 ml-3">
                  <span>It's not okay to give up on yourself.</span>
                  <svg className="w-[17px] h-[17px] text-[#cb8afb] flex-shrink-0 mb-0.5 drop-shadow-[0_0_6px_rgba(203,138,251,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 7.5C10 3.5 4.5 4 4 9.5C3.5 14 10.5 20 12 21.5C13.5 20 20.5 14 20 9.5C19.5 4 14 3.5 12 7.5" />
                  </svg>
                </div>
              </div>
              
              <svg className="w-[110%] max-w-[340px] h-[8px] absolute -bottom-1 -rotate-[2.5deg]" viewBox="0 0 200 10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineFade" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 15 9 Q 80 1 195 3" fill="none" stroke="url(#lineFade)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-[6px] mt-2 mb-0.5">
              <div className="w-[5px] h-[5px] rounded-full bg-[#c084fc] shadow-[0_0_8px_#c084fc]"></div>
              <div className="w-[5px] h-[5px] rounded-full bg-white/[0.08]"></div>
              <div className="w-[5px] h-[5px] rounded-full bg-white/[0.08]"></div>
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="action-button-area px-4 mt-4 w-full">
            <button 
              onClick={onContinue}
              className="w-full relative group border-none bg-transparent cursor-pointer"
            >
              {/* Outer glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A90] to-[#8C3AFF] rounded-full blur-md opacity-60 group-hover:opacity-100 transition duration-300"></div>
              
              {/* Button core */}
              <div className="relative flex items-center justify-between p-1 rounded-full bg-gradient-to-r from-[#FF5A90] to-[#8C3AFF] overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4.5 h-4.5 text-white fill-current drop-shadow-sm" />
                </div>
                
                <span className="text-[14px] font-semibold text-white drop-shadow-sm">Continue</span>
                
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mr-1">
                  <ArrowRight className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </button>
            
            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[#9386b0] opacity-80 pb-1">
              <ShieldCheck className="w-[12px] h-[12px]" />
              <span className="text-[11px] font-medium tracking-wide">We're here for you. Always.</span>
            </div>
          </div>
      </div>
    </div>
  );
};
