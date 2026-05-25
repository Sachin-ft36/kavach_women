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
import { Activity, Car, Map as MapIcon, FileText, MessageSquare } from 'lucide-react';
import KavachAIChat from './KavachAIChat';
import Onboarding from './Onboarding';

interface LayoutProps {
  children: React.ReactNode;
  isGhostMode: boolean;
  onToggleGhost: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'citizen' | 'protector' | 'pcr_officer' | 'admin' | 'super_cell';
  setRole: (role: 'citizen' | 'protector' | 'pcr_officer' | 'admin' | 'super_cell') => void;
  setGender: (gender: 'female' | 'male') => void;
}

export default function Layout({ children, isGhostMode, onToggleGhost, activeTab, setActiveTab, role, setRole, setGender }: LayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProtectorOnboarding, setShowProtectorOnboarding] = useState(false);
  const { profile: userData, setLoading, isSOSActive, isInterceptActive, isOverlayActive, isSOSBlocked } = useKavachStore();
  const user = auth.currentUser;

  // 🛰️ DYNAMIC GLOBAL WAR-ROOM VIEWPORT SCALING
  useEffect(() => {
    if (role === 'super_cell') {
      document.documentElement.classList.add('supercell-active');
      document.body.classList.add('supercell-active');
      document.body.style.transform = 'scale(0.5)';
      document.body.style.transformOrigin = 'top left';
    } else {
      document.documentElement.classList.remove('supercell-active');
      document.body.classList.remove('supercell-active');
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    }
    return () => {
      document.documentElement.classList.remove('supercell-active');
      document.body.classList.remove('supercell-active');
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    };
  }, [role]);


  const handleRoleSwitch = async () => {
    if (!user || gender !== 'female') return;

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
        toast.info("Initializing Protector Grid Enrollment...");
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
    if (!user || gender !== 'female') return;
    try {
      const newRole = 'protector';
      const updateData = {
        role: newRole,
        lastRoleChange: new Date(),
        protectorStatus: 'active',
        specialCellLinked: true,
        isVerified: true,
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
      "text-gray-900 font-sans selection:bg-[#2563EB] selection:text-white transition-all duration-500 relative",
      role === 'super_cell' ? "h-screen overflow-hidden p-0" : "min-h-screen overflow-x-hidden px-3 sm:px-6 pt-4 sm:pt-10 pb-10"
    )}>

      {/* 🏛️ GLOBAL INSTITUTIONAL WATERMARK (OVERLAY) */}
      <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center z-[150] overflow-hidden select-none">
        <span className={cn(
          "text-[22vw] font-black uppercase tracking-tighter rotate-[-15deg] whitespace-nowrap transition-all duration-500",
          role === 'super_cell' ? "text-white/[0.008]" : "text-black/[0.03]"
        )}>
          KAVACH
        </span>
        <div className={cn("mt-4 transition-all duration-500", role === 'super_cell' ? "opacity-[0.05]" : "opacity-10")}>
          <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-[3px] sm:tracking-[4px]", role === 'super_cell' ? "text-white" : "text-gray-900")}>Your Safety, Our Responsibility</span>
        </div>
      </div>

      {/* 🛡️ STREAMLINED PROTECTOR PLEDGE OVERLAY */}
      <AnimatePresence>
        {showProtectorOnboarding && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProtectorOnboarding(false)}
              className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-8 sm:p-10 shadow-2xl border border-white"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                  <ShieldCheck size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Protector's Pledge</h2>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[3px]">Institutional Enrollment</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-wider">
                    As a member of the <span className="text-gray-900">Kavach Protector Grid</span>, you pledge to assist fellow citizens in distress, maintain the highest standards of integrity, and respond to tactical alerts within your sector.
                  </p>
                </div>
                <div className="w-full space-y-3 pt-4">
                  <button
                    onClick={confirmProtectorEnrollment}
                    className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[4px] shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    Confirm Enrollment
                  </button>
                  <button
                    onClick={() => setShowProtectorOnboarding(false)}
                    className="w-full py-5 bg-gray-50 text-gray-400 rounded-[24px] text-xs font-black uppercase tracking-[4px] hover:bg-gray-100 transition-all"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {role !== 'super_cell' && !isInterceptActive && activeTab === 'dashboard' && !isOverlayActive && !isSOSBlocked && (
        <header className="relative z-[150] flex justify-between items-center mb-4 sm:mb-8 max-w-7xl mx-auto px-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-500 overflow-hidden border border-[#F1F5F9]">
              <img src="/logo.jpg" alt="KAVACH" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 leading-tight">{role === 'admin' ? 'ADMIN' : 'KAVACH'}</h1>
              <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[2px] mt-0.5">women safety network</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onToggleGhost} className="w-8 h-8 sm:w-10 sm:h-10 bg-white border border-[#E5E7EB] text-gray-400 hover:text-gray-900 hover:border-gray-300 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-sm"><Eye size={16} /></button>
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-white border border-[#E5E7EB] p-1 sm:p-1.5 pr-3 sm:pr-4 rounded-lg sm:rounded-xl shadow-sm hover:border-gray-300 transition-all">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[#2563EB]/10 flex items-center justify-center overflow-hidden border border-[#2563EB]/20">
                  {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={14} className="text-[#2563EB]" />}
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 uppercase tracking-widest hidden xs:inline">{t('profile')}</span>
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

      <main className={cn("mx-auto pb-6 relative transition-all z-10", role === 'super_cell' || activeTab !== 'dashboard' || isOverlayActive ? "max-w-none px-0 h-full w-full" : "max-w-7xl")}>
        {children}

        {/* Slogan moved to global watermark overlay for perfect centering */}
      </main>

    </div>
  );
}
