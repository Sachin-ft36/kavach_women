import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Zap, Shield, Eye, Bell, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../store/useKavachStore';
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
  const { activeAlertsCount, setRole: setStoreRole } = useKavachStore();
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

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-[150] flex justify-between items-center w-full px-4 pt-8 pb-3.5 sm:pt-9 sm:pb-4 border-b transition-all duration-300", role === 'citizen' ? "bg-[#F8FAFC] border-slate-100" : "bg-[#0A0D14] border-white/5")}>
      
      {/* LEFT: Logo and Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border shadow-sm", role === 'citizen' ? "border-slate-100" : "border-white/10")}>
          <img src="/logo.jpeg" alt="KAVACH" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className={cn("text-[15px] font-black tracking-tight leading-tight", role === 'citizen' ? "text-slate-900" : "text-white")}>KAVACH</h1>
          <p className={cn("text-[6.5px] font-bold uppercase tracking-[1.5px] mt-0.5", role === 'citizen' ? "text-slate-500" : "text-slate-400")}>women safety network</p>
        </div>
      </div>

      {/* RIGHT: Notifications & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {isProtector && (
          <div className="relative cursor-pointer hover:opacity-85 transition-all">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Bell size={16} />
            </div>
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF3B30] text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#090D16] animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </div>
        )}

        {role === 'citizen' && (
          <button onClick={onToggleGhost} className="w-9 h-9 border rounded-lg flex items-center justify-center transition-all shadow-sm bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <Eye size={16} />
          </button>
        )}

        <div className="relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={cn("w-9 h-9 rounded-xl shadow-sm transition-all border flex items-center justify-center overflow-hidden", role === 'citizen' ? "border-slate-200 hover:border-slate-300 bg-slate-50" : "border-white/10 hover:border-white/20 bg-white/5")}>
            {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={16} className={role === 'citizen' ? "text-slate-400" : "text-slate-500"} />}
          </button>
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-72 bg-white border border-[#E5E7EB] rounded-[32px] p-6 shadow-2xl z-[100]">
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-20 h-20 rounded-[28px] bg-[#2563EB]/5 border-2 border-[#2563EB]/10 flex items-center justify-center overflow-hidden shadow-inner">
                      {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={36} className="text-[#2563EB]/40" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{displayName}</h3>
                      <p className="text-[9px] text-[#2563EB] font-bold uppercase tracking-[2px] mt-1">{role === 'admin' ? 'ADMINISTRATOR' : role === 'protector' ? 'VOLUNTEER PROTECTOR' : role === 'guardian' ? 'FAMILY GUARDIAN' : 'VERIFIED CITIZEN'}</p>
                    </div>
                  </div>
                  <div className="space-y-3 py-4 border-y border-gray-100">
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</span><span className="text-[10px] font-bold text-gray-900">{userData?.phoneNumber ? `+91 ${userData.phoneNumber.slice(-10)}` : 'UNLINKED'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Shield Status</span><span className="text-[10px] font-bold text-accent-green uppercase tracking-widest">SECURE</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</span><span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{userData?.gender || 'FEMALE'}</span></div>
                  </div>
                  <div className="space-y-3">
                    {hasGuardianAccess && (
                      <button 
                        onClick={() => {
                          const targetRole = role === 'guardian' ? (userData?.gender === 'male' ? 'protector' : 'citizen') : 'guardian';
                          setStoreRole(targetRole);
                          setIsProfileOpen(false);
                          toast.success(`Switched to ${targetRole === 'guardian' ? 'Guardian Mode' : 'Standard Mode'}`);
                        }} 
                        className="w-full py-4 bg-indigo-650 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-650/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Shield size={14} /> 
                        {role === 'guardian' ? 'Exit Guardian Dashboard' : 'Open Guardian HUD'}
                      </button>
                    )}
                    {gender === 'female' && role !== 'guardian' && (
                      <button onClick={handleRoleSwitch} className="w-full py-4 bg-[#2563EB] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1D4ED8] shadow-lg shadow-[#2563EB]/20 transition-all flex items-center justify-center gap-2">
                        {role === 'citizen' ? <><Zap size={14} /> Join Protector Network</> : <><Shield size={14} /> Return to Home</>}
                      </button>
                    )}
                    <button onClick={handleLogout} className="w-full py-4 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"><LogOut size={14} /> System Logout</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
