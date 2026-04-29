import React from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

export default function LanguageStep({ onNext }: { onNext: () => void }) {
  const { language, setLanguage } = useLanguage();

  const langs = [
    { id: 'en', label: 'English', sub: 'Primary' },
    { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { id: 'hinglish', label: 'Hinglish', sub: 'Hinglish' },
    { id: 'ml', label: 'മലയാളം', sub: 'Malayalam' },
    { id: 'pa', label: 'ਪੰਜਾਬി', sub: 'Punjabi' },
    { id: 'mr', label: 'मराठी', sub: 'Marathi' },
    { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
    { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
    { id: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center space-y-10"
    >
      <div className="w-24 h-24 bg-accent-blue/10 border border-accent-blue/30 rounded-[32px] flex items-center justify-center shadow-2xl relative">
        <Globe className="text-accent-blue animate-pulse" size={48} />
        <div className="absolute inset-0 bg-accent-blue/5 blur-2xl rounded-full" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
          Select Language
        </h1>
        <p className="text-[10px] text-white/40 font-black uppercase tracking-[3px]">
          Choose your tactical dialect
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full px-2 sm:px-4">
        {langs.map((l) => (
          <button
            key={l.id}
            onClick={() => setLanguage(l.id as any)}
            className={cn(
              "p-2 aspect-square rounded-[20px] border-2 transition-all duration-300 text-center flex flex-col items-center justify-center relative overflow-hidden group",
              language === l.id 
                ? "bg-accent-blue/10 border-accent-blue shadow-[0_0_20px_rgba(0,122,255,0.15)]" 
                : "bg-white/3 border-white/5 hover:border-white/10"
            )}
          >
            <div className="relative z-10 space-y-1">
              <p className={cn(
                "text-[13px] sm:text-lg font-black italic uppercase tracking-tighter leading-none mb-1",
                language === l.id ? "text-white" : "text-white/60 group-hover:text-white/80"
              )}>{l.label}</p>
              <p className="text-[6px] font-mono text-white/20 uppercase tracking-widest">{l.sub}</p>
            </div>

            {language === l.id && (
              <motion.div 
                layoutId="select-indicator"
                className="absolute top-3 right-3"
              >
                <div className="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center text-white shadow-lg">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </motion.div>
            )}
            
            {/* Visual scanline effect */}
            {language === l.id && (
               <div className="absolute top-0 left-0 w-full h-[1px] bg-accent-blue/50 animate-scan" />
            )}
          </button>
        ))}
      </div>

      <button 
        onClick={onNext}
        className="w-full mx-4 mt-4 bg-white text-black py-6 rounded-[28px] font-black uppercase text-[12px] italic tracking-[4px] shadow-[0_10px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] transition-all active:scale-95"
      >
        Establish Connection
      </button>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </motion.div>
  );
}
