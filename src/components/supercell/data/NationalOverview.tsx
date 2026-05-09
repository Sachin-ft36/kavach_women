import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, Activity, Globe, Shield, 
  TrendingUp, AlertTriangle, 
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NationalOverviewProps {
  activeAlerts: any[];
  verifiedProtectors: any[];
  pendingProtectors: any[];
  zeroFirs: any[];
  selectedState: string;
}

export function NationalOverview({ 
  activeAlerts, 
  verifiedProtectors, 
  pendingProtectors, 
  zeroFirs,
  selectedState 
}: NationalOverviewProps) {
  
  const stats = [
    { label: 'Total SOS Incidents', value: activeAlerts.length, icon: Activity, color: 'text-red-500', trend: '+12%', sub: 'Active Emergencies' },
    { label: 'Verified Protectors', value: verifiedProtectors.length, icon: Shield, color: 'text-blue-500', trend: '+5%', sub: 'On-Duty Nodes' },
    { label: 'Pending Recruits', value: pendingProtectors.length, icon: Globe, color: 'text-orange-500', trend: '-2%', sub: 'Awaiting Vetting' },
    { label: 'Justice FIRs', value: zeroFirs.length, icon: BarChart2, color: 'text-gray-900', trend: '+8%', sub: 'Legal Transcripts' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar p-4">
      {/* 📊 CORE METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", stat.color.replace('text', 'bg').replace('-500', '-500/10'))}>
                     <stat.icon size={24} className={stat.color} />
                  </div>
                  <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black", stat.trend.startsWith('+') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                     {stat.trend.startsWith('+') ? <TrendingUp size={10} /> : <AlertTriangle size={10} />}
                     {stat.trend}
                  </div>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
               <h3 className="text-3xl font-black text-[#0F172A] tabular-nums">{stat.value}</h3>
               <p className="text-[8px] text-gray-400 font-bold uppercase mt-2">{stat.sub}</p>
            </motion.div>
         ))}
      </div>

      {/* 🏢 STATE ACTIVITY MATRIX */}
      <div className="pb-10">
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#0F172A]">Regional Response Analysis</h3>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Real-time Cross-Sector Performance Metrics</p>
               </div>
               <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-all"><ArrowUpRight size={16}/></button>
            </div>
            
            <div className="space-y-4">
               {(() => {
                  const majorStates = ['Madhya Pradesh', 'Delhi', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Uttar Pradesh', 'Gujarat'];
                  
                  return majorStates.map((stateName, i) => {
                     const stateAlerts = activeAlerts.filter(a => a.state === stateName || a.location?.state === stateName);
                     const stateNodes = verifiedProtectors.filter(p => p.state === stateName || p.location?.state === stateName);
                     const calculatedLoad = Math.min(Math.round(((stateAlerts.length * 20) + (stateNodes.length * 2)) || (Math.random() * 5 + 2)), 98);
                     const colors = ['bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500'];
                     
                     return (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className="text-gray-600">{stateName}</span>
                              <div className="flex items-center gap-3">
                                 <span className="text-[7px] text-gray-400">{stateAlerts.length} SOS // {stateNodes.length} Nodes</span>
                                 <span className="text-gray-900">{calculatedLoad}% Load</span>
                              </div>
                           </div>
                           <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${calculatedLoad}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={cn("h-full rounded-full opacity-80", colors[i % colors.length])} 
                              />
                           </div>
                        </div>
                     );
                  });
               })()}
            </div>
         </div>
      </div>
    </div>
  );
}
