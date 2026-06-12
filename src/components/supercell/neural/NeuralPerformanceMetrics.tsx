import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { Zap, Clock, Navigation, BarChart3 } from 'lucide-react';

interface Props {
  activeAlerts: any[];
  activeJourneys: any[];
  justiceLedger: any[];
}

export const NeuralPerformanceMetrics: React.FC<Props> = ({ activeAlerts, activeJourneys, justiceLedger }) => {
  const deviationCount = activeJourneys.filter(j => (j.deviationDistance || 0) > 0.5).length;
  
  const resolvedAlerts = activeAlerts.filter(a => a.status === 'resolved' && a.responseTime);
  const avgDispatch = resolvedAlerts.length > 0 
    ? Math.round(resolvedAlerts.reduce((acc, curr) => acc + (curr.responseTime || 0), 0) / resolvedAlerts.length) + 's'
    : '0s'; 

  const avgResolution = resolvedAlerts.length > 0
    ? Math.round(resolvedAlerts.reduce((acc, curr) => {
        const start = curr.timestamp?.toMillis() || 0;
        const end = curr.resolvedAt?.toMillis() || 0;
        return acc + (end - start);
      }, 0) / (resolvedAlerts.length * 60000)) + 'm'
    : '0m';

  const performanceMetrics = [
    { label: 'Avg Dispatch Time', value: avgDispatch, trend: '-14%', icon: Zap, color: 'text-amber-500' },
    { label: 'Incident Resolution', value: avgResolution, trend: '-8%', icon: Clock, color: 'text-emerald-500' },
    { label: 'High-Risk Drift', value: `${deviationCount}`, trend: deviationCount > 0 ? '+15%' : '-10%', icon: Navigation, color: deviationCount > 0 ? 'text-rose-500' : 'text-emerald-500' },
    { label: 'Justice Pipeline', value: `${justiceLedger.length}`, trend: '+12%', icon: BarChart3, color: 'text-blue-500' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {performanceMetrics.map((m, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-[#0F172A] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl group hover:border-white/10 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5", m.color.replace('text', 'bg').replace('-500', '-500/10'))}>
                <m.icon size={24} className={m.color} />
            </div>
            <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border", m.trend.startsWith('-') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
                {m.trend}
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{m.label}</p>
          <h4 className="text-3xl font-black text-white italic tracking-tighter">{m.value}</h4>
        </motion.div>
      ))}
    </div>
  );
};
