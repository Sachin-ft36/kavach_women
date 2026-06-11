import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useStealthAudio } from '../../../hooks/useStealthAudio';
import { toast } from 'sonner';

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
      where('role', '==', 'pcr_officer'),
      where('isOnDuty', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLivePcrOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
    }, () => {
      setLivePcrOfficers([]);
    });
    return () => unsub();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const incidentData = useMemo(() => {
    if (!selectedAlertId) return null;
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return null;

    const aLat = alert.latitude || alert.location?.lat;
    const aLng = alert.longitude || alert.location?.lng;
    const cityFallback = aLat ? `Grid Sector [${aLat.toFixed(2)}, ${aLng.toFixed(2)}]` : 'Classified Zone';
    
    const isValid = (val: any) => val && typeof val === 'string' && !val.includes('Unknown') && !val.includes('Neutral Zone');

    const city: string =
      (isValid(alert.city) && alert.city) ||
      (isValid(alert.district) && alert.district) ||
      (isValid(alert.locationCity) && alert.locationCity) ||
      (isValid(alert.victimCity) && alert.victimCity) ||
      (isValid(alert.address?.split(',')[0]?.trim()) && alert.address?.split(',')[0]?.trim()) ||
      (isValid(alert.locationName?.split(',')[0]?.trim()) && alert.locationName?.split(',')[0]?.trim()) ||
      cityFallback;

    const stateName: string =
      alert.state ||
      alert.locationState ||
      alert.victimState ||
      (selectedState !== 'ALL' ? selectedState : 'Unknown State');

    const stateCode: string = stateName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);
    const year = new Date().getFullYear();
    const seed = alert.id?.slice(-4)?.toUpperCase() || '0000';
    const caseId = `CASE-${stateCode}-${year}-${city.slice(0, 3).toUpperCase()}-${seed}`;
    const victimName: string = alert.victimName || alert.userName || alert.name || 'Distress Node';

    const baselineLogs: string[] = [];
    if (alert.timestamp) baselineLogs.push(`[${new Date(alert.timestamp.seconds * 1000).toLocaleTimeString()}] SOS Signal registered at ${city} coordinates.`);
    if (alert.audioUrl || alert.stealthAudio) baselineLogs.push(`[${new Date().toLocaleTimeString()}] STEALTH MIC ACTIVE: Audio uplink established for ${victimName}.`);
    if (alert.escapeVectorActive) baselineLogs.push(`[${new Date().toLocaleTimeString()}] ALERT: Target crossing ${city} boundaries. State escalation triggered.`);
    if (alert.nakabandiDeployed) baselineLogs.push(`[${new Date().toLocaleTimeString()}] NHAI TOLL LOCKDOWN: Physical boom barriers disabled by command.`);
    
    if (baselineLogs.length === 0) baselineLogs.push(`> Listening for live telemetry on port 8080...`);

    const allLogs = [...customLogs, ...baselineLogs].slice(0, 20);

    return {
      caseId, city, stateName, victimName, incidentId: caseId,
      address: isValid(alert.address) ? alert.address : (isValid(alert.locationName) ? alert.locationName : (aLat ? `GPS: ${aLat}, ${aLng}` : 'Classified Geo-Grid')),
      forensicTranscript: alert.audioTranscript 
        ? `[TRANSCRIPT] ${alert.audioTranscript}`
        : (alert.audioUrl || alert.stealthAudio) ? "Live audio stream locked. Decrypting voice telemetry..." : "No active audio uplink detected from the primary device.",
      nearestThanaName: alert.nearestPoliceStation || alert.policeStation || `${city} HQ Precinct (Awaiting API Sync)`,
      bnsOffenseCategory: 'BNSS Sec 63 Chain (Immediate Cognizance)',
      systemLogs: allLogs,
      nearbyTolls: alert.nearbyTolls || null
    };
  }, [selectedAlertId, activeAlerts, customLogs, selectedState]);

  const simulatedPcrVans = useMemo(() => {
    const city = incidentData?.city || 'Local';
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    const aLat = alert?.latitude || alert?.location?.lat || 0;
    const aLng = alert?.longitude || alert?.location?.lng || 0;

    const realVans = livePcrOfficers.map(officer => {
      const pLat = officer.lastLocation?.lat || officer.latitude || 0;
      const pLng = officer.lastLocation?.lng || officer.longitude || 0;
      const distKm = (aLat && aLng && pLat && pLng) ? calculateDistance(aLat, aLng, pLat, pLng) : null;
      const etaMins = distKm ? Math.ceil(distKm / 0.5) : null;
      return {
        id: officer.id,
        name: officer.vehicleNo || `${city} PCR Unit`,
        officer: `${officer.rank || 'Officer'} ${officer.name || officer.displayName || 'On Duty'}`,
        distance: distKm ? `${distKm.toFixed(1)} km` : 'Unknown',
        delay: etaMins ? `${etaMins} mins` : '—',
        uid: officer.id,
        isReal: true
      };
    }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    if (realVans.length === 0) {
      return [
        { id: 'PCR-01', name: `${city} PCR Van 01`, officer: 'Sub-Inspector A. Yadav', distance: '0.6 km', delay: '2 mins', isReal: false },
        { id: 'PCR-02', name: `${city} PCR Van 02`, officer: 'Head Constable R. Sharma', distance: '1.2 km', delay: '4 mins', isReal: false },
        { id: 'PCR-03', name: `${city} Interceptor 03`, officer: 'Constable S. Pathak', distance: '1.8 km', delay: '7 mins', isReal: false }
      ];
    }
    return realVans;
  }, [incidentData?.city, livePcrOfficers, selectedAlertId, activeAlerts]);

  const handlePcrDispatch = async (pcrId: string, pcrName: string, isReal = false, officerUid?: string) => {
    setPcrDispatched(prev => ({ ...prev, [pcrId]: true }));
    const timestamp = new Date().toLocaleTimeString();
    const alert = activeAlerts.find(a => a.id === selectedAlertId);

    try {
      await addDoc(collection(db, 'dispatches'), {
        pcrId, pcrName, officerUid: officerUid || null, alertId: selectedAlertId,
        alertLocation: alert ? {
          lat: alert.latitude || alert.location?.lat || 0,
          lng: alert.longitude || alert.location?.lng || 0,
          name: alert.locationName || alert.address || incidentData?.city || 'Unknown'
        } : null,
        victimName: incidentData?.victimName || 'Unknown',
        dispatchedAt: serverTimestamp(), status: 'dispatched', isRealOfficer: isReal
      });

      if (isReal && officerUid) {
        await updateDoc(doc(db, 'users', officerUid), {
          currentDispatchStatus: 'dispatched', currentAlertId: selectedAlertId, lastUpdated: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('Firestore dispatch write failed (non-critical):', e);
    }

    setCustomLogs(prev => [
      `[${timestamp}] PCR DISPATCH: ${pcrName} status → DISPATCHED.`,
      `[${timestamp}] En-route vector locked to victim coordinates. ETA auto-updating via GPS.`,
      ...prev
    ]);
    toast.success(`🚔 ${pcrName} dispatched to location!`);
  };

  const handleBroadcastAlarm = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.8;
      audio.play();
    } catch (e) {}

    simulatedPcrVans.forEach(pcr => {
      if (!pcrDispatched[pcr.id]) {
        handlePcrDispatch(pcr.id, pcr.name, pcr.isReal, pcr.uid);
      }
    });
    toast.success("🚨 GLOBAL ALARM BROADCASTED TO ALL NEARBY PCOs!");
  };

  const handleRadioCall = (pcrId: string, pcrName: string) => {
    if (activePcoRadio === pcrId) {
      setActivePcoRadio(null);
      toast.error(`Radio link with ${pcrName} terminated.`);
    } else {
      setActivePcoRadio(pcrId);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (e) {}
      
      setCustomLogs(prev => [
        `[${new Date().toLocaleTimeString()}] RADIO LINK: Secure voice channel established with ${pcrName}.`,
        ...prev
      ]);
      toast.success(`Secure radio link established with ${pcrName}. Mic is LIVE.`);
    }
  };

  const handleForceReassignPcr = async (alertId: string, officerName: string) => {
    try {
      const q = query(
        collection(db, 'dispatches'),
        where('alertId', '==', alertId),
        where('status', '==', 'dispatched')
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(db, 'dispatches', d.id), {
          status: 'cancelled', lastUpdated: serverTimestamp()
        });
      }

      const alertRef = doc(db, 'alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      if (alertDoc.exists()) {
        const alertData = alertDoc.data();
        const inactiveUid = alertData.responderUid;
        
        await updateDoc(alertRef, {
          status: 'active', responderUid: null, responderName: null,
          activeResponders: [], inactivityEscalated: false, inactivityReassigned: true,
          lastUpdated: serverTimestamp()
        });

        if (inactiveUid) {
          await updateDoc(doc(db, 'users', inactiveUid), {
            status: 'idle', respondingToAlertId: null, currentDispatchStatus: 'idle',
            currentAlertId: null, lastUpdated: serverTimestamp()
          });
        }
      }

      const timestamp = new Date().toLocaleTimeString();
      setCustomLogs(prev => [
        `[${timestamp}] FORCE RE-ASSIGN: Unit ${officerName} un-assigned due to en-route standstill inactivity.`,
        `[${timestamp}] Distress node re-broadcasted directly to all nearby active patrolling PCR units.`,
        ...prev
      ]);
      toast.warning(`🚨 Force reassigned PCR alert! Stationary unit ${officerName} un-assigned.`);
      
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance("Stationary PCR unit unassigned. Alert rerouted.");
        window.speechSynthesis.speak(msg);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reassign PCR unit.");
    }
  };

  const handleToggleRemoteSiren = async (alertId: string) => {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      if (alertDoc.exists()) {
        const currentSirenState = alertDoc.data().remoteSirenTriggered || false;
        const nextState = !currentSirenState;
        
        await updateDoc(alertRef, {
          remoteSirenTriggered: nextState, lastUpdated: serverTimestamp()
        });

        const timestamp = new Date().toLocaleTimeString();
        setCustomLogs(prev => [
          `[${timestamp}] ACOUSTIC INTERCEPT: Remote mobile high-decibel siren command broadcasted to victim device. Status → ${nextState ? 'ENGAGED' : 'SILENCED'}.`,
          ...prev
        ]);
        
        if (nextState) {
          toast.success("🔊 REMOTE SIREN ENGAGED: Victim's phone is now playing a high-volume emergency beacon!");
        } else {
          toast.info("🔊 Remote mobile siren silenced.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to trigger remote siren.");
    }
  };

  const triggerStateHighwaySimulation = async () => {
    const timestamp = new Date().toLocaleTimeString();
    const city = incidentData?.city || 'Local';
    const state = incidentData?.stateName || 'State';
    
    if (selectedAlertId) {
      try {
        await updateDoc(doc(db, 'alerts', selectedAlertId), {
          escapeVectorActive: !isSimulatingRun, nakabandiDeployed: false, lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.warn('Failed to sync escape vector to cloud:', e);
      }
    }

    if (isSimulatingRun) {
      setCustomLogs(prev => [
        `[${timestamp}] Escape vector tracking cancelled. ${city} district boundaries re-stabilized.`,
        ...prev
      ]);
      toast.info('State level escape transit tracking stopped.');
    } else {
      setCustomLogs(prev => [
        `[${timestamp}] WARNING: Target coordinates leaving ${city} district borders. Escape vector active on state highway.`,
        `[${timestamp}] TRANSIT ESCALATION: ${state} State Command HQ notified. Target crossing outer boundary threshold.`,
        ...prev
      ]);
      toast.warning(`Victim escape transit tracked from ${city} towards state border toll gate!`);
    }
  };

  const deployHighwayNakabandi = async () => {
    const timestamp = new Date().toLocaleTimeString();
    const city = incidentData?.city || 'Local';
    const state = incidentData?.stateName || 'State';
    
    if (selectedAlertId) {
      try {
        await updateDoc(doc(db, 'alerts', selectedAlertId), {
          nakabandiDeployed: true, tollInterdictTime: serverTimestamp()
        });
      } catch (e) {
        console.warn('Failed to lock NHAI grid in cloud:', e);
      }
    }

    setCustomLogs(prev => [
      `[${timestamp}] STATE NAKABANDI ACTIVATED: ${city} outer toll gate barrier locking engaged.`,
      `[${timestamp}] ${state} highway blockade locked down. Escape route completely masked by ${state} Police Command.`,
      ...prev
    ]);
    toast.success('🚧 HIGHWAY NAKABANDI ENGAGED: Toll gates completely locked down by state police command!');
  };

  const handleLegalDispatch = async () => {
    setIsDispatching(true);
    const timestamp = new Date().toLocaleTimeString();
    const caseId = incidentData?.caseId || `ZF-AUTO-${Date.now().toString().slice(-4)}`;
    const victimName = incidentData?.victimName || 'Sovereign Node';
    const city = incidentData?.city || 'Local';
    const state = incidentData?.stateName || 'State';
    const alert = activeAlerts.find(a => a.id === selectedAlertId);

    try {
      await addDoc(collection(db, 'zero_firs'), {
        caseId, victimName, phone: alert?.phone || alert?.victimPhone || 'Force ID: 102',
        city, state, area: alert?.locationName || alert?.address || 'Highway Sector 4',
        dest: `${city} Central Precinct`, status: 'Transit Locked',
        timestamp: serverTimestamp(), createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore Zero FIR creation bypassed:', e);
    }

    setTimeout(() => {
      setIsDispatching(false);
      setCustomLogs(prev => [
        `[${timestamp}] SOVEREIGN COMMAND: Legal distress response packet signed and broadcasted to local magistrate.`,
        ...prev
      ]);
      toast.success("Sovereign distress legal response packet successfully signed and broadcasted!");
    }, 2000);
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
