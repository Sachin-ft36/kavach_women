import React, { useState } from 'react';
import { ArrowLeft, Check, Shield, Star, Plus, MessageCircle, Phone, Video, Send, PenLine, Lock, Heart, ChevronRight } from 'lucide-react';

interface TalkToTrustedNetworkProps {
  onBack: () => void;
  onSend: (contactId: string, method: string, message: string) => void;
}

const TRUSTED_CONTACTS = [
  { id: 'mom', name: 'Mom', desc: 'Always cares 💕', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
  { id: 'dad', name: 'Dad', desc: 'My strength 💪', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150' },
  { id: 'rahul', name: 'Rahul', desc: 'My bestie 🔥', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { id: 'priya', name: 'Priya', desc: 'College friend ✨', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
];

const MessageFilled = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.05.89 3.92 2.36 5.37L3 22l3.57-1.36C8.31 21.61 10.09 22 12 22c5.52 0 10-4.04 10-9S17.52 2 12 2zm-4 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>;
const PhoneFilled = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>;
const VideoFilled = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zm-7 3.5h-1.5v-2H6.5v-1.5H8.5v-2H10v2h2v1.5h-2v2z"/></svg>;

const CONTACT_METHODS = [
  { id: 'share', icon: MessageFilled, title: "Share how\nI'm feeling", desc: "Send a message\nwith your mood", color: 'bg-gradient-to-br from-[#F472B6] to-[#DB2777]', borderColor: 'border-pink-500', bgColor: 'bg-[#1a0814]' },
  { id: 'call', icon: PhoneFilled, title: "Call them", desc: "Talk to them\nright now", color: 'bg-gradient-to-br from-[#A855F7] to-[#7C3AED]', borderColor: 'border-purple-500', bgColor: 'bg-[#14081c]' },
  { id: 'video', icon: VideoFilled, title: "Video Call", desc: "See them. Talk\nface to face", color: 'bg-gradient-to-br from-[#6366F1] to-[#4338CA]', borderColor: 'border-indigo-500', bgColor: 'bg-[#0a081c]' }
];

export const TalkToTrustedNetwork: React.FC<TalkToTrustedNetworkProps> = ({ onBack, onSend }) => {
  const [selectedContact, setSelectedContact] = useState('mom');
  const [selectedMethod, setSelectedMethod] = useState('share');
  
  const contact = TRUSTED_CONTACTS.find(c => c.id === selectedContact) || TRUSTED_CONTACTS[0];
  const [message, setMessage] = useState(`Hey ${contact.name},\nI'm feeling a little low today.\nJust wanted to talk to you. 💜`);

  React.useEffect(() => {
    setMessage(`Hey ${contact.name},\nI'm feeling a little low today.\nJust wanted to talk to you. 💜`);
  }, [contact.name]);

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#030108] text-white font-sans flex flex-col overflow-hidden selection:bg-purple-500/30 relative p-4 pb-2">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Deep Ambient Background Glows */}
      <div className="absolute top-[5%] left-[0%] w-[300px] h-[300px] bg-pink-900/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[0%] w-[200px] h-[200px] bg-purple-900/10 blur-[80px] rounded-full pointer-events-none" />

      {/* 1. Header Navigation & Progress Bar */}
      <div className="flex-none flex justify-between items-center px-2 pt-1 pb-1 z-20">
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-white/90" />
        </button>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-1">
          {/* Step 1 Check */}
          <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.5)]">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          
          <div className="w-5 h-[1.5px] bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
          
          {/* Step 2 Check */}
          <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.5)]">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>

          <div className="w-5 h-[1.5px] bg-gradient-to-r from-[#7C3AED] to-[#E11D48]"></div>
          
          {/* Step 3 (Current) */}
          <div className="w-6 h-6 rounded-full bg-transparent border-2 border-[#E11D48] text-white flex items-center justify-center text-[10px] font-bold shadow-[0_0_12px_rgba(225,29,72,0.6)] relative">
            <div className="absolute inset-0 bg-[#E11D48]/30 rounded-full blur-[3px]"></div>
            <span className="relative z-10">3</span>
          </div>
          
          <div className="w-5 h-[1.5px] bg-white/10"></div>
          
          {/* Step 4 */}
          <div className="w-5 h-5 rounded-full bg-transparent border border-white/20 text-white/40 flex items-center justify-center text-[9px] font-semibold">
            4
          </div>
          
          <div className="w-5 h-[1.5px] bg-white/10 hidden sm:block"></div>
          
          {/* Step 5 */}
          <div className="w-5 h-5 rounded-full bg-transparent border border-white/20 text-white/40 items-center justify-center text-[9px] font-semibold hidden sm:flex">
            5
          </div>
        </div>

        <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors relative border-none">
          <Shield className="w-4 h-4 text-[#A855F7]" />
          <Star className="w-1.5 h-1.5 text-[#A855F7] absolute fill-current" />
        </button>
      </div>

      {/* Step Badge */}
      <div className="flex-none flex justify-center z-20 mb-3 mt-1">
        <div className="bg-[#180A29] border border-[#3E1335] px-4 py-1.5 rounded-full text-[9px] font-extrabold tracking-widest text-[#F472B6]">
          STEP 3 OF 5
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-0.5 mt-1.5 z-10 pb-20">
         {/* Hero Title */}
         <div className="flex items-center gap-4 mt-1 mb-2 px-1">
           {/* 3D Premium Icon Composition */}
           <div className="w-[80px] h-[80px] relative flex items-center justify-center flex-shrink-0 animate-float">
             {/* Bottom Glow */}
             <div className="absolute bottom-[-8px] w-[70px] h-[24px] bg-[#F472B6]/40 blur-lg rounded-full"></div>
             
             {/* Orbits */}
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="absolute w-[95px] h-[28px] rounded-[100%] border-[0.5px] border-pink-400/30 transform rotate-[-12deg]"></div>
               <div className="absolute w-[95px] h-[28px] rounded-[100%] border-[0.5px] border-pink-400/20 transform rotate-[12deg]"></div>
             </div>

             {/* Sparkles / Stars */}
             <svg viewBox="0 0 100 100" className="absolute inset-[-15px] w-[110px] h-[110px] pointer-events-none z-10 drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]">
                <path d="M25,35 L27,40 L32,42 L27,44 L25,49 L23,44 L18,42 L23,40 Z" fill="#F472B6" />
                <path d="M85,30 L86,33 L89,34 L86,35 L85,38 L84,35 L81,34 L84,33 Z" fill="#F9A8D4" />
                <path d="M75,65 L76,68 L79,69 L76,70 L75,73 L74,70 L71,69 L74,68 Z" fill="#F472B6" transform="scale(0.7) translate(30, 20)" />
                <circle cx="85" cy="55" r="1.5" fill="#F472B6" />
                <circle cx="20" cy="70" r="1" fill="#F9A8D4" />
                <circle cx="35" cy="25" r="1" fill="#F472B6" />
             </svg>

             {/* Heart Above */}
             <div className="absolute top-[-3px] z-10 drop-shadow-[0_4px_8px_rgba(236,72,153,0.6)]">
               <svg viewBox="0 0 24 24" className="w-[30px] h-[30px] text-[#F472B6] fill-current">
                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
               </svg>
             </div>

             {/* Two 3D Figures */}
             <div className="absolute bottom-1 flex justify-center w-full z-10">
               {/* Left Person */}
               <div className="relative mr-[-8px] z-10 flex flex-col items-center">
                 <div className="w-[22px] h-[22px] bg-gradient-to-br from-[#F472B6] to-[#DB2777] rounded-full shadow-[inset_-1.5px_-1.5px_4px_rgba(0,0,0,0.3)] mb-1 z-10"></div>
                 <div className="w-[36px] h-[28px] bg-gradient-to-tr from-[#DB2777] to-[#F472B6] rounded-t-[18px] shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.2)]"></div>
               </div>
               {/* Right Person */}
               <div className="relative ml-[-8px] z-0 flex flex-col items-center">
                 <div className="w-[22px] h-[22px] bg-gradient-to-br from-[#F472B6] to-[#BE185D] rounded-full shadow-[inset_-1.5px_-1.5px_4px_rgba(0,0,0,0.3)] mb-1 z-10"></div>
                 <div className="w-[36px] h-[28px] bg-gradient-to-tr from-[#BE185D] to-[#EC4899] rounded-t-[18px] shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.2)]"></div>
               </div>
             </div>
           </div>
           
           <div className="mt-1">
             <h1 className="text-[18px] sm:text-[20px] font-extrabold leading-tight tracking-tight text-white mb-0.5">
              I want someone<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#C084FC] inline-flex items-center gap-1.5 flex-wrap">
                to talk to
                {/* Hand drawn hearts */}
                <span className="inline-flex items-center gap-1 mt-0.5 ml-0.5 opacity-90">
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] text-pink-400 -rotate-[15deg] drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] text-pink-500 rotate-[15deg] mt-0.5 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"/>
                  </svg>
                </span>
              </span>
             </h1>
             <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] leading-[1.3] mt-1 font-medium">
               Connect with someone you trust.<br/>They'll know you need to talk.
             </p>
           </div>
         </div>

         {/* 1. Choose Someone */}
         <div className="mt-4">
           <h2 className="text-[13px] font-bold text-white flex items-center gap-1.5 mb-3">
             <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-current">
                <circle cx="8" cy="10" r="3.5" fill="#F472B6" />
                <path d="M2 19 C2 15.5 5.5 14.5 8 14.5 C10.5 14.5 14 15.5 14 19" fill="#F472B6" />
                <circle cx="16" cy="10" r="4.5" fill="#DB2777" />
                <path d="M10 19 C10 14.5 14 13.5 16 13.5 C18 13.5 22 14.5 22 19" fill="#DB2777" />
             </svg>
             1. Choose someone
           </h2>
           <div className="flex items-stretch justify-between w-full gap-[6px] pb-1 pt-1">
              {TRUSTED_CONTACTS.map(c => {
                const isSelected = selectedContact === c.id;
                return (
                  <button 
                    onClick={() => setSelectedContact(c.id)} 
                    key={c.id} 
                    className={`flex-1 rounded-xl bg-[#0c051a] flex flex-col items-center justify-center relative border transition-all cursor-pointer py-2 ${isSelected ? 'border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.3)] bg-[#1a0814]' : 'border-[#1a112c] hover:border-white/20'}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-pink-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <Check className="w-[10px] h-[10px] text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="w-[38px] h-[38px] rounded-full p-[1.5px] bg-gradient-to-br from-pink-500 to-purple-500 mb-1.5">
                      <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover border-[1.5px] border-[#1a0814]" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-white mb-0.5 truncate w-[90%] text-center">{c.name}</span>
                    <span className="text-[7.5px] sm:text-[8px] text-[#9CA3AF] text-center px-0.5 leading-[1.1] w-full break-words">{c.desc}</span>
                  </button>
                )
              })}
              <button className="flex-1 rounded-xl bg-[#0c051a] border border-[#1a112c] flex flex-col items-center justify-center hover:border-white/20 transition-all cursor-pointer py-2">
                <div className="w-[38px] h-[38px] rounded-full border-[1.5px] border-dashed border-pink-500/80 flex items-center justify-center mb-1.5 bg-transparent">
                  <Plus className="w-[18px] h-[18px] text-white" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-white/90 leading-[1.1] mt-0.5">Add<br/>Someone</span>
              </button>
           </div>
         </div>

         {/* 2. How do you want to reach them? */}
         <div className="mt-4">
           <h2 className="text-[12px] font-medium text-white flex items-center gap-1.5 mb-2.5">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] text-pink-500">
               <path d="M22 2L11 13" />
               <path d="M22 2L15 22L11 13L2 9L22 2z" />
             </svg>
             2. How do you want to reach them?
           </h2>
           <div className="grid grid-cols-3 gap-2">
             {CONTACT_METHODS.map(method => {
               const isSelected = selectedMethod === method.id;
               return (
                 <div key={method.id} className="relative">
                   {isSelected && (
                    <div className="absolute -top-1.5 -right-1 w-[16px] h-[16px] bg-pink-500 rounded-full flex items-center justify-center shadow-md z-10">
                      <Check className="w-[10px] h-[10px] text-white" strokeWidth={3.5} />
                    </div>
                   )}
                   <button 
                     onClick={() => setSelectedMethod(method.id)} 
                     className={`w-full h-full flex flex-col items-center text-center px-1 py-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? `${method.borderColor} shadow-[0_0_12px_rgba(236,72,153,0.2)] ${method.bgColor}` : 'border-[#1a112c] bg-[#0c051a] hover:border-white/20'}`}
                   >
                     <div className={`w-[36px] h-[36px] rounded-full ${method.color} flex items-center justify-center mb-2 shadow-sm`}>
                       <method.icon className="w-[16px] h-[16px] text-white" />
                     </div>
                     <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-[1.2] mb-1 whitespace-pre-line">{method.title}</span>
                     <span className="text-[7.5px] sm:text-[8px] text-[#9CA3AF] leading-[1.3] whitespace-pre-line px-0.5">{method.desc}</span>
                   </button>
                 </div>
               )
             })}
           </div>
         </div>

         {/* 3. Add a message */}
         <div className="mt-4">
           <h2 className="text-[13px] font-medium text-white flex items-center gap-2 mb-3">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-[#A855F7]">
               <path d="M12 20h9" />
               <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
             </svg>
             3. Add a message <span className="text-[#9CA3AF] font-normal">(optional)</span>
           </h2>
           
           <div className="bg-[#150a22] border border-[#211234] rounded-2xl p-4 relative group transition-colors">
             <textarea 
               value={message} 
               onChange={e => setMessage(e.target.value)} 
               className="w-full bg-transparent text-[#F3F4F6] text-[12px] sm:text-[13px] leading-[1.6] resize-none outline-none min-h-[65px] font-medium placeholder-[#6B7280] pr-12" 
               placeholder="Type a message..."
             />
             <div className="flex items-center justify-end">
               <div className="text-[11px] sm:text-[12px] text-[#6b7280] font-medium mr-12 -mt-1">{message.length}/120</div>
             </div>
             
             <div className="absolute bottom-4 right-4 w-[34px] h-[34px] rounded-full bg-[#201036] flex items-center justify-center cursor-pointer hover:bg-[#2b1747] transition-colors shadow-sm">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] text-[#A855F7]">
                 <path d="M19.07 4.93a3.003 3.003 0 00-4.24 0l-10.6 10.6c-.19.19-.32.43-.38.7l-1.5 5c-.1.35.01.73.28 1 .23.23.54.34.85.34.11 0 .22-.01.33-.05l5-1.5c.27-.06.51-.19.7-.38l10.6-10.6c1.17-1.17 1.17-3.07 0-4.24zm-1.42 2.82l-1.41-1.41 1.41-1.41c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-1.41 1.41z" />
               </svg>
             </div>
           </div>
           
           <div className="flex items-center gap-2 mt-3 px-1 text-[10.5px] sm:text-[11px] text-[#9CA3AF] opacity-90">
             <Lock className="w-[11px] h-[11px] text-[#E11D48] fill-[#E11D48]/30" />
             <span>They'll see that you <span className="text-[#F472B6] font-medium">need to talk</span>, not your full mood details.</span>
           </div>
         </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-6 bg-gradient-to-t from-[#090312] via-[#090312]/95 to-transparent z-20">
         <button 
           onClick={() => onSend(selectedContact, selectedMethod, message)} 
           className="w-full bg-gradient-to-r from-[#F43F5E] via-[#A855F7] to-[#6D28D9] hover:from-[#E11D48] hover:via-[#9333EA] hover:to-[#5B21B6] rounded-full py-[14px] flex items-center justify-center text-[15px] font-medium text-white relative overflow-hidden active:scale-[0.98] transition-all border-none cursor-pointer"
         >
            {/* Paper plane solid icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] absolute left-6 -rotate-[20deg] origin-center -translate-y-[1px]">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            Send to {contact.name}
            <div className="absolute right-3 w-[30px] h-[30px] rounded-full bg-black/15 flex items-center justify-center">
              <ChevronRight className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
         </button>
         
         {/* Footer */}
         <div className="flex items-center justify-center gap-[6px] mt-4 mb-2 opacity-90 relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-[#A855F7]">
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
               <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-[11.5px] font-normal text-[#D1D5DB] tracking-wide">Your conversations are private and secure.</span>
            
            {/* Decorative Heart with waves */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
              {/* Waves */}
              <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="absolute right-2 opacity-60">
                <path d="M0 10C10 10 10 5 20 5C30 5 30 15 40 15C50 15 50 10 60 10" stroke="#F472B6" strokeWidth="0.5" />
                <path d="M0 14C10 14 10 9 20 9C30 9 30 19 40 19C50 19 50 14 60 14" stroke="#DB2777" strokeWidth="0.5" />
              </svg>
              {/* Heart */}
              <div className="relative">
                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] drop-shadow-[0_0_8px_rgba(236,72,153,0.9)] relative z-10">
                  <defs>
                    <radialGradient id="heartGrad" cx="30%" cy="30%" r="70%">
                       <stop offset="0%" stopColor="#F9A8D4" />
                       <stop offset="50%" stopColor="#EC4899" />
                       <stop offset="100%" stopColor="#9D174D" />
                    </radialGradient>
                  </defs>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGrad)"/>
                </svg>
                {/* Sparkles */}
                <svg viewBox="0 0 10 10" className="w-[5px] h-[5px] absolute -top-1 -left-1.5 text-pink-300 fill-current drop-shadow-[0_0_2px_#fff] z-20">
                  <path d="M5 0 Q5 5 10 5 Q5 5 5 10 Q5 5 0 5 Q5 5 5 0" />
                </svg>
                <svg viewBox="0 0 10 10" className="w-[4px] h-[4px] absolute top-1 -right-2 text-white fill-current drop-shadow-[0_0_2px_#fff] z-20">
                  <path d="M5 0 Q5 5 10 5 Q5 5 5 10 Q5 5 0 5 Q5 5 5 0" />
                </svg>
              </div>
            </div>
         </div>
      </div>

    </div>
  );
};
