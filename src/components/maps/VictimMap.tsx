import React, { useEffect, useRef } from 'react';
import { PhoneCall, X, CheckCircle2, Navigation, Phone } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useCall } from '../../contexts/CallContext';
import { fetchRouteMappls } from '../../services/MapplsService';
import { db } from '../../firebase';

import { useMapboxInit } from './hooks/useMapboxInit';
import { useMapSync } from './hooks/useMapSync';
import { useResponderTracking } from './hooks/useResponderTracking';
import { useVictimRouteSync } from './hooks/useVictimRouteSync';
import { useRideRouteSync } from './hooks/useRideRouteSync';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
mapboxgl.accessToken = MAPBOX_TOKEN;

import { useSafetyIntelligence } from '../../hooks/useSafetyIntelligence';

const VictimMap = React.memo(({
  activeAlerts = [],
  onClose,
  isInterceptMode = false,
  isNavigating = false,
  onToggleNav,
  onResolve,
  onAbort,
  distance = '---',
  mapStyle = 'streets',
  customPos,
  isCarHUD = false,
  isProtectorHUD = false,
  onVictimClick,
  guardianProtectors = []
}: {
  activeAlerts?: any[],
  onClose?: () => void,
  isInterceptMode?: boolean,
  isNavigating?: boolean,
  onToggleNav?: () => void,
  onResolve?: () => void,
  onAbort?: () => void,
  distance?: string,
  mapStyle?: 'streets' | 'satellite' | 'dark',
  customPos?: [number, number],
  isCarHUD?: boolean,
  isProtectorHUD?: boolean,
  onVictimClick?: () => void,
  guardianProtectors?: any[]
}) => {
  const { userPos, rideData, isRideModeActive } = useKavachStore();
  const activePos = React.useMemo(() => {
    if (customPos) return customPos;
    if (userPos && typeof userPos.lat === 'number' && typeof userPos.lng === 'number' && !isNaN(userPos.lat) && !isNaN(userPos.lng)) {
      return [userPos.lat, userPos.lng] as [number, number];
    }
    return null;
  }, [customPos, userPos?.lat, userPos?.lng]);
  const metrics = useSafetyIntelligence();
  const { initiateCall } = useCall();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ user?: mapboxgl.Marker, victim?: mapboxgl.Marker, destination?: mapboxgl.Marker, path?: any }>({});
  const isAutoTracking = useRef(true);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  // Initialize Mapbox
  useMapboxInit(map, mapContainer, activePos || null, setIsMapLoaded, isAutoTracking, isProtectorHUD);

  // Sync map style, user location, and safety radius
  useMapSync(map, markersRef, isMapLoaded, mapStyle, activePos || null, isNavigating, isInterceptMode, metrics, setIsMapLoaded, isCarHUD, isProtectorHUD);

  // Real-time PCR & Protector Tracking
  useResponderTracking(map, markersRef, isMapLoaded);

  // Victim and Route Sync (Mappls integration)
  useVictimRouteSync(map, markersRef, isMapLoaded, activePos || null, activeAlerts, isNavigating, isCarHUD, isAutoTracking, onVictimClick, isProtectorHUD, guardianProtectors);

  // Ride Safe Route Sync
  useRideRouteSync(map, markersRef, isMapLoaded, isRideModeActive, activePos || null);

  // 🛰️ RECENTER MAP EVENT LISTENER
  useEffect(() => {
    const handleRecenter = () => {
      isAutoTracking.current = true;
      if (map.current && activePos) {
        map.current.flyTo({
          center: [activePos[1], activePos[0]],
          zoom: 18,
          pitch: 60,
          duration: 1500,
          essential: true
        });
      }
    };
    window.addEventListener('recenter-map', handleRecenter);
    return () => window.removeEventListener('recenter-map', handleRecenter);
  }, [activePos]);

  const handleSecureCall = () => {
    const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding');
    if (activeAlert) {
      console.log("📞 KAVACH PROTECTOR: Initiating Tactical Uplink...", activeAlert);
      initiateCall(activeAlert.victimUid, activeAlert.victimName || "Victim", activeAlert.id);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0F172A] [contain:strict]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />



      {isInterceptMode && onClose && (
        <div className="absolute top-8 left-6 z-[20] pointer-events-auto">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white text-[#0F172A] rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all border border-gray-100"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      )}

      {isInterceptMode && (
        <div className="absolute top-24 right-6 z-[20] pointer-events-auto">
          <button
            onClick={handleSecureCall}
            className="w-12 h-12 bg-white text-[#0F172A] rounded-2xl shadow-xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all border border-gray-100"
          >
            <PhoneCall size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {isInterceptMode && (
        <div className="absolute inset-x-0 bottom-6 px-4 z-[20] pointer-events-none">
          <div className="w-full max-w-[500px] mx-auto bg-white rounded-[32px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto flex flex-col gap-5 relative overflow-hidden">

            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-100 rounded-full" />

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-[#0F172A] tracking-tighter">
                    {parseInt(distance) < 50 ? 'Arrived' : `${Math.ceil(parseInt(distance) / 250) || 1} min`}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {parseInt(distance) < 50 ? 'Now' : 'ETA'}
                  </span>
                </div>
                <p className="text-[9px] font-bold text-[#0F172A]/40 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  {distance} • {activeAlerts.find(a => a.status === 'responding')?.locationName || 'Main Road'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onAbort && (
                  <button
                    onClick={onAbort}
                    className="px-4 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all"
                  >
                    <span className="whitespace-nowrap">Stand Down</span>
                  </button>
                )}

                <button
                  onClick={onToggleNav}
                  className={cn(
                    "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-sm transition-all active:scale-95 flex items-center gap-2",
                    isNavigating
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-blue-600 text-white shadow-blue-600/20"
                  )}
                >
                  <Navigation size={12} fill={isNavigating ? "currentColor" : "none"} />
                  <span className="whitespace-nowrap">{isNavigating ? "Stop" : "Navigate"}</span>
                </button>

                <button
                  onClick={onResolve}
                  className={cn(
                    "px-4 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-[2px]",
                    parseInt(distance) < 50
                      ? "bg-emerald-500 text-white shadow-emerald-500/30"
                      : "bg-white text-emerald-600 border border-emerald-100"
                  )}
                >
                  <CheckCircle2 size={12} />
                  <span className="whitespace-nowrap">Safe</span>
                </button>
              </div>
            </div>

            {parseInt(distance) < 50 && (
              <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest leading-none">You’ve arrived at the victim location</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { opacity: 0.3; transform: scale(0.8); }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes guardian-sos-pulse {
          0%   { transform: scale(0.9); opacity: 0.9; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

export default VictimMap;
