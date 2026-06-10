import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, Shield, Check, CheckCircle2, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const { Capacitor } = await import('@capacitor/core');
      const { KavachNative } = await import('../../services/KavachNative');

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
      className="space-y-4 sm:space-y-6"
    >
      <form onSubmit={onSignup} className="space-y-3.5 sm:space-y-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Full Name</label>
          <div className="relative group">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input
              required
              type="text"
              placeholder="Enter your full name"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-medium placeholder:font-normal outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input
              required
              type="email"
              placeholder="example@gmail.com"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-medium placeholder:font-normal outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {emailExists && (
            <p className="text-[11px] font-bold text-red-500 pl-0.5 pt-0.5">
              This email is already registered
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-xs font-medium placeholder:font-normal outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          {/* Strength meter */}
          <div className="px-0.5 pt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Strength</span>
              <span className={cn("text-[9px] font-black uppercase tracking-wider", sData.text)}>{sData.label}</span>
            </div>

            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: (strength / 4) * 100 + '%' }}
                className={cn("h-full transition-all duration-500", sData.color)}
              />
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", req.met ? "bg-emerald-500" : "bg-slate-200")} />
                  <span className={cn(
                    "text-[9.5px] font-bold transition-all",
                    req.met ? "text-slate-700 font-bold" : "text-slate-400"
                  )}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Confirm Password</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input
              required
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className={cn(
                "w-full bg-[#F8FAFC] border rounded-xl py-3 pl-10 pr-10 text-xs font-medium placeholder:font-normal outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm",
                confirmPassword.length > 0 && password !== confirmPassword 
                  ? "border-red-500 focus:border-red-500" 
                  : "border-slate-200 focus:border-[#2563EB] focus:bg-white"
              )}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-[11px] font-bold text-red-500 pl-0.5 pt-0.5">
              Passwords do not match
            </p>
          )}
        </div>

        <div className="pt-1.5">
          <button
            type="submit"
            disabled={loading || strength < 4 || emailExists || checkingEmail || password !== confirmPassword || confirmPassword.length === 0}
            className="w-full py-3.5 sm:py-4 bg-[#052B68] hover:bg-[#031c44] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <ShieldCheck size={15} strokeWidth={2.5} />
            {loading ? "CREATING..." : checkingEmail ? "SCANNING..." : "INITIALIZE ACCOUNT"}
          </button>
          <p className="text-center mt-2.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
            Your data is encrypted and protected under secure safety guidelines.
          </p>
        </div>
      </form>
    </motion.div>
  );
}
