import React, { useState } from 'react';
import { Flame, Check, RotateCcw, Zap, X, ChevronRight, Rocket } from 'lucide-react';
import { useTimeTheme } from '../../../hooks/useTimeTheme';
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
          ? 'rgba(255,255,255,0.06)'
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
                      ? isNight ? 'text-white/60' : 'text-gray-700'
                      : isNight ? 'text-white/30' : 'text-gray-500'
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
                  className={`w-[13px] h-[13px] rounded-full flex items-center justify-center ${isNight ? 'bg-white/10' : 'bg-gray-200'
                    }`}
                >
                  {day.streakDayNumber !== null ? (
                    <span className={`text-[6.5px] font-bold ${isNight ? 'text-white/40' : 'text-gray-500'}`}>
                      {day.streakDayNumber}
                    </span>
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-black/20" />
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

  return (
    <>
      <div
        className={`rounded-[24px] border flex flex-col relative overflow-hidden flex-1 h-full cursor-pointer active:scale-[0.98] transition-transform ${isNight
            ? 'bg-[#0E0F16]/90 border-white/10'
            : 'bg-[#FFF8F1] border-white/45 shadow-[0_14px_45px_rgba(255,170,120,0.12)]'
          }`}
        onClick={() => setIsSheetOpen(true)}
      >
        {/* Background Image */}
        <img
          src={
            isNight
              ? '/assets/dashboard_assets/streak.png'
              : `/assets/dashboard_assets/${themeFolder}/streak.png`
          }
          alt="Streak background"
          className={`absolute inset-0 w-full h-full object-cover object-[80%_center] pointer-events-none z-0 ${isNight ? 'opacity-90' : 'opacity-100'
            }`}
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 28%, black 48%, black 85%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 28%, black 48%, black 85%, transparent 100%)'
          }}
        />

        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 pointer-events-none z-0 ${isNight
              ? 'bg-gradient-to-br from-black/50 to-transparent'
              : 'bg-gradient-to-br from-[#FFE8D6]/35 via-[#FFE8D6]/05 to-transparent'
            }`}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-4 pb-3">

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
            {/* 🛠️ TEMPORARY DEBUG BUTTON TO RESET STREAK */}
            <button
              onClick={(e) => { e.stopPropagation(); restartStreak(); }}
              className={`absolute right-0 text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-blue-100 text-[#1a73e8] shadow-sm active:bg-blue-50 transition-colors z-50`}
            >
              Reset
            </button>
          </div>

          {/* ═══ STATE 1 — NEW USER ═══ */}
          {streakState === 'new' && (
            <>
              <h2
                className={`text-[15px] font-black leading-tight mt-0.5 mb-2 ${isNight ? 'text-white' : 'text-[#2a2a2a] drop-shadow-[0_0_8px_rgba(255,255,255,1)]'
                  }`}
              >
                Start your<br />safety journey!
              </h2>

              <div className="flex flex-col gap-2 mb-3">
                {[
                  'Complete your first check-in',
                  'Add one family member',
                  'Try Ride Safe',
                ].map((task, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-2 transition-all duration-300"
                  >
                    {/* Premium Status Dot */}
                    <div
                      className={`
                        relative flex-none w-[8px] h-[8px] min-w-[8px] min-h-[8px] max-w-[8px] max-h-[8px] rounded-full
                        transition-all duration-300
                        ${
                          isNight
                            ? 'bg-gradient-to-br from-white/35 via-white/12 to-white/5 border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.12)]'
                            : 'bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]'
                        }
                      `}
                    >
                      {/* Inner Shine */}
                      <div
                        className={`
                          absolute top-[1px] left-[1px]
                          w-[2px] h-[2px] rounded-full
                          ${
                            isNight
                              ? 'bg-white/70'
                              : 'bg-white'
                          }
                        `}
                      />

                      {/* Soft Glow */}
                      <div
                        className={`
                          absolute inset-0 rounded-full blur-[5px]
                          ${
                            isNight
                              ? 'bg-white/15'
                              : 'bg-slate-300/30'
                          }
                        `}
                      />
                    </div>

                    {/* Text */}
                    <span
                      className={`
                        text-[7px] font-semibold tracking-[0.015em]
                        transition-all duration-300
                        ${
                          isNight
                            ? 'text-white/82 group-hover:text-white'
                            : 'text-[#424242] group-hover:text-[#111827]'
                        }
                      `}
                      style={{
                        textShadow: isNight
                          ? '0 0 10px rgba(255,255,255,0.12)'
                          : '0 1px 2px rgba(255,255,255,0.9)',
                      }}
                    >
                      {task}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); startJourney(); }}
                  className="w-full flex items-center justify-center gap-1.5 py-[7px] rounded-[12px] bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white text-[10.5px] font-bold shadow-[0_4px_14px_rgba(46,204,113,0.4)] active:scale-95 transition-transform"
                >
                  <Rocket size={12} fill="currentColor" />
                  Start Today!
                </button>
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
        onDismiss={dismissPopup}
        onCheckIn={doCheckIn}
        onRestart={restartStreak}
        isNight={isNight}
      />
    </>
  );
};
