import { colors } from './colors';

export type ThemeType = 'light' | 'dark' | 'high-contrast' | 'emergency';

export const theme = {
  modes: {
    light: {
      surface: {
        background: '#F9FAFB',
        card: '#FFFFFF',
        elevated: '#F3F4F6',
        modal: '#E5E7EB',
        overlay: 'rgba(249, 250, 251, 0.8)',
        floating: '#FFFFFF',
      },
      text: {
        primary: '#111827',
        secondary: '#4B5563',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF',
        disabled: '#D1D5DB',
      },
      border: {
        default: '#E5E7EB',
        active: colors.brand.primary,
        danger: colors.protection.critical,
        warning: colors.protection.warning,
        success: colors.protection.excellent,
        disabled: '#F3F4F6',
      }
    },
    dark: {
      surface: colors.surface,
      text: colors.text,
      border: colors.border,
    },
    'high-contrast': {
      surface: {
        background: '#000000',
        card: '#000000',
        elevated: '#111111',
        modal: '#222222',
        overlay: 'rgba(0, 0, 0, 0.95)',
        floating: '#000000',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#FFFF00', // Yellow for high visibility
        tertiary: '#00FFFF',  // Cyan
        inverse: '#000000',
        disabled: '#555555',
      },
      border: {
        default: '#FFFFFF',
        active: '#FFFF00',
        danger: '#FF0000',
        warning: '#FFFF00',
        success: '#00FF00',
        disabled: '#444444',
      }
    },
    emergency: {
      surface: {
        background: '#1F0509', // Deep Wine red background
        card: '#2D0A10',       // Dark rose surface
        elevated: '#4C111A',   // Crimson raised surface
        modal: '#6A1724',
        overlay: 'rgba(31, 5, 9, 0.85)',
        floating: '#4C111A',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#FCA5A5', // Rose 300
        tertiary: '#F87171',  // Red 400
        inverse: '#1F0509',
        disabled: '#7F1D1D',
      },
      border: {
        default: '#4C111A',
        active: '#EF4444',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        disabled: '#3B070C',
      }
    }
  }
};
