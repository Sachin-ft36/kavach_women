import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

// 🌈 Official Google Logo
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

interface LoginViewProps {
  onLogin: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
  onForgotClick: () => void;
  onSignupClick: () => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
}

export default function LoginView({
  onLogin,
  onGoogleLogin,
  onForgotClick,
  onSignupClick,
  email,
  setEmail,
  password,
  setPassword,
  loading
}: LoginViewProps) {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-6"
    >
      <form onSubmit={onLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">{t('email_address')}</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-accent-red transition-all duration-300" size={16} />
            <input
              required
              type="email"
              placeholder={t('enter_email')}
              className="w-full bg-white/[0.02] border-2 border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-accent-red/20 focus:bg-white/[0.04] transition-all placeholder:text-gray-800 font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">{t('password')}</label>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-accent-red transition-all duration-300" size={16} />
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder={t('enter_password')}
              className="w-full bg-white/[0.02] border-2 border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-black outline-none focus:border-accent-red/20 focus:bg-white/[0.04] transition-all placeholder:text-gray-800 font-mono"
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
          <div className="flex justify-end pr-1">
            <button
              type="button"
              onClick={onForgotClick}
              className="text-[9px] font-black text-accent-red uppercase tracking-widest hover:underline underline-offset-4 decoration-accent-red/30 italic"
            >
              {t('forgot_password_q')}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-accent-red text-white rounded-[18px] font-black uppercase tracking-[4px] text-[10px] shadow-[0_0_30px_rgba(255,59,48,0.2)] hover:shadow-[0_0_50px_rgba(255,59,48,0.4)] active:scale-[0.98] transition-all mt-2 border-2 border-white/10 italic"
        >
          {loading ? t('authenticating') : t('login')}
        </button>
      </form>

      <div className="space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <span className="relative px-4 text-[8px] font-black text-gray-700 uppercase tracking-[4px] bg-[#020205]">{t('verified_id')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onGoogleLogin}
            className="py-3.5 bg-white/[0.03] border-2 border-white/5 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-white/10 active:scale-[0.97] transition-all"
          >
            <GoogleLogo /> GOOGLE
          </button>
          <button
            type="button"
            className="py-3.5 bg-white/[0.03] border-2 border-white/5 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-white/10 active:scale-[0.97] transition-all"
          >
            <AppleLogo /> APPLE
          </button>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSignupClick}
          className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] hover:text-white transition-all group"
        >
          {t('new_to_kavach') + ' '}
          <span className="text-accent-red group-hover:underline underline-offset-4 decoration-accent-red/40">{t('get_started')}</span>
        </button>
      </div>
    </motion.div>

  );
}
