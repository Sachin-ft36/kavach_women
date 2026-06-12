import React from 'react';
import { cn } from '../../lib/utils';

export const ActionCard = React.memo(({ icon, title, desc, iconColor, tint, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={cn("bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-transform", className)}
  >
    <div className="flex items-center gap-2 sm:gap-3 relative z-10">
      <div style={{ color: iconColor, backgroundColor: tint }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
        {React.cloneElement(icon as any, { size: 16 })}
      </div>
      <h3 className="text-[10px] sm:text-[12px] font-bold text-[#1E293B] tracking-tight leading-tight flex-1 break-words">
        {title}
      </h3>
    </div>

    <div className="relative z-10">
      <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">{desc}</p>
    </div>
  </button>
));
