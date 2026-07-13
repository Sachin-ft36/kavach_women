import React, { useState } from 'react';
import { Info, Calendar, Sparkles, X, ArrowRight } from 'lucide-react';
import { useKavachStore } from '../../../state/useKavachStore';

// Face Component (Bivhinno mukher expression er jonno SVG)
const Face = ({ type, className = "w-full h-full" }) => {
  const getFacePaths = () => {
    switch (type) {
      case 'great':
        return (
          <>
            {/* Surjer roshmi (Sun rays) */}
            <path d="M50 8 L50 15 M50 85 L50 92 M8 50 L15 50 M85 50 L92 50 M20 20 L25 25 M80 80 L75 75 M20 80 L25 75 M80 20 L75 25" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="32" fill="url(#gradGreat)" />
            {/* Chokh o Mukh */}
            <path d="M40 45 Q40 40 43 45" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M60 45 Q60 40 57 45" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M35 55 Q50 70 65 55 Z" fill="#78350F" />
            <path d="M45 60 Q50 65 55 60 Z" fill="#EF4444" /> {/* Jihba */}
          </>
        );
      case 'good':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradGood)" />
            <circle cx="38" cy="42" r="4" fill="#064E3B" />
            <circle cx="62" cy="42" r="4" fill="#064E3B" />
            <path d="M35 58 Q50 70 65 58" stroke="#064E3B" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'okay':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradOkay)" />
            <path d="M36 42 L40 42" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M60 42 L64 42" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <path d="M38 60 L62 60" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          </>
        );
      case 'low':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradLow)" />
            <path d="M35 45 Q38 40 41 45" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M59 45 Q62 40 65 45" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M40 62 Q50 55 60 62" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'help':
        return (
          <>
            <circle cx="50" cy="50" r="38" fill="url(#gradHelp)" />
            {/* Vru (Eyebrows) */}
            <path d="M32 38 Q38 35 42 40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M68 38 Q62 35 58 40" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="46" r="3.5" fill="#7F1D1D" />
            <circle cx="62" cy="46" r="3.5" fill="#7F1D1D" />
            <path d="M40 65 Q50 55 60 65" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Kanna (Tear) */}
            <path d="M38 52 Q38 58 35 55" fill="#93C5FD" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="gradGreat" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <radialGradient id="gradGood" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </radialGradient>
        <radialGradient id="gradOkay" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
        <radialGradient id="gradLow" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </radialGradient>
        <radialGradient id="gradHelp" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#EF4444" />
        </radialGradient>
      </defs>
      {getFacePaths()}
    </svg>
  );
};

