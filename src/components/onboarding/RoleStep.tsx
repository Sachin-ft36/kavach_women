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
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col space-y-4"
    >
       <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 bg-white border border-border rounded-[18px] flex items-center justify-center shadow-md mx-auto">
             <Shield className="text-[#2563EB]" size={24} />
          </div>
          
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Choose your Role
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Identity Access Control
            </p>
          </div>
       </div>

       <div className="flex-1 space-y-4 px-1 overflow-y-auto pr-1">
          <div className="space-y-3">
             <p className="text-[11px] text-center text-gray-700 font-black px-4 uppercase tracking-wider">
                What will be your role?
             </p>

             <div className="space-y-3">
                {gender !== 'male' && (
                  <PremiumCard 
                    selected={role === 'citizen'} 
                    onClick={() => setRole('citizen')} 
                    icon={Shield} 
                    title="Citizen / Women Safety" 
                    sub="PROTECTION SHIELD" 
                    desc="Access SOS, Live Tracking, and Forensic Evidence features for personal safety." 
                    color="blue"
                  />
                )}
                
                <PremiumCard 
                  selected={role === 'protector'} 
                  onClick={() => setRole('protector')} 
                  icon={UserCheck} 
                  title="Protector / Rakshak" 
                  sub="SAFETY VOLUNTEER" 
                  desc="Join the network to help people in distress and receive emergency alerts." 
                  color="blue"
                />
             </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 opacity-30 pt-2 pb-4">
             <Shield size={10} className="text-gray-400" />
             <span className="text-[8px] font-black uppercase tracking-[2px] text-gray-400">Kavach Safety Grid Secure Node</span>
          </div>
       </div>
    </motion.div>
  );
}
