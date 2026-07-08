import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw, Flame, Trophy, Share2 } from 'lucide-react';
import type { PopupType, MilestoneInfo } from '../hooks/useStreakData';

interface StreakPopupsProps {
  activePopup: PopupType;
  popupMilestone: MilestoneInfo | null;
  currentStreak: number;
  onDismiss: () => void;
  onCheckIn: () => void;
  onRestart: () => void;
  isNight: boolean;
}

// ─── Confetti dots ─────────────────────────────────────────────────────────────
const Confetti = () => {
  const dots = [
    { color: '#f97316', x: '15%', y: '12%', size: 6, delay: 0 },
    { color: '#a855f7', x: '80%', y: '10%', size: 8, delay: 0.1 },
    { color: '#22c55e', x: '55%', y: '8%',  size: 5, delay: 0.15 },
    { color: '#f59e0b', x: '30%', y: '18%', size: 7, delay: 0.05 },
    { color: '#3b82f6', x: '70%', y: '20%', size: 6, delay: 0.2 },
    { color: '#ec4899', x: '10%', y: '30%', size: 5, delay: 0.25 },
    { color: '#f97316', x: '90%', y: '25%', size: 4, delay: 0.1 },
    { color: '#a855f7', x: '45%', y: '5%',  size: 5, delay: 0.3 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -10, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, 20, 40, 60], scale: [0, 1, 1, 0] }}
          transition={{ duration: 2, delay: d.delay, repeat: Infinity, repeatDelay: 1 }}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.size,
            height: d.size,
            borderRadius: 2,
            background: d.color,
          }}
        />
      ))}
    </div>
  );
};

