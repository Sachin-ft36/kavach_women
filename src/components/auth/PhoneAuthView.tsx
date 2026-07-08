import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, ShieldCheck, ArrowRight, RefreshCcw } from 'lucide-react';
import { sendPhoneOTP, verifyPhoneOTP } from '../../hooks/auth_modules/phoneAuth';

interface PhoneAuthViewProps {
  onSuccess: () => void;
  onBack: () => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
}

export default function PhoneAuthView({ onSuccess, onBack, loading, setLoading }: PhoneAuthViewProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;
    const success = await sendPhoneOTP(phoneNumber, 'recaptcha-container', setLoading);
    if (success) {
      setStep('OTP');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    const success = await verifyPhoneOTP(otpCode, setLoading);
    if (success) {
      onSuccess();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-5"
    >
      {/* Invisible Recaptcha Container */}
      <div id="recaptcha-container"></div>

      <div className="text-center space-y-1.5 mb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Secure Phone Access</h2>
        <p className="text-[11px] text-slate-500 font-medium">
          {step === 'PHONE' ? "Enter your mobile number to receive a secure OTP." : "Enter the 6-digit code sent to your phone."}
        </p>
      </div>

      {step === 'PHONE' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Mobile Number</label>
            <div className="relative group">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
              <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">
                +91
              </div>
              <input
                required
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-3 pl-[70px] pr-4 text-xs font-medium placeholder:font-normal outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || phoneNumber.length < 10}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {loading ? <RefreshCcw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {loading ? "SENDING OTP..." : "REQUEST OTP"}
            </button>
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-full mt-3 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
            >
              Back to Email Login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#0B2545] pl-0.5">Enter OTP Code</label>
            <input
              required
              type="text"
              maxLength={6}
              placeholder="••••••"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-3 px-4 text-center text-xl tracking-[12px] font-black placeholder:font-normal outline-none focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-slate-300 text-slate-800 shadow-sm"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3.5 bg-[#052B68] hover:bg-[#031c44] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <ShieldCheck size={15} strokeWidth={2.5} />
              {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
            </button>
            <button
              type="button"
              onClick={() => { setStep('PHONE'); setOtpCode(''); }}
              disabled={loading}
              className="w-full mt-3 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
            >
              Change Phone Number
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
