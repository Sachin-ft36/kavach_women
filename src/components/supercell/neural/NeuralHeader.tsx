import React from 'react';
import { motion } from 'motion/react';

export const NeuralHeader = () => {
  return (
    <div className="relative p-12 bg-[#0F172A] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-[4px] shadow-xl shadow-rose-600/20">Neural Intelligence v4.2</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">Predictive Threat Sentinel Active</span>
          </div>
        </div>
        <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">Command Pulse Analytics</h1>
        <p className="text-gray-400 text-sm font-bold mt-4 max-w-2xl uppercase tracking-tight leading-relaxed">
          De-layering national safety metrics with zero-latency precision. Visualizing regional neural load, transit deviation vectors, and justice velocity.
        </p>
      </div>
      {/* 🧬 DNA SPIRAL EFFECT (SIMULATED) */}
      <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10 pointer-events-none overflow-hidden">
        <div className="flex flex-col gap-4 py-8">
          {[...Array(12)].map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ x: [0, 40, 0] }} 
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              className="w-4 h-4 bg-blue-500 rounded-full" 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
