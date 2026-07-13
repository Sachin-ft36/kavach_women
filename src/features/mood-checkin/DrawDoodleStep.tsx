import React, { useState } from 'react';
import { 
  ArrowLeft, Check, Shield, Heart, ArrowRight, Lock, 
  Sparkles, Undo, Redo, Trash2, PenTool, Highlighter, Brush, Eraser, Square, Star
} from 'lucide-react';

interface DrawDoodleStepProps {
  onBack: () => void;
  onSave: () => void;
}

export const DrawDoodleStep: React.FC<DrawDoodleStepProps> = ({ onBack, onSave }) => {
  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#FF4FD8');
  
  const COLORS = [
    '#FF4FD8', // Pink
    '#FF9A00', // Orange
    '#FFD700', // Yellow
    '#4ADE80', // Green
    '#2DD4BF', // Cyan
    '#3B82F6', // Blue
    '#A855F7', // Purple
    '#FFFFFF', // White
  ];

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#030108] text-white font-sans flex flex-col justify-between overflow-hidden relative p-4 pb-0">
      
      {/* Background Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] bg-purple-900/20 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[-10%] w-[300px] h-[300px] bg-[#FF4FC9]/10 blur-[120px] rounded-full pointer-events-none z-0" />

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
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 px-1 mt-1 z-10 pb-[10px]">
        
        <div className="bg-[#1A0B2E] border border-[#3A1F66] px-3.5 py-1.5 rounded-full text-[8.5px] font-bold tracking-widest text-[#D8B4FE] mb-1 mt-2 shadow-sm self-center w-max mx-auto">
          STEP 3 OF 5
        </div>

        {/* Hero Section */}
        <div className="flex justify-between items-start mt-1 relative z-20">
           <div className="flex-1 flex flex-col items-start text-left z-10 pt-2">
             <h1 className="text-[26px] font-extrabold text-white mb-1 leading-tight tracking-tight flex items-center gap-2">
               Draw / <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9E] to-[#FFA07A]">Doodle</span>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-[#FF6B9E]">
                  <path d="M19.5 5.5a5.5 5.5 0 00-7.78 0L12 5.22l-.22.22a5.5 5.5 0 00-7.78 7.78L12 21l8-8a5.5 5.5 0 000-7.78z" />
               </svg>
             </h1>
             <p className="text-[11px] text-[#9CA3AF] leading-[1.5] font-medium mt-1 max-w-[160px]">
               Draw whatever is in your mind.<br/>There's no right or wrong.
             </p>
           </div>
           
           {/* Tablet Illustration */}
           <div className="absolute right-[-25px] top-[-30px] w-[180px] h-[160px] pointer-events-none z-0">
             <img src="https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.4)] opacity-90 mix-blend-screen" alt="Tablet Drawing" style={{filter: 'hue-rotate(240deg) saturate(1.5) contrast(1.2)'}} />
             <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#030108] opacity-80"></div>
           </div>
        </div>

        {/* Ideas to try */}
        <div className="w-full mt-2 z-20">
           <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B9E]" />
              <span className="text-[10px] font-bold text-[#FF6B9E] tracking-wide">Ideas to try</span>
           </div>
           <div className="flex flex-wrap gap-2">
             {['How I feel today', 'My safe place', 'Release stress', 'Gratitude'].map((idea, idx) => (
               <button key={idx} className="px-3 py-1.5 rounded-full bg-[#100820]/80 border border-[#231241] hover:bg-[#1A0E3A] hover:border-[#3A1F66] text-[10px] font-medium text-[#D1D5DB] transition-all backdrop-blur-sm">
                 {idea}
               </button>
             ))}
           </div>
        </div>

        {/* Canvas Area */}
        <div className="w-full aspect-[4/3.5] bg-[#05030A] border border-[#1A0E3A] rounded-[16px] mt-2 relative overflow-hidden group">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A855F7 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
          
          {/* Mock Drawing Image */}
          <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80" alt="Neon Drawing" className="w-full h-full object-cover opacity-90 mix-blend-screen mix-blend-lighten pointer-events-none" style={{filter: 'hue-rotate(40deg) saturate(1.5)'}} />
          
          {/* Action Buttons inside Canvas */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <button className="w-8 h-8 rounded-lg bg-[#0C071A]/80 border border-[#231241] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#1A0E3A] backdrop-blur-md transition-all">
              <Undo className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#0C071A]/80 border border-[#231241] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#1A0E3A] backdrop-blur-md transition-all">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 right-3">
            <button className="px-3 py-1.5 rounded-lg bg-[#0C071A]/80 border border-[#231241] flex items-center gap-1.5 text-[#D1D5DB] hover:text-white hover:bg-[#1A0E3A] backdrop-blur-md transition-all">
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Clear</span>
            </button>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="w-full mt-1 bg-transparent">
          {/* Tool Selector */}
          <div className="flex justify-between items-center mb-4">
             {[
               { id: 'pen', icon: <PenTool className="w-5 h-5" />, label: 'Pen' },
               { id: 'highlighter', icon: <Highlighter className="w-5 h-5" />, label: 'Highlighter' },
               { id: 'brush', icon: <Brush className="w-5 h-5" />, label: 'Brush' },
               { id: 'eraser', icon: <Eraser className="w-5 h-5" />, label: 'Eraser' },
               { id: 'shape', icon: <Square className="w-5 h-5" />, label: 'Shape' },
             ].map((tool) => (
               <button 
                 key={tool.id}
                 onClick={() => setActiveTool(tool.id)}
                 className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all ${
                   activeTool === tool.id 
                     ? 'bg-[#1A0B2E] border border-[#A855F7] text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                     : 'bg-[#0D0616] border border-transparent text-[#9CA3AF] hover:bg-[#150A2B] hover:text-[#D1D5DB]'
                 }`}
                 style={{ width: '18%' }}
               >
                 <div className={activeTool === tool.id ? 'text-[#A855F7]' : ''}>
                   {tool.icon}
                 </div>
                 <span className="text-[8.5px] font-medium leading-none">{tool.label}</span>
               </button>
             ))}
          </div>

          {/* Color Selector */}
          <div className="flex justify-between items-center mb-5">
            {COLORS.map((color, idx) => (
              <button
                key={idx}
                onClick={() => setActiveColor(color)}
                className={`w-6 h-6 rounded-full transition-all relative flex items-center justify-center ${
                  activeColor === color ? 'scale-125 z-10' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              >
                {activeColor === color && (
                  <div className="absolute inset-[-4px] border border-white/50 rounded-full"></div>
                )}
              </button>
            ))}
            {/* Color Wheel icon for custom colors */}
            <button className="w-6 h-6 rounded-full border border-[#3A1F66] flex items-center justify-center hover:scale-110 transition-transform overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/50 to-transparent"></div>
            </button>
          </div>

          {/* Size Slider */}
          <div className="flex items-center gap-3 w-full bg-[#100820]/50 border border-[#1E1133] px-4 py-2.5 rounded-xl">
             <span className="text-[10px] font-medium text-[#D1D5DB] w-[30px]">Size</span>
             <div className="flex-1 relative flex items-center h-4">
                <div className="absolute left-0 right-0 h-[3px] bg-[#2E1854] rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[50%] bg-[#FF4FD8] rounded-full"></div>
                </div>
                {/* Slider Thumb */}
                <div className="absolute left-[50%] w-3.5 h-3.5 bg-[#FF4FD8] border-[2px] border-white rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(255,79,216,0.5)]"></div>
             </div>
             <span className="text-[9px] font-bold text-[#FF4FD8] w-[40px] text-right">Medium</span>
          </div>
        </div>

      </div>

      {/* Fixed Bottom Action */}
      <div className="w-full pb-6 pt-2 z-20 bg-[#030108]">
         <button 
           onClick={onSave} 
           className="w-full bg-gradient-to-r from-[#FF6B9E] via-[#A855F7] to-[#5B21B6] rounded-full py-[12px] flex items-center justify-center text-[15px] font-bold text-white relative overflow-hidden active:scale-[0.98] transition-all border-none cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
         >
            <div className="absolute left-4 w-[34px] h-[34px] rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
               <Heart className="w-[16px] h-[16px] text-white fill-current" />
            </div>
            <div className="flex flex-col items-center">
              <span className="leading-tight">Done</span>
              <span className="text-[9px] font-medium text-white/80">Save My Doodle</span>
            </div>
            <div className="absolute right-4 w-[34px] h-[34px] rounded-full bg-black/15 flex items-center justify-center">
              <ArrowRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
         </button>
         
         {/* Footer */}
         <div className="flex items-center justify-center gap-1.5 mt-3 opacity-90">
            <Lock className="w-[11px] h-[11px] text-[#A855F7]" />
            <div className="text-[9.5px] text-[#D1D5DB] font-medium leading-tight text-center">
              Your doodle is private and stays with you. <Heart className="inline w-2.5 h-2.5 fill-[#A855F7] text-[#A855F7]" />
            </div>
         </div>
      </div>

    </div>
  );
};
