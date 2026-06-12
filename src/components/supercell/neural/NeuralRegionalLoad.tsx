import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

interface Props {
  activeAlerts: any[];
  activeJourneys: any[];
  verifiedProtectors: any[];
  justiceLedger: any[];
  selectedState: string;
  detectedAdminDistrict: string | null;
}

const STATE_DISTRICTS_MAP: Record<string, string[]> = {
  'Madhya Pradesh': ['Bhopal District', 'Indore Sector', 'Rewa Precinct', 'Jabalpur Beat', 'Gwalior Sector'],
  'Delhi': ['New Delhi Beat', 'South Delhi Beat', 'Noida-NCR Border', 'Gurugram Sector', 'West Delhi Zone'],
  'Delhi NCR': ['New Delhi Beat', 'South Delhi Beat', 'Noida-NCR Border', 'Gurugram Sector', 'West Delhi Zone'],
  'Uttar Pradesh': ['Noida Sector 62', 'Lucknow District', 'Kanpur Beat', 'Ghaziabad Sector', 'Varanasi Zone'],
  'Maharashtra': ['Mumbai Metro', 'Pune Beat', 'Nagpur Sector', 'Thane District', 'Nashik Zone'],
  'Rajasthan': ['Jaipur Zone', 'Jodhpur Beat', 'Udaipur Sector', 'Kota District', 'Ajmer Zone'],
  'Karnataka': ['Bengaluru East', 'Bengaluru South', 'Mysuru Sector', 'Mangaluru Beat', 'Hubballi Zone'],
  'ALL': ['Madhya Pradesh', 'Delhi NCR', 'Maharashtra', 'Karnataka', 'Rajasthan']
};

const DISTRICT_BEATS = ['Sector Alpha Beat', 'Sector Beta Beat', 'Central Bypass Zone', 'Precision Beat Area', 'Highway Intercept Grid'];

export const NeuralRegionalLoad: React.FC<Props> = ({
  activeAlerts, activeJourneys, verifiedProtectors, justiceLedger, selectedState, detectedAdminDistrict
}) => {
  const isDistrictTier = !!detectedAdminDistrict;
  const isStateTier = !isDistrictTier && selectedState !== 'ALL';
  
  const dynamicSectors = useMemo(() => {
    const sectorsSet = new Set<string>();
    
    const scanItem = (item: any) => {
      if (!item) return;
      
      const itemState = (item.state || '').trim();
      const itemCity = item.city || item.location?.city || item.incidentLocation?.city || item.zone || '';
      
      if (selectedState === 'ALL') {
        if (itemState && itemState.length > 2 && !itemState.toLowerCase().includes('sector') && !itemState.toLowerCase().includes('beat')) {
          sectorsSet.add(itemState.replace(/\b\w/g, c => c.toUpperCase()));
        }
      } else {
        const selectedStateName = selectedState.toLowerCase().trim();
        if (itemState.toLowerCase().includes(selectedStateName)) {
          if (itemCity && typeof itemCity === 'string' && itemCity.length > 2 && !itemCity.includes('Sector') && !itemCity.includes('Beat')) {
            sectorsSet.add(itemCity.split(',')[0].trim().replace(/\b\w/g, c => c.toUpperCase()));
          }
        }
      }
    };
    
    activeAlerts.forEach(scanItem);
    activeJourneys.forEach(scanItem);
    verifiedProtectors.forEach(scanItem);
    justiceLedger.forEach(scanItem);
    
    if (sectorsSet.size === 0) {
      if (selectedState === 'ALL') {
        return ['Madhya Pradesh', 'Delhi NCR', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan', 'West Bengal'];
      } else {
        const fallbacks = STATE_DISTRICTS_MAP[selectedState] || STATE_DISTRICTS_MAP['ALL'];
        fallbacks.forEach(f => sectorsSet.add(f.replace(' District', '').replace(' Sector', '').replace(' Precinct', '').replace(' Beat', '').replace(' Zone', '')));
      }
    }
    
    return Array.from(sectorsSet);
  }, [activeAlerts, activeJourneys, verifiedProtectors, justiceLedger, selectedState]);

  const sectorTitle = isDistrictTier 
    ? `${detectedAdminDistrict.toUpperCase()} BEAT JURISDICTION INDEX` 
    : isStateTier 
      ? `${selectedState.toUpperCase()} REGIONAL DISTRICT SECTOR STACK` 
      : 'NATIONAL SUPERCELL CORE: SYSTEM-WIDE STATE LOAD INDEX';

  const sectors = isDistrictTier ? DISTRICT_BEATS : dynamicSectors;

  const regionalData = sectors.map((sectorName, i) => {
    const cleanName = sectorName.toLowerCase().trim();
    
    const matchedAlerts = activeAlerts.filter(a => {
      const fullAddr = (a.address || a.locationName || a.city || a.state || '').toLowerCase();
      return isDistrictTier 
        ? (i === 0 ? true : fullAddr.includes(cleanName.split(' ')[0]))
        : fullAddr.includes(cleanName);
    });
    
    const matchedProtectors = verifiedProtectors.filter(p => {
      const fullAddr = (p.protectorVetting?.address || p.address || p.state || '').toLowerCase();
      return isDistrictTier 
        ? (i === 0 ? true : fullAddr.includes(cleanName.split(' ')[0]))
        : fullAddr.includes(cleanName);
    });

    const activeSOS = matchedAlerts.length;
    const availableNodes = matchedProtectors.length;

    const rawLoad = availableNodes === 0 
      ? (activeSOS > 0 ? 100 : 0) 
      : Math.round((activeSOS / (availableNodes * 0.8)) * 100);
    
    const simulatedBase = (i * 7 + 12) % 35;
    const load = Math.min(100, Math.max(0, activeSOS > 0 ? rawLoad : simulatedBase));
    
    return {
      state: sectorName,
      load: load, 
      status: load > 80 ? 'Critical' : load > 50 ? 'Alert' : (availableNodes > 0 || activeSOS > 0 ? 'Optimal' : 'Standby'),
      protectors: Math.max(12 - i * 2, availableNodes),
      sos: activeSOS
    };
  });

  if (isDistrictTier) return null;

  return (
    <div className="lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
      <h3 className="text-sm font-black uppercase tracking-[6px] text-blue-400 italic mb-10">{sectorTitle}</h3>
      <div className="space-y-8">
        {regionalData.map((data, i) => (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white text-[10px] font-black italic">{i + 1}</div>
                <div>
                  <h5 className="text-[11px] font-black text-white uppercase tracking-widest">{data.state}</h5>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Status: <span className={cn(data.load > 80 ? "text-rose-500" : "text-emerald-500")}>{data.status}</span></p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white italic tracking-tighter leading-none">{data.load}%</div>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-2 tracking-widest">{data.protectors} Nodes // {data.sos} Active SOS</p>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full border border-white/5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.load}%` }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
                className={cn("h-full rounded-full shadow-lg", data.load > 80 ? "bg-rose-600 shadow-rose-600/40" : "bg-blue-600 shadow-blue-600/40")} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
