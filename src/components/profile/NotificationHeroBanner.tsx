import React from 'react';
import { Eye, Palette, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationHeroBanner() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[18px] flex flex-row items-center"
      style={{
        background: 'linear-gradient(135deg, #12103a 0%, #0e0c2a 50%, #0b0921 100%)',
        border: '1px solid rgba(99,80,200,0.18)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        minHeight: '185px',
      }}
    >
      {/* Subtle background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-8 top-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(100,80,220,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute right-4 bottom-0 w-[100px] h-[100px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(140,100,255,0.08) 0%, transparent 70%)' }}
        />
        {/* Orbit ring */}
        <div
          className="absolute left-[60px] top-1/2 -translate-y-1/2 w-[220px] h-[140px] rounded-full"
          style={{ border: '1px solid rgba(100,80,200,0.1)', transform: 'translateY(-50%) rotate(-10deg)' }}
        />
        <div
          className="absolute left-[80px] top-1/2 -translate-y-1/2 w-[180px] h-[110px] rounded-full"
          style={{ border: '1px solid rgba(100,80,200,0.07)', transform: 'translateY(-50%) rotate(8deg)' }}
        />
      </div>

      {/* LEFT: Phone Mockup with floating theme cards */}
      <div className="relative shrink-0 w-[195px] h-[185px] flex items-center justify-center">

        {/* Phone frame */}
        <motion.div
          className="relative z-10"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="relative"
            style={{
              width: '90px',
              height: '156px',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #1a1636 0%, #0e0c24 100%)',
              border: '1.5px solid rgba(120,100,220,0.35)',
              boxShadow: '0 12px 32px rgba(80,60,180,0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Dynamic Island notch */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-2"
              style={{
                width: '24px',
                height: '6px',
                borderRadius: '4px',
                background: '#000',
              }}
            />

            {/* Status bar */}
            <div className="absolute top-[10px] left-2 right-2 flex items-center justify-between">
              <span style={{ fontSize: '5px', color: 'rgba(255,255,255,0.5)' }}>9:41</span>
              <div className="flex gap-0.5">
                <div style={{ width: '6px', height: '3px', borderRadius: '1px', background: 'rgba(255,255,255,0.5)' }} />
                <div style={{ width: '5px', height: '3px', borderRadius: '1px', background: 'rgba(255,255,255,0.3)', border: '0.5px solid rgba(255,255,255,0.3)' }} />
              </div>
            </div>

            {/* Shield logo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ top: '16px' }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #6040e0 0%, #4820c0 100%)',
                  boxShadow: '0 4px 12px rgba(80,50,200,0.5)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white" fillOpacity="0.9" />
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35" fill="white" fillOpacity="0.4" />
                  <path d="M10 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: '6.5px', color: 'rgba(160,140,220,0.9)', letterSpacing: '0.12em', fontWeight: '600' }}>KAVACH</span>
            </div>

            {/* Bottom nav bar */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-around"
              style={{
                height: '20px',
                background: 'rgba(20,16,48,0.95)',
                borderTop: '0.5px solid rgba(100,80,180,0.2)',
              }}
            >
              {[
                <svg key="home" width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="rgba(160,140,220,0.7)" strokeWidth="2" /><polyline points="9,22 9,12 15,12 15,22" stroke="rgba(160,140,220,0.7)" strokeWidth="2" /></svg>,
                <svg key="user" width="8" height="8" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.35)" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.35)" strokeWidth="2" /></svg>,
                <svg key="menu" width="8" height="8" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="2" rx="1" fill="rgba(255,255,255,0.35)" /><rect x="3" y="11" width="18" height="2" rx="1" fill="rgba(255,255,255,0.35)" /><rect x="3" y="16" width="18" height="2" rx="1" fill="rgba(255,255,255,0.35)" /></svg>,
              ].map((icon, i) => (
                <div key={i} className="flex items-center justify-center" style={{ width: '18px', height: '18px' }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Floating card: Moon/Night mode — top-left */}
        <motion.div
          className="absolute"
          style={{ top: '16px', left: '8px', zIndex: 20 }}
          animate={{ y: [0, -3, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2a1f5c 0%, #1a1440 100%)',
              border: '1px solid rgba(120,100,200,0.3)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#8b70ff" />
            </svg>
          </div>
        </motion.div>

        {/* Floating card: Sun/Light — top-right */}
        <motion.div
          className="absolute"
          style={{ top: '12px', right: '10px', zIndex: 20 }}
          animate={{ y: [0, 3, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3d2a00 0%, #241a00 100%)',
              border: '1px solid rgba(200,160,40,0.3)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" fill="#f59e0b" />
              <line x1="12" y1="2" x2="12" y2="5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="22" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="12" x2="5" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="19" y1="12" x2="22" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        {/* Floating card: SOS — bottom-left */}
        <motion.div
          className="absolute"
          style={{ bottom: '14px', left: '6px', zIndex: 20 }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b1a1a 0%, #600f0f 100%)',
              border: '1.5px solid rgba(220,60,60,0.4)',
              boxShadow: '0 4px 16px rgba(200,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '8px', fontWeight: '800', color: 'white', letterSpacing: '0.05em' }}>SOS</span>
          </div>
        </motion.div>

        {/* Floating card: Palette — bottom-right */}
        <motion.div
          className="absolute"
          style={{ bottom: '12px', right: '8px', zIndex: 20 }}
          animate={{ y: [0, 3, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2a1a40 0%, #1a1030 100%)',
              border: '1px solid rgba(160,100,220,0.3)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palette size={16} color="#c084fc" />
          </div>
        </motion.div>

      </div>

      {/* RIGHT: Text content */}
      <div className="flex-1 flex flex-col justify-center pr-3 pl-0.5 py-3" style={{ minWidth: 0 }}>
        <h2
          className="text-white font-bold mb-0.5 leading-tight"
          style={{ fontSize: '13px', letterSpacing: '-0.01em' }}
        >
          Make it yours
        </h2>
        <p
          className="mb-2 leading-snug"
          style={{ fontSize: '9px', color: 'rgba(180,170,220,0.85)' }}
        >
          Choose a theme that matches your style and helps you focus on what matters – your safety.
        </p>

        {/* Feature list */}
        <div className="flex flex-col gap-1">
          {/* Easy on the eyes */}
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(80,60,180,0.2)',
                border: '1px solid rgba(120,100,200,0.25)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={12} color="#a78bfa" />
            </div>
            <div>
              <span style={{ fontSize: '8.5px', fontWeight: '600', color: 'white' }}>Easy on the eyes</span>
              <p style={{ fontSize: '7px', color: 'rgba(160,150,200,0.8)', marginTop: '0px' }}>Optimized for clarity and comfort</p>
            </div>
          </div>

          {/* Multiple choices */}
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(100,60,180,0.2)',
                border: '1px solid rgba(140,100,200,0.25)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palette size={12} color="#c084fc" />
            </div>
            <div>
              <span style={{ fontSize: '8.5px', fontWeight: '600', color: 'white' }}>Multiple choices</span>
              <p style={{ fontSize: '7px', color: 'rgba(160,150,200,0.8)', marginTop: '0px' }}>Pick your perfect look</p>
            </div>
          </div>

          {/* Full control */}
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(80,60,160,0.2)',
                border: '1px solid rgba(110,90,190,0.25)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SlidersHorizontal size={12} color="#818cf8" />
            </div>
            <div>
              <span style={{ fontSize: '8.5px', fontWeight: '600', color: 'white' }}>Full control</span>
              <p style={{ fontSize: '7px', color: 'rgba(160,150,200,0.8)', marginTop: '0px' }}>Customize colors, mode and more</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
