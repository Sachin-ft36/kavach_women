import React from 'react';
import { ShieldCheck, HelpCircle, ArrowUpRight, Bell, User, Clock, Users, Sun, Moon, Info, Menu, CalendarCheck } from 'lucide-react';
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

export const DashboardHero = ({
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

  return (
    <div className={`w-full backdrop-blur-[40px] rounded-[32px] relative z-10 overflow-hidden transition-all duration-500 ${isNight ? 'border bg-[#0c071d]/90 border-[#2a1758] shadow-[0_20px_40px_rgba(65,20,120,0.2)]' : 'border-0 bg-[#FFF9F2]/95 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)]'}`}>

      {/* Hero Background Image (Dictates the height) */}
      <img
        src={isNight ? "/assets/dashboard_assets/hero.png" : `/assets/dashboard_assets/${themeFolder}/${themeFolder}hero.${themeFolder === 'afternoon' ? 'jpeg' : 'png'}`}
        alt="Hero Background"
        className={`w-full h-auto block pointer-events-none z-0 ${isNight ? 'opacity-100 mix-blend-screen' : 'opacity-100 mix-blend-normal'}`}
      />

      {/* Subtle Overlay for better text readability */}
      <div className={`absolute inset-0 z-[5] pointer-events-none ${isNight ? 'bg-black/20' : 'bg-gradient-to-b from-white/60 via-white/20 to-transparent'}`} />

      {/* Content overlay container */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10 w-full h-full">

        {/* Real Moonlight Glow Effect (Top-Left) */}
        <div className={`absolute top-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full blur-[60px] opacity-30 pointer-events-none z-0 ${isNight ? 'bg-[#e0e7ff]' : 'bg-[#fef08a]'}`} />

        {/* Hollywood-style Twinkling Flare Stars (Scattered Everywhere - Night Only) */}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Flares */}
            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '12%', top: '8%', animation: 'starBlink 2.6s ease-in-out infinite', animationDelay: '0s' }}>
              <div className="absolute w-[6px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="absolute w-[1px] h-[6px] bg-gradient-to-b from-transparent via-white to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '85%', top: '15%', animation: 'starBlink 3.2s ease-in-out infinite', animationDelay: '0.4s' }}>
              <div className="absolute w-[8px] h-[1px] bg-gradient-to-r from-transparent via-[#ff4fd8] to-transparent" />
              <div className="absolute w-[1px] h-[8px] bg-gradient-to-b from-transparent via-[#ff4fd8] to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_4px_#ff8af5]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '45%', top: '35%', animation: 'starBlink 2.4s ease-in-out infinite', animationDelay: '1.2s' }}>
              <div className="absolute w-[10px] h-[1px] bg-gradient-to-r from-transparent via-[#d8b4fe] to-transparent" />
              <div className="absolute w-[1px] h-[10px] bg-gradient-to-b from-transparent via-[#d8b4fe] to-transparent" />
              <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white shadow-[0_0_4px_#d8b4fe]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '25%', top: '75%', animation: 'starBlink 2.8s ease-in-out infinite', animationDelay: '2.1s' }}>
              <div className="absolute w-[7px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="absolute w-[1px] h-[7px] bg-gradient-to-b from-transparent via-white to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_3px_#fff]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '75%', top: '65%', animation: 'starBlink 3.5s ease-in-out infinite', animationDelay: '1.1s' }}>
              <div className="absolute w-[9px] h-[1px] bg-gradient-to-r from-transparent via-[#d8b4fe] to-transparent" />
              <div className="absolute w-[1px] h-[9px] bg-gradient-to-b from-transparent via-[#d8b4fe] to-transparent" />
              <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white shadow-[0_0_4px_#d8b4fe]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '15%', top: '45%', animation: 'starBlink 2.1s ease-in-out infinite', animationDelay: '0.8s' }}>
              <div className="absolute w-[6px] h-[1px] bg-gradient-to-r from-transparent via-[#ff4fd8] to-transparent" />
              <div className="absolute w-[1px] h-[6px] bg-gradient-to-b from-transparent via-[#ff4fd8] to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_3px_#ff8af5]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '60%', top: '85%', animation: 'starBlink 3.1s ease-in-out infinite', animationDelay: '1.5s' }}>
              <div className="absolute w-[8px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="absolute w-[1px] h-[8px] bg-gradient-to-b from-transparent via-white to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_3px_#fff]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '92%', top: '45%', animation: 'starBlink 2.9s ease-in-out infinite', animationDelay: '1.9s' }}>
              <div className="absolute w-[7px] h-[1px] bg-gradient-to-r from-transparent via-[#ff4fd8] to-transparent" />
              <div className="absolute w-[1px] h-[7px] bg-gradient-to-b from-transparent via-[#ff4fd8] to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#ff4fd8]" />
            </div>

            <div className="absolute flex items-center justify-center rotate-45" style={{ left: '50%', top: '92%', animation: 'starBlink 3.3s ease-in-out infinite', animationDelay: '0.3s' }}>
              <div className="absolute w-[8px] h-[1px] bg-gradient-to-r from-transparent via-[#d8b4fe] to-transparent" />
              <div className="absolute w-[1px] h-[8px] bg-gradient-to-b from-transparent via-[#d8b4fe] to-transparent" />
              <div className="absolute w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_3px_#d8b4fe]" />
            </div>

            {/* Simple Dots Everywhere (Top, Middle, Bottom, Left, Right) */}
            <div className="absolute top-[3%] left-[5%] w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" style={{ animation: 'starBlink 3s ease-in-out infinite', animationDelay: '0.2s' }} />
            <div className="absolute top-[7%] left-[25%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[2%] left-[45%] w-[1.5px] h-[1.5px] rounded-full bg-[#d8b4fe]" style={{ animation: 'starBlink 4s ease-in-out infinite', animationDelay: '1.5s' }} />
            <div className="absolute top-[8%] left-[65%] w-[1px] h-[1px] rounded-full bg-[#ff4fd8]" />
            <div className="absolute top-[4%] left-[85%] w-[1px] h-[1px] rounded-full bg-white" style={{ animation: 'starBlink 2s ease-in-out infinite', animationDelay: '0.5s' }} />

            <div className="absolute top-[15%] left-[8%] w-[1px] h-[1px] rounded-full bg-[#d8b4fe] shadow-[0_0_2px_#d8b4fe]" />
            <div className="absolute top-[18%] left-[35%] w-[1px] h-[1px] rounded-full bg-white" style={{ animation: 'starBlink 3.5s ease-in-out infinite', animationDelay: '2s' }} />
            <div className="absolute top-[12%] left-[55%] w-[1.5px] h-[1.5px] rounded-full bg-[#ff4fd8]" />
            <div className="absolute top-[16%] left-[75%] w-[1px] h-[1px] rounded-full bg-white" style={{ animation: 'starBlink 2.5s ease-in-out infinite', animationDelay: '0.8s' }} />
            <div className="absolute top-[14%] left-[95%] w-[1px] h-[1px] rounded-full bg-[#d8b4fe]" />

            <div className="absolute top-[25%] left-[15%] w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" style={{ animation: 'starBlink 3.2s ease-in-out infinite', animationDelay: '1.2s' }} />
            <div className="absolute top-[28%] left-[45%] w-[1.5px] h-[1.5px] rounded-full bg-[#ff4fd8]" />
            <div className="absolute top-[22%] left-[85%] w-[1px] h-[1px] rounded-full bg-[#d8b4fe]" style={{ animation: 'starBlink 4s ease-in-out infinite', animationDelay: '0.1s' }} />

            <div className="absolute top-[35%] left-[5%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[38%] left-[28%] w-[1px] h-[1px] rounded-full bg-[#ff4fd8]" style={{ animation: 'starBlink 2.8s ease-in-out infinite', animationDelay: '1.7s' }} />
            <div className="absolute top-[32%] left-[65%] w-[1.5px] h-[1.5px] rounded-full bg-[#d8b4fe]" />
            <div className="absolute top-[36%] left-[90%] w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" style={{ animation: 'starBlink 3.1s ease-in-out infinite', animationDelay: '0.9s' }} />

            <div className="absolute top-[45%] left-[22%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[48%] left-[55%] w-[1.5px] h-[1.5px] rounded-full bg-[#d8b4fe]" style={{ animation: 'starBlink 2.6s ease-in-out infinite', animationDelay: '1.3s' }} />
            <div className="absolute top-[42%] left-[78%] w-[1px] h-[1px] rounded-full bg-[#ff4fd8]" />

            <div className="absolute top-[55%] left-[10%] w-[1px] h-[1px] rounded-full bg-[#d8b4fe] shadow-[0_0_2px_#d8b4fe]" style={{ animation: 'starBlink 3.7s ease-in-out infinite', animationDelay: '2.2s' }} />
            <div className="absolute top-[58%] left-[38%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[52%] left-[72%] w-[1px] h-[1px] rounded-full bg-[#ff4fd8]" style={{ animation: 'starBlink 2.9s ease-in-out infinite', animationDelay: '0.6s' }} />
            <div className="absolute top-[56%] left-[94%] w-[1.5px] h-[1.5px] rounded-full bg-white" />

            <div className="absolute top-[65%] left-[5%] w-[1.5px] h-[1.5px] rounded-full bg-white" style={{ animation: 'starBlink 4.1s ease-in-out infinite', animationDelay: '1.8s' }} />
            <div className="absolute top-[68%] left-[30%] w-[1px] h-[1px] rounded-full bg-[#d8b4fe]" />
            <div className="absolute top-[62%] left-[58%] w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" style={{ animation: 'starBlink 3.3s ease-in-out infinite', animationDelay: '0.4s' }} />
            <div className="absolute top-[66%] left-[85%] w-[1px] h-[1px] rounded-full bg-[#ff4fd8]" />

            <div className="absolute top-[75%] left-[18%] w-[1px] h-[1px] rounded-full bg-[#ff4fd8]" style={{ animation: 'starBlink 2.7s ease-in-out infinite', animationDelay: '1.6s' }} />
            <div className="absolute top-[78%] left-[48%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[72%] left-[78%] w-[1.5px] h-[1.5px] rounded-full bg-[#d8b4fe]" style={{ animation: 'starBlink 3.8s ease-in-out infinite', animationDelay: '0.7s' }} />

            <div className="absolute top-[85%] left-[8%] w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" />
            <div className="absolute top-[88%] left-[35%] w-[1.5px] h-[1.5px] rounded-full bg-[#ff4fd8]" style={{ animation: 'starBlink 2.4s ease-in-out infinite', animationDelay: '2.3s' }} />
            <div className="absolute top-[82%] left-[65%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[86%] left-[90%] w-[1px] h-[1px] rounded-full bg-[#d8b4fe]" style={{ animation: 'starBlink 3.4s ease-in-out infinite', animationDelay: '1.1s' }} />

            <div className="absolute top-[95%] left-[15%] w-[1.5px] h-[1.5px] rounded-full bg-[#d8b4fe]" style={{ animation: 'starBlink 4.2s ease-in-out infinite', animationDelay: '0.5s' }} />
            <div className="absolute top-[98%] left-[42%] w-[1px] h-[1px] rounded-full bg-white" />
            <div className="absolute top-[96%] left-[96%] w-[1px] h-[1px] rounded-full bg-white shadow-[0_0_2px_#fff]" />
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
        <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none z-0 ${isNight ? 'from-[#0c071d]/90 via-[#0c071d]/50 to-transparent' : 'hidden'}`} />

        {/* Subtle Shaded Vignette Overlay */}
        <div className={`absolute inset-0 z-0 pointer-events-none ${isNight ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] bg-black/10' : 'hidden'}`} />

        {/* Apple-style Subtle Noise Texture */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        {/* Top Action Row (Absolute Top) */}
        <div className="absolute top-3 left-0 w-full px-3 flex justify-between items-start z-30">
          <div className={`text-[9px] font-semibold tracking-wide flex items-center gap-1 ${isNight ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>
            {greeting.includes('Morning') && <span>☀️</span>}
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
            <p className={`text-[11px] font-semibold tracking-tight leading-none mb-0.5 ${isNight ? 'text-white/90' : 'text-slate-800'}`}>Hello,</p>
            <h1 className={`text-[20px] font-black flex items-center gap-1 mt-0 tracking-tight truncate w-full leading-none pb-0.5 ${isNight ? 'text-white' : 'text-[#0f172a]'}`}>
              {userName} <span className="text-[14px] origin-bottom-right inline-block ml-0.5">👋</span>
            </h1>

            {/* Everyone is Safe Badge */}
            <div className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full ${isNight ? 'bg-[#00ff66]/10 border-[#00ff66]/30' : 'bg-[#e9fdf4]/80 backdrop-blur-md border border-[#00c262]/40'} w-fit`}>
              <ShieldCheck size={9} className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeWidth={2.5} />
              <span className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} style={{ fontSize: '7px' }}>•</span>
              <span className={`text-[8.5px] font-bold ${isNight ? 'text-[#00ff66]' : 'text-[#00c262]'}`}>
                Everyone is Safe
              </span>
            </div>

            {/* Protection Score Box (Glassmorphism) */}
            <div className={`mt-4 backdrop-blur-md rounded-[16px] py-4 px-3 flex items-center justify-between gap-4 w-fit border ${isNight ? 'bg-black/20 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]'}`}>

              {/* Left Side: Texts */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`text-[7.5px] font-bold leading-none uppercase tracking-widest ${isNight ? 'text-white/60' : 'text-slate-800'}`}>
                    Protection Score
                  </span>
                  <Info size={9} className={isNight ? "text-white/40" : "text-slate-500"} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[24px] font-black leading-none tracking-tighter ${isNight ? 'text-white' : 'text-[#1e293b]'}`}>{protectionIndex}%</span>
                  <ArrowUpRight size={13} className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeWidth={3.5} />
                </div>
                <span className={`text-[9px] font-semibold leading-none mt-1 ${isNight ? 'text-white/60' : 'text-slate-500'}`}>You're doing great!</span>
              </div>

              {/* Right Side: Glowing Circular Progress indicator */}
              <div className="relative w-[40px] h-[40px] flex items-center justify-center shrink-0">
                <div className={`absolute inset-0 rounded-full ${isNight ? 'shadow-[0_0_10px_rgba(0,255,102,0.2)] animate-slow-pulse' : 'bg-[#00c262]/5 animate-slow-pulse'}`} />
                <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 36 36">
                  {/* Thin Dark Green Track */}
                  <path className={isNight ? "text-[#00ff66]/30" : "text-[#00c262]/20"} strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  {/* Bright Glowing Progress Arc */}
                  <path className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeDasharray={`${protectionIndex}, 100`} strokeWidth="4.5" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <ShieldCheck size={14} className={isNight ? "text-[#00ff66]" : "text-[#00c262]"} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Hero Section (Shield, Orbits, Platform) */}
          {isNight && (
            <div className="w-[130px] shrink-0 relative h-[145px] flex items-start justify-center translate-x-[-10px] mr-0 mt-[-30px]" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>

              {/* Orbits Container in 3D Space (Night Only) */}
              {isNight && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-1" style={{ transformStyle: 'preserve-3d' }}>

                  {/* Orbit 1 (Tilted Left) */}
                  <div className="absolute w-[170px] h-[170px] rounded-full border-[1.2px] border-[#9d4edd]/40 shadow-[0_0_10px_rgba(157,78,221,0.2)]"
                    style={{ transform: 'rotateZ(-15deg) rotateX(75deg)', transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 orbit-1" style={{ transformStyle: 'preserve-3d' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#ffffff] rounded-full shadow-[0_0_6px_#fff]"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#d8b4fe] rounded-full shadow-[0_0_6px_#d8b4fe]"></div>
                      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#ffb5ff] rounded-full shadow-[0_0_6px_#ffb5ff]"></div>
                    </div>
                  </div>

                  {/* Orbit 2 (Tilted Right) */}
                  <div className="absolute w-[180px] h-[180px] rounded-full border-[1.2px] border-[#9d4edd]/30 shadow-[0_0_10px_rgba(157,78,221,0.15)]"
                    style={{ transform: 'rotateZ(15deg) rotateX(75deg)', transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 orbit-2" style={{ transformStyle: 'preserve-3d' }}>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#ffffff] rounded-full shadow-[0_0_6px_#fff]"></div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#c084fc] rounded-full shadow-[0_0_6px_#c084fc]"></div>
                      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#d8b4fe] rounded-full shadow-[0_0_6px_#d8b4fe]"></div>
                    </div>
                  </div>

                  {/* Orbit 3 (Horizontal Flat) */}
                  <div className="absolute w-[190px] h-[190px] rounded-full border border-[#9d4edd]/20 shadow-[0_0_8px_rgba(157,78,221,0.1)]"
                    style={{ transform: 'rotateX(75deg)', transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 orbit-3" style={{ transformStyle: 'preserve-3d' }}>
                      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#e9d5ff] rounded-full shadow-[0_0_6px_#e9d5ff]"></div>
                      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#ffffff] rounded-full shadow-[0_0_6px_#fff]"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#e0b1cb] rounded-full shadow-[0_0_6px_#e0b1cb]"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Glowing Shield (Placed strictly at Z=0 for 3D sorting) */}
              <div className={`relative w-[125px] h-[156px] mt-1 ${isNight ? 'drop-shadow-[0_0_24px_rgba(147,51,234,0.5)]' : ''}`} style={{ transform: 'translateZ(0px)' }}>
                <svg width="100%" height="100%" viewBox="0 0 240 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="shieldBorder" x1="0" y1="0" x2="0" y2="280" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#d8b4fe" />
                      <stop offset="0.15" stopColor="#6b21a8" />
                      <stop offset="0.7" stopColor="#a855f7" />
                      <stop offset="0.95" stopColor="#d900ff" />
                      <stop offset="1" stopColor="#ffb5ff" />
                    </linearGradient>
                    <linearGradient id="shieldLine" x1="0" y1="0" x2="0" y2="280" gradientUnits="userSpaceOnUse">
                      <stop offset="0.02" stopColor="#ffffff" />
                      <stop offset="0.1" stopColor="#d8b4fe" />
                      <stop offset="0.3" stopColor="#9333ea" />
                      <stop offset="0.7" stopColor="#d900ff" />
                      <stop offset="0.95" stopColor="#ff66ff" />
                      <stop offset="1" stopColor="#ffffff" />
                    </linearGradient>
                    <linearGradient id="shieldGlow" x1="0" y1="0" x2="0" y2="280" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#d8b4fe" stopOpacity="0.8" />
                      <stop offset="0.2" stopColor="#9333ea" stopOpacity="0.3" />
                      <stop offset="0.8" stopColor="#d900ff" stopOpacity="0.8" />
                      <stop offset="1" stopColor="#ff2dff" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="shieldFill" x1="0" y1="0" x2="0" y2="280" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4C1D95" stopOpacity="0.8" />
                      <stop offset="1" stopColor="#1E1B4B" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <clipPath id="shieldClip">
                      <path d="M 120 15 L 220 50 L 220 140 C 220 220 120 275 120 275 C 120 275 20 220 20 140 L 20 50 Z" />
                    </clipPath>
                  </defs>

                  {/* Outer Thick Neon Glow */}
                  {isNight && (
                    <path
                      d="M 120 15 L 220 50 L 220 140 C 220 220 120 275 120 275 C 120 275 20 220 20 140 L 20 50 Z"
                      stroke="url(#shieldGlow)" strokeWidth="14" fill="none" filter="url(#glow)" opacity="0.85"
                    />
                  )}

                  {/* Shield Content & Thick Purple Border (Clipped) */}
                  <g clipPath={isNight ? "url(#shieldClip)" : undefined}>
                    {/* Shield Base Fill (Semi-transparent for glass effect) */}
                    {isNight && (
                      <path
                        d="M 120 15 L 220 50 L 220 140 C 220 220 120 275 120 275 C 120 275 20 220 20 140 L 20 50 Z"
                        fill="rgba(20, 10, 40, 0.2)"
                      />
                    )}

                    <filter id="maskBlur">
                      <feGaussianBlur stdDeviation="5" />
                    </filter>
                    <mask id="familyMask">
                      {/* Base transparent background */}
                      <rect width="240" height="280" fill="black" />
                      {/* Custom Silhouette Polygon with soft edges */}
                      <g filter="url(#maskBlur)">
                        <path
                          d="M 0 280 L 15 180 L 35 125 L 55 70 L 95 25 L 130 35 L 140 55 L 165 40 L 205 65 L 225 115 L 235 180 L 235 280 Z"
                          fill="white"
                        />
                        <rect x="10" y="150" width="220" height="130" fill="white" />
                      </g>
                    </mask>

                    {/* Family Image (Perfectly cut out) */}
                    <image
                      href={SHIELD_BASE64_IMAGE}
                      width="240" height="280" preserveAspectRatio="xMidYMid slice"
                      mask="url(#familyMask)"
                    />

                    {/* Very faint purple overlay for blending with theme */}
                    {isNight && (
                      <>
                        <rect width="240" height="280" fill="#2b0a5e" opacity="0.15" style={{ mixBlendMode: 'overlay' }} />

                        {/* Thick Solid Purple Frame (Only inner half visible due to clip) */}
                        <path
                          d="M 120 15 L 220 50 L 220 140 C 220 220 120 275 120 275 C 120 275 20 220 20 140 L 20 50 Z"
                          stroke="url(#shieldBorder)" strokeWidth="12" fill="none"
                        />
                      </>
                    )}
                  </g>

                  {/* Outermost Thin Bright Border ("patli") */}
                  {isNight && (
                    <>
                      <path
                        d="M 120 15 L 220 50 L 220 140 C 220 220 120 275 120 275 C 120 275 20 220 20 140 L 20 50 Z"
                        stroke="url(#shieldLine)" strokeWidth="1.5" fill="none" opacity="1"
                      />

                      {/* Innermost Purple Line */}
                      <path
                        d="M 120 20 L 214 53 L 214 138 C 214 212 120 266 120 266 C 120 266 26 212 26 138 L 26 53 Z"
                        stroke="url(#shieldLine)" strokeWidth="1.5" fill="none" opacity="0.9"
                      />
                    </>
                  )}
                </svg>

                {/* Glowing Heart */}
                {isNight && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20">

                    {/* Background Glow */}
                    <div className="absolute w-[46px] h-[46px] rounded-full bg-[#ff2dff] blur-[16px] opacity-60" />

                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      className="relative overflow-visible drop-shadow-[0_0_10px_rgba(255,70,255,.9)]"
                    >
                      <defs>
                        {/* Main Heart */}
                        <radialGradient id="heartMain" cx="35%" cy="25%">
                          <stop offset="0%" stopColor="#ff6cff" />
                          <stop offset="45%" stopColor="#e400ff" />
                          <stop offset="100%" stopColor="#5b008d" />
                        </radialGradient>

                        {/* Gloss */}
                        <linearGradient id="glassLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="white" stopOpacity=".75" />
                          <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </linearGradient>

                        {/* Inner Ring Glow */}
                        <linearGradient id="innerRingGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#ffb5ff" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ff6cff" stopOpacity="0" />
                        </linearGradient>

                        {/* Stroke Glow */}
                        <filter id="strokeGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="0.6" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Outer Heart with Glow */}
                      <path
                        d="M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z"
                        fill="url(#heartMain)"
                        stroke="#ffb5ff"
                        strokeWidth="0.8"
                        filter="url(#strokeGlow)"
                      />

                      {/* Crisp Neon Outline */}
                      <path
                        d="M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z"
                        fill="none"
                        stroke="#ff66ff"
                        strokeWidth="0.3"
                        opacity=".85"
                      />

                      {/* Vertical Reflection */}
                      <path
                        d="M 12 3 L 12 21"
                        stroke="url(#glassLine)"
                        strokeWidth="0.6"
                        opacity=".45"
                      />

                      {/* Top Gloss */}
                      <ellipse
                        cx="7.5"
                        cy="5.5"
                        rx="4.5"
                        ry="2"
                        fill="white"
                        opacity=".14"
                        transform="rotate(-15 7.5 5.5)"
                      />

                      {/* Inner Heart Reflection Ring */}
                      <g transform="translate(12, 12) scale(0.53) translate(-12, -12)">
                        <path
                          d="M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z"
                          fill="none"
                          stroke="url(#innerRingGlow)"
                          strokeWidth="0.8"
                        />
                      </g>
                      {/* Inner White Heart (Scaled Down) */}
                      <g transform="translate(12, 12) scale(0.45) translate(-12, -12)">
                        <path
                          d="M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z"
                          fill="white"
                        />
                      </g>

                      {/* Checkmark inside white heart */}
                      <path
                        d="M 9.5 12 l 1.5 1.5 l 3 -3.5"
                        fill="none"
                        stroke="#c026d3"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Mini Items (Apple Glass Style) */}
        <div className="py-3 flex items-center justify-between gap-1 z-20 relative w-full mt-auto">

          {/* FAMILY SAFE */}
          <div
            className={`flex-[1.1] flex items-center gap-1 justify-start cursor-pointer min-w-0 backdrop-blur-md rounded-[12px] py-3 px-1.5 border transition-transform active:scale-95 ${isNight ? 'bg-white/5 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)]' : 'bg-white/95 border-white shadow-sm'}`}
            onClick={() => toggleOverlay(setIsFamilyCircleDetailOpen, true)}
          >
            <div className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 ${isNight ? 'bg-purple-500/20' : 'bg-[#f3e8ff]'}`}>
              <Users size={9} className={isNight ? "text-purple-400" : "text-[#9333ea]"} />
            </div>
            <div className="flex flex-col text-left min-w-0 leading-none justify-center">
              <span className={`text-[7px] font-semibold tracking-wide truncate w-full ${isNight ? 'text-white/60' : 'text-[#334155]'}`}>Family</span>
              <span className={`text-[8.5px] font-black mt-[1px] truncate w-full ${isNight ? 'text-[#00ff66]' : 'text-[#00c262]'}`}>
                {displayFamilyMembers && displayFamilyMembers.length > 0 ? `${displayFamilyMembers.length}/${displayFamilyMembers.length}` : '4/4'}
              </span>
            </div>
          </div>

          {/* NEXT CHECK-IN */}
          <div className={`flex-[1.25] flex items-center gap-1 justify-start cursor-pointer min-w-0 backdrop-blur-md rounded-[12px] py-3 px-1.5 border transition-transform active:scale-95 ${isNight ? 'bg-white/5 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)]' : 'bg-white/95 border-white shadow-sm'}`}>
            <div className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 ${isNight ? 'bg-blue-500/20' : 'bg-[#e0f2fe]'}`}>
              <Clock size={9} className={isNight ? "text-blue-400" : "text-[#2563eb]"} />
            </div>
            <div className="flex flex-col text-left min-w-0 leading-none justify-center">
              <span className={`text-[7px] font-semibold tracking-wide truncate w-full ${isNight ? 'text-white/60' : 'text-[#334155]'}`}>Next Check-in</span>
              <span className={`text-[8.5px] font-black mt-[1px] truncate w-full ${isNight ? 'text-white' : 'text-[#0f172a]'}`}>
                {isRideActive ? 'In Ride' : (isNight ? '8:30 PM' : '8:30 AM')}
              </span>
            </div>
          </div>

          {/* NIGHT CHECK-IN / LAST CHECK-IN */}
          <div
            className={`flex-[1.25] flex items-center gap-1 justify-start cursor-pointer min-w-0 backdrop-blur-md rounded-[12px] py-3 px-1.5 border transition-transform active:scale-95 ${isNight ? 'bg-white/5 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)]' : 'bg-white/95 border-white shadow-sm'}`}
            onClick={() => toggleOverlay(setIsFamilyCircleDetailOpen, true)}
          >
            <div className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 ${isNight ? 'bg-emerald-500/20' : 'bg-[#dcfce7]'}`}>
              <CalendarCheck size={9} className={isNight ? "text-emerald-400" : "text-[#16a34a]"} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-left min-w-0 leading-none justify-center">
              <span className={`text-[7px] font-semibold tracking-wide truncate w-full ${isNight ? 'text-white/60' : 'text-[#334155]'}`}>{isNight ? 'Last Check-in' : 'Night Check-in'}</span>
              <span className={`text-[8.5px] font-black mt-[1px] truncate w-full ${isNight ? 'text-white' : 'text-[#0f172a]'}`}>
                {updates && updates.length > 0 ? updates[0].time : (isNight ? '7:21 PM' : '7:12 AM')}
              </span>
            </div>
          </div>

          {/* LIVE INDICATOR OR VIEW ALL */}
          {isNight ? (
            <div className="flex items-center gap-1 shrink-0 pl-0.5">
              <span className="text-[9px] font-black text-[#00ff66] uppercase tracking-wider">Live</span>
              <svg width="7" height="5" viewBox="0 0 24 12" fill="none" className="opacity-90 shrink-0">
                <path d="M0 6 L4 6 L7 2 L11 10 L14 6 L24 6" stroke="#00ff66" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center shrink-0 bg-gradient-to-r from-sky-400 to-[#2563eb] border-none rounded-[10px] px-2 h-[24px] cursor-pointer shadow-sm ml-0.5 hover:scale-105 active:scale-95 transition-transform" onClick={() => toast.info("History coming soon!")}>
              <span className="text-[7.5px] font-bold text-white whitespace-nowrap">View All &gt;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
