import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Heart, Shield, Bell, Gavel, 
  BookOpen, ChevronRight, LayoutGrid, BarChart2,
  Activity, MapPin, Zap, Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

// Sub-components
import { KavachDirectory } from './KavachDirectory';
import { WomenSafetyOPS } from './WomenSafetyOPS';
import { JusticeLedger } from './JusticeLedger';
import { NationalOverview } from './NationalOverview';

interface StateNexusCommandProps {
  selectedState: string;
  womenUsers: any[];
  verifiedProtectors: any[];
  pendingProtectors: any[];
  activeAlerts: any[];
  zeroFirs: any[];
  onAlertClick: (id: string) => void;
  onViewFir: (fir: any) => void;
  isSovereignActive?: boolean;
  userStatusMap?: Record<string, any>;
}

export function StateNexusCommand({
  selectedState,
  womenUsers,
  verifiedProtectors,
  pendingProtectors,
  activeAlerts,
  zeroFirs,
  onAlertClick,
  onViewFir,
  isSovereignActive,
  userStatusMap
}: StateNexusCommandProps) {
  
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'WOMEN' | 'PROTECTORS' | 'SOS' | 'FIR' | 'GUIDES'>('OVERVIEW');
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

  const handleHardwareTrigger = async (id: string, label: string) => {
    if (!activeTargetId) return;
    
    if (!isSovereignActive) {
      toast.error("AUTHORIZATION DENIED", {
        description: "Sovereign Override must be active for hardware intervention."
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'alerts', activeTargetId), {
        remoteCommand: id,
        commandTimestamp: new Date(),
        commandLabel: label,
        commandStatus: 'pending'
      });
      toast.success(`${label.toUpperCase()} INITIATED`, {
        description: `Signal broadcasted to node ${activeTargetId.slice(0, 8)}`,
        duration: 3000
      });
    } catch (error) {
      toast.error("HARDWARE LINK FAILURE", {
        description: "Protocol override rejected by regional node."
      });
    }
  };

  const sections = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'WOMEN', label: 'Women Safety', icon: Heart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'PROTECTORS', label: 'Protectors', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'SOS', label: 'Live SOS', icon: Bell, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'FIR', label: 'FIR Reports', icon: Gavel, color: 'text-gray-600', bg: 'bg-gray-100' },
    { id: 'REMOTE', label: 'Remote Control', icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
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
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
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
               <KavachDirectory womenUsers={womenUsers} protectors={verifiedProtectors} selectedState={selectedState} activeAlerts={activeAlerts} />
            </motion.div>
          )}

          {activeSection === 'PROTECTORS' && (
            <motion.div key="protectors" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full flex flex-col">
               <KavachDirectory womenUsers={womenUsers} protectors={verifiedProtectors} selectedState={selectedState} activeAlerts={activeAlerts} />
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
               <JusticeLedger zeroFirs={zeroFirs} viewMode="JUSTICE" onViewFir={onViewFir} userStatusMap={userStatusMap} />
            </motion.div>
          )}

          {activeSection === 'REMOTE' && (
            <motion.div key="remote" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full flex flex-col gap-6 p-8 overflow-y-auto custom-scrollbar">
               <div className="bg-[#0F172A] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group shrink-0">
                  <div className="absolute top-0 right-0 p-12 opacity-5"><Zap size={200} className="text-rose-500" /></div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-[4px]">Tactical Hardware Link</div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Protocol: KAVACH-NATIVE-V2</span>
                        </div>
                     </div>
                     <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Remote Command Interface</h2>
                     <p className="text-gray-400 text-sm font-bold mt-4 max-w-2xl uppercase tracking-tight leading-relaxed">
                        Direct hardware-level orchestration for all active nodes in the {selectedState} sector. Authorization required for destructive overrides.
                     </p>
                  </div>
               </div>

               {/* 🎯 TARGET SELECTION GRID */}
               <div className="shrink-0">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                     <MapPin size={14} className="text-rose-500" />
                     Live Target Selection ({activeAlerts.length})
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
                     {activeAlerts.length === 0 ? (
                        <div className="w-full py-12 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center opacity-40">
                           <Activity size={30} className="mb-4 text-gray-400" />
                           <p className="text-[8px] font-black uppercase tracking-widest">No Active Field Targets</p>
                        </div>
                     ) : activeAlerts.map(alert => {
                        const isSelected = activeTargetId === alert.id;
                        return (
                           <button 
                             key={alert.id}
                             onClick={() => setActiveTargetId(alert.id)}
                             className={cn(
                               "min-w-[240px] p-6 rounded-[2.5rem] border transition-all text-left group relative overflow-hidden",
                               isSelected 
                                 ? "bg-rose-600 border-rose-600 shadow-xl shadow-rose-600/20 text-white" 
                                 : "bg-white border-gray-100 hover:border-rose-200 text-gray-900 shadow-sm"
                             )}
                           >
                              <div className="flex items-center justify-between mb-4">
                                 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", isSelected ? "bg-white/20 border-white/20" : "bg-rose-50 border-rose-100 text-rose-600")}>
                                    <Heart size={14} />
                                 </div>
                                 <div className={cn("px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest", isSelected ? "bg-white/20" : "bg-rose-100 text-rose-600")}>
                                    {alert.status || 'SOS'}
                                 </div>
                              </div>
                              <h4 className="text-[11px] font-black uppercase truncate leading-none">
                                {womenUsers.find(u => u.id === (alert.victimUid || alert.userId))?.name || alert.victimName || 'Citizen'}
                              </h4>
                              <p className={cn("text-[7px] font-bold uppercase mt-2 tracking-widest", isSelected ? "text-white/60" : "text-gray-400")}>
                                 {alert.location?.city || 'Vector Unknown'} // {alert.batteryLevel}% PWR
                              </p>
                              {isSelected && <motion.div layoutId="targetGlow" className="absolute inset-0 bg-white/5 pointer-events-none" />}
                           </button>
                        );
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                  {[
                    { id: 'siren', label: 'Remote Siren', icon: Bell, color: 'bg-rose-500', desc: 'Trigger 110dB SOS Siren' },
                    { id: 'forensic', label: 'Forensic Capture', icon: Shield, color: 'bg-blue-600', desc: 'Remote A/V Stream' },
                    { id: 'biometric', label: 'Biometric Pulse', icon: Activity, color: 'bg-emerald-600', desc: 'Live Vital Snapshot' },
                    { id: 'lockdown', label: 'Tactical Lockout', icon: Zap, color: 'bg-gray-900', desc: 'Emergency App Disable' }
                  ].map((cmd) => (
                    <button 
                      key={cmd.id}
                      disabled={!activeTargetId}
                      onClick={() => handleHardwareTrigger(cmd.id, cmd.label)}
                      className={cn(
                        "bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm transition-all group flex flex-col items-center text-center relative overflow-hidden disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed",
                        activeTargetId && "hover:shadow-xl hover:border-rose-200 active:scale-95"
                      )}
                    >
                       <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl transition-transform", cmd.color, activeTargetId && "group-hover:scale-110")}>
                          <cmd.icon size={30} />
                       </div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">{cmd.label}</h3>
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cmd.desc}</p>
                       <div className="mt-8 w-full h-[1px] bg-gray-50" />
                       <div className="mt-4 flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", activeTargetId ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                          <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{activeTargetId ? 'Link Ready' : 'Awaiting Target'}</span>
                       </div>
                    </button>
                  ))}
               </div>

               <div className="flex-1 min-h-[300px] bg-[#020617] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden flex flex-col justify-center items-center text-center">
                  <div className="absolute inset-0 bg-rose-600/5 blur-3xl" />
                  <div className="relative z-10 max-w-md">
                     <div className="w-20 h-20 bg-rose-600/10 rounded-[32px] border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-2xl">
                        <Cpu size={40} className="animate-pulse" />
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Authorized Control Status</h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[9px] font-black text-gray-500 uppercase">Socket Latency</span>
                           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">14ms // Secure</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[9px] font-black text-gray-500 uppercase">Encryption</span>
                           <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">AES-256-GCM</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[9px] font-black text-gray-500 uppercase">Selected Target</span>
                           <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                             {activeTargetId ? (
                               womenUsers.find(u => u.id === activeAlerts.find(a => a.id === activeTargetId)?.victimUid)?.name || 
                               activeAlerts.find(a => a.id === activeTargetId)?.victimName?.toUpperCase() || 
                               'ACTIVE TARGET'
                             ) : 'NONE'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
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
