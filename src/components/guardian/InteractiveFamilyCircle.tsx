import React from 'react';
import { Sun, Users, ShieldCheck, ChevronRight, Plus, MapPin, Shield, Bell, MessageSquare, Check } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';
import { auth } from '../../firebase';
import { useTimeTheme } from '../../hooks/useTimeTheme';

interface InteractiveFamilyCircleProps {
  onViewAll?: () => void;
  isNight?: boolean;
}

export default function InteractiveFamilyCircle({ onViewAll, isNight = true }: InteractiveFamilyCircleProps) {
  const { profile, guardianCache } = useKavachStore();
  const { themeFolder } = useTimeTheme();

  const userName = profile?.name || profile?.displayName || auth.currentUser?.displayName || 'Sachin';

  // Extract up to 4 family members
  const activeCircle = (guardianCache || []).filter((g: any) => {
    if (!g || g.isMock || g.status === 'pending' || g.isPending === true || g.accepted === false) return false;
    if (g.status === 'accepted' || g.accepted === true || g.isVerified === true || g.uid) return true;
    return false;
  });

  const totalMembers = activeCircle.length || 4; // Mock 4 if empty for design display

  return (
    <div className={`relative w-full h-full flex flex-col rounded-[16px] overflow-hidden shadow-sm ${isNight ? 'bg-[#0a0514]' : 'bg-[#FDECE2]'}`}>

      {/* Background Image Layer */}
      <div
        className={`absolute inset-0 z-0 overflow-hidden ${isNight ? 'bg-[#0a0514]' : 'bg-[#FFF9F2]'}`}
      >
        <div className="absolute inset-0">
          <img
            src={isNight ? "/assets/dashboard_assets/night/family.png" : `/assets/dashboard_assets/${themeFolder}/family.png`}
            alt="Family"
            className={`absolute left-1/2 -translate-x-1/2 -top-16 w-[130%] h-auto opacity-100 [image-rendering:-webkit-optimize-contrast] contrast-[1.25] saturate-[1.2] brightness-[0.95]`}
            style={{
              WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)',
              maskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)'
            }}
          />
        </div>
        {/* Subtle Gradient overlay for readability */}
        <div className={`absolute inset-0 bg-gradient-to-b ${isNight ? 'from-[#0a0514]/70 via-[#0a0514]/0 to-[#0a0514]/90' : 'from-white/15 via-transparent to-transparent'}`} />
      </div>


      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col p-1.5 h-full justify-between">

        {/* TOP SECTION: Greeting & Titles */}
        <div className={`flex flex-col gap-1.5 mt-0 px-2 pt-2`}>
          
          {/* Live Safe Circle Badge */}
          <div className={`self-start inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full ${isNight ? 'bg-white/10' : 'bg-white/80 shadow-sm'} backdrop-blur-md`}>
            <div className="w-[3px] h-[3px] rounded-full bg-[#ea580c]" />
            <span className={`text-[5px] font-extrabold tracking-wide ${isNight ? 'text-orange-400' : 'text-[#ea580c]'}`}>
              Live Safe Circle
            </span>
          </div>

          <h2 className={`text-[15px] font-black leading-tight tracking-tight mt-1 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.15)] ${isNight ? 'text-white' : 'text-[#14234b]'}`}>
            Your Family,<br />
            <span className={isNight ? 'text-[#a855f7]' : 'bg-gradient-to-r from-[#e81cff] to-[#ff6b00] bg-clip-text text-transparent drop-shadow-none'}>
              Protected
            </span>
          </h2>

          <p className={`text-[6.5px] font-bold leading-tight max-w-[130px] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.15)] ${isNight ? 'text-gray-200' : 'text-[#14234b]/70'}`}>
            Together we stay safe.
          </p>
        </div>

        {/* BOTTOM SECTION: Cards and Actions */}
        <div className="flex flex-col gap-2 mt-auto">

          {/* Frosted Glass Family Card */}
          <div
            className={`relative rounded-[16px] p-1.5 flex flex-col gap-1.5 overflow-hidden ${isNight
              ? "bg-white/5 border border-white/10 backdrop-blur-xl shadow-sm"
              : "bg-white/35 border border-white/45 backdrop-blur-2xl shadow-[0_20px_60px_rgba(255,180,120,0.15)]"
              }`}
          >
            {/* Warm Cream Overlay */}
            {!isNight && (
              <div className="absolute inset-0 rounded-[16px] bg-[#FFD7B2]/5 pointer-events-none" />
            )}

            {/* Top White Highlight */}
            <div
              className={`absolute inset-0 rounded-[16px] pointer-events-none ${isNight
                ? "bg-gradient-to-b from-white/10 via-white/5 to-transparent"
                : "bg-gradient-to-b from-white/5 via-white/0 to-transparent"
                }`}
            />

            {/* ================= Row 1 ================= */}

            <div
              className="relative z-10 flex items-center justify-between cursor-pointer"
              onClick={onViewAll}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center flex-shrink-0 ${isNight
                    ? "bg-white/10 shadow-sm"
                    : "bg-[#FFF8F2] border border-white/60 shadow-[0_4px_10px_rgba(255,190,140,0.14)]"
                    }`}
                >
                  <Users
                    className={isNight ? "text-purple-400" : "text-[#8B5CF6]"}
                    size={10}
                    fill="currentColor"
                    strokeWidth={1}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={`text-[9px] font-[700] leading-tight truncate whitespace-nowrap ${isNight ? "text-white" : "text-[#2B2B2B]"
                      }`}
                  >
                    Family Together
                  </span>

                  <span
                    className={`text-[7px] font-[600] truncate whitespace-nowrap ${isNight ? "text-gray-400" : "text-[#333333]"
                      }`}
                  >
                    {totalMembers} Members
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`relative rounded-full`}>
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-[1.5px] transition-transform hover:scale-105 z-10 relative ${isNight
                          ? "bg-white border-[#1a0f2e]"
                          : "bg-white border-[#FFF8F1] shadow-[0_4px_12px_rgba(255,180,120,0.25)]"
                          }`}
                      />
                    </div>
                  ))}
                </div>

                <ChevronRight
                  className={isNight ? "text-gray-400" : "text-[#707070]"}
                  size={8}
                  strokeWidth={2.5}
                />
              </div>
            </div>

            {/* Divider */}

            <div
              className={`relative z-10 h-px rounded-full ${isNight ? "bg-white/10" : "bg-white/35"
                }`}
            />

            {/* ================= Row 2 ================= */}

            <div className="relative z-10 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center flex-shrink-0 ${isNight
                    ? "bg-white/10 shadow-sm"
                    : "bg-[#FFF8F2] border border-white/60 shadow-[0_4px_10px_rgba(255,190,140,0.14)]"
                    }`}
                >
                  <ShieldCheck
                    className={isNight ? "text-emerald-400" : "text-[#16C784]"}
                    size={10}
                    fill="currentColor"
                    strokeWidth={1}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={`text-[9px] font-[700] leading-tight truncate whitespace-nowrap ${isNight ? "text-white" : "text-[#2B2B2B]"
                      }`}
                  >
                    All Members Safe
                  </span>

                  <span
                    className={`text-[7px] font-[600] truncate whitespace-nowrap ${isNight ? "text-gray-400" : "text-[#404040]"
                      }`}
                  >
                    Everyone is doing great
                  </span>
                </div>
              </div>

              <div
                className={`w-[12px] h-[12px] rounded-full flex items-center justify-center flex-shrink-0 ${isNight
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-[#FCFFF9] border border-[#DDF7E8] shadow-[0_3px_8px_rgba(0,180,100,0.10)]"
                  }`}
              >
                <Check
                  className={isNight ? "text-emerald-400" : "text-[#16C784]"}
                  size={5}
                  strokeWidth={4}
                />
              </div>
            </div>
          </div>



          <div className="mt-auto flex flex-col gap-1">
            {/* Add Member Button */}
            <button className={`relative overflow-hidden w-full py-[8px] rounded-[14px] flex items-center justify-center gap-2 text-white active:scale-[0.97] transition-all duration-200 ${isNight ? 'bg-gradient-to-r from-[#f97316] via-[#d946ef] to-[#8b5cf6] border-none shadow-[0_8px_24px_rgba(217,70,239,0.25)]' : 'bg-gradient-to-r from-[#FF9333] via-[#FF6B5F] to-[#FF2F88] border-none shadow-[0_8px_24px_rgba(255,125,95,0.32)]'}`}>
              <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none" />
              <Plus size={12} strokeWidth={2.5} className="relative z-10" />
              <span className="relative z-10 text-[10px] font-bold tracking-wide">Add Family Member</span>
            </button>

            {/* Bottom Actions Row - Premium (Small) */}
            <div className="flex flex-row justify-between w-full gap-1 mt-0.5">
              {[
                { title: "Live\nLocation", subtitle: "Tracking", icon: MapPin, color: "from-violet-500 to-fuchsia-500", glow: "shadow-violet-500/30" },
                { title: "Protection\nScore", subtitle: "Secure", icon: Shield, color: "from-cyan-500 to-sky-500", glow: "shadow-cyan-500/30" },
                { title: "Alerts", subtitle: "Realtime", icon: Bell, color: "from-rose-500 to-orange-500", glow: "shadow-rose-500/30" },
                { title: "Messages", subtitle: "Connected", icon: MessageSquare, color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/30" }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    className={`group relative overflow-hidden rounded-[8px] border flex flex-col items-center flex-1 transition-all duration-300 hover:-translate-y-[1px] active:scale-[0.97] ${isNight ? 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.07] py-1 px-0.5' : 'bg-white border-white/40 shadow-sm py-1 px-0.5'}`}
                  >
                    {/* Glow */}
                    {isNight && (
                      <div className={`absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r ${item.color} opacity-20 blur-xl group-hover:opacity-40 transition`} />
                    )}

                    {/* Gradient Ring */}
                    <div className={`mx-auto flex h-[15px] w-[15px] items-center justify-center rounded-full bg-gradient-to-br ${item.color} p-[1px] shadow-sm ${item.glow}`}>
                      <div className={`flex h-full w-full items-center justify-center rounded-full ${isNight ? 'bg-[#0f1120]/90' : 'bg-white'}`}>
                        <Icon size={7} strokeWidth={2.5} className={isNight ? 'text-white' : 'text-slate-700'} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`mt-0.5 whitespace-pre-line text-center text-[5px] font-bold leading-[1.1] tracking-wide ${isNight ? 'text-white' : 'text-slate-800'}`}>
                      {item.title}
                    </h3>

                    {/* Subtitle */}
                    <p className={`mt-0 text-[4px] font-semibold ${isNight ? 'text-white/45' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </p>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
