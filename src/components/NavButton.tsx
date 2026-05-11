import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-14 sm:h-16 transition-all relative group", 
        active ? "text-[#2563EB]" : "text-[#64748B]"
      )}
    >
      <div className={cn(
        "p-2 sm:p-2.5 rounded-2xl transition-all duration-500", 
        active && "bg-[#2563EB]/10 scale-105 shadow-sm"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[6px] sm:text-[7px] font-black uppercase tracking-[1px] transition-all mt-0.5", 
        active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="activeTabDot" 
          className="absolute -bottom-0.5 w-1 h-1 bg-[#2563EB] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" 
        />
      )}
    </button>
  );
}
