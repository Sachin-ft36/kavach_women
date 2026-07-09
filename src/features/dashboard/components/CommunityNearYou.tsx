import React from 'react';
import { HelpCircle, ChevronRight, MapPin, Building, ShieldCheck, Heart, Info, Shield, User, Plus, Users, Star } from 'lucide-react';
import { useTimeTheme } from '../../../hooks/useTimeTheme';

interface CommunityNearYouProps {
  isNight: boolean;
  verifiedProtectorCount: number;
  setIsNearbyHubOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOverlay: (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => void;
}

export const CommunityNearYou = ({
  isNight,
  verifiedProtectorCount,
  setIsNearbyHubOpen,
  toggleOverlay
}: CommunityNearYouProps) => {
  const [selectedArea, setSelectedArea] = React.useState<number | null>(null);
  const { themeFolder } = useTimeTheme();

  return (
    <div className={`w-full flex flex-col p-5 rounded-[24px] relative overflow-hidden border ${isNight ? 'bg-[#151923] border-white/10' : 'bg-[#FFF8F1] shadow-[0_14px_45px_rgba(255,170,120,0.12)] border-white/45'}`}>
      {/* Full Container Background Image */}
      <img
        src={isNight ? "/assets/dashboard_assets/night/livefeed.jpeg" : `/assets/dashboard_assets/${themeFolder}/livefeed.png`}
        alt="Community Background"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 ${isNight ? 'opacity-[0.85]' : 'opacity-[0.35]'}`}
      />
      {/* Gradient Overlay for Text Clarity */}
      <div className={`absolute inset-0 pointer-events-none z-0 ${isNight ? 'bg-gradient-to-br from-[#151923]/90 via-[#151923]/70 to-[#151923]/30' : 'bg-gradient-to-br from-white/90 via-white/60 to-transparent'}`} />

      <div className="relative z-10 w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isNight ? 'bg-[#7c4dff]/20 shadow-[0_0_15px_rgba(124,77,255,0.3)]' : 'bg-[#ffe8d6]'}`}>
              {isNight ? <Shield size={16} className="text-[#c084fc]" /> : <MapPin size={16} className="text-orange-500" />}
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-extrabold tracking-tight ${isNight ? 'text-white' : 'text-[#1a202c]'}`}>
                COMMUNITY {isNight ? <span className="bg-gradient-to-r from-[#d8b4fe] to-[#c084fc] bg-clip-text text-transparent">NEAR YOU</span> : 'NEAR YOU'}
              </span>
              <span className={`text-[9px] font-medium ${isNight ? 'text-white/60' : 'text-[#718096]'}`}>Your safety, our responsibility ✨</span>
            </div>
          </div>
          <div
            className={`flex items-center cursor-pointer px-2.5 py-1 rounded-[10px] border transition-colors ${
              isNight
                ? 'bg-[#1a113a]/80 border-[#3b2b73] text-[#c4b5fd] hover:bg-[#23154f]'
                : themeFolder === 'afternoon'
                ? 'bg-gradient-to-r from-[#FF9333] to-[#FF6B5F] text-white border-transparent'
                : 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white border-transparent'
            }`}
            onClick={() => toggleOverlay(setIsNearbyHubOpen, true)}
          >
            <span className={`text-[10px] font-bold mr-0.5 ${isNight ? '' : 'text-white'}`}>View All</span>
            <ChevronRight size={12} strokeWidth={3} className={isNight ? 'text-[#c4b5fd]' : 'text-white'} />
          </div>
        </div>

        {/* Cards */}
        <div className="flex gap-[10px] overflow-x-auto scrollbar-hide pb-2">
          {[
            {
              title: 'Nearby Protector',
              subtitle: 'Verified community members ready to help',
              count: verifiedProtectorCount || '12',
              unit: 'Active',
              subtext: '• Within 2 km',
              icon: <User size={10} className="text-white" />,
              iconBg: 'bg-gradient-to-b from-[#b388ff] to-[#7c4dff]',
              iconShadow: 'shadow-[0_0_10px_rgba(124,77,255,0.4)]',
              image: isNight ? '/assets/nightcommunity/nearprotector.png' : '/assets/community/nearprotector.png',
              score: '96%',
              scoreColor: 'text-[#7c4dff]',
              scoreBg: 'bg-[#7c4dff]',
              cardBorderNight: 'border-[#7c4dff]/15',
              cardGlowNight: 'from-[#7c4dff]/30',
              scoreIcon: <Shield size={5} className="text-white" />
            },
            {
              title: 'Police Booth',
              subtitle: 'Nearest police assistance points',
              count: '1.2',
              unit: 'km',
              subtext: '• 2 Booths Nearby',
              icon: <Shield size={10} className="text-white" />,
              iconBg: 'bg-gradient-to-b from-[#64b5f6] to-[#2196f3]',
              iconShadow: 'shadow-[0_0_10px_rgba(33,150,243,0.4)]',
              image: isNight ? '/assets/nightcommunity/police.png' : '/assets/community/police.png',
              score: '94%',
              scoreColor: 'text-[#2196f3]',
              scoreBg: 'bg-[#2196f3]',
              cardBorderNight: 'border-[#2196f3]/15',
              cardGlowNight: 'from-[#2196f3]/30',
              scoreIcon: <Star size={5} className="text-white" />
            },
            {
              title: 'Hospital',
              subtitle: 'Nearby hospitals for emergency care',
              count: '1.8',
              unit: 'km',
              subtext: '• 1 Hospital Nearby',
              icon: <Plus size={10} className="text-white" />,
              iconBg: 'bg-gradient-to-b from-[#ff8a80] to-[#ff1744]',
              iconShadow: 'shadow-[0_0_10px_rgba(255,23,68,0.4)]',
              image: isNight ? '/assets/nightcommunity/hospital.png' : '/assets/community/hospital.png',
              score: '92%',
              scoreColor: 'text-[#ff1744]',
              scoreBg: 'bg-[#ff1744]',
              cardBorderNight: 'border-[#ff1744]/15',
              cardGlowNight: 'from-[#ff1744]/30',
              scoreIcon: <Heart size={5} className="text-white" />
            },
            {
              title: 'Safe Zone',
              subtitle: 'Verified safe places in your vicinity',
              count: '3.1',
              unit: 'km',
              subtext: '• 4 Safe Zones',
              icon: <ShieldCheck size={10} className="text-white" />,
              iconBg: 'bg-gradient-to-b from-[#69f0ae] to-[#00e676]',
              iconShadow: 'shadow-[0_0_10px_rgba(0,230,118,0.4)]',
              image: isNight ? '/assets/nightcommunity/saferoute.png' : '/assets/community/saferoute.png',
              score: '90%',
              scoreColor: 'text-[#00e676]',
              scoreBg: 'bg-[#00e676]',
              cardBorderNight: 'border-[#00e676]/15',
              cardGlowNight: 'from-[#00e676]/30',
              scoreIcon: <ShieldCheck size={5} className="text-white" />
            }
          ].map((item, i) => (
            <div key={i} className={`w-[145px] shrink-0 flex flex-col rounded-[14px] relative overflow-hidden shadow-sm border-[0.5px] ${isNight ? `bg-[#1a202c] ${item.cardBorderNight}` : 'bg-white border-white/50'}`} style={{ height: '220px' }}>
              {/* Background Image */}
              <img src={item.image} alt={item.title} className={`absolute bottom-0 left-0 right-0 w-full z-0 [image-rendering:-webkit-optimize-contrast] contrast-[1.25] saturate-[1.2] brightness-[0.95] ${isNight ? 'opacity-80' : 'opacity-100'} ${i === 0 ? 'h-[145px] object-cover object-[50%_80%]' : i === 2 ? 'h-[135px] object-cover object-bottom' : 'h-full inset-0 object-cover object-bottom'}`} />

              {/* Warm Layer / Gradient for text readability */}
              <div className={`absolute top-0 left-0 right-0 h-[190px] bg-gradient-to-b ${isNight ? `${item.cardGlowNight} via-[#1a202c]/85` : 'from-[#fff6ef]/95 via-[#fff6ef]/80'} to-transparent z-0`}></div>

              <div className="relative z-10 flex flex-col items-center pt-2.5 px-2 pb-[4px] h-full">
                {/* Header Row: Icon + Title/Subtitle */}
                <div className="flex flex-row items-center justify-start gap-1.5 w-full mb-1">
                  {/* Icon */}
                  <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${item.iconBg} ${item.iconShadow}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 12, className: "text-white" })}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="flex flex-col text-left">
                    <h4 className={`text-[12px] font-black leading-tight mb-1.5 ${isNight ? 'text-white' : 'text-[#1a202c]'}`}>{item.title}</h4>
                    <p className={`text-[7.5px] font-bold leading-[1.25] ${isNight ? 'text-white/80' : 'text-[#4a5568]'}`}>{item.subtitle}</p>
                  </div>
                </div>

                {/* Count & Unit */}
                <div className="flex items-baseline gap-[3px] -mt-[2px] mb-0.5">
                  <span className={`text-[20px] font-black leading-none ${item.scoreColor}`}>{item.count}</span>
                  <span className={`text-[8.5px] font-extrabold ${isNight ? 'text-white/80' : 'text-[#1a202c]'}`}>{item.unit}</span>
                </div>

                {/* Subtext */}
                <p className={`text-[8px] font-black mt-0.5 ${item.scoreColor}`}>{item.subtext}</p>

                <div className="flex-1"></div>

                {/* Bottom Score Pill */}
                <div className={`w-full rounded-[10px] p-[8px] px-[10px] shadow-sm border-[0.5px] flex flex-col gap-1.5 ${isNight ? 'bg-[#1a202c]/90 border-white/10' : 'bg-white/95 border-white/60'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-[20px] h-[20px] shrink-0 rounded-full flex items-center justify-center ${item.scoreBg}`}>
                        {React.cloneElement(item.scoreIcon as React.ReactElement, { size: 10, className: "text-white" })}
                      </div>
                      <span className={`text-[9px] font-extrabold ${isNight ? 'text-white/70' : 'text-[#4a5568]'} whitespace-nowrap`}>Safety Score</span>
                    </div>
                    <span className={`text-[10px] font-black ${item.scoreColor}`}>{item.score}</span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className={`h-[5px] w-full rounded-full mt-0.5 ${isNight ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <div className={`h-full rounded-full ${item.scoreBg}`} style={{ width: item.score }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className={`mt-2 flex items-center justify-between p-2.5 rounded-[16px] border shadow-sm ${isNight ? 'bg-[#15111d] border-[#7c4dff]/20' : 'bg-[#fffcf9] border-white/80'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-[#7c4dff]/20' : 'bg-orange-500/20'}`}>
              <Users size={12} className={isNight ? "text-[#c084fc]" : "text-orange-500"} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[9.5px] font-bold leading-tight ${isNight ? 'text-white' : 'text-[#1a202c]'}`}>Stronger together. Safer together.</span>
              <span className={`text-[7.5px] leading-tight mt-[1px] ${isNight ? 'text-white/60' : 'text-[#718096]'}`}>You're protected by <strong className={isNight ? "text-[#c084fc]" : "text-orange-500"}>120+</strong> active protectors.</span>
            </div>
          </div>
          <button className={`text-[8px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-[3px] shrink-0 transition-transform active:scale-95 text-white ${
            isNight 
              ? 'bg-gradient-to-r from-[#5a38f5] to-[#4054fc] shadow-[0_4px_14px_rgba(90,56,245,0.4)]' 
              : 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] shadow-[0_4px_14px_rgba(46,204,113,0.4)]'
          }`}>
            <Shield size={8} className="text-white fill-white" /> Become Protector <ChevronRight size={8} strokeWidth={3} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
