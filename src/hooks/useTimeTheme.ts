import { useState, useEffect } from 'react';
import { useUIStore } from '../state/uiStore';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function useTimeTheme() {
  const timeThemeOverride = useUIStore((state) => state.timeThemeOverride);
  
  const [autoTimeOfDay, setAutoTimeOfDay] = useState<TimeOfDay>('afternoon');
  const [autoGreeting, setAutoGreeting] = useState('Good Afternoon');

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setAutoTimeOfDay('morning');
        setAutoGreeting('Good Morning');
      } else if (hour >= 12 && hour < 17) {
        setAutoTimeOfDay('afternoon');
        setAutoGreeting('Good Afternoon');
      } else if (hour >= 17 && hour < 20) {
        setAutoTimeOfDay('evening');
        setAutoGreeting('Good Evening');
      } else {
        setAutoTimeOfDay('night');
        setAutoGreeting('Good Night');
      }
    };

    updateTime();
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isAuto = timeThemeOverride === 'auto';
  const timeOfDay = isAuto ? autoTimeOfDay : timeThemeOverride as TimeOfDay;
  
  // Set appropriate greeting for manual overrides
  let greeting = autoGreeting;
  if (!isAuto) {
    if (timeOfDay === 'morning') greeting = 'Good Morning';
    else if (timeOfDay === 'afternoon') greeting = 'Good Afternoon';
    else if (timeOfDay === 'evening') greeting = 'Good Evening';
    else greeting = 'Good Night';
  }

  // Helper to safely resolve the folder name
  const themeFolder = timeOfDay;

  return { timeOfDay, themeFolder, greeting };
}
