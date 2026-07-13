import React, { useState } from 'react';
import { Flame, Check, RotateCcw, Zap, X, ChevronRight, Rocket, Sparkles, ShieldCheck, Users, Car, Gift } from 'lucide-react';
import { useTimeTheme } from '../../../hooks/useTimeTheme';
import { useKavachStore } from '../../../state/useKavachStore';
import { useStreakData, MILESTONES } from '../hooks/useStreakData';
import { StreakDetailSheet } from './StreakDetailSheet';
import { StreakPopups } from './StreakPopups';

interface SafetyStreakCardProps {
  isNight: boolean;
}

// ─── Tier Colors ───────────────────────────────────────────────────────────────
const TIER_COLORS = {
  bronze: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
  silver: { bg: 'bg-slate-400/20', border: 'border-slate-300/40', text: 'text-slate-300' },
  gold: { bg: 'bg-yellow-400/20', border: 'border-yellow-400/40', text: 'text-yellow-300' },
  diamond: { bg: 'bg-cyan-400/15', border: 'border-cyan-300/40', text: 'text-cyan-300' },
};

// ─── Week Day Tracker ──────────────────────────────────────────────────────────
const WeekTracker = ({ weekDays, isNight, nextMilestone, daysToNext, checkedInToday }: { weekDays: any[]; isNight: boolean; nextMilestone: any; daysToNext: number; checkedInToday: boolean }) => {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div
      className="mt-auto w-full px-2.5 py-2 rounded-[14px] flex flex-col gap-1.5"
      style={{
        background: isNight
          ? 'rgba(255,255,255,0.15)'
          : '#FDF8F0', // Creamy beige background matching design
        boxShadow: isNight ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex justify-between items-end w-full">
        {weekDays.map((day, i) => {
          return (
            <div key={i} className="flex flex-col items-center gap-[3px]">
              <span
                className={`text-[8px] font-bold tracking-wide ${day.isToday
                    ? isNight ? 'text-orange-400' : 'text-gray-800'
                    : day.status === 'completed'
                      ? isNight ? 'text-white/90' : 'text-gray-700'
                      : isNight ? 'text-white/60' : 'text-gray-500'
                  }`}
              >
                {labels[i]}
              </span>
              {day.status === 'completed' ? (
                <div
                  className={`w-[13px] h-[13px] rounded-full flex items-center justify-center bg-[#10b981]`}
                >
                  <Check size={8} strokeWidth={4} className="text-white" />
                </div>
              ) : day.isToday ? (
                <div
                  className={`w-[13px] h-[13px] rounded-full flex items-center justify-center ${checkedInToday
                      ? 'bg-[#10b981]' // Solid green circle if checked in today
                      : 'border-[1px] border-orange-500 bg-transparent'
                    }`}
                >
                  {checkedInToday ? (
                    <Check size={8} strokeWidth={4} className="text-white" />
                  ) : (
                    <span className={`text-[7px] font-bold ${isNight ? 'text-orange-400' : 'text-gray-900'}`}>
                      {day.streakDayNumber !== null ? day.streakDayNumber : ''}
                    </span>
                  )}
                </div>
              ) : day.status === 'missed' ? (
                <div
                  className={`w-[13px] h-[13px] rounded-full flex items-center justify-center bg-red-100 border border-red-200`}
                >
                  <X size={6} strokeWidth={3} className="text-red-500" />
                </div>
              ) : (
                <div
                  className={`w-[13px] h-[13px] rounded-full flex items-center justify-center ${isNight ? 'bg-white/25' : 'bg-gray-200'
                    }`}
                >
                  {day.streakDayNumber !== null ? (
                    <span className={`text-[6.5px] font-bold ${isNight ? 'text-white/80' : 'text-gray-500'}`}>
                      {day.streakDayNumber}
                    </span>
                  ) : (
                    <div className={`w-1 h-1 rounded-full ${isNight ? 'bg-white/50' : 'bg-black/20'}`} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Milestone Text inside the tracker */}
      {nextMilestone && daysToNext > 0 && (
        <div className={`pt-2 border-t flex items-center justify-between w-full ${isNight ? 'border-white/10' : 'border-[#EAE2D6]'}`}>
          <div className="flex items-center gap-1.5">
            <Flame size={7} className="text-orange-500 shrink-0" fill="currentColor" />
            <span
              className={`text-[6px] whitespace-nowrap font-bold ${isNight ? 'text-white/70' : 'text-gray-800'
                }`}
            >
              {daysToNext} more day{daysToNext > 1 ? 's' : ''} to hit {nextMilestone.days} days streak!
            </span>
          </div>
          <ChevronRight size={8} className="text-orange-500 shrink-0 ml-1" />
        </div>
      )}
    </div>
  );
};

// ─── Main Card ─────────────────────────────────────────────────────────────────
export const SafetyStreakCard = ({ isNight }: SafetyStreakCardProps) => {
  const { themeFolder } = useTimeTheme();
  const { guardianCache } = useKavachStore();
  const hasFamilyMember = guardianCache && guardianCache.length > 0;
  const [hasTriedRideSafe, setHasTriedRideSafe] = useState(false);
  const {
    data,
    streakState,
    nextMilestone,
    exactMilestone,
    daysToNext,
    checkedInToday,
    activePopup,
    popupMilestone,
    startJourney,
    doCheckIn,
    restartStreak,
    dismissPopup,
    weekDays,
  } = useStreakData();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showLevelUp, setShowLevelUp] = React.useState(false);
  const tierColors = exactMilestone ? TIER_COLORS[exactMilestone.tier] : null;

  // Auto-transition to Active State if any Day 1 task is completed
  React.useEffect(() => {
    if (streakState === 'new') {
      if (checkedInToday || hasFamilyMember || hasTriedRideSafe) {
        const timer = setTimeout(() => {
          if (!checkedInToday) {
            doCheckIn();
          }
          startJourney();
        }, 1200); // 1.2s delay to show the tick animation before transitioning
        return () => clearTimeout(timer);
      }
    }
  }, [streakState, checkedInToday, hasFamilyMember, hasTriedRideSafe, doCheckIn, startJourney]);

  const DYNAMIC_BACKGROUNDS = [
    null, // 0 index
    null, // Day 1 (Uses default local image)
    "/assets/streak_bgs/bg_1.png",
    "/assets/streak_bgs/bg_2.png",
    "/assets/streak_bgs/bg_3.png",
    "/assets/streak_bgs/bg_4.png",
    "/assets/streak_bgs/bg_5.png",
    "/assets/streak_bgs/bg_6.png"
  ];

  const currentDayIndex = streakState === 'new' ? 1 : Math.max(1, data.currentStreak || 1);
  const dynamicImage = DYNAMIC_BACKGROUNDS[currentDayIndex % DYNAMIC_BACKGROUNDS.length];
  
  const bgSrc = dynamicImage || (isNight
      ? '/assets/dashboard_assets/night/streak.png'
      : `/assets/dashboard_assets/${themeFolder}/streak.png`);

  return (
    <>
      <div
        className={`rounded-[16px] border flex flex-col relative overflow-hidden flex-1 h-full cursor-pointer active:scale-[0.98] transition-transform ${isNight
            ? 'bg-[#0E0F16]/90 border-white/10'
            : 'bg-[#FFF8F1] border-white/45 shadow-[0_14px_45px_rgba(255,170,120,0.12)]'
          }`}
        onClick={() => setIsSheetOpen(true)}
      >
        {/* Background Image */}
        <img
          src={bgSrc}
          alt="Streak background"
          className={`absolute inset-0 w-full h-full object-cover object-[80%_center] pointer-events-none z-0 ${isNight ? 'opacity-90' : 'opacity-100'
            } [image-rendering:-webkit-optimize-contrast] contrast-[1.25] saturate-[1.2] brightness-[0.95]`}
        />

        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 pointer-events-none z-0 ${isNight
              ? 'bg-gradient-to-br from-black/40 via-transparent to-transparent'
              : 'bg-gradient-to-br from-[#FFE8D6]/15 via-transparent to-transparent'
            }`}
        />
        
        {/* Dark Overlay for Text Clarity (Night Only) */}
        {isNight && <div className="absolute inset-0 pointer-events-none z-0 bg-black/30" />}
        {/* Light Overlay for Text Clarity (Day Only) */}
        {themeFolder === 'morning' && <div className="absolute inset-0 pointer-events-none z-0 bg-sky-100/40" />}
        {/* Warm Overlay for Afternoon */}
        {themeFolder === 'afternoon' && <div className="absolute inset-0 pointer-events-none z-0 bg-[#FFF0E5]/40" />}

        {/* Content */}
        <div className={`relative z-10 flex flex-col h-full p-4 pb-3 ${isNight ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,1)]' : 'drop-shadow-sm'}`}>

          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1 relative w-full">
            <div
              className={`w-[14px] h-[14px] rounded-full flex items-center justify-center ${isNight
                  ? 'bg-orange-500/20 border border-orange-500/30'
                  : 'bg-orange-50 border border-orange-200'
                }`}
            >
              <Flame size={8} className="text-orange-500" fill="currentColor" />
            </div>
            <span
              className={`text-[7.5px] font-extrabold tracking-widest uppercase ${isNight ? 'text-white/80' : 'text-[#2a2a2a] drop-shadow-[0_0_6px_rgba(255,255,255,1)]'
                }`}
            >
              Safety Streak
            </span>
          </div>

          {/* ═══ STATE 1 — NEW USER ═══ */}
          {streakState === 'new' && (
            <>
              <h2
                className={`text-[16px] font-black leading-tight mt-0 mb-1 ${isNight ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]' : 'text-[#2a2a2a]'
                  }`}
              >
                Start your<br />safety journey!
              </h2>
              <p className={`text-[8.5px] font-bold leading-tight ${isNight ? 'text-white/90 drop-shadow-md' : 'text-[#2a2a2a]/90'} mb-auto`}>
                Small steps today,<br />lifelong protection tomorrow.
              </p>

              {/* Tasks Container */}
              <div className={`mt-auto w-full p-1 rounded-[10px] border flex flex-col gap-0.5 shadow-sm ${isNight ? 'bg-[#151923]/90 border-white/20 backdrop-blur-xl' : 'bg-white/95 border-white shadow-[0_-10px_30px_rgba(255,255,255,0.7)] backdrop-blur-md'}`}>
                
                {/* Task 1 */}
                <div 
                  onClick={(e) => { e.stopPropagation(); if (!checkedInToday) doCheckIn(); }}
                  className={`flex justify-between items-center bg-gradient-to-r ${checkedInToday ? 'from-emerald-100/60' : 'from-emerald-50/50'} to-transparent p-[3px] rounded-[6px] ${!checkedInToday ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-[11px] h-[11px] rounded-full bg-emerald-100 flex items-center justify-center">
                      <ShieldCheck size={6} className="text-emerald-600" />
                    </div>
                    <span className={`text-[5.5px] font-extrabold whitespace-nowrap ${isNight ? 'text-white' : 'text-[#2a2a2a]'}`}>Complete your first check-in</span>
                  </div>
                  {checkedInToday ? (
                    <div className="flex items-center text-emerald-500 bg-emerald-50 px-1 rounded-full border border-emerald-100">
                      <span className="text-[5.5px] font-bold mr-[1px] text-emerald-600">1</span>
                      <Check size={5} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <span className="text-[5.5px] font-bold mr-0.5">0</span>
                      <ChevronRight size={5} />
                    </div>
                  )}
                </div>

                {/* Task 2 */}
                <div 
                  className={`flex justify-between items-center bg-gradient-to-r ${hasFamilyMember ? 'from-blue-100/60' : 'from-blue-50/50'} to-transparent p-[3px] rounded-[6px]`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-[11px] h-[11px] rounded-full bg-blue-100 flex items-center justify-center border border-blue-200/50">
                      <Users size={5} className="text-blue-600" />
                    </div>
                    <span className={`text-[5.5px] font-extrabold whitespace-nowrap ${isNight ? 'text-white' : 'text-[#2a2a2a]'}`}>Add one family member</span>
                  </div>
                  {hasFamilyMember ? (
                    <div className="flex items-center text-blue-500 bg-blue-50 px-1 rounded-full border border-blue-100">
                      <span className="text-[5.5px] font-bold mr-[1px] text-blue-600">1</span>
                      <Check size={5} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <span className="text-[5.5px] font-bold mr-0.5">0</span>
                      <ChevronRight size={5} />
                    </div>
                  )}
                </div>

                {/* Task 3 */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setHasTriedRideSafe(true); }}
                  className={`flex justify-between items-center bg-gradient-to-r ${hasTriedRideSafe ? 'from-indigo-100/60' : 'from-indigo-50/50'} to-transparent p-[3px] rounded-[6px] ${!hasTriedRideSafe ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-[11px] h-[11px] rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200/50">
                      <Car size={6} className="text-indigo-600" />
                    </div>
                    <span className={`text-[5.5px] font-extrabold whitespace-nowrap ${isNight ? 'text-white' : 'text-[#2a2a2a]'}`}>Try Ride Safe</span>
                  </div>
                  {hasTriedRideSafe ? (
                    <div className="flex items-center text-indigo-500 bg-indigo-50 px-1 rounded-full border border-indigo-100">
                      <span className="text-[5.5px] font-bold mr-[1px] text-indigo-600">1</span>
                      <Check size={5} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <span className="text-[5.5px] font-bold mr-0.5">0</span>
                      <ChevronRight size={5} />
                    </div>
                  )}
                </div>

                <div className="w-full h-[0.5px] bg-gray-200/80 my-0" />

                {/* Bottom Banner */}
                <div className="flex justify-between items-center gap-1 pt-0.5">
                  <div className="flex items-center gap-1">
                    <div className="w-[10px] h-[10px] flex items-center justify-center bg-red-100 rounded-[2px]">
                      <Gift size={5} className="text-red-500" strokeWidth={2.5} />
                    </div>
                    <span className={`text-[4.5px] font-bold leading-[1.2] ${isNight ? 'text-white/80' : 'text-[#2a2a2a]/80'}`}>
                      Complete any 1 task today<br/>to start your streak.
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); startJourney(); }}
                    className="py-[2px] px-[5px] rounded-[4px] bg-gradient-to-br from-[#FF4E6B] to-[#FF216B] text-white flex flex-col items-center justify-center shadow-[0_3px_10px_rgba(255,78,107,0.3)] active:scale-95 transition-transform"
                  >
                    <span className="text-[6px] font-black leading-tight">Day 1</span>
                    <span className="text-[3.5px] font-extrabold flex items-center gap-[0.5px] opacity-90">Starts Today <ChevronRight size={4} strokeWidth={4} /></span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══ STATE 2 — ACTIVE ═══ */}
          {streakState === 'active' && (
            <>
              <div className="relative w-fit mb-1 mt-0.5">
                <h2
                  className={`text-[32px] font-black leading-none ${isNight ? 'text-white drop-shadow-lg' : 'text-[#2a2a2a] drop-shadow-[0_0_8px_rgba(255,255,255,1)]'
                    }`}
                >
                  {data.currentStreak} Days
                </h2>
                <svg className="absolute -bottom-[8px] left-[5%] w-[90%] h-[8px] overflow-visible" viewBox="0 0 200 10" fill="none">
                  <path d="M4 6 C50 2, 120 2, 196 5" stroke="#F6A000" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>

              <div
                className={`flex items-center gap-1 rounded-full px-2 py-[3px] w-fit mt-3 ${isNight ? 'bg-orange-900/40 border border-orange-500/40' : 'bg-orange-400 shadow-sm'
                  }`}
              >
                <Flame size={7} className={isNight ? 'text-orange-400' : 'text-white'} fill="currentColor" />
                <span className={`text-[7.5px] font-bold ${isNight ? 'text-orange-400' : 'text-white'}`}>On Fire!</span>
              </div>

              <p
                className={`text-[8.5px] font-semibold leading-[1.3] mt-2 ${isNight ? 'text-white/75' : 'text-[#444] drop-shadow-[0_0_4px_rgba(255,255,255,1)]'
                  }`}
              >
                Keep it going!<br />You're doing great.
              </p>

              <WeekTracker weekDays={weekDays} isNight={isNight} nextMilestone={nextMilestone} daysToNext={daysToNext} checkedInToday={checkedInToday} />

              {!checkedInToday && (
                <button
                  onClick={(e) => { e.stopPropagation(); doCheckIn(); }}
                  className="mt-2 w-full py-[6px] rounded-[10px] bg-gradient-to-r from-orange-500/80 to-orange-400/80 text-white text-[9px] font-bold active:scale-95 transition-transform"
                >
                  ✓ Check In Today
                </button>
              )}
            </>
          )}

          {/* ═══ STATE 3 — MILESTONE ═══ */}
          {streakState === 'milestone' && exactMilestone && (
            <>
              <div className="relative w-fit mb-1 mt-0.5">
                <h2
                  className={`text-[32px] font-black leading-none ${isNight ? 'text-white drop-shadow-lg' : 'text-[#2a2a2a] drop-shadow-[0_0_8px_rgba(255,255,255,1)]'
                    }`}
                >
                  {data.currentStreak} Days
                </h2>
                <svg className="absolute -bottom-[8px] left-[5%] w-[90%] h-[8px] overflow-visible" viewBox="0 0 200 10" fill="none">
                  <path d="M4 6 C50 2, 120 2, 196 5" stroke="#F6A000" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>

              <div
                className={`flex items-center gap-1 rounded-full px-2 py-[3px] w-fit mt-3 border ${isNight
                    ? `${tierColors?.bg} ${tierColors?.border}`
                    : 'bg-white/80 border-amber-300/60 shadow-sm'
                  }`}
              >
                <span className="text-[8px]">{exactMilestone.badge}</span>
                <span className={`text-[7.5px] font-bold ${isNight ? tierColors?.text : 'text-amber-700'}`}>
                  {exactMilestone.label}
                </span>
              </div>

              <p
                className={`text-[8.5px] font-semibold leading-[1.3] mt-2 ${isNight ? 'text-white/80' : 'text-[#444] drop-shadow-[0_0_4px_rgba(255,255,255,1)]'
                  }`}
              >
                {exactMilestone.message}
              </p>

              <WeekTracker weekDays={weekDays} isNight={isNight} nextMilestone={nextMilestone} daysToNext={daysToNext} checkedInToday={checkedInToday} />

              <span
                className={`text-[7px] font-medium mt-0.5 ${isNight ? 'text-white/40' : 'text-gray-500'}`}
              >
                Keep going to unlock bigger milestones! →
              </span>
            </>
          )}

          {/* ═══ STATE 4 — BROKEN ═══ */}
          {streakState === 'broken' && (
            <>
              <div className="relative w-fit mb-1 mt-0.5">
                <h2
                  className={`text-[32px] font-black leading-none ${isNight ? 'text-white/60' : 'text-gray-400 drop-shadow-[0_0_8px_rgba(255,255,255,1)]'
                    }`}
                >
                  {data.currentStreak} Days
                </h2>
              </div>

              <div
                className={`flex items-center gap-1 rounded-full px-2 py-[3px] w-fit mt-1 border ${isNight ? 'bg-red-900/30 border-red-700/40' : 'bg-red-50 border-red-200 shadow-sm'
                  }`}
              >
                <X size={7} className={isNight ? 'text-red-400' : 'text-red-500'} strokeWidth={3} />
                <span className={`text-[7.5px] font-bold ${isNight ? 'text-red-400' : 'text-red-500'}`}>
                  Streak Broken
                </span>
              </div>

              <p
                className={`text-[8.5px] font-semibold leading-[1.3] mt-2 ${isNight ? 'text-white/70' : 'text-[#555] drop-shadow-[0_0_4px_rgba(255,255,255,1)]'
                  }`}
              >
                No worries, every day<br />is a new chance to begin.
              </p>

              <div className="mt-auto flex flex-col gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); restartStreak(); }}
                  className="w-full py-[7px] rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[10px] font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] active:scale-95 transition-transform flex items-center justify-center gap-1"
                >
                  <RotateCcw size={9} />
                  Restart Streak
                </button>
                <p
                  className={`text-center text-[7px] font-medium ${isNight ? 'text-white/35' : 'text-gray-400'
                    }`}
                >
                  Start again today and get back on track!
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Detail Sheet */}
      <StreakDetailSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        isNight={isNight}
      />

      {/* Popups */}
      <StreakPopups
        activePopup={activePopup}
        popupMilestone={popupMilestone}
        currentStreak={data.currentStreak}
        longestStreak={data.longestStreak}
        onDismiss={dismissPopup}
        onCheckIn={doCheckIn}
        onRestart={restartStreak}
        isNight={isNight}
      />
    </>
  );
};
