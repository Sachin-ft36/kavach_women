import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserPlus, Trash2, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface GuardiansStepProps {
  guardians: { name: string; phone: string; relation: string }[];
  setGuardians: (guardians: { name: string; phone: string; relation: string }[]) => void;
}

export default function GuardiansStep({ 
  guardians, 
  setGuardians
}: GuardiansStepProps) {
  const { t } = useLanguage();
  
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftRelation, setDraftRelation] = useState('Father');

  const handleAddClick = () => {
    if (!draftName || draftPhone.length < 10) return;
    setGuardians([...guardians, { name: draftName, phone: draftPhone, relation: draftRelation }]);
    setDraftName('');
    setDraftPhone('');
    setDraftRelation('Father');
  };

  const removeGuardian = (index: number) => {
    const updated = guardians.filter((_, i) => i !== index);
    setGuardians(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="flex-1 flex flex-col space-y-4 sm:space-y-8 py-2"
    >
       {/* Header Section */}
       <div className="flex flex-col items-center space-y-2 sm:space-y-4">
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white border border-[#E5E7EB] rounded-xl sm:rounded-[24px] flex items-center justify-center shadow-lg shadow-gray-100">
             <ShieldCheck className="text-[#2563EB] size-5 sm:size-[24px]" />
          </div>
          <div className="text-center space-y-0.5 pt-1">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
              Emergency Contacts
            </h1>
            <p className="text-[11px] sm:text-sm text-gray-500 font-semibold">
              Trusted guardians for immediate SOS coordination
            </p>
          </div>
       </div>

       {/* List and Form */}
       <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto px-1 pb-4 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {guardians.map((g, idx) => (
                <motion.div 
                  key={`${g.phone}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border border-[#E5E7EB] rounded-[18px] sm:rounded-[24px] p-2.5 sm:p-5 flex items-center justify-between shadow-sm hover:border-[#2563EB]/20 transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-[#2563EB]/5 border border-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-sm sm:text-lg shadow-inner flex-shrink-0">
                      {g.name[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{g.name}</p>
                        <span className="px-1.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] rounded text-[8px] font-black uppercase tracking-tighter">{g.relation}</span>
                      </div>
                      <p className="text-[9px] sm:text-[11px] text-gray-400 font-bold tracking-wider">+91 {g.phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeGuardian(idx)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#DC2626] hover:bg-[#DC2626]/5 transition-all shadow-sm flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
            ))}
          </AnimatePresence>

          {/* Input Form */}
          <motion.div 
            layout
            className="bg-white border border-dashed border-[#E5E7EB] rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-8 space-y-3 sm:space-y-6 shadow-sm"
          >
             <div className="space-y-3 sm:space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Guardian Full Name</label>
                    <input 
                    placeholder="Enter name" 
                    value={draftName} 
                    onChange={(e) => setDraftName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} 
                    className="w-full bg-gray-50 border border-[#E5E7EB] rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-sm font-bold text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-gray-300" 
                  />
                </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Relationship</label>
                    <select 
                      value={draftRelation}
                      onChange={(e) => setDraftRelation(e.target.value)}
                      className="w-full bg-gray-50 border border-[#E5E7EB] rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-sm font-bold text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                    >
                      {['Father', 'Mother', 'Brother', 'Sister', 'Husband', 'Wife', 'Friend', 'Guardian'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Emergency Mobile Number</label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-bold text-[#2563EB]">+91</div>
                        <input 
                          type="tel" 
                          maxLength={10} 
                          placeholder="00000 00000" 
                          value={draftPhone} 
                          onChange={(e) => setDraftPhone(e.target.value.replace(/\D/g, ''))} 
                          className="w-full bg-gray-50 border border-[#E5E7EB] rounded-2xl py-3 sm:py-4 pl-14 sm:pl-16 pr-4 sm:pr-6 text-sm font-bold text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-gray-300" 
                        />
                    </div>
                  </div>
             </div>

              <button 
                 onClick={handleAddClick} 
                 disabled={!draftName || draftPhone.length < 10}
                 className="w-full py-3.5 sm:py-4.5 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl shadow-[#2563EB]/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:grayscale"
              >
                <UserPlus size={20} />
                <span className="uppercase tracking-widest">Register Guardian</span>
             </button>
          </motion.div>
       </div>

       {/* Privacy Notice */}
       <div className="flex items-center justify-center gap-2.5 opacity-60 pb-2">
         <Shield size={14} className="text-[#2563EB]" />
         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Official Safety Grid Protection</span>
       </div>
    </motion.div>
  );
}
