import React, { useState } from 'react';
import { ArrowLeft, Trash2, Shield, User, Users, Folder, MessageSquare, Settings, Lock, Eye, EyeOff, X, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import DeleteWarningBanner from './DeleteWarningBanner';

interface DeleteAccountProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useKavachTheme } from '../../providers/ThemeProvider';

export default function DeleteAccount({ isOpen, onClose }: DeleteAccountProps) {
  const { themeTokens } = useKavachTheme();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (!password) {
      toast.error("Please enter your account password to confirm.");
      return;
    }
    if (!agreed) {
      toast.error("Please check the confirmation box.");
      return;
    }
    toast.error("Delete request submitted. Account deletion is pending verification.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200" style={{ backgroundColor: themeTokens.surface.background }}>
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Delete Account</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">We're sorry to see you go</p>
            </div>
          </div>

          {/* Glowing Red Trash Shield Icon */}
          <div className="w-8.5 h-8.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <Trash2 size={15} className="text-red-500" />
          </div>
        </header>

        {/* Top Warning Banner */}
        <DeleteWarningBanner />

        {/* What will be deleted? */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5 px-1">What will be deleted?</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Profile */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <User size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Your Profile</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Name, email, phone number, profile picture and account details</p>
                </div>
              </div>
              <X size={14} className="text-red-400 shrink-0 ml-2" />
            </div>

            {/* Family & Guardian */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Users size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Family &amp; Guardian Data</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Family circles, guardians, invites and connections</p>
                </div>
              </div>
              <X size={14} className="text-red-400 shrink-0 ml-2" />
            </div>

            {/* Safety Data */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Shield size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Safety Data</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">SOS history, alerts, locations, check-ins and safety activity</p>
                </div>
              </div>
              <X size={14} className="text-red-400 shrink-0 ml-2" />
            </div>

            {/* Evidence & Media */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Folder size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Evidence &amp; Media</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Photos, videos, audio recordings and documents</p>
                </div>
              </div>
              <X size={14} className="text-red-400 shrink-0 ml-2" />
            </div>

            {/* Messages & Contacts */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <MessageSquare size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Messages &amp; Contacts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Chats, broadcasts and saved contacts</p>
                </div>
              </div>
              <X size={14} className="text-red-400 shrink-0 ml-2" />
            </div>

            {/* Preferences */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Settings size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Preferences &amp; Settings</h4>
                  <p className="text-[10px] text-slate-405 mt-0.5">App preferences, notifications, permissions and themes</p>
                </div>
              </div>
              <X size={14} className="text-red-400 shrink-0 ml-2" />
            </div>

          </div>
        </section>

        {/* Security Confirmation Card */}
        <section className="bg-[#0d0c1b] border border-[#222135] rounded-[18px] p-3.5 space-y-3 mb-1 text-left shadow-sm">
          <h3 className="text-[13px] font-semibold text-white">For your security, please confirm</h3>
          
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
              <Lock size={14} />
            </div>
            <div>
              <p className="text-[10.5px] text-slate-300">To continue, please re-authenticate your identity.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Enter your account password.</p>
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#110e25] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-red-500 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer bg-transparent border-none"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Checkbox agreement */}
          <div 
            onClick={() => setAgreed(!agreed)}
            className="text-[10px] text-slate-300 flex items-start gap-2 mt-2 select-none cursor-pointer"
          >
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
              agreed ? 'bg-red-500 border-red-500 text-white' : 'border-white/20'
            }`}>
              {agreed && <Check size={10} strokeWidth={3.5} />}
            </div>
            <span className="leading-tight">I understand that this action is <span className="text-red-400 font-semibold">permanent</span> and all my data will be deleted.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-1.5 flex flex-col gap-1.5">
            <button
              onClick={handleDelete}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-[#b91c1c] hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold text-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_3px_15px_rgba(239,68,68,0.2)] active:scale-[0.98] border-none"
            >
              <Trash2 size={14} /> Delete My Account
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl font-semibold text-[12px] transition-all cursor-pointer bg-transparent"
            >
              Cancel
            </button>
          </div>
        </section>

        {/* Info Retained regulations box */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-[12px] p-3 flex items-start gap-2.5 text-left">
          <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            Some data may be retained for legal or security purposes as per government regulations.
          </p>
        </div>

      </div>
    </div>
  );
}

// Simple local Check component for checkbox
function Check({ size, strokeWidth }: { size: number, strokeWidth: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
