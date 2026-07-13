import React from 'react';

interface TodayStreakCardProps {
  isNight: boolean;
}

export const TodayStreakCard = React.memo(({ isNight }: TodayStreakCardProps) => {
  const DAYS = [
    { label: 'M', checked: true },
    { label: 'T', checked: true },
    { label: 'W', checked: true },
    { label: 'T', checked: true },
    { label: 'F', checked: true },
    { label: 'S', checked: true },
    { label: 'S', checked: true },
  ];

  return (
    <div className={`flex-1 rounded-[20px] p-3.5 flex flex-col justify-between border ${
      isNight ? 'streak-card-bg border-[#7A3EFF]/35 shadow-lg' : 'bg-white border-slate-200/50 shadow-sm'
    } h-[170px] relative overflow-hidden font-sans`}>
      
      {/* Subtle Stars Background Element */}
      {isNight && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)', 
            backgroundSize: '12px 12px' 
          }}
        />
      )}

      {/* Content Container (Z-index 10 to stay above background) */}
      <div className="relative z-10 h-full flex flex-col justify-between text-left">
        
        <div>
          {/* Header */}
          <h2 className={`text-[8.5px] font-black tracking-wider uppercase mb-1 ${
            isNight ? 'text-gray-200' : 'text-slate-700'
          }`}>
            TODAY'S STREAK
          </h2>
          
          {/* Streak Number */}
          <div className="flex items-baseline gap-1 mt-0.5">
            {/* Italicized bold number */}
            <span className={`text-[32px] font-extrabold italic leading-none tracking-tighter ${
              isNight ? 'text-white' : 'text-slate-800'
            }`}>18</span>
            <span className={`text-[9px] font-bold ${isNight ? 'text-gray-100' : 'text-slate-600'}`}>Days Strong! 🔥</span>
          </div>
        </div>

        {/* Days Checkmarks Row */}
        <div className="flex justify-between items-center w-full px-0.5 my-1">
          {DAYS.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <span className={`text-[7px] font-semibold ${isNight ? 'text-gray-300' : 'text-slate-500'}`}>{day.label}</span>
              <div className="w-[15px] h-[15px] rounded-full bg-[#10b981] flex items-center justify-center shadow-[0_0_5px_rgba(16,185,129,0.4)]">
                {/* Custom checkmark check icon */}
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar & Gift Box area */}
        <div className="flex justify-between items-end w-full">
          {/* Progress Section */}
          <div className="w-[62%]">
            <p className="text-[#eab308] text-[8px] font-bold mb-1 leading-none">2 days to next reward</p>
            <div className={`h-1.5 rounded-full w-full overflow-hidden ${
              isNight ? 'bg-[#2a1a3a]' : 'bg-slate-100'
            }`}>
              {/* Filled Part */}
              <div 
                className="h-full bg-gradient-to-r from-[#eab308] to-[#f97316] rounded-full shadow-[0_0_5px_#eab308]" 
                style={{ width: '75%' }}
              />
            </div>
          </div>

          {/* Glowing Gift Box Decoration (Bottom Right) */}
          <div className="absolute bottom-1 right-1 flex flex-col items-center justify-end z-10 scale-[0.75] origin-bottom-right">
            {/* Gift Box Drop Shadow Wrapper */}
            <div className="drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] text-4xl">
              🎁
            </div>
          </div>
        </div>

      </div>

    </div>
  );
});

TodayStreakCard.displayName = 'TodayStreakCard';
