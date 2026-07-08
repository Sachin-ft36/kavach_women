import React from 'react';
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
        "flex flex-col items-center justify-center flex-1 h-14 sm:h-16 transition-all relative group min-w-0 px-1 cursor-pointer",
        active ? "text-[#C084FC]" : "text-slate-400 hover:text-slate-200"
      )}
    >
      <div className={cn(
        "p-2 rounded-[16px] transition-all duration-300 shrink-0 border",
        active 
          ? "bg-[#1D1737] border-[#3E237E] text-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.35)]" 
          : "bg-transparent border-transparent text-slate-400 group-hover:text-slate-300"
      )}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, {
          className: cn(
            (icon as any).props.className,
            active ? "text-[#A855F7] drop-shadow-[0_0_8px_rgba(168,85,247,0.85)]" : "text-slate-400"
          )
        }) : icon}
      </div>
      <span className={cn(
        "text-[10px] font-bold mt-1 transition-all truncate w-full text-center leading-none px-0.5 max-w-full block", 
        active ? "text-[#C084FC]" : "text-slate-400 group-hover:text-slate-350"
      )}>
        {label}
      </span>
    </button>
  );
}
