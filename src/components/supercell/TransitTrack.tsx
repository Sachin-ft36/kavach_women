import React, { useState, useEffect, useMemo } from 'react';
import {
  Car, Shield, History, Radar, ShieldAlert, Search,
  ChevronRight, Lock, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useCloudML } from '../../hooks/useCloudML';
import { PredictiveIntelResult } from '../../lib/predictiveIntel';
import CommandMap from '../maps/CommandMap';
import MapplsCommandMap from '../maps/MapplsCommandMap';

import { useTransitTrackData } from '../../hooks/useTransitTrackData';
import TransitInfraPanel from './transit/TransitInfraPanel';
import TransitPredictiveHUD from './transit/TransitPredictiveHUD';

interface TransitTrackProps {
  isSovereignActive?: boolean;
  userStatusMap?: Record<string, any>;
  externalSelectedId?: string | null;
  selectedState?: string;
  detectedAdminDistrict?: string | null;
}

export function TransitTrack({
  isSovereignActive,
  userStatusMap = {},
  externalSelectedId,
  selectedState = 'ALL',
  detectedAdminDistrict = null
}: TransitTrackProps) {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY' | 'MISSIONS' | 'INFRA'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [predictiveResults, setPredictiveResults] = useState<PredictiveIntelResult | null>(null);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  // ── Data ──
  const {
    activeJourneys, historicalJourneys, activeAlerts, activeProtectors, activeFirs,
    tollGates, setTollGates, trafficSignals, setTrafficSignals, anprLogs, startAnprSimulator
  } = useTransitTrackData();

  const { analyzeMissionVector, isAnalyzing, mlLatency } = useCloudML();

  // ── External selection sync ──
  useEffect(() => {
    if (!externalSelectedId) return;
    setSelectedJourneyId(externalSelectedId);
    if (historicalJourneys.some(hj => hj.id === externalSelectedId)) setSidebarTab('HISTORY');
    else if (activeAlerts.some(a => a.id === externalSelectedId)) setSidebarTab('MISSIONS');
    else setSidebarTab('LIVE');
  }, [externalSelectedId, historicalJourneys, activeAlerts]);

  // ── Sovereign Autopilot — gate/signal lockdown ──
  const selectedJourney = (
    sidebarTab === 'LIVE' ? activeJourneys
      : sidebarTab === 'HISTORY' ? historicalJourneys
      : activeAlerts
  ).find(j => j.id === selectedJourneyId);

  useEffect(() => {
    if (!selectedJourney || !isSovereignActive) return;
    const vLat = selectedJourney.latitude || selectedJourney.lat || selectedJourney.location?.latitude;
    const vLng = selectedJourney.longitude || selectedJourney.lng || selectedJourney.location?.longitude;
    if (!vLat || !vLng) return;

    let closestGate: any = null;
    let minDistance = Infinity;

    tollGates.forEach(gate => {
      const [gLng, gLat] = gate.coords;
      const R = 6371e3;
      const phi1 = vLat * Math.PI / 180;
      const phi2 = gLat * Math.PI / 180;
      const dp = (gLat - vLat) * Math.PI / 180;
      const dl = (gLng - vLng) * Math.PI / 180;
      const a = Math.sin(dp / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dl / 2) ** 2;
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (d < minDistance) { minDistance = d; closestGate = gate; }
    });

    if (!closestGate) return;

    const isEmergency = selectedJourney.status === 'emergency' || selectedJourney.isTransitSOS;
    if (isEmergency && minDistance <= 1000 && closestGate.status === 'OPEN') {
      setTollGates(prev => prev.map(g => g.id === closestGate.id ? { ...g, status: 'CLOSED' } : g));
      const targetSignalId = closestGate.id === 'TG-01' ? 'TS-01' : closestGate.id === 'TG-02' ? 'TS-02' : 'TS-03';
      setTrafficSignals(prev => prev.map(s => s.id === targetSignalId ? { ...s, status: 'ALL-RED LOCK' } : s));
      toast.error('🚨 AUTONOMOUS LOCKDOWN TRIGGERED!', {
        description: `Target vehicle inside 1km radius of ${closestGate.name}. Barrier CLOSED & Signals RED LOCK.`
      });
      try { const a = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3'); a.volume = 0.4; a.play(); } catch (e) {}
    }
  }, [selectedJourney, isSovereignActive, tollGates]);

  // ── Cloud ML ──
  useEffect(() => {
    if (!selectedJourney?.path || sidebarTab !== 'LIVE') { setPredictiveResults(null); return; }
    analyzeMissionVector(selectedJourney.path, selectedJourney.safePath || []).then(setPredictiveResults);
  }, [selectedJourney, sidebarTab, analyzeMissionVector]);

  const resolveIdentity = (item: any) => {
    const uid = item.victimUid || item.userId || item.uid;
    return userStatusMap[uid]?.name || item.userName || item.name || item.victimName || 'Citizen Profile';
  };

  const filteredItems = sidebarTab === 'LIVE'
    ? activeJourneys.filter(j => j.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || j.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()))
    : sidebarTab === 'HISTORY'
    ? historicalJourneys.filter(v => v.userName?.toLowerCase().includes(searchTerm.toLowerCase()))
    : activeAlerts.filter(a => a.victimName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      {/* ── LEFT COMMAND PANEL ── */}
      <aside className="w-[400px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl relative h-full">
        <div className="p-8 border-b border-white/5 bg-[#1E293B]">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl transition-all',
              sidebarTab === 'LIVE' ? 'bg-blue-600 shadow-blue-600/20' : sidebarTab === 'HISTORY' ? 'bg-emerald-600 shadow-emerald-600/20' : sidebarTab === 'MISSIONS' ? 'bg-rose-600 shadow-rose-600/20' : 'bg-amber-600 shadow-amber-600/20'
            )}>
              {sidebarTab === 'LIVE' ? <Radar size={24} strokeWidth={2.5} /> : sidebarTab === 'HISTORY' ? <History size={24} /> : sidebarTab === 'MISSIONS' ? <Shield size={24} /> : <Video size={24} />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-widest uppercase italic leading-none">
                {sidebarTab === 'LIVE' ? 'TransitIntel' : sidebarTab === 'HISTORY' ? 'Forensic Hub' : sidebarTab === 'MISSIONS' ? 'Mission Grid' : 'Transit Infra'}
              </h2>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-60 italic mt-1">Predictive SafePass Hub</p>
            </div>
          </div>

          <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-white/5 mb-6 overflow-x-auto gap-1">
            {([['LIVE', 'bg-blue-600'], ['MISSIONS', 'bg-rose-600'], ['HISTORY', 'bg-emerald-600'], ['INFRA', 'bg-amber-600']] as const).map(([tab, color]) => (
              <button
                key={tab}
                onClick={() => { setSidebarTab(tab as any); setSelectedJourneyId(null); setSelectedVictimId(null); }}
                className={cn('px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all shrink-0', sidebarTab === tab ? `${color} text-white shadow-lg` : 'text-gray-500 hover:text-white')}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text" placeholder="SCAN GRID ID..."
              className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0F172A]/30">
          {sidebarTab === 'INFRA' ? (
            <TransitInfraPanel
              tollGates={tollGates}
              setTollGates={setTollGates}
              trafficSignals={trafficSignals}
              setTrafficSignals={setTrafficSignals}
              anprLogs={anprLogs}
              isSovereignActive={isSovereignActive}
              startAnprSimulator={startAnprSimulator}
            />
          ) : (
            filteredItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => { setSelectedJourneyId(item.id); setSelectedVictimId(null); }}
                className={cn(
                  'p-5 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-white/5 group bg-[#1E293B]/50 relative overflow-hidden',
                  selectedJourneyId === item.id && 'bg-blue-600/10 border-blue-500/30',
                  item.status === 'emergency' && 'border-rose-500/50 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                )}
              >
                {item.status === 'emergency' && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10">EMERGENCY</div>
                )}
                {!isSovereignActive && item.status !== 'emergency' && <div className="absolute top-0 right-0 p-2 opacity-20"><Lock size={10} className="text-white" /></div>}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white border border-white/5 transition-all', item.status === 'emergency' ? 'bg-rose-600 shadow-lg shadow-rose-600/20' : 'bg-white/5')}>
                      {item.status === 'emergency' ? <ShieldAlert size={18} /> : <Car size={18} />}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase leading-none">{resolveIdentity(item)}</h4>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">{item.vehicleNo || 'Archive User'}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={cn('transition-all', item.status === 'emergency' ? 'text-rose-500' : 'text-gray-700')} />
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── MAP CENTER ── */}
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          {!useMapboxFallback ? (
            <MapplsCommandMap
              activeAlerts={activeAlerts} activeProtectors={activeProtectors}
              activeJourneys={sidebarTab === 'LIVE' ? activeJourneys : []}
              activeFirs={activeFirs} pendingProtectors={[]}
              selectedAlertId={selectedJourneyId} onAlertClick={setSelectedJourneyId}
              projectedPath={predictiveResults?.projection} safePath={selectedJourney?.safePath}
              isSovereignActive={isSovereignActive} selectedState={selectedState}
              onFallback={() => setUseMapboxFallback(true)}
            />
          ) : (
            <CommandMap
              activeAlerts={activeAlerts} activeProtectors={activeProtectors}
              activeJourneys={sidebarTab === 'LIVE' ? activeJourneys : []}
              activeFirs={activeFirs} pendingProtectors={[]}
              selectedAlertId={selectedJourneyId} onAlertClick={setSelectedJourneyId}
              projectedPath={predictiveResults?.projection} safePath={selectedJourney?.safePath}
              isSovereignActive={isSovereignActive} selectedState={selectedState}
            />
          )}

          {/* Predictive HUD */}
          <AnimatePresence>
            {selectedJourney && (
              <TransitPredictiveHUD
                selectedJourney={selectedJourney}
                predictiveResults={predictiveResults}
                isAnalyzing={isAnalyzing}
                mlLatency={mlLatency}
                isSovereignActive={isSovereignActive}
                selectedJourneyId={selectedJourneyId}
                resolveIdentity={resolveIdentity}
                onClose={() => setSelectedJourneyId(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
