import React, { useMemo } from 'react';
import { toast } from 'sonner';

import { IncidentFeed } from './national/IncidentFeed';
import { IncidentWarRoom } from './national/IncidentWarRoom';
import { OperationsGrid } from './national/OperationsGrid';
import { ProtectorControl } from './national/ProtectorControl';
import { DispatchPanel } from './national/DispatchPanel';
import { useNationalCommand } from './national/useNationalCommand';
import { IncidentRecord, UserProfile, ZeroFIRRecord } from '../../state/slices/types';

import { NationalTacticalStrip } from './national/NationalTacticalStrip';
import { NationalEscalationBanner } from './national/NationalEscalationBanner';

interface NationalOverviewProps {
  activeAlerts: IncidentRecord[];
  verifiedProtectors: UserProfile[];
  pendingProtectors: UserProfile[];
  zeroFirs: ZeroFIRRecord[];
  selectedState: string;
  isSovereignActive?: boolean;
  onNavigate?: (tab: string, id?: string) => void;
  onApproveProtector?: (id: string) => void;
  onDispatchSpecial?: (alertId: string, protectorIds: string[]) => void;
}

export function NationalOverview({ 
  activeAlerts, 
  verifiedProtectors, 
  pendingProtectors, 
  zeroFirs,
  selectedState,
  isSovereignActive,
  onNavigate,
  onApproveProtector,
  onDispatchSpecial
}: NationalOverviewProps) {
  
  const {
    protectorTab, setProtectorTab,
    selectedAlertId, setSelectedAlertId,
    selectedProtectorId, setSelectedProtectorId,
    isDispatching, setIsDispatching,
    useMapboxFallback, setUseMapboxFallback,
    isSynthPlaying, setIsSynthPlaying,
    audioSynth, setAudioSynth,
    isLiveStreamActive, startStealthStream, stopStealthStream,
    isAudioPlaying,
    activePcoRadio, setActivePcoRadio,
    pcrDispatched, setPcrDispatched,
    customLogs, setCustomLogs,
    syncSectors, setSyncSectors,
    isSimulatingRun, isNakabandiDeployed,
    livePcrOfficers,
    incidentData, simulatedPcrVans, sortedAlerts,
    calculateDistance,
    handlePcrDispatch, handleBroadcastAlarm, handleRadioCall,
    handleForceReassignPcr, handleToggleRemoteSiren,
    triggerStateHighwaySimulation, deployHighwayNakabandi,
    handleLegalDispatch
  } = useNationalCommand(activeAlerts, selectedState);

  const protectorsInRange = useMemo(() => {
    if (!selectedAlertId) return [];
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return [];

    const aLat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
    const aLng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
    if (!aLat || !aLng) return [];

    return verifiedProtectors.filter(p => {
      const pLat = p.latitude || p.lat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
      const pLng = p.longitude || p.lng || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      if (!pLat || !pLng) return false;
      return calculateDistance(aLat, aLng, pLat, pLng) <= 2; // 2km Radius
    });
  }, [selectedAlertId, activeAlerts, verifiedProtectors, calculateDistance]);

  const toggleLiveMicSynth = async () => {
    if (isAudioPlaying) {
      if (audioSynth) {
        audioSynth.stop();
        setAudioSynth(null);
      }
      if (isLiveStreamActive) {
         await stopStealthStream();
      }
      setIsSynthPlaying(false);
      toast.error("Stealth microphone dispatch link closed.");
      return;
    }

    if (selectedAlertId) {
       await startStealthStream();
       toast.success("Connecting to secure WebRTC frequency...");
       return;
    }
  };

  const syncSovereignSector = (stateCode: string) => {
    setSyncSectors(prev => ({ ...prev, [stateCode]: true }));
    const timestamp = new Date().toLocaleTimeString();
    setCustomLogs(prev => [
      `[${timestamp}] DATABASE SYNC: Inter-state grid synchronization initiated for safety metrics.`,
      `[${timestamp}] Synchronized database nodes across ${stateCode} emergency sectors.`,
      ...prev
    ]);
    toast.success(`Interstate databases successfully synchronized with ${stateCode} grids.`);
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] overflow-hidden">
      
      <NationalTacticalStrip
        activeAlerts={activeAlerts}
        verifiedProtectors={verifiedProtectors}
        pendingProtectors={pendingProtectors}
        selectedAlertId={selectedAlertId}
        protectorsInRangeCount={protectorsInRange.length}
        onDispatchSpecial={(alertId) => onDispatchSpecial?.(alertId, protectorsInRange.map(p => p.id))}
        handleToggleRemoteSiren={handleToggleRemoteSiren}
        setSelectedAlertId={setSelectedAlertId}
      />

      <NationalEscalationBanner
        isSimulatingRun={isSimulatingRun}
        incidentData={incidentData}
        isNakabandiDeployed={isNakabandiDeployed}
        deployHighwayNakabandi={deployHighwayNakabandi}
      />

      {/* 🏗️ MAIN WAR ROOM GRID */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden p-4 gap-4">
         
         {/* 🔴 LEFT COLUMN: DISTRESS FEED / INCIDENT COGNIZANCE DETAILS (25%) */}
         <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            {!incidentData ? (
              <IncidentFeed
                sortedAlerts={sortedAlerts}
                selectedAlertId={selectedAlertId}
                setSelectedAlertId={setSelectedAlertId}
                onNavigate={onNavigate}
                handleForceReassignPcr={handleForceReassignPcr}
                zeroFirs={zeroFirs}
              />
            ) : (
              <IncidentWarRoom
                incidentData={incidentData}
                isSimulatingRun={isSimulatingRun}
                triggerStateHighwaySimulation={triggerStateHighwaySimulation}
                isNakabandiDeployed={isNakabandiDeployed}
                deployHighwayNakabandi={deployHighwayNakabandi}
              />
            )}
         </div>

         {/* 🗺️ CENTER COLUMN: SITUATIONAL MAP (50%) */}
         <div className="col-span-6 bg-[#0F172A]/50 border border-white/5 rounded-[3rem] overflow-hidden relative shadow-2xl flex flex-col">
            <OperationsGrid
              activeAlerts={activeAlerts}
              verifiedProtectors={verifiedProtectors}
              selectedAlertId={selectedAlertId}
              selectedProtectorId={selectedProtectorId}
              setSelectedAlertId={setSelectedAlertId}
              selectedState={selectedState}
              useMapboxFallback={useMapboxFallback}
              setUseMapboxFallback={setUseMapboxFallback}
              incidentData={incidentData}
              protectorsInRange={protectorsInRange}
            />
         </div>

         {/* 🛡️ RIGHT COLUMN: PROTECTOR NEXUS / SURVEILLANCE DATA STREAM (25%) */}
         <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            {!incidentData ? (
              <ProtectorControl
                protectorTab={protectorTab}
                setProtectorTab={setProtectorTab}
                pendingProtectors={pendingProtectors}
                verifiedProtectors={verifiedProtectors}
                onNavigate={onNavigate}
              />
            ) : (
              <DispatchPanel
                activeAlerts={activeAlerts}
                selectedAlertId={selectedAlertId}
                handleForceReassignPcr={handleForceReassignPcr}
                incidentData={incidentData}
                isLiveStreamActive={isLiveStreamActive}
                isAudioPlaying={isAudioPlaying}
                toggleLiveMicSynth={toggleLiveMicSynth}
                simulatedPcrVans={simulatedPcrVans}
                pcrDispatched={pcrDispatched}
                handleBroadcastAlarm={handleBroadcastAlarm}
                handleRadioCall={handleRadioCall}
                activePcoRadio={activePcoRadio}
                handlePcrDispatch={handlePcrDispatch}
                handleLegalDispatch={handleLegalDispatch}
                isDispatching={isDispatching}
              />
            )}
         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes bounceBar {
          0%, 100% { transform: scaleY(0.15); }
          50% { transform: scaleY(0.9); }
        }
      `}</style>
    </div>
  );
}
