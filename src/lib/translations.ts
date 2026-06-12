import { en } from './i18n/en';
import { hinglish } from './i18n/hinglish';

export type Language = 'en' | 'hi' | 'ml' | 'hinglish' | 'pa' | 'mr' | 'ta' | 'bn' | 'gu' | 'te' | 'kn' | 'or' | 'as' | 'ur' | 'bho';

export const translations: Record<string, any> = {
  en,
  hinglish
};
