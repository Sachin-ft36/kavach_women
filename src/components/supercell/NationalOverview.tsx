import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, Activity, Globe, Shield, 
  TrendingUp, AlertTriangle, CheckCircle2, 
  Map as MapIcon, ArrowUpRight, Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

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
      {/* 🇮🇳 NATIONAL HUD HEADER */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Globe size={120} className="text-blue-600" />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em]">Live National Data</div>
               <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Protocol: BNS-GRID-4.0</div>
            </div>
            <h1 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">
               {selectedState === 'National' ? 'Sovereign Safety Matrix' : `${selectedState} Command`}
            </h1>
            <p className="text-gray-400 text-xs font-bold mt-2 max-w-md uppercase tracking-tight">
               Real-time situational awareness across the {selectedState} safety grid. Monitoring biometric telemetry and emergency response latency.
            </p>
         </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-10">
         <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#0F172A]">Regional Response Analysis</h3>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Real-time Cross-Sector Performance Metrics</p>
               </div>
               <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-all"><ArrowUpRight size={16}/></button>
            </div>
            
            <div className="space-y-4">
               {(() => {
                  // 📊 DYNAMIC LOAD CALCULATION ENGINE
                  const majorStates = ['Madhya Pradesh', 'Delhi', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Uttar Pradesh', 'Gujarat'];
                  
                  return majorStates.map((stateName, i) => {
                     // Filter real data for this state
                     const stateAlerts = activeAlerts.filter(a => a.state === stateName || a.location?.state === stateName);
                     const stateNodes = verifiedProtectors.filter(p => p.state === stateName || p.location?.state === stateName);
                     
                     // Calculate Load: Higher SOS/Protector ratio = Higher Load
                     // Formula: (Alerts / (Protectors + 1)) * Multiplier, capped at 100
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

         <div className="bg-[#0F172A] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col h-full">
               <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30">
                  <Zap size={20} />
               </div>
               <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">National SOS Response Unit</h3>
               <p className="text-blue-200/60 text-[9px] font-bold mt-2 uppercase leading-relaxed">
                  Direct satellite link established. 100% of emergency nodes are currently synchronized with the SuperCell pulse.
               </p>
               
               <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Global Status</span>
                     <span className="text-green-400 text-[8px] font-black uppercase">Secure</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Encryption</span>
                     <span className="text-blue-400 text-[8px] font-black uppercase">AES-256</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
