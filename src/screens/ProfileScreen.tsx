import React, { useState } from 'react';
import {
  User, Shield, ShieldCheck, Pencil, ChevronRight,
  Award, Lock, Smartphone, Trash2, Bell, Globe, Moon, PhoneCall,
  Cloud, Database, HelpCircle, Headphones, AlertTriangle, LogOut,
  Calendar, Users, Check, BadgeCheck, ArrowLeft, Camera, Mail, MapPin, X,
  Eye, EyeOff, Lightbulb, Search, Activity, Volume2, Key, Radio, Zap
} from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import PersonalInfo from '../components/profile/PersonalInfo';
import ChangePassword from '../components/profile/ChangePassword';
import TwoFactorAuth from '../components/profile/TwoFactorAuth';
import PrivacySettings from '../components/profile/PrivacySettings';
import DeleteAccount from '../components/profile/DeleteAccount';
import DataStorage from '../components/profile/DataStorage';
import BackupRestore from '../components/profile/BackupRestore';
import EmergencyContacts from '../components/profile/EmergencyContacts';
import ThemeSettings from '../components/profile/ThemeSettings';
import NotificationSettings from '../components/profile/NotificationSettings';
import LanguageSettings from '../components/profile/LanguageSettings';
import HelpCenter from '../components/profile/HelpCenter';
import ContactSupport from '../components/profile/ContactSupport';
import ReportIssue from '../components/profile/ReportIssue';
import AboutKavach from '../components/profile/AboutKavach';

// ── DESIGN SYSTEM CONSTANTS & TOKENS ──
const DESIGN_SYSTEM = {
  radius: 'rounded-[20px]',
  innerPadding: 'p-5',
  rowHeight: 'h-[82px]', // exactly 82px row height
  iconSize: 'w-12 h-12', // exactly 48px
  badgeHeight: 'h-[22px]', // exactly 22px
  sectionSpacing: 'mb-8', // 32px
  screenPadding: 'px-5 py-6',
  transition: 'transition-all duration-[220ms] ease-out',
  divider: 'rgba(255, 255, 255, 0.04)',
};

interface SectionHeaderProps {
  titlePart1: string;
  titlePart2: string;
}

const SectionHeader = ({ titlePart1, titlePart2 }: SectionHeaderProps) => (
  <div className="mt-8 mb-4 px-1 text-left">
    <h3 className="text-[10px] font-bold text-[#a855f7] tracking-[1.5px] uppercase leading-tight drop-shadow-sm">
      {titlePart1} <br />
      <span className="text-white/40">{titlePart2}</span>
    </h3>
    <div className="h-[1px] w-full bg-gradient-to-r from-[#a855f7]/30 via-white/5 to-transparent mt-3.5"></div>
  </div>
);

const MenuBox = ({ children }: { children: React.ReactNode }) => (
  <div className={`bg-[#11111b] border border-white/[0.05] ${DESIGN_SYSTEM.radius} overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md ${DESIGN_SYSTEM.sectionSpacing}`}>
    <div className="flex flex-col">
      {React.Children.map(children, (child, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent shadow-[0_0_4px_rgba(139,92,246,0.15)]" />
          )}
          {child}
        </React.Fragment>
      ))}
    </div>
  </div>
);

interface MenuItemProps {
  icon: any;
  title: string;
  desc: string;
  gradientFrom: string;
  gradientTo: string;
  shadowColor: string;
  onClick: () => void;
  rightText?: string | null;
  rightSubText?: string | null;
  danger?: boolean;
}

