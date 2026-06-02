import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, UserCheck, Car, Lock, X } from 'lucide-react';
import { PremiumCard } from './PremiumCard';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface RoleStepProps {
  role: 'citizen' | 'protector' | 'pcr_officer' | null;
  setRole: (val: 'citizen' | 'protector' | 'pcr_officer') => void;
  gender: 'female' | 'male' | null;
}

export default function RoleStep({ role, setRole, gender }: RoleStepProps) {
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
                
                {gender !== 'female' && (
                  <PremiumCard 
                    selected={role === 'protector'} 
                    onClick={() => setRole('protector')} 
                    icon={UserCheck} 
                    title="Civic Protector (Civilian)" 
                    sub="SAFETY VOLUNTEER" 
                    desc="Join the civilian network as a volunteer to assist nearby emergency cases." 
                    color="blue"
                  />
                )}

                <PremiumCard 
                  selected={role === 'pcr_officer'} 
                  onClick={handlePcrClick} 
                  icon={Car} 
                  title="Official Police / PCR Patrol" 
                  sub="LAW ENFORCEMENT" 
                  desc="Official Police PCR Patrol unit. En-route dynamic maps, auto-dispatch triggers, and operational duties." 
                  color="blue"
                />
             </div>
          </div>

           <div className="flex items-center justify-center gap-2.5 opacity-30 pt-2 pb-4">
             <Shield size={10} className="text-gray-400" />
             <span className="text-[8px] font-black uppercase tracking-[2px] text-gray-400">Kavach Safety Grid Secure Node</span>
          </div>
       </div>

       <AnimatePresence>
         {showAuth && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           >
             <motion.div 
               initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
               className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden"
             >
               <button onClick={handleAuthCancel} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full">
                 <X size={16} />
               </button>

               <div className="flex flex-col items-center text-center space-y-4 mb-6">
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                   <Lock size={32} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Restricted Access</h3>
                   <p className="text-xs font-bold text-gray-500 mt-1">Enter Beta Testing Passcode to proceed as Police/PCR Patrol.</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <input 
                   type="password" 
                   value={passcode}
                   onChange={(e) => setPasscode(e.target.value)}
                   placeholder="Enter Command Passcode"
                   className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono text-center tracking-widest text-lg"
                 />
                 <button 
                   onClick={handleAuthSubmit}
                   className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-md shadow-blue-600/20"
                 >
                   Verify Identity
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
}
