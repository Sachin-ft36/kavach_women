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

  if (!isProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-start pt-[65px] px-4 pointer-events-none">
      <div className="w-full max-w-sm relative pointer-events-auto">
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className={`absolute right-0 w-[270px] border rounded-[28px] p-4 shadow-2xl flex flex-col items-center pointer-events-auto ${isNight ? 'bg-[#120F22] border-[#7A3EFF]/25' : 'bg-white border-slate-200'}`}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsProfileOpen(false)}
              className={`absolute top-3.5 right-3.5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none ${isNight ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Compact Squircle Profile Avatar */}
            <div className="relative mt-1">
              <div className={`w-18 h-18 rounded-[24px] overflow-hidden border-2 shadow-md flex items-center justify-center ${isNight ? 'border-[#7A3EFF]/30 bg-slate-900' : 'border-white bg-slate-50'}`}>
                {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={28} className="text-gray-400" />}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#7A3EFF] border-[1.5px] border-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Name & Pill Badge */}
            <div className="text-center mt-2.5 flex flex-col items-center">
              <h3 className={`text-[15px] font-black leading-none tracking-tight ${isNight ? 'text-white' : 'text-slate-950'}`}>{displayName}</h3>
              <div className={`text-[8px] font-black tracking-wider uppercase px-3 py-1 rounded-full mt-1.5 w-max leading-none ${isNight ? 'bg-[#7A3EFF]/15 text-[#C084FC]' : 'bg-[#7A3EFF]/10 text-[#7A3EFF]'}`}>
                {role === 'admin' ? 'ADMIN' : role === 'protector' ? 'PROTECTOR' : role === 'guardian' ? 'FAMILY GUARDIAN' : 'VERIFIED CITIZEN'}
              </div>
            </div>

            {/* Compact Info Rows */}
            <div className={`w-full mt-3.5 space-y-2.5 pt-3.5 border-t ${isNight ? 'border-white/5' : 'border-slate-100'}`}>
              {/* Phone Row */}
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className={`text-[8px] font-bold tracking-wider uppercase ${isNight ? 'text-slate-400' : 'text-slate-400'}`}>Phone</span>
                <span className={`font-bold ${isNight ? 'text-slate-200' : 'text-slate-800'}`}>{userData?.phoneNumber ? `+91 ${userData.phoneNumber.slice(-10)}` : 'UNLINKED'}</span>
              </div>

              {/* Shield Status Row */}
              <div className={`flex items-center justify-between text-[11px] font-semibold border-t pt-2.5 ${isNight ? 'border-white/5' : 'border-slate-100'}`}>
                <span className={`text-[8px] font-bold tracking-wider uppercase ${isNight ? 'text-slate-400' : 'text-slate-400'}`}>Shield Status</span>
                <span className="font-bold text-[#10b981] flex items-center gap-0.5">
                  SECURE <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                </span>
              </div>

              {/* Gender Row */}
              <div className={`flex items-center justify-between text-[11px] font-semibold border-t pt-2.5 ${isNight ? 'border-white/5' : 'border-slate-100'}`}>
                <span className={`text-[8px] font-bold tracking-wider uppercase ${isNight ? 'text-slate-400' : 'text-slate-400'}`}>Gender</span>
                <span className={`font-bold uppercase tracking-wide ${isNight ? 'text-slate-200' : 'text-slate-800'}`}>{userData?.gender || 'FEMALE'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full mt-4 space-y-2">
              {hasGuardianAccess && (
                <button 
                  onClick={() => {
                    const targetRole = role === 'guardian' ? (userData?.gender === 'male' ? 'protector' : 'citizen') : 'guardian';
                    setStoreRole(targetRole);
                    setIsProfileOpen(false);
                    toast.success(`Switched to ${targetRole === 'guardian' ? 'Guardian Mode' : 'Standard Mode'}`);
                  }} 
                  className="w-full py-2 bg-[#4c1d95] text-white rounded-xl text-[9.5px] font-bold uppercase tracking-wider hover:bg-[#5b21b6] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Shield size={12} /> 
                  {role === 'guardian' ? 'Exit Guardian Dashboard' : 'Open Guardian HUD'}
                </button>
              )}
              {role !== 'guardian' && (
                <button 
                  onClick={() => {
                    setActiveTab('rewards');
                    setIsProfileOpen(false);
                  }} 
                  className={`w-full py-2.5 text-white rounded-xl text-[10.5px] font-bold tracking-wide transition-all flex items-center justify-between px-3.5 cursor-pointer shadow-sm active:scale-[0.98] border-none ${isNight ? 'bg-gradient-to-r from-[#7A3EFF] to-[#6366F1] shadow-[#7A3EFF]/10' : 'bg-gradient-to-r from-[#7A3EFF] to-[#5B3CD6]'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-white" />
                    <span>View Profile</span>
                  </div>
                  <ChevronRight size={13} className="text-white/85" />
                </button>
              )}
              <button 
                onClick={handleLogout} 
                className={`w-full py-2.5 rounded-xl text-[9.5px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${isNight ? 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'}`}
              >
                <LogOut size={13} /> 
                <span>System Logout</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
