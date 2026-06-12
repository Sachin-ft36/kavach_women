import React from 'react';
import { useProtectorTrackLogic } from '../../hooks/useProtectorTrackLogic';
import ProtectorTrackSidebar from './protector/ProtectorTrackSidebar';
import ProtectorReplayHUD from './protector/ProtectorReplayHUD';

import CommandMap from '../maps/CommandMap';
import MapplsCommandMap from '../maps/MapplsCommandMap';

interface ProtectorTrackProps {
  activeMissionId?: string | null;
  onClearMission?: () => void;
  isSovereignActive?: boolean;
  userStatusMap?: Record<string, any>;
  selectedState?: string;
  detectedAdminDistrict?: string | null;
}

export function ProtectorTrack({ 
  activeMissionId, onClearMission, isSovereignActive, 
  userStatusMap = {}, selectedState = 'ALL', detectedAdminDistrict = null
}: ProtectorTrackProps) {
  
  const {
    searchTerm, setSearchTerm, activeMissions, activeProtectors, activeFirs,
    selectedMissionId, setSelectedMissionId, selectedVictimId, setSelectedVictimId,
    selectedMission, useMapboxFallback, setUseMapboxFallback, deviationReport,
    resolveIdentity, getDistanceInfo, groupedResolved, filteredArchives,
    replayProgress, setReplayProgress, isPlaying, setIsPlaying,
    isProcessingCommand, handleRemoteOverride
  } = useProtectorTrackLogic(activeMissionId, onClearMission, isSovereignActive, userStatusMap, selectedState);

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      
      <ProtectorTrackSidebar 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filteredActiveMissions={activeMissions} filteredArchives={filteredArchives}
        selectedMissionId={selectedMissionId} setSelectedMissionId={setSelectedMissionId}
        selectedVictimId={selectedVictimId} setSelectedVictimId={setSelectedVictimId}
        setReplayProgress={setReplayProgress} resolveIdentity={resolveIdentity}
        getDistanceInfo={getDistanceInfo} userStatusMap={userStatusMap}
      />

      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          {!useMapboxFallback ? (
            <MapplsCommandMap 
              activeAlerts={activeMissions} activeProtectors={activeProtectors} activeFirs={activeFirs} 
              pendingProtectors={[]} selectedAlertId={selectedMissionId}
              victimPath={selectedMission?.path || []} protectorPath={selectedMission?.protectorPath || []}
              safePath={selectedMission?.safePath || []} replayProgress={replayProgress}
              selectedState={selectedState} onFallback={() => setUseMapboxFallback(true)}
            />
          ) : (
            <CommandMap 
              activeAlerts={activeMissions} activeProtectors={activeProtectors} activeFirs={activeFirs} 
              pendingProtectors={[]} selectedAlertId={selectedMissionId}
              victimPath={selectedMission?.path || []} protectorPath={selectedMission?.protectorPath || []}
              safePath={selectedMission?.safePath || []} replayProgress={replayProgress}
              selectedState={selectedState}
            />
          )}
        </div>
        
        <ProtectorReplayHUD 
          selectedMission={selectedMission} deviationReport={deviationReport}
          resolveIdentity={resolveIdentity} replayProgress={replayProgress} setReplayProgress={setReplayProgress}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} handleRemoteOverride={handleRemoteOverride}
          isProcessingCommand={isProcessingCommand} isSovereignActive={!!isSovereignActive}
          selectedVictimId={selectedVictimId} setSelectedVictimId={setSelectedVictimId}
          groupedResolved={groupedResolved} selectedMissionId={selectedMissionId} setSelectedMissionId={setSelectedMissionId}
        />
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none; width: 24px; height: 24px; background: #3B82F6;
          border: 4px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
