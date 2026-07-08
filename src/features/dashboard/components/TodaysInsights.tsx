import React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTimeTheme } from '../../../hooks/useTimeTheme';
import { useKavachTheme } from '../../../providers/ThemeProvider';

interface TodaysInsightsProps {
  isNight: boolean;
  displayFamilyMembers: any[];
  verifiedProtectorCount: number;
  setIsAddMemberSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TodaysInsights = ({
  isNight,
  displayFamilyMembers,
  verifiedProtectorCount,
  setIsAddMemberSheetOpen
}: TodaysInsightsProps) => {
  const { themeTokens } = useKavachTheme();
  const { themeFolder } = useTimeTheme();

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      {/* Today's Insights */}
      <div className={`${isNight ? 'bg-[#120a2b]/85 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]' : 'bg-[#FFF8F1] border border-white/45 shadow-[0_14px_45px_rgba(255,170,120,0.12)]'} rounded-[20px] p-3 flex flex-col gap-[10px] flex-1 relative overflow-hidden`}>
        {/* Full Container Background Image */}
        <img
          src={isNight ? "/assets/dashboard_assets/hero.png" : `/assets/dashboard_assets/${themeFolder}/background.jpeg`}
          alt="Insights Background"
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 ${isNight ? 'opacity-[0.85]' : 'opacity-[0.5]'}`}
        />
        {/* Gradient Overlay for Text Clarity */}
        <div className={`absolute inset-0 pointer-events-none z-0 ${isNight ? 'bg-gradient-to-br from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-br from-white/90 via-white/60 to-transparent'}`} />
        <div className="flex justify-between items-center px-[2px] mt-0.5 relative z-10">
          <span className={`text-[9px] font-bold tracking-wider ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>TODAY'S INSIGHTS</span>
          <span
            className={`text-[9px] font-bold cursor-pointer whitespace-nowrap hover:opacity-80 transition-opacity ${
              isNight
                ? 'text-blue-400'
                : themeFolder === 'afternoon'
                ? 'bg-gradient-to-r from-[#FF9333] to-[#FF6B5F] bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent'
            }`}
            onClick={() => toast.info("Insights history coming soon!")}
          >
            View All &gt;
          </span>
        </div>

        {/* 2x2 Stats Grid */}
        <div className="grid grid-cols-2 gap-[6px] relative z-10">
          {/* Card 1 */}
          <div className={`${isNight ? 'bg-[#052219]/60 border-emerald-500/30' : 'bg-white/40 border-white/60 backdrop-blur-md shadow-sm'} border rounded-[12px] p-[6px] flex flex-col justify-between h-[50px] relative overflow-hidden text-left`}>
            <span className={`text-[8px] leading-tight ${isNight ? 'text-white/60' : 'text-[#4a5568] font-medium'}`}>Family<br />Check-ins</span>
            <div className="flex items-center mt-0.5 w-full gap-1">
              <div className="flex items-baseline gap-1">
                <span className={`text-[20px] font-bold leading-none ${isNight ? 'text-white' : 'text-[#059669]'}`}>{displayFamilyMembers?.length || 0}</span>
                <span className={`text-[8px] ${isNight ? 'text-white/40' : 'text-[#a0aec0] font-bold'}`}>TODAY</span>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className={`${isNight ? 'bg-[#031d38]/60 border-blue-500/30' : 'bg-white/40 border-white/60 backdrop-blur-md shadow-sm'} border rounded-[12px] p-[6px] flex flex-col justify-between h-[50px] relative overflow-hidden text-left`}>
            <span className={`text-[8px] leading-tight ${isNight ? 'text-white/60' : 'text-[#4a5568] font-medium'}`}>Travel<br />Active</span>
            <div className="flex items-center mt-0.5 w-full gap-1">
              <div className="flex items-baseline gap-1">
                <span className={`text-[20px] font-bold leading-none ${isNight ? 'text-white' : 'text-[#2563eb]'}`}>1</span>
                <span className={`text-[8px] ${isNight ? 'text-white/40' : 'text-[#a0aec0] font-bold'}`}>TODAY</span>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className={`${isNight ? 'bg-[#1b0c36]/60 border-purple-500/30' : 'bg-white/40 border-white/60 backdrop-blur-md shadow-sm'} border rounded-[12px] p-[6px] flex flex-col justify-between h-[50px] relative overflow-hidden text-left`}>
            <span className={`text-[8px] leading-tight ${isNight ? 'text-white/60' : 'text-[#4a5568] font-medium'}`}>Nearby<br />Protectors</span>
            <div className="flex items-center mt-0.5 w-full gap-1">
              <div className="flex items-baseline gap-1">
                <span className={`text-[20px] font-bold leading-none ${isNight ? 'text-white' : 'text-[#7c3aed]'}`}>{verifiedProtectorCount || 12}</span>
                <span className={`text-[8px] font-bold ${isNight ? 'text-[#a855f7]' : 'text-[#9333ea]'}`}>HIGH</span>
              </div>
            </div>
          </div>
          {/* Card 4 */}
          <div className={`${isNight ? 'bg-[#052219]/60 border-emerald-500/30' : 'bg-white/40 border-white/60 backdrop-blur-md shadow-sm'} border rounded-[12px] p-[6px] flex flex-col justify-between h-[50px] relative overflow-hidden text-left`}>
            <span className={`text-[8px] leading-tight ${isNight ? 'text-white/60' : 'text-[#4a5568] font-medium'}`}>Risk<br />Level</span>
            <div className="flex items-center mt-0.5 w-full gap-1">
              <span className={`text-[16px] font-bold leading-none ${isNight ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]' : 'text-[#059669]'}`}>Safe</span>
            </div>
          </div>
        </div>
        {/* Build Safety Circle Card */}
        <div
          onClick={() => setIsAddMemberSheetOpen(true)}
          className={`${isNight ? 'bg-[#120a21]/50 border-purple-500/15 hover:border-purple-500/30' : 'bg-[#fcf8f2] border-white/80 hover:border-white shadow-md'} border rounded-[12px] p-2 flex flex-col justify-between flex-1 relative overflow-hidden group cursor-pointer transition-colors text-left`}
        >
          <img
            key={`network-${themeFolder}`}
            src={isNight ? "/assets/dashboard_assets/add_people.png" : `/assets/dashboard_assets/${themeFolder}/network.png`}
            alt="Build Safety Circle Background"
            className="absolute inset-0 w-full h-full object-cover object-[80%_center] pointer-events-none z-0 opacity-100"
          />
          {/* Gradient overlay for text clarity on the left */}
          <div className={`absolute inset-0 bg-gradient-to-r ${isNight ? 'from-[#0a0514]/90 via-[#0a0514]/40' : 'from-[#fdf8f0]/95 via-[#fdf8f0]/70'} to-transparent pointer-events-none z-0`} />

          {isNight && (
            <div className="absolute right-[-10px] top-1/2 transform -translate-y-1/2 w-[80px] h-[80px] bg-purple-600/20 blur-xl rounded-full pointer-events-none z-0"></div>
          )}

          <div className="flex flex-col relative z-10 w-[60%]">
            <span className={`text-[11px] font-bold ${isNight ? 'text-white' : 'text-[#1a202c]'}`}>Build your Safety Circle</span>
            <span className={`text-[8px] mt-1 leading-[1.4] ${isNight ? 'text-white/50' : 'text-[#4a5568]'}`}>Add your loved ones and stay connected always.</span>
          </div>
          <button
            style={isNight ? {
              background: 'linear-gradient(135deg, #40138A 0%, #7A2DDB 55%, #F0438A 100%)',
              border: 'none',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(122,45,219,0.35), 0 0 20px rgba(240,67,138,0.15)'
            } : {
              background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
              border: 'none',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
            className="mt-[10px] w-max text-[10.5px] font-bold px-[10px] py-[5px] rounded-[6px] flex items-center gap-1.5 transition-all active:scale-95 hover:brightness-110 relative z-10"
          >
            <Plus size={11} style={{ color: '#FFFFFF' }} /> Add Member
          </button>
        </div>

      </div>
    </div>
  );
};
