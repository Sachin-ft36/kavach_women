import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, X, ShieldCheck } from 'lucide-react';
import KavachMap from '../../components/maps/KavachMap';
import { useKavachStore } from '../../store/useKavachStore';

export default function TacticalRadarModal({
  isMapModalOpen,
  setIsMapModalOpen,
  protectors,
  nearbyCount
}: any) {
  return (
    <AnimatePresence>
      {isMapModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 sm:p-4 bg-[#0B101A] border-b border-white/10 z-10">
            <div className="flex items-center gap-2">
              <Map className="text-blue-500" size={20} />
              <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[2px] sm:tracking-widest">
                Tactical Radar
              </span>
            </div>
            <button onClick={() => setIsMapModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 relative">
            <KavachMap
              mode="radar"
              activeProtectors={protectors}
              {...{ protectors, activeRadius: useKavachStore.getState().activeRadius }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 bg-black/90 border border-white/20 rounded-full flex items-center gap-2 sm:gap-3 max-w-[90vw]">
              <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-[1px] sm:tracking-[2px] whitespace-nowrap">
                {nearbyCount} Police/Protectors Near You
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
