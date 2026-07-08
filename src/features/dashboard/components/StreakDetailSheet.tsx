import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, BarChart2, Trophy, Share2, ChevronRight } from 'lucide-react';
import { useStreakData, MILESTONES } from '../hooks/useStreakData';
import { useTimeTheme } from '../../../hooks/useTimeTheme';

interface StreakDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
const MonthCalendar = ({ isNight }: { isNight: boolean }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Shift so Monday = 0
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

  const monthName = today.toLocaleString('en-IN', { month: 'long' });
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Demo: days 1 to (today-1) are completed, today is current, rest are future
  const todayDate = today.getDate();

  return (
    <div className={`rounded-[18px] p-3 ${isNight ? 'bg-white/[0.04] border border-white/[0.07]' : 'bg-white/80 border border-black/[0.06] shadow-sm'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-[10px] font-bold tracking-wider uppercase ${isNight ? 'text-white/70' : 'text-gray-600'}`}>
          Streak Calendar
        </span>
        <span className={`text-[10px] font-semibold ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
          {monthName} {year}
        </span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-[3px] mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className={`text-center text-[8px] font-bold ${isNight ? 'text-white/35' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-[3px]">
        {/* Empty offset cells */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {/* Actual days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === todayDate;
          const isDone = day < todayDate;
          const isFuture = day > todayDate;

          return (
            <div key={day} className="flex items-center justify-center">
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold
                  ${isToday
                    ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                    : isDone
                    ? isNight
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                    : isNight
                    ? 'text-white/25'
                    : 'text-gray-300'
                  }`}
              >
                {isToday ? (
                  <span>{day}</span>
                ) : isDone ? (
                  <Check size={8} strokeWidth={3} />
                ) : (
                  <span>{day}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex items-center gap-3 mt-2.5 pt-2 border-t ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        {[
          { color: isNight ? 'bg-emerald-500/30' : 'bg-emerald-100', label: 'Completed' },
          { color: 'bg-orange-500', label: 'Today' },
          { color: isNight ? 'bg-white/10' : 'bg-gray-100', label: 'Missed' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`w-[8px] h-[8px] rounded-full ${item.color}`} />
            <span className={`text-[7.5px] font-medium ${isNight ? 'text-white/40' : 'text-gray-400'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Milestone Badges Row ──────────────────────────────────────────────────────
const MilestoneBadges = ({ currentStreak, isNight }: { currentStreak: number; isNight: boolean }) => {
  const tierStyle = {
    bronze:  { bg: '#92400e', border: '#d97706', text: '#fbbf24' },
    silver:  { bg: '#334155', border: '#94a3b8', text: '#cbd5e1' },
    gold:    { bg: '#78350f', border: '#f59e0b', text: '#fde68a' },
    diamond: { bg: '#164e63', border: '#67e8f9', text: '#a5f3fc' },
  };

  return (
    <div className="flex gap-2 justify-between">
      {MILESTONES.map((m) => {
        const unlocked = currentStreak >= m.days;
        const ts = tierStyle[m.tier];
        return (
          <div
            key={m.days}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ opacity: unlocked ? 1 : 0.4 }}
          >
            <div
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] border"
              style={{
                background: unlocked ? ts.bg : isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderColor: unlocked ? ts.border : isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            >
              {unlocked ? m.badge : '🔒'}
            </div>
            <span
              className="text-[7px] font-bold text-center leading-tight"
              style={{ color: unlocked ? (isNight ? ts.text : ts.bg) : isNight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
            >
              {m.days} Days
            </span>
            <span className={`text-[6px] font-medium capitalize ${isNight ? 'text-white/30' : 'text-gray-400'}`}>
              {m.tier}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Stats Row ─────────────────────────────────────────────────────────────────
const StatsRow = ({ data, isNight }: { data: any; isNight: boolean }) => {
  const stats = [
    { label: 'Current', value: `${data.currentStreak}d`, color: 'text-orange-400' },
    { label: 'Longest', value: `${data.longestStreak}d`, color: 'text-emerald-400' },
    { label: 'Check-ins', value: data.totalCheckIns, color: 'text-blue-400' },
    { label: 'Achieved', value: data.streaksAchieved, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-[12px] p-2 flex flex-col items-center gap-0.5 ${
            isNight ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-black/[0.06] shadow-sm'
          }`}
        >
          <span className={`text-[16px] font-black leading-none ${s.color}`}>{s.value}</span>
          <span className={`text-[7px] font-medium ${isNight ? 'text-white/40' : 'text-gray-500'}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Sheet ────────────────────────────────────────────────────────────────
export const StreakDetailSheet = ({ isOpen, onClose, isNight }: StreakDetailSheetProps) => {
  const { themeFolder } = useTimeTheme();
  const { data, streakState, exactMilestone, nextMilestone, daysToNext, doCheckIn, checkedInToday } = useStreakData();

  const bgColor = isNight ? '#05050a' : '#FFF8F1';
  const textColor = isNight ? '#ffffff' : '#1a1a1a';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex flex-col font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="absolute inset-0 flex flex-col overflow-y-auto"
            style={{ background: bgColor, color: textColor }}
          >
            {/* Ambient glow (night only) */}
            {isNight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-gradient-to-b from-orange-500/8 to-transparent blur-[80px] pointer-events-none" />
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 pt-5 pb-3 flex items-center justify-between"
              style={{ background: bgColor, borderBottom: isNight ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
            >
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform ${
                  isNight ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.05] text-gray-600'
                }`}
              >
                <ArrowLeft size={16} />
              </button>
              <h1 className={`text-[15px] font-bold ${isNight ? 'text-white' : 'text-gray-900'}`}>
                Safety Streak
              </h1>
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform ${
                  isNight ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.05] text-gray-600'
                }`}
              >
                <Share2 size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-4 pt-4 pb-32 flex flex-col gap-4">

              {/* Hero: Big number + badge */}
              <div className="flex flex-col items-center pt-2 pb-4 relative">
                {/* Background image blur */}
                <img
                  src={isNight ? '/assets/dashboard_assets/streak.png' : `/assets/dashboard_assets/${themeFolder}/streak.png`}
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-20 rounded-[20px]"
                  alt=""
                  style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
                  }}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <span className={`text-[52px] font-black leading-none ${isNight ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
                    {data.currentStreak}
                  </span>
                  <span className={`text-[14px] font-bold mt-[-4px] ${isNight ? 'text-white/60' : 'text-gray-500'}`}>
                    Days
                  </span>

                  {/* Badge pill */}
                  {exactMilestone ? (
                    <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                      isNight ? 'bg-amber-500/15 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <span className="text-[12px]">{exactMilestone.badge}</span>
                      <span className={`text-[10px] font-bold ${isNight ? 'text-amber-400' : 'text-amber-700'}`}>
                        {exactMilestone.label}
                      </span>
                    </div>
                  ) : streakState === 'active' ? (
                    <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                      isNight ? 'bg-orange-500/15 border-orange-500/30' : 'bg-orange-50 border-orange-200'
                    }`}>
                      <span className="text-[11px]">🔥</span>
                      <span className={`text-[10px] font-bold ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                        On Fire!
                      </span>
                    </div>
                  ) : null}

                  {/* Motivational line */}
                  <p className={`mt-2 text-[11px] font-medium text-center ${isNight ? 'text-white/55' : 'text-gray-500'}`}>
                    {exactMilestone?.message ?? "Keep it going! You're doing great."}
                  </p>

                  {/* Best performance */}
                  <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                    isNight ? 'bg-white/[0.05]' : 'bg-black/[0.04]'
                  }`}>
                    <Trophy size={10} className={isNight ? 'text-yellow-400' : 'text-yellow-600'} fill="currentColor" />
                    <span className={`text-[9px] font-semibold ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
                      Your Best: <span className={isNight ? 'text-white/80' : 'text-gray-800'}>{data.longestStreak} Days</span>
                    </span>
                  </div>

                  {/* Next milestone countdown */}
                  {nextMilestone && daysToNext > 0 && (
                    <p className={`mt-1.5 text-[9px] font-medium ${isNight ? 'text-white/35' : 'text-gray-400'}`}>
                      {daysToNext} more day{daysToNext > 1 ? 's' : ''} to unlock {nextMilestone.label} {nextMilestone.badge}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <section>
                <SectionTitle label="Streak Statistics" icon={<BarChart2 size={13} />} isNight={isNight} />
                <StatsRow data={data} isNight={isNight} />
              </section>

              {/* Calendar */}
              <section>
                <SectionTitle label="This Month" isNight={isNight} />
                <MonthCalendar isNight={isNight} />
              </section>

              {/* Milestones */}
              <section>
                <SectionTitle label="Milestones & Rewards" isNight={isNight} />
                <MilestoneBadges currentStreak={data.currentStreak} isNight={isNight} />
              </section>

              {/* How to earn more */}
              <section>
                <SectionTitle label="How to Build Your Streak" isNight={isNight} />
                <div className={`rounded-[16px] overflow-hidden border ${isNight ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
                  {[
                    { icon: '✅', label: 'Daily Check-in', points: '+1 Day', color: 'text-emerald-400' },
                    { icon: '🛡️', label: 'Use Safety Features', points: '+1 Day', color: 'text-blue-400' },
                    { icon: '👨‍👩‍👧', label: 'Keep Loved Ones Safe', points: '+1 Day', color: 'text-purple-400' },
                    { icon: '🔁', label: 'Stay Consistent', points: '+2 Days', color: 'text-orange-400' },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between px-3.5 py-2.5 ${
                        i < arr.length - 1
                          ? isNight ? 'border-b border-white/[0.05]' : 'border-b border-black/[0.05]'
                          : ''
                      } ${isNight ? 'bg-white/[0.03]' : 'bg-white/80'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[14px]">{item.icon}</span>
                        <span className={`text-[10px] font-medium ${isNight ? 'text-white/70' : 'text-gray-700'}`}>{item.label}</span>
                      </div>
                      <span className={`text-[9px] font-bold ${item.color}`}>{item.points}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Check-in button */}
              {!checkedInToday && (
                <button
                  onClick={() => { doCheckIn(); onClose(); }}
                  className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-transform"
                >
                  ✓ Check In Now — Keep Your Streak!
                </button>
              )}

              {checkedInToday && (
                <div className={`w-full py-3.5 rounded-[16px] flex items-center justify-center gap-2 ${
                  isNight ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <Check size={14} className="text-emerald-400" strokeWidth={3} />
                  <span className={`text-[12px] font-bold ${isNight ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    Checked in today ✓
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ─── Helper ────────────────────────────────────────────────────────────────────
const SectionTitle = ({ label, icon, isNight }: { label: string; icon?: React.ReactNode; isNight: boolean }) => (
  <div className="flex items-center gap-1.5 mb-2">
    {icon && <span className={isNight ? 'text-white/50' : 'text-gray-500'}>{icon}</span>}
    <span className={`text-[10px] font-bold tracking-wider uppercase ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);
