import React from 'react';
import { cn } from '../../../lib/utils';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  activeJourneys: any[];
  isDistrictTier: boolean;
}

export const NeuralPredictiveDrift: React.FC<Props> = ({ activeJourneys, isDistrictTier }) => {
  return (
    <div className={cn(
      "bg-[#020617] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between",
      isDistrictTier ? "lg:col-span-3 min-h-[400px]" : "lg:col-span-1"
    )}>
      <div className="absolute inset-0 bg-blue-600/5 blur-3xl" />
      <div className="relative z-10">
        <div className="w-16 h-16 bg-rose-600/10 rounded-[28px] border border-rose-500/20 flex items-center justify-center text-rose-500 mb-8 shadow-2xl shadow-rose-600/20">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Predictive Drift</h3>
        <p className="text-gray-400 text-[10px] font-bold mt-4 uppercase tracking-[0.2em] leading-relaxed">
          Analyzing anomalous transit vectors. Our neural net has identified {activeJourneys.filter(j => j.deviationDistance > 0.5).length} high-risk deviations across all active sectors.
        </p>
      </div>
      
      <div className="relative z-10 mt-12 flex flex-col min-h-0 h-full">
        <div className="bg-white/5 rounded-[2rem] border border-white/5 p-6 space-y-4 overflow-y-auto max-h-[160px] custom-scrollbar mb-4">
          {activeJourneys.filter(j => j.deviationDistance > 0.5).length === 0 ? (
              <div className="py-10 text-center opacity-20">
                <CheckCircle2 size={30} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Grid Vectors Normal</p>
              </div>
          ) : activeJourneys.filter(j => j.deviationDistance > 0.5).slice(0, 5).map((j, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic truncate max-w-[120px]">{j.vehicleNo || `V-LINK-${j.id.slice(0,4)}`}</span>
                </div>
                <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest italic">
                    {(j.deviationDistance * 100).toFixed(0)}% Drift
                </span>
              </div>
          ))}
        </div>
        <button className="w-full py-5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[4px] rounded-2xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all shrink-0">Sovereign Override</button>
      </div>
    </div>
  );
};
