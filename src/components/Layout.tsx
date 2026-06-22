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
import WeatherScreen from './WeatherScreen';
import { ProtectorPledgeModal } from './onboarding/ProtectorPledgeModal';
import { Header } from './navigation/Header';

interface LayoutProps {
  children: React.ReactNode;
  isGhostMode: boolean;
  onToggleGhost: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'citizen' | 'protector' | 'guardian' | 'admin' | 'super_cell';
  setRole: (role: 'citizen' | 'protector' | 'guardian' | 'admin' | 'super_cell') => void;
  setGender: (gender: 'female' | 'male') => void;
}

export default function Layout({ children, isGhostMode, onToggleGhost, activeTab, setActiveTab, role, setRole, setGender }: LayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProtectorOnboarding, setShowProtectorOnboarding] = useState(false);
  const { profile: userData, setLoading, isSOSActive, isInterceptActive, isOverlayActive, isSOSBlocked, userPos } = useKavachStore();
  const user = auth.currentUser;

  // 🛰️ DYNAMIC GLOBAL WAR-ROOM VIEWPORT SCALING
  useEffect(() => {
    if (activeTab === 'safety_network') {
      window.scrollTo(0, 0);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleOpenProfile = () => setIsProfileOpen(true);
    document.addEventListener('OPEN_PROFILE_MODAL', handleOpenProfile);
    return () => document.removeEventListener('OPEN_PROFILE_MODAL', handleOpenProfile);
  }, []);

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
      sessionStorage.setItem('kavach_dev_logout', 'true');
      await signOut(auth);
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userPhoto = userData?.displayPhotoUrl || userData?.photoUrl || userData?.photoURL || user?.photoURL;
  const uid = userData?.aadhaarMasked || 'XXXX-XXXX-XXXX';
  const gender = userData?.gender || 'female';
  const displayName = user?.displayName || userData?.name || t('kavach_user');

  if (isGhostMode) {
    return (
      <WeatherScreen 
        onClose={onToggleGhost}
        userPhoto={userPhoto}
        displayName={displayName}
        uid={uid}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className={cn(
      "font-sans selection:bg-[#2563EB] selection:text-white transition-all duration-500 relative",
      role === 'super_cell' ? "h-screen overflow-hidden p-0" : 
      role === 'protector' || role === 'guardian' || (activeTab === 'rewards' && role !== 'citizen') ? "min-h-screen overflow-x-hidden pb-1 bg-[#0A0D14] text-white" : 
      "min-h-screen overflow-x-hidden pb-10 text-gray-900 bg-[#F8FAFC]"
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
      <ProtectorPledgeModal 
        isOpen={showProtectorOnboarding}
        onClose={() => setShowProtectorOnboarding(false)}
        onConfirm={confirmProtectorEnrollment}
      />

      {role !== 'super_cell' && !isInterceptActive && activeTab === 'dashboard' && !isOverlayActive && !isSOSBlocked && (
        <Header 
          role={role}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          userPhoto={userPhoto}
          displayName={displayName}
          userData={userData}
          gender={gender}
          onToggleGhost={onToggleGhost}
          handleRoleSwitch={handleRoleSwitch}
          handleLogout={handleLogout}
        />
      )}

      <main className={cn("mx-auto pb-1 relative transition-all z-10", 
        role === 'super_cell' || activeTab !== 'dashboard' || isOverlayActive ? "max-w-none px-0 h-full w-full" : "max-w-7xl pt-[88px]"
      )}>
        {children}

        {/* Slogan moved to global watermark overlay for perfect centering */}
      </main>

    </div>
  );
}
