import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Zap, Shield, Eye, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../store/useKavachStore';

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
  const { activeAlertsCount } = useKavachStore();

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-[150] flex justify-between items-center w-full px-4 py-2.5 sm:py-3", role === 'citizen' ? "bg-[#F8FAFC]" : "bg-[#0F172A]")}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden border shadow-sm", role === 'citizen' ? "border-slate-100" : "border-white/10")}>
          <img src="/logo.jpeg" alt="KAVACH" className="w-full h-full object-cover rounded-full" />
        </div>
        <div>
          <h1 className={cn("text-[17px] sm:text-lg font-bold tracking-tight leading-tight", role === 'citizen' ? "text-slate-900" : "text-white")}>{role === 'admin' ? 'ADMIN' : 'KAVACH'}</h1>
          <p className={cn("text-[6px] sm:text-[7px] font-bold uppercase tracking-[1.5px] sm:tracking-[2px] mt-0.5", role === 'citizen' ? "text-slate-500" : "text-slate-400")}>women safety network</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {role === 'citizen' && (
          <button onClick={onToggleGhost} className="w-8 h-8 sm:w-9 sm:h-9 border rounded-lg flex items-center justify-center transition-all shadow-sm bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <Eye size={15} />
          </button>
        )}

        <div className="relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-lg shadow-sm transition-all border flex items-center justify-center overflow-hidden", role === 'citizen' ? "border-slate-200 hover:border-slate-300 bg-slate-50" : "border-white hover:border-white/80 bg-slate-800")}>
            {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={15} className={role === 'citizen' ? "text-slate-400" : "text-slate-500"} />}
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
                      <p className="text-[9px] text-[#2563EB] font-bold uppercase tracking-[2px] mt-1">{role === 'admin' ? 'ADMINISTRATOR' : role === 'pcr_officer' ? 'PCR PATROL UNIT' : role === 'protector' ? 'VERIFIED PROTECTOR' : 'VERIFIED CITIZEN'}</p>
                    </div>
                  </div>
                  <div className="space-y-3 py-4 border-y border-gray-100">
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</span><span className="text-[10px] font-bold text-gray-900">{userData?.phoneNumber ? `+91 ${userData.phoneNumber.slice(-10)}` : 'UNLINKED'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Shield Status</span><span className="text-[10px] font-bold text-accent-green uppercase tracking-widest">SECURE</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</span><span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{userData?.gender || 'FEMALE'}</span></div>
                  </div>
                  <div className="space-y-3">
                    {gender === 'female' && (
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
