import React from 'react';
import { NationalOverview } from './NationalOverview';
import { VettingDesk } from './VettingDesk';
import { WomenSafetyOPS } from './WomenSafetyOPS';
import { TacticalComms } from './TacticalComms';
import { KavachDirectory } from './KavachDirectory';
import { TransitIntelligence } from './TransitIntelligence';
import { JusticeBlockModal } from './JusticeBlockModal';
import { JusticeLedger } from './JusticeLedger';
import { ProtectorManagement } from './ProtectorManagement';
import { SOSManagement } from './SOSManagement';
import { ProtectorReportsLedger } from './ProtectorReportsLedger';
import { ShiftLogs } from './ShiftLogs';
import { NodesControl } from './NodesControl';
import { NeuralAnalytics } from './NeuralAnalytics';
import { BanAppeals } from './BanAppeals';
import KavachMap from '../maps/KavachMap';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

export function SuperCellRouter({
  viewMode,
  activeTab,
  filteredActiveAlerts,
  filteredVerifiedProtectors,
  filteredPendingProtectors,
  filteredActiveFirs,
  selectedState,
  isSovereignActive,
  onTabChange,
  setSelectedVettingUserId,
  setSelectedAlertId,
  setSelectedProtectorId,
  handleApproveProtector,
  userStatusMap,
  missionHistory,
  activeJourneys,
  selectedAlertId,
  verifiedProtectors,
  activeFirs,
  pendingProtectors,
  selectedVettingUserId,
  showHeatmap,
  useMapboxFallback
}: any) {
  
  switch (viewMode) {
    case 'COMMAND':
      return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'DASHBOARD' && (
            <NationalOverview
              activeAlerts={filteredActiveAlerts}
              verifiedProtectors={filteredVerifiedProtectors}
              pendingProtectors={filteredPendingProtectors}
              zeroFirs={filteredActiveFirs}
              selectedState={selectedState}
              isSovereignActive={isSovereignActive}
              onNavigate={(tab, alertId) => {
                if (tab === 'VERIFICATION') {
                  if (alertId) setSelectedVettingUserId(alertId);
                } else {
                  if (alertId) setSelectedAlertId(alertId);
                }
                const viewMap: Record<string, string> = {
                  'ALERTS': 'SOS',
                  'SAFETY': 'SOS',
                  'REPORTS': 'DATA',
                  'FIR': 'FIR',
                  'PROTECTORS': 'PROTECTORS'
                };
                const targetTab = viewMap[tab] || tab;
                if (targetTab === 'PROTECTORS' && alertId) setSelectedProtectorId(alertId);

                onTabChange?.(targetTab);
              }}
              onApproveProtector={handleApproveProtector}
              onDispatchSpecial={async (alertId, protectorIds) => {
                try {
                  const alertRef = doc(db, 'alerts', alertId);
                  await updateDoc(alertRef, {
                    status: 'responding',
                    dispatchedAt: new Date(),
                    activeResponders: protectorIds.map(pid => ({
                      id: pid,
                      status: 'dispatched',
                      timestamp: new Date()
                    }))
                  });
                  toast.success(`Special Force Dispatched to ${protectorIds.length} Nodes`);
                } catch (error) {
                  console.error('Dispatch Error:', error);
                  toast.error('Tactical Dispatch Failed');
                }
              }}
            />
          )}
        </div>
      );
    case 'VERIFICATION':
      const VettingDeskAny = VettingDesk as any;
      return (
        <VettingDeskAny 
          userStatusMap={userStatusMap} 
          pendingProtectors={pendingProtectors} 
          selectedVettingUserId={selectedVettingUserId} 
        />
      );
    case 'SOS':
      const SOSManagementAny = SOSManagement as any;
      return (
        <SOSManagementAny
          externalSelectedId={selectedAlertId}
          verifiedProtectors={verifiedProtectors}
          activeAlerts={filteredActiveAlerts}
          historicalAlerts={missionHistory}
          userStatusMap={userStatusMap}
          onViewReplay={(id: string) => {
            setSelectedAlertId(id);
            onTabChange?.('MAP');
          }}
        />
      );
    case 'FIR':
      const JusticeLedgerAny = JusticeLedger as any;
      return <JusticeLedgerAny />;
    case 'PROTECTORS':
      const ProtectorManagementAny = ProtectorManagement as any;
      return (
        <ProtectorManagementAny
          verifiedProtectors={filteredVerifiedProtectors}
          pendingProtectors={filteredPendingProtectors}
          onApprove={handleApproveProtector}
          activeAlerts={filteredActiveAlerts}
        />
      );
    case 'TRANSIT':
      const TransitIntelligenceAny = TransitIntelligence as any;
      return (
        <TransitIntelligenceAny 
          activeJourneys={activeJourneys} 
          userStatusMap={userStatusMap} 
          onNavigate={(id: string) => {
            setSelectedAlertId(id);
            onTabChange?.('MAP');
          }}
        />
      );
    case 'MAP':
      const KavachMapAny = KavachMap as any;
      return (
        <div className="flex-1 bg-black relative">
          <KavachMapAny
            alerts={filteredActiveAlerts}
            protectors={filteredVerifiedProtectors}
            journeys={activeJourneys}
            firs={filteredActiveFirs}
            showHeatmap={showHeatmap}
            selectedAlertId={selectedAlertId}
            onSelectAlert={(id: string) => {
              setSelectedAlertId(id);
              onTabChange?.('SOS');
            }}
            useMapboxFallback={useMapboxFallback}
          />
        </div>
      );
    case 'COMMS':
      const TacticalCommsAny = TacticalComms as any;
      return <TacticalCommsAny />;
    case 'DIRECTORY':
      const KavachDirectoryAny = KavachDirectory as any;
      return <KavachDirectoryAny userStatusMap={userStatusMap} />;
    case 'DATA':
      const ProtectorReportsLedgerAny = ProtectorReportsLedger as any;
      return <ProtectorReportsLedgerAny userStatusMap={userStatusMap} />;
    case 'NODES':
      const NodesControlAny = NodesControl as any;
      return <NodesControlAny />;
    case 'SHIFTS':
      const ShiftLogsAny = ShiftLogs as any;
      return <ShiftLogsAny userStatusMap={userStatusMap} />;
    case 'AI':
      const NeuralAnalyticsAny = NeuralAnalytics as any;
      return <NeuralAnalyticsAny />;
    case 'APPEALS':
      const BanAppealsAny = BanAppeals as any;
      return <BanAppealsAny userStatusMap={userStatusMap} />;
    default:
      return (
        <div className="flex-1 flex items-center justify-center bg-[#0F172A] text-slate-500 font-['Outfit']">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-2 text-slate-400">Restricted Sector</h2>
            <p className="text-xs">This module requires elevated sovereign clearance.</p>
          </div>
        </div>
      );
  }
}

