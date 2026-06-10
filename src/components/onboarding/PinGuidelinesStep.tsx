import React from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldAlert, KeyRound, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PinGuidelinesStepProps {
  onNext: () => void;
}

export default function PinGuidelinesStep({ onNext }: PinGuidelinesStepProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col space-y-4 py-2 min-h-0"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 pb-1 text-left">
        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <KeyRound className="text-[#FF9933]" size={20} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 space-y-0.5">
          <h1 className="text-base font-black tracking-tight leading-none" style={{color:'#1B3A6B'}}>
            PIN Guidelines
          </h1>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
            Security PIN Protocol & Safety Features
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#FFF9F0] border border-[#FFE8CC] rounded-2xl p-4 flex gap-3 items-start shrink-0 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-[#FF9933] flex items-center justify-center text-white shrink-0 mt-0.5">
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97706]">Critical Security Protocol</p>
          <p className="text-[11px] font-semibold leading-relaxed mt-0.5 text-[#F59E0B]">
            Your Security PIN is the master key to control alert broadcasts. Understand how it protects you in coercion.
          </p>
        </div>
      </div>

      {/* Guidelines List */}
      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4 custom-scrollbar">
        {/* Core Guidelines */}
        <div className="space-y-3">
          {/* Guideline 1 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#1B3A6B] shrink-0 border border-slate-100">
              <Lock size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Accidental Trigger Prevention</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                If an SOS alert is triggered accidentally, the PIN is required to stand down and cancel the police dispatch within 10 seconds.
              </p>
            </div>
          </div>

          {/* Guideline 2 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#1B3A6B] shrink-0 border border-slate-100">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Duress Disarm (Coercion Safety)</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                If forced by an attacker to enter your PIN to cancel an alert, entering your PIN in reverse or adding 1 to the last digit (e.g. if PIN is 1234, enter 1235) will trigger a "Silent Duress Alert" to response units.
              </p>
            </div>
          </div>

          {/* Guideline 3 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#1B3A6B] shrink-0 border border-slate-100">
              <KeyRound size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-sans">Identity Security Lock</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                Secures your profile registration, active guardians configuration, and system parameters from unauthorized alterations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onNext}
        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] text-white"
        style={{ background: 'linear-gradient(to right, #1B3A6B, #2563EB)', boxShadow: '0 8px 24px rgba(27,58,107,0.15)' }}
      >
        <Check size={16} />
        <span>I Understand, Setup PIN</span>
      </button>
    </motion.div>
  );
}
