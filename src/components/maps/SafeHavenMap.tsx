import React, { useEffect, useRef, useState } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { fetchNearbyPoliceMappls, fetchRouteMappls } from '../../services/MapplsService';
import { X, Navigation, LocateFixed, Layers, ShieldCheck, Crosshair, MapPin, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "hiexfwnhftspmoasdsnuwukpxugoaljlqhls";

export default function SafeHavenMap({ onClose, initialTarget }: { onClose: () => void, initialTarget?: {lat: number, lng: number, name: string, dist?: string} }) {
  const { userPos, activeRadius } = useKavachStore();
  const mapRef = useRef<any>(null);
  const mapId = useRef(`mappls-safe-map-${Math.random().toString(36).substring(7)}`).current;
  const [isLoaded, setIsLoaded] = useState(false);
  const [policeStations, setPoliceStations] = useState<any[]>([]);
  const [protectors, setProtectors] = useState<any[]>([]);
  const [targetPoint, setTargetPoint] = useState<{lat: number, lng: number, name: string, type: 'police'|'protector', dist?: string} | null>(null);
  const directionPluginRef = useRef<any>(null);
  const prevTargetRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<'standard' | 'hybrid'>('standard');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all'|'police'|'pcr'|'civilian'>('all');

  useEffect(() => {
    let retryCount = 0;
    const checkAndInit = () => {
      if ((window as any).mappls) {
        initMap();
      } else {
        retryCount++;
        if (retryCount > 15) return;
        setTimeout(checkAndInit, 200);
      }
    };

    if (document.getElementById('mappls-sdk')) {
      checkAndInit();
      return;
    }

    const script = document.createElement('script');
    script.id = 'mappls-sdk';
    script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${REST_KEY}`;
    script.async = true;
    script.onload = () => {
      if (!document.getElementById('mappls-plugins')) {
        const pluginsScript = document.createElement('script');
        pluginsScript.id = 'mappls-plugins';
        pluginsScript.src = `https://sdk.mappls.com/map/sdk/plugins?access_token=${REST_KEY}&v=3.0`;
        pluginsScript.async = true;
        pluginsScript.onload = checkAndInit;
        document.body.appendChild(pluginsScript);
      } else {
        checkAndInit();
      }
    };
    document.body.appendChild(script);

    return () => {
      if (mapRef.current && typeof mapRef.current.remove === 'function') {
        try { mapRef.current.remove(); mapRef.current = null; } catch(e) {}
      }
    };
  }, []);

  const initMap = () => {
    const Mappls = (window as any).mappls;
    if (Mappls && !mapRef.current) {
      mapRef.current = new Mappls.Map(mapId, {
        center: [userPos?.[0] || 28.61, userPos?.[1] || 77.23],
        zoom: 14,
        mapType: 'standard',
        zoomControl: false, location: false, locationControl: false, mapTypeControl: false, layerControl: false, fullscreenControl: false, searchControl: false
      });

      // 🧼 Silencing Mappls sprite image missing warnings in console (e.g. agricultural_automotive)
      mapRef.current.on('styleimagemissing', (e: any) => {
        try {
          const width = 16;
          const bytesPerPixel = 4;
          const data = new Uint8Array(width * width * bytesPerPixel);
          mapRef.current.addImage(e.id, { width: width, height: width, data: data });
        } catch (err) {}
      });
      
      const controls = document.querySelectorAll('[class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"]');
      controls.forEach(c => (c as HTMLElement).style.display = 'none');

      mapRef.current.on('load', () => {
        setIsLoaded(true);
      });
    }
  };

  // Auto-Select Initial Target
  useEffect(() => {
    if (isLoaded && initialTarget && !targetPoint) {
      setTargetPoint({
        lat: initialTarget.lat,
        lng: initialTarget.lng,
        name: initialTarget.name,
        type: 'police',
        dist: initialTarget.dist || 'NEARBY'
      });
      setIsNavigating(true); // Auto-start navigation
    }
  }, [isLoaded, initialTarget]);

  // Fetch Data (Police & Protectors)
  useEffect(() => {
    if (!userPos) return;

    // Fetch Police
    fetchNearbyPoliceMappls(userPos[0], userPos[1]).then(stations => {
      if(stations) setPoliceStations(stations.slice(0, 15)); // Get up to 15 stations
    });

    // Fetch Protectors
    const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFound = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setProtectors(allFound.filter(p => p.coords));
    });

    return () => unsubscribe();
  }, [userPos]);

  // Render Markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Removed User Marker logic from here to its own useEffect

    // Draw Police Stations
    if (activeFilter === 'all' || activeFilter === 'police') {
      policeStations.forEach(station => {
        if (!station.lat || !station.lng) return;
        const marker = new Mappls.Marker({
          map: mapRef.current,
          position: { lat: station.lat, lng: station.lng },
          html: `<div class="tactical-marker police">🚨</div>`,
          width: 32, height: 32, offset: [16, 16]
        });
        marker.addListener('click', () => {
          setTargetPoint({ lat: station.lat, lng: station.lng, name: station.name, type: 'police', dist: station.dist });
        });
        markersRef.current.push(marker);
      });
    }

    // Draw Protectors / PCR
    protectors.forEach(p => {
      if (!p.coords) return;
      const isPCR = p.protectorVetting?.occupation?.toLowerCase().includes('police');
      
      if (activeFilter !== 'all') {
         if (activeFilter === 'pcr' && !isPCR) return;
         if (activeFilter === 'civilian' && isPCR) return;
         if (activeFilter === 'police') return;
      }

      const marker = new Mappls.Marker({
        map: mapRef.current,
        position: { lat: p.coords[0], lng: p.coords[1] },
        html: `<div class="tactical-marker ${isPCR ? 'pcr' : 'protector'}">${isPCR ? '🚓' : '🛡️'}</div>`,
        width: 32, height: 32, offset: [16, 16]
      });
      marker.addListener('click', () => {
        setTargetPoint({ lat: p.coords[0], lng: p.coords[1], name: isPCR ? 'PCR Van' : (p.name || 'Protector'), type: 'protector', dist: 'LIVE' });
      });
      markersRef.current.push(marker);
    });

  }, [isLoaded, policeStations, protectors, activeFilter]);

  // Handle User Marker (Pulse when idle, Navigation Dot when routing)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;

    const isNavMode = !!targetPoint;
    
    // 🔥 CLUTTER REDUCTION: Hide our manual user dot if the bike is routing
    if (isNavMode) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const markerHTML = `<div class="pulse-marker-victim"></div>`;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new Mappls.Marker({
        map: mapRef.current,
        position: { lat: userPos[0], lng: userPos[1] },
        html: markerHTML,
        width: 36, height: 36, offset: [18, 18]
      });
    } else {
      userMarkerRef.current.setPosition({ lat: userPos[0], lng: userPos[1] });
      // Update HTML if state changes
      if (userMarkerRef.current.getPopup() || true) { // Hack to update inner HTML on Mappls Marker
         const el = userMarkerRef.current._element;
         if (el && el.innerHTML !== markerHTML) {
            el.innerHTML = markerHTML;
         }
      }
    }
  }, [isLoaded, userPos, targetPoint]);

  const handleFilterClick = (filter: 'police' | 'pcr' | 'civilian') => {
    const newFilter = activeFilter === filter ? 'all' : filter;
    setActiveFilter(newFilter);
    setIsCameraLocked(false);
    
    if (mapRef.current && userPos) {
      if (typeof mapRef.current.setPitch === 'function') mapRef.current.setPitch(0);
      let minLat = userPos[0], maxLat = userPos[0];
      let minLng = userPos[1], maxLng = userPos[1];

      if (newFilter === 'all' || newFilter === 'police') {
        policeStations.forEach(s => {
          if(s.lat && s.lng) {
            if(s.lat < minLat) minLat = s.lat; if(s.lat > maxLat) maxLat = s.lat;
            if(s.lng < minLng) minLng = s.lng; if(s.lng > maxLng) maxLng = s.lng;
          }
        });
      }

      protectors.forEach(p => {
        if(p.coords) {
          const isPCR = p.protectorVetting?.occupation?.toLowerCase().includes('police');
          if (newFilter !== 'all' && newFilter === 'pcr' && !isPCR) return;
          if (newFilter !== 'all' && newFilter === 'civilian' && isPCR) return;
          if (newFilter === 'police') return;

          if(p.coords[0] < minLat) minLat = p.coords[0]; if(p.coords[0] > maxLat) maxLat = p.coords[0];
          if(p.coords[1] < minLng) minLng = p.coords[1]; if(p.coords[1] > maxLng) maxLng = p.coords[1];
        }
      });

      mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 15 });
    }
  };

  // Handle Routing when a target is selected
  useEffect(() => {
    if (!targetPoint || !userPos || !isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    const isNewTarget = !prevTargetRef.current || prevTargetRef.current.lat !== targetPoint.lat || prevTargetRef.current.lng !== targetPoint.lng;

    if (isNewTarget) {
      if (directionPluginRef.current) {
        try {
          if (typeof directionPluginRef.current.remove === 'function') directionPluginRef.current.remove();
        } catch (e) {}
        directionPluginRef.current = null;
      }
      prevTargetRef.current = targetPoint;
    }

    // Clean up any stray manual layers if they exist
    if (mapRef.current.getLayer('custom-route-layer')) mapRef.current.removeLayer('custom-route-layer');
    if (mapRef.current.getSource('custom-route-source')) mapRef.current.removeSource('custom-route-source');

    if (!directionPluginRef.current) {
      try {
        // 🔥 Initialize Native Tracking Engine once per target
        Mappls.tracking({
          map: mapRef.current,
          start: { geoposition: `${userPos[0]},${userPos[1]}` },
          end: { geoposition: `${targetPoint.lat},${targetPoint.lng}` },
          strokeWidth: 0, // Hide native line to prevent artifacts, we draw our own geojson below!
          routeColor: "transparent",
          ccpIconWidth: 70, // 🔥 Large animated bike/car icon
          profile: 'driving', // 🚗 Use driving profile for full database support in tier-2/3 cities like Rewa
          resource: 'route_eta',
          traffic: false,
          alternatives: false,
          fitBounds: !isNavigating,
          sPopup: "", dPopup: "",
          start_icon: "", // 🔥 Force hide mappls native start marker
          end_icon: "", // 🔥 Force hide mappls native end marker
        }, function (data: any) {
          directionPluginRef.current = data;
          if (isNavigating && data && data.trackingCall) {
            try {
              // Immediately engage heading and centering if navigation was already active
              data.trackingCall({
                location: [userPos[1], userPos[0]],
                heading: isCameraLocked,
                mapCenter: isCameraLocked,
                buffer: 50, delay: 2000, fitBounds: false
              });
            } catch (e) {
              console.warn("Mappls trackingCall failed:", e);
            }
          }
        });
      } catch (err) {
        console.error("Mappls tracking plugin crashed:", err);
      }
    } else if (directionPluginRef.current.trackingCall) {
      try {
        // 🚁 Smooth Camera Chase: Dynamically move bike & rotate map
        directionPluginRef.current.trackingCall({
          location: [userPos[1], userPos[0]],
          reRoute: true,
          heading: isNavigating && isCameraLocked,    // 🎯 Rotates map towards movement direction if locked
          mapCenter: isNavigating && isCameraLocked,  // 🎯 Auto-centers map on the girl if locked
          buffer: 50,
          delay: 2000,
          fitBounds: false
        });
      } catch (e) {
        console.warn("Mappls trackingCall failed during update:", e);
      }
    }

    // 🛡️ Mapbox GL Fallback Line Drawing (Bulletproof)
    fetchRouteMappls(userPos[1], userPos[0], targetPoint.lng, targetPoint.lat)
      .then(coords => {
        if (coords && coords.length > 0 && mapRef.current) {
          const routeGeoJSON = {
            type: 'LineString',
            coordinates: coords // fetchRouteMappls already returns [[lng, lat]]
          };
          const map = mapRef.current;
          const sourceId = 'custom-route-source';
          const layerId = 'custom-route-layer';

          if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(routeGeoJSON);
          } else {
            map.addSource(sourceId, { type: 'geojson', data: routeGeoJSON });
            
            // Background outline for better visibility
            map.addLayer({
              id: layerId + '-outline', type: 'line', source: sourceId,
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': targetPoint.type === 'police' ? '#1E40AF' : '#047857', 'line-width': 8, 'line-opacity': 0.6 }
            });
            
            // Main route line (Flawless road snapping)
            map.addLayer({
              id: layerId, type: 'line', source: sourceId,
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': targetPoint.type === 'police' ? '#3B82F6' : '#10B981', 'line-width': 5, 'line-opacity': 1 }
            });
          }
        }
      })
      .catch(err => console.warn("🚨 Fallback Route drawing failed:", err));

  }, [targetPoint, userPos, isLoaded, isNavigating, isCameraLocked]);

  const toggleMapStyle = () => {
    const Mappls = (window as any).mappls;
    if (mapRef.current && Mappls) {
      const newStyle = mapStyle === 'standard' ? 'hybrid' : 'standard';
      try { Mappls.setLayer(newStyle === 'standard' ? 'vector' : 'hybrid'); } 
      catch (e) {
        if (typeof mapRef.current.setMapType === 'function') mapRef.current.setMapType(newStyle);
        else if (typeof mapRef.current.setStyle === 'function') mapRef.current.setStyle(newStyle);
      }
      setMapStyle(newStyle);
    }
  };

  const startInternalNav = () => {
    if (!targetPoint || !userPos || !mapRef.current) return;
    setIsNavigating(true);
    // Center map on user, zoom in, and tilt the camera for 3D navigation view
    mapRef.current.setCenter({ lat: userPos[0], lng: userPos[1] });
    mapRef.current.setZoom(18);
    setIsCameraLocked(true);
    if (typeof mapRef.current.setPitch === 'function') {
      mapRef.current.setPitch(60);
    }
    toast.success(`Navigating to ${targetPoint.name}`);
  };

  const handleRecenter = () => {
    if (mapRef.current && userPos) {
      mapRef.current.setCenter({ lat: userPos[0], lng: userPos[1] });
      mapRef.current.setZoom(17);
      setIsCameraLocked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <style>{`
        .tactical-marker {
          width: 32px; height: 32px;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 14px; cursor: pointer; transition: all 0.2s;
        }
        .tactical-marker.police { border-color: #3B82F6; }
        .tactical-marker.pcr { border-color: #F59E0B; }
        .tactical-marker.protector { border-color: #10B981; }
        .tactical-marker:active { transform: scale(0.9); }
        .pulse-marker-victim {
          width: 20px; height: 20px;
          background: #EF4444; border: 3px solid white;
          border-radius: 50%; position: relative;
          margin: 15px; 
        }
        .nav-pulse-marker {
          width: 24px; height: 24px;
          background: #3B82F6; border: 4px solid white;
          border-radius: 50%; position: relative;
          margin: 12px;
        }
        div[title="Start"], div[title="End"], .mappls-popup, .mapboxgl-popup { display: none !important; }
        [class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"] { display: none !important; }
        .mappls-direction-box, .mappls-layer-control, .mappls-control-layer, .layer-control, div[title="Map Layers"] { display: none !important; }
      `}</style>

      <div id={mapId} style={{ width: '100%', height: '100%' }} />

      {/* Top Header Area: Close Button + Legend */}
      <div className="absolute top-8 left-4 right-4 z-[20] flex items-center justify-between gap-2 max-w-[500px] mx-auto">
        {/* Close Button */}
        <button onClick={onClose} className="w-10 h-10 shrink-0 bg-[#050B14] shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-white rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Premium Map Legend (Click to Filter & Zoom) */}
        {!initialTarget && (
          <div className="flex-1 bg-[#141416] border border-[#2A2A2D] p-1 rounded-full flex items-center gap-1">
            
            <button 
              onClick={() => handleFilterClick('police')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 border", 
                activeFilter === 'police' 
                  ? "bg-blue-500/20 border-blue-500/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.3)] scale-[1.02]" 
                  : activeFilter === 'all' 
                    ? "bg-white/5 border-white/5 hover:bg-white/10" 
                    : "bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
               <span className="text-[11px] drop-shadow-md">🚨</span>
               <span className={cn("text-[7px] font-black uppercase tracking-wider", activeFilter === 'police' ? "text-blue-400" : "text-white/90")}>Station</span>
            </button>
            
            <button 
              onClick={() => handleFilterClick('pcr')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 border", 
                activeFilter === 'pcr' 
                  ? "bg-amber-500/20 border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]" 
                  : activeFilter === 'all' 
                    ? "bg-white/5 border-white/5 hover:bg-white/10" 
                    : "bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
               <span className="text-[11px] drop-shadow-md">🚓</span>
               <span className={cn("text-[7px] font-black uppercase tracking-wider", activeFilter === 'pcr' ? "text-amber-400" : "text-white/90")}>PCR</span>
            </button>

            <button 
              onClick={() => handleFilterClick('civilian')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 border", 
                activeFilter === 'civilian' 
                  ? "bg-emerald-500/20 border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]" 
                  : activeFilter === 'all' 
                    ? "bg-white/5 border-white/5 hover:bg-white/10" 
                    : "bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
               <span className="text-[11px] drop-shadow-md">🛡️</span>
               <span className={cn("text-[7px] font-black uppercase tracking-wider", activeFilter === 'civilian' ? "text-emerald-400" : "text-white/90")}>Civilian</span>
            </button>

          </div>
        )}
      </div>

      {/* 🚀 BULLETPROOF REACT MAP CONTROLS - VERTICALLY CENTERED */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[20] flex flex-col gap-3 pointer-events-auto">
        {/* Recenter / My Location */}
        <button 
          onClick={handleRecenter} 
          className="w-12 h-12 bg-[#141416] rounded-2xl border border-[#2A2A2D] flex items-center justify-center active:scale-90 transition-transform group"
        >
          <LocateFixed size={22} className={cn("transition-colors", isCameraLocked ? "text-blue-500" : "text-gray-400 group-hover:text-white")} />
        </button>
      </div>

      {/* Selected Target HUD or Active Navigation HUD */}
      <AnimatePresence>
        {targetPoint && !isNavigating && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-8 inset-x-4 z-[20]"
          >
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-3xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {targetPoint.type === 'police' ? 'Verified Station' : 'Active Unit'}
                  </span>
                  <h3 className="text-white font-black text-lg mt-2 leading-tight pr-4">{targetPoint.name}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                    <Activity size={10} className="text-emerald-500" /> 
                    {targetPoint.dist || 'Calculating ETA...'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                    {targetPoint.type === 'police' ? <ShieldCheck size={24} /> : <Navigation size={20} />}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTargetPoint(null)}
                  className="w-full py-3.5 rounded-[16px] font-bold text-[11px] uppercase tracking-wider border border-white/10 text-white/70 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={startInternalNav}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[16px] font-bold text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={14} /> Navigate
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isNavigating && targetPoint && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[30] w-11/12 max-w-sm"
          >
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                   <Navigation size={20} className="text-emerald-400" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Navigating To</span>
                  <h3 className="text-white font-black text-sm truncate">{targetPoint.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsNavigating(false);
                  if (mapRef.current && typeof mapRef.current.setPitch === 'function') {
                    mapRef.current.setPitch(0); // Reset pitch
                  }
                }}
                className="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-all flex-shrink-0 ml-2"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
