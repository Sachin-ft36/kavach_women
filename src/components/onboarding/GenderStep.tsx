import React from 'react';
import { motion } from 'motion/react';
import { User, UserPlus, Shield, Info, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

interface GenderStepProps {
  gender: 'female' | 'male' | null;
  setGender: (val: 'female' | 'male') => void;
  userName: string;
  setUserName: (val: string) => void;
  userPhone: string;
  setUserPhone: (val: string) => void;
}

export default function GenderStep({ 
  gender, 
  setGender, 
  userName, 
  setUserName, 
  userPhone, 
  setUserPhone 
}: GenderStepProps) {
  const { t } = useLanguage();

  const options = [
    { 
      id: 'female' as const, 
      icon: User, 
      title: t('female_profile'),
      subtitle: t('women_safety_access'),
      color: 'red',
      iconBox: 'bg-[#5C1616]/20 border-[#FF3B30]/20'
    },
    { 
      id: 'male' as const, 
      icon: UserPlus, 
      title: t('male_profile'),
      subtitle: t('protector_onboarding'),
      color: 'blue',
      iconBox: 'bg-[#162C5C]/20 border-[#30B0FF]/20'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col items-center space-y-4 pt-2">
        <div className="w-16 h-16 bg-[#1A1A1A] border border-white/10 rounded-[24px] flex items-center justify-center shadow-2xl">
           <User className="text-[#30B0FF]" size={32} />
        </div>
        
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
            {t('your_profile')}
          </h1>
          <p className="text-[10px] text-white/70 font-black uppercase tracking-[2px] leading-relaxed">
            SECURE ACCESS PROTOCOL
          </p>
        </div>
      </div>


      {/* Options Cards */}
      <div className="flex-1 flex flex-col space-y-3 px-2">
        <label className="text-[9px] font-black uppercase tracking-[2px] text-accent-blue/60 ml-1">Selection Mode</label>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setGender(opt.id)}
            className={cn(
              "relative overflow-hidden group p-4 rounded-[28px] border-2 transition-all duration-500 flex items-center gap-4 backdrop-blur-xl",
              gender === opt.id 
                ? opt.color === 'red' 
                   ? "bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(255,59,48,0.1)]"
                   : "bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(48,176,255,0.1)]"
                : "bg-white/[0.05] border-white/10"
            )}
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
            
            {/* Icon Box */}
            <div className={cn(
              "w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all duration-500",
              opt.iconBox,
              gender === opt.id ? "scale-110 shadow-lg brightness-125" : "scale-100 brightness-90 opacity-80"
            )}>
              <opt.icon 
                className={opt.color === 'red' ? 'text-[#FF3B30]' : 'text-[#30B0FF]'} 
                size={24} 
              />
            </div>

            {/* Labels */}
            <div className="flex-1 text-left">
              <h3 className={cn(
                "text-sm font-black italic uppercase tracking-wider transition-all",
                gender === opt.id ? "text-white" : "text-white/80"
              )}>
                {opt.title}
              </h3>
              <p className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-all",
                gender === opt.id ? "text-white/50" : "text-white/30"
              )}>
                {opt.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ⚠️ Tactical Legal Disclaimer */}
      <div className="px-2 pb-4 space-y-4">
        <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/10 p-4 rounded-[24px] space-y-1.5 backdrop-blur-md">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-4 bg-accent-red rounded-full animate-pulse" />
             <span className="text-[10px] font-black italic uppercase tracking-[2px] text-accent-red">Mission Protocol 1-B</span>
           </div>
           <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest leading-[1.5]">
             Identity misrepresentation (Fake Gender) is a punishable offence under BNSS guidelines. Device ID and Location are anchored during this selection.
           </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Lock size={10} className="text-white/20" />
          <span className="text-[8px] font-black uppercase tracking-[3px] text-white/20 italic">Gender Profile is Permanent Once Anchored</span>
        </div>
      </div>
    </motion.div>
  );
}
