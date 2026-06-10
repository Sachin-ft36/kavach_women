import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  const triggerGoogleTranslate = (lang: string) => {
    let gtLang = lang;
    if (lang === 'hinglish') gtLang = 'en';
    
    if (gtLang === 'en') {
      // To revert to original language, we must clear Google Translate cookies
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      
      // If a translation is currently active in the DOM, reload to clear it
      if (document.documentElement.classList.contains('translated-ltr') || document.body.classList.contains('translated-ltr')) {
        window.location.reload();
      }
      return;
    }

    const select = document.querySelector('select.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = gtLang;
      select.dispatchEvent(new Event('change'));
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('app_language') || 'en';
    
    // Poll for Google Translate widget to load, then trigger translation
    const timer = setInterval(() => {
      const select = document.querySelector('select.goog-te-combo');
      if (select) {
        triggerGoogleTranslate(saved);
        clearInterval(timer);
      }
    }, 500);

    setTimeout(() => clearInterval(timer), 10000);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    triggerGoogleTranslate(lang);
  };

  const t = (key: keyof typeof translations['en']) => {
    // If Hinglish is selected, use the manual translations since Google Translate doesn't support Hinglish output
    if (language === 'hinglish') {
      const langTranslations = (translations as any)['hinglish'];
      return (langTranslations && langTranslations[key]) || translations['en'][key] || key;
    }
    
    // For all other languages, ALWAYS return English. 
    // Google Translate will read the English DOM and automatically translate it to Hindi, Marathi, Tamil, etc.
    // This ensures that all hardcoded English strings AND these dictionary strings are translated together perfectly.
    return translations['en'][key] || key;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
