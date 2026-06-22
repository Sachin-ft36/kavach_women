import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Globe, Users, Upload, MapPin, BookOpen, AlertTriangle, User, Bell, Shield } from 'lucide-react';
import { NavButton } from '../NavButton';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';

interface Props {
  isNavVisible: boolean;
}

export function BottomNavBar({ isNavVisible }: Props) {
  const { role, activeTab, setActiveTab, gender, profile } = useKavachStore();

  // 🔒 FORCED MALE RULE: Male users can never be citizens
  const isMale = gender === 'male' || (profile as any)?.gender === 'male';
  const effectiveRole = (isMale && role === 'citizen') ? 'protector' : role;

  if (effectiveRole === 'guardian') {
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
        <div className="w-full max-w-md bg-[#0B121F] border border-[#1E293B] rounded-[36px] px-3 py-2 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-auto relative">
          
          {/* Dashboard Tab */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-center justify-center flex-1 py-1 relative"
          >
            <LayoutDashboard size={20} className={activeTab === 'dashboard' ? "text-[#FF3B30]" : "text-[#64748B]"} />
            <span className={cn(
              "text-[8px] font-medium uppercase mt-1 tracking-wider",
              activeTab === 'dashboard' ? "text-[#FF3B30]" : "text-[#64748B]"
            )}>
              Dashboard
            </span>
            {activeTab === 'dashboard' && (
              <div className="absolute -bottom-1.5 w-6 h-0.5 bg-[#FF3B30]" />
            )}
          </button>

          {/* Protectors Tab */}
          <button 
            onClick={() => setActiveTab('radar')}
            className="flex flex-col items-center justify-center flex-1 py-1 relative"
          >
            <Users size={20} className={activeTab === 'radar' ? "text-[#FF3B30]" : "text-[#64748B] hover:text-[#FF3B30]"} />
            <span className={cn(
              "text-[8px] font-medium uppercase mt-1 tracking-wider",
              activeTab === 'radar' ? "text-[#FF3B30]" : "text-[#64748B]"
            )}>
              Protectors
            </span>
            {activeTab === 'radar' && (
              <div className="absolute -bottom-1.5 w-6 h-0.5 bg-[#FF3B30]" />
            )}
          </button>

          {/* Central SOS Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <button 
              onClick={() => {
                toast.info("SOS Emergency Line Broadcast Activated");
                const state = useKavachStore.getState();
                state.setPendingSOS(true, 'button');
              }}
              className="w-14 h-14 bg-gradient-to-b from-[#EF4444] to-[#B91C1C] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(239,68,68,0.4)] active:scale-95 transition-transform border border-red-500/20"
            >
              <div className="flex flex-col items-center justify-center text-white">
                <Shield size={20} fill="currentColor" />
                <span className="text-[7px] font-medium tracking-widest mt-0.5 uppercase">SOS</span>
              </div>
            </button>
          </div>

          {/* Alerts Tab */}
          <button 
            onClick={() => setActiveTab('history')}
            className="flex flex-col items-center justify-center flex-1 py-1 relative"
          >
            <div className="relative">
              <Bell size={20} className={activeTab === 'history' ? "text-[#FF3B30]" : "text-[#64748B]"} />
              <span className="absolute -top-1 -right-1 bg-[#FF3B30] text-white text-[7px] font-medium w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#0B121F]">
                3
              </span>
            </div>
            <span className={cn(
              "text-[8px] font-medium uppercase mt-1 tracking-wider",
              activeTab === 'history' ? "text-[#FF3B30]" : "text-[#64748B]"
            )}>
              Alerts
            </span>
            {activeTab === 'history' && (
              <div className="absolute -bottom-1.5 w-6 h-0.5 bg-[#FF3B30]" />
            )}
          </button>

          {/* Profile Tab */}
          <button 
            onClick={() => setActiveTab('rewards')}
            className="flex flex-col items-center justify-center flex-1 py-1 relative"
          >
            <User size={20} className={activeTab === 'rewards' ? "text-[#FF3B30]" : "text-[#64748B]"} />
            <span className={cn(
              "text-[8px] font-medium uppercase mt-1 tracking-wider",
              activeTab === 'rewards' ? "text-[#FF3B30]" : "text-[#64748B]"
            )}>
              Profile
            </span>
            {activeTab === 'rewards' && (
              <div className="absolute -bottom-1.5 w-6 h-0.5 bg-[#FF3B30]" />
            )}
          </button>

        </div>
      </motion.nav>
    );
  }

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
        {effectiveRole === 'protector' && (
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
