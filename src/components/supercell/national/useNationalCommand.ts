import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useStealthAudio } from '../../../hooks/useStealthAudio';

import { parseIncidentData, generateSimulatedPcrVans, calculateDistance } from './utils/nationalCommandUtils';
import { handlePcrDispatchAction, handleForceReassignPcrAction } from './actions/pcrActions';
import { triggerStateHighwaySimulationAction, deployHighwayNakabandiAction, handleLegalDispatchAction } from './actions/transitActions';
import { handleBroadcastAlarmAction, handleRadioCallAction, handleToggleRemoteSirenAction } from './actions/alarmActions';

export function useNationalCommand(activeAlerts: any[], selectedState: string) {
  const [protectorTab, setProtectorTab] = useState<'PENDING' | 'ACTIVE'>('PENDING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [audioSynth, setAudioSynth] = useState<{ stop: () => void } | null>(null);

  const { 
    isLiveStreamActive, 
    startStealthStream, 
    stopStealthStream 
  } = useStealthAudio(selectedAlertId ? `channel-${selectedAlertId}` : null);

  const isAudioPlaying = isSynthPlaying || isLiveStreamActive;
  const [activePcoRadio, setActivePcoRadio] = useState<string | null>(null);
  const [pcrDispatched, setPcrDispatched] = useState<Record<string, boolean>>({});
  const [customLogs, setCustomLogs] = useState<string[]>([]);
  const [syncSectors, setSyncSectors] = useState<Record<string, boolean>>({});
  const [livePcrOfficers, setLivePcrOfficers] = useState<any[]>([]);

  const selectedAlert = useMemo(() => activeAlerts.find(a => a.id === selectedAlertId), [activeAlerts, selectedAlertId]);
  const isSimulatingRun = selectedAlert?.escapeVectorActive || false;
  const isNakabandiDeployed = selectedAlert?.nakabandiDeployed || false;

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['pcr_officer', 'protector'])
    );
    const unsub = onSnapshot(q, (snap) => {
      setLivePcrOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
    }, () => {
      setLivePcrOfficers([]);
    });
    return () => unsub();
  }, []);

  const incidentData = useMemo(() => {
    return parseIncidentData(selectedAlertId, activeAlerts, customLogs, selectedState);
  }, [selectedAlertId, activeAlerts, customLogs, selectedState]);

  const simulatedPcrVans = useMemo(() => {
    return generateSimulatedPcrVans(incidentData, activeAlerts, selectedAlertId, livePcrOfficers);
  }, [incidentData?.city, livePcrOfficers, selectedAlertId, activeAlerts]);

  const handlePcrDispatch = async (pcrId: string, pcrName: string, isReal = false, officerUid?: string) => {
    await handlePcrDispatchAction(pcrId, pcrName, isReal, officerUid, selectedAlertId, activeAlerts, incidentData, setPcrDispatched, setCustomLogs);
  };

  const handleForceReassignPcr = async (alertId: string, officerName: string) => {
    await handleForceReassignPcrAction(alertId, officerName, setCustomLogs);
  };

  const triggerStateHighwaySimulation = async () => {
    await triggerStateHighwaySimulationAction(selectedAlertId, isSimulatingRun, incidentData, setCustomLogs);
  };

  const deployHighwayNakabandi = async () => {
    await deployHighwayNakabandiAction(selectedAlertId, incidentData, setCustomLogs);
  };

  const handleLegalDispatch = async () => {
    await handleLegalDispatchAction(selectedAlertId, activeAlerts, incidentData, setIsDispatching, setCustomLogs);
  };

  const handleBroadcastAlarm = () => {
    handleBroadcastAlarmAction(simulatedPcrVans, pcrDispatched, activeAlerts, selectedAlertId, incidentData, setPcrDispatched, setCustomLogs);
  };

  const handleRadioCall = (pcrId: string, pcrName: string) => {
    handleRadioCallAction(pcrId, pcrName, activePcoRadio, setActivePcoRadio, setCustomLogs);
  };

  const handleToggleRemoteSiren = (alertId: string) => {
    handleToggleRemoteSirenAction(alertId, setCustomLogs);
  };

  const sortedAlerts = useMemo(() => {
    return [...activeAlerts].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [activeAlerts]);

  return {
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
  };
}
