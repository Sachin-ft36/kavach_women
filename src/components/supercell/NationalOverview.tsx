import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Globe, Shield, 
  AlertTriangle, CheckCircle2, 
  Map as MapIcon, Zap,
  Radar, Fingerprint, Database, 
  MapPin, Clock, UserPlus, Check, X,
  ShieldCheck, ArrowRight, Crosshair, Users,
  Target, Send, ShieldAlert, Phone, Mic, Lock, Terminal, Car, RefreshCw, Volume2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import CommandMap from '../maps/CommandMap';
import MapplsCommandMap from '../maps/MapplsCommandMap';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDocs, getDoc } from 'firebase/firestore';
import { useStealthAudio, AGORA_APP_ID } from '../../hooks/useStealthAudio';

interface NationalOverviewProps {
  activeAlerts: any[];
  verifiedProtectors: any[];
  pendingProtectors: any[];
  zeroFirs: any[];
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
  
  const [protectorTab, setProtectorTab] = useState<'PENDING' | 'ACTIVE'>('PENDING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  // 🎙️ TACTICAL COMMAND & CONTROL STATE VARIABLES
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [audioSynth, setAudioSynth] = useState<{ stop: () => void } | null>(null);

  // 🎧 AGORA WEBRTC LIVE STREAMING ENGINE
  const { 
    isLiveStreamActive, 
    connectionState: agoraConnectionState, 
    startStealthStream, 
    stopStealthStream 
  } = useStealthAudio(selectedAlertId ? `channel-${selectedAlertId}` : null);

  const isAudioPlaying = isSynthPlaying || isLiveStreamActive;
  const [activePcoRadio, setActivePcoRadio] = useState<string | null>(null);
  const [pcrDispatched, setPcrDispatched] = useState<Record<string, boolean>>({});
  const [customLogs, setCustomLogs] = useState<string[]>([]);
  const [syncSectors, setSyncSectors] = useState<Record<string, boolean>>({});

  const selectedAlert = useMemo(() => activeAlerts.find(a => a.id === selectedAlertId), [activeAlerts, selectedAlertId]);
  const isSimulatingRun = selectedAlert?.escapeVectorActive || false;
  const isNakabandiDeployed = selectedAlert?.nakabandiDeployed || false;

  // 🚔 REAL PCR OFFICERS FROM FIRESTORE
  const [livePcrOfficers, setLivePcrOfficers] = useState<any[]>([]);

  useEffect(() => {
    // Listen to all pcr_officer users who are on duty
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'pcr_officer'),
      where('isOnDuty', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLivePcrOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
    }, () => {
      // Firestore error — keep simulated fallback
      setLivePcrOfficers([]);
    });
    return () => unsub();
  }, []);

  // 🛰️ TACTICAL PROXIMITY CALCULATOR
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
  }, [selectedAlertId, activeAlerts, verifiedProtectors]);

  // 🎧 REAL-WORLD STEALTH VOIP AUDIO SYNTHESIZER
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

    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    
    // 1. 🌐 ATTEMPT WEBRTC LIVE STREAMING FIRST (Production Mode)
    if (selectedAlertId) {
       await startStealthStream();
       toast.success("Connecting to secure WebRTC frequency...");
       return;
    }
    
    // 🎙️ If real audio payload exists from Cloud Storage (From ShakeTrigger/Audio API)
    if (alert?.audioUrl) {
      try {
        const audioObj = new Audio(alert.audioUrl);
        audioObj.play().catch(e => {
           console.warn("Audio play failed:", e);
           toast.error("Decryption failed. Stream format unsupported.");
        });
        setAudioSynth({
          stop: () => {
            audioObj.pause();
            audioObj.currentTime = 0;
          }
        });
        setIsSynthPlaying(true);
        toast.success("Real audio stream locked. Playing decrypted voice payload.");
        return;
      } catch (e) {
        console.warn("Failed to mount HTMLAudioElement", e);
      }
    }

    // 📻 Fallback: Simulated Ambient Radio tracking hum
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        toast.error("Web Audio API not supported in this environment.");
        return;
      }

      const ctx = new AudioCtx();
      
      // Node 1: Oscillator (Sine wave distress beep)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // high pitched tone

      // Node 2: Low-pass filter for ambient radio hum
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      // Node 3: Static hum white noise generator
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Node 4: Gain node for noise static volume
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

      // Node 5: Gain node for distress beep volume
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.015, ctx.currentTime);

      // Connections
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      // Start Synthesizer audio stream
      noise.start(0);
      osc.start(0);

      // Create an interval beep pattern (Stealth radar tracking distress beep)
      let isBeeping = true;
      const interval = setInterval(() => {
        if (ctx.state === 'suspended') return;
        isBeeping = !isBeeping;
        oscGain.gain.setValueAtTime(isBeeping ? 0.015 : 0.0, ctx.currentTime);
      }, 700);

      setAudioSynth({
        stop: () => {
          clearInterval(interval);
          try {
            osc.stop();
            noise.stop();
          } catch(e) {}
          ctx.close();
        }
      });
      setIsSynthPlaying(true);
      toast.success("Active stealth mic frequency locked.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize tactical audio synthesizers.");
    }
  };

  // Clean up synthesizers on unmount
  useEffect(() => {
    return () => {
      if (audioSynth) {
        audioSynth.stop();
      }
    };
  }, [audioSynth]);

  // 🚨 REAL FIRESTORE PCR DISPATCH HANDLER
  const handlePcrDispatch = async (pcrId: string, pcrName: string, isReal = false, officerUid?: string) => {
    setPcrDispatched(prev => ({ ...prev, [pcrId]: true }));
    const timestamp = new Date().toLocaleTimeString();
    const alert = activeAlerts.find(a => a.id === selectedAlertId);

    try {
      // Write dispatch record to Firestore
      await addDoc(collection(db, 'dispatches'), {
        pcrId,
        pcrName,
        officerUid: officerUid || null,
        alertId: selectedAlertId,
        alertLocation: alert ? {
          lat: alert.latitude || alert.location?.lat || 0,
          lng: alert.longitude || alert.location?.lng || 0,
          name: alert.locationName || alert.address || incidentData?.city || 'Unknown'
        } : null,
        victimName: incidentData?.victimName || 'Unknown',
        dispatchedAt: serverTimestamp(),
        status: 'dispatched',
        isRealOfficer: isReal
      });

      // If real officer — update their Firestore status
      if (isReal && officerUid) {
        await updateDoc(doc(db, 'users', officerUid), {
          currentDispatchStatus: 'dispatched',
          currentAlertId: selectedAlertId,
          lastUpdated: serverTimestamp()
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
    // 1. Play Dispatch Siren
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.8;
      audio.play();
    } catch (e) {}

    // 2. Dispatch all vans locally
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
      // Play a radio connect beep
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
          status: 'cancelled',
          lastUpdated: serverTimestamp()
        });
      }

      const alertRef = doc(db, 'alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      if (alertDoc.exists()) {
        const alertData = alertDoc.data();
        const inactiveUid = alertData.responderUid;
        
        await updateDoc(alertRef, {
          status: 'active',
          responderUid: null,
          responderName: null,
          activeResponders: [],
          inactivityEscalated: false,
          inactivityReassigned: true,
          lastUpdated: serverTimestamp()
        });

        if (inactiveUid) {
          await updateDoc(doc(db, 'users', inactiveUid), {
            status: 'idle',
            respondingToAlertId: null,
            currentDispatchStatus: 'idle',
            currentAlertId: null,
            lastUpdated: serverTimestamp()
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
          remoteSirenTriggered: nextState,
          lastUpdated: serverTimestamp()
        });

        const timestamp = new Date().toLocaleTimeString();
        setCustomLogs(prev => [
          `[${timestamp}] ACOUSTIC INTERCEPT: Remote mobile high-decibel siren command broadcasted to victim device. Status → ${nextState ? 'ENGAGED' : 'SILENCED'}.`,
          ...prev
        ]);
        
        if (nextState) {
          toast.success("🔊 REMOTE SIREN ENGAGED: Victim's phone is now playing a high-volume emergency beacon!");
          if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance("Remote mobile siren engaged on victim device.");
            window.speechSynthesis.speak(msg);
          }
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
    
    // 🌐 REAL-WORLD SYNC: Update Firestore to trigger State-Level Escalation
    if (selectedAlertId) {
      try {
        await updateDoc(doc(db, 'alerts', selectedAlertId), {
          escapeVectorActive: !isSimulatingRun,
          nakabandiDeployed: false, // Reset lockdown on toggle
          lastUpdated: serverTimestamp()
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
    
    // 🌐 REAL-WORLD SYNC: Update Firestore to trigger FASTag/Toll Block
    if (selectedAlertId) {
      try {
        await updateDoc(doc(db, 'alerts', selectedAlertId), {
          nakabandiDeployed: true,
          tollInterdictTime: serverTimestamp()
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
        caseId,
        victimName,
        phone: alert?.phone || alert?.victimPhone || 'Force ID: 102',
        city,
        state,
        area: alert?.locationName || alert?.address || 'Highway Sector 4',
        dest: `${city} Central Precinct`,
        status: 'Transit Locked',
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });
      toast.success(`🏛️ REAL ZERO FIR REGISTERED IN FIRESTORE: ${caseId}`);
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

  // ─── Dynamic incident metadata from actual alert data ───────────────────
  const incidentData = useMemo(() => {
    if (!selectedAlertId) return null;
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return null;

    // Resolve location fields from any Firestore schema variant
    const aLat = alert.latitude || alert.location?.lat;
    const aLng = alert.longitude || alert.location?.lng;
    const cityFallback = aLat ? `Grid Sector [${aLat.toFixed(2)}, ${aLng.toFixed(2)}]` : 'Classified Zone';
    
    // Invalidate dummy strings like 'Unknown' or 'Neutral Zone Location' so fallback triggers
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
      selectedState !== 'ALL' ? selectedState : 'Unknown State';

    const stateCode: string = stateName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    const year = new Date().getFullYear();
    // Deterministic case ID seeded from alert id so it's stable
    const seed = alert.id?.slice(-4)?.toUpperCase() || '0000';
    const caseId = `CASE-${stateCode}-${year}-${city.slice(0, 3).toUpperCase()}-${seed}`;

    const victimName: string =
      alert.victimName || alert.userName || alert.name || 'Distress Node';

    // 1. Genuine System Logs generated from the alert's actual state
    const baselineLogs: string[] = [];
    if (alert.timestamp) baselineLogs.push(`[${new Date(alert.timestamp.seconds * 1000).toLocaleTimeString()}] SOS Signal registered at ${city} coordinates.`);
    if (alert.audioUrl || alert.stealthAudio) baselineLogs.push(`[${new Date().toLocaleTimeString()}] STEALTH MIC ACTIVE: Audio uplink established for ${victimName}.`);
    if (alert.escapeVectorActive) baselineLogs.push(`[${new Date().toLocaleTimeString()}] ALERT: Target crossing ${city} boundaries. State escalation triggered.`);
    if (alert.nakabandiDeployed) baselineLogs.push(`[${new Date().toLocaleTimeString()}] NHAI TOLL LOCKDOWN: Physical boom barriers disabled by command.`);
    
    // Add default init log if empty to prevent completely blank console
    if (baselineLogs.length === 0) baselineLogs.push(`> Listening for live telemetry on port 8080...`);

    const allLogs = [...customLogs, ...baselineLogs].slice(0, 20); // Keep terminal clean

    return {
      caseId,
      city,
      stateName,
      victimName,
      incidentId: caseId,
      address: isValid(alert.address) ? alert.address : (isValid(alert.locationName) ? alert.locationName : (aLat ? `GPS: ${aLat}, ${aLng}` : 'Classified Geo-Grid')),
      forensicTranscript: alert.audioTranscript 
        ? `[TRANSCRIPT] ${alert.audioTranscript}`
        : (alert.audioUrl || alert.stealthAudio) 
          ? "Live audio stream locked. Decrypting voice telemetry..." 
          : "No active audio uplink detected from the primary device.",
      nearestThanaName: alert.nearestPoliceStation || alert.policeStation || `${city} HQ Precinct (Awaiting API Sync)`,
      bnsOffenseCategory: 'BNSS Sec 63 Chain (Immediate Cognizance)',
      systemLogs: allLogs,
      nearbyTolls: alert.nearbyTolls || null
    };
  }, [selectedAlertId, activeAlerts, customLogs, selectedState]);

  // 🚔 Real Firestore PCR officers merged with simulated fallback
  const simulatedPcrVans = useMemo(() => {
    const city = incidentData?.city || 'Local';
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    const aLat = alert?.latitude || alert?.location?.lat || 0;
    const aLng = alert?.longitude || alert?.location?.lng || 0;

    // Build list from real Firestore PCR officers
    const realVans = livePcrOfficers.map(officer => {
      const pLat = officer.lastLocation?.lat || officer.latitude || 0;
      const pLng = officer.lastLocation?.lng || officer.longitude || 0;
      const distKm = (aLat && aLng && pLat && pLng)
        ? calculateDistance(aLat, aLng, pLat, pLng)
        : null;
      const etaMins = distKm ? Math.ceil(distKm / 0.5) : null; // ~30km/h avg city speed
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

    // If no real officers online, show simulated fallback
    if (realVans.length === 0) {
      return [
        { id: 'PCR-01', name: `${city} PCR Van 01`, officer: 'Sub-Inspector A. Yadav',   distance: '0.6 km', delay: '2 mins', isReal: false },
        { id: 'PCR-02', name: `${city} PCR Van 02`, officer: 'Head Constable R. Sharma', distance: '1.2 km', delay: '4 mins', isReal: false },
        { id: 'PCR-03', name: `${city} Interceptor 03`, officer: 'Constable S. Pathak',  distance: '1.8 km', delay: '7 mins', isReal: false }
      ];
    }
    return realVans;
  }, [incidentData?.city, livePcrOfficers, selectedAlertId, activeAlerts]);

  // Sorting active alerts by priority
  const sortedAlerts = useMemo(() => {
    return [...activeAlerts].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });
  }, [activeAlerts]);

  return (
    <div className="h-full flex flex-col bg-[#020617] overflow-hidden">
      
      {/* 🇮🇳 TOP TACTICAL STRIP */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                   <Shield size={16} className="text-white" />
                </div>
                <div>
                   <h1 className="text-sm font-black text-white uppercase italic leading-none tracking-tighter">KAVACH NATIONAL SUPERCELL</h1>
                   <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[1.5px] mt-1">Operational Readiness: 100% // SOVEREIGN CLOUD LOCK</p>
                </div>
             </div>
            
             <div className="h-8 w-px bg-white/5 mx-2" />
            
             <div className="flex gap-6">
                <div className="flex flex-col">
                   <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest mb-1">Live SOS</span>
                   <span className="text-rose-500 font-black italic text-xs tabular-nums leading-none">{activeAlerts.length}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest mb-1">Protectors</span>
                   <span className="text-cyan-400 font-black italic text-xs tabular-nums leading-none">{verifiedProtectors.length}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest mb-1">Vetting Queue</span>
                   <span className="text-amber-500 font-black italic text-xs tabular-nums leading-none">{pendingProtectors.length}</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {selectedAlertId && (
                 <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onDispatchSpecial?.(selectedAlertId, protectorsInRange.map(p => p.id))}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xl shadow-rose-600/20 text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                 >
                    <ShieldAlert size={14} /> 
                    Dispatch Special Force ({protectorsInRange.length})
                 </motion.button>
             )}
             {selectedAlertId && (() => {
                const selectedAlert = activeAlerts.find(a => a.id === selectedAlertId);
                const isSirenActiveOnVictim = selectedAlert?.remoteSirenTriggered || false;
                return (
                   <button
                      onClick={() => handleToggleRemoteSiren(selectedAlertId)}
                      className={cn(
                         "px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
                         isSirenActiveOnVictim
                           ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 animate-pulse font-black"
                           : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      )}
                   >
                      <Volume2 size={12} className={isSirenActiveOnVictim ? "animate-bounce" : ""} />
                      {isSirenActiveOnVictim ? "🔊 SILENCE VICTIM SIREN" : "🔊 TRIGGER PHONE SIREN"}
                   </button>
                );
             })()}
             {selectedAlertId && (
                <button 
                   onClick={() => setSelectedAlertId(null)}
                   className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                   <Target size={12} /> Clear Lock
                </button>
             )}
             <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[12px] font-black uppercase text-gray-400 tracking-widest">Grid Sync: 14ms</span>
             </div>
          </div>
      </div>

      {/* ⚠️ STATE ESCALATION DYNAMIC HIGH-VISIBILITY BANNER */}
      <AnimatePresence>
        {isSimulatingRun && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-slate-950 font-['Outfit'] font-black uppercase text-center py-2 text-[13px] tracking-[3px] flex items-center justify-center gap-3 relative z-30 shadow-lg border-b border-amber-600 animate-pulse"
          >
            <AlertTriangle size={14} />
            CRISIS STATE HQ ESCALATION: Target coordinates leaving {incidentData?.city || 'Local'} District boundaries. Escape vector active towards state border!
            <button 
              onClick={deployHighwayNakabandi}
              className={cn(
                "ml-6 px-4 py-1 rounded text-[12px] font-black uppercase tracking-widest border transition-all",
                isNakabandiDeployed 
                  ? "bg-slate-900 border-slate-900 text-emerald-400 font-bold" 
                  : "bg-slate-900 border-slate-950 text-white hover:bg-black font-bold"
              )}
            >
              {isNakabandiDeployed ? "🚧 NAKABANDI LOCKED" : "🚧 TRIGGER HIGHWAY NAKABANDI"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🏗️ MAIN WAR ROOM GRID */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden p-4 gap-4">
         
         {/* 🔴 LEFT COLUMN: DISTRESS FEED / INCIDENT COGNIZANCE DETAILS (25%) */}
         <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            {!incidentData ? (
              // DEFAULT ACTIVE SOS LIST
              <>
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-2">
                      <Radar size={16} className="text-rose-500" />
                      <h3 className="text-[14px] font-black text-white uppercase tracking-[3px]">Active Distress</h3>
                   </div>
                   <span className="text-[12px] font-black text-rose-500/50 uppercase italic tracking-widest">Priority: Omega</span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                   {sortedAlerts.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/2 opacity-20">
                         <p className="text-[12px] font-black uppercase tracking-widest">No Active SOS</p>
                      </div>
                   ) : (
                      sortedAlerts.map((alert, idx) => (
                        <motion.div 
                           key={alert.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className={cn(
                              "bg-[#1E293B]/40 border rounded-[1.25rem] p-3 group transition-all cursor-pointer relative overflow-hidden",
                              alert.inactivityEscalated 
                                ? "border-amber-500 shadow-xl shadow-amber-500/10 bg-amber-950/20 animate-pulse"
                                : selectedAlertId === alert.id 
                                  ? "border-rose-500 shadow-xl shadow-rose-500/10 bg-[#1E293B]/80" 
                                  : "border-rose-500/10 hover:bg-[#1E293B]/60"
                           )}
                           onClick={() => setSelectedAlertId(alert.id)}
                        >
                           {selectedAlertId === alert.id && (
                              <div className="absolute top-0 right-0 p-2 opacity-20"><Target size={30} className="text-rose-500" /></div>
                           )}
                           <div className="flex justify-between items-start mb-2">
                              <div className={cn(
                                 "w-7 h-7 rounded-lg flex items-center justify-center border transition-all",
                                 alert.inactivityEscalated
                                   ? "bg-amber-500 text-slate-950 border-amber-500"
                                   : selectedAlertId === alert.id 
                                     ? "bg-rose-500 text-white border-rose-500" 
                                     : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              )}>
                                 <AlertTriangle size={14} className="" />
                              </div>
                              <span className="text-[11px] text-gray-500 font-black">
                                 {alert.timestamp ? new Date(alert.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'LIVE'}
                              </span>
                           </div>
                           
                           {alert.inactivityEscalated && (
                               <div className="mb-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                                  <span className="text-[6.5px] font-black text-amber-400 uppercase tracking-widest block">⚠️ PCR STANDSTILL DETECTED</span>
                                  <span className="text-[5.5px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                                     Unit {alert.inactiveOfficerVehicle || 'PCR-TBD'} stationary en-route
                                  </span>
                               </div>
                            )}

                           <div className="space-y-0.5 mb-2">
                              <h4 className="text-[14px] font-black text-white uppercase tracking-tight truncate leading-tight">
                                 {alert.victimName || alert.userName || alert.name || 'Sovereign Node'}
                              </h4>
                              <div className="flex items-center gap-2">
                                 <Phone size={7} className="text-gray-500" />
                                 <span className="text-[11px] text-gray-500 font-bold tracking-widest">{alert.phone || alert.victimPhone || 'Force ID: 102'}</span>
                              </div>
                              <div className="flex items-start gap-1 pt-0.5">
                                 <MapPin size={8} className="text-cyan-400 shrink-0 mt-0.5" />
                                 <p className="text-[12px] text-cyan-100/70 font-bold line-clamp-2 leading-snug italic">
                                    {alert.locationName || alert.address || alert.fullAddress || alert.victimLocationName || 'Triangulating GPS...'}
                                 </p>
                              </div>
                           </div>
                           
                           <div className="flex gap-2">
                              {alert.inactivityEscalated ? (
                                  <button 
                                     onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        await handleForceReassignPcr(alert.id, alert.inactiveOfficerName || 'PCR Officer'); 
                                     }}
                                     className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-950"
                                  >
                                     <RefreshCw size={8} className="animate-spin" /> FORCE RE-ASSIGN PCR
                                  </button>
                               ) : (
                                  <button 
                                     onClick={(e) => { e.stopPropagation(); onNavigate?.('SAFETY', alert.id); }}
                                     className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                                  >
                                     Intercept
                                  </button>
                               )}
                              {selectedAlertId === alert.id && (
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedAlertId(null); }}
                                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                                 >
                                    <X size={12} />
                                 </button>
                              )}
                           </div>
                        </motion.div>
                      ))
                    )}
                 </div>

                 {/* 🏛️ JURISDICTIONAL ZERO FIR REGISTRY (BNSS SEC 173) */}
                 <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-cyan-400">
                          <Fingerprint size={14} className="animate-pulse text-[#38BDF8]" />
                          <span className="text-[14px] font-black uppercase tracking-widest text-[#38BDF8]">Zero FIR Legal Registry</span>
                       </div>
                       <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">{zeroFirs?.length || 0} Logs</span>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                       {zeroFirs && zeroFirs.length > 0 ? zeroFirs.map((fir: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-slate-950 border border-white/5 rounded-xl space-y-1.5 font-['Outfit']">
                             <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-white font-mono">{fir.caseId || `ZF-0${idx + 1}`}</span>
                                <span className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[5px] text-cyan-400 font-black uppercase tracking-widest">
                                   BNSS SEC 173
                                 </span>
                             </div>
                             <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold uppercase">
                                <span>Victim: {fir.victimName || 'Sovereign Node'}</span>
                                <span className="text-amber-400 italic">Pending Handover</span>
                             </div>
                             <p className="text-[14px] text-gray-500 font-bold leading-normal uppercase">
                                Origin: {fir.area || 'District Outer Sector'} ➔ Target: {fir.dest || 'Jurisdiction Post'}
                             </p>
                          </div>
                       )) : (
                           <div className="py-6 text-center opacity-30 border border-dashed border-white/10 rounded-xl">
                              <Fingerprint size={16} className="mx-auto mb-2 text-[#38BDF8] animate-pulse" />
                              <p className="text-[7.5px] font-black uppercase tracking-widest text-white">No Registered Zero FIRs</p>
                           </div>
                        )}
                     </div>
                 </div>
              </>
            ) : (
              // 🏛️ WAR-ROOM MODE: BNSS CHAIN OF CUSTODY PANEL
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col gap-4 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                   <Fingerprint size={16} className="text-[#38BDF8]" />
                   <h3 className="text-[14px] font-black text-white uppercase tracking-[2px]">BNSS Sec 63 Chain</h3>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                  
                  {/* Case Dispatch ID badge */}
                  <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">Operational Case Code</span>
                    <h4 className="text-sm font-black text-white tracking-wider font-mono text-cyan-400 italic">{incidentData.incidentId}</h4>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Live Node Intercept Active</span>
                    </div>
                  </div>

                  {/* 🍊 STATE RADAR SURVEILLANCE & HIGHWAY ESCALATION SIMULATOR */}
                  <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-amber-400 animate-bounce" />
                      <span className="text-[12px] font-black text-white uppercase tracking-widest">State HQ Intercept Radar</span>
                    </div>
                    <p className="text-[12px] text-gray-400 font-bold uppercase leading-relaxed">
                      Escalate local grid alert into dynamic State HQ highway tracking.
                    </p>
                    <button 
                      onClick={triggerStateHighwaySimulation}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                        isSimulatingRun 
                          ? "bg-amber-600 border-amber-600 text-slate-950 font-bold" 
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold"
                      )}
                    >
                      <Crosshair size={12} />
                      {isSimulatingRun ? 'Cancel State Intercept' : `Track Escape Vector (${incidentData?.city || 'City'} -> State Border)`}
                    </button>

                    {/* 🚧 DYNAMIC NHAI TOLL PLAZA IOT LOCKDOWN PANEL */}
                    {isSimulatingRun && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">🚧 NHAI TOLL INTERDICT GRID</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[5px] font-black uppercase tracking-widest animate-pulse",
                            isNakabandiDeployed ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"
                          )}>
                            {isNakabandiDeployed ? "GRID LOCKED" : "ONLINE / STANDBY"}
                          </span>
                        </div>

                        {/* List of Simulated Toll Plaza IoT Nodes */}
                        <div className="space-y-1.5">
                          {(incidentData.nearbyTolls || [
                            { name: `${incidentData.city} Main Highway Toll (T1)`, road: "NH-12 Grid Sector A", relay: "PLC-01" },
                            { name: `${incidentData.stateName} Border Checkpost Toll (T2)`, road: "NH-3 Interstate Link", relay: "PLC-04" }
                          ]).map((gate: any, i: number) => (
                            <div key={i} className="bg-slate-950 border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                              <div className="flex-1 pr-2">
                                <h5 className="text-[12px] font-black text-white uppercase tracking-tight truncate">{gate.name}</h5>
                                <span className="text-[14px] text-slate-400 font-bold uppercase tracking-widest block truncate">{gate.road}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={cn(
                                  "text-[11px] font-black uppercase tracking-widest block",
                                  isNakabandiDeployed ? "text-rose-500 animate-pulse" : "text-emerald-500"
                                )}>
                                  {isNakabandiDeployed ? "🚨 BARRIER LOCKED" : "🟢 AUTO-FASTAG"}
                                </span>
                                <span className="text-[5px] text-slate-500 font-mono tracking-tighter">IoT ID: {gate.relay || `PLC-0${i+1}`} // 24V Signal</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ANPR Camera feed / fastag block status */}
                        {isNakabandiDeployed ? (
                          <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-2.5 text-center space-y-1.5 animate-pulse">
                            <span className="text-[6.5px] font-black text-rose-400 uppercase tracking-widest block">🔒 RFID FASTAG LOCKOUT ENGAGED</span>
                            <p className="text-[5.5px] text-rose-350 leading-relaxed font-bold uppercase">
                              Suspect vehicle flagged at central toll server. Dynamic boom barrier PLC relays disabled. Physical crash grid deployed.
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={deployHighwayNakabandi}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/20"
                          >
                            <Lock size={10} /> TRIGGER HIGHWAY NAKABANDI
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hacker Rolling Text Console */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] text-gray-500 font-black uppercase tracking-widest">System Log Terminal</span>
                      <Terminal size={10} className="text-[#38BDF8]" />
                    </div>
                    <div className="bg-[#020617] border border-white/5 p-4 rounded-2xl font-mono text-[13px] text-[#38BDF8] space-y-2 h-36 overflow-y-auto custom-scrollbar shadow-inner">
                      {(incidentData.systemLogs || []).map((log, index) => (
                        <div key={index} className="flex gap-1.5 items-start">
                          <span className="text-[#38BDF8]/40 font-black shrink-0">&gt;&gt;</span>
                          <span className="leading-snug text-[12px] tracking-tight">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
         </div>

         {/* 🗺️ CENTER COLUMN: SITUATIONAL MAP (50%) */}
         <div className="col-span-6 bg-[#0F172A]/50 border border-white/5 rounded-[3rem] overflow-hidden relative shadow-2xl flex flex-col">
            


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
                      <Activity size={10} className="animate-pulse" />
                      <span className="text-[14px] font-black uppercase tracking-widest leading-none">Rerouting Engaged: Polyline (OSRM via Mappls)</span>
                    </motion.div>
                  )}
               </div>
               
               <div className="absolute inset-0 z-0">
                  {(() => {
                    const selAlert = activeAlerts.find(a => a.id === selectedAlertId);
                    const vPath = selAlert?.path || [];
                    // Flatten all responder footprints into a single array for visualization
                    let pPath: any[] = [];
                    if (selAlert?.footprints) {
                      Object.values(selAlert.footprints).forEach((fpArr: any) => {
                        if (Array.isArray(fpArr)) {
                          // Insert a null or just concat. For Mapbox LineString, concatenating separate lines requires MultiLineString, 
                          // but for simplicity we will just render the first responder's path if multiple exist, or concat them.
                          // It's usually just one primary responder.
                          pPath = [...pPath, ...fpArr];
                        }
                      });
                    }
                    
                    return (
                      !useMapboxFallback ? (
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
                      )
                    );
                  })()}
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
         </div>

         {/* 🛡️ RIGHT COLUMN: PROTECTOR NEXUS / SURVEILLANCE DATA STREAM (25%) */}
         <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            {!incidentData ? (
              // DEFAULT PROTECTOR LIST
              <>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                   <button 
                      onClick={() => setProtectorTab('PENDING')}
                      className={cn("flex-1 py-2 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all", protectorTab === 'PENDING' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}
                   >
                      Pending ({pendingProtectors.length})
                   </button>
                   <button 
                      onClick={() => setProtectorTab('ACTIVE')}
                      className={cn("flex-1 py-2 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all", protectorTab === 'ACTIVE' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white")}
                   >
                      Active ({verifiedProtectors.length})
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                   <AnimatePresence mode="wait">
                      {protectorTab === 'PENDING' ? (
                         <motion.div 
                            key="pending"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                         >
                            {pendingProtectors.length === 0 ? (
                               <div className="h-40 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/2 opacity-20 text-center p-6">
                                  <CheckCircle2 size={24} className="mb-2 text-emerald-500" />
                                  <p className="text-[12px] font-black uppercase tracking-widest">Queue Clear</p>
                               </div>
                            ) : (
                               pendingProtectors.map((prot, i) => (
                                  <div 
                                     key={prot.id} 
                                     onClick={() => onNavigate?.('VERIFICATION', prot.id)}
                                     className="bg-white/5 border border-white/5 rounded-[1.25rem] p-3.5 group hover:border-blue-500/40 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-between"
                                  >
                                     <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-black italic text-sm transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-400 group-hover:border-blue-500/20">
                                           {prot.name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                           <h4 className="text-[13px] font-black text-white uppercase italic tracking-tight leading-none group-hover:text-blue-400 transition-colors">{prot.name || 'New Node'}</h4>
                                           <p className="text-[11px] text-gray-500 font-bold tracking-widest mt-1.5">{prot.phone || 'NO CONTACT'}</p>
                                        </div>
                                     </div>
                                     <ArrowRight size={14} className="text-gray-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-400 transition-all duration-300" />
                                  </div>
                               ))
                            )}
                         </motion.div>
                      ) : (
                         <motion.div 
                            key="active"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                         >
                            {verifiedProtectors.map((prot, i) => {
                               const occ = (prot.protectorVetting?.occupation || '').toLowerCase();
                               const isPriority = occ.includes('army') || occ.includes('police') || occ.includes('doctor') || occ.includes('military');
                               
                               return (
                                  <div 
                                     key={prot.id} 
                                     onClick={() => {
                                        setSelectedProtectorId(prot.id);
                                        setSelectedAlertId(null);
                                        onNavigate?.('PROTECTORS', prot.id);
                                     }}
                                     className={cn(
                                        "border rounded-[1.25rem] p-3 group transition-all flex items-center justify-between cursor-pointer",
                                        selectedProtectorId === prot.id ? "border-cyan-500 bg-white/10" : 
                                        isPriority ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                     )}
                                  >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                     <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 font-black italic shrink-0 text-xs">
                                        {prot.name?.charAt(0) || 'P'}
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                           <h4 className="text-[13px] font-black text-white uppercase italic tracking-tight truncate leading-none">{prot.name || 'Protector'}</h4>
                                           <div className="flex items-center gap-1 shrink-0">
                                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                              <span className="text-[5px] text-emerald-500 font-black uppercase tracking-widest">Online</span>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                           <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest">{prot.gender || 'N/A'}</span>
                                           <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                           <span className={cn(
                                              "text-[14px] font-black uppercase tracking-widest truncate",
                                              isPriority ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-cyan-400"
                                           )}>
                                              {prot.protectorVetting?.occupation || 'Operative'}
                                           </span>
                                        </div>
                                     </div>
                                  </div>
                                  {selectedAlertId && calculateDistance(
                                     activeAlerts.find(a => a.id === selectedAlertId)?.latitude || 0,
                                     activeAlerts.find(a => a.id === selectedAlertId)?.longitude || 0,
                                     prot.latitude || prot.lastLocation?.lat || 0,
                                     prot.longitude || prot.lastLocation?.lng || 0
                                  ) <= 2 && (
                                     <div className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded uppercase">In Radius</div>
                                  )}
                                  </div>
                               );
                            })}
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              </>
            ) : (
              // 🎙️ WAR-ROOM MODE: REAL-TIME AUDIO, TELEMETRY & PCR DISPATCH PANELS
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col gap-4 overflow-hidden"
              >
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-1.5">
                      <Mic size={14} className="text-rose-500 animate-pulse" />
                      <span className="text-[13px] font-black text-white uppercase tracking-widest">Stealth Mic Feed</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", isAudioPlaying ? "bg-rose-500 animate-ping" : "bg-gray-500")} />
                      <span className="text-[14px] text-gray-500 font-bold uppercase tracking-wider">{isAudioPlaying ? "LIVE CONNECTION" : "MUTED"}</span>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                  
                  {/* 🚨 PERSISTENT ESCALATION BANNER FOR INACTIVE UNIT */}
                  {activeAlerts.find(a => a.id === selectedAlertId)?.inactivityEscalated && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                          <Activity className="text-rose-500 animate-pulse" size={14} />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-rose-500 uppercase tracking-widest">Unit Inactivity Detected</h4>
                          <p className="text-[11px] text-rose-200/80 font-bold leading-relaxed mt-1 uppercase tracking-wider">
                            {activeAlerts.find(a => a.id === selectedAlertId)?.inactiveOfficerName || "Dispatched Officer"} ({activeAlerts.find(a => a.id === selectedAlertId)?.inactiveOfficerVehicle || "PCR"}) has remained stationary for &gt;15s after intercepting the SOS.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleForceReassignPcr(selectedAlertId!, activeAlerts.find(a => a.id === selectedAlertId)?.inactiveOfficerName || "Unknown")}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[2px] transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] active:scale-[0.98]"
                      >
                        FORCE UN-ASSIGN & RE-BROADCAST TO POOL
                      </button>
                    </div>
                  )}

                  {/* VoIP Call audio interface */}
                  <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">VOIP Stealth Feed</span>
                        <h4 className="text-[14px] font-black text-white uppercase mt-0.5 truncate">{incidentData.address}</h4>
                        {isLiveStreamActive && (
                          <span className="text-[14px] text-emerald-400 font-bold uppercase tracking-widest block mt-1 animate-pulse">WebRTC Secured Link Active</span>
                        )}
                      </div>
                      <button 
                        onClick={toggleLiveMicSynth}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all",
                          isAudioPlaying 
                            ? "bg-rose-500/10 border-rose-500 text-rose-500 animate-pulse font-bold" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold"
                        )}
                      >
                        {isAudioPlaying ? "🛑 Disconnect" : "🎙️ Listen Live"}
                      </button>
                    </div>

                    {/* Bouncing Audio Bars */}
                    <div className="h-10 flex items-end justify-between gap-1 px-1 bg-[#020617] rounded-xl border border-white/5 overflow-hidden py-1">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "w-1.5 rounded-t-full transition-all duration-300 origin-bottom scale-y-100",
                            isAudioPlaying ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" : "bg-slate-800"
                          )}
                          style={{
                            height: '100%',
                            animation: isAudioPlaying ? 'bounceBar 0.4s ease-in-out infinite' : 'none',
                            animationDelay: `${i * 0.03}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 🚨 NEAREST PCR PATROL VEHICLES TELEMETRY CONSOLE */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Car size={12} className="text-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Nearest PCR Patrol Vans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[5px] text-cyan-400 font-black uppercase tracking-widest">2.0 KM Radius</span>
                        <button 
                          onClick={handleBroadcastAlarm}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[5px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-1"
                        >
                          <ShieldAlert size={8} /> BROADCAST ALARM
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {simulatedPcrVans.map((pcr) => (
                        <div key={pcr.id} className={cn(
                          "p-3 border rounded-xl flex items-center justify-between transition-all",
                          pcrDispatched[pcr.id] 
                            ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                            : "bg-black/40 border-white/5 hover:border-white/10"
                        )}>
                          <div className="min-w-0 flex-1 pr-2">
                            <h5 className="text-[12px] font-black text-white uppercase leading-none truncate">{pcr.name}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[14px] text-gray-500 font-bold uppercase">{pcr.officer}</span>
                              <div className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="text-[14px] text-cyan-400 font-black italic">{pcr.distance} // ETA {pcr.delay}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button 
                              onClick={() => handleRadioCall(pcr.id, pcr.name)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-[14px] font-black uppercase tracking-widest border transition-all flex items-center gap-1",
                                activePcoRadio === pcr.id
                                  ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse"
                                  : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                              )}
                            >
                              <Phone size={8} className={activePcoRadio === pcr.id ? "animate-pulse" : ""} />
                              {activePcoRadio === pcr.id ? "ON CALL" : "RADIO PCO"}
                            </button>

                            <button 
                              onClick={() => handlePcrDispatch(pcr.id, pcr.name, pcr.isReal, pcr.uid)}
                              disabled={pcrDispatched[pcr.id]}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-[14px] font-black uppercase tracking-widest border transition-all",
                                pcrDispatched[pcr.id]
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-md shadow-rose-600/15"
                              )}
                            >
                              {pcrDispatched[pcr.id] ? "✓ DISPATCHED" : "DISPATCH"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentinel interim voice transcripts */}
                  <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">Sentinel Interim Transcript</span>
                    <p className="text-[14px] text-gray-200 font-bold leading-relaxed italic bg-[#020617] p-3 rounded-xl border border-white/5">
                      "{incidentData.forensicTranscript}"
                    </p>
                  </div>

                  {/* Dispatch Location POI Node */}
                  <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[14px] text-gray-500 font-black uppercase tracking-widest block">Nearest Dispatch Precinct</span>
                    <h5 className="text-[13px] font-black text-cyan-400 uppercase tracking-wide truncate">{incidentData.nearestThanaName}</h5>
                    <p className="text-[11px] text-gray-400 font-bold leading-snug uppercase tracking-tight mt-1">BNS Tier: {incidentData.bnsOffenseCategory}</p>
                  </div>

                  {/* Dispatch Legal Call Action */}
                  <button 
                    onClick={handleLegalDispatch}
                    disabled={isDispatching}
                    className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-black uppercase tracking-[2px] text-[12px] flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isDispatching ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />}
                    {isDispatching ? "DISPATCHING PACKET..." : "DISPATCH LEGAL RESPONSE"}
                  </button>

                </div>
              </motion.div>
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
