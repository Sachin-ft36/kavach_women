import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Shield, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  Smartphone, 
  MessageSquare, 
  Mail, 
  FileText, 
  Link as LinkIcon, 
  Lock, 
  User, 
  Star,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom component to recreate the glowing 3D shield & phone graphic with pure CSS/SVG
const HeroGraphic = ({ className = "" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    {/* Ambient Glow */}
    <div className="absolute w-[120%] h-[120%] bg-[#00e599]/10 rounded-full blur-3xl"></div>

    {/* Orbital rings / curved paths */}
    <svg className="absolute inset-0 w-[110%] h-[110%] text-[#00e599]/20" viewBox="0 0 200 200" fill="none">
      <path d="M 20 120 C 60 170, 140 170, 180 120" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M 10 100 C 50 160, 150 160, 190 100" stroke="currentColor" strokeWidth="0.8" />
    </svg>

    {/* 3D Phone Mockup */}
    <div className="absolute right-[12%] w-[42%] h-[82%] bg-[#0B101D] border-[1.5px] border-[#1e2d27] rounded-[14px] transform rotate-[10deg] shadow-[0_12px_28px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col justify-between p-1.5">
      {/* Notch */}
      <div className="w-1/2 h-1 bg-[#1e2d27] rounded-full mx-auto mt-0.5"></div>
      
      {/* Tiny password asterisks container */}
      <div className="my-auto w-full py-1 bg-[#00e599]/10 border border-[#00e599]/30 rounded-[4px] flex items-center justify-center gap-0.5">
        <span className="text-[#00e599] text-[6.5px] tracking-[0.1em] font-extrabold">✦ ✦ ✦ ✦ ✦</span>
      </div>
      
      <div className="h-1"></div>
    </div>

    {/* 3D Shield overlapping the phone */}
    <div className="absolute left-[8%] bottom-[12%] z-10 w-[55%] h-[55%] drop-shadow-[0_10px_20px_rgba(0,229,153,0.35)]">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Outer Glowing Border Path */}
        <svg viewBox="0 0 100 100" className="absolute w-full h-full text-[#00e599] fill-[#08201a]/95">
          <path d="M50 10 L85 22 V55 C85 75, 50 90, 50 90 C50 90, 15 75, 15 55 V22 Z" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M50 16 L78 26 V52 C78 68, 50 81, 50 81 C50 81, 22 68, 22 52 V26 Z" fill="#00e599" fillOpacity="0.12" />
        </svg>
        {/* Lock Icon in Center */}
        <div className="absolute inset-0 flex items-center justify-center mt-[-3px]">
          <div className="w-7 h-7 rounded-full bg-[#00e599]/10 border border-[#00e599]/20 flex items-center justify-center text-[#00e599]">
            <Lock size={12} strokeWidth={2.5} fill="currentColor" fillOpacity="0.1" />
          </div>
        </div>
      </div>
    </div>

    {/* Glowing plus / stars decoration */}
    <div className="absolute top-[15%] left-[20%] text-[#00e599]/50 text-[9px] ">+</div>
    <div className="absolute bottom-[25%] left-[5%] text-[#00e599]/50 text-[9px]  delay-100">+</div>
    <div className="absolute top-[35%] right-[10%] text-[#00e599]/40 text-[10px]  delay-300">+</div>
    <div className="absolute bottom-[10%] right-[30%] text-[#00e599]/40 text-[9px]  delay-150">+</div>
  </div>
);

import { useKavachTheme } from '../../providers/ThemeProvider';

