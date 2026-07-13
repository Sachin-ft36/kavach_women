import React from 'react';
import { Plus } from 'lucide-react';

interface SafetyStoriesCardProps {
  isNight: boolean;
}

const STORIES = [
  {
    name: 'Mom',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    gradient: 'from-[#00ff87] to-[#60efff]',
    badge: 'shield', // Green Shield for Verified Safe
    badgeColor: 'bg-[#00ff87]/20 text-[#00ff87] border-[#00ff87]/30'
  },
  {
    name: 'Dad',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    gradient: 'from-[#a855f7] to-[#00ff87]',
    badge: 'shield', // Green Shield
    badgeColor: 'bg-[#00ff87]/20 text-[#00ff87] border-[#00ff87]/30'
  },
  {
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    gradient: 'from-[#ec4899] to-[#8b5cf6]',
    badge: 'grad', // Graduation Cap for Campus Safety Active
    badgeColor: 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/30'
  },
  {
    name: 'Rahul',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    gradient: 'from-[#3b82f6] to-[#06b6d4]',
    badge: 'car', // Car icon for Ride Safe Mode Active
    badgeColor: 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30'
  },
  {
    name: 'Ritika',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    gradient: 'from-[#ff758c] to-[#ff7eb3]',
    badge: 'friends', // Friends icon for Group safety active
    badgeColor: 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/30'
  }
];

export const SafetyStoriesCard = React.memo(({ isNight }: SafetyStoriesCardProps) => {
  return (
    <div className={`w-full rounded-[20px] px-3.5 py-3 flex flex-col border ${
      isNight ? 'bg-[#120F22] border-[#7A3EFF]/35 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200/50 shadow-sm'
    } relative overflow-hidden font-sans`}>
      
      {/* Title Header with Live indicator */}
      <div className="flex items-center gap-1.5 text-left mb-3">
        <span className={`text-[8.5px] font-black uppercase tracking-wider ${isNight ? 'text-white' : 'text-slate-900'}`}>
          SAFETY STORIES
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F57A]" />
          <span className="text-[7.5px] font-black uppercase tracking-wider text-[#00F57A]">
            Live
          </span>
        </div>
      </div>

      {/* Stories list container */}
      <div className="flex items-center gap-[11px] overflow-x-auto scrollbar-none py-0.5">
        
        {/* Your Story item */}
        <div className="flex flex-col items-center cursor-pointer shrink-0">
          <div className="w-[50px] h-[50px] rounded-full border border-dashed border-white/20 flex items-center justify-center bg-white/5 active:scale-95 transition-all">
            <Plus size={16} className="text-white/60" />
          </div>
          <span className={`text-[8px] font-semibold mt-2 ${isNight ? 'text-white/60' : 'text-slate-500'}`}>
            Your Story
          </span>
        </div>

        {/* Dynamic stories items */}
        {STORIES.map((story) => (
          <div key={story.name} className="flex flex-col items-center cursor-pointer shrink-0 relative group">
            
            {/* Avatar container with gradient border */}
            <div className={`w-[52px] h-[52px] rounded-full p-[2px] bg-gradient-to-tr from-[#FF4FD8] via-[#A855F7] to-[#00C2FF] flex items-center justify-center active:scale-95 transition-all`}>
              <div className="w-full h-full rounded-full border border-black/80 overflow-hidden bg-slate-800">
                <img 
                  src={story.avatar} 
                  alt={story.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            {/* Bottom-Right Badge Icon Overlay */}
            <div className={`absolute bottom-[16px] right-0 w-[16px] h-[16px] rounded-full border flex items-center justify-center ${story.badgeColor} z-10 shadow-md`}>
              {story.badge === 'shield' && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C7.5 4 4 5 4 5v7c0 5.25 3.5 10.25 8 11.5 4.5-1.25 8-6.25 8-11.5V5s-3.5-1-8-3zm0 3c3.5 1.5 6.5 2.5 6.5 2.5v5c0 4.2-2.8 8.1-6.5 9.2-3.7-1.1-6.5-5-6.5-9.2v-5S8.5 6.5 12 5z" />
                </svg>
              )}
              {story.badge === 'grad' && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13c-2.76 0-5-2.24-5-5 0-.34.04-.67.11-1L12 13l4.89-3c.07.33.11.66.11 1 0 2.76-2.24 5-5 5z" />
                </svg>
              )}
              {story.badge === 'car' && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 16c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12-5H7v2h10v-2z" />
                </svg>
              )}
              {story.badge === 'friends' && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 1.34 5 3s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              )}
            </div>

            {/* Name label */}
            <span className={`text-[8.5px] font-semibold mt-2 ${isNight ? 'text-white/80' : 'text-slate-700'}`}>
              {story.name}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
});

SafetyStoriesCard.displayName = 'SafetyStoriesCard';
