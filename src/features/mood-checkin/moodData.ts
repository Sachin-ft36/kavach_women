// Mood options data
export interface MoodOption {
  id: string;
  label: string;
  icon: string;
}

export const moodOptions: MoodOption[] = [
  { id: 'great', label: 'Great', icon: 'great' },
  { id: 'good', label: 'Good', icon: 'good' },
  { id: 'okay', label: 'Okay', icon: 'okay' },
  { id: 'low', label: 'Low', icon: 'low' },
  { id: 'help', label: 'Need Help', icon: 'help' },
];

// Weekly history data
export interface DayHistory {
  day: string;
  mood: string;
}

export const weeklyHistory: DayHistory[] = [
  { day: 'M', mood: 'good' },
  { day: 'T', mood: 'okay' },
  { day: 'W', mood: 'good' },
  { day: 'T', mood: 'low' },
  { day: 'F', mood: 'okay' },
  { day: 'S', mood: 'good' },
  { day: 'S', mood: 'good' },
];
