import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface GuardiansStepProps {
  guardians: { name: string; phone: string }[];
  setGuardians: (guardians: { name: string; phone: string }[]) => void;
}

export default function GuardiansStep({ 
  guardians, 
  setGuardians
}: GuardiansStepProps) {
  const { t } = useLanguage();
  
  // Local draft state for the form
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');

  const handleAddClick = () => {
    if (!draftName || draftPhone.length < 10) return;
    
    // Add the new guardian to the list
    setGuardians([...guardians, { name: draftName, phone: draftPhone }]);
    
    // Reset the form
    setDraftName('');
    setDraftPhone('');
  };

  const removeGuardian = (index: number) => {
    const updated = guardians.filter((_, i) => i !== index);
    setGuardians(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col space-y-8 py-4 overflow-x-hidden"
    >
       {/* Icon & Title */}
       <div className="flex flex-col items-center space-y-6 pt-4">
          <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-[24px] flex items-center justify-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="text-blue-500" size={28} />
              </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              {t('guardian_circle')}
            </h1>
            <p className="text-[10px] text-white/60 font-black uppercase tracking-widest px-10 leading-relaxed">
              {t('trust_contacts')}
            </p>
          </div>
       </div>

       {/* List of Finalized Guardians */}
       <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar px-2 max-h-[40vh]">
          <AnimatePresence mode="popLayout">
            {guardians.map((g, idx) => (
                <motion.div 
                  key={`${g.phone}-${idx}`}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className="bg-[#0A0A0A] border border-white/10 rounded-[24px] p-5 flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <p className="text-[12px] font-black uppercase text-white tracking-widest">{g.name}</p>
                    <p className="text-[10px] text-white/30 font-bold font-mono tracking-wider">+91 {g.phone}</p>
                  </div>
                  <button 
                    onClick={() => removeGuardian(idx)}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:scale-110 transition-transform px-2 py-1"
                  >
                    DEL
                  </button>
                </motion.div>
            ))}
          </AnimatePresence>

          {/* Active Input Form - Using Local Draft State */}
          <motion.div 
            layout
            className="bg-[#050505] border-2 border-dashed border-white/10 rounded-[32px] p-6 space-y-5 shadow-2xl relative mt-4"
          >
             <div className="space-y-4">
                <div className="space-y-2">
                  <input 
                    placeholder={t('name')} 
                    value={draftName} 
                    onChange={(e) => setDraftName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} 
                    className="w-full bg-black border border-white/20 rounded-2xl py-4 px-6 text-[12px] font-bold text-white placeholder:text-white/50 outline-none focus:border-blue-500 transition-all shadow-inner" 
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[12px] font-bold text-white/80">+91</div>
                  <input 
                    type="tel" 
                    maxLength={10} 
                    placeholder={t('phone')} 
                    value={draftPhone} 
                    onChange={(e) => setDraftPhone(e.target.value.replace(/\D/g, ''))} 
                    className="w-full bg-black border border-white/20 rounded-2xl py-4 pl-14 pr-6 text-[12px] font-bold text-white placeholder:text-white/50 outline-none focus:border-blue-500 transition-all shadow-inner" 
                  />
                </div>
             </div>

             <button 
                onClick={handleAddClick} 
                disabled={!draftName || draftPhone.length < 10}
                className="w-full py-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase text-blue-400 hover:bg-blue-600/20 transition-all active:scale-95 disabled:opacity-20 disabled:grayscale tracking-[2px]"
             >
                {t('add_guardian')}
             </button>
          </motion.div>
       </div>
    </motion.div>
  );
}
