import React, { useState } from 'react';
import { ArrowLeft, Check, Shield, Star, Heart, ArrowRight, Play, Lock, ChevronRight } from 'lucide-react';

interface CalmDownStepProps {
  onBack: () => void;
  onContinue: () => void;
}

const RESET_OPTIONS = [
  { id: 'rain', title: 'Rain', subtitle: 'Soothing rain\nto relax you', icon: '🌧️', img: '/assets/song/meditation.jpeg' },
  { id: 'ocean', title: 'Ocean', subtitle: 'Waves that\ncalm your mind', icon: '🌊', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80' },
  { id: 'forest', title: 'Forest', subtitle: 'Nature sounds\nto relax', icon: '🍃', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80' },
  { id: 'campfire', title: 'Campfire', subtitle: 'Warm crackling\nfor comfort', icon: '🔥', img: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=300&q=80' },
  { id: 'night', title: 'Night', subtitle: 'Peaceful night\nambience', icon: '🌙', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80' },
  { id: 'morning', title: 'Morning Light', subtitle: 'Gentle light to\nuplift your mood', icon: '☀️', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80' }
];

export const CalmDownStep: React.FC<CalmDownStepProps> = ({ onBack, onContinue }) => {
  const [selectedReset, setSelectedReset] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#030108] text-white font-sans flex flex-col justify-between overflow-hidden relative p-4 pb-0">
      
      {/* Deep Ambient Background Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] bg-purple-900/20 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] bg-pink-900/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* 1. Header Navigation & Progress Bar */}
      <div className="flex-none flex justify-between items-center px-1 pt-2 pb-1.5 z-20">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors border-none cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" />
        </button>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.5)]">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
          </div>
          <div className="w-6 h-[2px] bg-gradient-to-r from-[#7C3AED] to-[#7C3AED]"></div>
          <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.5)]">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
          </div>
          <div className="w-6 h-[2px] bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
          <div className="w-7 h-7 rounded-full bg-transparent border-2 border-[#A855F7] text-white flex items-center justify-center text-[12px] font-bold shadow-[0_0_15px_rgba(168,85,247,0.6)] relative">
            <div className="absolute inset-0 bg-[#A855F7]/30 rounded-full blur-[4px]"></div>
            <span className="relative z-10">3</span>
          </div>
          <div className="w-6 h-[2px] bg-white/10"></div>
          <div className="w-6 h-6 rounded-full bg-transparent border border-white/20 text-white/40 flex items-center justify-center text-[11px] font-semibold">4</div>
          <div className="w-6 h-[2px] bg-white/10"></div>
          <div className="w-6 h-6 rounded-full bg-transparent border border-white/20 text-white/40 flex items-center justify-center text-[11px] font-semibold">5</div>
        </div>

        <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors relative border-none">
          <Shield className="w-4.5 h-4.5 text-[#A855F7]" />
          <Star className="w-2 h-2 text-[#A855F7] absolute fill-current" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 mt-1 z-10 pb-[140px]">
        
        {/* Step Badge & Hero */}
        <div className="flex items-center gap-4 mt-2">
           {/* Magical Meditating Avatar */}
           <div className="relative w-[120px] h-[120px] shrink-0 flex items-center justify-center">
             <div className="absolute inset-0 bg-[#A855F7]/20 rounded-full blur-[25px]"></div>
             <div className="absolute inset-1 border-[1.5px] border-[#A855F7]/30 rounded-full"></div>
             {/* Floating elements */}
             <Heart className="absolute top-2 left-0 w-4 h-4 text-[#A855F7] fill-current -rotate-12 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
             <Heart className="absolute bottom-7 right-[-4px] w-3.5 h-3.5 text-[#A855F7] fill-current rotate-12 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
             
             <div className="relative w-[85px] h-[85px] rounded-full overflow-hidden z-10 border-2 border-[#A855F7]/80 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
               <img src="https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=200&q=80" alt="Meditate" className="w-full h-full object-cover" />
             </div>
             {/* Floor glow */}
             <div className="absolute bottom-1 w-[80px] h-[8px] bg-[#A855F7] blur-[8px] rounded-full"></div>
           </div>

           <div className="flex-1 flex flex-col items-start text-left">
             <div className="bg-[#1A0B2E] border border-[#3A1F66] px-3.5 py-1.5 rounded-full text-[8.5px] font-bold tracking-widest text-[#D8B4FE] mb-2 shadow-sm self-start">
               STEP 3 OF 5
             </div>
             
             <h1 className="text-[22px] font-extrabold text-white mb-2 flex items-center gap-1.5 leading-tight">
               Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9E] to-[#A855F7]">calm down</span>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#A855F7] shrink-0">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"/>
               </svg>
             </h1>
             <p className="text-[11.5px] text-[#9CA3AF] leading-[1.6] font-medium">
               Take a break. Reset your mind & body.<br/>You deserve this.
             </p>
           </div>
        </div>


        {/* Choose your reset Grid */}
        <div className="mt-6">
          <h2 className="text-[12px] font-bold text-white flex items-center gap-1.5 mb-1">
            <svg viewBox="0 0 24 24" fill="none" className="w-[14px] h-[14px] text-[#A855F7]">
               <path d="M12 22C12 22 18 20 20 16C22 12 21 8 21 8C21 8 18 12 15 14C12.5 15.6667 12 22 12 22Z" fill="currentColor"/>
               <path d="M12 22C12 22 6 20 4 16C2 12 3 8 3 8C3 8 6 12 9 14C11.5 15.6667 12 22 12 22Z" fill="currentColor"/>
            </svg>
            Choose your reset
          </h2>
          <p className="text-[9px] text-[#8B8B9B] mb-3 px-0.5 font-medium">Pick what feels right for you now</p>

          <div className="grid grid-cols-3 gap-2.5">
            {RESET_OPTIONS.map((option) => (
              <button 
                key={option.id}
                onClick={() => setSelectedReset(option.id)}
                className={`w-full rounded-[14px] overflow-hidden relative group text-left cursor-pointer border ${selectedReset === option.id ? 'border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-[#1E1133]'} transition-all bg-[#0A0512] flex flex-col`}
              >
                <div className="relative h-[85px] w-full">
                  <img src={option.img} alt={option.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0512] via-transparent to-transparent opacity-80"></div>
                  
                  {/* Play Button Overlay (half-overlapping the bottom edge) */}
                  <div className="absolute -bottom-[12px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-[#A855F7]/80 group-hover:border-[#A855F7] transition-all z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <Play className="w-2.5 h-2.5 text-white fill-current ml-0.5" />
                  </div>
                </div>

                <div className="pt-4 pb-2.5 px-2 flex-1 flex flex-col relative z-0">
                  <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-white">
                    <span className="text-[11px] leading-none drop-shadow-sm">{option.icon}</span> 
                    <span className="truncate">{option.title}</span>
                  </div>
                  <p className="text-[7.5px] text-[#8B8B9B] leading-[1.3] whitespace-pre-line">{option.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Breathing Card */}
        <div className="w-full bg-[#130924] border border-[#2d1b4e] rounded-[18px] p-3.5 flex items-center gap-3 mt-4 hover:border-[#A855F7]/50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-[#1A0B2E] border border-purple-500/30 flex items-center justify-center shrink-0">
             <span className="text-[20px]">🫁</span>
          </div>
          <div className="flex-1">
            <h4 className="text-[12.5px] text-white font-semibold">Custom Breathing</h4>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Breathe in peace. Breathe out stress.</p>
          </div>
          <button className="px-3 py-1.5 bg-[#1f1136] hover:bg-[#2b174a] border border-[#3e2469] rounded-full text-[10px] font-bold text-[#D8B4FE] flex items-center gap-1 transition-colors">
            Start Breathing <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-[#090312] via-[#090312]/95 to-transparent z-20">
         <button 
           onClick={() => {
             if (selectedReset) {
               localStorage.setItem('kavach_breathing_theme', selectedReset);
               onContinue();
             }
           }} 
           disabled={!selectedReset}
           className={`w-full bg-gradient-to-r from-[#F43F5E] via-[#A855F7] to-[#6D28D9] rounded-full py-[14px] flex items-center justify-center text-[15px] font-medium text-white relative overflow-hidden transition-all border-none shadow-[0_0_20px_rgba(168,85,247,0.3)] ${!selectedReset ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:from-[#E11D48] hover:via-[#9333EA] hover:to-[#5B21B6] active:scale-[0.98] cursor-pointer'}`}
         >
            <div className="absolute left-5 w-[28px] h-[28px] rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-[14px] h-[14px] text-white fill-current" />
            </div>
            Start My 2-Min Reset
            <div className="absolute right-3 w-[30px] h-[30px] rounded-full bg-black/15 flex items-center justify-center">
              <ArrowRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
         </button>
         
         {/* Footer */}
         <div className="flex items-center justify-center gap-[6px] mt-4 mb-2 opacity-90">
            <Shield className="w-[14px] h-[14px] text-[#A855F7]" />
            <div className="text-[10px] text-[#D1D5DB] leading-tight text-center flex items-center gap-1">
              This is your safe space. You're doing great. <span className="text-[#A855F7]">💜</span>
            </div>
         </div>
      </div>

    </div>
  );
};
