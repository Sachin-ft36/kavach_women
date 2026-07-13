import React from 'react';
import { Bell, User, Info, ChevronRight, Camera, Flame, Check, CloudSun } from 'lucide-react';
import { useTimeTheme } from '../../../hooks/useTimeTheme';
import { useKavachStore } from '../../../state/useKavachStore';

import { PremiumCheckInCard } from './PremiumCheckInCard';

interface DashboardHeroProps {
  isNight: boolean;
  protectionIndex: number;
  displayFamilyMembers: any[];
  isRideActive: boolean;
  updates: any[];
  SHIELD_BASE64_IMAGE: string;
  toggleOverlay: (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => void;
  setIsFamilyCircleDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DashboardHero = React.memo(({
  isNight,
  protectionIndex,
  displayFamilyMembers,
  isRideActive,
  updates,
  toggleOverlay,
  setIsFamilyCircleDetailOpen
}: DashboardHeroProps) => {
  const { profile, user } = useKavachStore();
  
  // Dynamic user name from DB or fallback
  const userName = profile?.name || profile?.displayName || user?.displayName || 'Sachin';
  const displayFirstName = userName.split(' ')[0];

  const { themeFolder, greeting } = useTimeTheme();

  // Streak data for Check-in Card (normally calculated dynamically, fallback to 18)
  const currentStreak = 18;

  // Set header font style via google fonts
  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kaushan+Script&family=Pacifico&family=Outfit:wght@400;600;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="w-full flex flex-col gap-[6px] font-sans">
      
      {/* ─── 2. HERO LAYOUT (Image + Integrated Top Header & Floating Greeting/Score) ─── */}
      <div 
        className={`w-full rounded-none relative overflow-hidden transition-all duration-500 border-0 bg-transparent`}
        style={{ height: '215px' }}
      >
        {/* Hero Background Image (Fixed 300px, center center) */}
        <img
          src={isNight ? "/assets/dashboard_assets/night/nighthero.jpeg?v=2" : `/assets/dashboard_assets/${themeFolder}/${themeFolder}hero.${themeFolder === 'afternoon' ? 'jpeg' : 'png'}`}
          alt="Hero Background"
          className="absolute inset-0 w-full h-full object-cover object-[center_55%] pointer-events-none z-0 contrast-[1.25] saturate-[1.2] brightness-[0.95]"
        />

        {/* Left-to-right dark overlay for text legibility (more opacity on the left where text is located) */}
        <div className="absolute inset-0 z-[4] pointer-events-none bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

        {/* Bottom Dark Gradient Fade for Text Legibility */}
        <div className="absolute inset-0 z-[5] pointer-events-none bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Contents Overlays Container */}
        <div className="absolute inset-0 px-[2%] pt-3 pb-2 flex flex-col justify-between z-10 w-full h-full">
          <div className="flex items-center justify-between w-full relative z-35 pb-0.5">
            {/* LEFT: Branding/Logo */}
            <div className="flex items-center gap-1">
              {/* Premium Shield Vector */}
              <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                <svg className="w-full h-full drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" viewBox="0 0 100 100" fill="none">
                  {/* Shield frame */}
                  <path d="M50 10C68 18 78 20 85 24V52C85 71.5 50 88 50 88C50 88 15 71.5 15 52V24C22 20 32 18 50 10Z" fill="url(#shieldBgGrad)" stroke="#c084fc" strokeWidth="3" />
                  {/* Glowing star in center */}
                  <polygon points="50,32 54.5,45 68,45 57,53 61,66 50,58 39,66 43,53 32,45 45.5,45" fill="#ffffff" className="animate-pulse" />
                  <defs>
                    <linearGradient id="shieldBgGrad" x1="50" y1="10" x2="50" y2="88" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#2e1a47" />
                      <stop offset="1" stopColor="#0f091a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              {/* KAVACH Title */}
              <span className="text-[10px] font-black tracking-wider text-white leading-none">KAVACH</span>
              
              {/* Vertical Divider line */}
              <div className="h-3 w-[1px] bg-white/15" />
              
              {/* Two-line Slogan */}
              <div className="flex flex-col text-left">
                <span className="text-[5.5px] font-semibold text-purple-300 leading-tight">Your Safety.</span>
                <span className="text-[5.5px] font-semibold text-white/80 leading-tight">Our Mission.</span>
              </div>
            </div>

            {/* RIGHT: Notifications & 24px Profile Avatar */}
            <div className="flex items-center gap-2">
              <button className="relative w-6 h-6 rounded-full flex items-center justify-center bg-black/35 border border-white/10 text-white shadow-lg backdrop-blur-sm">
                <Bell size={9} strokeWidth={2.5} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border border-white text-white text-[6px] font-black rounded-full flex items-center justify-center shadow-sm">
                  3
                </span>
              </button>
              
              {/* User Profile Avatar (24px Cutout) */}
              <div 
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('OPEN_PROFILE_MODAL'));
                }}
                className="relative w-[24px] h-[24px] rounded-full p-[1px] bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1e38]">
                  {profile?.displayPhotoUrl || profile?.photoUrl ? (
                    <img src={profile.displayPhotoUrl || profile.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <User size={10} className="text-slate-300" />
                  )}
                </div>
                {/* Green Online Indicator */}
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff66] rounded-full border border-[#09081a]" />
              </div>
            </div>
          </div>
          
          {/* Bottom Row: Greeting Left side, Floating Protection Score Card aligned right side */}
          <div className="flex justify-between items-end w-full mt-auto mb-10">
            {/* Greeting Column */}
            <div className="flex flex-col text-left">
              <p 
                className="text-[28px] font-medium tracking-tight leading-none -rotate-2 origin-left"
                style={{ 
                  fontFamily: "'Kaushan Script', cursive",
                  color: '#ffffff',
                  textShadow: isNight ? 'none' : '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                {greeting},
              </p>
              <h2 
                className={`text-[32px] font-bold mt-0.5 mb-1 select-none tracking-tight flex items-center gap-1 bg-clip-text text-transparent -rotate-3 origin-left ${
                  isNight
                    ? 'bg-gradient-to-r from-[#ff5cb3] via-[#ff7eb3] to-[#e056fd]'
                    : 'bg-gradient-to-r from-[#FF2D87] via-[#FF2D55] to-[#FF0099]'
                }`}
                style={{ fontFamily: "'Kaushan Script', cursive" }}
              >
                {displayFirstName}!
                <span className="text-[18px] origin-bottom-right inline-block animate-wave ml-1">👋</span>
              </h2>
              <p className="text-[11px] font-semibold text-white/95 mt-0.5 leading-snug pl-1.5">
                Let's make today<br />
                <span style={{ color: isNight ? '#00c853' : '#00E676' }} className="font-semibold italic">safe</span> &amp; <span style={{ color: isNight ? '#ffd600' : '#00CFFF' }} className="font-semibold italic">amazing!</span>
              </p>
            </div>

            {/* FLOATING PROTECTION SCORE CARD (Reference Style: Glassmorphism with circular progress + shield) */}
            <div className={`w-[150px] h-[100px] backdrop-blur-xl border rounded-[18px] p-2.5 flex flex-col justify-between shrink-0 transition-colors duration-500 ${
              isNight 
                ? 'bg-[#181228]/95 border-[#5C33D6]/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
            }`}>
              {/* Top Row: Title + Info Icon */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-[8px] font-black tracking-widest uppercase ${isNight ? 'text-white' : 'text-slate-800'}`}>PROTECTION SCORE</span>
                <Info size={8} className={isNight ? 'text-white/40' : 'text-slate-400'} />
              </div>

              {/* Middle Row: Score values on left, Circular progress on right */}
              <div className="flex items-center justify-between w-full mt-1">
                <div className="flex flex-col text-left">
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-[20px] font-black tracking-tighter leading-none ${isNight ? 'text-[#00F57A]' : 'text-[#00C853]'}`}>{protectionIndex}%</span>
                    <span className={`text-[7.5px] font-black leading-none ${isNight ? 'text-[#00F57A]' : 'text-[#00C853]'}`}>▲ 12%</span>
                  </div>

                  {/* Segmented Progress Bars (Pills) */}
                  <div className="flex gap-[1px] w-[58px] mt-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-[3px] flex-1 rounded-[0.5px] ${
                          i < Math.round((protectionIndex / 100) * 10) 
                            ? isNight ? 'bg-[#00F57A]' : 'bg-[#00C853]'
                            : isNight ? 'bg-[#3C3355]' : 'bg-slate-100'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Right Side: Animated Circular Progress with Shield/Star */}
                <div className="relative w-[46px] h-[46px] flex items-center justify-center shrink-0">
                  {/* Outer circle track (Dashed technological style) */}
                  <svg className="w-full h-full rotate-[-90deg] overflow-visible" viewBox="0 0 36 36">
                    {/* Track Background */}
                    <circle cx="18" cy="18" r="16" stroke={isNight ? 'rgba(168,85,247,0.12)' : 'rgba(0,0,0,0.04)'} strokeWidth="3" fill="none" />
                    
                    {/* Semi-transparent Tech Dashed Guideline */}
                    <circle cx="18" cy="18" r="16" stroke={isNight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} strokeWidth="5" strokeDasharray="3, 3" fill="none" />
                    
                    {/* Glowing Active Progress Ring */}
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="16" 
                      stroke="url(#progressGradHero)" 
                      strokeWidth="3.5" 
                      fill="none" 
                      strokeDasharray={`${protectionIndex}, 100`} 
                      strokeLinecap="round" 
                      style={{
                        filter: `drop-shadow(0 0 6px ${isNight ? '#21D4FD' : '#00CFFF'}cc)`
                      }}
                    />
                    <defs>
                      <linearGradient id="progressGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#21D4FD" />
                        <stop offset="50%" stopColor="#00E676" />
                        <stop offset="100%" stopColor="#7C4DFF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Shield with Star in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all ${
                      isNight ? 'bg-[#21D4FD]/10' : 'bg-sky-50'
                    }`}>
                      <svg className={`w-3.5 h-3.5 ${isNight ? 'text-[#21D4FD]' : 'text-sky-600'} drop-shadow-[0_0_4px_rgba(61,168,255,0.4)]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(61,168,255,0.1)" />
                        <polygon points="12,7 13.5,10.5 17,10.5 14,12.5 15,16 12,14 9,16 10,12.5 7,10.5 10.5,10.5" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Details Bottom Row */}
              <div 
                onClick={() => useKavachStore.getState().setActiveTab('safety_readiness')}
                className={`flex items-center justify-between w-full mt-1.5 pt-1.5 border-t cursor-pointer ${isNight ? 'border-white/5' : 'border-slate-100'}`}
              >
                <span className={`text-[8.5px] font-bold tracking-wide ${isNight ? 'text-white/80' : 'text-slate-600'}`}>View Details</span>
                <ChevronRight size={9} className={isNight ? 'text-white/85' : 'text-slate-600'} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. PREMIUM CHECK-IN CARD ─── */}
      <div className="px-[6px]">
        <PremiumCheckInCard
          isNight={isNight}
          displayFamilyMembers={displayFamilyMembers}
          currentStreak={currentStreak}
          toggleOverlay={toggleOverlay}
          setIsFamilyCircleDetailOpen={setIsFamilyCircleDetailOpen}
        />
      </div>
    </div>
  );
});
