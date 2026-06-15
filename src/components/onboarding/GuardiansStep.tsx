import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserPlus, Trash2, Shield, Heart, Landmark, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface GuardiansStepProps {
  guardians: { name: string; phone: string; relation: string }[];
  setGuardians: (guardians: { name: string; phone: string; relation: string }[]) => void;
  userPhone?: string;
}

export default function GuardiansStep({ 
  guardians, 
  setGuardians,
  userPhone
}: GuardiansStepProps) {
  const { t } = useLanguage();
  
  const [draftPhone, setDraftPhone] = useState('');
  const [draftRelation, setDraftRelation] = useState('Father');

  const handleAddClick = () => {
    if (draftPhone.length < 10) return;

    // Check if the guardian number is the same as the user's own number
    const cleanUserPhone = userPhone?.replace(/\D/g, '').slice(-10) || '';
    const cleanDraftPhone = draftPhone.replace(/\D/g, '').slice(-10);
    
    if (cleanUserPhone && cleanUserPhone === cleanDraftPhone) {
      toast.error('Invalid Guardian', {
        description: 'You cannot add your own phone number as a Guardian.'
      });
      return;
    }

    setGuardians([...guardians, { name: draftRelation, phone: draftPhone, relation: draftRelation }]);
    setDraftPhone('');
    setDraftRelation('Father');
  };

  const removeGuardian = (index: number) => {
    const updated = guardians.filter((_, i) => i !== index);
    setGuardians(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col min-h-0 font-sans w-full max-w-md mx-auto relative px-2 sm:px-4"
    >
      {/* Official Header */}
      <div className="flex flex-col items-center space-y-2 mt-2 mb-4 text-center shrink-0">
        <Landmark className="text-[#000080]" size={24} strokeWidth={1.5} />
        <div className="space-y-0.5">
          <h2 className="text-[16px] sm:text-[18px] font-black tracking-widest text-[#000080] uppercase">
            Emergency Registry
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            National Safety Grid • Form 3A
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-4">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-300 pb-2 px-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#000080]">Authorize Trusted Contacts</span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mandatory Step</span>
        </div>

        {/* Notice Info Box */}
        <div className="bg-blue-50 border-l-2 border-[#000080] px-3 py-2 flex items-start gap-2.5 rounded-r-sm">
          <Info size={14} className="text-[#000080] shrink-0 mt-0.5" />
          <p className="text-[9px] sm:text-[9.5px] font-bold text-[#000080] uppercase tracking-wide leading-relaxed">
            SOS alerts, live geolocation, and emergency evidence will be securely routed to these registered guardians.
          </p>
        </div>

        {/* Official Form Container */}
        <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden relative">
          <div className="h-1.5 w-full flex">
            <div className="h-full flex-1 bg-[#FF9933]"></div>
            <div className="h-full flex-1 bg-white"></div>
            <div className="h-full flex-1 bg-[#138808]"></div>
          </div>

          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserPlus size={12} className="text-[#000080]" />
              <span className="text-[9px] font-black text-[#000080] uppercase tracking-widest">
                Add Guardian Detail
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4 bg-white">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                Relationship <span className="text-red-600">*</span>
              </label>
              <select 
                value={draftRelation}
                onChange={(e) => setDraftRelation(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-sm text-xs font-bold text-slate-900 uppercase tracking-wide outline-none focus:border-[#000080] transition-all"
              >
                {['Father', 'Mother', 'Brother', 'Sister', 'Husband', 'Wife', 'Friend', 'Guardian'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center w-full rounded-sm border border-slate-300 bg-white overflow-hidden focus-within:border-[#000080] transition-all">
                <div className="flex items-center justify-center h-[40px] px-3 text-[11px] font-black text-slate-700 border-r border-slate-300 bg-slate-50 shrink-0">
                  +91
                </div>
                <input 
                  type="tel" 
                  maxLength={10} 
                  placeholder="10-DIGIT NUMBER" 
                  value={draftPhone} 
                  onChange={(e) => setDraftPhone(e.target.value.replace(/\D/g, ''))} 
                  className="flex-1 h-[40px] px-3 bg-transparent border-none outline-none text-xs font-bold text-slate-900 font-mono tracking-[0.1em] placeholder:text-[9px]"
                />
              </div>
            </div>

            <button 
              onClick={handleAddClick} 
              disabled={draftPhone.length < 10}
              className={cn(
                "w-full py-2.5 rounded-sm text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] border-none",
                draftPhone.length === 10
                  ? "bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] hover:bg-blue-900 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              <CheckCircle2 size={12} />
              <span>Authorize & Add Contact</span>
            </button>
          </div>
        </div>

        {/* Registered Guardians List */}
        {guardians.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-1.5 px-1">
              <ShieldCheck size={12} /> Active Guardians ({guardians.length})
            </h3>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {guardians.map((g, idx) => (
                    <motion.div 
                      key={`${g.phone}-${idx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-slate-200 rounded-sm p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-sm bg-blue-50 border border-blue-100 flex items-center justify-center text-[#000080] font-black text-xs shrink-0">
                          {g.name[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="px-1.5 py-0.5 bg-[#000080] text-white rounded-[2px] text-[7px] font-black uppercase tracking-widest w-fit">
                            {g.relation}
                          </span>
                          <p className="text-[10px] sm:text-[11px] text-slate-800 font-bold font-mono tracking-widest mt-1">
                            +91 {g.phone}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeGuardian(idx)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}