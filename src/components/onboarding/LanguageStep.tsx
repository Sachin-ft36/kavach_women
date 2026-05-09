import React from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

export default function LanguageStep({ onNext }: { onNext: () => void }) {
  const { language, setLanguage } = useLanguage();

  const langs = [
    { id: 'en', label: 'English', sub: 'Primary' },
    { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { id: 'hinglish', label: 'Hinglish', sub: 'Hinglish' },
    { id: 'ml', label: 'മലയാളം', sub: 'Malayalam' },
    { id: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
    { id: 'mr', label: 'मराठी', sub: 'Marathi' },
    { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
    { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
    { id: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center space-y-8 p-6"
    >
      <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center shadow-lg border border-border">
        <Globe className="text-accent-blue" size={40} />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-text-main">
          Select Language
        </h1>
        <p className="text-sm text-text-dim font-medium">
          Choose your preferred language to continue
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {langs.map((l) => (
          <button
            key={l.id}
            onClick={() => setLanguage(l.id as any)}
            className={cn(
              "p-4 rounded-2xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center relative overflow-hidden h-24",
              language === l.id 
                ? "bg-accent-blue/5 border-accent-blue ring-1 ring-accent-blue/20" 
                : "bg-white border-border hover:border-accent-blue/30"
            )}
          >
            <div className="relative z-10 space-y-1">
              <p className={cn(
                "text-lg font-bold leading-none mb-1",
                language === l.id ? "text-accent-blue" : "text-text-main"
              )}>{l.label}</p>
              <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">{l.sub}</p>
            </div>

            {language === l.id && (
              <motion.div 
                layoutId="select-indicator"
                className="absolute top-2 right-2"
              >
                <div className="w-5 h-5 rounded-full bg-accent-blue flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              </motion.div>
            )}
          </button>
        ))}
      </div>

      <div className="w-full pt-4">
        <button 
          onClick={onNext}
          className="w-full bg-accent-blue text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-accent-blue/20 hover:scale-[1.01] transition-all active:scale-95"
        >
          Confirm & Continue
        </button>
        <p className="text-center mt-4 text-[11px] text-text-dim font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
          <Shield size={12} className="text-accent-blue" />
          Powered by Kavach National Safety Grid
        </p>
      </div>
    </motion.div>
  );
}
