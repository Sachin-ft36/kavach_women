import React from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IdentityFieldsProps {
  userName: string;
  setUserName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  phoneState: string;
  setPhoneState: (state: any) => void;
  phoneOtp: string;
  setPhoneOtp: (otp: string) => void;
  gender: 'female' | 'male' | null;
  setGender: (gender: 'female' | 'male' | null) => void;
  handleSendOTP: () => void;
  handleVerifyOTP: () => void;
}

export function IdentityFields({
  userName,
  setUserName,
  phone,
  setPhone,
  phoneState,
  setPhoneState,
  phoneOtp,
  setPhoneOtp,
  gender,
  setGender,
  handleSendOTP,
  handleVerifyOTP
}: IdentityFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            Full Name <span className="text-red-600">*</span>
          </label>
        </div>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" 
            placeholder="ENTER FULL LEGAL NAME"
            value={userName} 
            onChange={e => setUserName(e.target.value.toUpperCase())}
            className="w-full pl-9 pr-3 py-2.5 rounded-sm text-xs font-bold uppercase outline-none border border-slate-300 focus:border-[#000080] focus:bg-blue-50/20 transition-all bg-white text-slate-900"
          />
          {userName.trim() && (
            <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" strokeWidth={2.5} />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            Mobile Number <span className="text-red-600">*</span>
          </label>
        </div>
        
        <div className="space-y-3">
          {phoneState === 'idle' && (
            <>
              <div className="flex items-center w-full rounded-sm border border-slate-300 bg-white overflow-hidden focus-within:border-[#000080] transition-all">
                <div className="flex items-center justify-center h-[42px] px-3.5 text-xs font-black text-slate-700 border-r border-slate-300 bg-slate-50 shrink-0">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-DIGIT NUMBER"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 min-w-0 h-[42px] px-3 bg-transparent border-none outline-none text-xs text-left font-bold text-slate-900 placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 tracking-wide"
                />
              </div>
              <button
                type="button" onClick={handleSendOTP} disabled={phone.length < 10}
                className={cn(
                  "w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] border",
                  phone.length === 10
                    ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                Request OTP Authentication
              </button>
            </>
          )}

          {phoneState === 'otp_sent' && (
            <div className="bg-blue-50/50 p-3 rounded-sm border border-blue-100 space-y-3">
              <p className="text-[10px] font-bold text-[#000080] text-center uppercase tracking-wide">
                Enter OTP sent to +91 {phone}
              </p>
              <input
                type="tel" maxLength={6} placeholder="------"
                value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-blue-200 px-4 py-2.5 rounded-sm text-center font-mono font-black tracking-[12px] text-sm outline-none focus:border-[#000080]"
              />
              <button
                type="button" onClick={handleVerifyOTP} disabled={phoneOtp.length < 6}
                className={cn(
                  "w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.99] border",
                  phoneOtp.length === 6
                    ? "bg-[#000080] border-[#000080] text-white hover:bg-blue-900"
                    : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed"
                )}
              >
                Verify OTP
              </button>
            </div>
          )}

          {phoneState === 'verified' && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600" strokeWidth={2.5} />
                <span className="text-[11px] font-black text-slate-800 tracking-wide">+91 {phone}</span>
              </div>
              <button
                type="button"
                onClick={() => { setPhoneState('idle'); setPhoneOtp(''); }}
                className="text-[9px] font-bold text-[#000080] hover:underline px-2 py-1 uppercase tracking-wider"
              >
                [ MODIFY ]
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            Gender <span className="text-red-600">*</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender('female')}
            className={cn(
              "py-3 rounded-sm border flex items-center justify-center gap-2 transition-all",
              gender === 'female' 
                ? "bg-[#000080] border-[#000080] text-white shadow-sm" 
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            )}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Female</span>
          </button>
          <button
            type="button"
            onClick={() => setGender('male')}
            className={cn(
              "py-3 rounded-sm border flex items-center justify-center gap-2 transition-all",
              gender === 'male' 
                ? "bg-[#000080] border-[#000080] text-white shadow-sm" 
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            )}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Male</span>
          </button>
        </div>
      </div>
    </div>
  );
}
