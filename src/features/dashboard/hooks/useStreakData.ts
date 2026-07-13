import { useState, useEffect, useCallback } from 'react';

export type StreakState = 'new' | 'active' | 'milestone' | 'broken';
export type PopupType = 'checkin_done' | 'milestone_reached' | 'big_achievement' | 'streak_warning' | 'streak_broken' | null;

export interface MilestoneInfo {
  days: number;
  label: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  badge: string;
  message: string;
  isBig?: boolean;
  rewards: string[];
}

export const MILESTONES: MilestoneInfo[] = [
  {
    days: 7,
    label: 'Weekly Warrior',
    tier: 'bronze',
    badge: '🥉',
    message: "Amazing! You've built a strong habit.",
    rewards: ['Exclusive Bronze Badge', 'Safety Tips Unlocked'],
  },
  {
    days: 30,
    label: 'Monthly Master',
    tier: 'silver',
    badge: '🥈',
    message: "Incredible! A full month of safety.",
    isBig: true,
    rewards: ['Silver Badge', 'Premium Theme: Moonlight', '+500 XP'],
  },
  {
    days: 100,
    label: 'Safety Expert',
    tier: 'gold',
    badge: '🥇',
    message: "Exceptional! You're a safety legend.",
    isBig: true,
    rewards: ['Gold Guardian Badge', 'Exclusive Gold Theme', '+1000 XP', 'Safety Expert Title'],
  },
  {
    days: 365,
    label: 'Safety Champion',
    tier: 'diamond',
    badge: '💎',
    message: "Unstoppable! You're an inspiration.",
    isBig: true,
    rewards: ['Diamond Champion Badge', 'All Themes Unlocked', '+2000 XP', 'Surprise Rewards'],
  },
];

export interface WeekDayInfo {
  date: number;
  dateStr: string;
  status: 'completed' | 'today' | 'missed' | 'future' | 'none';
  isToday: boolean;
  streakDayNumber: number | null;
}

interface StreakData {
  hasStarted: boolean;
  currentStreak: number;
  lastCheckInDate: string | null;
  streakBroken: boolean;
  streakBrokenDate: string | null;
  longestStreak: number;
  totalCheckIns: number;
  streaksAchieved: number;
  milestonesClaimed: number[];
  lastPopupShownDate: string | null;
  startDate: string | null;           // when did user first begin journey
  averageStreakLength: number;         // rolling average
  featuresUsed: number;               // count of safety features used
}

const STORAGE_KEY = 'kavach_streak_v2';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getInitialData(): StreakData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // also migrate old key
    const oldStored = localStorage.getItem('kavach_streak_v1');
    if (stored) {
      return {
        streakBrokenDate: null,
        startDate: null,
        averageStreakLength: 0,
        featuresUsed: 0,
        lastPopupShownDate: null,
        hasStarted: false,
        ...JSON.parse(stored),
      };
    }
    if (oldStored) {
      const old = JSON.parse(oldStored);
      return {
        streakBrokenDate: null,
        startDate: null,
        averageStreakLength: 0,
        featuresUsed: 0,
        ...old,
      };
    }
  } catch {}
  return {
    hasStarted: false,
    currentStreak: 0,
    lastCheckInDate: null,
    streakBroken: false,
    streakBrokenDate: null,
    longestStreak: 0,
    totalCheckIns: 0,
    streaksAchieved: 0,
    milestonesClaimed: [],
    lastPopupShownDate: null,
    startDate: null,
    averageStreakLength: 0,
    featuresUsed: 0,
  };
}

