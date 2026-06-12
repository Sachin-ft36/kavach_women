import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  nearestPolice: { name: string; lat: number; lng: number; dist?: string } | null;
  setSafeHavenTarget: (val: any) => void;
  setIsSafeHavenMapOpen: (val: boolean) => void;
}

export default function QuickEscapeNavigator({ nearestPolice, setSafeHavenTarget, setIsSafeHavenMapOpen }: Props) {
  return (
    <AnimatePresence>
      {nearestPolice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full pb-1 px-1"
        >
          <button
            onClick={() => {
              setSafeHavenTarget(nearestPolice);
              setIsSafeHavenMapOpen(true);
              toast.success(`Locating ${nearestPolice.name}`);
            }}
            className="w-full bg-white rounded-2xl sm:rounded-[30px] p-3 sm:p-4 md:p-6 flex items-center justify-between active:scale-95 transition-all shadow-xl border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/5" />

            {/* Left Side */}
            <div className="flex items-center gap-2 sm:gap-4 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-slate-500" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[9px] sm:text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                  Nearest Police Station
                </span>
                <span className="block text-[10px] sm:text-sm font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[180px] md:max-w-[240px]">
                  {nearestPolice.name}
                </span>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-shrink-0">
              {nearestPolice.dist && (
                <>
                  <div className="w-px h-10 sm:h-14 bg-slate-200 rounded-full" />
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm sm:text-lg md:text-2xl font-bold text-slate-900 leading-none">
                      {String(nearestPolice.dist ?? '')
                        .toUpperCase()
                        .replace(' AWAY', '')
                        .replace('KM', 'km')}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-bold text-blue-700 uppercase mt-1">
                      AWAY
                    </span>
                  </div>
                </>
              )}
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-500" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