export const MoodCheckInCard = React.memo(({ isNight }: { isNight: boolean }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Mejajer data list (Mood options data)
  const moodOptions = [
    { id: 'great', label: 'Great', icon: 'great' },
    { id: 'good', label: 'Good', icon: 'good' },
    { id: 'okay', label: 'Okay', icon: 'okay' },
    { id: 'low', label: 'Low', icon: 'low' },
    { id: 'help', label: 'Need Help', icon: 'help' }
  ];

  // Soptahaer itihas (Weekly history data)
  const weeklyHistory = [
    { day: 'M', mood: 'good' },
    { day: 'T', mood: 'okay' },
    { day: 'W', mood: 'good' },
    { day: 'T', mood: 'low' },
    { day: 'F', mood: 'okay' },
    { day: 'S', mood: 'good' },
    { day: 'S', mood: 'good' }
  ];

  return (
    <div className={`w-full rounded-[20px] p-1.5 flex flex-col justify-start gap-1.5 border ${
      isNight ? 'bg-[#100B1D] border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]' : 'bg-white border-slate-200/50 shadow-sm'
    } min-h-[280px] relative overflow-visible font-sans text-white`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        `
      }} />
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex gap-1 items-center">
          {/* Header Icon */}
          <div className="w-5 h-5 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <defs>
                <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8B4FE" />
                  <stop offset="100%" stopColor="#9333EA" />
                </linearGradient>
              </defs>
              <path fill="url(#heartGrad)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              {/* Smiley face on heart */}
              <circle cx="8" cy="9" r="1.2" fill="#3B0764" />
              <circle cx="16" cy="9" r="1.2" fill="#3B0764" />
              <path d="M10 13c1 1.5 3 1.5 4 0" stroke="#3B0764" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-[8px] font-black tracking-wider text-white/90 leading-none">MOOD CHECK-IN</h1>
            <p className="text-[6px] text-gray-400 mt-0.5 leading-none">How are you feeling today?</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer">
          <Info size={10} className="opacity-70" />
        </button>
      </div>

      {/* Mood Selection Row */}
      <div className="flex justify-between items-end relative z-10 px-0.5 w-full">
        {moodOptions.map((mood) => {
          const isActive = selectedMood === mood.id;
          return (
            <div 
              key={mood.id} 
              onClick={() => setSelectedMood(mood.id)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              {/* Face and Ring Container */}
              <div className="relative">
                {/* Selected State Effects */}
                {isActive && (
                  <>
                    {/* Perfectly centered ring */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28px] h-[28px] rounded-full border-[1.5px] border-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.4)] pointer-events-none" />
                    
                    {/* Particles / Stars */}
                    <div className="absolute -top-1.5 -left-1.5 text-[#FDBA74] text-[5px]">✨</div>
                    
                    {/* Checkmark Badge */}
                    <div className="absolute -top-1 -right-1 bg-pink-400 rounded-full w-[10px] h-[10px] flex items-center justify-center border-[1.2px] border-[#100B1D] z-20 shadow-sm">
                      <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                )}
                
                <div className={`w-[22px] h-[22px] relative z-10 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}>
                  <Face type={mood.icon} />
                </div>
              </div>
              
              <span className={`text-[6px] font-[800] ${isActive ? 'text-pink-400' : 'text-gray-400'}`} style={isActive ? { fontFamily: "'Nunito', sans-serif" } : {}}>
                {mood.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hero Card (Support Banner - Only shows when selectedMood is low or help) */}
      {(selectedMood === 'low' || selectedMood === 'help') ? (
        <div className="relative bg-gradient-to-br from-[#2D1B4E] to-[#160B2E] rounded-[12px] p-2.5 pt-3 pb-2.5 border border-purple-500/20 my-0.5 overflow-hidden text-left w-full">
          {/* Card background glowing dots */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0.5 left-1 text-purple-300 text-[5px]">✦</div>
            <div className="absolute bottom-2 right-1/2 text-purple-400 text-[4px]">✦</div>
          </div>

          <div className="relative z-10 w-[70%] mb-2">
            <h2 className="text-[8.5px] font-[800] leading-[1.2] mb-0.5 text-white">
              It's okay to have <br/> 
              <span className="relative inline-block mr-0.5">
                a
                <span className="absolute -bottom-0.5 left-0 w-2 h-[0.8px] bg-[#D946EF] rounded-full"></span>
              </span>
              <span className="text-[#D946EF]">difficult day.</span>
            </h2>
            <p className="text-[7px] text-gray-300 leading-tight">
              You're not alone. We're here.
            </p>
          </div>

          {/* 3D Hugging Heart Illustration (SVG Custom) */}
          <div className="absolute right-[-10px] top-[-5px] w-[50px] h-[50px] pointer-events-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <defs>
                <radialGradient id="heart3d" cx="40%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="60%" stopColor="#7E22CE" />
                  <stop offset="100%" stopColor="#4C1D95" />
                </radialGradient>
                <linearGradient id="armLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F472B6" />
                  <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
                <linearGradient id="armRight" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#F472B6" />
                  <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
              </defs>
              
              {/* Back Arm (Right) */}
              <path d="M80 65 Q95 65 95 50 Q95 40 85 45 L70 55" stroke="url(#armRight)" strokeWidth="8" strokeLinecap="round" fill="none" />
              
              {/* Main Heart */}
              <path fill="url(#heart3d)" d="M50 85 L44 79.5 C25 62 12 50 12 35 C12 22 22 12 35 12 C42.5 12 49 15.5 50 21 C51 15.5 57.5 12 65 12 C78 12 88 22 88 35 C88 50 75 62 56 79.5 L50 85 Z" />
              
              {/* Front Arms wrapping */}
              {/* Left Arm wrapping to front */}
              <path d="M15 50 Q5 60 25 70 C35 75 45 70 55 68" stroke="url(#armLeft)" strokeWidth="9" strokeLinecap="round" fill="none" />
              {/* Right Arm wrapping to front */}
              <path d="M85 55 Q95 65 75 75 C65 80 50 75 45 72" stroke="url(#armRight)" strokeWidth="9" strokeLinecap="round" fill="none" />
              
              {/* Cute little hands (fingers) */}
              <path d="M55 64 L50 66 M55 68 L50 70 M53 72 L49 73" stroke="#FCE7F3" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M45 68 L50 70 M45 72 L50 74 M47 76 L51 77" stroke="#FCE7F3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <button 
            onClick={() => useKavachStore.getState().setActiveTab('talk_to_someone')}
            className="w-full relative z-10 bg-gradient-to-r from-[#F43F5E] via-[#D946EF] to-[#8B5CF6] text-white py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity shadow-[0_4px_15px_rgba(217,70,239,0.3)] border-none cursor-pointer text-[8.5px]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              <path d="M8 10h8v2H8zm0 4h5v2H8z" fill="#FFF" />
            </svg>
            Enter Safe Space
            <ArrowRight size={10} className="absolute right-3" />
          </button>
        </div>
      ) : null}

      {/* Mood History Section */}
      <div className="bg-[#171026] rounded-xl p-2 border border-white/5 flex flex-col gap-1 w-full">
        <div className="flex gap-1.5 items-center text-left">
          <div className="bg-[#261A3F] p-1 rounded-full">
            <Calendar size={12} className="text-purple-300" />
          </div>
          <div>
            <h3 className="text-[9px] font-semibold text-white leading-none">Mood History</h3>
            <p className="text-[7px] text-gray-400 mt-0.5 leading-none">This Week</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center w-full px-1 mt-1.5">
          {weeklyHistory.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 relative">
              <span className="text-[7.5px] text-gray-400 font-medium leading-none">{day.day}</span>
              {day.mood === 'low' && selectedMood === 'low' ? (
                <div className="relative">
                  {/* Active highlight ring for the history icon */}
                  <div className="absolute -inset-0.5 rounded-full border border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                  <div className="w-[14px] h-[14px] relative z-10">
                    <Face type={day.mood} />
                  </div>
                </div>
              ) : (
                <div className="w-[14px] h-[14px] opacity-80">
                   <Face type={day.mood} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="bg-[#120924] rounded-[10px] p-1 border border-[#3B1E63] flex items-center gap-1 w-full text-left">
        {/* Sparkle Icon */}
        <div className="shrink-0 pl-0.5 relative">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_0_10px_rgba(192,132,252,0.55)]">
            <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#C084FC"/>
            <path d="M6 4L6.5 5.5L8 6L6.5 6.5L6 8L5.5 6.5L4 6L5.5 5.5L6 4Z" fill="#F472B6"/>
            <path d="M18 15L18.5 16.5L20 17L18.5 17.5L18 19L17.5 17.5L16 17L17.5 16.5L18 15Z" fill="#C084FC"/>
          </svg>
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-[0.5px]">
            <h3 className="text-[7.5px] font-bold text-[#E5E7EB] leading-none">AI Insight</h3>
            <span className="text-[6.5px] font-bold bg-[#341A5A] text-[#C084FC] px-0.5 py-[0.2px] rounded tracking-wide leading-none">
              NEW
            </span>
          </div>
          <p className="text-[6.8px] text-[#9CA3AF] leading-tight">
            2 difficult days. Reset helps.
          </p>
        </div>

        {/* Action Button & Close */}
        <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
          <button className="flex items-center gap-0.5 px-1 py-0.5 rounded-full border border-[#4C287B] bg-[#160A2A] hover:bg-[#2A154D] transition-colors border-none cursor-pointer">
            {/* Lotus Icon */}
            <svg width="6" height="6" viewBox="0 0 24 24" fill="#C084FC">
              <path d="M12 22C12 22 9 16 12 10C15 16 12 22 12 22Z" />
              <path d="M12 22C12 22 5 18 5 12C7 12 12 18 12 18Z" opacity="0.8" />
              <path d="M12 22C12 22 19 18 19 12C17 12 12 18 12 18Z" opacity="0.8" />
              <path d="M5 12C5 12 2 15 2 18C4 18 5 16 5 16Z" opacity="0.6"/>
              <path d="M19 12C19 12 22 15 22 18C20 18 19 16 19 16Z" opacity="0.6"/>
            </svg>
            <span className="text-[6.5px] font-medium text-[#D8B4FE]">Reset</span>
          </button>
        </div>
      </div>

    </div>
  );
});

MoodCheckInCard.displayName = 'MoodCheckInCard';
