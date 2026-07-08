import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Users, Navigation, ShieldAlert, User } from 'lucide-react';

import { useMapboxInit } from '../../hooks/mapbox/useMapboxInit';
import { useMapboxViewportLock } from '../../hooks/mapbox/useMapboxViewportLock';
import { useMapboxRoute } from '../../hooks/mapbox/useMapboxRoute';
import { useMapboxTelemetry } from '../../hooks/mapbox/useMapboxTelemetry';
import { useMapboxForensics } from '../../hooks/mapbox/useMapboxForensics';
import { useMapboxMarkers } from '../../hooks/mapbox/useMapboxMarkers';

interface CommandMapProps {
  activeAlerts: any[];
  activeProtectors: any[];
  pendingProtectors?: any[];
  activeFirs?: any[];
  activeJourneys?: any[];
  onAlertClick?: (id: string) => void;
  centerOverride?: [number, number];
  selectedState?: string;
  selectedAlertId?: string | null;
  selectedProtectorId?: string | null;
  isSovereignActive?: boolean;
  showHeatmap?: boolean;
  victimPath?: any[];
  protectorPath?: any[];
  safePath?: any[];
  projectedPath?: any[];
  replayProgress?: number;
}

export default function CommandMap({
  activeAlerts,
  activeProtectors,
  activeJourneys = [],
  selectedState = 'National',
  selectedAlertId,
  selectedProtectorId,
  victimPath = [],
  protectorPath = [],
  safePath = [],
  projectedPath = [],
  replayProgress = 1,
  onAlertClick
}: CommandMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const currentStyle = 'mapbox://styles/mapbox/streets-v12';

  const { isMapLoaded } = useMapboxInit(mapContainer, mapRef, currentStyle);
  useMapboxViewportLock(mapRef, isMapLoaded, selectedState, currentStyle);
  useMapboxRoute(mapRef, isMapLoaded, selectedAlertId, activeAlerts, activeProtectors, activeJourneys);
  const { metrics } = useMapboxTelemetry(selectedAlertId, activeAlerts, activeProtectors);
  useMapboxForensics(mapRef, isMapLoaded, victimPath, protectorPath, safePath, projectedPath, replayProgress);
  useMapboxMarkers(mapRef, isMapLoaded, activeAlerts, activeProtectors, activeJourneys, selectedAlertId, selectedProtectorId, onAlertClick);

  return (
    <div className="relative w-full h-full group">
      <div ref={mapContainer} className="w-full h-full" />

      {/* 🏛️ ADVANCED TACTICAL HUD */}
      <div className="absolute inset-x-8 top-8 flex justify-between items-start pointer-events-none z-[100]">
        {/* 📡 GRID STATUS HUD */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex gap-2"
        >
          <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-7 h-7 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 border border-rose-500/20">
              <AlertTriangle size={14} className="" />
            </div>
            <div>
              <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Active SOS</p>
              <p className="text-sm font-black text-white tabular-nums leading-none">{activeAlerts.length}</p>
            </div>
          </div>

          <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Users size={14} />
            </div>
            <div>
              <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Protectors</p>
              <p className="text-sm font-black text-white tabular-nums leading-none">{activeProtectors.length}</p>
            </div>
          </div>

          <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Navigation size={14} />
            </div>
            <div>
              <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Transits</p>
              <p className="text-sm font-black text-white tabular-nums leading-none">{activeJourneys.length}</p>
            </div>
          </div>
        </motion.div>

        {/* 🏹 MISSION INTEL HUD */}
        <AnimatePresence mode="wait">
          {selectedAlertId && activeAlerts.find(a => a.id === selectedAlertId) && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-rose-600/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-rose-600/20 max-w-sm pointer-events-auto"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-none">{activeAlerts.find(a => a.id === selectedAlertId)?.victimName || 'Citizen Rescue'}</h3>
                  <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] mt-1">High-Priority Mission</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Location Sector</p>
                  <p className="text-[10px] font-bold text-white line-clamp-2 leading-relaxed">
                    {activeAlerts.find(a => a.id === selectedAlertId)?.address || 'Sector Scanning...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-[9px] font-black text-white uppercase">{activeAlerts.find(a => a.id === selectedAlertId)?.status}</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Responders</p>
                    <p className="text-[9px] font-black text-white uppercase">
                      {(() => {
                        const responders = activeAlerts.find(a => a.id === selectedAlertId)?.activeResponders || [];
                        const uniqueResponders = responders.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i);
                        return uniqueResponders.length;
                      })()} Units
                    </p>
                  </div>
                </div>

                {/* Live Telemetry Predictor HUD */}
                <div className="bg-black/25 p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-white">
                    <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Intercept Vector</span>
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[5px] font-black rounded uppercase tracking-widest ">PREDICTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <p className="text-[6px] font-black text-white/40 uppercase tracking-wider mb-0.5">Closing Gap</p>
                      <p className="text-[11px] font-black text-cyan-300 italic tracking-tighter leading-none">{metrics.distance}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <p className="text-[6px] font-black text-white/40 uppercase tracking-wider mb-0.5">Est. Intercept</p>
                      <p className="text-[11px] font-black text-cyan-300 italic tracking-tighter leading-none">{metrics.eta}</p>
                    </div>
                  </div>
                </div>

                {/* Operator Alarm (Stale Check Warning) */}
                <AnimatePresence>
                  {metrics.isStale && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-rose-950/80 border border-rose-500/30 p-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-rose-950/40  text-left"
                    >
                      <div className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-500 shrink-0 border border-rose-500/20">
                        <AlertTriangle size={12} className="animate-spin" />
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-rose-400 uppercase tracking-widest leading-none">OPERATOR ALARM</p>
                        <p className="text-[9px] font-black text-white uppercase italic tracking-tight leading-none mt-1">
                          Stall Detected ({metrics.staleTimer}s Stagnant)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {selectedProtectorId && activeProtectors.find(p => p.id === selectedProtectorId) && !selectedAlertId && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-blue-600/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-blue-600/20 max-w-sm pointer-events-auto"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-none">{activeProtectors.find(p => p.id === selectedProtectorId)?.name}</h3>
                  <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] mt-1">Verified Grid Node</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Occupation</p>
                  <p className="text-[10px] font-bold text-white uppercase">{activeProtectors.find(p => p.id === selectedProtectorId)?.protectorVetting?.occupation || 'Operative'}</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Reliability</p>
                    <p className="text-[9px] font-black text-white tabular-nums">{(activeProtectors.find(p => p.id === selectedProtectorId)?.protectorVetting?.rating || 5).toFixed(1)} / 5.0</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Strikes</p>
                    <p className="text-[9px] font-black text-white tabular-nums">{(activeProtectors.find(p => p.id === selectedProtectorId)?.sosStrikeCount || 0)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛰️ SYSTEM COMPASS / COORDINATES */}
      <div className="absolute left-8 bottom-8 pointer-events-none z-[100]">
        <div className="bg-black/50 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full " />
          <span className="text-[8px] font-black text-white/50 uppercase tracking-[4px]">Mapbox V11 Strategic Engine</span>
        </div>
      </div>
    </div>
  );
}
