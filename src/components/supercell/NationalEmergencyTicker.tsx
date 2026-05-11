import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Zap, Globe, Cpu } from 'lucide-react';

interface NationalEmergencyTickerProps {
  isActive: boolean;
  gridNodeCount: number;
}

export const NationalEmergencyTicker: React.FC<NationalEmergencyTickerProps> = ({ isActive, gridNodeCount }) => {
  if (!isActive) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-rose-600 overflow-hidden relative"
    >
      <div className="flex items-center px-6 py-2 gap-8 whitespace-nowrap">
        {/* 🚨 CRITICAL STATUS ICON */}
        <div className="flex items-center gap-2 shrink-0">
          <ShieldAlert size={14} className="text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">National Emergency Protocol: 00-X</span>
        </div>

        <div className="h-4 w-[1px] bg-rose-400 shrink-0" />

        {/* 🛰️ MOVING TICKER AREA */}
        <div className="flex-1 overflow-hidden relative">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-12"
          >
            {[1, 2, 3].map((_, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-rose-200" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    Sovereign Override Active: Regional Nodes Bypassed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-rose-200" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    National Grid Locked: {gridNodeCount} Nodes under Direct SuperCell Command
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-rose-200" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    Neural Link High-Priority: Latency 14ms (Optimal)
                  </span>
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        <div className="h-4 w-[1px] bg-rose-400 shrink-0" />

        {/* 🏛️ AUTHORITY STAMP */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">GOVT OF INDIA AUTHENTICATED</span>
        </div>
      </div>
      
      {/* 🔮 SCAN LINE EFFECT */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-shimmer" />
    </motion.div>
  );
};
