import React from 'react';
import { Share2 } from 'lucide-react';

interface InviteCardProps {
  isNight: boolean;
}

// Reusable Heart Component for the floating 3D-like hearts
const FloatingHeart = ({ className, size = 24, rotation = 0, opacity = 1 }: { className?: string, size?: number, rotation?: number, opacity?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`absolute ${className}`}
    style={{ transform: `rotate(${rotation}deg)`, opacity }}
  >
    <defs>
      <linearGradient id={`heartGrad-${size}-${rotation}`} x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#ff7eb3" />
        <stop offset="50%" stopColor="#ff428c" />
        <stop offset="100%" stopColor="#a3004b" />
      </linearGradient>
      <filter id={`shadow-${size}`}>
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ff428c" floodOpacity="0.4" />
      </filter>
    </defs>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={`url(#heartGrad-${size}-${rotation})`}
      filter={`url(#shadow-${size})`}
    />
  </svg>
);

export const InviteCard = React.memo(({ isNight }: InviteCardProps) => {
  return (
    <div className="w-full px-[6px] mt-1.5 font-sans">
      
      {/* Banner Container */}
      <div className={`relative w-full rounded-[16px] overflow-hidden flex flex-row items-center justify-start pl-3 pr-2.5 py-4 border shadow-2xl transition-all duration-500 gap-2.5 ${
        isNight ? 'bg-[#12071f] border-white/10' : 'bg-white border-slate-200/50'
      }`}>
        
        {/* Glowing Background Elements */}
        {isNight ? (
          <>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#170a27] via-[#2a0845] to-[#12071f]" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-32 bg-[radial-gradient(ellipse_at_center,rgba(255,100,120,0.35)_0%,transparent_70%)] z-0 rounded-full blur-xl" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#fff9fb] via-[#fff5f8] to-[#fffcfd]" />
        )}

        {/* --- LEFT SECTION: Text --- */}
        <div className="relative z-10 flex flex-col justify-center min-w-0 pr-0.5 pl-0.5 max-w-[45%]">
          <h2 className={`${isNight ? 'text-white' : 'text-slate-800'} text-[9px] font-bold tracking-wide uppercase leading-tight`}>
            Invite & Grow Your Circle
          </h2>
          <p className={`${isNight ? 'text-white/80' : 'text-slate-600'} text-[7.5px] mt-0.5 leading-[1.2]`}>
            Invite friends & family and build a safety network that never breaks.
          </p>
        </div>

        {/* --- MIDDLE SECTION: Connected Avatars --- */}
        <div className="relative z-10 flex items-center justify-center w-[75px] flex-shrink-0 ml-[-8px] mr-1">
          
          {/* Dashed curved line */}
          <svg className="absolute w-[80%] h-5 -top-1.5 z-0" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path d="M 10 30 Q 50 -10 90 30" fill="none" stroke={isNight ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)"} strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>

          {/* Floating Hearts */}
          <FloatingHeart className="-top-2.5 -left-1" size={8} rotation={-15} />
          <FloatingHeart className="-top-3 right-0.5" size={10} rotation={15} />
          <FloatingHeart className="bottom-0.5 -right-4" size={7} rotation={-25} opacity={0.8} />
          
          {/* Small background tiny hearts */}
          <div className="absolute top-0 right-0 w-1 h-1 bg-pink-500 rounded-full blur-[1px] opacity-70" />
          <div className="absolute bottom-4 -left-3 w-0.5 h-0.5 bg-purple-400 rounded-full blur-[1px] opacity-60" />

          {/* Left Avatar */}
          <div className="relative z-10 transform translate-y-1 mr-0.5">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=50&h=50" 
              alt="User 1" 
              className="rounded-full object-cover border-[0.8px] border-[#2a0845]"
              style={{ width: '17px', height: '17px' }}
            />
            {/* Badges */}
            <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-purple-600 rounded-full border border-[#12071f] flex items-center justify-center">
              <span className="text-[3px] text-white">⭐</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-[#12071f] flex items-center justify-center">
              <span className="text-[3px] text-white">🛡️</span>
            </div>
          </div>

          {/* Center Avatar (Elevated) */}
          <div className="relative z-20 -mt-3 mx-0.5 shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&h=60" 
              alt="Center User" 
              className="rounded-full object-cover border-[1.2px] border-white/10 shadow-[0_0_8px_rgba(255,100,120,0.4)]"
              style={{ width: '22px', height: '22px' }}
            />
          </div>

          {/* Right Avatar */}
          <div className="relative z-10 transform translate-y-1 ml-0.5">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50" 
              alt="User 3" 
              className="rounded-full object-cover border-[0.8px] border-[#2a0845]"
              style={{ width: '17px', height: '17px' }}
            />
            {/* Badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full border border-[#12071f] flex items-center justify-center">
              <span className="text-[2.5px] text-white font-bold">A</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT SECTION: Button --- */}
        <div className="relative z-10 flex items-center pr-0.5 ml-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#fc2385] to-[#ff7a2e] hover:from-[#ff3a97] hover:to-[#ff8d49] transition-all transform active:scale-95 rounded-full shadow-[0_4px_10px_rgba(255,60,100,0.35)] border-none cursor-pointer">
            <Share2 className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            <span className="text-white text-[9.5px] font-bold whitespace-nowrap">
              Invite Now
            </span>
          </button>
        </div>

      </div>
    </div>
  );
});

InviteCard.displayName = 'InviteCard';
