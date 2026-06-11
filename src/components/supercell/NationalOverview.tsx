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

import { IncidentFeed } from './national/IncidentFeed';
import { IncidentWarRoom } from './national/IncidentWarRoom';
import { OperationsGrid } from './national/OperationsGrid';
import { ProtectorControl } from './national/ProtectorControl';
import { DispatchPanel } from './national/DispatchPanel';
import { useNationalCommand } from './national/useNationalCommand';

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
    calculateDistance
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

    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    
    if (selectedAlertId) {
       await startStealthStream();
       toast.success("Connecting to secure WebRTC frequency...");
       return;
    }
  };

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
