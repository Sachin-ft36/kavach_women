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
      <form onSubmit={onSignup} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-main pl-1">{t('fullname')}</label>
          <div className="relative">
            <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
            <input
              required
              type="text"
              placeholder={t('enter_name')}
              className="w-full bg-bg border border-border rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-accent-blue focus:bg-white transition-all placeholder:text-text-dim"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-main pl-1">{t('phone_number')}</label>
          <div className="relative flex items-center bg-bg border border-border rounded-2xl overflow-hidden focus-within:border-accent-blue transition-all">
            <div className="flex items-center gap-2 pl-5 pr-3 py-4">
              <span className="text-sm font-bold text-text-main">+91</span>
              <div className="w-[1px] h-4 bg-border" />
            </div>
            <input
              required
              readOnly={!isManualEntry && !phone}
              type={isManualEntry ? "text" : "tel"}
              placeholder={isFetchingHint ? "Identifying number..." : isManualEntry ? "Enter mobile number" : "Use my mobile number"}
              className={cn(
                "flex-1 bg-transparent py-4 pr-2 text-sm font-bold outline-none placeholder:text-text-dim placeholder:font-medium",
                phone ? "text-accent-blue" : "text-text-main"
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
                className="pr-4 text-xs font-bold text-accent-red hover:underline"
              >
                Change
              </button>
            ) : (
              <div className={cn(
                "pr-4 flex items-center gap-1.5 text-accent-blue transition-all",
                isFetchingHint && "animate-pulse"
              )}>
                <div className="flex items-center gap-2 bg-accent-blue/5 border border-accent-blue/20 px-3 py-2 rounded-xl text-accent-blue cursor-pointer" onClick={fetchPhoneHint}>
                  <Smartphone size={16} className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Auto Detect</span>
                </div>
              </div>
            )}
          </div>
          {!phone && (
            <p className="text-[10px] text-text-dim font-medium pl-1 pt-1">
              You can also type your number manually
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-main pl-1">{t('email_address')}</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
            <input
              required
              type="email"
              placeholder={t('enter_email')}
              className="w-full bg-bg border border-border rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-accent-blue focus:bg-white transition-all placeholder:text-text-dim"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {emailExists && (
            <p className="text-xs font-bold text-accent-red pl-1 pt-1">
              This email is already registered
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-main pl-1">{t('password')}</label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder={t('enter_password')}
              className="w-full bg-bg border border-border rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-accent-blue focus:bg-white transition-all placeholder:text-text-dim"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main transition-colors"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          <div className="px-1 pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Password Strength</span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", sData.text)}>{sData.label}</span>
            </div>

            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: (strength / 4) * 100 + '%' }}
                className={cn("h-full transition-all duration-500", sData.color)}
              />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", req.met ? "bg-accent-green" : "bg-border")} />
                  <span className={cn(
                    "text-[10px] font-bold transition-all",
                    req.met ? "text-text-main" : "text-text-dim"
                  )}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || strength < 4 || emailExists || checkingEmail}
            className="w-full py-5 bg-accent-blue text-white rounded-2xl font-bold text-lg shadow-lg shadow-accent-blue/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? "Creating Account..." : checkingEmail ? "Scanning..." : t('create_account')}
          </button>
          <p className="text-center mt-4 text-[10px] text-text-dim font-medium leading-relaxed">
            Your data is encrypted and protected under secure safety guidelines.
          </p>
        </div>
      </form>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onLoginClick}
          className="text-sm font-medium text-text-dim hover:text-text-main transition-all group"
        >
          {t('already_registered') + ' '}
          <span className="text-accent-blue font-bold group-hover:underline underline-offset-4">{t('login')}</span>
        </button>
      </div>
    </motion.div>

  );
}
