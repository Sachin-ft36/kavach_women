import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  UserCheck, 
  Car, 
  ArrowRight,
  Landmark,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { citizenFeatures, pcrFeatures, protectorFeatures } from './constants/roleFeatures';
import PcrAuthModal from './PcrAuthModal';
import { usePcrAuth } from './hooks/usePcrAuth';

interface RoleStepProps {
  role: 'citizen' | 'protector' | 'pcr_officer' | null;
  setRole: (val: 'citizen' | 'protector' | 'pcr_officer') => void;
  gender: 'female' | 'male' | null;
  onNext: () => void;
  isKeyboardOpen?: boolean;
}

export default function RoleStep({ role, setRole, gender, onNext, isKeyboardOpen }: RoleStepProps) {
  const { t } = useLanguage();
  const {
    showAuth,
    passcode,
    setPasscode,
    handleAuthSubmit,
    handleAuthCancel,
    handleCardClick
  } = usePcrAuth(role, setRole);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col space-y-4 min-h-0 font-sans w-full max-w-lg mx-auto"
    >
      {/* Official Header */}
      <div className="flex flex-col items-center space-y-2 mt-2 mb-1 text-center">
        <Landmark className="text-[#000080]" size={24} strokeWidth={1.5} />
        <div className="space-y-0.5">
          <h2 className="text-[18px] font-black tracking-widest text-[#000080] uppercase">
            Service Designation
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            National Safety Grid • Form 2A
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar pb-6 space-y-4">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-300 pb-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#000080]">Select Operating Role</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Step 2 of 2</span>
        </div>

        <div className="space-y-3.5">
          
          {/* 1. Citizen / Women Safety Card */}
          {gender !== 'male' && (
            <button
              onClick={() => handleCardClick('citizen')}
              className={cn(
                "w-full text-left p-4 rounded-md border transition-all duration-300 relative overflow-hidden group select-none cursor-pointer flex flex-col gap-3",
                role === 'citizen'
                  ? "border-[#000080] bg-blue-50/40 shadow-sm"
                  : "bg-white border-slate-300 hover:border-blue-300 hover:bg-slate-50"
              )}
            >
              {role === 'citizen' && (
                <div className="absolute top-0 right-0 bg-[#000080] text-white p-1 rounded-bl-md">
                  <CheckCircle2 size={14} strokeWidth={3} />
                </div>
              )}
              
              <div className="flex items-start gap-3 relative z-10 w-full">
                <div className={cn(
                  "w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border",
                  role === 'citizen' ? "bg-[#000080] text-white border-[#000080]" : "bg-slate-100 text-[#000080] border-slate-200"
                )}>
                  <Shield size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[12px] font-black text-[#000080] tracking-widest uppercase">
                      Citizen Safety Shield
                    </h3>
                  </div>
                  <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">
                    Civilian • Women Protection
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
                {citizenFeatures.map((feat, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center gap-1">
                    <div className={cn("w-6 h-6 rounded-sm flex items-center justify-center", feat.iconBg, feat.iconColor)}>
                      {feat.icon}
                    </div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
                      {feat.title1}<br/>{feat.title2}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )}

          {/* 2. Civic Protector Card */}
          {gender !== 'female' && (
            <button
              onClick={() => handleCardClick('protector')}
              className={cn(
                "w-full text-left p-4 rounded-md border transition-all duration-300 relative overflow-hidden group select-none cursor-pointer flex flex-col gap-3",
                role === 'protector'
                  ? "border-[#000080] bg-blue-50/40 shadow-sm"
                  : "bg-white border-slate-300 hover:border-blue-300 hover:bg-slate-50"
              )}
            >
              {role === 'protector' && (
                <div className="absolute top-0 right-0 bg-[#000080] text-white p-1 rounded-bl-md">
                  <CheckCircle2 size={14} strokeWidth={3} />
                </div>
              )}
              
              <div className="flex items-start gap-3 relative z-10 w-full">
                <div className={cn(
                  "w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border",
                  role === 'protector' ? "bg-[#000080] text-white border-[#000080]" : "bg-slate-100 text-[#000080] border-slate-200"
                )}>
                  <UserCheck size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[12px] font-black text-[#000080] tracking-widest uppercase">
                      Civic Volunteer
                    </h3>
                  </div>
                  <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">
                    Civilian • Rakshak Unit
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
                {protectorFeatures.map((feat, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center gap-1">
                    <div className={cn("w-6 h-6 rounded-sm flex items-center justify-center", feat.iconBg, feat.iconColor)}>
                      {feat.icon}
                    </div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
                      {feat.title1}<br/>{feat.title2}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )}

          {/* 3. Official Police / PCR Patrol Card */}
          <button
            onClick={() => handleCardClick('pcr_officer')}
            className={cn(
              "w-full text-left p-4 rounded-md border transition-all duration-300 relative overflow-hidden group select-none cursor-pointer flex flex-col gap-3",
              role === 'pcr_officer'
                ? "border-[#000080] bg-blue-50/40 shadow-sm"
                : "bg-white border-slate-300 hover:border-blue-300 hover:bg-slate-50"
            )}
          >
            {role === 'pcr_officer' && (
              <div className="absolute top-0 right-0 bg-[#000080] text-white p-1 rounded-bl-md">
                <CheckCircle2 size={14} strokeWidth={3} />
              </div>
            )}
            
            <div className="absolute top-0 right-0 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-100 text-red-700 border-b border-l border-red-200 rounded-bl-md">
              Restricted
            </div>
            
            <div className="flex items-start gap-3 relative z-10 w-full">
              <div className={cn(
                "w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border",
                role === 'pcr_officer' ? "bg-[#000080] text-white border-[#000080]" : "bg-slate-100 text-[#000080] border-slate-200"
              )}>
                <Car size={20} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[12px] font-black text-[#000080] tracking-widest uppercase">
                    Law Enforcement
                  </h3>
                </div>
                <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">
                  Police • PCR Patrol
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
              {pcrFeatures.map((feat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center gap-1">
                  <div className={cn("w-6 h-6 rounded-sm flex items-center justify-center", feat.iconBg, feat.iconColor)}>
                    {feat.icon}
                  </div>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
                    {feat.title1}<br/>{feat.title2}
                  </span>
                </div>
              ))}
            </div>
          </button>

        </div>


      </div>

      {/* Sticky Proceed Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-300 p-3 z-20">
        <motion.button
          whileTap={role ? { scale: 0.98 } : undefined}
          disabled={!role}
          onClick={onNext}
          className={cn(
            "w-full py-4 rounded-md font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all border-none",
            role
              ? "bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] cursor-pointer hover:bg-blue-900"
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          )}
        >
          <span>Authorize & Proceed</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </motion.button>
      </div>

      <PcrAuthModal
        isOpen={showAuth}
        passcode={passcode}
        setPasscode={setPasscode}
        onSubmit={handleAuthSubmit}
        onCancel={handleAuthCancel}
      />
    </motion.div>
  );
}