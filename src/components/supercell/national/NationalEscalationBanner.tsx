import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  isSimulatingRun: boolean;
  incidentData: any;
  isNakabandiDeployed: boolean;
  deployHighwayNakabandi: () => void;
}

export function NationalEscalationBanner({
  isSimulatingRun, incidentData, isNakabandiDeployed, deployHighwayNakabandi
}: Props) {
  return (
    <AnimatePresence>
      {isSimulatingRun && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-500 text-slate-950 font-['Outfit'] font-black uppercase text-center py-2 text-[13px] tracking-[3px] flex items-center justify-center gap-3 relative z-30 shadow-lg border-b border-amber-600  shrink-0"
        >
          <AlertTriangle size={14} />
          CRISIS STATE HQ ESCALATION: Target coordinates leaving {incidentData?.city || 'Local'} District boundaries. Escape vector active towards state border!
          <button 
            onClick={deployHighwayNakabandi}
            className={cn(
              "ml-6 px-4 py-1 rounded text-[12px] font-black uppercase tracking-widest border transition-all",
              isNakabandiDeployed 
                ? "bg-slate-900 border-slate-900 text-emerald-400 font-bold" 
                : "bg-slate-900 border-slate-950 text-white hover:bg-black font-bold"
            )}
          >
            {isNakabandiDeployed ? "🚧 NAKABANDI LOCKED" : "🚧 TRIGGER HIGHWAY NAKABANDI"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
