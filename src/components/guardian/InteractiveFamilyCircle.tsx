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
        <div 
          className="absolute inset-0"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 28%, black 50%, black 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 28%, black 50%, black 100%)'
          }}
        >
          <img
            src={isNight ? "/assets/dashboard_assets/family.png" : `/assets/dashboard_assets/${themeFolder}/family.png`}
            alt="Family"
            className={`absolute left-1/2 -translate-x-1/2 -top-13 w-[130%] h-auto ${isNight ? 'opacity-80' : 'opacity-90'}`}
            style={{
              WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)',
              maskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)'
            }}
          />
        </div>
        {/* Subtle Gradient overlay for readability */}
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isNight ? 'to-[#0a0514]/80' : 'to-transparent'}`} />
      </div>


      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col p-1.5 h-full justify-between">

        {/* TOP SECTION: Greeting & Titles */}
        <div className="flex flex-col gap-1.5 mt-0 px-2 pt-2">

          <h2 className={`text-[19px] font-black leading-tight tracking-tight mt-1 ${isNight ? 'text-white' : 'text-[#14234b]'}`}>
            Family,<br />
            <span className={`bg-gradient-to-r ${isNight ? 'from-[#b475ff] to-[#ff4081]' : 'from-[#e81cff] to-[#ff6b00]'} bg-clip-text text-transparent`}>
              Together
            </span>
          </h2>

          <p className={`text-[7.5px] font-bold leading-tight max-w-[130px] ${isNight ? 'text-gray-300' : 'text-[#14234b]/70'}`}>
            Everyone is protected today ❤️
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
                  className={`w-[14px] h-[14px] rounded-[4px] flex items-center justify-center flex-shrink-0 ${isNight
                    ? "bg-white/10 shadow-sm"
                    : "bg-[#FFF8F2] border border-white/60 shadow-[0_4px_10px_rgba(255,190,140,0.14)]"
                    }`}
                >
                  <Users
                    className={isNight ? "text-purple-400" : "text-[#8B5CF6]"}
                    size={7}
                    fill="currentColor"
                    strokeWidth={1}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={`text-[6px] font-[700] leading-tight truncate whitespace-nowrap ${isNight ? "text-white" : "text-[#2B2B2B]"
                      }`}
                  >
                    Family Together
                  </span>

                  <span
                    className={`text-[4px] font-[600] truncate whitespace-nowrap ${isNight ? "text-gray-400" : "text-[#333333]"
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
                      <img
                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                        alt=""
                        className={`w-[18px] h-[18px] rounded-full border-[1.5px] object-cover transition-transform hover:scale-105 z-10 relative ${isNight
                          ? "border-[#1a0f2e]"
                          : "border-[#FFF8F1] shadow-[0_4px_12px_rgba(255,180,120,0.25)]"
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
                  className={`w-[14px] h-[14px] rounded-[4px] flex items-center justify-center flex-shrink-0 ${isNight
                    ? "bg-white/10 shadow-sm"
                    : "bg-[#FFF8F2] border border-white/60 shadow-[0_4px_10px_rgba(255,190,140,0.14)]"
                    }`}
                >
                  <ShieldCheck
                    className={isNight ? "text-emerald-400" : "text-[#16C784]"}
                    size={7}
                    fill="currentColor"
                    strokeWidth={1}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={`text-[6px] font-[700] leading-tight truncate whitespace-nowrap ${isNight ? "text-white" : "text-[#2B2B2B]"
                      }`}
                  >
                    All Members Safe
                  </span>

                  <span
                    className={`text-[4px] font-[600] truncate whitespace-nowrap ${isNight ? "text-gray-400" : "text-[#404040]"
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
            <button className="relative overflow-hidden w-full py-[5px] rounded-[12px] bg-gradient-to-r from-[#FF9333] via-[#FF6B5F] to-[#FF2F88] border border-white/20 shadow-[0_8px_24px_rgba(255,125,95,0.32)] flex items-center justify-center gap-1.5 text-white active:scale-[0.97] transition-all duration-200">
              <div className="absolute inset-0 rounded-[12px] bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none" />
              <Plus size={9} strokeWidth={2.5} className="relative z-10" />
              <span className="relative z-10 text-[8px] font-bold">Add Family Member</span>
            </button>

            {/* Bottom Actions Row - Exact Match */}
            <div className="flex flex-row justify-between w-full gap-1">
              {[
                { icon: MapPin, label: 'Live\nLocation', color: isNight ? 'text-purple-400' : 'text-[#8B5CF6]' },
                { icon: Shield, label: 'Protection\nScore', color: isNight ? 'text-blue-400' : 'text-[#3B82F6]' },
                { icon: Bell, label: 'Alerts', color: isNight ? 'text-red-400' : 'text-[#FF6A4D]' },
                { icon: MessageSquare, label: 'Messages', color: isNight ? 'text-emerald-400' : 'text-[#22C55E]' }
              ].map((action, i) => (
                <div key={i} className={`relative overflow-hidden flex flex-1 flex-col items-center justify-center gap-1 py-1 px-0 rounded-[10px] cursor-pointer transition-all duration-200 active:scale-[0.97] ${isNight ? 'bg-white/5 border border-white/5' : 'bg-[rgba(255,248,242,0.12)] backdrop-blur-[16px] shadow-[0_8px_25px_rgba(255,190,120,0.15)]'}`}>
                  {!isNight && <div className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/18 via-transparent to-transparent pointer-events-none" />}

                  <div className={`relative z-10 w-[14px] h-[14px] rounded-full flex items-center justify-center border shadow-[0_4px_12px_rgba(255,190,140,0.15)] ${isNight ? 'bg-white/10 border-white/10' : 'bg-[#FFF9F5] border-white/50'}`}>
                    <action.icon className={action.color} size={7} fill="currentColor" strokeWidth={1} />
                  </div>
                  <span className={`relative z-10 text-[5px] tracking-tight font-[700] text-center w-full px-0 whitespace-pre-line leading-[1.1] ${isNight ? 'text-gray-300' : 'text-[#2F2F2F]'}`}>
                    {action.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
