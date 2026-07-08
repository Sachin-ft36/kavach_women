import { create } from 'zustand';
import { ThemeType } from '../design/theme';

interface UIState {
  themeMode: ThemeType;
  timeThemeOverride: 'auto' | 'morning' | 'afternoon' | 'evening' | 'night';
  isEmergencyOverlayActive: boolean;
  activePanel: string | null;
  setThemeMode: (themeMode: ThemeType) => void;
  setTimeThemeOverride: (override: 'auto' | 'morning' | 'afternoon' | 'evening' | 'night') => void;
  setEmergencyOverlay: (active: boolean) => void;
  openPanel: (panelId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: 'dark',
  timeThemeOverride: 'auto',
  isEmergencyOverlayActive: false,
  activePanel: null,
  setThemeMode: (themeMode) => set({ themeMode }),
  setTimeThemeOverride: (timeThemeOverride) => set({ timeThemeOverride }),
  setEmergencyOverlay: (isEmergencyOverlayActive) => set({ isEmergencyOverlayActive }),
  openPanel: (activePanel) => set({ activePanel }),
}));
