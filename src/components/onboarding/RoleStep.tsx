import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  UserCheck, 
  Car, 
  Lock, 
  X, 
  MapPin, 
  Radio, 
  Siren, 
  Clipboard, 
  Users, 
  ShieldAlert, 
  FileText, 
  Activity, 
  ShieldCheck, 
  ArrowRight,
  Landmark,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

interface RoleStepProps {
  role: 'citizen' | 'protector' | 'pcr_officer' | null;
  setRole: (val: 'citizen' | 'protector' | 'pcr_officer') => void;
  gender: 'female' | 'male' | null;
  onNext: () => void;
  isKeyboardOpen?: boolean;
}

export default function RoleStep({ role, setRole, gender, onNext, isKeyboardOpen }: RoleStepProps) {
  const { t } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handlePcrClick = () => {
    setShowAuth(true);
    setPasscode('');
  };

  const handleAuthSubmit = () => {
    if (passcode === 'Singhsachin@#0012') {
      setRole('pcr_officer');
      setShowAuth(false);
      toast.success("PCR Authorization Successful");
    } else {
      toast.error("Invalid Passcode", { description: "Please check your passcode and try again." });
      setPasscode('');
    }
  };

  const handleAuthCancel = () => {
    setShowAuth(false);
  };

  const handleCardClick = (targetRole: 'citizen' | 'protector' | 'pcr_officer') => {
    if (targetRole === 'pcr_officer' && role !== 'pcr_officer') {
      handlePcrClick();
    } else {
      setRole(targetRole);
    }
  };

  const citizenFeatures = [
    {
      icon: <span className="font-black text-[7px] tracking-tighter">SOS</span>,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "SOS",
      title2: "Alert"
    },
    {
      icon: <MapPin size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Live",
      title2: "Tracking"
    },
    {
      icon: <Shield size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Guardian",
      title2: "Network"
    },
    {
      icon: <FileText size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Evidence",
      title2: "Vault"
    }
  ];

  const pcrFeatures = [
    {
      icon: <MapPin size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Live",
      title2: "Maps"
    },
    {
      icon: <Radio size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Auto",
      title2: "Dispatch"
    },
    {
      icon: <Siren size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Emergency",
      title2: "Routing"
    },
    {
      icon: <Clipboard size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Patrol",
      title2: "Management"
    }
  ];

  const protectorFeatures = [
    {
      icon: <ShieldAlert size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "SOS",
      title2: "Alerts"
    },
    {
      icon: <Activity size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Active",
      title2: "Escort"
    },
    {
      icon: <MapPin size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Duty",
      title2: "Grid"
    },
    {
      icon: <Users size={11} className="stroke-[2.5]" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title1: "Community",
      title2: "Network"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col space-y-4 min-h-0 font-sans w-full max-w-lg mx-auto"
    >
      {/* Official Header */}
      <div className="flex flex-col items-center space-y-2 mt-2 mb-1 text-center">
        <Landmark className="text-[#000080]" size={36} strokeWidth={1.5} />
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

        {/* GOI Footer */}
        {!isKeyboardOpen && (
          <div className="flex flex-col items-center gap-1.5 pt-6 pb-2">
            <div className="flex items-center justify-between w-full border-t border-slate-300 pt-3 px-1">
              <div className="flex items-center gap-2.5 text-left">
                <img src="/emblem-dark.png" alt="Emblem of India" className="h-10 w-auto object-contain shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">
                    Govt. of India Initiative
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold leading-none uppercase tracking-wider">
                    Securing Citizens Digitally
                  </span>
                </div>
              </div>
              <img src="/Made-In-India-Lion-PNG-Cutout.png" alt="Made in India" className="h-9 w-auto object-contain opacity-80" />
            </div>
          </div>
        )}
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

      {/* Verification Passcode Dialog (Restricted Access) */}
      <AnimatePresence>
        {showAuth && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-md p-6 shadow-2xl relative border-2 border-[#000080]"
            >
              <button onClick={handleAuthCancel} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-sm">
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center space-y-3 mb-6">
                <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-sm flex items-center justify-center text-red-700 mb-1">
                  <Lock size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#000080] tracking-widest uppercase">Restricted Clearance</h3>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Enter Department Passcode to proceed.</p>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="password" 
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="AUTHORIZATION CODE"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-sm outline-none focus:border-[#000080] focus:bg-blue-50/30 font-mono font-bold text-center tracking-[0.3em] text-sm uppercase placeholder:tracking-widest placeholder:text-xs"
                />
                <button 
                  onClick={handleAuthSubmit}
                  className="w-full py-3.5 bg-[#000080] text-white rounded-sm font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
                >
                  Verify Clearance
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}