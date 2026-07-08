import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { IncidentRecord, UserProfile } from '../../state/slices/types';

import { SOSHistoryPanel } from './panels/SOSHistoryPanel';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { SOSQueueSidebar } from './sos/SOSQueueSidebar';
import { SOSLiveView } from './sos/SOSLiveView';
import { SOSAuditPanel } from './sos/SOSAuditPanel';

import { useSOSLiveSync } from './hooks/useSOSLiveSync';
import { useSOSHistorySync } from './hooks/useSOSHistorySync';
import { useSOSTacticalActions } from './hooks/useSOSTacticalActions';

// 🏛️ UHD Strategic Map
import CommandMap from '../maps/CommandMap';
import MapplsCommandMap from '../maps/MapplsCommandMap';

const WARNING_REASONS = [
  "Accidental SOS trigger without emergency.",
  "Testing the SOS system without authorization.",
  "Intentional false alarm reporting.",
  "Misuse of the grid for non-emergency communication.",
  "Inappropriate or prank SOS activation.",
  "Other (Type custom message below)"
];

export function SOSManagement({ 
  externalSelectedId, 
  verifiedProtectors = [], 
  activeAlerts = [], 
  historicalAlerts = [], 
  userStatusMap = {},
  onViewReplay
}: { 
  externalSelectedId?: string | null, 
  verifiedProtectors?: UserProfile[],
  activeAlerts?: IncidentRecord[],
  historicalAlerts?: IncidentRecord[],
  userStatusMap?: Record<string, UserProfile>,
  onViewReplay?: (alertId: string) => void
}) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  
  const [evidenceVaultAlertId, setEvidenceVaultAlertId] = useState<string | null>(null);
  const [isEvidenceViewerOpen, setIsEvidenceViewerOpen] = useState(false);

  // 📡 SYNC EXTERNAL SELECTION
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedAlertId(externalSelectedId);
      setSidebarTab('LIVE');
    }
  }, [externalSelectedId]);

  const {
    resolvedAddress,
    loadingAddress,
    nearbyPolice,
    nearbyHospitals,
    loadingNodes,
    guardians
  } = useSOSLiveSync(selectedAlertId, selectedVictimId, sidebarTab, activeAlerts, historicalAlerts);

  const {
    filteredAlerts,
    selectedAlert,
    victimHistory,
    victimData,
    pendingAppeal,
    victimId
  } = useSOSHistorySync(historicalAlerts, activeAlerts, userStatusMap, sidebarTab, selectedAlertId, selectedVictimId, searchTerm);

  const {
    isWarnModalOpen,
    setIsWarnModalOpen,
    isOverrideModalOpen,
    setIsOverrideModalOpen,
    handleAction,
    triggerSovereignOverride,
    handleRestoreAccess,
    handlePermanentBan
  } = useSOSTacticalActions(victimData, victimId, pendingAppeal, selectedAlert);


  return (
    <div className="h-full w-full bg-[#0F172A] flex overflow-hidden font-['Outfit'] italic">
      {/* 📟 ASIDE QUEUE */}
      <SOSQueueSidebar
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredAlerts={filteredAlerts}
        selectedAlertId={selectedAlertId}
        setSelectedAlertId={setSelectedAlertId}
        selectedVictimId={selectedVictimId}
        setSelectedVictimId={setSelectedVictimId}
        userStatusMap={userStatusMap}
      />

      {/* 🔍 MAIN CONTENT */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[#0F172A]">
         {(selectedAlert || (sidebarTab === 'HISTORY' && selectedVictimId)) ? (
            selectedAlertId && selectedAlert ? (
               <SOSLiveView
                 selectedAlert={selectedAlert}
                 selectedAlertId={selectedAlertId}
                 victimData={victimData}
                 sidebarTab={sidebarTab}
                 setSelectedAlertId={setSelectedAlertId}
                 handleAction={handleAction}
                 setIsOverrideModalOpen={setIsOverrideModalOpen}
                 pendingAppeal={pendingAppeal}
                 handleRestoreAccess={handleRestoreAccess}
                 handlePermanentBan={handlePermanentBan}
                 loadingAddress={loadingAddress}
                 resolvedAddress={resolvedAddress}
                 guardians={guardians}
                 nearbyPolice={nearbyPolice}
                 nearbyHospitals={nearbyHospitals}
                 loadingNodes={loadingNodes}
                 setIsEvidenceViewerOpen={setIsEvidenceViewerOpen}
                 useMapboxFallback={useMapboxFallback}
                 setUseMapboxFallback={setUseMapboxFallback}
                 verifiedProtectors={verifiedProtectors}
               />
            ) : (
                <SOSHistoryPanel victimData={victimData} victimHistory={victimHistory} guardians={guardians} pendingAppeal={pendingAppeal} onViewReplay={onViewReplay} handleAction={handleAction} handleRestoreAccess={handleRestoreAccess} handlePermanentBan={handlePermanentBan} onOpenEvidence={setEvidenceVaultAlertId} setSelectedAlertId={setSelectedAlertId} />
            )
         ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><ShieldAlert size={120} strokeWidth={0.5} className="mb-8" /><p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p></div>
          )}
      </main>

      <SOSAuditPanel 
        isOpen={isWarnModalOpen} 
        onClose={() => setIsWarnModalOpen(false)} 
        victimData={victimData} 
        pendingAppeal={pendingAppeal} 
      />

        {(selectedAlert || evidenceVaultAlertId) && (
          <EvidenceViewerModal 
            alertId={evidenceVaultAlertId || selectedAlert?.id || ''} 
            isOpen={isEvidenceViewerOpen || !!evidenceVaultAlertId} 
            onClose={() => {
              setIsEvidenceViewerOpen(false);
              setEvidenceVaultAlertId(null);
            }} 
          />
        )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default SOSManagement;