const MenuItem = ({ 
  icon: Icon, 
  title, 
  desc, 
  gradientFrom, 
  gradientTo, 
  shadowColor, 
  onClick, 
  rightText = null,
  rightSubText = null,
  danger = false 
}: MenuItemProps) => (
  <div 
    onClick={onClick} 
    className={`flex items-center justify-between px-5.5 ${DESIGN_SYSTEM.rowHeight} cursor-pointer group ${DESIGN_SYSTEM.transition} relative overflow-hidden active:scale-[0.985] ${
      danger ? 'hover:bg-red-500/[0.04] bg-red-950/5 border border-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)] rounded-[20px] m-1 my-1.5' : 'hover:bg-[#161625]'
    }`}
  >
    {/* Ambient Left Icon Radial Glow */}
    <div 
      className={`absolute w-16 h-16 rounded-full blur-xl opacity-20 -left-2 -top-2 pointer-events-none bg-gradient-to-tr ${gradientFrom} ${gradientTo}`} 
    />
    
    {/* Hover Shine Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    
    <div className="flex items-center gap-[18px] min-w-0 flex-1 relative z-10 text-left">
      {/* 48x48 Gradient Icon Circle */}
      <div 
        className={`${DESIGN_SYSTEM.iconSize} rounded-[14px] bg-gradient-to-tr ${gradientFrom} ${gradientTo} flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-[1.08] ${DESIGN_SYSTEM.transition} shadow-md`}
        style={{ boxShadow: `inset 0 1px 1.5px rgba(255,255,255,0.3), 0 4px 10px ${shadowColor}` }}
      >
        <Icon size={19} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" strokeWidth={2.4} />
      </div>

      {/* Expanded Text block to prevent premature wrapping */}
      <div className="min-w-0 flex-1">
        <h4 className={`text-[13.5px] font-semibold tracking-[-0.2px] leading-[20px] mb-[2px] ${danger ? 'text-red-400' : 'text-slate-100 group-hover:text-white transition-colors'}`}>
          {title}
        </h4>
        <p className="text-[11px] text-white/50 leading-[16px] truncate font-medium">
          {desc}
        </p>
      </div>
    </div>
    
    {/* Right Trailing Action Area - pushed tightly to the right */}
    <div className="flex items-center gap-2.5 shrink-0 ml-2 relative z-10 pl-1">
      {rightText && (
        <div className="flex flex-col items-end">
          <span className={`${DESIGN_SYSTEM.badgeHeight} px-[10px] text-[9.5px] font-semibold uppercase tracking-wider text-[#10b981] bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full border border-emerald-500/20 shadow-sm flex items-center justify-center gap-1.5`}>
            {rightText.includes('✓') || rightText.includes('ACTIVE') || rightText.includes('LIVE') ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] " />
                {rightText.replace('✓', '')}
              </>
            ) : rightText}
          </span>
          {rightSubText && (
            <span className="text-[8.5px] text-slate-500 font-bold mt-0.5 tracking-wide">
              {rightSubText}
            </span>
          )}
        </div>
      )}
      
      {/* 30x30 Glassy Chevron Circle */}
      <div className={`w-[30px] h-[30px] rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-[#8b5cf6]/20 group-hover:border-[#8b5cf6]/40 group-hover:scale-[1.08] group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] ${DESIGN_SYSTEM.transition}`}>
        <ChevronRight size={14} className={`shrink-0 transition-colors ${danger ? 'text-red-400 group-hover:text-red-300' : 'text-slate-500 group-hover:text-[#a855f7]'}`} />
      </div>
    </div>
  </div>
);

import { useProtection } from '../hooks/useProtection';
import { useKavachTheme } from '../providers/ThemeProvider';