function saveData(data: StreakData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// ── Check if streak was broken (missed a day) ─────────────────────────────────
function checkStreakBroken(data: StreakData): boolean {
  if (!data.hasStarted || !data.lastCheckInDate || data.streakBroken) return data.streakBroken;
  const today = getToday();
  const lastDate = new Date(data.lastCheckInDate);
  const todayDate = new Date(today);
  lastDate.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 1; // more than 1 day gap = broken
}

function deriveStreakState(data: StreakData): StreakState {
  if (!data.hasStarted) return 'new';
  if (data.streakBroken) return 'broken';
  const exactMilestone = MILESTONES.find(m => m.days === data.currentStreak);
  if (exactMilestone) return 'milestone';
  return 'active';
}

function getNextMilestone(current: number): MilestoneInfo | null {
  return MILESTONES.find(m => m.days > current) || null;
}

function getCurrentMilestone(current: number): MilestoneInfo | null {
  const hit = [...MILESTONES].reverse().find(m => current >= m.days);
  return hit || null;
}

export const TIER_COLORS = {
  bronze:  { bg: 'bg-amber-500/20',   border: 'border-amber-500/40',   text: 'text-amber-400',   solid: '#f59e0b' },
  silver:  { bg: 'bg-slate-400/20',   border: 'border-slate-300/40',   text: 'text-slate-300',   solid: '#94a3b8' },
  gold:    { bg: 'bg-yellow-400/20',  border: 'border-yellow-400/40',  text: 'text-yellow-300',  solid: '#fbbf24' },
  diamond: { bg: 'bg-cyan-400/15',    border: 'border-cyan-300/40',    text: 'text-cyan-300',    solid: '#22d3ee' },
};

export function useStreakData() {
  const TODAY = getToday();

  const [data, setData] = useState<StreakData>(() => {
    const initial = getInitialData();
    // Auto-detect streak broken on load
    if (checkStreakBroken(initial) && !initial.streakBroken) {
      return { ...initial, streakBroken: true, streakBrokenDate: TODAY };
    }
    return initial;
  });

  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [popupMilestone, setPopupMilestone] = useState<MilestoneInfo | null>(null);

  // Persist to localStorage
  useEffect(() => {
    saveData(data);
  }, [data]);

  const streakState = deriveStreakState(data);
  const nextMilestone = getNextMilestone(data.currentStreak);
  const currentMilestone = getCurrentMilestone(data.currentStreak);
  const exactMilestone = MILESTONES.find(m => m.days === data.currentStreak) || null;
  const daysToNext = nextMilestone ? nextMilestone.days - data.currentStreak : 0;
  const checkedInToday = data.lastCheckInDate === TODAY;

  // ── Build week tracker ────────────────────────────────────────────────────────
  const realWeekDays: WeekDayInfo[] = [];
  const todayDate = new Date();
  const currentDayOfWeek = todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1; // Mon=0

  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - currentDayOfWeek);

  let streakStartDateStr: string | null = null;
  if (data.currentStreak > 0 && data.lastCheckInDate) {
    const d = new Date(data.lastCheckInDate);
    d.setDate(d.getDate() - (data.currentStreak - 1));
    streakStartDateStr = d.toISOString().split('T')[0];
  }

  let expectedStartDateStr = TODAY;
  if (data.currentStreak > 0 && !data.streakBroken && streakStartDateStr) {
    expectedStartDateStr = streakStartDateStr;
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dateNum = d.getDate();
    const isToday = dateStr === TODAY;

    let status: WeekDayInfo['status'] = 'none';

    if (isToday) {
      status = 'today';
    } else if (dateStr > TODAY) {
      status = 'future';
    } else {
      if (data.lastCheckInDate && streakStartDateStr) {
        if (dateStr >= streakStartDateStr && dateStr <= data.lastCheckInDate) {
          status = 'completed';
        } else if (dateStr > data.lastCheckInDate && dateStr < TODAY) {
          status = 'missed';
        } else {
          status = 'none';
        }
      } else {
        status = 'none';
      }
    }

    let streakDayNumber: number | null = null;
    if (dateStr >= expectedStartDateStr) {
      const d1 = new Date(expectedStartDateStr);
      const d2 = new Date(dateStr);
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      streakDayNumber = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    realWeekDays.push({ date: dateNum, dateStr, status, isToday, streakDayNumber });
  }

  // ── Auto trigger streak_broken popup on mount ─────────────────────────────────
  useEffect(() => {
    if (data.streakBroken && data.lastPopupShownDate !== TODAY) {
      const timer = setTimeout(() => {
        setActivePopup('streak_broken');
        setData(prev => ({ ...prev, lastPopupShownDate: TODAY }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Evening reminder (5 PM - 9 PM, if not checked in) ─────────────────────
  useEffect(() => {
    if (!data.hasStarted || data.streakBroken || checkedInToday) return;

    const hour = new Date().getHours();
    // Show warning between 6 PM and 9 PM if not checked in
    if (hour >= 18 && hour < 21) {
      const timer = setTimeout(() => {
        setActivePopup('streak_warning');
      }, 3000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Check-in ──────────────────────────────────────────────────────────────────
  const doCheckIn = useCallback(() => {
    const today = getToday();
    setData(prev => {
      if (prev.lastCheckInDate === today) return prev;
      const newStreak = prev.currentStreak + 1;
      const newLongest = Math.max(prev.longestStreak, newStreak);

      const updated: StreakData = {
        ...prev,
        currentStreak: newStreak,
        lastCheckInDate: today,
        streakBroken: false,
        streakBrokenDate: null,
        totalCheckIns: prev.totalCheckIns + 1,
        longestStreak: newLongest,
        streaksAchieved: newStreak >= 7 ? Math.max(prev.streaksAchieved, Math.floor(newStreak / 7)) : prev.streaksAchieved,
        startDate: prev.startDate || today,
        // Rolling average: (old_avg * (totalCheckIns-1) + newStreak) / totalCheckIns
        averageStreakLength: Math.round(
          ((prev.averageStreakLength * prev.totalCheckIns) + newStreak) / (prev.totalCheckIns + 1)
        ),
      };

      // Which popup to show?
      const hitMilestone = MILESTONES.find(m => m.days === newStreak);
      if (hitMilestone) {
        if (hitMilestone.isBig) {
          setPopupMilestone(hitMilestone);
          setTimeout(() => setActivePopup('big_achievement'), 300);
        } else {
          setPopupMilestone(hitMilestone);
          setTimeout(() => setActivePopup('milestone_reached'), 300);
        }
      } else {
        setTimeout(() => setActivePopup('checkin_done'), 300);
      }

      return updated;
    });
  }, []);

  // ── Restart (reset to new) ────────────────────────────────────────────────────
  const restartStreak = useCallback(() => {
    setData(prev => ({
      ...prev,
      hasStarted: false,
      currentStreak: 0,
      streakBroken: false,
      streakBrokenDate: null,
      lastCheckInDate: null,
      startDate: null,
    }));
    setActivePopup(null);
  }, []);

  // ── Start journey ─────────────────────────────────────────────────────────────
  const startJourney = useCallback(() => {
    const today = getToday();
    setData(prev => ({ ...prev, hasStarted: true, startDate: prev.startDate || today }));
  }, []);

  // ── Claim milestone reward ────────────────────────────────────────────────────
  const claimMilestone = useCallback((days: number) => {
    setData(prev => ({
      ...prev,
      milestonesClaimed: prev.milestonesClaimed.includes(days)
        ? prev.milestonesClaimed
        : [...prev.milestonesClaimed, days],
    }));
  }, []);

  // ── Dismiss popup ─────────────────────────────────────────────────────────────
  const dismissPopup = useCallback(() => {
    setActivePopup(null);
    setPopupMilestone(null);
  }, []);

  // ── Manual trigger for streak_warning ────────────────────────────────────────
  const triggerWarning = useCallback(() => {
    if (!checkedInToday) setActivePopup('streak_warning');
  }, [checkedInToday]);

  // ── Increment feature use counter ─────────────────────────────────────────────
  const incrementFeaturesUsed = useCallback(() => {
    setData(prev => ({ ...prev, featuresUsed: prev.featuresUsed + 1 }));
  }, []);

  // ── DEBUG: set specific day ───────────────────────────────────────────────────
  const debugSetDay = useCallback((day: number) => {
    const today = getToday();
    setData(prev => ({
      ...prev,
      hasStarted: true,
      currentStreak: day,
      streakBroken: false,
      streakBrokenDate: null,
      lastCheckInDate: today,
      totalCheckIns: Math.max(prev.totalCheckIns, day),
      longestStreak: Math.max(prev.longestStreak, day),
      startDate: prev.startDate || today,
    }));
    setActivePopup(null);
  }, []);

  // ── DEBUG: simulate streak broken ────────────────────────────────────────────
  const debugBreakStreak = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      hasStarted: true,
      currentStreak: prev.currentStreak || 4,
      streakBroken: true,
      streakBrokenDate: getToday(),
      lastCheckInDate: yesterdayStr,
      lastPopupShownDate: null, // reset so popup shows
    }));
    setActivePopup(null);
  }, []);

  return {
    data,
    streakState,
    nextMilestone,
    currentMilestone,
    exactMilestone,
    daysToNext,
    checkedInToday,
    activePopup,
    popupMilestone,
    startJourney,
    doCheckIn,
    restartStreak,
    claimMilestone,
    dismissPopup,
    triggerWarning,
    incrementFeaturesUsed,
    debugSetDay,
    debugBreakStreak,
    weekDays: realWeekDays,
    TIER_COLORS,
  };
}
