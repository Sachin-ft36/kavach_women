import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PremiumCardProps {
  selected: boolean;
  onClick: () => void;
  icon: any;
  title: string;
  sub: string;
  desc: string;
  color?: "blue" | "red" | "orange";
}

export const PremiumCard = ({ selected, onClick, icon: Icon, title, sub, desc, color = "blue" }: PremiumCardProps) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "w-full text-left p-5 rounded-[22px] border-2 transition-all duration-300 relative overflow-hidden group shadow-sm",
                selected 
                  ? "border-[#1B3A6B] bg-[#F0F4FF]" 
                  : "bg-white border-slate-100 hover:border-slate-200"
            )}
        >
            <div className="relative z-10 flex items-start gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0",
                    selected 
                      ? "bg-white border-[#1B3A6B]/20 text-[#1B3A6B]" 
                      : "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                    <Icon size={22} className="stroke-[1.5]" />
                </div>
                
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black leading-tight text-[#1B3A6B]">{title}</h3>
                        {selected && <CheckCircle2 size={14} className="text-[#1B3A6B]" />}
                    </div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{color:'#FF9933'}}>{sub}</p>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        {desc}
                    </p>
                </div>
            </div>
        </motion.button>
    );
};

