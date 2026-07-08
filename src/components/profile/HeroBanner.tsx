import React from 'react';
import { Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroBanner() {
  // Generate random coordinates for floating particles
  const particles = [
    { size: 3, top: '15%', left: '10%', delay: 0, opacity: 0.6, blur: false },
    { size: 2, top: '25%', left: '30%', delay: 1, opacity: 0.4, blur: false },
    { size: 5, top: '12%', left: '70%', delay: 0.5, opacity: 0.3, blur: true },
    { size: 3, top: '45%', left: '5%', delay: 1.5, opacity: 0.5, blur: false },
    { size: 4, top: '65%', left: '20%', delay: 2, opacity: 0.4, blur: true },
    { size: 2, top: '80%', left: '15%', delay: 0.8, opacity: 0.6, blur: false },
    { size: 3, top: '85%', left: '40%', delay: 2.2, opacity: 0.3, blur: false },
    { size: 6, top: '30%', left: '85%', delay: 1.2, opacity: 0.25, blur: true },
    { size: 2, top: '50%', left: '90%', delay: 0.3, opacity: 0.5, blur: false },
    { size: 4, top: '75%', left: '75%', delay: 1.7, opacity: 0.45, blur: false },
    { size: 3, top: '60%', left: '55%', delay: 2.5, opacity: 0.35, blur: true },
    { size: 2, top: '90%', left: '68%', delay: 1.1, opacity: 0.5, blur: false },
    { size: 5, top: '5%', left: '45%', delay: 0.7, opacity: 0.2, blur: true },
    { size: 3, top: '35%', left: '50%', delay: 1.9, opacity: 0.4, blur: false },
    { size: 2, top: '95%', left: '85%', delay: 2.4, opacity: 0.55, blur: false },
    { size: 4, top: '55%', left: '25%', delay: 1.3, opacity: 0.3, blur: true },
    { size: 3, top: '20%', left: '60%', delay: 0.9, opacity: 0.5, blur: false },
    { size: 2, top: '40%', left: '78%', delay: 2.1, opacity: 0.4, blur: false },
  ];

  return (
    <section 
      aria-label="Notification Promotion Banner"
      className="
        relative w-full overflow-hidden 
        rounded-[24px] 
        py-6 px-4.5
        flex flex-row items-start gap-4.5
        border border-white/10
        backdrop-blur-xl
      "
      style={{
        background: 'linear-gradient(180deg, #0b0915 0%, #07060f 100%)',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04) inset'
      }}
    >
      {/* Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Floating Particles (Layer 5) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full bg-purple-400"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              opacity: p.opacity,
              filter: p.blur ? 'blur(1px)' : 'none',
            }}
            animate={{
              opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.4],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Left Illustration Section (Rendering static notification.png) */}
      <div className="w-44 h-44 shrink-0 relative flex items-center justify-center">
        <img 
          src="/notification.png" 
          alt="Notification illustration" 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback inside local code if loaded differently
            e.currentTarget.src = "/notification.png";
          }}
        />
      </div>

      {/* Right Content Section (Side-by-side on right) */}
      <div className="flex-1 min-w-0 flex flex-col items-start text-left z-10 pt-1">
        
        {/* Premium Tag */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[8px] font-semibold tracking-wider uppercase mb-1.5">
          <Sparkles size={8} className="text-purple-400" />
          <span>Security Hub</span>
        </div>

        {/* Headline */}
        <h1 className="text-[13px] font-bold text-white leading-tight tracking-tight mb-0.5">
          Stay informed, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#c084fc]">stay protected</span>
        </h1>

        {/* Description */}
        <p className="text-[9.5px] text-slate-400 leading-normal font-normal">
          Get real-time security alerts and manage preferences.
        </p>

        {/* Feature Pills List */}
        <div className="flex flex-col gap-1 mt-2.5">
          {/* Pill 1 */}
          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-400">
            <Sparkles size={10} className="text-purple-400 shrink-0" />
            <span>Real-time alerts</span>
          </div>

          {/* Pill 2 */}
          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-400">
            <ShieldAlert size={10} className="text-purple-400 shrink-0" />
            <span>Critical updates</span>
          </div>

          {/* Pill 3 */}
          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-400">
            <ShieldCheck size={10} className="text-[#00e599] shrink-0" />
            <span>Custom preferences</span>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="flex gap-1.5 mt-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-semibold transition-all cursor-pointer"
          >
            Enable
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-[9px] font-semibold transition-all backdrop-blur-sm cursor-pointer"
          >
            Learn More
          </motion.button>
        </div>

      </div>

    </section>
  );
}
