import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertTriangle, Smartphone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { registerPlugin } from '@capacitor/core';
import { cn } from '../../lib/utils';

interface IdentityStepProps {
  aadhaar: string;
  setAadhaar: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
}

// 🛡️ Verhoeff Algorithm for Aadhaar Checksum Validation
const verhoeffTableD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const verhoeffTableP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
const verhoeffInv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function validateAadhaar(aadhaar: string) {
  if (aadhaar.length !== 12) return false;
  let c = 0;
  let invertedAadhaar = aadhaar.split('').reverse().map(Number);
  for (let i = 0; i < invertedAadhaar.length; i++) {
    c = verhoeffTableD[c][verhoeffTableP[(i % 8)][invertedAadhaar[i]]];
  }
  return (c === 0);
}

export default function IdentityStep({ aadhaar, setAadhaar, phone, setPhone }: IdentityStepProps) {
  const { t } = useLanguage();
  const [isFetchingHint, setIsFetchingHint] = React.useState(false);
  const [isManualEntry, setIsManualEntry] = React.useState(phone.length > 0);

  /* 
  ⚡ TACTICAL PRO-API ENGINE (Aadhaar OTP Verification)
  // Uncomment this section when you have an API key from Surepass, Digio, or Signzy.
  
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpValue, setOtpValue] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);

  const triggerAadhaarOTP = async () => {
    if (!validateAadhaar(aadhaar)) return;
    setIsVerifying(true);
    try {
      // API_ENDPOINT EXAMPLE: https://api.surepass.io/api/v1/aadhaar-v2/generate-otp
      // const response = await fetch('YOUR_API_URL', {
      //   method: 'POST',
      //   headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ id_number: aadhaar })
      // });
      // const data = await response.json();
      // if (data.success) { setOtpSent(true); toast.success("OTP Sent to Aadhaar-Linked Mobile"); }
      toast.info("Aadhaar OTP Simulation: Check linked mobile.");
      setOtpSent(true); 
    } catch (e) { toast.error("Identity Engine Failure"); }
    finally { setIsVerifying(false); }
  }

  const verifyAadhaarOTP = async () => {
    setIsVerifying(true);
    // Logic to verify OTP and anchor phone number...
    setIsVerifying(false);
  }
  */

  const fetchPhoneHint = async () => {
    setIsFetchingHint(true);
    try {
      const KavachNative = registerPlugin<any>('KavachPlugin');
      const result = await KavachNative.getPhoneHint();

      if (result.number) {
        let clean = result.number.replace(/\D/g, '');
        if (clean.length > 10) clean = clean.slice(-10);
        setPhone(clean);
        KavachNative.triggerHapticPulse();
      }
    } catch (e: any) {
      console.warn("KAVACH_LOG: Identity SIM hint failed. Manual fallback enabled.", e);
      setIsManualEntry(true);
    } finally {
      setIsFetchingHint(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col space-y-6 py-4 px-1"
    >
      {/* ── Tactical Header ── */}
      <div className="relative text-center space-y-3">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent-red/5 rounded-full blur-3xl animate-pulse" />

        <div className="space-y-3 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-red/20 to-transparent rounded-[24px] flex items-center justify-center mx-auto border border-accent-red/30 shadow-2xl relative">
            <ShieldCheck className="text-accent-red" size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{t('verification_ready')}</h1>
            <p className="text-[9px] text-accent-red font-black uppercase tracking-[4px] opacity-80">{t('identity_verification')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {/* 📱 MOBILE ANCHORING CARD */}
        <div className={cn(
          "bg-black/40 border-2 rounded-[32px] p-6 transition-all duration-500",
          phone.length === 10 ? "border-green-500/30 bg-green-500/5" : "border-accent-blue/20"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                phone.length === 10 ? "bg-green-500/20 text-green-400" : "bg-accent-blue/20 text-accent-blue"
              )}>
                <Smartphone size={20} />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/90">Mobile Uplink</label>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none">Primary Grid ID</span>
              </div>
            </div>
            {phone.length === 10 && (
              <button onClick={() => setPhone('')} className="text-[8px] font-black text-accent-blue bg-accent-blue/10 px-3 py-1 rounded-full uppercase hover:bg-white hover:text-black transition-all">Change</button>
            )}
          </div>

          <div className="relative">
            {phone.length < 10 && !isManualEntry ? (
              <button
                onClick={fetchPhoneHint}
                className={cn(
                  "w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 flex items-center justify-between group transition-all active:scale-95",
                  isFetchingHint && "animate-pulse border-accent-blue/50"
                )}
              >
                <span className="text-[12px] font-black text-white/30 uppercase tracking-widest italic">Detect SIM Card...</span>
                <div className="bg-accent-blue text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase">Auto-fill</div>
              </button>
            ) : (
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-blue font-black font-mono text-lg">+91</span>
                <input
                  type="tel"
                  autoFocus
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="00000 00000"
                  className={cn(
                    "w-full bg-white/5 border-2 rounded-2xl py-4 pl-14 pr-6 text-2xl font-mono font-black outline-none transition-all",
                    phone.length === 10 ? "border-green-500/40 text-green-400" : "border-white/10 text-white focus:border-accent-blue"
                  )}
                />
              </div>
            )}
            
            {phone.length < 10 && !isManualEntry && (
              <button 
                onClick={() => setIsManualEntry(true)}
                className="w-full text-center py-2 text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2 hover:text-white"
              >
                Or Enter Manually
              </button>
            )}
          </div>
        </div>

        {/* 💳 AADHAAR IDENTITY CARD */}
        <div className={cn(
          "bg-white/[0.03] border-2 rounded-[36px] p-8 shadow-inner relative overflow-hidden transition-all duration-500",
          aadhaar.length === 12 && validateAadhaar(aadhaar) ? "border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.05)]" : "border-white/5"
        )}>
           <div className="absolute top-0 right-0 p-8 opacity-5">
             <ShieldCheck size={120} />
           </div>

           <div className="space-y-4 relative z-10">
              <div className="text-center">
                <label className="text-[11px] font-black text-white/40 uppercase tracking-[4px]">{t('aadhaar_label')}</label>
                <div className="relative mt-4">
                  <input
                    required
                    type="tel"
                    maxLength={14}
                    value={aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 12) setAadhaar(val);
                    }}
                    placeholder="0000 0000 0000"
                    className={cn(
                      "w-full bg-transparent border-b-2 py-4 text-3xl font-mono outline-none text-center tracking-[0.1em] font-black transition-all",
                      aadhaar.length === 12 && !validateAadhaar(aadhaar) 
                        ? "border-accent-red text-accent-red" 
                        : (aadhaar.length === 12 ? "border-green-500 text-green-400" : "border-white/10 focus:border-accent-red text-white")
                    )}
                  />
                </div>
                
                <div className="h-6 mt-3">
                  {aadhaar.length === 12 && !validateAadhaar(aadhaar) && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-accent-red font-black uppercase tracking-widest italic">
                      ⚠️ Identity Format Error
                    </motion.p>
                  )}
                  {aadhaar.length === 12 && validateAadhaar(aadhaar) && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-green-500 font-black uppercase tracking-widest">
                      ✅ Aadhaar Format Synchronized
                    </motion.p>
                  )}
                </div>
              </div>
           </div>
        </div>

        {/* ── Warning Banner ── */}
        <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 flex items-start gap-4">
          <AlertTriangle size={18} className="text-accent-red shrink-0" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 leading-relaxed">
            {t('tos_s3')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
