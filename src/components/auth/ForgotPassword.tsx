import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Shield, ArrowRight, Fingerprint, Key, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface ForgotPasswordProps {
  onBack: () => void;
  initialEmail?: string;
}

export default function ForgotPassword({ onBack, initialEmail = '' }: ForgotPasswordProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(initialEmail);

  const handleForgotPassword = async () => {
    if (!email.includes('@')) return toast.error("Please enter a valid email");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset link sent!");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Internal Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pt-12"
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="forgot-step-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center pb-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{t('forgot_password_q')}</h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[3px] opacity-60">{t('reset_desc')}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] pl-1">Email Address</label>
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

            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full py-4 bg-accent-red text-white rounded-[18px] font-black uppercase tracking-[4px] text-[10px] shadow-[0_0_30px_rgba(255,59,48,0.2)] active:scale-[0.98] transition-all border-2 border-white/10 italic flex items-center justify-center gap-3"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <div className="flex items-center gap-2">
                  <span>{t('send_reset_link')}</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                onClick={onBack}
                className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] hover:text-white transition-all group"
              >
                Back to <span className="text-accent-red group-hover:underline underline-offset-4 decoration-accent-red/20 italic">Login</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="forgot-step-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/20 rounded-[24px] flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">{t('email_sent')}</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">
                {t('check_inbox')} <br/><span className="text-accent-red">{email}</span>
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={() => setStep(1)} 
                className="w-full py-3 bg-white/[0.03] border-2 border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
              >
                {t('resend')}
              </button>
              <button 
                onClick={onBack} 
                className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-accent-red hover:underline decoration-accent-red/30 transition-all underline-offset-4 italic"
              >
                {t('back_to_login')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
