import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

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
      className="space-y-4 sm:space-y-6 pt-2"
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="forgot-step-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-5"
          >
            <div className="space-y-1.5 text-center pb-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B2545] uppercase">
                {t('forgot_password_q')}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {t('reset_desc')}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
                <input
                  required
                  type="email"
                  placeholder={t('enter_email')}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-medium placeholder:font-normal outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleForgotPassword}
                disabled={loading || !email.trim()}
                className="w-full py-3.5 sm:py-4 bg-[#0B2545] hover:bg-[#031c44] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={15} />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{t('send_reset_link')}</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </div>
                )}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={onBack}
                className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-[#0B2545] transition-all group"
              >
                Back to <span className="text-[#2563EB] group-hover:underline underline-offset-4">Login</span>
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
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="text-emerald-500" size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black tracking-tight text-[#0B2545] uppercase">
                {t('email_sent')}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                {t('check_inbox')} <br/><span className="text-[#2563EB]">{email}</span>
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={() => setStep(1)} 
                className="w-full py-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-[#0B2545] hover:bg-white transition-all shadow-sm"
              >
                {t('resend')}
              </button>
              <button 
                onClick={onBack} 
                className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-[#2563EB] hover:underline transition-all underline-offset-4"
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
