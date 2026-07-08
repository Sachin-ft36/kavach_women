import React, { useState } from 'react';
import { ArrowLeft, Globe, Check, Info, Sparkles, MessageSquare, Volume2, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface LanguageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSettings({ isOpen, onClose }: LanguageSettingsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const suggestedLanguage = { name: 'English', native: 'English', code: 'EN', isDefault: true };

  const allLanguages = [
    { name: 'हिंदी', native: 'Hindi', code: 'HI' },
    { name: 'मराठी', native: 'Marathi', code: 'MR' },
    { name: 'தமிழ்', native: 'Tamil', code: 'TA' },
    { name: 'తెలుగు', native: 'Telugu', code: 'TE' },
    { name: 'বাংলা', native: 'Bengali', code: 'BN' },
    { name: 'ಕನ್ನಡ', native: 'Kannada', code: 'KN' },
    { name: 'ગુજરાતી', native: 'Gujarati', code: 'GU' },
    { name: 'ਪੰਜਾਬੀ', native: 'Punjabi', code: 'PA' }
  ];

  if (!isOpen) return null;

  const handleSelect = (langName: string) => {
    setSelectedLanguage(langName);
    toast.success(`Language selected: ${langName}`);
  };

  const handleSave = () => {
    toast.success(`Language preferences applied: ${selectedLanguage}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0b0914] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200">
      <div className="max-w-md mx-auto flex flex-col gap-4">

        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Language</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">Choose your preferred language</p>
            </div>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Globe size={15} />
          </div>
        </header>

        {/* Hero Card with Gemini Image */}
        <section className="bg-[#000000] border border-[#222135] rounded-[24px] p-4 flex items-center gap-4 relative overflow-hidden text-left shadow-lg">
          {/* Gemini Generated Illustration Image */}
          <div className="w-44 h-44 shrink-0 relative flex items-center justify-center overflow-hidden">
            <img
              src="/connect_in_your_language.png"
              alt="Connect in your language"
              className="w-full h-full object-contain mix-blend-screen"
              onError={(e) => {
                // Fallback inside local code to resolve generated filename suffix if running in different environment path
                e.currentTarget.src = "/connect_in_your_language_clean_1782825857518.png";
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-white leading-snug">Connect in your <span style={{ color: '#a855f7' }}>language</span></h2>
            <p className="text-[11px] text-slate-405 leading-normal mt-0.5">
              KAVACH is available in multiple languages so you can use the app in the way you're most comfortable.
            </p>

            <div className="flex flex-col gap-1 mt-2.5">
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <Globe size={11} className="text-purple-400 shrink-0" />
                <span>Multiple languages</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <Sparkles size={11} className="text-purple-400 shrink-0" />
                <span>Easy to switch</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <ShieldCheck size={11} className="text-[#00e599] shrink-0" />
                <span>Built for everyone</span>
              </div>
            </div>
          </div>
        </section>

        {/* SUGGESTED LANGUAGE SECTION */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5 px-1">Suggested</h3>

          <div
            onClick={() => handleSelect(suggestedLanguage.name)}
            className={`border rounded-[14px] p-3 flex items-center justify-between shadow-sm cursor-pointer transition-all ${selectedLanguage === suggestedLanguage.name
                ? 'border-[#8b5cf6] bg-[#121020]/80'
                : 'border-[#222135] bg-[#0d0c1b]/60'
              }`}
          >
            <div className="flex items-center gap-3">
              {/* Custom Purple Radio Bullet */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${selectedLanguage === suggestedLanguage.name ? 'bg-purple-500/20 text-[#a855f7]' : 'bg-slate-800 text-slate-400'
                }`}>
                {suggestedLanguage.code}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[12.5px] font-bold text-white leading-none">{suggestedLanguage.name}</h4>
                  <span className="bg-[#8b5cf6]/15 text-[#a855f7] text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                    Default
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-450 mt-1">{suggestedLanguage.native}</p>
              </div>
            </div>

            {/* Checkbox badge */}
            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold px-2 py-1 rounded-lg tracking-wide flex items-center gap-1">
              <Check size={9} strokeWidth={3} /> Current Language
            </div>
          </div>
        </section>

        {/* ALL LANGUAGES SECTION */}
        <section className="text-left flex-1">
          <h3 className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5 px-1">All Languages</h3>

          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[16px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            {allLanguages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => handleSelect(lang.native)}
                className="flex items-center justify-between py-3 px-4 hover:bg-white/[0.01] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selectedLanguage === lang.native ? 'bg-transparent border-purple-500' : 'border-slate-700'
                    }`}>
                    {selectedLanguage === lang.native && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                  </div>
                  <div className="text-left">
                    <h4 className="text-[13px] font-medium text-white leading-none">{lang.name}</h4>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">{lang.native}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* Footer info details banner */}
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-[12px] p-3 flex items-center justify-between gap-3 text-left hover:bg-purple-500/10 cursor-pointer transition-all" onClick={handleSave}>
          <div className="flex items-start gap-2.5">
            <Info size={14} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10.5px] text-white font-semibold leading-normal">Language will change the entire app</p>
              <p className="text-[9.5px] text-slate-450 mt-0.5 leading-normal">All menus, alerts and content will be shown in your selected language.</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-500 shrink-0" />
        </div>

      </div>
    </div>
  );
}
