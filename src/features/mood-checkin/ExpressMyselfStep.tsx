import React, { useState } from 'react';
import { 
  ArrowLeft, Check, Shield, Heart, ArrowRight, Lock, ChevronRight, 
  Smile, PenTool, Mic, Camera, VenetianMask, Sun, CloudRain, Star, BookOpen, Palette 
} from 'lucide-react';

interface ExpressMyselfStepProps {
  onBack: () => void;
  onSave: () => void;
  onDrawDoodle: () => void;
}

export const ExpressMyselfStep: React.FC<ExpressMyselfStepProps> = ({ onBack, onSave, onDrawDoodle }) => {
  const [text, setText] = useState('');

  const CHIPS = [
    { label: 'My Day', icon: <Sun className="w-3 h-3" /> },
    { label: "Something's bothering me", icon: <CloudRain className="w-3 h-3" /> },
    { label: "I'm grateful for", icon: <Heart className="w-3 h-3" /> },
    { label: "I need to let this out", icon: <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4"/></svg> },
    { label: 'Anything...', icon: <span className="font-serif font-bold text-[14px] -mt-2">...</span> }
  ];

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#030108] text-white font-sans flex flex-col justify-between overflow-hidden relative p-4 pb-0">
      
      {/* Background Glows */}
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
        
        <div className="bg-[#1A0B2E] border border-[#3A1F66] px-3.5 py-1.5 rounded-full text-[8.5px] font-bold tracking-widest text-[#D8B4FE] mb-1 mt-2 shadow-sm self-center w-max mx-auto">
          STEP 3 OF 5
        </div>

        {/* Hero */}
        <div className="flex justify-between items-start mt-2 relative">
           <div className="flex-1 flex flex-col items-start text-left z-10">
             
             <h1 className="text-[22px] font-extrabold text-white mb-1 leading-tight tracking-tight">
               Just want to <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9E] to-[#A855F7]">express myself</span>
               <Heart className="inline-block w-4 h-4 text-[#FF6B9E] ml-1.5 -mt-1" strokeWidth={2.5} />
             </h1>
             <p className="text-[11px] text-[#9CA3AF] leading-[1.5] font-medium mt-1 max-w-[170px]">
               There's no right or wrong here. Write, draw or share how you feel.
             </p>
           </div>
           
           {/* Book Illustration */}
           <div className="absolute right-[-20px] top-[-30px] w-[180px] h-[160px] pointer-events-none z-0">
             <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover rounded-full drop-shadow-[0_0_30px_rgba(168,85,247,0.3)] opacity-80 mix-blend-screen" alt="Journal" style={{filter: 'hue-rotate(40deg) saturate(1.5) contrast(1.2)'}} />
             <div className="absolute inset-0 bg-gradient-to-r from-[#030108] via-[#030108]/50 to-transparent"></div>
           </div>
        </div>

        {/* Text Entry Card */}
        <div className="w-full bg-[#0D0616]/90 border border-[#231241] rounded-[16px] p-3 flex flex-col relative overflow-hidden backdrop-blur-md">
           <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#FF6B9E] fill-current" />
                <span className="text-[11.5px] font-bold text-white tracking-wide">How are you feeling right now?</span>
             </div>
             <button className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#3A1F66] text-[#D8B4FE] text-[9px] font-semibold hover:bg-[#3A1F66]/50 transition-colors">
               <Smile className="w-3 h-3" /> Choose Mood <ChevronRight className="w-2.5 h-2.5" />
             </button>
           </div>

           <div className="relative w-full rounded-[12px] bg-[#0A0512] border border-[#1E1133] focus-within:border-[#A855F7]/50 transition-colors p-3 pb-7">
             <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Write whatever is on your mind..."
               className="w-full bg-transparent text-white text-[12px] placeholder-[#4B5563] outline-none resize-none min-h-[90px]"
               maxLength={1000}
             />
             <div className="absolute bottom-2 right-3 text-[9px] text-[#4B5563] font-medium">
               {text.length}/1000
             </div>
           </div>

           <div className="mt-3">
             <p className="text-[9px] text-[#6B7280] mb-2 font-medium">You can write about:</p>
             <div className="flex flex-wrap gap-2">
               {CHIPS.map((chip, idx) => (
                 <button key={idx} onClick={() => setText(prev => prev ? prev + ' ' + chip.label : chip.label)} className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#130924] border border-[#2E1854] hover:bg-[#231241] text-[9.5px] font-medium text-[#D1D5DB] transition-colors">
                   <span className="text-[#A855F7] opacity-80">{chip.icon}</span>
                   {chip.label}
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* Or express in another way */}
        <div className="w-full bg-transparent pt-1">
          <div className="flex justify-between items-center mb-2.5">
             <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#A855F7]" />
                <span className="text-[11px] font-bold text-white tracking-wide">Or express in another way</span>
             </div>
             <button className="flex items-center gap-0.5 text-[#A855F7] text-[9.5px] font-semibold">
               View All <ChevronRight className="w-3 h-3" />
             </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
             <button onClick={onDrawDoodle} className="bg-[#0D0616]/90 border border-[#2E1854] rounded-[14px] aspect-square flex flex-col items-center justify-center gap-1.5 relative group hover:border-[#FF6B9E]/50 transition-colors">
                <div className="absolute -top-1.5 right-1 bg-[#FF6B9E] text-white text-[7px] font-bold px-1.5 py-[2px] rounded-full z-10 tracking-widest shadow-lg">New</div>
                <PenTool className="w-5 h-5 text-[#FF6B9E]" />
                <span className="text-[8.5px] text-[#D1D5DB] text-center font-medium leading-tight">Draw /<br/>Doodle</span>
             </button>
             
             <button className="bg-[#0D0616]/90 border border-[#2E1854] rounded-[14px] aspect-square flex flex-col items-center justify-center gap-1.5 group hover:border-[#A855F7]/50 transition-colors">
                <Mic className="w-5 h-5 text-[#A855F7]" />
                <span className="text-[8.5px] text-[#D1D5DB] text-center font-medium leading-tight">Voice<br/>Note</span>
             </button>

             <button className="bg-[#0D0616]/90 border border-[#2E1854] rounded-[14px] aspect-square flex flex-col items-center justify-center gap-1.5 group hover:border-[#3B82F6]/50 transition-colors">
                <Camera className="w-5 h-5 text-[#3B82F6]" />
                <span className="text-[8.5px] text-[#D1D5DB] text-center font-medium leading-tight">Photo &<br/>Caption</span>
             </button>

             <button className="bg-[#0D0616]/90 border border-[#2E1854] rounded-[14px] aspect-square flex flex-col items-center justify-center gap-1.5 relative group hover:border-[#8B5CF6]/50 transition-colors">
                <div className="absolute top-1.5 right-1.5">
                  <Lock className="w-2 h-2 text-[#6B7280]" />
                </div>
                <VenetianMask className="w-5 h-5 text-[#8B5CF6]" />
                <span className="text-[8.5px] text-[#D1D5DB] text-center font-medium leading-tight">Secret<br/>Note</span>
             </button>
          </div>
        </div>

        {/* This is your safe space */}
        <div className="w-full bg-[#0D0616]/90 border border-[#231241] rounded-[16px] p-3 flex items-center justify-between mt-2">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative flex-shrink-0">
                <div className="absolute inset-0 bg-[#A855F7] rounded-full blur-[12px] opacity-30"></div>
                {/* Heart character placeholder */}
                <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 text-[#A855F7]" fill="currentColor">
                   <path d="M50 85L47.25 82.5C27 64 13.5 51.5 13.5 36C13.5 24 23 14.5 35 14.5C41.7 14.5 48.1 17.7 50 22.8C51.9 17.7 58.3 14.5 65 14.5C77 14.5 86.5 24 86.5 36C86.5 51.5 73 64 52.75 82.5L50 85Z" />
                   {/* Eyes */}
                   <circle cx="35" cy="40" r="4" fill="white" />
                   <circle cx="65" cy="40" r="4" fill="white" />
                   {/* Smile */}
                   <path d="M40 50 Q 50 60 60 50" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                   {/* Hugging Arms */}
                   <path d="M25 60 Q 35 75 50 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
                   <path d="M75 60 Q 65 75 50 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h4 className="text-[11.5px] font-bold text-white flex items-center gap-1 mb-0.5">
                  This is your safe space <Lock className="w-3 h-3 text-[#A855F7]" />
                </h4>
                <p className="text-[9px] text-[#9CA3AF] leading-[1.4]">Everything you share is private<br/>and stays with you.</p>
              </div>
           </div>
           
           <div className="flex flex-col items-center flex-shrink-0">
             <div className="w-8 h-8 rounded-full border border-[#3A1F66] bg-[#1A0B2E] flex items-center justify-center mb-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
               <Shield className="w-4 h-4 text-[#A855F7]" />
               <Star className="w-1.5 h-1.5 text-[#A855F7] absolute fill-current" />
             </div>
             <span className="text-[8px] font-semibold text-[#8B8B9B]">100% Private</span>
           </div>
        </div>

        {/* Your recent entries */}
        <div className="w-full bg-[#0D0616]/90 border border-[#231241] rounded-[16px] p-3 flex flex-col mt-2">
           <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-[#8B8B9B]">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-[11px] font-bold text-[#E5E7EB] tracking-wide">Your recent entries</span>
             </div>
             <button className="flex items-center gap-0.5 text-[#D8B4FE] text-[9.5px] font-semibold">
               View All <ChevronRight className="w-3 h-3" />
             </button>
           </div>
           
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-[#1A0B2E] flex items-center justify-center border border-[#3A1F66]">
               <BookOpen className="w-4 h-4 text-[#A855F7]" />
             </div>
             <div className="flex-1">
               <p className="text-[9.5px] text-[#D1D5DB] leading-[1.35] font-medium">
                 It was a tough day, but I'm proud of<br/>how I handled it. Small wins matter. <Heart className="inline w-2.5 h-2.5 fill-[#A855F7] text-[#A855F7]" />
               </p>
             </div>
             <div className="flex items-center gap-0.5 text-[8.5px] font-medium text-[#6B7280]">
               Yesterday, 9:30 PM <ChevronRight className="w-3 h-3" />
             </div>
           </div>
        </div>

      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-[#090312] via-[#090312]/95 to-transparent z-20 pointer-events-none">
         <div className="pointer-events-auto">
           <button 
             onClick={onSave} 
             className="w-full bg-gradient-to-r from-[#FF6B9E] via-[#A855F7] to-[#7C3AED] rounded-full py-[14px] flex items-center justify-center text-[15px] font-bold text-white relative overflow-hidden active:scale-[0.98] transition-all border-none cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
           >
              <div className="absolute left-4 w-[30px] h-[30px] rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px] text-white">
                  <path d="M20.24 12.24A4.12 4.12 0 0 0 16 9H13V6A4.12 4.12 0 0 0 9.76 1.76l-6.4 6.4A2 2 0 0 0 3 10.34v6.8A4.12 4.12 0 0 0 6 21h6.66a2 2 0 0 0 1.41-.59l6.17-6.17ZM12 17H6a2 2 0 0 1-2-2v-4.66L9.76 4.59A2 2 0 0 1 11 6v4a2 2 0 0 0 2 2h3a2 2 0 0 1 1.41 3.41L12 17Z"/>
                </svg>
              </div>
              Save My Entry
              <div className="absolute right-3 w-[30px] h-[30px] rounded-full bg-black/15 flex items-center justify-center">
                <ArrowRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
           </button>
           
           {/* Footer */}
           <div className="flex items-center justify-center gap-[6px] mt-3.5 mb-1 opacity-80">
              <Shield className="w-[12px] h-[12px] text-[#A855F7]" />
              <div className="text-[10px] text-[#D1D5DB] font-medium leading-tight text-center">
                You're not alone. We're here for you. <Heart className="inline w-2.5 h-2.5 fill-[#A855F7] text-[#A855F7]" />
              </div>
           </div>
         </div>
      </div>

    </div>
  );
};
