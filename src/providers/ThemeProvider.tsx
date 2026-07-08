import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType, theme } from '../design/theme';
import { useUIStore } from '../state/uiStore';

interface ThemeContextProps {
  currentTheme: ThemeType;
  themeTokens: typeof theme.modes['dark'];
  setTheme: (newTheme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storeTheme = useUIStore((state) => state.themeMode);
  const isEmergencyActive = useUIStore((state) => state.isEmergencyOverlayActive);
  const setThemeMode = useUIStore((state) => state.setThemeMode);

  // Active theme switches to 'emergency' configuration if dynamic emergency overlay is active
  const activeTheme: ThemeType = isEmergencyActive ? 'emergency' : storeTheme;
  const tokens = theme.modes[activeTheme];

  useEffect(() => {
    // Apply styling classes to HTML root element for Tailwind target hooks
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast', 'emergency');
    root.classList.add(activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme: activeTheme, themeTokens: tokens, setTheme: setThemeMode }}>
      <div style={{ backgroundColor: tokens.surface.background, color: tokens.text.primary, minHeight: '100vh', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useKavachTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('[ThemeEngine] useKavachTheme must be used within a ThemeProvider');
  }
  return context;
};
