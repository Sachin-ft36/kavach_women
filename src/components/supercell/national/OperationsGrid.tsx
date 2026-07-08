import React from 'react';
import { motion } from 'motion/react';
import { Globe, Activity } from 'lucide-react';
import MapplsCommandMap from '../../maps/MapplsCommandMap';
import CommandMap from '../../maps/CommandMap';

interface OperationsGridProps {
  activeAlerts: any[];
  verifiedProtectors: any[];
  selectedAlertId: string | null;
  selectedProtectorId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  selectedState: string;
  useMapboxFallback: boolean;
  setUseMapboxFallback: (val: boolean) => void;
  incidentData: any;
  protectorsInRange: any[];
}

export const OperationsGrid = ({
  activeAlerts,
  verifiedProtectors,
  selectedAlertId,
  selectedProtectorId,
  setSelectedAlertId,
  selectedState,
  useMapboxFallback,
  setUseMapboxFallback,
  incidentData,
  protectorsInRange
}: OperationsGridProps) => {

  const selAlert = activeAlerts.find(a => a.id === selectedAlertId);
  const vPath = selAlert?.path || [];
  let pPath: any[] = [];
  if (selAlert?.footprints) {
    Object.values(selAlert.footprints).forEach((fpArr: any) => {
      if (Array.isArray(fpArr)) {
        pPath = [...pPath, ...fpArr];
      }
    });
  }

  return (
    <div className="flex-1 relative overflow-hidden">
       <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          <div className="px-2 py-1 bg-[#020617]/80 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-2">
             <Globe size={10} className="text-blue-500" />
             <span className="text-[11px] font-black text-white uppercase tracking-widest">
                {selectedAlertId ? 'Tactical Lock: Radius Active' : 'National Grid View'}
             </span>
          </div>
          
          {incidentData && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-2.5 py-1 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-xl backdrop-blur-md flex items-center gap-2 text-[#60A5FA]"
            >
              <Activity size={10} className="" />
              <span className="text-[14px] font-black uppercase tracking-widest leading-none">Rerouting Engaged: Polyline (OSRM via Mappls)</span>
            </motion.div>
          )}
       </div>
       
       <div className="absolute inset-0 z-0">
          {!useMapboxFallback ? (
            <MapplsCommandMap 
               activeAlerts={activeAlerts} 
               activeProtectors={verifiedProtectors} 
               selectedAlertId={selectedAlertId}
               selectedProtectorId={selectedProtectorId}
               onAlertClick={(id) => setSelectedAlertId(id)}
               selectedState={selectedState}
               victimPath={vPath}
               protectorPath={pPath}
               onFallback={() => setUseMapboxFallback(true)}
            />
          ) : (
            <CommandMap 
               activeAlerts={activeAlerts} 
               activeProtectors={verifiedProtectors} 
               selectedAlertId={selectedAlertId}
               selectedProtectorId={selectedProtectorId}
               onAlertClick={(id) => setSelectedAlertId(id)}
               selectedState={selectedState}
               victimPath={vPath}
               protectorPath={pPath}
            />
          )}
       </div>

       {/* Map Overlay Stats */}
       <div className="absolute bottom-8 right-8 z-10 flex gap-4">
          {selectedAlertId && (
             <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-rose-600/90 backdrop-blur-md border border-rose-400/20 p-4 rounded-3xl"
             >
                <p className="text-[11px] text-rose-100 font-black uppercase tracking-widest mb-1">Forces in Radius</p>
                <p className="text-xl font-black text-white italic tabular-nums">{protectorsInRange.length}</p>
             </motion.div>
          )}
          <div className="bg-[#020617]/80 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
             <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest mb-1">Response Radius</p>
             <p className="text-xl font-black text-white italic tabular-nums">2.0 KM</p>
          </div>
       </div>
    </div>
  );
};
