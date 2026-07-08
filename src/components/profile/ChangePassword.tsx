import React, { useState } from 'react';
import { ArrowLeft, Lock, Shield, ShieldCheck, Check, Eye, EyeOff, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePassword({ isOpen, onClose }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0b0914] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-10 h-10 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-[17px] font-bold text-white tracking-tight leading-tight">Change Password</h1>
              <p className="text-[10px] text-gray-400 mt-0.5 font-normal">Keep your account secure with a strong password</p>
            </div>
          </div>

          {/* Reference matched Shield with Sparkles SVG (Enlarged & positioned absolutely to float outside) */}
          <div className="absolute right-[-12px] top-[-16px] w-[84px] h-[84px] overflow-visible z-20 pointer-events-none">
            <svg width="84" height="84" viewBox="0 0 54 54" fill="none" className="overflow-visible">
              {/* Backglow */}
              <circle cx="27" cy="27" r="16" fill="url(#purpleShieldGlow)" filter="blur(4px)" opacity="0.6" />
              
              {/* Shield Outline */}
              <path d="M27 9L15 13.5V25.5C15 34.5 21 41.7 27 44C33 41.7 39 34.5 39 25.5V13.5L27 9Z" fill="#0d0a1b" stroke="#7c3aed" strokeWidth="1.8" />
              
              {/* Lock inside shield */}
              <g transform="translate(20, 20)">
                <rect x="2" y="5" width="10" height="7" rx="1.5" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
                <path d="M4 5V3.5C4 2.1 5.1 1 6.5 1V1C7.9 1 9 2.1 9 3.5V5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Sparkles */}
              {/* Top Left */}
              <path d="M9 14L10 16L12 17L10 18L9 20L8 18L6 17L8 16L9 14Z" fill="#c084fc" opacity="0.8" />
              {/* Bottom Right */}
              <path d="M45 34L46 36L48 37L46 38L45 40L44 38L42 37L44 36L45 34Z" fill="#c084fc" opacity="0.8" />
              {/* Top Right small */}
              <path d="M42 12L42.5 13L43.5 13.5L42.5 14L42 15L41.5 14L40.5 13.5L41.5 13L42 12Z" fill="#a78bfa" />
              {/* Bottom Left small */}
              <path d="M10 38L10.5 39L11.5 39.5L10.5 40L10 41L9.5 40L8.5 39.5L9.5 39L10 38Z" fill="#a78bfa" />

              <defs>
                <radialGradient id="purpleShieldGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </header>

        {/* Top Banner Card */}
        <section className="bg-gradient-to-br from-[#121028] to-[#0d0a1b] border border-[#22213a] rounded-[18px] p-4 flex items-center gap-4 relative overflow-hidden mb-6 text-left shadow-lg">
          {/* Reference matched Lock + Password Mask + Reload SVG */}
          <div className="relative shrink-0 w-[110px] h-[76px] overflow-visible">
            <svg width="110" height="76" viewBox="0 0 110 76" fill="none" className="overflow-visible">
              {/* Padlock loop (Background layer) */}
              <path d="M34 29V19C34 11.8 39.8 6 47 6C54.2 6 60 11.8 60 19V29" stroke="url(#lockLoopGradient)" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* Lock Body */}
              <rect x="25" y="27" width="44" height="28" rx="8" fill="#12102e" stroke="#5b21b6" strokeWidth="2.5" />
              <circle cx="47" cy="40" r="3.5" fill="#5b21b6" />
              <path d="M47 43.5V47" stroke="#5b21b6" strokeWidth="2.5" strokeLinecap="round" />

              {/* Password mask input pill */}
              <rect x="8" y="44" width="86" height="22" rx="11" fill="#090518" stroke="#7c3aed" strokeWidth="1.8" />
              
              {/* Mask Asterisks */}
              <g transform="translate(18, 51)">
                {/* * * * * */}
                <text x="0" y="8" fill="#a78bfa" fontSize="13" fontWeight="900" letterSpacing="6">* * * *</text>
              </g>

              {/* Refresh / Rotation Loop badge overlapping on the right */}
              <g transform="translate(80, 42)">
                <circle cx="12" cy="12" r="12" fill="#1c1642" stroke="#7c3aed" strokeWidth="1.8" />
                <path d="M16.5 9.5C15.2 8.3 13.5 7.5 11.6 7.5C8 7.5 5 10.1 4.5 13.5" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7.5 14.5C8.8 15.7 10.5 16.5 12.4 16.5C16 16.5 19 13.9 19.5 10.5" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M17 7V10H14" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 17V14H10" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Small sparkles */}
              <path d="M15 15L15.5 16.5L17 17L15.5 17.5L15 19L14.5 17.5L13 17L14.5 16.5L15 15Z" fill="#c084fc" opacity="0.7" />
              <path d="M76 18L76.5 19.5L78 20L76.5 20.5L76 22L75.5 20.5L74 20L75.5 19.5L76 18Z" fill="#c084fc" opacity="0.7" />
              <path d="M96 28L96.5 29.5L98 30L96.5 30.5L96 32L95.5 30.5L94 30L95.5 29.5L96 28Z" fill="#a78bfa" opacity="0.6" />

              <defs>
                <linearGradient id="lockLoopGradient" x1="34" y1="6" x2="60" y2="29" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#4c1d95" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <h2 className="text-[14px] font-bold text-white mb-1">Strong passwords keep you safe</h2>
            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              Use a unique password that you don't use on other platforms.
            </p>
          </div>
        </section>

        {/* Forms Container Card */}
        <section className="bg-[#0d0c1b] border border-[#222135] rounded-[24px] p-5 space-y-4 mb-6 text-left shadow-md">
          {/* Current Password */}
          <div>
            <label className="text-[11.5px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 block">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full bg-[#110e25] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#7C4DFF] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-550 hover:text-slate-355 cursor-pointer bg-transparent border-none"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-[11.5px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 block">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full bg-[#110e25] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#7C4DFF] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-555 hover:text-slate-355 cursor-pointer bg-transparent border-none"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>Password Strength</span>
                  <span className={
                    newPassword.length < 6 ? 'text-red-500' :
                    newPassword.length < 10 ? 'text-amber-500' : 'text-emerald-400'
                  }>
                    {newPassword.length < 6 ? 'Weak' :
                     newPassword.length < 10 ? 'Medium' : 'Strong'}
                  </span>
                </div>
                {/* Progress Blocks */}
                <div className="w-full flex gap-1.5 mt-2">
                  <div className={`h-1.5 flex-1 rounded-full ${
                    newPassword.length >= 1 ? (newPassword.length < 6 ? 'bg-red-500' : newPassword.length < 10 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/5'
                  }`} />
                  <div className={`h-1.5 flex-1 rounded-full ${
                    newPassword.length >= 6 ? (newPassword.length < 10 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/5'
                  }`} />
                  <div className={`h-1.5 flex-1 rounded-full ${
                    newPassword.length >= 8 ? (newPassword.length < 10 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/5'
                  }`} />
                  <div className={`h-1.5 flex-1 rounded-full ${
                    newPassword.length >= 10 ? 'bg-emerald-500' : 'bg-white/5'
                  }`} />
                </div>
              </div>
            )}

            {/* Requirements Checklist */}
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5 space-y-2 mt-4">
              <h4 className="text-[11.5px] font-bold text-[#a78bfa] flex items-center gap-1.5 mb-2.5">
                <ShieldCheck size={14} className="text-[#a78bfa]" /> Password must contain:
              </h4>
              <ul className="space-y-2 text-[11px] text-slate-400">
                <li className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                    newPassword.length >= 8 ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400' : 'border-white/10 text-slate-500'
                  }`}>
                    <Check size={9} strokeWidth={3} />
                  </div>
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                    /[A-Z]/.test(newPassword) ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400' : 'border-white/10 text-slate-500'
                  }`}>
                    <Check size={9} strokeWidth={3} />
                  </div>
                  One uppercase letter (A-Z)
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                    /[a-z]/.test(newPassword) ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400' : 'border-white/10 text-slate-500'
                  }`}>
                    <Check size={9} strokeWidth={3} />
                  </div>
                  One lowercase letter (a-z)
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                    /[0-9]/.test(newPassword) ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400' : 'border-white/10 text-slate-500'
                  }`}>
                    <Check size={9} strokeWidth={3} />
                  </div>
                  One number (0-9)
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                    /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400' : 'border-white/10 text-slate-500'
                  }`}>
                    <Check size={9} strokeWidth={3} />
                  </div>
                  One special character (!@#$%^&* etc.)
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-[11.5px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 block">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full bg-[#110e25] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#7C4DFF] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-555 hover:text-slate-355 cursor-pointer bg-transparent border-none"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </section>

        {/* Tips Card */}
        <section className="bg-[#0e0c20]/60 border border-[#222135] rounded-[24px] p-5 flex items-center justify-between gap-3 mb-6 relative overflow-hidden text-left shadow-sm">
          <div className="flex items-start gap-3.5 z-10">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <Lightbulb size={18} className="text-purple-400" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-white">Tips for a strong password</h4>
              <ul className="text-[10.5px] text-slate-400 mt-2 space-y-1.5">
                <li>• Use a mix of letters, numbers & symbols</li>
                <li>• Avoid using your name or birthdate</li>
                <li>• Don't share your password with anyone</li>
              </ul>
            </div>
          </div>

          <div className="absolute right-2 bottom-2 text-purple-500/5 select-none pointer-events-none">
            <Shield className="w-24 h-24" />
          </div>
        </section>

        {/* Update Button CTA */}
        <button
          onClick={() => {
            if (!currentPassword || !newPassword || !confirmPassword) {
              toast.error("Please fill all the password fields.");
              return;
            }
            if (newPassword !== confirmPassword) {
              toast.error("Passwords do not match.");
              return;
            }
            if (newPassword.length < 8) {
              toast.error("Password must be at least 8 characters.");
              return;
            }
            toast.success("Password changed successfully!");
            onClose();
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
          className="w-full py-4 bg-gradient-to-r from-[#7C4DFF] to-[#6035f5] hover:from-[#8b5cf6] hover:to-[#7C4DFF] text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_25px_rgba(124,77,255,0.35)] active:scale-[0.98] border-none"
        >
          <Lock size={16} /> Update Password
        </button>

      </div>
    </div>
  );
}
