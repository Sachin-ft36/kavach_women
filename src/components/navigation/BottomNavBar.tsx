import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Globe, Users, Upload, MapPin, BookOpen, AlertTriangle, User } from 'lucide-react';
import { NavButton } from '../NavButton';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../store/useKavachStore';

interface Props {
  isNavVisible: boolean;
}

export function BottomNavBar({ isNavVisible }: Props) {
  const { role, activeTab, setActiveTab, gender, profile } = useKavachStore();

  // 🔒 FORCED MALE RULE: Male users can never be citizens
  const isMale = gender === 'male' || (profile as any)?.gender === 'male';
  const effectiveRole = (isMale && role === 'citizen') ? 'protector' : role;

  return (
    <motion.nav
      initial={{ y: 120, opacity: 0 }}
      animate={{
        y: isNavVisible ? 0 : 120,
        opacity: isNavVisible ? 1 : 0
      }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000000,
        padding: '16px',
        paddingBottom: '24px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div className={cn(
        "w-full max-w-md border rounded-[40px] p-2 flex justify-between items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-auto",
        effectiveRole === 'citizen' ? "bg-white border-white/80" : "bg-white border-white/40"
      )}>
        {effectiveRole === 'citizen' && (
          <>
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
            <NavButton active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} icon={<Globe size={20} />} label="Radar" />
            <NavButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<Users size={20} />} label="Guardians" />
            <NavButton active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} icon={<Upload size={20} />} label="Vault" />
            <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<User size={20} />} label="Profile" />
          </>
        )}
        {(effectiveRole === 'protector' || effectiveRole === 'pcr_officer') && (
          <>
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<MapPin size={20} />} label="Response" />
            <NavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={20} />} label="Safety Tips" />
            <NavButton active={activeTab === 'grievance'} onClick={() => setActiveTab('grievance')} icon={<AlertTriangle size={20} />} label="Reports" />
            <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<User size={20} />} label="Profile" />
          </>
        )}
      </div>
    </motion.nav>
  );
}
