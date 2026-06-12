import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AuthHeader() {
  const { language, setLanguage } = useLanguage();

  const langs = [
    { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { id: 'en', label: 'English', sub: 'Primary' },
    { id: 'hinglish', label: 'Hinglish', sub: 'Hinglish' },
    { id: 'ml', label: 'മലയാളം', sub: 'Malayalam' },
    { id: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
    { id: 'mr', label: 'मराठी', sub: 'Marathi' },
    { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
    { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
    { id: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
    { id: 'te', label: 'తెలుగు', sub: 'Telugu' },
    { id: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
    { id: 'or', label: 'ଓଡ଼ିଆ', sub: 'Odia' },
    { id: 'as', label: 'অসমীয়া', sub: 'Assamese' },
    { id: 'ur', label: 'اردو', sub: 'Urdu' },
    { id: 'bho', label: 'भोजपुरी', sub: 'Bhojpuri' }
  ];

  return (
    <>
      {/* Desktop Language Switcher */}
      <div className="hidden md:block absolute top-[140px] right-6 lg:right-16 z-20">
        <div className="relative group flex items-center justify-center">
          <select
            value={language}
            translate="no"
            onChange={(e) => setLanguage(e.target.value as any)}
            className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 bg-white border border-slate-200 hover:border-[#2563EB] rounded-full text-[11px] font-semibold text-[#0b2545] transition-all shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB]/50 notranslate"
          >
            {langs.map(l => (
              <option key={l.id} value={l.id} translate="no" className="notranslate">{l.label} ({l.sub})</option>
            ))}
          </select>
          <Globe size={13} className="text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
          <ChevronDown size={11} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
        </div>
      </div>

      {/* Top Government Banner */}
      <header className="relative z-20 bg-transparent pt-4 pb-0 px-6 sm:px-12 flex justify-between items-start gap-3 w-full max-w-6xl mx-auto select-none">
        <div className="flex items-center gap-3">
          <img src="/emblem-dark.png" alt="Emblem of India" className="h-10 sm:h-12 w-auto object-contain shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[9.5px] sm:text-[11.5px] font-bold text-[#0B2545] uppercase tracking-wider leading-tight">GOVERNMENT OF INDIA</span>
            <span className="text-[8px] sm:text-[9.5px] text-slate-800 font-semibold uppercase tracking-wide mt-0.5 leading-tight">MINISTRY OF WOMEN & CHILD DEVELOPMENT</span>
            <span className="text-[7px] sm:text-[8.5px] text-slate-500 font-normal tracking-wide mt-0.5 leading-tight">Government Initiative</span>
          </div>
        </div>

        {/* Mobile Language Switcher */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <img src="/digitalindia.png" alt="Digital India Logo" className="h-9 sm:h-11 w-auto object-contain shrink-0 opacity-95" />
          <div className="block md:hidden">
            <div className="relative group flex items-center justify-center">
              <select
                value={language}
                translate="no"
                onChange={(e) => setLanguage(e.target.value as any)}
                className="appearance-none flex items-center gap-1 pl-6 pr-5 py-1 bg-white border border-slate-200 hover:border-[#2563EB] rounded-full text-[9px] font-semibold text-[#0b2545] transition-all shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB]/50 notranslate"
              >
                {langs.map(l => (
                  <option key={l.id} value={l.id} translate="no" className="notranslate">{l.label}</option>
                ))}
              </select>
              <Globe size={10} className="text-slate-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
              <ChevronDown size={9} className="text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
