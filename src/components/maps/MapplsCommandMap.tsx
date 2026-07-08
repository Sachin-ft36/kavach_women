import React, { useEffect, useRef } from 'react';
import { useKavachStore } from '../../state/useKavachStore';
import { cn } from '../../lib/utils';
import { LocateFixed, Navigation } from 'lucide-react';

import { useMapplsInit } from '../../hooks/mappls/useMapplsInit';
import { useMapplsCockpit } from '../../hooks/mappls/useMapplsCockpit';
import { useMapplsTacticalRoute } from '../../hooks/mappls/useMapplsTacticalRoute';
import { useMapplsMarkers } from '../../hooks/mappls/useMapplsMarkers';
import { useMapplsPolylines } from '../../hooks/mappls/useMapplsPolylines';

interface MapplsCommandMapProps {
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
  dangerZonesKmlUrl?: string;
  jurisdictionKmlUrl?: string;
  onFallback?: () => void;
}

export default function MapplsCommandMap({
  activeAlerts,
  activeProtectors,
  activeJourneys = [],
  selectedAlertId,
  selectedState,
  victimPath,
  protectorPath,
  dangerZonesKmlUrl,
  jurisdictionKmlUrl,
  onFallback,
  onAlertClick
}: MapplsCommandMapProps) {
  const { userPos } = useKavachStore();
  
  // Shared Refs
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any[]>([]);
  const dangerKmlRef = useRef<any>(null);
  const jurisdictionKmlRef = useRef<any>(null);
  const commandCenterMarkerRef = useRef<any>(null);
  const lastUserPosRef = useRef<number[]>([0, 0]);
  const headingRef = useRef<number>(0);

  // 1. Initialization
  const { mapRef, isLoaded, mapStyle, mapId } = useMapplsInit(onFallback);

  // KML Initialization Effect
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    if (Mappls && Mappls.KmlLayer) {
      if (dangerZonesKmlUrl && !dangerKmlRef.current) {
        dangerKmlRef.current = new Mappls.KmlLayer({
          map: mapRef.current,
          url: dangerZonesKmlUrl,
          preserveViewport: true
        });
      }
      if (jurisdictionKmlUrl && !jurisdictionKmlRef.current) {
        jurisdictionKmlRef.current = new Mappls.KmlLayer({
          map: mapRef.current,
          url: jurisdictionKmlUrl,
          preserveViewport: true
        });
      }
    }
  }, [isLoaded, dangerZonesKmlUrl, jurisdictionKmlUrl]);

  // 2. Cockpit Mode
  const { isCockpitMode, handleFocusBase, handleFocusTarget } = useMapplsCockpit(
    mapRef, isLoaded, activeAlerts, activeProtectors, selectedAlertId, userPos, commandCenterMarkerRef, headingRef, lastUserPosRef
  );

  // 3. Tactical Route
  const { routeInfo, now } = useMapplsTacticalRoute(
    mapRef, isLoaded, activeAlerts, activeProtectors, activeJourneys, selectedAlertId, userPos, commandCenterMarkerRef, headingRef, lastUserPosRef
  );

  // 4. Markers
  useMapplsMarkers(mapRef, isLoaded, activeAlerts, activeProtectors, activeJourneys, selectedAlertId, markersRef, onAlertClick);

  // 5. Polylines
  useMapplsPolylines(mapRef, isLoaded, victimPath, protectorPath, polylineRef);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <style>{`
        .pulse-marker-victim {
          width: 20px; height: 20px;
          background: #EF4444; border: 3px solid white;
          border-radius: 50%; position: relative;
          box-shadow: 0 0 10px rgba(239,68,68,0.8);
          margin: 10px;
        }
        .pulse-marker-victim::after {
          content: ''; position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px;
          border-radius: 50%; border: 2px solid rgba(239,68,68,0.8);
          animation: radarPulse 1s ease-out infinite;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(2); opacity: 0; border-width: 1px; }
        }
        .pulse-marker-transit {
          width: 20px; height: 20px;
          background: #0EA5E9; border: 3px solid white;
          border-radius: 50%; position: relative;
          box-shadow: 0 0 15px rgba(14,165,233,0.9);
          margin: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-marker-transit::after {
          content: '🚗';
          font-size: 10px;
        }
        .pulse-marker-transit::before {
          content: ''; position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px;
          border-radius: 50%; border: 2px solid rgba(14,165,233,0.8);
          animation: radarPulseTransit 1.5s ease-out infinite;
        }
        @keyframes radarPulseTransit {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(2); opacity: 0; border-width: 1px; }
        }
        .police-car-container {
          position: relative;
          width: 100%; height: 100%;
          transition: transform 0.2s linear;
        }
        .police-car-svg {
          width: 100%; height: 100%;
          filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));
        }
        .police-beacon {
          position: absolute;
          top: 45%; left: 50%;
          transform: translate(-50%, -50%);
          width: 14px; height: 6px;
          border-radius: 3px;
          background: linear-gradient(90deg, #EF4444 50%, #3B82F6 50%);
          animation: flashingSiren 0.15s infinite linear;
          box-shadow: 0 0 20px rgba(239,68,68,1);
        }
        @keyframes flashingSiren {
          0%, 100% { background: linear-gradient(90deg, #EF4444 50%, #3B82F6 50%); filter: brightness(1.6); }
          50% { background: linear-gradient(90deg, #3B82F6 50%, #EF4444 50%); filter: brightness(1.2); }
        }
        /* Hide ALL native Mappls UI Controls permanently so they don't break */
        [class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"],
        .mappls-ctrl, .mapboxgl-ctrl, .mmi-ctrl, .mappls-control,
        [title="Map layers"], [title="Map Layers"] { 
          display: none !important; 
        }
        /* Completely hide Mappls tracking default bike/car icon */
        img[src*="ccp"], img[src*="bike"], img[src*="car"], img[src*="scooter"] {
          display: none !important;
        }
        /* 🚫 Hide ONLY the ugly Green Start/End Markers via precise CSS */
        div[title="Start"], div[title="End"], 
        .mappls-marker[style*="marker.png"], 
        .mapboxgl-marker[style*="marker.png"],
        .mapboxgl-popup, .mappls-popup {
          display: none !important;
        }
        /* Hidden native boxes to preserve HUD */
        .mappls-direction-box, .mappls-direction-step-container, 
        .mappls-direction-header, .mappls-direction-summary, .mappls-routing-box { 
          display: none !important; 
        }
      `}</style>
      <div id={mapId} className="absolute inset-0 w-full h-full" />

      {/* 🎯 MINIMAL NAVIGATION HUD */}
      {routeInfo && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
          <div className="bg-white rounded-[32px] px-2 py-2 flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] min-w-[320px] justify-between border border-gray-100">

            {/* Placeholder to keep center alignment */}
            <div className="w-12 h-12"></div>

            {/* ETA & Info */}
            <div className="flex flex-col items-center justify-center px-4">
              <span className="text-red-600 text-[26px] font-bold leading-none tracking-tight mb-1">
                {routeInfo.fetchTime
                  ? Math.max(0, Math.ceil((routeInfo.duration * 1000 - (now - routeInfo.fetchTime)) / 60000))
                  : Math.ceil(routeInfo.duration / 60)
                } min
              </span>
              <span className="text-gray-900 text-base font-medium">
                {(routeInfo.distance / 1000).toFixed(1)} km <span className="mx-1 text-gray-500">•</span> {
                  new Date((routeInfo.fetchTime || Date.now()) + routeInfo.duration * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                }
              </span>
            </div>

            {/* Route Icon */}
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="19" r="3" />
                <path d="M16 8l-5 4 4 4-5 3" />
              </svg>
            </div>

          </div>
        </div>
      )}

      {/* 🎯 TACTICAL HUD CONTROLS */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">

        <button
          onClick={handleFocusBase}
          className={cn(
            "w-12 h-12 backdrop-blur-md border rounded-full flex items-center justify-center transition-all group relative",
            isCockpitMode
              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] "
              : "bg-gray-900/80 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          )}
          title="Cockpit Lock"
        >
          <Navigation className="w-5 h-5" />
          <div className="absolute right-14 bg-black/80 px-3 py-2 rounded text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-cyan-500/30 text-cyan-300">
            {isCockpitMode ? 'Cockpit Locked' : 'Cockpit Mode'}
          </div>
        </button>

        {selectedAlertId && (
          <button
            onClick={handleFocusTarget}
            className="w-12 h-12 bg-gray-900/80 backdrop-blur-md border border-red-500/50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:scale-110 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] group relative"
            title="Lock Target"
          >
            <LocateFixed className="w-5 h-5" />
            <div className="absolute right-14 bg-black/80 px-3 py-2 rounded text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-red-500/30 text-red-400">
              Lock Target
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