// ─── Popup Shell ───────────────────────────────────────────────────────────────
const PopupShell = ({
  isNight,
  onDismiss,
  children,
}: {
  isNight: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-[50000] flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0 font-sans">
    {/* Backdrop */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      className="absolute inset-0 bg-black/55 backdrop-blur-sm"
    />

    {/* Card */}
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className={`relative w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${
        isNight
          ? 'bg-gradient-to-b from-[#141226]/98 to-[#0a0816]/99 border border-white/[0.08]'
          : 'bg-white border border-black/[0.06]'
      }`}
    >
      {/* Close */}
      <button
        onClick={onDismiss}
        className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center z-20 active:scale-90 transition-transform ${
          isNight ? 'bg-white/[0.08] text-white/50' : 'bg-black/[0.06] text-gray-500'
        }`}
      >
        <X size={13} />
      </button>
      {children}
    </motion.div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// POPUP 1 — CHECK-IN DONE ✅
// ═══════════════════════════════════════════════════════════════
const CheckInDonePopup = ({
  streak,
  isNight,
  onDismiss,
}: { streak: number; isNight: boolean; onDismiss: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss}>
    <div className="p-6 pt-7 flex flex-col items-center text-center">
      {/* Icon */}
      <div className={`w-[56px] h-[56px] rounded-full flex items-center justify-center mb-3 ${
        isNight ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200'
      }`}>
        <Check size={24} strokeWidth={3} className="text-emerald-400" />
      </div>

      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>
        +1 Day Added
      </p>
      <h2 className={`text-[20px] font-black mb-1.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        Nice Check-in done!
      </h2>
      <p className={`text-[12px] font-medium mb-1 ${isNight ? 'text-white/55' : 'text-gray-500'}`}>
        Your streak is now
      </p>
      <p className={`text-[40px] font-black leading-none mb-4 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        {streak} Days
      </p>

      <button
        onClick={onDismiss}
        className="w-full py-3 rounded-[14px] bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(34,197,94,0.4)] active:scale-[0.98] transition-transform"
      >
        Great! 🎉
      </button>
    </div>
  </PopupShell>
);

// ═══════════════════════════════════════════════════════════════
// POPUP 2 — MILESTONE REACHED (7 days)
// ═══════════════════════════════════════════════════════════════
const MilestoneReachedPopup = ({
  milestone,
  streak,
  isNight,
  onDismiss,
}: { milestone: MilestoneInfo; streak: number; isNight: boolean; onDismiss: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss}>
    <Confetti />
    <div className="p-6 pt-7 flex flex-col items-center text-center relative z-10">
      {/* Badge emoji */}
      <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center mb-3 text-[32px] ${
        isNight ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
      }`}>
        {milestone.badge}
      </div>

      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isNight ? 'text-amber-400' : 'text-amber-600'}`}>
        Congratulations!
      </p>
      <h2 className={`text-[20px] font-black mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        You've completed
      </h2>
      <p className={`text-[32px] font-black leading-none mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        {streak} Days Streak
      </p>
      <div className={`mt-1.5 mb-3 px-3 py-1 rounded-full border text-[10px] font-bold ${
        isNight ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        {milestone.label} {milestone.badge} Unlocked!
      </div>
      <p className={`text-[11px] font-medium mb-5 ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
        {milestone.message}
      </p>

      <button
        onClick={onDismiss}
        className="w-full py-3 rounded-[14px] bg-gradient-to-r from-amber-500 to-orange-400 text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-transform"
      >
        🏆 See Reward!
      </button>
    </div>
  </PopupShell>
);

// ═══════════════════════════════════════════════════════════════
// POPUP 3 — BIG ACHIEVEMENT (30/100/365 days)
// ═══════════════════════════════════════════════════════════════
const BigAchievementPopup = ({
  milestone,
  streak,
  isNight,
  onDismiss,
}: { milestone: MilestoneInfo; streak: number; isNight: boolean; onDismiss: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss}>
    <Confetti />
    {/* Gold top bar */}
    <div className={`h-1.5 w-full ${
      milestone.tier === 'diamond' ? 'bg-gradient-to-r from-cyan-400 to-blue-500' :
      milestone.tier === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
      'bg-gradient-to-r from-slate-400 to-slate-300'
    }`} />

    <div className="p-6 pt-5 flex flex-col items-center text-center relative z-10">
      {/* Trophy + badge */}
      <div className="relative mb-3">
        <div className={`w-[76px] h-[76px] rounded-full flex items-center justify-center text-[36px] ${
          isNight ? 'bg-yellow-500/10 border border-yellow-500/25' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <Trophy size={36} className="text-yellow-400" fill="currentColor" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-[16px] bg-white border-2 border-yellow-400 shadow-md">
          {milestone.badge}
        </div>
      </div>

      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${
        milestone.tier === 'diamond' ? 'text-cyan-400' :
        milestone.tier === 'gold' ? 'text-yellow-400' : 'text-slate-400'
      }`}>
        Legendary!
      </p>
      <h2 className={`text-[20px] font-black mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        You've completed
      </h2>
      <p className={`text-[36px] font-black leading-none mb-2 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        {streak} Days Streak
      </p>
      <p className={`text-[11px] font-semibold mb-5 ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
        {milestone.message}
      </p>

      <div className="flex gap-2 w-full">
        <button
          onClick={onDismiss}
          className={`flex-1 py-2.5 rounded-[12px] flex items-center justify-center gap-1.5 text-[11px] font-bold border active:scale-[0.98] transition-transform ${
            isNight ? 'border-white/15 text-white/70' : 'border-gray-200 text-gray-600'
          }`}
        >
          <Share2 size={11} />
          Share
        </button>
        <button
          onClick={onDismiss}
          className="flex-[2] py-2.5 rounded-[12px] bg-gradient-to-r from-yellow-500 to-amber-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-transform"
        >
          🎁 View Rewards
        </button>
      </div>
    </div>
  </PopupShell>
);

// ═══════════════════════════════════════════════════════════════
// POPUP 4 — STREAK WARNING ⚠️
// ═══════════════════════════════════════════════════════════════
const StreakWarningPopup = ({
  streak,
  isNight,
  onDismiss,
  onCheckIn,
}: { streak: number; isNight: boolean; onDismiss: () => void; onCheckIn: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss}>
    <div className="p-6 pt-7 flex flex-col items-center text-center">
      {/* Flame icon */}
      <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center mb-3 ${
        isNight ? 'bg-orange-500/15 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'
      }`}>
        <Flame size={26} className="text-orange-400" fill="currentColor" />
      </div>

      <h2 className={`text-[18px] font-black mb-1.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        Don't lose your streak!
      </h2>
      <p className={`text-[12px] font-medium leading-relaxed mb-1 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>
        You're on a <span className={`font-bold ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>{streak} day streak</span>.<br />
        Complete a check-in today to keep it alive.
      </p>

      <div className={`my-3 px-3 py-1.5 rounded-full text-[10px] font-semibold ${
        isNight ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'
      }`}>
        🔥 Streak ends at midnight!
      </div>

      <div className="flex gap-2 w-full mt-1">
        <button
          onClick={onDismiss}
          className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-semibold border active:scale-[0.98] transition-transform ${
            isNight ? 'border-white/12 text-white/50' : 'border-gray-200 text-gray-500'
          }`}
        >
          Maybe later
        </button>
        <button
          onClick={() => { onCheckIn(); onDismiss(); }}
          className="flex-[2] py-2.5 rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-transform"
        >
          ✓ Do It Now
        </button>
      </div>
    </div>
  </PopupShell>
);

// ═══════════════════════════════════════════════════════════════
// POPUP 5 — STREAK BROKEN 💔
// ═══════════════════════════════════════════════════════════════
const StreakBrokenPopup = ({
  isNight,
  onDismiss,
  onRestart,
}: { isNight: boolean; onDismiss: () => void; onRestart: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss}>
    <div className="p-6 pt-7 flex flex-col items-center text-center">
      {/* Broken shield illustration */}
      <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center mb-3 text-[28px] ${
        isNight ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
      }`}>
        💔
      </div>

      <h2 className={`text-[18px] font-black mb-1.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        Streak Broken 😔
      </h2>
      <p className={`text-[12px] font-medium leading-relaxed mb-4 ${isNight ? 'text-white/55' : 'text-gray-500'}`}>
        You missed a day.<br />
        <span className={`font-semibold ${isNight ? 'text-white/80' : 'text-gray-700'}`}>
          It's okay, every day is a new beginning.
        </span>
      </p>

      <div className="flex gap-2 w-full">
        <button
          onClick={onDismiss}
          className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-semibold border active:scale-[0.98] transition-transform ${
            isNight ? 'border-white/12 text-white/50' : 'border-gray-200 text-gray-500'
          }`}
        >
          Not now
        </button>
        <button
          onClick={() => { onRestart(); onDismiss(); }}
          className="flex-[2] py-2.5 rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={11} />
          Restart Now
        </button>
      </div>
    </div>
  </PopupShell>
);

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT — Renders the correct popup
// ═══════════════════════════════════════════════════════════════
export const StreakPopups = ({
  activePopup,
  popupMilestone,
  currentStreak,
  onDismiss,
  onCheckIn,
  onRestart,
  isNight,
}: StreakPopupsProps) => {
  return createPortal(
    <AnimatePresence mode="wait">
      {activePopup === 'checkin_done' && (
        <CheckInDonePopup
          key="checkin"
          streak={currentStreak}
          isNight={isNight}
          onDismiss={onDismiss}
        />
      )}
      {activePopup === 'milestone_reached' && popupMilestone && (
        <MilestoneReachedPopup
          key="milestone"
          milestone={popupMilestone}
          streak={currentStreak}
          isNight={isNight}
          onDismiss={onDismiss}
        />
      )}
      {activePopup === 'big_achievement' && popupMilestone && (
        <BigAchievementPopup
          key="big"
          milestone={popupMilestone}
          streak={currentStreak}
          isNight={isNight}
          onDismiss={onDismiss}
        />
      )}
      {activePopup === 'streak_warning' && (
        <StreakWarningPopup
          key="warning"
          streak={currentStreak}
          isNight={isNight}
          onDismiss={onDismiss}
          onCheckIn={onCheckIn}
        />
      )}
      {activePopup === 'streak_broken' && (
        <StreakBrokenPopup
          key="broken"
          isNight={isNight}
          onDismiss={onDismiss}
          onRestart={onRestart}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};
