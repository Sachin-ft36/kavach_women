import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, FolderOpen, LayoutDashboard, Globe, Users, Upload, MapPin, BookOpen, AlertTriangle, User, Bell, Shield, LayoutGrid, CheckCircle2, Camera } from 'lucide-react';
import { NavButton } from '../NavButton';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../state/useKavachStore';
import { useTimeTheme } from '../../hooks/useTimeTheme';
import { toast } from 'sonner';
import DailyCheckIn from '../safetimer/DailyCheckIn';
import CheckInCamera from '../safetimer/CheckInCamera';

interface Props {
  isNavVisible: boolean;
}

export function BottomNavBar({ isNavVisible }: Props) {
  const { role, activeTab, setActiveTab, gender, profile, isAIChatOpen, isCameraActive } = useKavachStore();
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [lastClosedTime, setLastClosedTime] = useState(0);

  // 🔒 FORCED MALE RULE: Male users can never be citizens
  const isMale = gender === 'male' || (profile as any)?.gender === 'male';
  const effectiveRole = (isMale && role === 'citizen') ? 'protector' : role;

  const { themeFolder } = useTimeTheme();
  const isNight = themeFolder === 'night';

  if (effectiveRole === 'guardian') {
    return (
      <motion.nav
        initial={{ y: 0 }}
        animate={{
          y: 0
        }}
        transition={{ type: "tween", duration: 0.1, ease: "easeInOut" }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000000,
          padding: '10px',
          paddingBottom: '2px',
          display: isAIChatOpen ? 'none' : 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        <div className="w-full max-w-md bg-[#0C0F1D] backdrop-blur-xl border border-[#23294E] rounded-[24px] px-3 py-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.6),_0_0_20px_rgba(168,85,247,0.05)] pointer-events-auto relative">

          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-center justify-center flex-1 py-1 relative group"
          >
            <LayoutDashboard size={22} className={activeTab === 'dashboard' ? "text-[#FF3B30]" : "text-white/60 group-hover:text-white/80"} />
            <span className={cn(
              "text-[9px] sm:text-[9.5px] font-semibold uppercase mt-1 tracking-wider",
              activeTab === 'dashboard' ? "text-[#FF3B30]" : "text-white/70 group-hover:text-white/90"
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
            className="flex flex-col items-center justify-center flex-1 py-1 relative group"
          >
            <Users size={22} className={activeTab === 'radar' ? "text-[#FF3B30]" : "text-white/60 group-hover:text-white/80"} />
            <span className={cn(
              "text-[9px] sm:text-[9.5px] font-semibold uppercase mt-1 tracking-wider",
              activeTab === 'radar' ? "text-[#FF3B30]" : "text-white/70 group-hover:text-white/90"
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
                <Shield size={22} fill="currentColor" />
                <span className="text-[8px] font-medium tracking-widest mt-0.5 uppercase">SOS</span>
              </div>
            </button>
          </div>

          {/* Alerts Tab */}
          <button
            onClick={() => setActiveTab('history')}
            className="flex flex-col items-center justify-center flex-1 py-1 relative group"
          >
            <div className="relative">
              <Bell size={22} className={activeTab === 'history' ? "text-[#FF3B30]" : "text-white/60 group-hover:text-white/80"} />
              <span className="absolute -top-1 -right-1 bg-[#FF3B30] text-white text-[7px] font-medium w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#0B121F]">
                3
              </span>
            </div>
            <span className={cn(
              "text-[9px] sm:text-[9.5px] font-semibold uppercase mt-1 tracking-wider",
              activeTab === 'history' ? "text-[#FF3B30]" : "text-white/70 group-hover:text-white/90"
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
            className="flex flex-col items-center justify-center flex-1 py-1 relative group"
          >
            <User size={22} className={activeTab === 'rewards' ? "text-[#FF3B30]" : "text-white/60 group-hover:text-white/80"} />
            <span className={cn(
              "text-[9px] sm:text-[9.5px] font-semibold uppercase mt-1 tracking-wider",
              activeTab === 'rewards' ? "text-[#FF3B30]" : "text-white/70 group-hover:text-white/90"
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
      initial={{ y: 0 }}
      animate={{
        y: 0
      }}
      transition={{ type: "tween", duration: 0.1, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000000,
        padding: effectiveRole === 'citizen' ? '0px' : '10px',
        paddingBottom: effectiveRole === 'citizen' ? '0px' : '2px',
        display: isAIChatOpen ? 'none' : 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      <AnimatePresence>
        {isDailyCheckInOpen && (
          <DailyCheckIn
            isOpen={isDailyCheckInOpen}
            onClose={() => {
              setLastClosedTime(Date.now());
              setIsDailyCheckInOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* CheckInCamera - Portaled directly to body, outside motion.nav transform context */}
      {isCameraActive && ReactDOM.createPortal(
        <CheckInCamera
          isOpen={true}
          onClose={() => {
            const store = useKavachStore.getState();
            store.setIsCameraActive(false);
          }}
        />,
        document.body
      )}

      <div className={cn(
        "w-full max-w-md border flex justify-between items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-300 relative z-[600000]",
        isCameraActive ? "hidden" : "",
        effectiveRole === 'citizen'
          ? (isNight 
              ? "bg-[#0c0517]/95 backdrop-blur-xl border-purple-900/30 rounded-none border-x-0 border-b-0 border-t h-[74px] px-6"
              : "bg-white/95 backdrop-blur-xl border-slate-200 rounded-none border-x-0 border-b-0 border-t h-[74px] px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]")
          : "bg-[#0C0F1D] border-[#23294E]/60 rounded-[24px] p-2"
      )}>
        {effectiveRole === 'citizen' && (
          <div className="flex w-full items-center justify-between relative">
            {/* Home Tab */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsDailyCheckInOpen(false);
              }}
              className="flex flex-col items-center justify-center w-12 cursor-pointer relative gap-1 group border-none bg-transparent"
            >
              <Home
                size={16}
                strokeWidth={activeTab === 'dashboard' && !isDailyCheckInOpen ? 2.5 : 2}
                className={`transition-all duration-300 ${activeTab === 'dashboard' && !isDailyCheckInOpen
                    ? (isNight ? 'text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-[#9333ea]')
                    : (isNight ? 'text-white/60 group-hover:text-white' : 'text-[#64748b] group-hover:text-[#334155]')
                  }`}
              />
              <span
                className={`text-[9.5px] transition-colors duration-300 ${activeTab === 'dashboard' && !isDailyCheckInOpen 
                    ? (isNight ? 'text-[#a855f7] font-bold' : 'text-[#9333ea] font-bold') 
                    : (isNight ? 'text-white/60' : 'text-[#64748b]')
                  }`}
              >
                Home
              </span>
              <div
                className={`absolute -bottom-[8px] w-6 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'dashboard' && !isDailyCheckInOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  } ${isNight ? 'bg-[#a855f7] shadow-[0_0_8px_#a855f7]' : 'bg-[#9333ea]'}`}
              />
            </button>
 
            {/* Circle Tab */}
            <button
              onClick={() => {
                setActiveTab('contacts');
                setIsDailyCheckInOpen(false);
              }}
              className="flex flex-col items-center justify-center w-12 cursor-pointer relative gap-1 group border-none bg-transparent"
            >
              <Users
                size={16}
                strokeWidth={activeTab === 'contacts' && !isDailyCheckInOpen ? 2.5 : 2}
                className={`transition-all duration-300 ${activeTab === 'contacts' && !isDailyCheckInOpen
                    ? (isNight ? 'text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-[#9333ea]')
                    : (isNight ? 'text-white/60 group-hover:text-white' : 'text-[#64748b] group-hover:text-[#334155]')
                  }`}
              />
              <span
                className={`text-[9.5px] transition-colors duration-300 ${activeTab === 'contacts' && !isDailyCheckInOpen 
                    ? (isNight ? 'text-[#a855f7] font-bold' : 'text-[#9333ea] font-bold') 
                    : (isNight ? 'text-white/60' : 'text-[#64748b]')
                  }`}
              >
                Circle
              </span>
              <div
                className={`absolute -bottom-[8px] w-6 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'contacts' && !isDailyCheckInOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  } ${isNight ? 'bg-[#a855f7] shadow-[0_0_8px_#a855f7]' : 'bg-[#9333ea]'}`}
              />
            </button>

            {/* Spacer for center button to ensure equal justify-between spacing */}
            <div className="w-12 h-1 shrink-0" />
 
            {/* Center Prominent Button (Camera cutout) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-[20px] flex flex-col items-center justify-center cursor-pointer group z-10"
              onClick={(e) => {
                e.stopPropagation();
                if (Date.now() - lastClosedTime < 400) return;
                setIsDailyCheckInOpen(true);
              }}
            >
              {/* Outer circular cutout/border curve */}
              <div className={`w-[66px] h-[66px] rounded-full flex items-center justify-center border-t border-x relative ${isNight ? 'bg-[#0c0517]/95 border-purple-900/40 shadow-[0_-8px_16px_rgba(139,92,246,0.15)]' : 'bg-white border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'}`}>
                {/* Glow behind the button */}
                <div className={`absolute inset-2 rounded-full blur-[10px] pointer-events-none transition-opacity ${isNight ? 'bg-[#a855f7] opacity-40 group-hover:opacity-60' : 'bg-[#9333ea] opacity-20 group-hover:opacity-40'}`}></div>
                {/* Glowing inner button */}
                <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95 border border-white/20 bg-gradient-to-b from-[#b848ff] via-[#8333ec] to-[#5b1cc6] shadow-[0_0_20px_rgba(168,85,247,0.7)] z-10">
                  <Camera size={20} className="text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
 
            {/* Protect Tab */}
            <button
              onClick={() => {
                setActiveTab('radar');
                setIsDailyCheckInOpen(false);
              }}
              className="flex flex-col items-center justify-center w-12 cursor-pointer relative gap-1 group border-none bg-transparent"
            >
              <Shield
                size={16}
                strokeWidth={activeTab === 'radar' && !isDailyCheckInOpen ? 2.5 : 2}
                className={`transition-all duration-300 ${activeTab === 'radar' && !isDailyCheckInOpen
                    ? (isNight ? 'text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-[#9333ea]')
                    : (isNight ? 'text-white/60 group-hover:text-white' : 'text-[#64748b] group-hover:text-[#334155]')
                  }`}
              />
              <span
                className={`text-[9.5px] transition-colors duration-300 ${activeTab === 'radar' && !isDailyCheckInOpen 
                    ? (isNight ? 'text-[#a855f7] font-bold' : 'text-[#9333ea] font-bold') 
                    : (isNight ? 'text-white/60' : 'text-[#64748b]')
                  }`}
              >
                Protect
              </span>
              <div
                className={`absolute -bottom-[8px] w-6 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'radar' && !isDailyCheckInOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  } ${isNight ? 'bg-[#a855f7] shadow-[0_0_8px_#a855f7]' : 'bg-[#9333ea]'}`}
              />
            </button>
 
            {/* Tools Tab */}
            <button
              onClick={() => {
                setActiveTab('vault');
                setIsDailyCheckInOpen(false);
              }}
              className="flex flex-col items-center justify-center w-12 cursor-pointer relative gap-1 group border-none bg-transparent"
            >
              <LayoutGrid
                size={16}
                strokeWidth={activeTab === 'vault' && !isDailyCheckInOpen ? 2.5 : 2}
                className={`transition-all duration-300 ${activeTab === 'vault' && !isDailyCheckInOpen
                    ? (isNight ? 'text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-[#9333ea]')
                    : (isNight ? 'text-white/60 group-hover:text-white' : 'text-[#64748b] group-hover:text-[#334155]')
                  }`}
              />
              <span
                className={`text-[9.5px] transition-colors duration-300 ${activeTab === 'vault' && !isDailyCheckInOpen 
                    ? (isNight ? 'text-[#a855f7] font-bold' : 'text-[#9333ea] font-bold') 
                    : (isNight ? 'text-white/60' : 'text-[#64748b]')
                  }`}
              >
                Tools
              </span>
              <div
                className={`absolute -bottom-[8px] w-6 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'vault' && !isDailyCheckInOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  } ${isNight ? 'bg-[#a855f7] shadow-[0_0_8px_#a855f7]' : 'bg-[#9333ea]'}`}
              />
            </button>
          </div>
        )}
        {effectiveRole === 'protector' && (
          <>
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<MapPin size={22} />} label="Response" />
            <NavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={22} />} label="Safety Tips" />
            <NavButton active={activeTab === 'grievance'} onClick={() => setActiveTab('grievance')} icon={<AlertTriangle size={22} />} label="Reports" />
            <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<User size={22} />} label="Profile" />
          </>
        )}
      </div>
    </motion.nav>
  );
}
