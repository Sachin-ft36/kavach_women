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
        blue: "border-[#2563EB] bg-[#2563EB]/5 shadow-lg shadow-[#2563EB]/10",
        red: "border-[#DC2626] bg-[#DC2626]/5 shadow-lg shadow-[#DC2626]/10",
        orange: "border-[#D97706] bg-[#D97706]/5 shadow-lg shadow-[#D97706]/10"
    };

    const iconColors: any = {
        blue: "text-[#2563EB]",
        red: "text-[#DC2626]",
        orange: "text-[#D97706]"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "w-full text-left p-4 rounded-[22px] border-2 transition-all duration-300 relative overflow-hidden group",
                selected ? accents[color] : "bg-white border-[#E5E7EB] hover:border-[#2563EB]/30"
            )}
        >
            <div className="relative z-10 flex items-start gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all duration-300 shrink-0",
                    selected ? "bg-white " + iconColors[color] + " border-white" : "bg-gray-50 text-gray-300 border-gray-100"
                )}>
                    <Icon size={20} />
                </div>
                
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className={cn(
                            "text-sm font-black leading-tight transition-colors",
                            selected ? "text-gray-900" : "text-gray-700"
                        )}>{title}</h3>
                        {selected && <CheckCircle2 size={14} className={iconColors[color]} />}
                    </div>
                    <p className="text-[8px] font-black uppercase tracking-[1px] text-gray-400">{sub}</p>
                    <p className="text-[10px] font-bold text-gray-500 leading-tight">
                        {desc}
                    </p>
                </div>
            </div>
        </motion.button>
    );
};