export default function ProfileScreen() {
  const { themeTokens } = useKavachTheme();
  const { protectionIndex, riskState } = useProtection();
  const { profile, role, gender, guardianCache, setProfile } = useKavachStore();
  const user = auth.currentUser;

  const displayName = profile?.name || profile?.displayName || user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  const phone = profile?.phoneNumber || profile?.phone || user?.phoneNumber || 'Not provided';
  const email = profile?.email || user?.email || 'No email attached';
  const photoUrl = profile?.photoURL || profile?.photoUrl || user?.photoURL || '';
  const userRole = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : 'Citizen';

  const memberSinceDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '12 Jan 2024';

  const familyCircleCount = guardianCache && Array.isArray(guardianCache) ? guardianCache.length : 0;
  const totalCheckIns = (profile as any)?.totalCheckIns || 12;

  // Overlay states
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDataStorage, setShowDataStorage] = useState(false);
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showAboutKavach, setShowAboutKavach] = useState(false);

  function genderDisplay(g: string | null) {
    if (!g) return 'Male';
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  const handleLogout = async () => {
    try {
      sessionStorage.setItem('kavach_dev_logout', 'true');
      await signOut(auth);
      localStorage.clear();
      window.location.reload();
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div 
      className={`w-full min-h-screen text-white font-sans ${DESIGN_SYSTEM.screenPadding} pb-32 max-w-md mx-auto selection:bg-[#8b5cf6]/30`}
      style={{ backgroundColor: themeTokens.surface.background }}
    >

      {/* ── 1. TOP TITLE BAR & HEADER ── */}
      <header className="flex justify-between items-center mb-7 px-1.5 pt-2">
        <div className="text-left">
          <h1 className="text-[26px] font-black tracking-tight text-white leading-tight">Profile</h1>
          <p className="text-[11px] text-white/50 font-medium mt-0.5">Manage your account, security & preferences.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => toast.info("Search Settings initiated")} 
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer hover:bg-white/[0.08] active:scale-95 shadow-md"
          >
            <Search size={18} />
          </button>
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[#8b5cf6] to-[#6035f5] shadow-lg shrink-0">
            <div className="w-full h-full rounded-full bg-[#121020] overflow-hidden flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={16} className="text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. BRAND PROFILE & SCORE WIDGET ── */}
      <section 
        onClick={() => setShowPersonalInfo(true)}
        className={`relative ${DESIGN_SYSTEM.radius} ${DESIGN_SYSTEM.innerPadding} mb-8 overflow-hidden border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_16px_48px_rgba(0,0,0,0.45)] bg-[#11111b] cursor-pointer group active:scale-[0.99] transition-all duration-300 text-left`}
      >
        {/* Animated ambient background orbs inside card */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#7c4dff]/15 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#7c4dff]/20 transition-all duration-500"></div>
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#10b981]/8 rounded-full blur-[40px] pointer-events-none"></div>

        <div className="flex justify-between items-center gap-4 relative z-10 mb-5">
          {/* Profile Details */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-[74px] h-[74px] rounded-full p-[3px] bg-gradient-to-br from-[#8b5cf6] via-[#c084fc] to-[#6035f5] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <div className="w-full h-full rounded-full border-[3px] border-[#11111b] bg-[#1e173e] overflow-hidden flex items-center justify-center relative">
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-2xl">{displayName.charAt(0).toUpperCase()}</span>
                  )}
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#10b981] rounded-full border-[2.5px] border-[#11111b]"></div>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7c4dff] to-[#6035f5] text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest whitespace-nowrap shadow-md uppercase">
                Premium
              </div>
            </div>

            <div className="min-w-0 flex-1 mt-0.5">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <h2 className="text-[19px] font-black text-white leading-tight truncate tracking-tight">{displayName}</h2>
                <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide text-[#a855f7]">
                  Verified
                </div>
              </div>
              <p className="text-[11.5px] text-white/60 font-semibold tracking-wide truncate">{phone}</p>
              <p className="text-[10px] text-white/45 font-medium truncate mt-0.5">{email}</p>
            </div>
          </div>

          {/* Profile Chevron circle */}
          <div className="w-[30px] h-[30px] rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-[#8b5cf6]/20 group-hover:border-[#8b5cf6]/40 transition-all duration-300 shrink-0">
            <ChevronRight size={14} className="text-slate-400 group-hover:text-[#a855f7]" />
          </div>
        </div>

        {/* Protection Score Grid row */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06] relative z-10">
          <div className="flex items-center gap-3 bg-black/25 rounded-2xl p-2.5 border border-white/[0.03]">
            <div className="relative w-11 h-11 rounded-full flex flex-col items-center justify-center shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="19" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/5" />
                <circle cx="22" cy="22" r="19" stroke="currentColor" strokeWidth="3.5" fill="none" strokeDasharray="119.3" strokeDashoffset={`${119.3 - (119.3 * protectionIndex) / 100}`} className="text-[#10b981]" strokeLinecap="round" />
              </svg>
              <ShieldCheck size={11} className="text-[#10b981] mb-0.5" />
              <span className="text-[11px] font-black text-white leading-none">{protectionIndex}</span>
            </div>
            <div className="text-left min-w-0">
              <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block leading-none mb-1">Safety Rating</span>
              <span className="text-[11px] font-extrabold text-[#10b981]">{riskState}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/25 rounded-2xl p-2.5 border border-white/[0.03]">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Users size={16} className="text-[#a855f7]" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block leading-none mb-1">Guardians Circle</span>
              <span className="text-[11px] font-extrabold text-white">{familyCircleCount} Members</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. ACCOUNT & SECURITY ── */}
      <section className="mb-2">
        <SectionHeader titlePart1="Account &" titlePart2="Security Parameters" />
        <MenuBox>
          <MenuItem 
            icon={User} 
            title="Personal Information" 
            desc="Manage your name, email, phone and profile" 
            gradientFrom="from-[#8b5cf6]" 
            gradientTo="to-[#6d28d9]" 
            shadowColor="rgba(139,92,246,0.3)" 
            onClick={() => setShowPersonalInfo(true)} 
          />
          <MenuItem 
            icon={Lock} 
            title="Change Password" 
            desc="Update your account password" 
            gradientFrom="from-[#06b6d4]" 
            gradientTo="to-[#0891b2]" 
            shadowColor="rgba(6,182,212,0.3)" 
            onClick={() => setShowChangePassword(true)} 
          />
          <MenuItem 
            icon={ShieldCheck} 
            title="Two-Factor Authentication" 
            desc="Secure your account access logs with 2FA" 
            gradientFrom="from-[#10b981]" 
            gradientTo="to-[#047857]" 
            shadowColor="rgba(16,185,129,0.3)" 
            onClick={() => setShow2FA(true)} 
            rightText="✓ ENABLED"
            rightSubText="Verified 3d ago"
          />
          <MenuItem 
            icon={Shield} 
            title="Privacy Settings" 
            desc="Control your data, visibility and permissions" 
            gradientFrom="from-[#f59e0b]" 
            gradientTo="to-[#b45309]" 
            shadowColor="rgba(245,158,11,0.3)" 
            onClick={() => setShowPrivacy(true)} 
          />
          <MenuItem 
            icon={Trash2} 
            title="Delete Account" 
            desc="Permanently delete your account and all data" 
            gradientFrom="from-[#f43f5e]" 
            gradientTo="to-[#be185d]" 
            shadowColor="rgba(244,63,94,0.35)" 
            onClick={() => setShowDelete(true)} 
            danger={true}
          />
        </MenuBox>
      </section>

      {/* ── 4. PREFERENCES ── */}
      <section className="mb-2">
        <SectionHeader titlePart1="System" titlePart2="Preferences" />
        <MenuBox>
          <MenuItem 
            icon={Bell} 
            title="Notifications" 
            desc="Manage alert and message settings" 
            gradientFrom="from-[#f43f5e]" 
            gradientTo="to-[#be185d]" 
            shadowColor="rgba(244,63,94,0.3)" 
            onClick={() => setShowNotificationSettings(true)} 
            rightText="✓ ACTIVE"
            rightSubText="12 categories"
          />
          <MenuItem 
            icon={Globe} 
            title="Language" 
            desc="Configure preferred reading layout" 
            gradientFrom="from-[#06b6d4]" 
            gradientTo="to-[#0891b2]" 
            shadowColor="rgba(6,182,212,0.3)" 
            onClick={() => setShowLanguageSettings(true)} 
            rightText="ENGLISH"
          />
          <MenuItem 
            icon={Moon} 
            title="Theme" 
            desc="Theme visual color patterns" 
            gradientFrom="from-[#f59e0b]" 
            gradientTo="to-[#b45309]" 
            shadowColor="rgba(245,158,11,0.3)" 
            onClick={() => setShowThemeSettings(true)} 
            rightText="DARK"
          />
          <MenuItem 
            icon={Cloud} 
            title="Backup & Restore" 
            desc="Backup your data parameters to secure cloud" 
            gradientFrom="from-[#06b6d4]" 
            gradientTo="to-[#0891b2]" 
            shadowColor="rgba(6,182,212,0.3)" 
            onClick={() => setShowBackupRestore(true)} 
            rightText="✓ DONE"
            rightSubText="Today 9:32 AM"
          />
          <MenuItem 
            icon={HelpCircle} 
            title="Help Center" 
            desc="FAQs, guides and safety tips" 
            gradientFrom="from-[#06b6d4]" 
            gradientTo="to-[#0891b2]" 
            shadowColor="rgba(6,182,212,0.3)" 
            onClick={() => setShowHelpCenter(true)} 
          />
          <MenuItem 
            icon={Headphones} 
            title="Contact Support" 
            desc="Direct support chat desk access" 
            gradientFrom="from-[#6b7280]" 
            gradientTo="to-[#374151]" 
            shadowColor="rgba(107,114,128,0.3)" 
            onClick={() => setShowContactSupport(true)} 
          />
          <MenuItem 
            icon={AlertTriangle} 
            title="Report an Issue" 
            desc="Report bugs or unexpected behavior" 
            gradientFrom="from-[#f43f5e]" 
            gradientTo="to-[#be185d]" 
            shadowColor="rgba(244,63,94,0.3)" 
            onClick={() => setShowReportIssue(true)} 
          />
          <MenuItem 
            icon={Shield} 
            title="About KAVACH" 
            desc="App versions and documentation parameters" 
            gradientFrom="from-[#8b5cf6]" 
            gradientTo="to-[#6d28d9]" 
            shadowColor="rgba(139,92,246,0.3)" 
            onClick={() => setShowAboutKavach(true)} 
            rightText="v1.2.0"
          />
        </MenuBox>
      </section>

      {/* ── 5. LOG OUT ACTION ── */}
      <button
        onClick={handleLogout}
        className="w-full py-4.5 mt-4 bg-white/[0.03] border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 text-red-500 rounded-[20px] font-semibold tracking-wide text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.98] group"
      >
        <LogOut size={20} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" /> Log Out
      </button>

      {/* ── 6. PERSONAL INFORMATION OVERLAY ── */}
      <PersonalInfo
        isOpen={showPersonalInfo}
        onClose={() => setShowPersonalInfo(false)}
        user={user}
        profile={profile}
        setProfile={setProfile}
        displayName={displayName}
        phone={phone}
        email={email}
        photoUrl={photoUrl}
        memberSinceDate={memberSinceDate}
        genderDisplay={genderDisplay}
      />

      {/* ── 7. CHANGE PASSWORD OVERLAY ── */}
      <ChangePassword
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* ── 8. TWO FACTOR AUTHENTICATION OVERLAY ── */}
      <TwoFactorAuth
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
      />

      {/* ── 9. PRIVACY SETTINGS OVERLAY ── */}
      <PrivacySettings
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

      {/* ── 10. DELETE ACCOUNT OVERLAY ── */}
      <DeleteAccount
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
      />

      {/* ── 11. NEW APP PREFERENCE OVERLAYS ── */}
      <DataStorage
        isOpen={showDataStorage}
        onClose={() => setShowDataStorage(false)}
      />
      <BackupRestore
        isOpen={showBackupRestore}
        onClose={() => setShowBackupRestore(false)}
      />
      <EmergencyContacts
        isOpen={showEmergencyContacts}
        onClose={() => setShowEmergencyContacts(false)}
      />
      <ThemeSettings
        isOpen={showThemeSettings}
        onClose={() => setShowThemeSettings(false)}
      />
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
      <LanguageSettings
        isOpen={showLanguageSettings}
        onClose={() => setShowLanguageSettings(false)}
      />
      <HelpCenter
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
      />
      <ContactSupport
        isOpen={showContactSupport}
        onClose={() => setShowContactSupport(false)}
      />
      <ReportIssue
        isOpen={showReportIssue}
        onClose={() => setShowReportIssue(false)}
      />
      <AboutKavach
        isOpen={showAboutKavach}
        onClose={() => setShowAboutKavach(false)}
      />
    </div>
  );
}
