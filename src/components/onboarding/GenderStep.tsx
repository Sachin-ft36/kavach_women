import React from 'react';
import { motion } from 'motion/react';
import { User, UserPlus, Shield, Info, Lock, Check } from 'lucide-react';
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
      title: "Female Profile",
      subtitle: "Full access to Women Safety Grid",
      color: 'blue',
    },
    {
      id: 'male' as const,
      icon: UserPlus,
      title: "Male Profile",
      subtitle: "Verified Protector onboarding",
      color: 'blue',
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col space-y-4 min-h-0"
    >
      {/* Header Section */}
      <div className="flex flex-col items-center space-y-2 pt-1">
        <div className="w-12 h-12 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-center shadow-md shadow-gray-100">
          <User className="text-[#2563EB]" size={22} />
        </div>

        <div className="text-center space-y-0.5">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            User Registration
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Select profile category to proceed
          </p>
        </div>
      </div>

      {/* Options Cards */}
      <div className="flex-1 flex flex-col space-y-3 px-1 overflow-y-auto pr-1">
        <label className="text-[9px] font-black uppercase tracking-[3px] text-gray-400 ml-1">Select Category</label>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setGender(opt.id)}
            className={cn(
              "relative overflow-hidden p-4 rounded-[24px] border-2 transition-all duration-300 flex items-center gap-4 shadow-sm group active:scale-[0.98]",
              gender === opt.id
                ? "bg-[#2563EB]/5 border-[#2563EB] shadow-md shadow-[#2563EB]/10"
                : "bg-white border-[#E5E7EB] hover:border-[#2563EB]/30"
            )}
          >
            {/* Icon Box */}
            <div className={cn(
              "w-11 h-11 rounded-xl border flex items-center justify-center shadow-inner transition-all duration-300",
              gender === opt.id
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-gray-50 text-gray-300 border-gray-100"
            )}>
              <opt.icon size={20} />
            </div>

            {/* Labels */}
            <div className="flex-1 text-left">
              <h3 className={cn(
                "text-sm font-black transition-all",
                gender === opt.id ? "text-gray-900" : "text-gray-700"
              )}>
                {opt.title}
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                {opt.subtitle}
              </p>
            </div>

            {gender === opt.id && (
              <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                <Check size={14} />
              </div>
            )}
          </button>
        ))}

        {/* ⚠️ Government Legal Disclaimer */}
        <div className="bg-white border-2 border-amber-100 p-4 rounded-[22px] space-y-2 shadow-sm mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
              <Shield size={14} className="text-amber-600" />
            </div>
            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Verification Notice</span>
          </div>
          <p className="text-[9px] font-bold text-gray-500 leading-tight italic">
            Inaccurate documentation is a punishable offence. Your identity will be digitally anchored.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 opacity-30 pt-2 pb-4">
          <Lock size={12} className="text-gray-400" />
          <span className="text-[8px] font-black uppercase tracking-[2px] text-gray-400">Official Identity Grid Security</span>
        </div>
      </div>
    </motion.div>
  );
}
