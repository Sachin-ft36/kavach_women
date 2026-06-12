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
import { JusticeLedger } from './JusticeLedger';
import { NationalOverview } from './NationalOverview';
import { RemoteControlSection } from './components/RemoteControlSection';
import { GuideCenterSection } from './components/GuideCenterSection';
import { SOSCenterSection } from './components/SOSCenterSection';

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
  
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'WOMEN' | 'PROTECTORS' | 'SOS' | 'FIR' | 'REMOTE' | 'GUIDES'>('OVERVIEW');
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
            <motion.div key="sos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
               <SOSCenterSection />
            </motion.div>
          )}

          {activeSection === 'FIR' && (
            <motion.div key="fir" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col">
               <JusticeLedger zeroFirs={zeroFirs} viewMode="JUSTICE" onViewFir={onViewFir} userStatusMap={userStatusMap} />
            </motion.div>
          )}

          {activeSection === 'REMOTE' && (
            <motion.div key="remote" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full">
               <RemoteControlSection 
                 selectedState={selectedState}
                 activeAlerts={activeAlerts}
                 womenUsers={womenUsers}
                 activeTargetId={activeTargetId}
                 setActiveTargetId={setActiveTargetId}
                 handleHardwareTrigger={handleHardwareTrigger}
               />
            </motion.div>
          )}

          {activeSection === 'GUIDES' && (
            <motion.div key="guides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
               <GuideCenterSection selectedState={selectedState} />
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
