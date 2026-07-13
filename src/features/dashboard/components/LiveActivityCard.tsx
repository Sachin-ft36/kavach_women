import React from 'react';
import { Star, ChevronRight, Activity } from 'lucide-react';

interface LiveActivityCardProps {
  isNight: boolean;
}

const FEED_ITEMS = [
  {
    name: 'Mom',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    action: 'reached Home',
    emoji: '🏠',
    time: '2m ago',
    dotColor: '#10b981'
  },
  {
    name: 'Rahul',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    action: 'started a Ride',
    emoji: '🚙',
    time: '8m ago',
    dotColor: '#3b82f6'
  },
  {
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    action: 'posted a Story',
    emoji: '📸',
    time: '15m ago',
    dotColor: '#a855f7'
  },
  {
    name: 'You',
    avatar: 'star',
    action: 'earned 25 XP',
    emoji: '✨🔥',
    time: '45m ago',
    dotColor: '#eab308'
  }
];

export const LiveActivityCard = React.memo(({ isNight }: LiveActivityCardProps) => {
  return (
    <div className={`flex-1 rounded-[20px] p-2 flex flex-col justify-start border ${
      isNight ? 'bg-[#120F22] border-[#30254C] shadow-[0_20px_60px_rgba(0,0,0,0.45)]' : 'bg-white border-slate-200/50 shadow-sm'
    } h-[170px] relative overflow-hidden font-sans`}>
      
      {/* Subtle background glow */}
      <div className={`absolute -top-20 -right-20 w-32 h-32 bg-[#A855F7] blur-[60px] rounded-full pointer-events-none ${
        isNight ? 'opacity-10' : 'opacity-[0.03]'
      }`}></div>

      {/* Header */}
      <div className="flex justify-between items-center z-10 relative mb-1.5 px-0.5">
        <div className="flex gap-1 items-center">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
            isNight 
              ? 'bg-[#24183D] text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]' 
              : 'bg-purple-50 text-[#7C4DFF] border border-purple-100/50'
          }`}>
            <Activity className="w-2 h-2 text-[#A855F7]" />
          </div>
          <div className="text-left">
            <h2 className={`font-black text-[8px] tracking-wide leading-none ${isNight ? 'text-white' : 'text-slate-800'}`}>LIVE ACTIVITY</h2>
            <p className={`text-[6px] mt-0.5 leading-none ${isNight ? 'text-[#B8B2CC]' : 'text-slate-500'}`}>Real-time updates</p>
          </div>
        </div>
        <button className={`flex items-center text-[6.5px] font-bold hover:opacity-85 transition-colors group cursor-pointer border-none bg-transparent ${
          isNight ? 'text-[#C56EFF]' : 'text-purple-600'
        }`}>
          View All
          <ChevronRight className="w-2 h-2 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* List Items Container */}
      <div className="flex flex-col gap-1 z-10 relative overflow-y-auto no-scrollbar pr-0.5">
        {FEED_ITEMS.map((item, idx) => (
          <div 
            key={idx} 
            className={`flex justify-between items-center px-1.5 py-1 rounded-[8px] border transition-all ${
              isNight 
                ? 'bg-[#0E0C1C] border-[#201938] hover:bg-[#151229]' 
                : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {/* Left Accent Bar */}
              <div 
                className="w-[3px] h-3.5 rounded-full shrink-0" 
                style={{ backgroundColor: item.dotColor }}
              />
              
              {/* Message Details */}
              <div className="flex flex-col text-left">
                <span className={`text-[8px] font-bold ${isNight ? 'text-white' : 'text-slate-800'}`}>
                  {item.name}
                </span>
                <span className={`text-[6.5px] leading-tight ${isNight ? 'text-[#8A85A3]' : 'text-slate-500'}`}>
                  {item.action} {item.emoji}
                </span>
              </div>
            </div>
            
            {/* Timestamp */}
            <span className={`text-[6px] font-medium ${isNight ? 'text-white/40' : 'text-slate-400'}`}>
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

LiveActivityCard.displayName = 'LiveActivityCard';
