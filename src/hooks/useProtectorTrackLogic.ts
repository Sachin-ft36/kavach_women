import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useCloudML } from '../hooks/useCloudML';
import { PredictiveIntelResult } from '../lib/predictiveIntel';

export function useProtectorTrackLogic(
  activeMissionId?: string | null,
  onClearMission?: () => void,
  isSovereignActive?: boolean,
  userStatusMap: Record<string, any> = {},
  selectedState: string = 'ALL'
) {
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [resolvedMissions, setResolvedMissions] = useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(activeMissionId || null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProtectors, setActiveProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);
  const [historicalJourneys, setHistoricalJourneys] = useState<any[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [predictiveResults, setPredictiveResults] = useState<PredictiveIntelResult | null>(null);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  const { analyzeMissionVector, isAnalyzing, mlLatency } = useCloudML();

  const [replayProgress, setReplayProgress] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (activeMissionId) {
      setSelectedMissionId(activeMissionId);
      setSelectedVictimId(null);
      setReplayProgress(1);
    }
  }, [activeMissionId]);

  useEffect(() => {
    return () => onClearMission?.();
  }, [onClearMission]);

  useEffect(() => {
    const unsubActive = onSnapshot(query(collection(db, 'alerts'), where('status', 'in', ['responding', 'active'])), (snap) => setActiveMissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubResolved = onSnapshot(query(collection(db, 'alerts'), where('status', '==', 'resolved')), (snap) => {
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setResolvedMissions(sorted);
    });
    const unsubProts = onSnapshot(query(collection(db, 'users'), where('role', '==', 'protector')), (snap) => setActiveProtectors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubFirs = onSnapshot(collection(db, 'zero_firs'), (snap) => setActiveFirs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubJourneyHistory = onSnapshot(query(collection(db, 'journey_history'), orderBy('endTime', 'desc')), (snap) => {
      setHistoricalJourneys(snap.docs.map(d => ({ id: d.id, ...d.data(), isJourney: true })));
    });

    return () => { unsubActive(); unsubResolved(); unsubProts(); unsubFirs(); unsubJourneyHistory(); };
  }, []);

  const filterByState = useCallback((item: any) => {
    if (!item) return false;
    if (!selectedState || selectedState === 'ALL') return true;

    const getStateVariations = (stateName: string): string[] => {
      const name = stateName.toLowerCase().trim();
      const variations = [name];
      if (name === 'uttar pradesh') variations.push('up', 'u.p.', 'uttarpradesh');
      else if (name === 'maharashtra') variations.push('mh', 'm.h.');
      else if (name === 'delhi') variations.push('dl', 'd.l.');
      else if (name === 'karnataka') variations.push('ka', 'k.a.');
      else if (name === 'rajasthan') variations.push('rj', 'r.j.');
      else if (name === 'west bengal') variations.push('wb', 'w.b.');
      else if (name === 'madhya pradesh') variations.push('mp', 'm.p.');
      else if (name === 'andhra pradesh') variations.push('ap', 'a.p.');
      else if (name === 'jammu and kashmir') variations.push('jk', 'j&k', 'j & k', 'jammu & kashmir');
      else if (name === 'punjab') variations.push('pb', 'p.b.');
      else if (name === 'haryana') variations.push('hr', 'h.r.');
      else if (name === 'gujarat') variations.push('gj', 'g.j.');
      else if (name === 'bihar') variations.push('br', 'b.r.');
      else if (name === 'tamil nadu') variations.push('tn', 't.n.');
      else if (name === 'telangana') variations.push('ts', 't.s.');
      return variations;
    };

    const matchesState = (selState: string, text: string) => {
      if (!text) return false;
      const lowerText = text.toLowerCase().trim();
      const selectedVariations = getStateVariations(selState);
      if (selectedVariations.includes(lowerText)) return true;
      return selectedVariations.some(variation => {
        if (variation.length <= 4) return new RegExp(`\\b${variation.replace('.', '\\.')}\\b`, 'i').test(lowerText);
        return lowerText.includes(variation);
      });
    };

    if (item.state && matchesState(selectedState, item.state)) return true;
    if (item.address && matchesState(selectedState, item.address)) return true;
    if (item.locationName && matchesState(selectedState, item.locationName)) return true;
    if (item.incidentAddress && matchesState(selectedState, item.incidentAddress)) return true;
    if (item.city && matchesState(selectedState, item.city)) return true;
    if (item.fullAddress && matchesState(selectedState, item.fullAddress)) return true;
    
    const uUid = item.victimUid || item.userId || item.uid;
    if (uUid && userStatusMap[uUid]) {
      const profile = userStatusMap[uUid];
      if (profile.state && matchesState(selectedState, profile.state)) return true;
      if (profile.address && matchesState(selectedState, profile.address)) return true;
      if (profile.city && matchesState(selectedState, profile.city)) return true;
      if (profile.fullAddress && matchesState(selectedState, profile.fullAddress)) return true;
    }
    return false;
  }, [selectedState, userStatusMap]);

  const filteredActiveMissions = useMemo(() => activeMissions.filter(filterByState), [activeMissions, filterByState]);
  const filteredResolvedMissions = useMemo(() => resolvedMissions.filter(filterByState), [resolvedMissions, filterByState]);
  const filteredActiveProtectors = useMemo(() => activeProtectors.filter(filterByState), [activeProtectors, filterByState]);
  const filteredActiveFirs = useMemo(() => activeFirs.filter(filterByState), [activeFirs, filterByState]);
  const filteredHistoricalJourneys = useMemo(() => historicalJourneys.filter(filterByState), [historicalJourneys, filterByState]);

  const selectedMission = (
    filteredActiveMissions.find(m => m.id === selectedMissionId) || 
    filteredResolvedMissions.find(m => m.id === selectedMissionId) ||
    filteredHistoricalJourneys.find(m => m.id === selectedMissionId)
  );

  useEffect(() => {
    if (!selectedMission || !selectedMission.path || selectedMission.status === 'resolved') {
       setPredictiveResults(null);
       return;
    }
    const analyze = async () => {
       const results = await analyzeMissionVector(selectedMission.path, selectedMission.safePath || []);
       setPredictiveResults(results);
    };
    analyze();
  }, [selectedMission, analyzeMissionVector]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && replayProgress < 1) {
      interval = setInterval(() => setReplayProgress(prev => Math.min(prev + 0.01, 1)), 100);
    } else if (replayProgress >= 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayProgress]);

  const handleRemoteOverride = async (type: 'LOCKOUT' | 'SIREN' | 'SNAPSHOT') => {
    if (!selectedMissionId) return;
    if (!isSovereignActive) {
      toast.error("AUTHORIZATION DENIED", { description: "Activate Sovereign Override for hardware intervention." });
      return;
    }
    setIsProcessingCommand(true);
    try {
      await updateDoc(doc(db, 'alerts', selectedMissionId), {
        remoteCommand: type, commandTimestamp: new Date(), commandStatus: 'pending', commandOrigin: 'SUPERCELL_MISSION_HUD'
      });
      toast.success(`${type} INITIATED`, { description: `Command broadcasted to device firmware: ${selectedMissionId.slice(0, 8)}`, duration: 3000 });
    } catch (error) {
      toast.error("HARDWARE BRIDGE FAILURE", { description: "Failed to establish secure link with node firmware." });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const groupedResolved = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const allHistorical = [
      ...filteredResolvedMissions.map(m => ({ ...m, type: 'ALERT' })),
      ...filteredHistoricalJourneys.map(j => ({ ...j, type: 'JOURNEY' }))
    ].sort((a: any, b: any) => (b.timestamp?.toMillis() || b.endTime?.toMillis() || 0) - (a.timestamp?.toMillis() || a.endTime?.toMillis() || 0));

    allHistorical.forEach(item => {
      const uid = item.victimUid || item.userId || 'anonymous';
      if (!groups[uid]) groups[uid] = [];
      groups[uid].push(item);
    });
    return groups;
  }, [filteredResolvedMissions, filteredHistoricalJourneys]);

  const uniqueResolvedVictims = useMemo(() => {
    return Object.keys(groupedResolved).map(uid => {
      const items = groupedResolved[uid];
      return { uid, name: items[0].victimName || items[0].userName, count: items.length, lastTimestamp: items[0].timestamp || items[0].endTime };
    }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
  }, [groupedResolved]);

  const resolveIdentity = (alert: any) => {
    const uid = alert.victimUid || alert.userId || alert.uid;
    return userStatusMap[uid]?.name || alert.victimName || 'Citizen Profile';
  };

  const deviationReport = useMemo(() => {
    if (!selectedMission || !selectedMission.path) return null;
    if (predictiveResults) return predictiveResults;
    const breaches = selectedMission.path.filter((p: any, idx: number) => idx % 15 === 0 && selectedMission.status === 'resolved');
    return {
      deviationDist: (selectedMission.path.length * 0.05).toFixed(2),
      breachCount: breaches.length,
      isBreached: breaches.length > 0,
      threatLevel: breaches.length > 0 ? 'CRITICAL' : 'LOW'
    };
  }, [selectedMission, predictiveResults]);

  const getDistanceInfo = (mission: any) => {
    if (!mission) return { dist: '---', eta: '---' };
    const vLat = mission.location?.latitude || mission.location?.lat;
    const vLng = mission.location?.longitude || mission.location?.lng;
    const resp = mission.activeResponders?.[0];
    if (!vLat || !vLng || !resp?.lastLocation) return { dist: '---', eta: '---' };
    const R = 6371;
    const dLat = (vLat - resp.lastLocation.lat) * Math.PI / 180;
    const dLon = (vLng - resp.lastLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(vLat * Math.PI / 180) * Math.cos(resp.lastLocation.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    const eta = Math.ceil(dist / 0.5);
    return { 
      dist: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`, 
      eta: eta > 60 ? `${Math.floor(eta/60)}h ${eta%60}m` : `${eta} min` 
    };
  };

  const filteredArchives = uniqueResolvedVictims.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return {
    searchTerm, setSearchTerm,
    activeMissions: filteredActiveMissions,
    activeProtectors: filteredActiveProtectors,
    activeFirs: filteredActiveFirs,
    selectedMissionId, setSelectedMissionId,
    selectedVictimId, setSelectedVictimId,
    selectedMission,
    useMapboxFallback, setUseMapboxFallback,
    deviationReport,
    resolveIdentity, getDistanceInfo,
    groupedResolved, filteredArchives,
    replayProgress, setReplayProgress,
    isPlaying, setIsPlaying,
    isProcessingCommand, handleRemoteOverride
  };
}
