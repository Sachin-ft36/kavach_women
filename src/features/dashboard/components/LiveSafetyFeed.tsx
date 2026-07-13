import React from 'react';
import { ShieldCheck, Car, User, AlertCircle } from 'lucide-react';
import { useTimeTheme } from '../../../hooks/useTimeTheme';

interface FeedItem {
  icon: 'shield' | 'car' | 'user' | 'alert';
  text: string;
  time: string;
}

interface LiveSafetyFeedProps {
  isNight: boolean;
  updates?: any[];
}

export const LiveSafetyFeed = ({ isNight, updates = [] }: LiveSafetyFeedProps) => {
  const { themeFolder } = useTimeTheme();

  // Format timestamp to HH:MM AM/PM
  const formatTime = (ts: number | string) => {
    if (!ts) return '';
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Map update type to icon
  const getIcon = (type: string) => {
    if (type?.includes('ride') || type?.includes('RIDE')) return 'car';
    if (type?.includes('sos') || type?.includes('SOS') || type?.includes('alert')) return 'alert';
    if (type?.includes('checkin') || type?.includes('CHECK') || type?.includes('shield')) return 'shield';
    return 'user';
  };

  // Build feed: use real updates if available, otherwise show empty state
  const feedItems = updates.slice(0, 4).map(u => ({
    icon: getIcon(u.type || ''),
    text: u.message || u.text || u.title || 'Safety update',
    time: formatTime(u.timestamp || u.time || Date.now()),
  }));

  const iconMap: Record<string, React.ReactNode> = {
    shield: <ShieldCheck size={12} className={isNight ? 'text-[#00ff66]' : 'text-[#059669]'} />,
    car:    <Car size={12} className={isNight ? 'text-blue-400' : 'text-blue-600'} />,
    user:   <User size={12} className={isNight ? 'text-purple-400' : 'text-purple-600'} />,
    alert:  <AlertCircle size={12} className={isNight ? 'text-red-400' : 'text-red-500'} />,
  };

  const bgMap: Record<string, string> = {
    shield: isNight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50',
    car:    isNight ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50',
    user:   isNight ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50',
    alert:  isNight ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50',
  };

  return (
    <div className={`flex-1 rounded-[16px] border flex flex-col relative overflow-hidden min-h-[220px] ${isNight ? 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)] bg-black/20 border-white/10' : 'shadow-[0_14px_45px_rgba(255,170,120,0.12)] bg-[#FFF8F1] border-white/45'}`}>

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
        >
          {feedItems.length > 0 ? 'View All >' : ''}
        </span>
      </div>

      <div className="flex flex-col px-[12px] mt-1 z-10 relative gap-[4px]">
        {feedItems.length === 0 ? (
          // Empty state — no updates yet
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <ShieldCheck size={28} className={isNight ? 'text-emerald-500/40' : 'text-emerald-200'} />
            <p className={`text-[9px] font-semibold text-center ${isNight ? 'text-white/40' : 'text-gray-400'}`}>
              All safe! No recent activity.
            </p>
          </div>
        ) : (
          feedItems.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 animate-smooth-slide-up ${isNight ? '' : 'bg-white/95 p-[3px] pr-[10px] rounded-[16px] shadow-sm border border-white/60 w-[98%]'}`}
              style={{ animationDelay: `${i * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${bgMap[item.icon]}`}>
                {iconMap[item.icon]}
              </div>
              <div className="flex-1 flex justify-between items-center min-w-0">
                <span className={`text-[9px] font-semibold truncate mr-1.5 ${isNight ? 'text-white/90' : 'text-[#2d3748]'}`}>{item.text}</span>
                <span className={`text-[8px] shrink-0 font-medium ${isNight ? 'text-white/40' : 'text-gray-500'}`}>{item.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-8 pb-[14px] px-[12px] relative z-10">
        <span className={`text-[10px] font-bold tracking-wide drop-shadow-md ${isNight ? 'text-white/80' : 'text-white'}`}>Stay updated in real-time</span>
      </div>
    </div>
  );
};
