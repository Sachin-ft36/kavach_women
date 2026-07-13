import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, BarChart2, Trophy, Share2, ChevronRight, Flame, RotateCcw, Gift, Star, TrendingUp, X } from 'lucide-react';
import { useStreakData, MILESTONES, TIER_COLORS } from '../hooks/useStreakData';
import { useTimeTheme } from '../../../hooks/useTimeTheme';

interface StreakDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
}

// ─── Month Calendar ────────────────────────────────────────────────────────────
const MonthCalendar = ({ isNight, data }: { isNight: boolean; data: any }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0

  const monthName = today.toLocaleString('en-IN', { month: 'long' });
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayDate = today.getDate();

  // Compute which dates are completed based on streak data
  const completedDates = new Set<number>();
  const missedDates = new Set<number>();

  if (data.lastCheckInDate && data.currentStreak > 0) {
    const lastCheckin = new Date(data.lastCheckInDate);
    for (let i = 0; i < data.currentStreak; i++) {
      const d = new Date(lastCheckin);
      d.setDate(lastCheckin.getDate() - i);
      if (d.getMonth() === month && d.getFullYear() === year) {
        completedDates.add(d.getDate());
      }
    }
  }

  // Missed: days before today that are not in completed set (only past the start of current month)
  const startDayNum = data.startDate ? Math.max(1, new Date(data.startDate).getDate()) : todayDate;
  for (let d = startDayNum; d < todayDate; d++) {
    if (!completedDates.has(d)) missedDates.add(d);
  }

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

      <div className="grid grid-cols-7 gap-[3px] mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className={`text-center text-[8px] font-bold ${isNight ? 'text-white/35' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === todayDate;
          const isDone = completedDates.has(day);
          const isMissed = missedDates.has(day);
          const isFuture = day > todayDate;

          return (
            <div key={day} className="flex items-center justify-center">
              <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold
                ${isToday
                  ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                  : isDone
                  ? isNight
                    ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                  : isMissed
                  ? isNight
                    ? 'bg-red-900/20 text-red-400 border border-red-700/30'
                    : 'bg-red-50 text-red-400 border border-red-200'
                  : isFuture
                  ? isNight ? 'text-white/20' : 'text-gray-300'
                  : isNight ? 'text-white/20' : 'text-gray-300'
                }`}
              >
                {isToday ? <Flame size={10} fill="currentColor" /> : isDone ? <Check size={8} strokeWidth={3} /> : isMissed ? <X size={8} strokeWidth={3} /> : <span>{day}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`flex items-center gap-3 mt-2.5 pt-2 border-t ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        {[
          { color: isNight ? 'bg-emerald-500/30' : 'bg-emerald-100', label: 'Completed' },
          { color: 'bg-orange-500', label: 'Today' },
          { color: isNight ? 'bg-red-900/30' : 'bg-red-100', label: 'Missed' },
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
const MilestoneBadges = ({
  currentStreak,
  milestonesClaimed,
  onClaim,
  isNight,
}: {
  currentStreak: number;
  milestonesClaimed: number[];
  onClaim: (days: number) => void;
  isNight: boolean;
}) => {
  const tierStyle: Record<string, { bg: string; border: string; text: string }> = {
    bronze:  { bg: '#92400e', border: '#d97706', text: '#fbbf24' },
    silver:  { bg: '#334155', border: '#94a3b8', text: '#cbd5e1' },
    gold:    { bg: '#78350f', border: '#f59e0b', text: '#fde68a' },
    diamond: { bg: '#164e63', border: '#67e8f9', text: '#a5f3fc' },
  };

  return (
    <div className="flex gap-2 justify-between">
      {MILESTONES.map((m) => {
        const unlocked = currentStreak >= m.days;
        const claimed = milestonesClaimed.includes(m.days);
        const ts = tierStyle[m.tier];
        return (
          <div
            key={m.days}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ opacity: unlocked ? 1 : 0.38 }}
          >
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[20px] border"
              style={{
                background: unlocked ? ts.bg : isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderColor: unlocked ? ts.border : isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                boxShadow: unlocked ? `0 0 12px ${ts.border}55` : 'none',
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
            <span className={`text-[6px] font-medium capitalize ${isNight ? 'text-white/30' : 'text-gray-400'}`}>{m.tier}</span>
            {/* Claim button */}
            {unlocked && !claimed && (
              <button
                onClick={() => onClaim(m.days)}
                className="mt-0.5 px-2 py-0.5 rounded-full text-[6.5px] font-bold bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-sm active:scale-95"
              >
                Claim!
              </button>
            )}
            {claimed && (
              <span className={`mt-0.5 text-[6px] font-bold ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>✓ Claimed</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Streak Statistics ─────────────────────────────────────────────────────────
const StatsGrid = ({ data, isNight }: { data: any; isNight: boolean }) => {
  const stats = [
    { label: 'Current Streak', value: `${data.currentStreak}`, unit: 'days', color: 'text-orange-400', icon: <Flame size={14} fill="currentColor" className="text-orange-400" /> },
    { label: 'Longest Streak', value: `${data.longestStreak}`, unit: 'days', color: 'text-emerald-400', icon: <Trophy size={14} className="text-emerald-400" /> },
    { label: 'Total Check-ins', value: `${data.totalCheckIns}`, unit: '', color: 'text-blue-400', icon: <Check size={14} className="text-blue-400" strokeWidth={3} /> },
    { label: 'Features Used', value: `${data.featuresUsed}`, unit: '', color: 'text-purple-400', icon: <Star size={14} className="text-purple-400" fill="currentColor" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-[14px] p-3 flex flex-row items-center gap-2.5 ${
            isNight ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-black/[0.06] shadow-sm'
          }`}
        >
          <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${isNight ? 'bg-white/[0.06]' : 'bg-gray-50'}`}>
            {s.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-[18px] font-black leading-none ${s.color}`}>{s.value}<span className="text-[9px] ml-0.5 opacity-70">{s.unit}</span></span>
            <span className={`text-[8px] font-medium mt-0.5 truncate ${isNight ? 'text-white/40' : 'text-gray-500'}`}>{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Streak History Mini Graph ─────────────────────────────────────────────────
const StreakHistoryGraph = ({ data, isNight }: { data: any; isNight: boolean }) => {
  const avgStreak = data.averageStreakLength || 0;
  const current = data.currentStreak || 0;
  const longest = data.longestStreak || 1;

  // Build real daily streak counts from actual check-in history
  const today = new Date();
  const bars = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 1);
    const dateStr = d.toISOString().split('T')[0];
    // Check if this date falls within the current streak window
    let height = 0;
    if (data.lastCheckInDate && data.currentStreak > 0) {
      const lastDate = new Date(data.lastCheckInDate);
      const startDate = new Date(lastDate);
      startDate.setDate(lastDate.getDate() - (data.currentStreak - 1));
      const startStr = startDate.toISOString().split('T')[0];
      if (dateStr >= startStr && dateStr <= data.lastCheckInDate) {
        // Was in streak
        const diffMs = new Date(dateStr).getTime() - new Date(startStr).getTime();
        const dayNum = Math.round(diffMs / 86400000) + 1;
        height = dayNum;
      }
    }
    return { label, height, dateStr };
  });

  const maxH = Math.max(...bars.map(b => b.height), 1);

  return (
    <div className={`rounded-[18px] p-3 ${isNight ? 'bg-white/[0.04] border border-white/[0.07]' : 'bg-white/80 border border-black/[0.06] shadow-sm'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-white/60' : 'text-gray-500'}`}>Streak History</span>
        <div className={`flex items-center gap-1 text-[9px] font-semibold ${isNight ? 'text-white/40' : 'text-gray-400'}`}>
          <TrendingUp size={10} />
          Avg: {avgStreak}d
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-[40px]">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-[4px] transition-all duration-500 ${
                i === 6
                  ? 'bg-gradient-to-t from-orange-500 to-orange-400'
                  : isNight ? 'bg-white/15' : 'bg-orange-100'
              }`}
              style={{ height: `${(b.height / maxH) * 36}px`, minHeight: 4 }}
            />
            <span className={`text-[7px] font-bold ${i === 6 ? (isNight ? 'text-orange-400' : 'text-orange-500') : isNight ? 'text-white/30' : 'text-gray-400'}`}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
      <div className={`mt-2 pt-2 border-t flex items-center justify-between ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <span className={`text-[8px] font-semibold ${isNight ? 'text-white/40' : 'text-gray-400'}`}>
          Average Streak: <span className={isNight ? 'text-white/70' : 'text-gray-700'}>{avgStreak}d</span>
        </span>
        <span className={`text-[8px] font-semibold ${isNight ? 'text-white/40' : 'text-gray-400'}`}>
          Best Month: <span className={isNight ? 'text-white/70' : 'text-gray-700'}>{longest}d</span>
        </span>
      </div>
    </div>
  );
};

// ─── Main Sheet ────────────────────────────────────────────────────────────────
export const StreakDetailSheet = ({ isOpen, onClose, isNight }: StreakDetailSheetProps) => {
  const { themeFolder } = useTimeTheme();
  const {
    data,
    streakState,
    exactMilestone,
    nextMilestone,
    daysToNext,
    doCheckIn,
    checkedInToday,
    restartStreak,
    claimMilestone,
    TIER_COLORS: tc,
  } = useStreakData();

  const bgColor = isNight ? '#05050a' : '#FFF8F1';
  const tierColors = exactMilestone ? tc[exactMilestone.tier] : null;

  const topBarGradient = exactMilestone
    ? exactMilestone.tier === 'diamond'
      ? 'from-cyan-400 to-blue-500'
      : exactMilestone.tier === 'gold'
      ? 'from-yellow-400 to-amber-500'
      : exactMilestone.tier === 'silver'
      ? 'from-slate-400 to-slate-300'
      : 'from-amber-500 to-orange-400'
    : streakState === 'broken'
    ? 'from-red-500 to-red-400'
    : 'from-orange-500 to-orange-400';

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
            style={{ background: bgColor }}
          >
            {/* Top color bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${topBarGradient} shrink-0`} />

            {/* Night glow */}
            {isNight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-gradient-to-b from-orange-500/8 to-transparent blur-[80px] pointer-events-none" />
            )}

            {/* Header */}
            <div
              className="sticky top-0 z-10 px-4 pt-4 pb-3 flex items-center justify-between shrink-0"
              style={{ background: bgColor, borderBottom: isNight ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
            >
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 ${isNight ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.05] text-gray-600'}`}
              >
                <ArrowLeft size={16} />
              </button>
              <h1 className={`text-[15px] font-bold ${isNight ? 'text-white' : 'text-gray-900'}`}>Safety Streak</h1>
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 ${isNight ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.05] text-gray-600'}`}
              >
                <Share2 size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-4 pt-4 pb-24 flex flex-col gap-4">

              {/* ─── Hero Number ─── */}
              <div className="relative flex flex-col items-center pt-2 pb-3">
                <img
                  src={isNight ? '/assets/dashboard_assets/night/streak.png' : `/assets/dashboard_assets/${themeFolder}/streak.png`}
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-15 rounded-[20px]"
                  alt=""
                  style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)' }}
                />
                <div className="relative z-10 flex flex-col items-center w-full">

                  {/* Streak broken banner */}
                  {streakState === 'broken' && (
                    <div className={`mb-3 w-full rounded-[14px] p-3 flex flex-col gap-1.5 text-center ${isNight ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'}`}>
                      <div className="text-[22px]">💔</div>
                      <p className={`text-[12px] font-bold ${isNight ? 'text-red-400' : 'text-red-600'}`}>Streak Broken</p>
                      <p className={`text-[10px] ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
                        Don't worry, let's start again today.
                      </p>
                      {data.streakBrokenDate && (
                        <p className={`text-[9px] font-semibold ${isNight ? 'text-white/40' : 'text-gray-400'}`}>
                          Streak Broken on {new Date(data.streakBrokenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      <button
                        onClick={() => { restartStreak(); onClose(); }}
                        className="mt-1 w-full py-2.5 rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.35)] active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={12} /> Restart Streak
                      </button>
                    </div>
                  )}

                  <span className={`text-[52px] font-black leading-none ${streakState === 'broken' ? (isNight ? 'text-white/40' : 'text-gray-300') : (isNight ? 'text-white drop-shadow-lg' : 'text-gray-900')}`}>
                    {data.currentStreak}
                  </span>
                  <span className={`text-[14px] font-bold mt-[-4px] ${isNight ? 'text-white/60' : 'text-gray-500'}`}>Days</span>

                  {/* Badge pill */}
                  {exactMilestone && (
                    <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isNight ? `${tierColors?.bg} ${tierColors?.border}` : 'bg-amber-50 border-amber-200'}`}>
                      <span className="text-[12px]">{exactMilestone.badge}</span>
                      <span className={`text-[10px] font-bold ${isNight ? tierColors?.text : 'text-amber-700'}`}>{exactMilestone.label}</span>
                    </div>
                  )}
                  {streakState === 'active' && (
                    <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isNight ? 'bg-orange-500/15 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                      <Flame size={11} fill="currentColor" className="text-orange-500" />
                      <span className={`text-[10px] font-bold ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>On Fire!</span>
                    </div>
                  )}

                  <p className={`mt-2 text-[11px] font-medium text-center ${isNight ? 'text-white/55' : 'text-gray-500'}`}>
                    {exactMilestone?.message ?? (streakState === 'broken' ? "Every day is a new beginning. You've got this!" : "Keep it going! You're doing great.")}
                  </p>

                  {/* Performance row */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isNight ? 'bg-white/[0.05]' : 'bg-black/[0.04]'}`}>
                      <Trophy size={10} className={isNight ? 'text-yellow-400' : 'text-yellow-600'} fill="currentColor" />
                      <span className={`text-[9px] font-semibold ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
                        Your Best: <span className={isNight ? 'text-white/80' : 'text-gray-800'}>{data.longestStreak} Days</span>
                      </span>
                    </div>
                    {data.totalCheckIns > 0 && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isNight ? 'bg-white/[0.05]' : 'bg-black/[0.04]'}`}>
                        <span className={`text-[9px] font-semibold ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
                          Top <span className={isNight ? 'text-white/80' : 'text-gray-800'}>{Math.max(1, Math.round(100 - (data.currentStreak / Math.max(data.longestStreak, 1)) * 95))}%</span> of Kavach users
                        </span>
                      </div>
                    )}
                  </div>

                  {nextMilestone && daysToNext > 0 && (
                    <p className={`mt-1.5 text-[9px] font-medium ${isNight ? 'text-white/35' : 'text-gray-400'}`}>
                      {daysToNext} more day{daysToNext > 1 ? 's' : ''} to unlock {nextMilestone.label} {nextMilestone.badge}
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Stats Grid ─── */}
              <section>
                <SectionTitle label="Streak Statistics" icon={<BarChart2 size={13} />} isNight={isNight} />
                <StatsGrid data={data} isNight={isNight} />
              </section>

              {/* ─── History Graph ─── */}
              {data.totalCheckIns > 0 && (
                <section>
                  <SectionTitle label="Streak History" icon={<TrendingUp size={13} />} isNight={isNight} />
                  <StreakHistoryGraph data={data} isNight={isNight} />
                </section>
              )}

              {/* ─── Calendar ─── */}
              <section>
                <SectionTitle label="This Month" isNight={isNight} />
                <MonthCalendar isNight={isNight} data={data} />
              </section>

              {/* ─── Milestones ─── */}
              <section>
                <SectionTitle label="Milestones & Rewards" icon={<Gift size={13} />} isNight={isNight} />
                <MilestoneBadges
                  currentStreak={data.currentStreak}
                  milestonesClaimed={data.milestonesClaimed}
                  onClaim={claimMilestone}
                  isNight={isNight}
                />
              </section>

              {/* ─── How to build streak ─── */}
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
                      className={`flex items-center justify-between px-3.5 py-2.5 ${i < arr.length - 1 ? (isNight ? 'border-b border-white/[0.05]' : 'border-b border-black/[0.05]') : ''} ${isNight ? 'bg-white/[0.03]' : 'bg-white/80'}`}
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

              {/* ─── Check-in CTA ─── */}
              {!checkedInToday && streakState !== 'broken' && (
                <button
                  onClick={() => { doCheckIn(); onClose(); }}
                  className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-transform"
                >
                  ✓ Check In Now — Keep Your Streak!
                </button>
              )}
              {checkedInToday && (
                <div className={`w-full py-3.5 rounded-[16px] flex items-center justify-center gap-2 ${isNight ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'}`}>
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

// ─── Helper ─────────────────────────────────────────────────────────────────────
const SectionTitle = ({ label, icon, isNight }: { label: string; icon?: React.ReactNode; isNight: boolean }) => (
  <div className="flex items-center gap-1.5 mb-2">
    {icon && <span className={isNight ? 'text-white/50' : 'text-gray-500'}>{icon}</span>}
    <span className={`text-[10px] font-bold tracking-wider uppercase ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);
