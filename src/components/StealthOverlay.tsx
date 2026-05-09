import React from 'react';
import { motion } from 'framer-motion';
import { useKavachStore } from '../store/useKavachStore';
import { Shield } from 'lucide-react';

/**
 * 🕵️‍♂️ STEALTH CAMERA OVERLAY (BLACK BOX)
 * This component provides a pure black screen while recording.
 * To the observer, the phone appears OFF or LOCKED.
 */
export default function StealthOverlay() {
  const { isShadowActive, setShadowActive } = useKavachStore();

  if (!isShadowActive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100000] bg-black cursor-none touch-none flex flex-col items-center justify-center"
    >
      {/* 🔇 SILENT INDICATOR (Invisible to strangers, but detectable by the user via long press) */}
      <div 
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full relative"
      >
        {/* 🛰️ HIDDEN DISENGAGE ZONE (Top Right - Requires 3s Hold to Exit) */}
        <motion.div 
          className="absolute top-0 right-0 w-32 h-32 opacity-0 active:opacity-10 transition-opacity flex items-center justify-center"
          onPointerDown={(e) => {
            const timer = setTimeout(() => {
              setShadowActive(false);
            }, 3000);
            (e.target as any)._kavachTimer = timer;
          }}
          onPointerUp={(e) => {
             clearTimeout((e.target as any)._kavachTimer);
          }}
        >
           <Shield size={20} className="text-blue-500/20" />
        </motion.div>

        {/* 🎬 HIDDEN CAMERA VIEWPORT (Simulated) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0">
           <div className="w-full h-full bg-gray-900 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
