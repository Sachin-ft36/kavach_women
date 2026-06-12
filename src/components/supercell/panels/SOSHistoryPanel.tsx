import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { SOSHistoryPastLogs } from './sos_history/SOSHistoryPastLogs';
import { SOSHistoryVictimDetails } from './sos_history/SOSHistoryVictimDetails';

export function SOSHistoryPanel({
  victimData,
  victimHistory,
  guardians,
  pendingAppeal,
  onViewReplay,
  handleAction,
  handleRestoreAccess,
  handlePermanentBan,
  onOpenEvidence,
  setSelectedAlertId
}: any) {
  if (!victimData) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-20">
        <ShieldAlert size={120} strokeWidth={0.5} className="mb-8" />
        <p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-row h-full w-full overflow-hidden">
      <SOSHistoryPastLogs 
        victimData={victimData}
        victimHistory={victimHistory}
        guardians={guardians}
        onOpenEvidence={onOpenEvidence}
        setSelectedAlertId={setSelectedAlertId}
        onViewReplay={onViewReplay}
      />
      
      <SOSHistoryVictimDetails 
        victimData={victimData}
        victimHistory={victimHistory}
        guardians={guardians}
        pendingAppeal={pendingAppeal}
        handleAction={handleAction}
        handleRestoreAccess={handleRestoreAccess}
        handlePermanentBan={handlePermanentBan}
      />
    </div>
  );
}