export default function TwoFactorAuth({ isOpen, onClose }: TwoFactorAuthProps) {
  const { themeTokens } = useKavachTheme();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200" style={{ backgroundColor: themeTokens.surface.background }}>
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header Section */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-slate-300 bg-[#121620]/80 border border-white/5 hover:bg-[#1A1F2C] rounded-full transition-colors cursor-pointer shadow-md"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-left">
              <h1 className="text-lg font-black text-white tracking-tight leading-tight">Two-Factor Authentication</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Add an extra layer of security to your account</p>
            </div>
          </div>
          {/* Header Shield Hex Badge */}
          <div className="w-10 h-10 rounded-xl bg-[#00e599]/5 border border-[#00e599]/20 flex items-center justify-center text-[#00e599] shrink-0 shadow-sm relative">
            <div className="absolute inset-0 bg-[#00e599]/5 rounded-xl blur-md"></div>
            <ShieldCheck size={20} className="relative z-10" />
          </div>
        </header>

        {/* Hero Banner */}
        <section className="bg-gradient-to-b from-[#041210] to-[#081F1A] border border-[#0f3228] rounded-[24px] p-4 flex flex-col gap-4 relative overflow-hidden text-left shadow-xl">
          
          <div className="flex items-center gap-4 w-full">
            {/* Visual Graphic on the Left */}
            <HeroGraphic className="w-32 h-32 shrink-0" />
            
            {/* Context Text on the Right */}
            <div className="flex-1 flex flex-col items-start z-10 min-w-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-[#00e599]/5 border border-[#00e599]/20 text-[#00e599] text-[8.5px] font-bold tracking-wide mb-2">
                <Star size={9.5} className="fill-[#00e599]/20" /> Recommended
              </div>
              <h2 className="text-[15px] font-black text-white leading-tight mb-1">
                Stronger security <span className="text-[#00e599]">for</span> you
              </h2>
              <p className="text-[10px] text-slate-400 leading-normal">
                Two-Factor Authentication (2FA) makes sure only you can access your account, even if someone else <span className="text-slate-350 font-medium">knows your password.</span>
              </p>
            </div>
          </div>
          
          {/* Horizontal Columns for 3 Features */}
          <div className="grid grid-cols-3 gap-2.5 border-t border-[#0f3228]/60 pt-3.5 mt-0.5 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7.5 h-7.5 rounded-full flex items-center justify-center bg-[#00e599]/10 border border-[#00e599]/20 shrink-0 text-[#00e599]">
                <Lock size={12} />
              </div>
              <span className="text-[9px] text-slate-300 font-semibold leading-tight">Protects your account</span>
            </div>
            
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7.5 h-7.5 rounded-full flex items-center justify-center bg-[#00e599]/10 border border-[#00e599]/20 shrink-0 text-[#00e599]">
                <User size={12} />
              </div>
              <span className="text-[9px] text-slate-300 font-semibold leading-tight">Blocks unauthorized access</span>
            </div>
            
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7.5 h-7.5 rounded-full flex items-center justify-center bg-[#00e599]/10 border border-[#00e599]/20 shrink-0 text-[#00e599]">
                <ShieldCheck size={12} />
              </div>
              <span className="text-[9px] text-slate-300 font-semibold leading-tight">Keeps your data safe & secure</span>
            </div>
          </div>

        </section>

        {/* 2FA Status */}
        <section className="text-left">
          <h3 className="text-[10.5px] font-bold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">2FA Status</h3>
          <div className="bg-[#0B0F17] border border-[#1E2532] rounded-[12px] p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                is2FAEnabled ? 'bg-[#00E599]/10 border-[#00E599]/20 text-[#00E599]' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                <Shield size={16} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                  2FA is <span className={is2FAEnabled ? 'text-[#00E599]' : 'text-red-400'}>{is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
                  {is2FAEnabled && <Check size={11} strokeWidth={3} className="text-[#00E599]" />}
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5 truncate">
                  Your account is protected with 2FA.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIs2FAEnabled(!is2FAEnabled);
                toast.success(is2FAEnabled ? "Two-Factor Authentication disabled" : "Two-Factor Authentication enabled");
              }}
              className={`border px-2.5 py-1 rounded-[8px] text-[10px] font-semibold transition-all cursor-pointer bg-transparent shrink-0 ${
                is2FAEnabled 
                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                  : 'border-[#00E599]/30 text-[#00E599] hover:bg-[#00E599]/10'
              }`}
            >
              {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        </section>

        {/* Authentication Method */}
        <section className="text-left">
          <h3 className="text-[10.5px] font-bold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Authentication Method</h3>
          <div className="bg-[#0B0F17] border border-[#1E2532] rounded-[12px] divide-y divide-[#1E2532] shadow-sm overflow-hidden">
            
            {/* Authenticator App */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#00E599]/10 flex items-center justify-center text-[#00E599] shrink-0">
                  <Smartphone size={16} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[13px] font-semibold text-white">Authenticator App</h4>
                    <span className="bg-[#00E599]/10 text-[#00E599] text-[7.5px] px-1 py-0.2 rounded font-semibold tracking-wide uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Use app to generate security codes</p>
                </div>
              </div>
              <ChevronRight size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-slate-350 transition-colors ml-4" />
            </div>

            {/* SMS Verification */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <MessageSquare size={16} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-semibold text-white">SMS Verification</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Receive security codes via SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => toast.success("SMS verification setup initiated!")}
                  className="border border-[#00E599]/20 text-[#00E599] hover:bg-[#00E599]/10 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer bg-transparent"
                >
                  Set Up
                </button>
                <ChevronRight size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-slate-350 transition-colors" />
              </div>
            </div>

            {/* Email Verification */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Mail size={16} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-semibold text-white">Email Verification</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Receive security codes via email</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => toast.success("Email verification setup initiated!")}
                  className="border border-[#00E599]/20 text-[#00E599] hover:bg-[#00E599]/10 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer bg-transparent"
                >
                  Set Up
                </button>
                <ChevronRight size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-slate-350 transition-colors" />
              </div>
            </div>

          </div>
        </section>

        {/* Backup Options */}
        <section className="text-left">
          <h3 className="text-[10.5px] font-bold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1 flex items-center gap-1">
            Backup Options 
            <Info size={11} className="text-slate-500" />
          </h3>
          <div className="bg-[#0B0F17] border border-[#1E2532] rounded-[12px] divide-y divide-[#1E2532] shadow-sm overflow-hidden">
            
            {/* Backup Codes */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 shrink-0">
                  <FileText size={16} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-semibold text-white">Backup Codes</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Sign in if you lose access to device</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => toast.info("Viewing backup codes...")}
                  className="border border-[#00E599]/20 text-[#00E599] hover:bg-[#00E599]/10 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer bg-transparent"
                >
                  View
                </button>
                <ChevronRight size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-slate-355 transition-colors" />
              </div>
            </div>

            {/* Recovery Options */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <LinkIcon size={16} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-semibold text-white">Recovery Options</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Add recovery email or phone number</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => toast.info("Opening recovery settings...")}
                  className="border border-[#00E599]/20 text-[#00E599] hover:bg-[#00E599]/10 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer bg-transparent"
                >
                  Manage
                </button>
                <ChevronRight size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-slate-355 transition-colors" />
              </div>
            </div>

          </div>
        </section>

        {/* Safety Footer Banner */}
        <div className="bg-gradient-to-r from-[#071E17] to-[#0A1615] border border-[#0A3828] rounded-[16px] p-3.5 flex items-center justify-between gap-4 relative overflow-hidden shadow-md text-left">
          <div className="flex items-start sm:items-center gap-3 z-10 w-full sm:w-[75%]">
            <div className="w-8.5 h-8.5 rounded-lg bg-[#00E599]/10 flex items-center justify-center text-[#00E599] shrink-0">
              <ShieldCheck size={16} className="fill-[#00E599]/10" />
            </div>
            <div>
              <h4 className="text-[13px] font-medium text-white">Keep your account secure</h4>
              <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed pr-4">
                Never share verification codes. KAVACH will never ask for them.
              </p>
            </div>
          </div>
          {/* Reusing the graphic as a faded background decoration on the right */}
          <div className="absolute right-[-50px] top-1/2 -translate-y-1/2 scale-[0.5] opacity-20 pointer-events-none hidden sm:block mix-blend-screen">
            <HeroGraphic className="w-[180px] h-[180px]" />
          </div>
        </div>

      </div>
    </div>
  );
}
