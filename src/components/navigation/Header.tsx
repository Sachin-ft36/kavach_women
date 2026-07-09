import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Zap, Shield, Eye, Bell, ShieldCheck, X, Phone, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../state/useKavachStore';
import { useTimeTheme } from '../../hooks/useTimeTheme';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

interface HeaderProps {
  role: string;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  userPhoto?: string;
  displayName?: string;
  userData?: any;
  gender: string;
  onToggleGhost: () => void;
  handleRoleSwitch: () => void;
  handleLogout: () => void;
}

export function Header({
  role,
  isProfileOpen,
  setIsProfileOpen,
  userPhoto,
  displayName,
  userData,
  gender,
  onToggleGhost,
  handleRoleSwitch,
  handleLogout
}: HeaderProps) {
  const { activeAlertsCount, setRole: setStoreRole, setActiveTab } = useKavachStore();
  const [hasGuardianAccess, setHasGuardianAccess] = React.useState(role === 'guardian');

  React.useEffect(() => {
    if (role === 'guardian') {
      setHasGuardianAccess(true);
      return;
    }
    const phone = userData?.phoneNumber || userData?.phone;
    if (!phone) return;
    const clean = phone.replace(/\D/g, '').slice(-10);
    const cleanPhone = `+91${clean}`;
    
    const q = query(
      collection(db, 'users'),
      where('primaryGuardian.phone', 'in', [phone, cleanPhone])
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setHasGuardianAccess(true);
      }
    });
    return () => unsub();
  }, [userData, role]);

  const isProtector = role === 'protector';
  const isOnDuty = userData?.isOnDuty || false;

  const { themeFolder } = useTimeTheme();
  const isNight = themeFolder === 'night';

  return (
    <header className="fixed top-0 left-0 right-0 z-[150] flex justify-center pointer-events-none">
      <div className={`w-full max-w-md border-b rounded-none px-4 py-2.5 flex items-center justify-between shadow-lg pointer-events-auto relative ${isNight ? 'bg-gradient-to-r from-[#141235]/95 via-[#0e0c24]/95 to-[#09081a]/95 border-white/5' : 'bg-white/95 border-slate-200'}`}>
        
        {/* LEFT: Logo and Name */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-sm" />
            <svg className="w-full h-full drop-shadow-[0_0_6px_rgba(140,124,255,0.4)]" viewBox="0 0 100 100" fill="none">
              {/* Shield path */}
              <path d="M50 10C68 18 78 20 85 24V52C85 71.5 50 88 50 88C50 88 15 71.5 15 52V24C22 20 32 18 50 10Z" fill="url(#shieldGrad)" stroke="#8c7cff" strokeWidth="2.5" />
              {/* Woman Face Profile Silhouette */}
              <path d="M42 30C36.5 33.5 34 39.5 34 47.5C34 55.5 36.5 61.5 42 65C39.5 60 39.5 55 42 50C44.5 45 48.5 42.5 53.5 42C51 40.5 49.5 38 50 35C50.5 32 53 30 56.5 30C54.5 28.5 52.5 28 50 28C46.5 28 44 30 42 30Z" fill="#d8b4fe" />
              <defs>
                <linearGradient id="shieldGrad" x1="50" y1="10" x2="50" y2="88" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1e184c" />
                  <stop offset="1" stopColor="#0e0a26" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <h1 className={`text-[14px] font-black tracking-tight leading-none ${isNight ? 'text-white' : 'text-slate-900'}`}>
              KAVACH
            </h1>
            <p className={`text-[6.5px] font-extrabold uppercase tracking-[0.14em] mt-0.5 ${isNight ? 'text-[#8c7cff]' : 'text-slate-500'}`}>
              women safety network
            </p>
          </div>
        </div>

        {/* MIDDLE/RIGHT: Monitor, Alerts & Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Monitor Card Button */}
          {role === 'citizen' && (
            <button 
              onClick={onToggleGhost} 
              className={`w-[48px] h-[44px] rounded-[12px] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${isNight ? 'bg-white/[0.03] border-white/5 hover:bg-white/10 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'}`}
            >
              <Eye size={16} strokeWidth={2} />
              <span className={`text-[8px] font-semibold ${isNight ? 'text-gray-300' : 'text-slate-500'}`}>Monitor</span>
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative ml-0.5">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="flex flex-col items-center gap-0.5 cursor-pointer border-none bg-transparent"
            >
              <div className="relative">
                <div className="w-[26px] h-[26px] rounded-full border border-[#8c7cff]/40 overflow-hidden bg-[#1e1e38] flex items-center justify-center">
                  {userPhoto ? (
                    <img src={userPhoto} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <User size={12} className="text-slate-300" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00e676] rounded-full border border-[#09081a]" />
              </div>
              <div className="flex items-center gap-0.5 mt-[2px]">
                <span className={`text-[7.5px] font-extrabold leading-none tracking-wide ${isNight ? 'text-white' : 'text-slate-800'}`}>{displayName?.split(' ')[0] || 'User'}</span>
                <svg className={`w-2 h-2 ${isNight ? 'text-gray-400' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3.5 w-[330px] bg-white border border-[#E5E7EB] rounded-[36px] p-5 shadow-2xl z-[200] flex flex-col items-center">
                {/* Close Button */}
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-4.5 right-4.5 w-7 h-7 rounded-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors border-none"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Squircle Profile Avatar */}
                <div className="relative mt-2">
                  <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white shadow-[0_4px_15px_rgba(0,0,0,0.08)] bg-slate-50 flex items-center justify-center">
                    {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5e3cf6] border-[2px] border-white flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Name & Pill Badge */}
                <div className="text-center mt-3.5 flex flex-col items-center">
                  <h3 className="text-[20px] font-black text-gray-900 leading-tight tracking-tight">{displayName}</h3>
                  <div className="bg-[#ece9ff] text-[#5e3cf6] text-[10px] font-black tracking-wider uppercase px-4 py-1.5 rounded-full mt-2 w-max leading-none">
                    {role === 'admin' ? 'ADMINISTRATOR' : role === 'protector' ? 'VOLUNTEER PROTECTOR' : role === 'guardian' ? 'FAMILY GUARDIAN' : 'VERIFIED CITIZEN'}
                  </div>
                </div>

                {/* Info Rows */}
                <div className="w-full mt-5 space-y-4 pt-4 border-t border-gray-100/80">
                  {/* Phone Row */}
                  <div className="flex items-center justify-between text-[13px] font-semibold text-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#ece9ff] text-[#5e3cf6] flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Phone</span>
                    </div>
                    <span className="text-[13.5px] font-bold text-gray-800">{userData?.phoneNumber ? `+91 ${userData.phoneNumber.slice(-10)}` : 'UNLINKED'}</span>
                  </div>

                  {/* Shield Status Row */}
                  <div className="flex items-center justify-between text-[13px] font-semibold text-gray-800 border-t border-gray-100/80 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#ece9ff] text-[#5e3cf6] flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Shield Status</span>
                    </div>
                    <span className="text-[13.5px] font-bold text-[#10b981] flex items-center gap-1">
                      SECURE <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" strokeWidth={2.5} />
                    </span>
                  </div>

                  {/* Gender Row */}
                  <div className="flex items-center justify-between text-[13px] font-semibold text-gray-800 border-t border-gray-100/80 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#ece9ff] text-[#5e3cf6] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="10" r="5" />
                          <path d="M12 15v7M9 19h6" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Gender</span>
                    </div>
                    <span className="text-[13.5px] font-bold text-gray-800 uppercase tracking-wide">{userData?.gender || 'FEMALE'}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="w-full mt-6 space-y-3">
                  {hasGuardianAccess && (
                    <button 
                      onClick={() => {
                        const targetRole = role === 'guardian' ? (userData?.gender === 'male' ? 'protector' : 'citizen') : 'guardian';
                        setStoreRole(targetRole);
                        setIsProfileOpen(false);
                        toast.success(`Switched to ${targetRole === 'guardian' ? 'Guardian Mode' : 'Standard Mode'}`);
                      }} 
                      className="w-full py-3.5 bg-[#4c1d95] text-white rounded-2xl text-[11.5px] font-bold uppercase tracking-wider hover:bg-[#5b21b6] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                      <Shield size={14} /> 
                      {role === 'guardian' ? 'Exit Guardian Dashboard' : 'Open Guardian HUD'}
                    </button>
                  )}
                  {role !== 'guardian' && (
                    <button 
                      onClick={() => {
                        setActiveTab('rewards');
                        setIsProfileOpen(false);
                      }} 
                      className="w-full py-3.5 bg-gradient-to-r from-[#5e3cf6] to-[#4d2ee0] hover:opacity-95 text-white rounded-2xl text-[12.5px] font-bold tracking-wide transition-all flex items-center justify-between px-5 cursor-pointer shadow-md shadow-[#5e3cf6]/10 active:scale-[0.98] border-none"
                    >
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-white" />
                        <span>View Profile</span>
                      </div>
                      <ChevronRight size={15} className="text-white/80" />
                    </button>
                  )}
                  <button onClick={handleLogout} className="w-full py-3.5 bg-gray-50 border border-gray-200/80 text-gray-600 rounded-2xl text-[11.5px] font-bold tracking-wide hover:bg-gray-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"><LogOut size={15} /> <span>System Logout</span></button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
