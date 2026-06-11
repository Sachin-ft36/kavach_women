import React from 'react';
import { motion } from 'motion/react';
import {
  Shield, Users, Bell, FileText, Clock, Box, Car, MessageCircle, BarChart3, Database, BookOpen, ClipboardList, Gavel, Settings, LogOut, ShieldCheck, LayoutDashboard, History
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

interface NavItemProps {
  id: string;
  label: string;
  icon: any;
  isActive: boolean;
  onTabChange: (id: string) => void;
}

const NavItem = ({ id, label, icon: Icon, isActive, onTabChange }: NavItemProps) => {
  return (
    <button
      onClick={() => onTabChange(id)}
      className={cn(
        "w-full flex flex-col items-center py-3.5 px-1 transition-all duration-200 relative group cursor-pointer",
        isActive
          ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
      )}
    >
      <Icon size={18} className={cn("mb-1.5 transition-transform", isActive ? "scale-110 text-blue-600" : "text-slate-400 group-hover:text-slate-700")} />
      <span className={cn(
        "text-[6px] font-black uppercase tracking-[0.5px] text-center leading-none transition-colors",
        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
      )}>{label}</span>
      {isActive && <motion.div layoutId="navIndicator" className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-600" />}
    </button>
  );
};

export const SuperCellSidebar = ({ viewMode, onTabChange }: { viewMode: string, onTabChange: (id: string) => void }) => {
  return (
    <nav className="w-[70px] bg-white border-r border-slate-100 flex flex-col h-full z-50 shrink-0 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="p-3 flex justify-center border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/5">
          <Shield size={18} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex-1 py-2 overflow-y-auto scrollbar-hide">
        <NavItem id="COMMAND" label="Dashboard" icon={LayoutDashboard} isActive={viewMode === 'COMMAND'} onTabChange={onTabChange} />
        <NavItem id="VERIFICATION" label="Vetting Desk" icon={ShieldCheck} isActive={viewMode === 'VERIFICATION'} onTabChange={onTabChange} />
        <NavItem id="SOS" label="SOS Alerts" icon={Bell} isActive={viewMode === 'SOS'} onTabChange={onTabChange} />
        <NavItem id="FIR" label="FIR Reports" icon={FileText} isActive={viewMode === 'FIR'} onTabChange={onTabChange} />
        <NavItem id="PROTECTORS" label="Protectors" icon={Users} isActive={viewMode === 'PROTECTORS'} onTabChange={onTabChange} />
        <NavItem id="SHIFTS" label="Shift Logs" icon={Clock} isActive={viewMode === 'SHIFTS'} onTabChange={onTabChange} />
        <NavItem id="TRACK" label="3D Track" icon={Box} isActive={viewMode === 'TRACK'} onTabChange={onTabChange} />
        <NavItem id="TRANSIT" label="Transit Intel" icon={Car} isActive={viewMode === 'TRANSIT'} onTabChange={onTabChange} />
        <NavItem id="CHAT" label="Chat" icon={MessageCircle} isActive={viewMode === 'CHAT'} onTabChange={onTabChange} />
        <NavItem id="ANALYTICS" label="Neural Pulse" icon={BarChart3} isActive={viewMode === 'ANALYTICS'} onTabChange={onTabChange} />
        <NavItem id="DATA" label="Directory" icon={Database} isActive={viewMode === 'DATA'} onTabChange={onTabChange} />
        <NavItem id="GUIDES" label="Guides" icon={BookOpen} isActive={viewMode === 'GUIDES'} onTabChange={onTabChange} />
        <NavItem id="REPORTS" label="Field Reports" icon={ClipboardList} isActive={viewMode === 'REPORTS'} onTabChange={onTabChange} />
        <NavItem id="APPEALS" label="Appeals" icon={Gavel} isActive={viewMode === 'APPEALS'} onTabChange={onTabChange} />
        <NavItem id="SETTINGS" label="Settings" icon={Settings} isActive={viewMode === 'SETTINGS'} onTabChange={onTabChange} />
      </div>
      <div className="py-4 border-t border-slate-100">
        <button
          onClick={async () => {
            sessionStorage.setItem('kavach_dev_logout', 'true');
            await signOut(auth);
            localStorage.clear(); // 🏛️ SYSTEM WIPE: AUTHORIZED
            window.location.reload();
          }}
          className="w-full flex flex-col items-center py-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all duration-200 group cursor-pointer"
        >
          <LogOut size={20} className="mb-1.5 group-hover:scale-110 text-slate-400 group-hover:text-rose-600" />
          <span className="text-[6px] font-black uppercase tracking-[1px] text-center leading-none text-slate-400 group-hover:text-rose-600">Log Out</span>
        </button>
      </div>
    </nav>
  );
};
