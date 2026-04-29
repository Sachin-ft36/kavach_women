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
    const accents: any = {
        blue: "text-accent-blue bg-accent-blue/10 border-accent-blue",
        red: "text-accent-red bg-accent-red/10 border-accent-red",
        orange: "text-orange-500 bg-orange-500/10 border-orange-500"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group backdrop-blur-xl",
                selected ? accents[color] + " shadow-lg" : "bg-white/[0.05] border-white/10 shadow-inner"
            )}
        >
            <div className="relative z-10 space-y-3">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    selected ? "bg-white shadow-md text-accent-blue" : "bg-white/10 text-white"
                )}>
                    <Icon size={18} />
                </div>
                
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <h3 className={cn("text-base font-black uppercase tracking-tighter italic", selected ? "text-inherit" : "text-white")}>{title}</h3>
                        {selected && <CheckCircle2 size={14} className="text-inherit" />}
                    </div>
                    <p className="text-[7px] font-black uppercase tracking-widest text-white/50">{sub}</p>
                </div>

                <p className="text-[9px] leading-relaxed font-bold uppercase tracking-wider text-white">
                    {desc}
                </p>
            </div>
        </motion.button>
    );
};
