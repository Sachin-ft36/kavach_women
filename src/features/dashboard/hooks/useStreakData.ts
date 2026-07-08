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
}

export const MILESTONES: MilestoneInfo[] = [
  { days: 7,   label: 'Weekly Warrior',  tier: 'bronze',  badge: '🥉', message: "Amazing! You've built a strong habit." },
  { days: 30,  label: 'Monthly Master',  tier: 'silver',  badge: '🥈', message: "Incredible! A full month of safety.", isBig: true },
  { days: 100, label: 'Safety Expert',   tier: 'gold',    badge: '🥇', message: "Exceptional! You're a safety legend.", isBig: true },
  { days: 365, label: 'Safety Champion', tier: 'diamond', badge: '💎', message: "Unstoppable! You're an inspiration.", isBig: true },
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
  longestStreak: number;
  totalCheckIns: number;
  streaksAchieved: number;
  milestonesClaimed: number[];
  lastPopupShownDate: string | null;
}

const STORAGE_KEY = 'kavach_streak_v1';
const TODAY = new Date().toISOString().split('T')[0];

function getInitialData(): StreakData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { lastPopupShownDate: null, hasStarted: false, ...JSON.parse(stored) };
  } catch {}
  return {
    hasStarted: false,
    currentStreak: 0,
    lastCheckInDate: null,
    streakBroken: false,
    longestStreak: 0,
    totalCheckIns: 0,
    streaksAchieved: 0,
    milestonesClaimed: [],
    lastPopupShownDate: null,
  };
}

function saveData(data: StreakData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
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

export function useStreakData() {
  const [data, setData] = useState<StreakData>(getInitialData);
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [popupMilestone, setPopupMilestone] = useState<MilestoneInfo | null>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const streakState = deriveStreakState(data);
  const nextMilestone = getNextMilestone(data.currentStreak);
  const currentMilestone = getCurrentMilestone(data.currentStreak);
  const exactMilestone = MILESTONES.find(m => m.days === data.currentStreak) || null;
  const daysToNext = nextMilestone ? nextMilestone.days - data.currentStreak : 0;
  const checkedInToday = data.lastCheckInDate === TODAY;

  // Compute real weekDays based on currentStreak and dates
  const realWeekDays: WeekDayInfo[] = [];
  const todayDate = new Date();
  const currentDayIndex = todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1; // Mon=0, Sun=6
  
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - currentDayIndex);

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
    const isToday = (dateStr === TODAY);
    
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
      // Calculate day difference without time zone issues
      const d1 = new Date(expectedStartDateStr);
      const d2 = new Date(dateStr);
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      streakDayNumber = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    realWeekDays.push({
      date: dateNum,
      dateStr,
      status,
      isToday,
      streakDayNumber
    });
  }

  // ── Auto trigger streak_broken popup on mount (if broken and not shown today)
  useEffect(() => {
    if (data.streakBroken && data.lastPopupShownDate !== TODAY) {
      const timer = setTimeout(() => {
        setActivePopup('streak_broken');
        setData(prev => ({ ...prev, lastPopupShownDate: TODAY }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const doCheckIn = useCallback(() => {
    setData(prev => {
      if (prev.lastCheckInDate === TODAY) return prev;
      const newStreak = prev.currentStreak + 1;

      const updated: StreakData = {
        ...prev,
        currentStreak: newStreak,
        lastCheckInDate: TODAY,
        streakBroken: false,
        totalCheckIns: prev.totalCheckIns + 1,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        streaksAchieved: newStreak >= 7 ? Math.max(prev.streaksAchieved, 1) : prev.streaksAchieved,
      };

      // Determine which popup to show
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

  const restartStreak = useCallback(() => {
    setData(prev => ({
      ...prev,
      currentStreak: 0,
      streakBroken: false,
      lastCheckInDate: null,
    }));
    setActivePopup(null);
  }, []);

  const startJourney = useCallback(() => {
    setData(prev => ({ ...prev, hasStarted: true }));
  }, []);

  const claimMilestone = useCallback((days: number) => {
    setData(prev => ({
      ...prev,
      milestonesClaimed: prev.milestonesClaimed.includes(days)
        ? prev.milestonesClaimed
        : [...prev.milestonesClaimed, days],
    }));
  }, []);

  const dismissPopup = useCallback(() => {
    setActivePopup(null);
    setPopupMilestone(null);
  }, []);

  // Expose a manual trigger for streak_warning (can be called from evening reminder)
  const triggerWarning = useCallback(() => {
    if (!checkedInToday) setActivePopup('streak_warning');
  }, [checkedInToday]);

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
    weekDays: realWeekDays,
  };
}
