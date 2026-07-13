import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw, Flame, Trophy, Share2, Gift, Star } from 'lucide-react';
import type { PopupType, MilestoneInfo } from '../hooks/useStreakData';

interface StreakPopupsProps {
  activePopup: PopupType;
  popupMilestone: MilestoneInfo | null;
  currentStreak: number;
  longestStreak: number;
  onDismiss: () => void;
  onCheckIn: () => void;
  onRestart: () => void;
  isNight: boolean;
}

// ─── Confetti ──────────────────────────────────────────────────────────────────
const Confetti = () => {
  const dots = [
    { color: '#f97316', x: '10%', y: '8%',  size: 7,  delay: 0,    shape: 'rounded' },
    { color: '#a855f7', x: '80%', y: '10%', size: 9,  delay: 0.1,  shape: 'square' },
    { color: '#22c55e', x: '55%', y: '6%',  size: 5,  delay: 0.15, shape: 'rounded' },
    { color: '#f59e0b', x: '25%', y: '18%', size: 8,  delay: 0.05, shape: 'square' },
    { color: '#3b82f6', x: '70%', y: '22%', size: 6,  delay: 0.2,  shape: 'rounded' },
    { color: '#ec4899', x: '5%',  y: '30%', size: 5,  delay: 0.25, shape: 'square' },
    { color: '#f97316', x: '90%', y: '25%', size: 4,  delay: 0.1,  shape: 'rounded' },
    { color: '#a855f7', x: '45%', y: '4%',  size: 6,  delay: 0.3,  shape: 'square' },
    { color: '#22d3ee', x: '35%', y: '12%', size: 5,  delay: 0.18, shape: 'rounded' },
    { color: '#fbbf24', x: '62%', y: '15%', size: 7,  delay: 0.08, shape: 'square' },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -10, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, 25, 55, 80], scale: [0, 1, 1, 0], rotate: [0, 45, 90, 135] }}
          transition={{ duration: 2.5, delay: d.delay, repeat: Infinity, repeatDelay: 1.5 }}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.size,
            height: d.size,
            borderRadius: d.shape === 'rounded' ? '50%' : 2,
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
  position = 'center',
  accentColor,
}: {
  isNight: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  position?: 'center' | 'top';
  accentColor?: string;
}) => {
  return (
    <div className="fixed inset-0 z-[50000] flex items-center justify-center px-4 font-sans">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className={`relative w-full max-w-[310px] rounded-[28px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.55)] ${
          isNight
            ? 'bg-gradient-to-b from-[#141226]/99 to-[#0a0816]/99 border border-white/[0.08]'
            : 'bg-white border border-black/[0.06]'
        }`}
      >
        {accentColor && <div className="h-1.5 w-full" style={{ background: accentColor }} />}
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
};

// ═══════════════════════════════════════════════════════════════
// POPUP 1 — CHECK-IN DONE ✅
// ═══════════════════════════════════════════════════════════════
const CheckInDonePopup = ({
  streak,
  isNight,
  onDismiss,
}: { streak: number; isNight: boolean; onDismiss: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss} position="top" accentColor="linear-gradient(90deg, #10b981, #34d399)">
    <div className="p-6 pt-5 flex flex-col items-center text-center">
      <div className={`w-[64px] h-[64px] rounded-full flex items-center justify-center mb-3 ${
        isNight ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'bg-emerald-50 border border-emerald-200'
      }`}>
        <Check size={28} strokeWidth={3} className="text-emerald-400" />
      </div>

      <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>
        Nice! Check-in done
      </p>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>
        +1 Day Added
      </p>
      <p className={`text-[12px] font-medium mb-1 ${isNight ? 'text-white/55' : 'text-gray-500'}`}>
        Your streak is now
      </p>
      <p className={`text-[44px] font-black leading-none mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        {streak} Days
      </p>

      <div className={`mb-4 flex items-center gap-1.5 px-3 py-1 rounded-full ${isNight ? 'bg-orange-500/15' : 'bg-orange-50'}`}>
        <Flame size={10} fill="currentColor" className="text-orange-500" />
        <span className={`text-[9px] font-bold ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>On Fire!</span>
      </div>

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
// POPUP 2 — MILESTONE REACHED (7 days Bronze)
// ═══════════════════════════════════════════════════════════════
const MilestoneReachedPopup = ({
  milestone,
  streak,
  isNight,
  onDismiss,
}: { milestone: MilestoneInfo; streak: number; isNight: boolean; onDismiss: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss} accentColor="linear-gradient(90deg, #f59e0b, #f97316)">
    <Confetti />
    <div className="p-6 pt-5 flex flex-col items-center text-center relative z-10">
      <div className={`w-[76px] h-[76px] rounded-full flex items-center justify-center mb-3 text-[36px] border ${
        isNight ? 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.3)]' : 'bg-amber-50 border-amber-200'
      }`}>
        {milestone.badge}
      </div>

      <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isNight ? 'text-amber-400' : 'text-amber-600'}`}>
        Milestone Unlocked!
      </p>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isNight ? 'text-amber-400' : 'text-amber-600'}`}>
        Congratulations!
      </p>
      <h2 className={`text-[20px] font-black mb-0.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
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
      <p className={`text-[11px] font-medium mb-4 ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
        {milestone.message}
      </p>

      <div className="flex gap-2 w-full">
        <button
          onClick={onDismiss}
          className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-semibold border ${isNight ? 'border-white/15 text-white/60' : 'border-gray-200 text-gray-600'}`}
        >
          Keep Going →
        </button>
        <button
          onClick={onDismiss}
          className="flex-[2] py-2.5 rounded-[12px] bg-gradient-to-r from-amber-500 to-orange-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-transform flex items-center justify-center gap-1"
        >
          <Gift size={12} /> View Reward
        </button>
      </div>
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
}: { milestone: MilestoneInfo; streak: number; isNight: boolean; onDismiss: () => void }) => {
  const accentGrad =
    milestone.tier === 'diamond'
      ? 'linear-gradient(90deg, #22d3ee, #3b82f6)'
      : milestone.tier === 'gold'
      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
      : 'linear-gradient(90deg, #94a3b8, #cbd5e1)';

  const rewardColors: Record<string, string> = {
    diamond: 'text-cyan-400',
    gold: 'text-yellow-400',
    silver: 'text-slate-300',
    bronze: 'text-amber-400',
  };

  return (
    <PopupShell isNight={isNight} onDismiss={onDismiss} accentColor={accentGrad}>
      <Confetti />
      <div className="p-6 pt-5 flex flex-col items-center text-center relative z-10">
        {/* Trophy */}
        <div className="relative mb-3">
          <div className={`w-[84px] h-[84px] rounded-full flex items-center justify-center border ${
            isNight ? 'bg-yellow-500/10 border-yellow-500/25 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <Trophy size={42} className="text-yellow-400" fill="currentColor" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-[18px] bg-white border-2 border-yellow-400 shadow-md">
            {milestone.badge}
          </div>
        </div>

        <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${rewardColors[milestone.tier]}`}>
          Legendary!
        </p>
        <h2 className={`text-[20px] font-black mb-0.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
          You've completed
        </h2>
        <p className={`text-[38px] font-black leading-none mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>
          {streak} Days Streak
        </p>
        <div className={`mb-3 px-3 py-1 rounded-full text-[10px] font-bold border ${
          isNight ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          {milestone.label} Unlocked!
        </div>
        <p className={`text-[11px] font-semibold mb-2 ${isNight ? 'text-white/50' : 'text-gray-500'}`}>
          {milestone.message}
        </p>

        {/* Rewards list */}
        {milestone.rewards && milestone.rewards.length > 0 && (
          <div className={`w-full mb-4 rounded-[14px] p-2.5 flex flex-col gap-1 ${isNight ? 'bg-white/[0.04] border border-white/[0.07]' : 'bg-gray-50 border border-gray-100'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isNight ? 'text-white/40' : 'text-gray-400'}`}>Rewards Unlocked</p>
            {milestone.rewards.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Star size={8} className={rewardColors[milestone.tier]} fill="currentColor" />
                <span className={`text-[9px] font-semibold ${isNight ? 'text-white/70' : 'text-gray-700'}`}>{r}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 w-full">
          <button
            onClick={onDismiss}
            className={`flex-1 py-2.5 rounded-[12px] flex items-center justify-center gap-1.5 text-[11px] font-bold border active:scale-[0.98] ${
              isNight ? 'border-white/15 text-white/70' : 'border-gray-200 text-gray-600'
            }`}
          >
            <Share2 size={11} /> Share
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
};

// ═══════════════════════════════════════════════════════════════
// POPUP 4 — STREAK WARNING ⚠️
// ═══════════════════════════════════════════════════════════════
const StreakWarningPopup = ({
  streak,
  isNight,
  onDismiss,
  onCheckIn,
}: { streak: number; isNight: boolean; onDismiss: () => void; onCheckIn: () => void }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss} position="top" accentColor="linear-gradient(90deg, #f97316, #f59e0b)">
    <div className="p-6 pt-5 flex flex-col items-center text-center">
      <div className={`w-[64px] h-[64px] rounded-full flex items-center justify-center mb-3 ${
        isNight ? 'bg-orange-500/15 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]' : 'bg-orange-50 border border-orange-200'
      }`}>
        <Flame size={30} className="text-orange-400" fill="currentColor" />
      </div>

      <h2 className={`text-[18px] font-black mb-1.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        Don't lose your streak!
      </h2>
      <p className={`text-[12px] font-medium leading-relaxed mb-1 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>
        You're on a <span className={`font-bold ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>{streak} day streak</span>.<br />
        Complete a check-in today to keep it alive.
      </p>

      <div className={`my-3 px-4 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
        isNight ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'
      }`}>
        <Flame size={9} fill="currentColor" />
        🔥 Streak ends at midnight!
      </div>

      <div className="flex gap-2 w-full mt-1">
        <button
          onClick={onDismiss}
          className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-semibold border active:scale-[0.98] ${
            isNight ? 'border-white/12 text-white/50' : 'border-gray-200 text-gray-500'
          }`}
        >
          Maybe later
        </button>
        <button
          onClick={() => { onCheckIn(); onDismiss(); }}
          className="flex-[2] py-2.5 rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-transform"
        >
          ✓ Do it now
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
  longestStreak,
}: { isNight: boolean; onDismiss: () => void; onRestart: () => void; longestStreak: number }) => (
  <PopupShell isNight={isNight} onDismiss={onDismiss} accentColor="linear-gradient(90deg, #ef4444, #f97316)">
    <div className="p-6 pt-5 flex flex-col items-center text-center">
      <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center mb-3 text-[32px] ${
        isNight ? 'bg-red-900/20 border border-red-700/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-red-50 border border-red-200'
      }`}>
        💔
      </div>

      <h2 className={`text-[18px] font-black mb-1.5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
        Streak Broken 😔
      </h2>
      <p className={`text-[12px] font-medium leading-relaxed mb-1 ${isNight ? 'text-white/55' : 'text-gray-500'}`}>
        You missed a day, but that's okay.<br />
        <span className={`font-semibold ${isNight ? 'text-white/80' : 'text-gray-700'}`}>
          Every day is a new beginning.
        </span>
      </p>

      <div className={`my-3 px-4 py-1.5 rounded-full text-[10px] font-semibold ${
        isNight ? 'bg-white/[0.04] text-white/40' : 'bg-gray-50 text-gray-500'
      }`}>
        Your Best: <span className={isNight ? 'text-white/70' : 'text-gray-800'}>{longestStreak > 0 ? `${longestStreak} Days` : 'Just started!'}</span>
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={onDismiss}
          className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-semibold border active:scale-[0.98] ${
            isNight ? 'border-white/12 text-white/50' : 'border-gray-200 text-gray-500'
          }`}
        >
          Not now
        </button>
        <button
          onClick={() => { onRestart(); onDismiss(); }}
          className="flex-[2] py-2.5 rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[12px] font-bold shadow-[0_6px_20px_rgba(249,115,22,0.35)] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={11} /> Restart Now
        </button>
      </div>
    </div>
  </PopupShell>
);

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════
export const StreakPopups = ({
  activePopup,
  popupMilestone,
  currentStreak,
  longestStreak,
  onDismiss,
  onCheckIn,
  onRestart,
  isNight,
}: StreakPopupsProps) => {
  return createPortal(
    <AnimatePresence mode="wait">
      {activePopup === 'checkin_done' && (
        <CheckInDonePopup key="checkin" streak={currentStreak} isNight={isNight} onDismiss={onDismiss} />
      )}
      {activePopup === 'milestone_reached' && popupMilestone && (
        <MilestoneReachedPopup key="milestone" milestone={popupMilestone} streak={currentStreak} isNight={isNight} onDismiss={onDismiss} />
      )}
      {activePopup === 'big_achievement' && popupMilestone && (
        <BigAchievementPopup key="big" milestone={popupMilestone} streak={currentStreak} isNight={isNight} onDismiss={onDismiss} />
      )}
      {activePopup === 'streak_warning' && (
        <StreakWarningPopup key="warning" streak={currentStreak} isNight={isNight} onDismiss={onDismiss} onCheckIn={onCheckIn} />
      )}
      {activePopup === 'streak_broken' && (
        <StreakBrokenPopup key="broken" isNight={isNight} onDismiss={onDismiss} onRestart={onRestart} longestStreak={longestStreak} />
      )}
    </AnimatePresence>,
    document.body
  );
};
