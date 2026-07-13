import React from 'react';
import { useKavachStore } from '../../../state/useKavachStore';

interface PremiumCheckInCardProps {
  isNight: boolean;
  displayFamilyMembers: any[];
  currentStreak?: number;
  toggleOverlay: (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => void;
  setIsFamilyCircleDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PremiumCheckInCard = React.memo(({
  isNight,
  displayFamilyMembers = [],
  currentStreak = 18,
  toggleOverlay,
  setIsFamilyCircleDetailOpen
}: PremiumCheckInCardProps) => {
  return (
    <div className={`w-full rounded-[20px] p-[1.5px] shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden z-20 mt-[-40px] ${
        isNight
          ? 'bg-gradient-to-br from-[#7A3EFF]/70 via-[#7A3EFF]/20 to-[#FF6B00]/70'
          : 'bg-gradient-to-br from-[#FF9500]/80 via-[#FFD000]/50 to-[#FF5B2E]/80'
      }`}>
      <div className={`w-full h-[118px] rounded-[19.5px] px-3 py-3 flex items-center justify-between ${isNight ? 'bg-[#191126]' : 'bg-gradient-to-br from-[#FFF8F0] via-[#FFFAF5] to-[#FFF3E8]'} relative overflow-hidden`}>
        {/* Vibrant Center Glow backdrop */}
        <div className={`absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] blur-[30px] rounded-full pointer-events-none ${
            isNight ? 'bg-gradient-to-r from-[#ff3b8f]/20 to-[#8a2be2]/20' : 'bg-gradient-to-r from-[#FF9500]/15 to-[#FF5B2E]/15'
          }`} />

        {/* Left Side: Check-in Details */}
        <div className="flex flex-col text-left max-w-[42%] z-10">
          <div className="flex items-center gap-1 mb-1">
            {/* Custom Solid Sun Icon */}
            <div className="shrink-0 flex items-center justify-center scale-90">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="5.5" fill="#FFC107" />
                <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.92893 4.92893L6.34315 6.34315M17.6569 17.6569L19.0711 19.0711M4.92893 19.0711L6.34315 17.6569M17.6569 6.34315L19.0711 4.92893" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[6.5px] font-black uppercase tracking-wider ${isNight ? 'text-white' : 'text-[#92400E]'}`}>MORNING CHECK-IN</span>
              <span className={`text-[6.5px] font-bold leading-none mt-0.5 ${isNight ? 'text-purple-300/80' : 'text-[#D97706]'}`}>6:00 AM - 11:00 AM</span>
            </div>
          </div>

          <h3 
            className={`text-[11px] font-medium leading-[1.3] tracking-tight mt-0.5 ${isNight ? 'text-white' : 'text-[#1C1C1E]'}`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Check-in to<br/>let your people<br/>know <span style={{ color: isNight ? '#ff56b8' : '#E8470F' }} className="font-semibold">you're safe</span>
          </h3>

          {/* Profile Avatars list */}
          {displayFamilyMembers && displayFamilyMembers.length > 0 ? (
            <div className="flex items-center -space-x-1.5 mt-2.5 relative z-10 pl-0.5">
              {displayFamilyMembers.slice(0, 4).map((member, idx) => (
                <div key={idx} className={`w-[20px] h-[20px] rounded-full border-[1px] border-[#0a0514] overflow-hidden bg-slate-800 relative z-${40 - idx*10}`}>
                  {member.img ? (
                    <img src={member.img} className="w-full h-full object-cover" alt="family" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-800">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20.2C9.5 20.2 7.29 18.92 6 16.9C6.03 14.91 10 13.9 12 13.9C13.99 13.9 17.97 14.91 18 16.9C16.71 18.92 14.5 20.2 12 20.2Z" /></svg>
                    </div>
                  )}
                </div>
              ))}
              {displayFamilyMembers.length > 4 && (
                <div className={`w-[20px] h-[20px] rounded-full border-[1px] border-[#0a0514] bg-[#231a38] flex items-center justify-center z-0 relative`}>
                  <span className="text-[8px] font-bold text-white">+{displayFamilyMembers.length - 4}</span>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => toggleOverlay(setIsFamilyCircleDetailOpen, true)}
              className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF2D87] to-[#FF6B00] text-white text-[8.5px] font-black tracking-wide flex items-center gap-1.5 active:scale-95 transition-transform shadow-[0_4px_12px_rgba(255,45,135,0.45)]"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Invite Now
            </button>
          )}
        </div>

        {/* Middle/Center attraction: Camera Button & Progress Rings */}
        <div className="flex flex-col items-center justify-center z-10 relative pt-0.5 pl-1">
          <div className="relative w-[76px] h-[76px] flex items-center justify-center">
            {/* Custom Dual Progress SVG */}
            <div className="absolute inset-0 w-[92px] h-[92px] -ml-[8px] -mt-[8px]">
              <svg viewBox="0 0 120 120" className="w-full h-full rotate-[0deg]">
                <defs>
                  <linearGradient id="gradRight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ff00a0" />   {/* Bright Pink top */}
                    <stop offset="100%" stopColor="#ff5e00" /> {/* Bright Orange bottom */}
                  </linearGradient>
                  <linearGradient id="gradLeft" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ff5e00" />   {/* Orange bottom left */}
                    <stop offset="45%" stopColor="#ff00a0" />  {/* Pink middle */}
                    <stop offset="100%" stopColor="#4a00e0" /> {/* Purple top left */}
                  </linearGradient>
                </defs>
                
                {/* Left Dotted Arc (Radius adjusted to 52.5) */}
                <path 
                  d="M 27 100 A 52.5 52.5 0 0 1 54 7.5" 
                  stroke="url(#gradLeft)" 
                  fill="none" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeDasharray="1 6"
                />
                
                {/* Right Dashed Arc (Radius adjusted to 52.5) */}
                <path 
                  d="M 66 7.5 A 52.5 52.5 0 0 1 93 100" 
                  stroke="url(#gradRight)" 
                  fill="none" 
                  strokeWidth="8" 
                  strokeDasharray="12 4" 
                  strokeLinecap="butt"
                />
              </svg>
            </div>

            <div 
              onClick={() => {
                const state = useKavachStore.getState();
                state.setIsCameraActive(true);
              }}
              className="w-[64px] h-[64px] rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-15 relative p-[4px] bg-gradient-to-tr from-[#A855F7]/25 via-[#FF2FA8]/25 to-[#FF6B00]/25 shadow-[0_3px_15px_rgba(255,45,168,0.4)]"
            >
              {/* Outer border container wrapper, with flat solid gradient inner circle matching second image */}
              <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-[#A855F7] via-[#FF2FA8] to-[#FF6B00]">
                {/* Custom Solid Filled Camera Icon (Scaled up to 38) */}
                <svg width="38" height="38" viewBox="0 0 24 24" className="relative z-10" style={{ filter: 'drop-shadow(0px 1px 1.5px rgba(0,0,0,0.35))' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.5 4.5L7 6.5H4C2.9 6.5 2 7.4 2 8.5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8.5C22 7.4 21.1 6.5 20 6.5H17L15.5 4.5H8.5ZM12 18.5C9.23858 18.5 7 16.2614 7 13.5C7 10.7386 9.23858 8.5 12 8.5C14.7614 8.5 17 10.7386 17 13.5C17 16.2614 14.7614 18.5 12 18.5ZM18.5 9.5C19.3284 9.5 20 8.82843 20 8C20 7.17157 19.3284 6.5 18.5 6.5C17.6716 6.5 17 7.17157 17 8C17 8.82843 17.6716 9.5 18.5 9.5Z" fill="white" />
                  <circle cx="12" cy="13.5" r="2.5" fill="white" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Cursive Subtitle & Arrow */}
          <div className="flex items-center justify-center mt-0 z-20 w-full">
            <div className="relative inline-flex items-center">
              <span 
                className="text-[11px] text-[#FF2FA8] pr-0.5"
                style={{ fontFamily: "'Kaushan Script', cursive" }}
              >
                Tap to Check-in
              </span>
              <svg className="absolute -right-4 -top-2.5 w-5 h-5 rotate-[12deg]" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0px 0.5px 1px rgba(0,0,0,0.35))' }}>
                 <defs>
                   <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#FF6B00" /> {/* Orange */}
                     <stop offset="50%" stopColor="#FF2FA8" /> {/* Pink */}
                     <stop offset="100%" stopColor="#A855F7" /> {/* Purple */}
                   </linearGradient>
                 </defs>
                 {/* Thinner stroke curve path */}
                 <path d="M 16 19 C 18 12, 14 5, 4 5" stroke="url(#arrowGrad)" strokeWidth="1.2" strokeLinecap="round" />
                 <path d="M 8 2.5 L 3 4.5 L 5.5 9.5" stroke="url(#arrowGrad)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: Day Streak Info */}
        <div 
          onClick={() => toggleOverlay(setIsFamilyCircleDetailOpen, true)}
          className="flex flex-col items-center justify-center h-full shrink-0 cursor-pointer z-10 w-[24%] pr-2"
        >
          <div className="flex flex-col items-center mb-1.5">
            <div className="flex items-center gap-0.5 mt-[-3px] pl-[10px] whitespace-nowrap">
              <span className={`text-[8.5px] font-black tracking-wider uppercase whitespace-nowrap ${isNight ? 'text-slate-300' : 'text-[#B45309]'}`}>DAY STREAK</span>
              <span className="text-[10px]">🔥</span>
            </div>
            {/* Large Cursive numbers (nudged slightly to the right to match center alignment) */}
            <span 
              className={`text-[36px] font-bold leading-[0.9] tracking-tighter mt-0.5 block select-none pl-1.5 ${isNight ? 'text-white' : 'text-[#92400E]'}`}
              style={{ fontFamily: "'Kaushan Script', cursive" }}
            >
              {currentStreak}
            </span>
            <span className={`text-[8px] font-bold leading-none mt-0.5 ${isNight ? 'text-white/70' : 'text-[#B45309]'}`}>Days</span>
          </div>

          {/* Solid Premium Gradient Button */}
          <button 
            className={`w-[105%] py-1 rounded-full text-white text-[6.5px] font-black tracking-wider uppercase flex items-center justify-center gap-0.5 shadow-md border-0 active:scale-95 transition-transform ${isNight ? 'bg-gradient-to-r from-[#9b51e0] to-[#7f00ff]' : 'bg-gradient-to-r from-[#FF9500] to-[#E8470F]'}`}
          >
            Keep it up! <span className="text-[8px]">🔥</span>
          </button>
        </div>
      </div>
    </div>
  );
});

PremiumCheckInCard.displayName = 'PremiumCheckInCard';
