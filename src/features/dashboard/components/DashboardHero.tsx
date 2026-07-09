import React from 'react';
import { Shield, ShieldCheck, HelpCircle, ArrowUpRight, Bell, User, Clock, Users, Sun, Moon, Info, Menu, CalendarCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTimeTheme } from '../../../hooks/useTimeTheme';
import { useKavachStore } from '../../../state/useKavachStore';

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
  SHIELD_BASE64_IMAGE,
  toggleOverlay,
  setIsFamilyCircleDetailOpen
}: DashboardHeroProps) => {
  const { profile } = useKavachStore();
  const userName = profile?.name || 'User';

  const { greeting, themeFolder } = useTimeTheme();

  // Generate 150 small stars for the top 30% of the sky
  const stars = React.useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 40}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 1 + 0.5}px`, // 0.5px to 1.5px so it's physically visible
      animationDuration: `${Math.random() * 3 + 1.5}s`,
      animationDelay: `${Math.random() * 3}s`,
      opacity: Math.random() * 0.6 + 0.4, // 0.4 to 1.0 opacity
    }));
  }, []);

  return (
    <div 
      className={`w-full rounded-[32px] relative z-10 overflow-hidden transition-all duration-500 ${isNight ? 'border bg-transparent border-[#2a1758] shadow-[0_20px_40px_rgba(65,20,120,0.2)]' : 'border-0 backdrop-blur-[40px] bg-[#FFF9F2]/95 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)]'}`}
      style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform, opacity', contain: 'layout paint' }}
    >

      {/* Hero Background Image (Dictates the height) */}
      <img
        src={isNight ? "/assets/dashboard_assets/night/nighthero.png?v=2" : `/assets/dashboard_assets/${themeFolder}/${themeFolder}hero.${themeFolder === 'afternoon' ? 'jpeg' : 'png'}`}
        alt="Hero Background"
        className={`w-full h-[270px] rounded-[32px] object-cover ${themeFolder === 'afternoon' ? 'object-[85%_center]' : 'object-center'} block pointer-events-none z-0 ${isNight ? 'opacity-100 mix-blend-normal' : 'opacity-100 mix-blend-normal'} [image-rendering:-webkit-optimize-contrast] contrast-[1.25] saturate-[1.2] brightness-[0.95]`}
      />

      {/* Subtle Overlay for better text readability */}
      <div className={`absolute inset-0 z-[5] pointer-events-none ${isNight ? 'hidden' : 'bg-gradient-to-b from-white/30 via-transparent to-transparent'}`} />

      {/* Content overlay container */}
      <div className="absolute inset-0 px-4 pt-4 pb-2 flex flex-col justify-between z-10 w-full h-full">

        {/* Real Moonlight Glow Effect (Top-Left) */}
        <div className={`hidden absolute top-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full blur-[60px] opacity-30 pointer-events-none z-0 ${isNight ? 'bg-[#e0e7ff]' : 'bg-[#fef08a]'}`} />

        {/* Dynamic Small Blinking Stars (Top 50%) */}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute bg-white rounded-full"
                style={{
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  opacity: star.opacity,
                  animation: `starBlink ${star.animationDuration} ease-in-out infinite`,
                  animationDelay: star.animationDelay,
                }}
              />
            ))}
          </div>
        )}

        {/* Animated Sunlight Bloom (Morning Only) */}
        {!isNight && (
          <div className="absolute -top-20 -right-10 w-[250px] h-[250px] bg-[#FFD7B2]/40 rounded-full blur-[60px] animate-sunlight-breathe z-0 pointer-events-none mix-blend-screen" />
        )}

        {/* Animated Clouds (Morning Only) */}
        {!isNight && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-overlay opacity-80">
            <div className="absolute top-[15%] left-[10%] w-[140px] h-[35px] bg-white/70 rounded-full blur-[12px] animate-cloud-drift" />
            <div className="absolute top-[30%] right-[15%] w-[100px] h-[25px] bg-white/60 rounded-full blur-[10px] animate-cloud-drift" style={{ animationDelay: '-15s', animationDuration: '45s' }} />
          </div>
        )}

        {/* Overlay gradient to ensure text remains readable */}
        <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none z-0 hidden`} />

        {/* Subtle Shaded Vignette Overlay */}
        <div className={`absolute inset-0 z-0 pointer-events-none hidden`} />

        {/* Apple-style Subtle Noise Texture */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        {/* Top Action Row (Absolute Top) */}
        <div className="absolute top-3 left-0 w-full px-3 flex justify-between items-start z-30">
          <div className={`text-[9px] font-semibold tracking-wide flex items-center gap-1 ${isNight ? 'text-white' : 'text-slate-800'}`}>
            {greeting.includes('Morning') && <span>✨</span>}
            {greeting.includes('Afternoon') && <span>☀️</span>}
            {greeting.includes('Evening') && <span>🌙</span>}
            {greeting.includes('Night') && <span>🌙</span>}
            <span className="ml-0.5">{greeting}</span>
          </div>

          <div className="flex items-center gap-1.5 -mt-0.5">
            <button className={`relative w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 cursor-pointer ${isNight ? 'bg-[#180c33]/80 border border-[#4d288a] text-white shadow-[0_0_8px_rgba(100,40,180,0.4)]' : 'bg-white text-black shadow-sm'}`}>
              <Bell size={10} strokeWidth={2.5} />
              <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-red-500 border-[1.5px] border-white text-white text-[5px] font-black rounded-full flex items-center justify-center shadow-sm">
                3
              </span>
            </button>
            <button
              onClick={() => toast.success("Menu opened")}
              className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 cursor-pointer ${isNight ? 'bg-[#180c33]/80 border border-[#4d288a] text-white shadow-[0_0_8px_rgba(100,40,180,0.4)]' : 'bg-white text-black shadow-sm'}`}
            >
              <Menu size={10} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Main Content: Left Column & Right Column */}
        <div className="flex flex-row justify-between items-start w-full relative z-20 mt-5">

          {/* LEFT COLUMN: Data & Stats */}
          <div className="flex-1 flex flex-col text-left shrink-0 mt-0.5">
            <p className={`text-[11px] font-semibold tracking-tight leading-none mb-0.5 ${isNight ? 'text-white' : 'text-slate-800'}`}>Hello,</p>
            <h1 className={`text-[26px] font-black flex items-center gap-1 mt-0 tracking-tight truncate w-full leading-[1.1] pb-1.5 ${isNight ? 'text-white' : 'text-[#0f172a]'}`}>
              {userName} <span className="text-[16px] origin-bottom-right inline-block ml-0.5">👋</span>
            </h1>

            {/* Everyone is Safe Badge */}
            <div className={`mt-3 flex items-center gap-1 px-2 py-0.5 rounded-full ${isNight ? 'bg-[#061e12]/80 border border-[#00ff66]/20 shadow-[0_4px_12px_rgba(0,255,102,0.1)]' : 'bg-[#e9fdf4]/80 backdrop-blur-md border border-[#00c262]/40'} w-fit`}>
              <ShieldCheck size={9} className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeWidth={2.5} />
              <span className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} style={{ fontSize: '7px' }}>•</span>
              <span className={`text-[8.5px] font-bold ${isNight ? 'text-[#00ff66]' : 'text-[#00c262]'}`}>
                Everyone is Safe
              </span>
            </div>

          </div>

        </div>

        <div className="mt-auto flex flex-col gap-2 w-full z-20 relative">
          
          {/* Protection Score Box (Glassmorphism) - Moved to bottom */}
          <div className={`translate-y-3 backdrop-blur-md rounded-[16px] py-3 px-4 flex items-center justify-between gap-4 w-fit border ${isNight ? 'bg-[#0f1123]/95 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-white/80 border-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]'}`}>
            <div className="flex flex-col text-left gap-1.5">
              <div className="flex items-center gap-1">
                <span className={`text-[7.5px] font-bold leading-none uppercase tracking-widest ${isNight ? 'text-white/60' : 'text-slate-800'}`}>
                  Protection Score
                </span>
                <Info size={9} className={isNight ? "text-white/40" : "text-slate-500"} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[22px] font-black leading-none tracking-tighter ${isNight ? 'text-white' : 'text-[#1e293b]'}`}>{protectionIndex}%</span>
                <ArrowUpRight size={12} className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeWidth={3.5} />
              </div>
              <span className={`text-[8px] font-semibold leading-none ${isNight ? 'text-white/60' : 'text-slate-500'}`}>You're doing great!</span>
            </div>
            <div className="relative w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <div className={`absolute inset-0 rounded-full ${isNight ? 'shadow-[0_0_10px_rgba(0,255,102,0.2)] animate-slow-pulse' : 'bg-[#00c262]/5 animate-slow-pulse'}`} />
              <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 36 36">
                <path className={isNight ? "text-[#00ff66]/30" : "text-[#00c262]/20"} strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeDasharray={`${protectionIndex}, 100`} strokeWidth="3.5" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <ShieldCheck size={16} className={isNight ? "text-[#fbbf24]" : "text-[#00c262]"} strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Bottom Row: Mini Items (Apple Glass Style) */}
          <div className="py-2 flex items-center justify-between gap-1.5 w-full">

          {/* FAMILY SAFE */}
          <div
            className={`flex-[1.1] flex items-center gap-1.5 justify-start cursor-pointer min-w-0 backdrop-blur-md rounded-[12px] py-3.5 px-2 border transition-transform active:scale-95 ${isNight ? 'bg-[#101225]/95 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]' : 'bg-white/95 border-white shadow-sm'}`}
            onClick={() => toggleOverlay(setIsFamilyCircleDetailOpen, true)}
          >
            <div className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 ${isNight ? 'bg-purple-500/20' : 'bg-[#f3e8ff]'}`}>
              <Users size={13} className={isNight ? "text-purple-400" : "text-[#9333ea]"} />
            </div>
            <div className="flex flex-col text-left min-w-0 leading-none justify-center">
              <span className={`text-[8.5px] font-semibold tracking-wide truncate w-full ${isNight ? 'text-white/60' : 'text-[#334155]'}`}>Family</span>
              <span className={`text-[10.5px] font-black mt-1 truncate w-full ${isNight ? 'text-[#00ff66]' : 'text-[#00c262]'}`}>
                {displayFamilyMembers && displayFamilyMembers.length > 0 ? `${displayFamilyMembers.length}/${displayFamilyMembers.length}` : '4/4'}
              </span>
            </div>
          </div>

          {/* NEXT CHECK-IN */}
          <div className={`flex-[1.25] flex items-center gap-1.5 justify-start cursor-pointer min-w-0 backdrop-blur-md rounded-[12px] py-3.5 px-2 border transition-transform active:scale-95 ${isNight ? 'bg-[#101225]/95 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]' : 'bg-white/95 border-white shadow-sm'}`}>
            <div className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 ${isNight ? 'bg-blue-500/20' : 'bg-[#e0f2fe]'}`}>
              <Clock size={13} className={isNight ? "text-blue-400" : "text-[#2563eb]"} />
            </div>
            <div className="flex flex-col text-left min-w-0 leading-none justify-center">
              <span className={`text-[8.5px] font-semibold tracking-wide truncate w-full ${isNight ? 'text-white/60' : 'text-[#334155]'}`}>Next Check-in</span>
              <span className={`text-[10.5px] font-black mt-1 truncate w-full ${isNight ? 'text-white' : 'text-[#0f172a]'}`}>
                {isRideActive ? 'In Ride' : (isNight ? '8:30 PM' : '8:30 AM')}
              </span>
            </div>
          </div>

          {/* NIGHT CHECK-IN / LAST CHECK-IN */}
          <div
            className={`flex-[1.25] flex items-center gap-1.5 justify-start cursor-pointer min-w-0 backdrop-blur-md rounded-[12px] py-3.5 px-2 border transition-transform active:scale-95 ${isNight ? 'bg-[#101225]/95 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]' : 'bg-white/95 border-white shadow-sm'}`}
            onClick={() => toggleOverlay(setIsFamilyCircleDetailOpen, true)}
          >
            <div className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 ${isNight ? 'bg-emerald-500/20' : 'bg-[#dcfce7]'}`}>
              <CalendarCheck size={13} className={isNight ? "text-emerald-400" : "text-[#16a34a]"} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-left min-w-0 leading-none justify-center">
              <span className={`text-[8.5px] font-semibold tracking-wide truncate w-full ${isNight ? 'text-white/60' : 'text-[#334155]'}`}>{isNight ? 'Last Check-in' : 'Night Check-in'}</span>
              <span className={`text-[10.5px] font-black mt-1 truncate w-full ${isNight ? 'text-white' : 'text-[#0f172a]'}`}>
                {updates && updates.length > 0 ? updates[0].time : (isNight ? '7:21 PM' : '7:12 AM')}
              </span>
            </div>
          </div>

          {/* VIEW ALL BUTTON */}
          <div className={`flex items-center justify-center shrink-0 border rounded-full px-3 py-2 cursor-pointer shadow-sm ml-0.5 transition-colors ${isNight ? 'bg-[#1a113a]/80 border-[#3b2b73] hover:bg-[#23154f]' : 'bg-gradient-to-r from-sky-400 to-[#2563eb] border-none hover:opacity-90'}`} onClick={() => toast.info("History coming soon!")}>
            <ChevronRight size={18} className={isNight ? 'text-[#c4b5fd]' : 'text-white'} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  </div>
);
});
