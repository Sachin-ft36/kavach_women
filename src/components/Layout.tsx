import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Camera,
  Users,
  Settings,
  AlertTriangle,
  EyeOff,
  Eye,
  Lock,
  LayoutDashboard,
  User,
  LogOut,
  Upload,
  Zap,
  Navigation,
  Globe,
  Trophy,
  ShieldCheck,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db, resetKavachState } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import SOSActiveOverlay from './SOSActiveOverlay';
import { Activity, Car, Map as MapIcon, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isGhostMode: boolean;
  onToggleGhost: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'citizen' | 'protector' | 'admin' | 'super_cell';
  setRole: (role: 'citizen' | 'protector' | 'admin' | 'super_cell') => void;
  setGender: (gender: 'female' | 'male') => void;
}

export default function Layout({ children, isGhostMode, onToggleGhost, activeTab, setActiveTab, role, setRole, setGender }: LayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProtectorOnboarding, setShowProtectorOnboarding] = useState(false);
  const { profile: userData, setLoading, isSOSActive, isInterceptActive } = useKavachStore();
  const user = auth.currentUser;

  const handleRoleSwitch = async () => {
    if (!user) return;
    
    if (role === 'citizen') {
      if (userData?.protectorStatus === 'active') {
        try {
          setLoading(true);
          const newRole = 'protector';
          await updateDoc(doc(db, 'users', user.uid), {
            role: newRole,
            lastRoleChange: new Date()
          });
          setRole(newRole);
          localStorage.setItem('kavach_role', newRole);
          setIsProfileOpen(false);
          setTimeout(() => setLoading(false), 1000);
          return;
        } catch (error) {
          console.error("Role switch failed:", error);
          setLoading(false);
        }
      } else {
        setShowProtectorOnboarding(true);
        setIsProfileOpen(false);
        return;
      }
    }

    try {
      setLoading(true);
      const newRole = 'citizen';
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        lastRoleChange: new Date()
      });
      setRole(newRole);
      localStorage.setItem('kavach_role', newRole);
      setIsProfileOpen(false);
      setTimeout(() => setLoading(false), 1000);
    } catch (error) {
      console.error("Role switch failed:", error);
      setLoading(false);
    }
  };

  const confirmProtectorEnrollment = async () => {
    if (!user) return;
    try {
      const newRole = 'protector';
      const updateData = {
        role: newRole,
        lastRoleChange: new Date(),
        protectorStatus: 'active',
        specialCellLinked: true,
        enrolledAt: serverTimestamp()
      };
      await updateDoc(doc(db, 'users', user.uid), updateData);
      if (userData?.gender === 'female') {
        await updateDoc(doc(db, 'women_users', user.uid), updateData);
      }
      setRole(newRole);
      localStorage.setItem('kavach_role', newRole);
      setShowProtectorOnboarding(false);
      toast.success("Welcome to the Protector Grid");
    } catch (error) {
      toast.error("Enrollment failed");
    }
  };

  const handleLogout = async () => {
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastActive: serverTimestamp()
        });
      }
      await signOut(auth);
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userPhoto = user?.photoURL || userData?.photoURL;
  const uid = userData?.aadhaarMasked || 'XXXX-XXXX-XXXX';
  const gender = userData?.gender || 'female';
  const displayName = user?.displayName || userData?.name || t('kavach_user');

  if (isGhostMode) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans p-4 sm:p-6 pb-20">
        <div className="max-w-md mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Weather</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-400" />}
              </button>
              <button onClick={onToggleGhost} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                <EyeOff size={20} />
              </button>
            </div>
          </header>
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xl mb-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                    {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{displayName}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">ID: {uid.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Logout</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="bg-white p-6 rounded-[28px] mb-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Current Location</p>
                <p className="text-5xl font-bold text-gray-900 leading-none">32°</p>
                <p className="text-[#2563EB] font-bold mt-2">Partly Cloudy</p>
              </div>
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500"><Globe size={32} /></div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-5 border-t border-gray-50">
              <span>High: 38°</span><span>Low: 26°</span><span>Humidity: 45%</span>
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hourly Forecast</p>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="min-w-[70px] bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400">{12 + i}:00</span>
                  <div className="w-6 h-6 bg-yellow-400/20 rounded-full" />
                  <span className="text-xs font-bold text-gray-900">3{i}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-bg text-gray-900 font-sans selection:bg-[#2563EB] selection:text-white transition-all duration-500",
      role === 'super_cell' ? "p-0" : "px-3 sm:px-6 pt-8 sm:pt-10 pb-32"
    )}>
      
      {/* 🚨 SOS COMMAND OVERLAY */}
      <SOSActiveOverlay />

      {role !== 'super_cell' && !isInterceptActive && (
        <header className="relative z-[150] flex justify-between items-center mb-6 sm:mb-8 max-w-7xl mx-auto px-1">
          <div className="flex items-center gap-4">
             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", role === 'admin' ? "bg-[#2563EB] text-white" : "bg-accent-red text-white")}>
                <Shield size={20} />
              </div>
              <div>
                 <h1 className="text-xl font-bold tracking-tight text-gray-900">{role === 'admin' ? 'ADMINISTRATIVE PORTAL' : 'KAVACH'}</h1>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                   <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[2px]">National Safety Network v4.2</span>
                 </div>
              </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onToggleGhost} className="w-10 h-10 bg-white border border-[#E5E7EB] text-gray-400 hover:text-gray-900 hover:border-gray-300 rounded-xl flex items-center justify-center transition-all shadow-sm"><Eye size={18} /></button>
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-white border border-[#E5E7EB] p-1.5 pr-4 rounded-xl shadow-sm hover:border-gray-300 transition-all">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 flex items-center justify-center overflow-hidden border border-[#2563EB]/20">
                  {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={16} className="text-[#2563EB]" />}
                </div>
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest hidden xs:inline">{t('profile')}</span>
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
                          <p className="text-[9px] text-[#2563EB] font-bold uppercase tracking-[2px] mt-1">{role === 'admin' ? 'ADMINISTRATOR' : role === 'protector' ? 'VERIFIED PROTECTOR' : 'VERIFIED CITIZEN'}</p>
                        </div>
                      </div>
                      <div className="space-y-3 py-4 border-y border-gray-100">
                        <div className="flex justify-between items-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Aadhaar Link</span><span className="text-[10px] font-bold text-gray-900">{userData?.aadhar ? `XXXXXXXX${userData.aadhar.slice(-4)}` : 'NOT LINKED'}</span></div>
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
      )}

      <main className={cn("mx-auto pb-10 relative z-[10] transition-all", role === 'super_cell' ? "max-w-none px-4 lg:px-8" : "max-w-7xl")}>
        {children}
      </main>

      {!isInterceptActive && (
        <nav className="fixed bottom-0 inset-x-0 z-[50] p-6 pointer-events-none flex justify-center">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-black/[0.04] rounded-[40px] p-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto">
            {role === 'citizen' && (
              <>
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22} />} label="Home" />
                <NavButton active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} icon={<Globe size={22} />} label="Radar" />
                <NavButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<Users size={22} />} label="Guardians" />
                <NavButton active={activeTab === 'special_cell'} onClick={() => setActiveTab('special_cell')} icon={<ShieldCheck size={22} />} label="Safety Cell" />
                <NavButton active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} icon={<Upload size={22} />} label="Vault" />
              </>
            )}
            {role === 'protector' && (
              <>
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<MapPin size={22} />} label="Response" />
                <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Users size={22} />} label="Community" />
                <NavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={22} />} label="Safety Tips" />
                <NavButton active={activeTab === 'grievance'} onClick={() => setActiveTab('grievance')} icon={<AlertTriangle size={22} />} label="Reports" />
              </>
            )}
            {role === 'admin' && (
              <>
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22} />} label="Admin" />
                <NavButton active={activeTab === 'verify'} onClick={() => setActiveTab('verify')} icon={<UserCheck size={22} />} label="Verify" />
                <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Trophy size={22} />} label="Audits" />
              </>
            )}
          </div>
        </nav>
      )}

      <AnimatePresence>
        {showProtectorOnboarding && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProtectorOnboarding(false)} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} className="relative w-full max-w-lg bg-[#F8FAFC] rounded-[32px] shadow-2xl overflow-hidden border border-[#E2E8F0]">
              <div className="h-2 bg-[#2563EB]" />
              <div className="p-6 sm:p-10">
                <div className="flex items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] shadow-sm shrink-0"><Shield size={32} strokeWidth={1.5} /></div>
                  <div className="pt-1">
                    <h2 className="text-2xl font-bold text-[#1E293B] leading-tight mb-1">Community Protector Network</h2>
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-[2px]">National Support & Assistance Program</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-5">
                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#94A3B8] border-b border-[#E2E8F0] pb-2">Protector Responsibilities</h3>
                    <div className="space-y-5">
                      <div className="flex gap-5"><div className="w-6 h-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5"><Zap size={14} className="text-[#2563EB]" strokeWidth={2} /></div><p className="text-[13px] text-[#475569] leading-relaxed">Respond to nearby emergency safety alerts when you are available to assist.</p></div>
                      <div className="flex gap-5"><div className="w-6 h-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5"><MapPin size={14} className="text-[#2563EB]" strokeWidth={2} /></div><p className="text-[13px] text-[#475569] leading-relaxed">Assist users by sharing verified location-based support during distress situations.</p></div>
                      <div className="flex gap-5"><div className="w-6 h-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5"><Users size={14} className="text-[#2563EB]" strokeWidth={2} /></div><p className="text-[13px] text-[#475569] leading-relaxed">Coordinate with the Kavach safety ecosystem to improve community response times.</p></div>
                      <div className="flex gap-5"><div className="w-6 h-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck size={14} className="text-[#2563EB]" strokeWidth={2} /></div><p className="text-[13px] text-[#475569] leading-relaxed">Maintain respectful and responsible conduct as a verified community volunteer.</p></div>
                    </div>
                  </div>
                  <div className="p-5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-[20px]">
                    <div className="flex gap-3 items-center mb-2"><Lock size={12} className="text-[#64748B]" /><span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Privacy & Accountability</span></div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">To ensure public trust, your activity may be securely logged for safety verification and accountability purposes.</p>
                  </div>
                  <div className="flex items-center justify-center py-2"><p className="text-[13px] font-semibold text-[#1E293B] italic opacity-60">"Together, we create a safer community."</p></div>
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setShowProtectorOnboarding(false)} className="flex-1 py-4.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#F1F5F9] transition-all">Cancel</button>
                    <button onClick={confirmProtectorEnrollment} className="flex-[2] py-4.5 bg-[#2563EB] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-[#2563EB]/10 hover:bg-[#1D4ED8] active:scale-[0.98] transition-all">Become a Protector</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center flex-1 h-16 transition-all relative group", active ? "text-[#2563EB]" : "text-[#64748B]")}>
      <div className={cn("p-2.5 rounded-[18px] transition-all duration-500", active && "bg-[#2563EB]/10 scale-110 shadow-sm")}>{icon}</div>
      <span className={cn("text-[6px] sm:text-[7px] font-black uppercase tracking-[1px] sm:tracking-[1.5px] mt-1 transition-all", active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1")}>{label}</span>
      {active && <motion.div layoutId="activeTabDot" className="absolute -bottom-1 w-1 h-1 bg-[#2563EB] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" />}
    </button>
  );
}
