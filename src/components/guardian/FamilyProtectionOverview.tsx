import React from 'react';
import { 
  Shield, 
  Bell, 
  ChevronRight, 
  CheckCircle2, 
  MapPin, 
  Car, 
  GraduationCap, 
  Dumbbell, 
  Heart, 
  Camera, 
  Phone, 
  Home, 
  Users, 
  User, 
  Plus, 
  Info,
  Sun,
  Building2,
  Circle,
  Siren,
  Star
} from 'lucide-react';
import { useTimeTheme } from '../../hooks/useTimeTheme';

export default function FamilyProtectionOverview() {
  const { timeOfDay, themeFolder } = useTimeTheme();
  const isNight = timeOfDay === 'night';

  return (
    // Main container - Dynamic daylight / night theme style
    <div 
      className="min-h-screen font-sans pb-20 selection:bg-purple-500/30 overflow-x-hidden pt-4 transition-all duration-1000"
      style={{ 
        background: isNight 
          ? '#0A0710' 
          : 'linear-gradient(180deg, #9AA8C6 0%, #F9EAD8 10%, #FBEAD6 22%, #FAEEE4 45%, #F7F3EE 70%, #ECE9EA 100%)',
        color: isNight ? '#ffffff' : '#1e1b4b'
      }}
    >
      
      {/* My Circle Section */}
      <main className="px-4 mt-1 space-y-2">
        
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <Users className={`w-5 h-5 ${isNight ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`text-xl font-bold ${isNight ? 'text-white' : 'text-[#1A1035]'}`}>My Circle</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                isNight
                  ? 'bg-[#1D1731] text-purple-300 border-purple-500/30'
                  : 'bg-purple-100 text-purple-700 border-purple-300/60'
              }`}>
                5 Members
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-medium ${isNight ? 'text-gray-400' : 'text-[#6B5E8A]'}`}>Your people. Your strength.</p>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-pink-500 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] border-none">
            <Plus className="w-3.5 h-3.5" /> Invite
          </button>
        </div>

        {/* Family Protection Score Card - Balanced and Premium */}
        <div 
          className="rounded-2xl p-4 border relative overflow-hidden shadow-lg transition-all duration-1000"
          style={{
            background: isNight ? 'linear-gradient(135deg, #161226 0%, #0D0A18 100%)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isNight ? 'rgba(0, 245, 122, 0.2)' : 'rgba(91, 55, 198, 0.35)',
            backdropFilter: 'blur(12px)',
            boxShadow: isNight ? '0 4px 24px rgba(0,0,0,0.45)' : '0 4px 24px rgba(91,55,198,0.12)'
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[#00F57A]/5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-start gap-3.5">
            {/* Circular Progress Ring (Balanced size: w-[96px] h-[96px]) */}
            <div className="relative w-[100px] h-[100px] shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#c026d3]/12 to-[#06b6d4]/12 rounded-full blur-[12px]"></div>
              
              <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="35%" stopColor="#d946ef" />
                    <stop offset="70%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  
                  <mask id="progressMask">
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="12" 
                      strokeDasharray="263.89" 
                      strokeDashoffset="47.5" 
                      transform="rotate(-90 50 50)" 
                    />
                    {/* Pink Knob cutout gap */}
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="none" 
                      stroke="black" 
                      strokeWidth="14" 
                      strokeDasharray="14 249.89" 
                      transform="rotate(152 50 50)" 
                    />
                    {/* Cyan Knob cutout gap */}
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="none" 
                      stroke="black" 
                      strokeWidth="14" 
                      strokeDasharray="14 249.89" 
                      transform="rotate(-6 50 50)" 
                    />
                  </mask>

                  {/* Additional mask to split the background track under knobs */}
                  <mask id="trackMask">
                    <circle cx="50" cy="50" r="42" fill="white" stroke="none" />
                    {/* Cutout under Pink Knob */}
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="none" 
                      stroke="black" 
                      strokeWidth="14" 
                      strokeDasharray="14 249.89" 
                      transform="rotate(152 50 50)" 
                    />
                    {/* Cutout under Cyan Knob */}
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="none" 
                      stroke="black" 
                      strokeWidth="14" 
                      strokeDasharray="14 249.89" 
                      transform="rotate(-6 50 50)" 
                    />
                  </mask>
                </defs>

                {/* Inner background shadow lines */}
                <circle cx="50" cy="50" r="36" fill="none" stroke={isNight ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeWidth="0.5" />
                <circle cx="50" cy="50" r="35" fill={isNight ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"} />

                {/* Dimmed background track segments (Thicker dashes) */}
                <g mask="url(#trackMask)">
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke={isNight ? "#16122C" : "#E2E8F0"} 
                    strokeWidth="6.5" 
                    strokeDasharray="23 3.3" 
                    transform="rotate(-90 50 50)" 
                  />
                </g>
                
                {/* Active gradient track (Masked to show only up to 82% progress, thicker) */}
                <g mask="url(#progressMask)">
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke="url(#ringGrad)" 
                    strokeWidth="6.5" 
                    strokeDasharray="23 3.3" 
                    transform="rotate(-90 50 50)" 
                  />
                </g>

                {/* Hexagonal/rounded knob pill at ~255 degrees (Left side pink indicator) */}
                <g transform="rotate(-18 50 50)">
                  <rect x="3.5" y="43.5" width="9" height="13" rx="4.5" fill="#d946ef" filter="url(#glowPink)" stroke="#ffffff/25" strokeWidth="0.5" />
                </g>
                
                {/* Hexagonal/rounded knob pill at ~0 degrees (Top center cyan indicator) */}
                <g transform="rotate(90 50 50)">
                  <rect x="43.5" y="3.5" width="13" height="9" rx="4.5" fill="#22d3ee" filter="url(#glowCyan)" stroke="#ffffff/25" strokeWidth="0.5" />
                </g>
              </svg>
              
              {/* Center Content (Madhil majkoor aani icons) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-2 z-20">
                <div className="relative mb-0.5">
                  <Shield className="w-5 h-5 text-[#22d3ee] drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]" strokeWidth={1.5} />
                  <Star className="w-2 h-2 text-[#22d3ee] fill-[#22d3ee] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <span className={`text-[20px] font-bold leading-none tracking-tight mt-0.5 ${isNight ? 'text-white' : 'text-slate-900'}`}>82%</span>
                <span className="text-[8px] text-[#22c55e] font-semibold mt-0.5 tracking-wide">Protected</span>
              </div>
            </div>

            <div className="flex-1 text-left pt-0.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <h3 className={`text-[11px] font-semibold tracking-wide ${isNight ? 'text-white' : 'text-slate-800'}`}>Family Protection Score</h3>
                  <Info className="w-2 h-2 text-gray-400" />
                </div>
                <ChevronRight className={`w-3 h-3 ${isNight ? 'text-gray-300' : 'text-slate-500'}`} />
              </div>
              <p className={`text-[9px] mt-0.5 leading-none ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>Great job! Your circle is strong.</p>
              
              {/* Neon green segmented progress bar (10 segments) */}
              <div className="flex gap-[1px] mt-2.5 h-[7.5px] w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full ${
                      i <= 8 
                        ? 'bg-[#00F97C] shadow-[0_0_6px_rgba(0,249,124,0.3)]' 
                        : isNight ? 'bg-[#1E1933]/90' : 'bg-slate-300'
                    }`}
                  ></div>
                ))}
              </div>

              {/* Stats Row - Compacted Match from Image 2 */}
              <div className="flex justify-between mt-2.5 px-0.5 gap-1.5">
                
                {/* Item 1: Members Connected */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    {/* Glowing Circular Icon Base */}
                    <div className="relative w-6 h-6 rounded-full bg-[#b06bf3]/10 border border-[#b06bf3]/15 flex items-center justify-center shadow-inner">
                      <div className="absolute inset-0 bg-[#b06bf3]/5 rounded-full blur-sm"></div>
                      {/* Shield with User inside */}
                      <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                        <Shield className="w-full h-full text-[#b06bf3]" strokeWidth={1.5} />
                        <User className="w-2 h-2 text-[#b06bf3] absolute top-[35%] left-1/2 transform -translate-x-1/2" strokeWidth={2} />
                      </div>
                    </div>
                    {/* Value with Underline */}
                    <div className={`border-b ${isNight ? 'border-slate-400/80' : 'border-slate-400'} pb-0.5 px-0.5 leading-none`}>
                      <span className={`text-[10px] font-bold tracking-wide ${isNight ? 'text-white' : 'text-slate-900'}`}>5/5</span>
                    </div>
                  </div>
                  <span className={`text-[7.5px] text-center leading-[1.1] mt-1.5 tracking-wide ${isNight ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>Members<br/>Connected</span>
                </div>

                {/* Item 2: Check-in Today */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    {/* Glowing Circular Icon Base */}
                    <div className="relative w-6 h-6 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/15 flex items-center justify-center shadow-inner">
                      <div className="absolute inset-0 bg-[#3b82f6]/5 rounded-full blur-sm"></div>
                      <div className="relative flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-[#3b82f6]" strokeWidth={1.5} />
                        <svg viewBox="0 0 24 24" className="w-1.8 h-1.8 text-[#3b82f6] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                    {/* Value with Underline */}
                    <div className={`border-b ${isNight ? 'border-slate-400/80' : 'border-slate-400'} pb-0.5 px-0.5 leading-none`}>
                      <span className={`text-[10px] font-bold tracking-wide ${isNight ? 'text-white' : 'text-slate-900'}`}>4/5</span>
                    </div>
                  </div>
                  <span className={`text-[7.5px] text-center leading-[1.1] mt-1.5 tracking-wide ${isNight ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>Check-in<br/>Today</span>
                </div>

                {/* Item 3: Ride Safe Used */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    {/* Glowing Circular Icon Base */}
                    <div className="relative w-6 h-6 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/15 flex items-center justify-center shadow-inner">
                      <div className="absolute inset-0 bg-[#0ea5e9]/5 rounded-full blur-sm"></div>
                      <Car className="w-3.5 h-3.5 text-[#0ea5e9]" strokeWidth={1.5} />
                    </div>
                    {/* Value with Underline */}
                    <div className={`border-b ${isNight ? 'border-slate-400/80' : 'border-slate-400'} pb-0.5 px-0.5 leading-none`}>
                      <span className={`text-[10px] font-bold tracking-wide ${isNight ? 'text-white' : 'text-slate-900'}`}>3/5</span>
                    </div>
                  </div>
                  <span className={`text-[7.5px] text-center leading-[1.1] mt-1.5 tracking-wide ${isNight ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>Ride Safe<br/>Used</span>
                </div>

                {/* Item 4: Guards Active */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    {/* Glowing Circular Icon Base */}
                    <div className="relative w-6 h-6 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/15 flex items-center justify-center shadow-inner">
                      <div className="absolute inset-0 bg-[#f59e0b]/5 rounded-full blur-sm"></div>
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#f59e0b] relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 5l2-2h10l2 2v16H5z"/>
                        <path d="M12 3v18"/>
                        <path d="M8 5v16"/>
                        <path d="M16 5v16"/>
                      </svg>
                    </div>
                    {/* Value with Underline */}
                    <div className={`border-b ${isNight ? 'border-slate-400/80' : 'border-slate-400'} pb-0.5 px-0.5 leading-none`}>
                      <span className={`text-[10px] font-bold tracking-wide ${isNight ? 'text-white' : 'text-slate-900'}`}>2/5</span>
                    </div>
                  </div>
                  <span className={`text-[7.5px] text-center leading-[1.1] mt-1.5 tracking-wide ${isNight ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>Guards<br/>Active</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Circle Members Card - with border and background */}
        <div
          className="rounded-2xl px-4 pb-4 pt-4 border relative transition-all duration-1000"
          style={{
            background: isNight ? 'linear-gradient(135deg, #161226 0%, #0D0A18 100%)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isNight ? 'rgba(120, 60, 220, 0.3)' : 'rgba(91, 55, 198, 0.3)',
            backdropFilter: 'blur(12px)',
            boxShadow: isNight ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(91,55,198,0.10)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-xs font-semibold ${isNight ? 'text-gray-200' : 'text-slate-800'}`}>Circle Members</h3>
            <span className="text-[10px] text-purple-500 font-semibold cursor-pointer">View All</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x justify-between px-1" style={{ paddingTop: '8px' }}>
            
            {/* Mom */}
            <div className="flex flex-col items-center gap-1.5 snap-start shrink-0">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop"
                  className="w-9.5 h-9.5 rounded-full object-cover"
                  style={{ boxShadow: `0 0 0 1.5px ${isNight ? '#0D0A18' : '#fff'}, 0 0 0 3px #00F57A` }}
                />
                <div className={`absolute -top-0.5 -right-0.5 rounded-full p-[1px] ${isNight ? 'bg-[#0A0710]' : 'bg-white'}`}>
                  <div className="bg-[#00F57A] rounded-full p-0.5 shadow-[0_0_4px_rgba(0,245,122,0.6)]">
                    <Shield className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[9px] font-semibold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Mom</p>
                <p className={`text-[7px] text-[#00C853] border border-[#00C853]/30 rounded px-0.5 py-0.2 mt-0.5 leading-none ${isNight ? 'bg-[#00F57A]/8' : 'bg-[#00C853]/10'}`}>Guardian</p>
                <p className={`text-[7.5px] mt-0.5 leading-none font-medium ${isNight ? 'text-[#00F57A]' : 'text-[#00A844]'}`}>Online</p>
              </div>
            </div>

            {/* Dad */}
            <div className="flex flex-col items-center gap-1.5 snap-start shrink-0">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop"
                  className="w-9.5 h-9.5 rounded-full object-cover"
                  style={{ boxShadow: `0 0 0 1.5px ${isNight ? '#0D0A18' : '#fff'}, 0 0 0 3px #00F57A` }}
                />
                <div className={`absolute -top-0.5 -right-0.5 rounded-full p-[1px] ${isNight ? 'bg-[#0A0710]' : 'bg-white'}`}>
                  <div className="bg-[#00F57A] rounded-full p-0.5 shadow-[0_0_4px_rgba(0,245,122,0.6)]">
                    <Shield className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[9px] font-semibold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Dad</p>
                <p className={`text-[7px] text-[#00C853] border border-[#00C853]/30 rounded px-0.5 py-0.2 mt-0.5 leading-none ${isNight ? 'bg-[#00F57A]/8' : 'bg-[#00C853]/10'}`}>Guardian</p>
                <p className={`text-[7.5px] mt-0.5 leading-none font-medium ${isNight ? 'text-[#00F57A]' : 'text-[#00A844]'}`}>Online</p>
              </div>
            </div>

            {/* Priya */}
            <div className="flex flex-col items-center gap-1.5 snap-start shrink-0">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop"
                  className="w-9.5 h-9.5 rounded-full object-cover"
                  style={{ boxShadow: `0 0 0 1.5px ${isNight ? '#0D0A18' : '#fff'}, 0 0 0 3px #D946EF` }}
                />
                <div className={`absolute -top-0.5 -right-0.5 rounded-full p-[1px] ${isNight ? 'bg-[#0A0710]' : 'bg-white'}`}>
                  <div className="bg-[#D946EF] rounded-full p-0.5 shadow-[0_0_4px_rgba(217,70,239,0.6)]">
                    <GraduationCap className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[9px] font-semibold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Priya</p>
                <p className={`text-[7px] text-[#D946EF] border border-[#D946EF]/30 rounded px-0.5 py-0.2 mt-0.5 leading-none ${isNight ? 'bg-[#D946EF]/8' : 'bg-[#D946EF]/10'}`}>Sister</p>
                <p className={`text-[7.5px] mt-0.5 leading-none ${isNight ? 'text-[#8E88A5]' : 'text-slate-500'}`}>5m ago</p>
              </div>
            </div>

            {/* Rahul */}
            <div className="flex flex-col items-center gap-1.5 snap-start shrink-0">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop"
                  className="w-9.5 h-9.5 rounded-full object-cover"
                  style={{ boxShadow: `0 0 0 1.5px ${isNight ? '#0D0A18' : '#fff'}, 0 0 0 3px #34C8FF` }}
                />
                <div className={`absolute -top-0.5 -right-0.5 rounded-full p-[1px] ${isNight ? 'bg-[#0A0710]' : 'bg-white'}`}>
                  <div className="bg-[#34C8FF] rounded-full p-0.5 shadow-[0_0_4px_rgba(52,200,255,0.6)]">
                    <Car className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[9px] font-semibold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Rahul</p>
                <p className={`text-[7px] text-[#0EA5E9] border border-[#0EA5E9]/30 rounded px-0.5 py-0.2 mt-0.5 leading-none ${isNight ? 'bg-[#34C8FF]/8' : 'bg-[#0EA5E9]/10'}`}>Brother</p>
                <p className={`text-[7.5px] mt-0.5 leading-none ${isNight ? 'text-[#8E88A5]' : 'text-slate-500'}`}>15m ago</p>
              </div>
            </div>

            {/* Ritika */}
            <div className="flex flex-col items-center gap-1.5 snap-start shrink-0">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop"
                  className="w-9.5 h-9.5 rounded-full object-cover"
                  style={{ boxShadow: `0 0 0 1.5px ${isNight ? '#0D0A18' : '#fff'}, 0 0 0 3px #FF8A00` }}
                />
                <div className={`absolute -top-0.5 -right-0.5 rounded-full p-[1px] ${isNight ? 'bg-[#0A0710]' : 'bg-white'}`}>
                  <div className="bg-[#FF8A00] rounded-full p-0.5 shadow-[0_0_4px_rgba(255,138,0,0.6)]">
                    <Dumbbell className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[9px] font-semibold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Ritika</p>
                <p className={`text-[7px] text-[#FF8A00] border border-[#FF8A00]/30 rounded px-0.5 py-0.2 mt-0.5 leading-none ${isNight ? 'bg-[#FF8A00]/8' : 'bg-[#FF8A00]/10'}`}>Friend</p>
                <p className={`text-[7.5px] mt-0.5 leading-none ${isNight ? 'text-[#8E88A5]' : 'text-slate-500'}`}>1h ago</p>
              </div>
            </div>

            {/* Add Member Button */}
            <div className="flex flex-col items-center justify-start gap-1.5 snap-start shrink-0 ml-1">
              <button 
                className="w-9.5 h-9.5 rounded-full border border-dashed flex items-center justify-center transition-colors"
                style={{
                  borderColor: isNight ? '#595173' : 'rgba(0, 0, 0, 0.25)',
                  backgroundColor: isNight ? '#181329' : 'rgba(255, 255, 255, 0.7)',
                  color: isNight ? '#ffffff' : '#1e1b4b'
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="text-center w-9.5">
                <p className={`text-[8px] leading-tight ${isNight ? 'text-[#8E88A5]' : 'text-slate-600'}`}>Add</p>
              </div>
            </div>

          </div>
        </div>

        {/* Everyone is safe Banner (❤️ Love / Connection -> Pink Accent border) */}
        <div 
          className="rounded-xl p-3 flex items-center justify-between border transition-all duration-1000"
          style={{
            background: isNight ? 'linear-gradient(90deg, #171026 0%, #0d0718 100%)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 79, 201, 0.35)',
            boxShadow: '0 4px 15px rgba(255, 79, 201, 0.08)'
          }}
        >
          <div className="flex items-center gap-3 text-left">
            {/* Glowing Big Heart ring */}
            <div className="relative w-12 h-12 rounded-full border border-[#A855F7]/30 bg-[#201735] flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.15)] shrink-0">
              {/* Outer thin ring glow */}
              <div className="absolute inset-[1.5px] rounded-full border border-[#FF4FC9]/20 bg-transparent"></div>
              <Heart className="w-5 h-5 text-[#FF72D8] fill-[#FF72D8] drop-shadow-[0_0_5px_rgba(255,114,216,0.5)] z-10" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className={`text-xs font-semibold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Everyone is safe</h3>
                <CheckCircle2 className="w-3 h-3 text-[#00F57A] fill-[#00F57A]/10" />
              </div>
              <p className={`text-[10px] mt-1 leading-tight ${isNight ? 'text-[#BEB7CF]' : 'text-slate-700'}`}>All your circle members are safe.</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-[10px] font-medium bg-gradient-to-r from-[#7A3EFF] to-[#FF4FC9] text-white pl-2.5 pr-2.5 py-1 rounded-full border border-white/10 hover:opacity-95 transition-opacity duration-200 border-none shrink-0">
            <Heart className="w-3.5 h-3.5 text-[#FF80DD] fill-[#FF80DD]" />
            <span className="tracking-wide">Send Love</span>
            <ChevronRight className="w-3 h-3 text-white ml-0.5" />
          </button>
        </div>

        {/* Circle Insights Card - parent card wrapper */}
        <div
          className="rounded-2xl p-4 border relative transition-all duration-1000"
          style={{
            background: isNight ? 'linear-gradient(135deg, #161226 0%, #0D0A18 100%)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isNight ? 'rgba(41, 151, 255, 0.25)' : 'rgba(41, 151, 255, 0.3)',
            backdropFilter: 'blur(12px)',
            boxShadow: isNight ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(41,151,255,0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-3 text-left">
            <h3 className={`text-xs font-semibold ${isNight ? 'text-gray-200' : 'text-slate-800'}`}>Circle Insights</h3>
            <span className={`text-[10px] font-medium flex items-center ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>This week <ChevronRight className="w-3 h-3 rotate-90 opacity-70 ml-0.5" /></span>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide snap-x">
            {/* Card 1 */}
            <div 
              className="p-2.5 rounded-xl border flex flex-col justify-between h-[68px] min-w-[110px] shrink-0 snap-start transition-all"
              style={{
                background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,245,122,0.06)',
                borderColor: isNight ? 'rgba(0,245,122,0.15)' : 'rgba(0,200,100,0.2)'
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="bg-[#00F57A]/15 p-1 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-[#00C853]" />
                </div>
                <div>
                  <span className={`text-sm font-bold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>12</span>
                  <p className={`text-[9px] mt-0.5 ${isNight ? 'text-[#C8BEDF]' : 'text-slate-600'}`}>Check-ins</p>
                </div>
              </div>
              <p className={`text-[8.5px] leading-none ${isNight ? 'text-[#8E88A5]' : 'text-slate-500'}`}><span className="text-[#00C853] font-semibold">▲ 20%</span> vs last</p>
            </div>

            {/* Card 2 */}
            <div 
              className="p-2.5 rounded-xl border flex flex-col justify-between h-[68px] min-w-[110px] shrink-0 snap-start transition-all"
              style={{
                background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(41,151,255,0.06)',
                borderColor: isNight ? 'rgba(41,151,255,0.15)' : 'rgba(41,151,255,0.2)'
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="bg-[#2997FF]/15 p-1 rounded-lg">
                  <Car className="w-3.5 h-3.5 text-[#2997FF]" />
                </div>
                <div>
                  <span className={`text-sm font-bold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>8</span>
                  <p className={`text-[9px] mt-0.5 ${isNight ? 'text-[#C8BEDF]' : 'text-slate-600'}`}>Ride Safe</p>
                </div>
              </div>
              <p className={`text-[8.5px] leading-none ${isNight ? 'text-[#8E88A5]' : 'text-slate-500'}`}><span className="text-[#00C853] font-semibold">▲ 12%</span> vs last</p>
            </div>

            {/* Card 3 */}
            <div 
              className="p-2.5 rounded-xl border flex flex-col justify-between h-[68px] min-w-[110px] shrink-0 snap-start transition-all"
              style={{
                background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(168,85,247,0.06)',
                borderColor: isNight ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.2)'
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="bg-[#A855F7]/15 p-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-[#A855F7]" />
                </div>
                <div>
                  <span className={`text-sm font-bold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>15</span>
                  <p className={`text-[9px] mt-0.5 ${isNight ? 'text-[#C8BEDF]' : 'text-slate-600'}`}>Live Locations</p>
                </div>
              </div>
              <p className={`text-[8.5px] leading-none ${isNight ? 'text-[#8E88A5]' : 'text-slate-500'}`}><span className="text-[#00C853] font-semibold">▲ 18%</span> vs last</p>
            </div>
          </div>
        </div>

        {/* Activity Feed and Goals (2 Column Layout) - Compact */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-2">

          {/* Circle Activity Feed Card */}
          <div
            className="rounded-xl p-2.5 border flex flex-col transition-all duration-1000"
            style={{
              background: isNight ? '#120E1E' : 'rgba(255,255,255,0.9)',
              borderColor: isNight ? 'rgba(42,35,60,0.6)' : 'rgba(168,85,247,0.25)',
              boxShadow: isNight ? 'none' : '0 2px 10px rgba(168,85,247,0.07)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-[10px] font-semibold flex items-center gap-1 ${isNight ? 'text-gray-200' : 'text-slate-800'}`}>
                Activity Feed
                <span className="w-1 h-1 bg-[#22c55e] rounded-full shadow-[0_0_4px_rgba(34,197,94,0.6)]"></span>
                <span className="text-[8px] text-[#22c55e] font-normal">Live</span>
              </h3>
              <span className={`text-[8px] flex items-center cursor-pointer ${isNight ? 'text-[#d946ef]' : 'text-purple-500'}`}>
                View All <ChevronRight className="w-2 h-2 ml-0.5" />
              </span>
            </div>

            <div className="space-y-1 flex-1 flex flex-col justify-between">
              {/* Item 1 */}
              <div className="flex items-center gap-1.5">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="Mom" className={`w-6 h-6 rounded-full object-cover shrink-0 border ${isNight ? 'border-gray-600/50' : 'border-purple-200'}`} />
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <p className={`text-[9px] leading-tight flex-1 min-w-0 truncate ${isNight ? 'text-gray-300' : 'text-slate-600'}`}>
                    <span className={`font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>Mom</span> check-in <Sun className="w-2.5 h-2.5 inline text-yellow-500" />
                  </p>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>2m</span>
                    <span className="w-1 h-1 bg-[#22c55e] rounded-full"></span>
                  </div>
                </div>
              </div>
              <div className={`border-b ${isNight ? 'border-[#2A233C]/40' : 'border-slate-100'}`}></div>

              {/* Item 2 */}
              <div className="flex items-center gap-1.5">
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" alt="Rahul" className={`w-6 h-6 rounded-full object-cover shrink-0 border ${isNight ? 'border-gray-600/50' : 'border-blue-200'}`} />
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <p className={`text-[9px] leading-tight flex-1 min-w-0 truncate ${isNight ? 'text-gray-300' : 'text-slate-600'}`}>
                    <span className={`font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>Rahul</span> Ride Safe <Car className="w-2.5 h-2.5 inline text-blue-500" />
                  </p>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>12m</span>
                    <span className="w-1 h-1 bg-[#3b82f6] rounded-full"></span>
                  </div>
                </div>
              </div>
              <div className={`border-b ${isNight ? 'border-[#2A233C]/40' : 'border-slate-100'}`}></div>

              {/* Item 3 */}
              <div className="flex items-center gap-1.5">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="Priya" className={`w-6 h-6 rounded-full object-cover shrink-0 border ${isNight ? 'border-gray-600/50' : 'border-amber-200'}`} />
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <p className={`text-[9px] leading-tight flex-1 min-w-0 truncate ${isNight ? 'text-gray-300' : 'text-slate-600'}`}>
                    <span className={`font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>Priya</span> at College <Building2 className="w-2.5 h-2.5 inline text-amber-600" />
                  </p>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>32m</span>
                    <span className="w-1 h-1 bg-[#a855f7] rounded-full"></span>
                  </div>
                </div>
              </div>
              <div className={`border-b ${isNight ? 'border-[#2A233C]/40' : 'border-slate-100'}`}></div>

              {/* Item 4 */}
              <div className="flex items-center gap-1.5">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" alt="Ritika" className={`w-6 h-6 rounded-full object-cover shrink-0 border ${isNight ? 'border-gray-600/50' : 'border-red-200'}`} />
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <p className={`text-[9px] leading-tight flex-1 min-w-0 truncate ${isNight ? 'text-gray-300' : 'text-slate-600'}`}>
                    <span className={`font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>Ritika</span> location <MapPin className="w-2.5 h-2.5 inline text-red-500" />
                  </p>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>45m</span>
                    <span className="w-1 h-1 bg-[#eab308] rounded-full"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Circle Goals Card */}
          <div
            className="rounded-xl p-2.5 border relative overflow-hidden flex flex-col transition-all duration-1000"
            style={{
              background: isNight ? '#120E1E' : 'rgba(255,255,255,0.9)',
              borderColor: isNight ? 'rgba(42,35,60,0.6)' : 'rgba(255,122,0,0.2)',
              boxShadow: isNight ? 'none' : '0 2px 10px rgba(255,122,0,0.06)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-500/10 to-orange-500/5 blur-xl rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-start mb-0.5 relative z-10">
              <div>
                <h3 className={`text-[10px] font-semibold ${isNight ? 'text-gray-200' : 'text-slate-800'}`}>Circle Goals</h3>
                <p className={`text-[8px] leading-snug mt-2 ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                  Complete all<br/>goals together!
                </p>
              </div>

              {/* Goal Ring - compact */}
              <div className="relative w-[52px] h-[52px] flex items-center justify-center shrink-0 mt-1">
                <div className="absolute -top-3 -inset-x-3 h-8 pointer-events-none z-0">
                  <svg viewBox="0 0 100 60" className="w-full h-full opacity-80">
                    <path d="M25 45 Q22 35 27 33" stroke="#f43f5e" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    <rect x="30" y="22" width="5" height="5" transform="rotate(30 30 22)" fill="#f43f5e" />
                    <circle cx="18" cy="30" r="2.5" fill="#fb923c" />
                    <path d="M75 42 Q78 35 82 38" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    <rect x="72" y="25" width="5" height="5" transform="rotate(15 72 25)" fill="#fbbf24" />
                    <path d="M85 20 L90 26 L82 27 Z" fill="#f43f5e" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#db2777]/20 to-[#f97316]/20 rounded-full blur-[5px] z-0"></div>
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 relative z-10">
                  <defs>
                    <linearGradient id="goalGradNew" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#db2777" />
                      <stop offset="50%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="42" fill="none" stroke={isNight ? '#241E38' : '#F1E8FF'} strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#goalGradNew)" strokeWidth="8" strokeDasharray="263.89" strokeDashoffset="105.55" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className={`text-[14px] font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>3/5</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 relative z-10 text-left mt-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-[12px] h-[12px] text-[#22c55e] fill-[#22c55e]/20 shrink-0" />
                <span className={`text-[8.5px] ${isNight ? 'text-gray-300' : 'text-slate-700'}`}>Everyone checks-in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-[12px] h-[12px] text-[#22c55e] fill-[#22c55e]/20 shrink-0" />
                <span className={`text-[8.5px] ${isNight ? 'text-gray-300' : 'text-slate-700'}`}>Use Ride Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-[12px] h-[12px] text-[#22c55e] fill-[#22c55e]/20 shrink-0" />
                <span className={`text-[8.5px] ${isNight ? 'text-gray-300' : 'text-slate-700'}`}>Share live location</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Circle className={`w-[12px] h-[12px] shrink-0 ${isNight ? 'text-[#3f3950]' : 'text-slate-300'}`} strokeWidth={1.5} />
                <span className={`text-[8.5px] ${isNight ? 'text-gray-500' : 'text-slate-400'}`}>Add a new member</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Circle className={`w-[12px] h-[12px] shrink-0 ${isNight ? 'text-[#3f3950]' : 'text-slate-300'}`} strokeWidth={1.5} />
                <span className={`text-[8.5px] ${isNight ? 'text-gray-500' : 'text-slate-400'}`}>Active guard</span>
              </div>
            </div>
          </div>
        </div>



        {/* Strengthen Your Circle Banner (Invite Banner -> Pink/Orange Gradient) */}
        <div className="mt-1 bg-gradient-to-r from-[#37105F] via-[#5F18A0] to-[#FF3D99] rounded-xl p-2.5 flex items-center border border-[#9C63FF] relative shadow-[0_4px_15px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="flex items-center w-full relative z-10 gap-2">
            {/* Glowing Shield Icon Group */}
            <div className="relative w-9 h-9 shrink-0 flex items-center justify-center ml-0.5">
               <div className="absolute inset-0 bg-[#FF7AD9]/25 blur-[6px] rounded-full"></div>
               <div className="relative flex items-center justify-center">
                 <Shield className="w-8 h-8 text-[#FF7AD9] drop-shadow-[0_0_5px_rgba(255,122,217,0.4)]" strokeWidth={1.2} />
                 <Users className="w-3.5 h-3.5 text-[#FF7AD9] absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={2.5} />
               </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 text-left pt-0.5">
              <h3 className="text-[10px] font-bold text-white tracking-wide">Strengthen Your Circle</h3>
              <p className="text-[8px] text-white/80 mt-0.5 leading-none font-medium">
                Add trusted people and build network.
              </p>
            </div>

            {/* Avatars and Button Group */}
            <div className="flex items-center gap-2 shrink-0 mr-0.5">
              
              {/* Overlapping Avatars */}
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop" className="w-6 h-6 rounded-full border border-white object-cover relative z-30" alt="user 1" />
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop" className="w-6 h-6 rounded-full border border-white object-cover relative z-20" alt="user 2" />
                <div className="w-6 h-6 rounded-full border border-white bg-[#161025] flex items-center justify-center text-[8px] font-semibold text-gray-300 relative z-10">+2</div>
              </div>
              
              {/* Invite Now Button */}
              <button className="bg-gradient-to-r from-[#FF4B8A] to-[#FF7A00] px-4 py-2 rounded-full text-[11px] font-bold text-white flex items-center justify-center gap-1 shadow-[0_2px_8px_rgba(255,75,138,0.3)] hover:shadow-[0_2px_14px_rgba(255,75,138,0.5)] transition-shadow border-none whitespace-nowrap">
                Invite <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>

            </div>
          </div>
        </div>

        {/* Emergency Bottom Row */}
        <div className="grid grid-cols-4 gap-1.5 mt-4">
          <div 
            className="flex items-center rounded-full px-2 py-1.5 border gap-1 justify-center transition-all"
            style={{
              backgroundColor: isNight ? '#090913' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isNight ? '#2D2347' : 'rgba(0, 0, 0, 0.12)'
            }}
          >
            <div className="bg-[#FF3131] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-white">SOS</span>
            </div>
            <span className={`text-[8.5px] font-medium whitespace-nowrap ${isNight ? 'text-gray-300' : 'text-slate-800'}`}>SOS</span>
          </div>

          <div 
            className="flex items-center rounded-full px-2 py-1.5 border gap-1 justify-center transition-all"
            style={{
              backgroundColor: isNight ? '#090913' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isNight ? '#2D2347' : 'rgba(0, 0, 0, 0.12)'
            }}
          >
            <div className="bg-[#E53935]/15 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-2.5 h-2.5 text-[#E53935]" />
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-bold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>112</span>
              <span className={`text-[7px] leading-none ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>Police</span>
            </div>
          </div>

          <div 
            className="flex items-center rounded-full px-2 py-1.5 border gap-1 justify-center transition-all"
            style={{
              backgroundColor: isNight ? '#090913' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isNight ? '#2D2347' : 'rgba(0, 0, 0, 0.12)'
            }}
          >
            <div className="bg-[#A855F7]/15 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-2.5 h-2.5 text-[#A855F7]" />
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-bold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>1091</span>
              <span className={`text-[7px] leading-none ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>Women</span>
            </div>
          </div>

          <div 
            className="flex items-center rounded-full px-2 py-1.5 border gap-1 justify-center transition-all"
            style={{
              backgroundColor: isNight ? '#090913' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isNight ? '#2D2347' : 'rgba(0, 0, 0, 0.12)'
            }}
          >
            <div className="bg-[#B54CFF]/15 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-2.5 h-2.5 text-[#B54CFF]" />
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-bold leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>Fake</span>
              <span className={`text-[7.5px] leading-none ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>Call</span>
            </div>
          </div>
        </div>
 
       </main>
 
     </div>
   );
 }