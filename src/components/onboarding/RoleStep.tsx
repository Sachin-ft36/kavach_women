import React from 'react';
import { motion } from 'motion/react';
import { Shield, UserCheck } from 'lucide-react';
import { PremiumCard } from './PremiumCard';
import { useLanguage } from '../../contexts/LanguageContext';

interface RoleStepProps {
  role: 'citizen' | 'protector' | null;
  setRole: (val: 'citizen' | 'protector') => void;
  gender: 'female' | 'male' | null;
}

export default function RoleStep({ role, setRole, gender }: RoleStepProps) {
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col space-y-10 py-6"
    >
       <div className="relative text-center space-y-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-red/5 rounded-full blur-3xl animate-pulse" />
          
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              {t('choose_role_title').split(' ')[0]} <span className="text-accent-red">{t('choose_role_title').split(' ')[1]}</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-accent-red/30" />
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[5px]">{t('choose_role')}</p>
              <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-accent-red/30" />
            </div>
          </div>
       </div>

       <div className="flex-1 space-y-5 px-2">
          <div className="bg-[#050505] border border-white/5 rounded-[32px] p-6 space-y-4 shadow-inner">
             <p className="text-[10px] text-center text-white font-black uppercase tracking-widest px-4 italic">
                KAVACH network me aapka kya role hoga?
             </p>

             <div className="space-y-4">
                {gender !== 'male' && (
                  <PremiumCard 
                    selected={role === 'citizen'} 
                    onClick={() => setRole('citizen')} 
                    icon={Shield} 
                    title={t('women_safety')} 
                    sub="SAFETY SHIELD" 
                    desc="SOS, Live Tracking, aur Forensic Evidence jaise features use karne ke liye." 
                    color="red"
                  />
                )}
                
                <PremiumCard 
                  selected={role === 'protector'} 
                  onClick={() => setRole('protector')} 
                  icon={UserCheck} 
                  title={t('rakshak_network')} 
                  sub="SUPPORT HERO" 
                  desc="Mushkil me fase logo ki sahayta karne aur alert paane ke liye." 
                  color="red"
                />
             </div>
          </div>
       </div>
    </motion.div>
  );
}
