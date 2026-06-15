import React from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export default function LanguageStep({ onNext }: { onNext: () => void }) {
  const { language, setLanguage } = useLanguage();

  const handleProceed = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await PushNotifications.requestPermissions();
      } catch (e) {
        console.warn("Notification permission error:", e);
      }
    }
    onNext();
  };

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-between min-h-0 space-y-4 py-4 px-6 overflow-y-auto"
    >
      <div className="flex flex-col items-center space-y-4 pt-2">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-border">
          <Globe className="text-[#2563EB]" size={24} />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            KAVACH Language
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px]">
            National Safety Grid Configuration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-sm notranslate">
        {langs.map((l) => (
          <button
            key={l.id}
            onClick={() => setLanguage(l.id as any)}
            className={cn(
              "p-3 rounded-xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center relative overflow-hidden h-20",
              language === l.id 
                ? "bg-[#2563EB]/5 border-[#2563EB] ring-1 ring-[#2563EB]/20" 
                : "bg-white border-[#F3F4F6] hover:border-[#2563EB]/30"
            )}
          >
            <div className="relative z-10 space-y-0.5">
              <p className={cn(
                "text-base font-bold leading-none mb-0.5",
                language === l.id ? "text-[#2563EB]" : "text-gray-900"
              )}>{l.label}</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{l.sub}</p>
            </div>

            {language === l.id && (
              <motion.div 
                layoutId="select-indicator"
                className="absolute top-1 right-1"
              >
                <div className="w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
              </motion.div>
            )}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-6 pb-4">
        <div className="space-y-4">
          <button 
            onClick={handleProceed}
            className="w-full bg-[#2563EB] text-white py-4 px-4 rounded-2xl font-bold text-sm shadow-lg shadow-[#2563EB]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group overflow-hidden"
          >
            <span className="truncate min-w-0">Confirm & Proceed</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

        </div>
      </div>
    </motion.div>
  );
}
