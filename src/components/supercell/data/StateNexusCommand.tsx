import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Shield, Bell, Gavel, 
  BookOpen, LayoutGrid, BarChart2, Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// Sub-components (Moving to Data folder)
import { KavachDirectory } from './KavachDirectory';
import { DataJusticeLedger } from './DataJusticeLedger';
import { NationalOverview } from './NationalOverview';

// External Operational components
import { WomenSafetyOPS } from '../WomenSafetyOPS';

interface StateNexusCommandProps {
  selectedState: string;
  womenUsers: any[];
  verifiedProtectors: any[];
  pendingProtectors: any[];
  activeAlerts: any[];
  zeroFirs: any[];
  onAlertClick: (id: string) => void;
  onViewFir: (fir: any) => void;
}

export function StateNexusCommand({
  selectedState,
  womenUsers,
  verifiedProtectors,
  pendingProtectors,
  activeAlerts,
  zeroFirs,
  onAlertClick,
  onViewFir
}: StateNexusCommandProps) {
  
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'WOMEN' | 'PROTECTORS' | 'SOS' | 'FIR' | 'GUIDES'>('OVERVIEW');

  const sections = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'WOMEN', label: 'Women Safety', icon: Heart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'PROTECTORS', label: 'Protectors', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'SOS', label: 'Live SOS', icon: Bell, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'FIR', label: 'FIR Reports', icon: Gavel, color: 'text-gray-600', bg: 'bg-gray-100' },
    { id: 'GUIDES', label: 'Guide Center', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
      {/* 🏛️ INTERNAL SECTION NAVIGATOR */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-xl">
               <BarChart2 size={18} />
            </div>
            <div>
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F172A] leading-none">Command Hub</h2>
               <p className="text-[6px] text-gray-400 font-bold uppercase tracking-widest mt-1">{selectedState} Operational Nexus</p>
            </div>
         </div>

         <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeSection === section.id 
                    ? "bg-white text-gray-900 shadow-sm border border-gray-100" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <section.icon size={12} className={activeSection === section.id ? section.color : "text-gray-400"} />
                {section.label}
              </button>
            ))}
         </div>

         <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-100">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full " />
               <span className="text-[8px] font-black uppercase tracking-widest">Grid Link Active</span>
            </div>
         </div>
      </div>

      {/* 🚀 DYNAMIC CONTENT STACK */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
        <AnimatePresence mode="wait">
          {activeSection === 'OVERVIEW' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
              <NationalOverview 
                activeAlerts={activeAlerts} 
                verifiedProtectors={verifiedProtectors} 
                pendingProtectors={pendingProtectors} 
                zeroFirs={zeroFirs} 
                selectedState={selectedState} 
              />
            </motion.div>
          )}

          {activeSection === 'WOMEN' && (
            <motion.div key="women" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full flex flex-col">
               <KavachDirectory womenUsers={womenUsers} protectors={verifiedProtectors} selectedState={selectedState} defaultTab="WOMEN" />
            </motion.div>
          )}

          {activeSection === 'PROTECTORS' && (
            <motion.div key="protectors" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full flex flex-col">
               <KavachDirectory womenUsers={womenUsers} protectors={verifiedProtectors} selectedState={selectedState} defaultTab="PROTECTORS" />
            </motion.div>
          )}

          {activeSection === 'SOS' && (
            <motion.div key="sos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full grid grid-cols-12 gap-4">
               <div className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden">
                  <div className="bg-red-50/50 border border-red-100 rounded-[2.5rem] p-6 mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/20">
                           <Bell size={20} />
                        </div>
                        <div>
                           <h3 className="text-sm font-black uppercase text-red-600">Critical Response Unit</h3>
                           <p className="text-[8px] text-red-400 font-bold uppercase mt-1">Direct State Emergency Dispatch</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden">
                     <WomenSafetyOPS activeAlerts={activeAlerts} onAlertClick={onAlertClick} viewMode="ALL" />
                  </div>
               </div>
               <div className="col-span-12 lg:col-span-4 space-y-4">
                  <div className="bg-[#0F172A] rounded-[2rem] p-6 text-white h-full relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={80}/></div>
                     <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-4">SOS Protocols</h4>
                     <div className="space-y-4">
                        {[
                          "Priority 1: Life Threat Detection",
                          "Priority 2: Protector Dispatch",
                          "Priority 3: Police Linkage",
                          "Priority 4: Legal Forensic Log"
                        ].map((p, i) => (
                           <div key={i} className="flex items-center gap-3 group">
                              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">{i+1}</div>
                              <span className="text-[8px] font-bold uppercase text-white/60">{p}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeSection === 'FIR' && (
            <motion.div key="fir" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col">
               {/* 🚀 DATA FOLDER VERSION USES THE AGGREGATED LEDGER */}
               <DataJusticeLedger zeroFirs={zeroFirs} onViewFir={onViewFir} />
            </motion.div>
          )}

          {activeSection === 'GUIDES' && (
            <motion.div key="guides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-8 bg-white border border-gray-100 rounded-[2.5rem] overflow-y-auto custom-scrollbar">
               <div className="max-w-4xl mx-auto space-y-12">
                  <div className="text-center">
                     <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-600/5 border border-amber-100">
                        <BookOpen size={32} />
                     </div>
                     <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">National Guide Center</h2>
                     <p className="text-xs text-gray-400 font-bold uppercase mt-2">Operational Guidelines for the {selectedState} Sector</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-purple-600 tracking-[0.2em] flex items-center gap-2">
                           <Heart size={14} className="fill-purple-600" />
                           For Women Safety
                        </h3>
                        <div className="bg-purple-50/30 border border-purple-100 rounded-3xl p-6 space-y-6">
                           {[
                             { t: "Emergency Trigger", d: "Instantly press the SOS button to alert all nearby protectors and SuperCell." },
                             { t: "Guardian Link", d: "Ensure at least 2 guardians are linked for secondary alert redundancy." },
                             { t: "Safe Passage", d: "Use the tactical radar to navigate through verified safe corridors." }
                           ].map((g, i) => (
                             <div key={i} className="flex gap-4">
                                <div className="text-purple-300 font-black text-xl leading-none">0{i+1}</div>
                                <div>
                                   <p className="text-[9px] font-black uppercase text-purple-900 mb-1">{g.t}</p>
                                   <p className="text-[8px] font-bold text-purple-900/40 leading-relaxed uppercase">{g.d}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] flex items-center gap-2">
                           <Shield size={14} className="fill-blue-600" />
                           For Protectors
                        </h3>
                        <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-6 space-y-6">
                           {[
                             { t: "Rapid Response", d: "Acknowledge alerts within 30 seconds of broadcast for maximum efficiency." },
                             { t: "On-Site Protocols", d: "Maintain absolute respect and provide tactical support until police arrival." },
                             { t: "Node Maintenance", d: "Keep background permissions active for high-fidelity geospace tracking." }
                           ].map((g, i) => (
                             <div key={i} className="flex gap-4">
                                <div className="text-blue-300 font-black text-xl leading-none">0{i+1}</div>
                                <div>
                                   <p className="text-[9px] font-black uppercase text-blue-900 mb-1">{g.t}</p>
                                   <p className="text-[8px] font-bold text-blue-900/40 leading-relaxed uppercase">{g.d}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 📊 NEXUS FOOTER */}
      <div className="px-6 py-3 bg-gray-900 flex items-center justify-between border-t border-white/5">
         <div className="flex gap-8">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Active State: {selectedState}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Population Indexing Active</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-[2px]">Supercell Command Interface v4.0.2</span>
         </div>
      </div>
    </div>
  );
}
