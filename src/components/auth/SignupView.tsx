import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, Shield, Check, CheckCircle2, Sparkles, Smartphone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface SignupViewProps {
  onSignup: (e: React.FormEvent) => void;
  onLoginClick: () => void;
  username: string;
  setUsername: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
}

export default function SignupView({
  onSignup,
  onLoginClick,
  username,
  setUsername,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  loading
}: SignupViewProps) {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [isFetchingHint, setIsFetchingHint] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(phone.length > 0);

  useEffect(() => {
    if (email.length < 5 || !email.includes('@')) {
      setEmailExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const { db } = await import('../../firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
        const snapshot = await getDocs(q);
        setEmailExists(!snapshot.empty);
      } catch (e) {
        console.warn("Email scan failed");
      } finally {
        setCheckingEmail(false);
      }
    }, 600); // 600ms Debounce

    return () => clearTimeout(timer);
  }, [email]);

  const fetchPhoneHint = async () => {
    setIsFetchingHint(true);
    try {
      const { registerPlugin, Capacitor } = await import('@capacitor/core');
      const KavachNative = registerPlugin<any>('KavachPlugin');

      // Web Fallback for local testing
      if (!Capacitor.isNativePlatform()) {
        const manual = prompt("Enter 10-digit number (Web Dev Mode):");
        if (manual) setPhone(manual.replace(/\D/g, '').slice(-10));
        return;
      }

      const result = await KavachNative.getPhoneHint();

      if (result.number) {
        let clean = result.number.replace(/\D/g, '');
        if (clean.length > 10) clean = clean.slice(-10);
        setPhone(clean);
        KavachNative.triggerHapticPulse();
      }
    } catch (e: any) {
      console.warn("KAVACH_LOG: Hint unavailable. Switching to Manual Mode.", e);
      setIsManualEntry(true); 
      const { toast } = await import('sonner');
      toast.info("SIM selection unavailable. Please enter number manually.");
    } finally {
      setIsFetchingHint(false);
    }
  };

  const requirements = [
    { label: "8+ Char", met: password.length >= 8 },
    { label: "Caps", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Symbol", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  useEffect(() => {
    const metCount = requirements.filter(r => r.met).length;
    setStrength(metCount);
  }, [password]);

  const getStrengthData = () => {
    if (strength === 0) return { color: "bg-white/5", label: "None", text: "text-gray-600" };
    if (strength <= 1) return { color: "bg-red-500", label: t('weak'), text: "text-red-500" };
    if (strength === 2) return { color: "bg-yellow-500", label: t('fair'), text: "text-yellow-500" };
    if (strength === 3) return { color: "bg-blue-500", label: t('good'), text: "text-blue-500" };
    return { color: "bg-green-500", label: t('strong'), text: "text-green-500" };
  };

  const sData = getStrengthData();

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-6"
    >
      <form onSubmit={onSignup} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">{t('fullname')}</label>
          <input
            required
            type="text"
            placeholder={t('enter_name')}
            className="w-full bg-white/[0.02] border-2 border-white/5 rounded-2xl py-3 px-6 text-[10px] font-black tracking-widest outline-none focus:border-accent-red/20 focus:bg-white/[0.04] transition-all placeholder:text-gray-800 placeholder:uppercase font-mono"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">{t('phone_number')}</label>
          <div className="relative flex items-center bg-white/[0.02] border-2 border-white/5 rounded-2xl overflow-hidden focus-within:border-accent-red/20 transition-all">
            <div className="flex items-center gap-2 pl-5 pr-3 py-3">
              <span className="text-[11px] font-black text-white tracking-widest">+91</span>
              <div className="w-[1px] h-3 bg-white/10" />
            </div>
            <input
              required
              readOnly={!isManualEntry && !phone}
              type={isManualEntry ? "text" : "tel"}
              placeholder={isFetchingHint ? "INITIALIZING SECURE..." : isManualEntry ? "ENTER MOBILE NUMBER" : "SELECT VERIFIED SIM"}
              className={cn(
                "flex-1 bg-transparent py-3 pr-2 text-[11px] placeholder:text-[14px] font-black outline-none placeholder:text-gray-800 placeholder:tracking-normal font-mono tracking-[4px] cursor-pointer",
                phone ? "text-accent-blue" : (isManualEntry ? "text-white" : "text-gray-500")
              )}
              value={phone}
              onChange={(e) => {
                if (isManualEntry) {
                   const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                   setPhone(val);
                }
              }}
              onClick={() => {
                if (!phone && !isManualEntry && !isFetchingHint) fetchPhoneHint();
              }}
            />
            {phone ? (
              <button
                type="button"
                onClick={() => setPhone('')}
                className="pr-4 text-[7px] font-black text-accent-red uppercase tracking-widest hover:underline"
              >
                Reset
              </button>
            ) : (
              <div className={cn(
                "pr-4 flex items-center gap-1.5 text-accent-blue transition-all",
                isFetchingHint && "animate-pulse"
              )}>
                <div className="flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 px-2 py-2 rounded-xl text-accent-blue">
                  <Smartphone size={12} className="shrink-0" />
                  <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Select SIM</span>
                </div>
              </div>
            )}
          </div>
          {!phone && (
            <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest pl-1 pt-1 italic">
              * SIM identification required for grid access
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">{t('email_address')}</label>
          <input
            required
            type="email"
            placeholder={t('enter_email')}
            className="w-full bg-white/[0.02] border-2 border-white/5 rounded-2xl py-3 px-6 text-[10px] font-black tracking-widest outline-none focus:border-accent-red/20 focus:bg-white/[0.04] transition-all placeholder:text-gray-800 placeholder:uppercase font-mono"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailExists && (
            <motion.p
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="text-[8px] text-accent-red font-black uppercase tracking-widest pl-1 pt-1"
            >
              Identity already exists in Grid
            </motion.p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">{t('password')}</label>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder={t('enter_password')}
              className="w-full bg-white/[0.02] border-2 border-white/5 rounded-2xl py-3 px-6 text-[10px] font-black tracking-widest outline-none focus:border-accent-red/20 focus:bg-white/[0.04] transition-all placeholder:text-gray-800 placeholder:uppercase font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors"
            >
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="px-1 pt-1.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest italic">Grid Security</span>
              <span className={cn("text-[8px] font-black uppercase tracking-widest", sData.text)}>{sData.label}</span>
            </div>

            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: (strength / 4) * 100 + '%' }}
                className={cn("h-full transition-all duration-500 shadow-[0_0_10px_currentColor]", sData.color)}
              />
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn("w-1 h-1 rounded-full", req.met ? "bg-accent-red shadow-[0_0_5px_rgba(255,59,48,1)]" : "bg-white/10")} />
                  <span className={cn(
                    "text-[7px] font-black uppercase tracking-widest transition-all",
                    req.met ? "text-gray-300" : "text-gray-600"
                  )}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || strength < 4 || emailExists || checkingEmail}
          className="w-full py-4 bg-white text-black rounded-[18px] font-black uppercase tracking-[4px] text-[10px] shadow-2xl active:scale-[0.98] transition-all mt-3 border-2 border-white/10 disabled:opacity-30 disabled:grayscale italic"
        >
          {loading ? t('deploying') : checkingEmail ? "Scanning..." : t('create_account')}
        </button>
      </form>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onLoginClick}
          className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] hover:text-white transition-all group"
        >
          {t('already_registered') + ' '}
          <span className="text-accent-red group-hover:underline underline-offset-4 decoration-accent-red/20 italic">{t('login')}</span>
        </button>
      </div>
    </motion.div>

  );
}
