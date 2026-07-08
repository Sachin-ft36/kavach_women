import React from 'react';
import { ShieldCheck, Car, User } from 'lucide-react';
import { useTimeTheme } from '../../../hooks/useTimeTheme';
import { toast } from 'sonner';

interface LiveSafetyFeedProps {
  isNight: boolean;
}

export const LiveSafetyFeed = ({ isNight }: LiveSafetyFeedProps) => {
  const { themeFolder } = useTimeTheme();

  return (
    <div className={`flex-1 rounded-[24px] border flex flex-col relative overflow-hidden min-h-[220px] ${isNight ? 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)] bg-black/20 border-white/10' : 'shadow-[0_14px_45px_rgba(255,170,120,0.12)] bg-[#FFF8F1] border-white/45'}`}>
      {/* Full Background Image */}
      <img
        key={`livefeed-${themeFolder}`}
        src={isNight ? "/assets/dashboard_assets/livefeed.png" : `/assets/dashboard_assets/${themeFolder}/livefeed.png`}
        alt="Live Feed Skyline"
        className="absolute inset-0 w-full h-full object-cover object-bottom z-0 pointer-events-none opacity-100"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)'
        }}
      />
      {/* Gradient overlay to ensure text readability */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${isNight ? 'bg-[#120a2b]/50' : 'bg-gradient-to-b from-transparent via-transparent to-[#FFF8F1]/25'}`} />

      {/* Subtle Visuals (Morning Only) */}
      {!isNight && (
        <svg className="absolute top-[30px] right-[20px] w-[60px] h-[30px] pointer-events-none z-0 text-[#FF8C42]/30 animate-cloud-drift" viewBox="0 0 100 50">
          <path d="M20,25 Q25,13 30,20 Q35,13 40,25 Q32,19 30,22 Q28,19 20,25 Z" fill="currentColor" />
          <path d="M55,12 Q59,6 63,10 Q67,6 71,12 Q64.6,8.4 63,10.2 Q61.4,8.4 55,12 Z" fill="currentColor" />
        </svg>
      )}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center z-10 relative">
        <span className={`text-[9px] font-bold tracking-wider uppercase ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>LIVE SAFETY FEED</span>
        <span
          className={`text-[9px] font-bold cursor-pointer whitespace-nowrap hover:opacity-80 transition-opacity ${
            isNight
              ? 'text-blue-400'
              : themeFolder === 'afternoon'
              ? 'bg-gradient-to-r from-[#FF9333] to-[#FF6B5F] bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent'
          }`}
          onClick={() => toast.info("Live feed details coming soon!")}
        >
          View All &gt;
        </span>
      </div>

      <div className={`flex flex-col px-[12px] mt-1 z-10 relative gap-[4px]`}>
        {/* Feed Item 1 */}
        <div className={`flex items-center gap-2 animate-smooth-slide-up ${isNight ? '' : 'bg-white/95 p-[3px] pr-[10px] rounded-[24px] shadow-sm border border-white/60 w-[98%]'}`} style={{ animationDelay: '0ms' }}>
          <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50'}`}>
            <ShieldCheck size={12} className={isNight ? "text-[#00ff66]" : "text-[#059669]"} />
          </div>
          <div className="flex-1 flex justify-between items-center min-w-0">
            <span className={`text-[9px] font-semibold truncate mr-1.5 ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>Mom reached Home</span>
            <span className={`text-[8px] shrink-0 font-medium ${isNight ? 'text-white/40' : 'text-gray-500'}`}>7:18 {isNight ? 'PM' : 'AM'}</span>
          </div>
        </div>
        {/* Feed Item 2 */}
        <div className={`flex items-center gap-2 animate-smooth-slide-up ${isNight ? '' : 'bg-white/95 p-[3px] pr-[10px] rounded-[24px] shadow-sm border border-white/60 w-[98%]'}`} style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50'}`}>
            <Car size={12} className={isNight ? "text-blue-400" : "text-blue-600"} />
          </div>
          <div className="flex-1 flex justify-between items-center min-w-0">
            <span className={`text-[9px] font-semibold truncate mr-1.5 ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>Brother started Ride</span>
            <span className={`text-[8px] shrink-0 font-medium ${isNight ? 'text-white/40' : 'text-gray-500'}`}>7:05 {isNight ? 'PM' : 'AM'}</span>
          </div>
        </div>
        {/* Feed Item 3 */}
        <div className={`flex items-center gap-2 animate-smooth-slide-up ${isNight ? '' : 'bg-white/95 p-[3px] pr-[10px] rounded-[24px] shadow-sm border border-white/60 w-[98%]'}`} style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50'}`}>
            <ShieldCheck size={12} className={isNight ? "text-[#00ff66]" : "text-[#059669]"} />
          </div>
          <div className="flex-1 flex justify-between items-center min-w-0">
            <span className={`text-[9px] font-semibold truncate mr-1.5 ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>You checked-in</span>
            <span className={`text-[8px] shrink-0 font-medium ${isNight ? 'text-white/40' : 'text-gray-500'}`}>6:45 {isNight ? 'PM' : 'AM'}</span>
          </div>
        </div>
        {/* Feed Item 4 */}
        <div className={`flex items-center gap-2 animate-smooth-slide-up ${isNight ? '' : 'bg-white/95 p-[3px] pr-[10px] rounded-[24px] shadow-sm border border-white/60 w-[98%]'}`} style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50'}`}>
            <User size={12} className={isNight ? "text-purple-400" : "text-purple-600"} />
          </div>
          <div className="flex-1 flex justify-between items-center min-w-0">
            <span className={`text-[9px] font-semibold truncate mr-1.5 ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>Riya is at College</span>
            <span className={`text-[8px] shrink-0 font-medium ${isNight ? 'text-white/40' : 'text-gray-500'}`}>6:30 {isNight ? 'PM' : 'AM'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Image Graphic Area */}
      <div className="mt-auto pt-8 pb-[14px] px-[12px] relative z-10">
        <span className={`text-[10px] font-bold tracking-wide drop-shadow-md ${isNight ? 'text-white/80' : 'text-white'}`}>Stay updated in real-time</span>
      </div>
    </div>
  );
};
