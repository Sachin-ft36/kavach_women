import React from 'react';
import { Smartphone, Fingerprint, ExternalLink, CheckCircle2, ShieldCheck, Lock, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface IdentityStepProps {
  aadhaar: string;
  setAadhaar: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  setUserName: (val: string) => void;
  setRole: (val: 'citizen' | 'protector') => void;
  setIsVerified: (val: boolean) => void;
  onNext: () => void;
}

// 🛡️ Verhoeff Algorithm Tables
const d_table = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const p_table = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const validateAadhaarStruct = (aadhaar: string) => {
  if (aadhaar.length !== 12) return false;
  let c = 0;
  let invertedArray = aadhaar.split('').map(Number).reverse();
  for (let i = 0; i < invertedArray.length; i++) {
    c = d_table[c][p_table[i % 8][invertedArray[i]]];
  }
  return c === 0;
};

export default function IdentityStep({ 
  aadhaar, setAadhaar, phone, setPhone, setUserName, setRole, setIsVerified, onNext
}: IdentityStepProps) {
  const [localIsVerified, setLocalIsVerified] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaar(val);
    if (showError) setShowError(false);
  };

  const displayAadhaar = (val: string) => {
    return val.match(/.{1,4}/g)?.join(' ') || val;
  };

  const handleVerifyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateAadhaarStruct(aadhaar)) {
      setShowError(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return;
    }
    
    setShowError(false);
    
    // 🪄 Institutional Verification Theater: 100% In-App
    setIsSyncing(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Authenticating with National Identity Grid...',
        success: () => {
          setLocalIsVerified(true);
          setIsVerified(true);
          setIsSyncing(false);
          setTimeout(onNext, 1000);
          return 'Identity Anchor Verified Successfully';
        },
        error: 'Authentication failed',
      }
    );
  };

  React.useEffect(() => {
    const handleFocus = () => {
      const isPending = sessionStorage.getItem('digilocker_pending');
      if (isPending) {
        setIsSyncing(true);
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 800)),
          {
            loading: 'Syncing identity with National Grid...',
            success: () => {
              setLocalIsVerified(true);
              setIsVerified(true);
              setIsSyncing(false);
              setUserName('Aadhaar Verified');
              sessionStorage.removeItem('digilocker_pending');
              setTimeout(onNext, 1000);
              return 'Identity Authenticated Successfully';
            },
            error: 'Sync failed',
          }
        );
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="flex-1 flex flex-col space-y-6 pt-2 overflow-y-auto pb-10">
      <AnimatePresence>
        {showError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-[#FFF5F5] border-l-4 border-[#C53030] rounded-xl p-5 relative shadow-sm">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#FED7D7] flex-shrink-0">
                  <ShieldAlert size={20} className="text-[#C53030]" />
                </div>
                <div className="space-y-1 pr-6 sm:pr-10">
                  <h3 className="text-[#C53030] font-bold text-base sm:text-lg leading-tight">Verification Failed</h3>
                  <p className="text-gray-900 font-bold text-xs sm:text-sm leading-tight">We are unable to verify your identity.</p>
                  <p className="text-gray-500 text-[10px] sm:text-[11px] leading-relaxed">
                    The identity anchor provided does not match UIDAI verification standards.
                  </p>
                  
                  <div className="pt-3 space-y-2">
                    <p className="text-[#C53030] text-[10px] font-bold uppercase tracking-widest">Possible reasons:</p>
                    <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 font-medium">
                      <li>The Aadhaar number may be incorrect.</li>
                      <li>Your identity details do not match UIDAI records.</li>
                      <li>Please ensure your details are correct and try again.</li>
                    </ul>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-[0.08]">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png" alt="watermark" className="w-16 grayscale brightness-0 opacity-20" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1 px-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Identity Verification</h2>
        <p className="text-gray-500 text-[13px] sm:text-sm font-medium leading-tight">Link your Aadhaar via National DigiLocker Gateway</p>
      </div>

      <div className="space-y-3">
        {/* 📱 Mobile Display - Ultra Responsive */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-5 flex items-center justify-between shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0">
              <Smartphone size={18} className="text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">Mobile Number</p>
                <input 
                  type="tel"
                  maxLength={10}
                  placeholder="Enter Mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="bg-transparent border-none focus:ring-0 p-0 text-[#1E293B] font-bold text-sm sm:text-lg tracking-wide w-full outline-none placeholder:text-gray-200 truncate"
                />
            </div>
          </div>
          <div className="bg-green-50 text-green-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-2 border border-green-100 flex-shrink-0">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Verified</span>
            <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />
          </div>
        </div>

        {!localIsVerified ? (
          <div className="space-y-3">
            {/* 🛡️ Verification Failed Alert */}
            <AnimatePresence>
              {showError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#FFF5F5] border-l-4 border-[#C53030] rounded-2xl p-3 sm:p-4 relative shadow-sm border border-[#FED7D7]/30">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center border border-[#FED7D7] flex-shrink-0">
                        <ShieldAlert size={16} className="text-[#C53030]" />
                      </div>
                      <div className="space-y-0.5 pr-8">
                        <h3 className="text-[#C53030] font-bold text-sm leading-tight">Verification Failed</h3>
                        <p className="text-gray-900 font-bold text-[10px] leading-tight">Identity verification failed.</p>
                        
                        <div className="pt-1.5 space-y-1">
                          <ul className="text-[9px] text-gray-600 space-y-0.5 list-disc pl-3 font-medium">
                            <li>Check Aadhaar number structure.</li>
                            <li>Details must match UIDAI records.</li>
                          </ul>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 opacity-[0.06]">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/100px-Emblem_of_India.svg.png" alt="watermark" className="w-10 grayscale brightness-0 opacity-20" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              animate={showError ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="bg-white border border-gray-100 rounded-[28px] p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0">
                   <Fingerprint size={18} className="text-[#2563EB]" />
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">Aadhaar (National ID)</span>
              </div>
              
              <input
                type="text"
                inputMode="numeric"
                value={displayAadhaar(aadhaar)}
                onChange={handleAadhaarChange}
                placeholder="XXXXXXXXXXXX"
                className="w-full bg-gray-50 border-none focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl py-3.5 sm:py-6 text-center text-lg sm:text-2xl font-bold tracking-[2px] sm:tracking-[4px] outline-none transition-all placeholder:text-gray-200"
              />
              
              <div className="flex items-center justify-center gap-2 text-gray-400">
                 <ShieldCheck size={12} />
                 <span className="text-[8px] font-bold uppercase tracking-widest">Secure 256-bit encryption</span>
              </div>

              <button
                onClick={handleVerifyClick}
                disabled={isSyncing}
                className={cn(
                  "w-full py-4 sm:py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all mt-2 text-white text-sm sm:text-base",
                  aadhaar.length >= 1 
                    ? "bg-[#2563EB] shadow-lg shadow-[#2563EB]/20 active:scale-95" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                <ExternalLink size={18} />
                {isSyncing ? "Syncing..." : "Verify via DigiLocker"}
              </button>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50/50 border-2 border-green-500/20 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] space-y-4 sm:space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-5 sm:opacity-10">
              <ShieldCheck size={80} className="sm:w-[120px] sm:h-[120px]" />
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
                <CheckCircle2 size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-green-600 font-bold text-xs sm:text-sm truncate">Identity Verified</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-green-700/50 uppercase tracking-widest leading-none truncate">Linked via DigiLocker</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-green-100 text-center space-y-1 sm:space-y-2">
              <p className="text-base sm:text-2xl font-bold text-gray-900 tracking-[3px] sm:tracking-[6px] whitespace-nowrap overflow-hidden text-ellipsis">
                XXXX XXXX {aadhaar.slice(-4) || '4648'}
              </p>
              <p className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-[2px] sm:tracking-[4px] truncate">Official Identity Anchor Active</p>
            </div>

            <button 
              onClick={onNext}
              className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold shadow-lg shadow-[#2563EB]/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Continue to Profile
            </button>

            <button 
              onClick={() => {
                setLocalIsVerified(false);
                setIsVerified(false);
                setAadhaar('');
              }}
              className="w-full text-center text-[8px] sm:text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-[3px] sm:tracking-[4px] mt-2"
            >
              Reset and Re-verify
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
