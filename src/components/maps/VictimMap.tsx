import React, { useEffect, useRef } from 'react';
import { PhoneCall, X, CheckCircle2, Navigation } from 'lucide-react';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const VictimMap = ({ 
  activeAlerts = [], 
  onClose, 
  isInterceptMode = false, 
  isNavigating = false,
  onToggleNav,
  onResolve,
  distance = '---'
}: { 
  activeAlerts?: any[], 
  onClose?: () => void, 
  isInterceptMode?: boolean, 
  isNavigating?: boolean,
  onToggleNav?: () => void,
  onResolve?: () => void,
  distance?: string
}) => {
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const routeLayerId = 'tactical-route';
  const beelineLayerId = 'off-road-beeline';

  useEffect(() => {
    const initMap = () => {
      const mb = (window as any).mapboxgl;
      if (!mapContainer.current || !mb || !mb.Map) {
        setTimeout(initMap, 500);
        return;
      }
      mb.accessToken = MAPBOX_TOKEN;
      const initialCoords = userPos ? [userPos[1], userPos[0]] : [78.9629, 20.5937]; 
      map.current = new mb.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: initialCoords as [number, number],
        zoom: userPos ? 16 : 4,
        pitch: 60,
        antialias: true
      });

      map.current.on('load', () => {
        const m = map.current;
        m.resize();
        
        // 🛡️ TACTICAL SOURCES
        m.addSource(routeLayerId, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
        m.addSource(beelineLayerId, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
        m.addSource('user-pos', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: initialCoords } } });
        m.addSource('victim-pos', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [] } } });

        // 🛣️ ROAD ROUTE LAYER
        m.addLayer({
          id: routeLayerId, type: 'line', source: routeLayerId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3B82F6', 'line-width': 6, 'line-opacity': 0.8, 'line-blur': 2 }
        });

        // 🌉 BEELINE LAYER
        m.addLayer({
          id: beelineLayerId, type: 'line', source: beelineLayerId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#FACC15', 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0.9 }
        });

        // 🚩 VICTIM ALERT PULSE LAYER
        m.addLayer({
          id: 'victim-pulse', type: 'circle', source: 'victim-pos',
          filter: ['!=', ['get', 'isTransitSOS'], true],
          paint: { 'circle-radius': 10, 'circle-color': '#EF4444', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' }
        });

        // 🛣️ VICTIM PATH TRACE (FOR PROTECTORS)
        m.addSource('victim-path', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
        m.addLayer({
          id: 'victim-path-layer', type: 'line', source: 'victim-path',
          paint: { 'line-color': '#EF4444', 'line-width': 4, 'line-opacity': 0.6, 'line-dasharray': [2, 1] }
        });
      });
    };
    initMap();
    return () => map.current?.remove();
  }, []);

  // 🛰️ LIVE NAVIGATION FOLLOW MODE
  useEffect(() => {
    if (map.current && userPos && isNavigating) {
      map.current.flyTo({
        center: [userPos[1], userPos[0]],
        zoom: 18,
        pitch: 60,
        bearing: 0,
        essential: true,
        duration: 2000
      });
    }
  }, [userPos, isNavigating]);

  const updateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const json = await query.json();
      if (json.routes && json.routes[0] && map.current && map.current.isStyleLoaded()) {
        map.current.getSource(routeLayerId).setData(json.routes[0].geometry);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const m = map.current;
    if (!m || !userPos) return;

    m.on('idle', () => {
      if (!m.isStyleLoaded()) return;

      // 🛡️ Sync User Pos
      if (m.getSource('user-pos')) {
        m.getSource('user-pos').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [userPos[1], userPos[0]] } });
      }

      const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding');
      if (activeAlert) {
        const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
        const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
        
        if (vLat && vLng) {
          // 🚩 Sync Victim Pos
          if (m.getSource('victim-pos')) {
            m.getSource('victim-pos').setData({ 
              type: 'Feature', 
              properties: { isTransitSOS: !!activeAlert.isTransitSOS },
              geometry: { type: 'Point', coordinates: [vLng, vLat] } 
            });
          }

          // 👣 Sync Victim Path Trace
          if (activeAlert.path && m.getSource('victim-path')) {
             const pathCoords = activeAlert.path.map((p: any) => Array.isArray(p) ? p : [p.lng, p.lat]);
             m.getSource('victim-path').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: pathCoords } });
          }

          // 🚗 UPDATE CAR MARKER IF TRANSIT SOS
          if (activeAlert.isTransitSOS) {
             let existingMarkerEl = document.getElementById(`v-marker-${activeAlert.id}`);
             if (!existingMarkerEl) {
                const el = document.createElement('div');
                el.id = `v-marker-${activeAlert.id}`;
                el.className = 'marker-transit-emergency';
                el.innerHTML = `
                  <div class="relative w-8 h-8 flex items-center justify-center">
                    <div class="absolute inset-0 bg-red-500/40 rounded-full animate-ping"></div>
                    <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                      <path d="M42 32C42 34.2091 40.2091 36 38 36H10C7.79086 36 6 34.2091 6 32V26C6 23.7909 7.79086 22 10 22H38C40.2091 22 42 23.7909 42 26V32Z" fill="#EF4444"/>
                      <path d="M12 22L16 14H32L36 22H12Z" fill="#F87171"/>
                    </svg>
                  </div>
                `;
                (window as any).mapboxgl.accessToken = MAPBOX_TOKEN;
                new (window as any).mapboxgl.Marker(el).setLngLat([vLng, vLat]).addTo(m);
             } else {
                // We'd ideally store the marker object, but for now we'll rely on the next refresh or manual move
             }
          }
          // 🌉 Sync Beeline
          if (m.getSource(beelineLayerId)) {
            m.getSource(beelineLayerId).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[userPos[1], userPos[0]], [vLng, vLat]] } });
          }
          // 🛣️ Sync Route
          updateRoute([userPos[1], userPos[0]], [vLng, vLat]);

          // 🎯 Target Lock Focus
          const mb = (window as any).mapboxgl;
          const bounds = new mb.LngLatBounds().extend([userPos[1], userPos[0]]).extend([vLng, vLat]);
          m.fitBounds(bounds, { padding: 100, maxZoom: 18, duration: 1500 });
        }
      } else {
        if (m.getSource('victim-pos')) m.getSource('victim-pos').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [] } });
        if (m.getSource(routeLayerId)) m.getSource(routeLayerId).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
        if (m.getSource(beelineLayerId)) m.getSource(beelineLayerId).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
        m.easeTo({ center: [userPos[1], userPos[0]], zoom: 16 });
      }
    });
  }, [userPos, activeAlerts]);

  const handleSecureCall = () => {
    const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding');
    if (activeAlert) {
      toast.info("Initiating KAVACH Secure Bridge...");
      setTimeout(() => { window.location.href = `tel:${activeAlert.victimPhone}`; }, 1500);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0F172A]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* 🛰️ LIVE STATUS PILL (ADAPTIVE POSITIONING) */}
      <div className={cn(
        "absolute left-6 z-[100] flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-lg transition-all",
        isInterceptMode ? "top-24" : "top-6"
      )}>
         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
         <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Live Tracking</span>
      </div>

      {/* ❌ RAPID EXIT COMMAND (TOP-LEFT - ONLY IN INTERCEPT MODE) */}
      {isInterceptMode && onClose && (
        <div className="absolute top-8 left-6 z-[1000] pointer-events-auto">
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white text-[#0F172A] rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all border border-gray-100"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* 📞 FLOATING SECURE CALL ICON (TOP-RIGHT) */}
      {isInterceptMode && (
        <div className="absolute top-24 right-6 z-[100] pointer-events-auto">
           <button 
             onClick={handleSecureCall}
             className="w-12 h-12 bg-white text-[#0F172A] rounded-2xl shadow-xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all border border-gray-100"
           >
             <PhoneCall size={20} strokeWidth={2.5} />
           </button>
        </div>
      )}

      {/* 🧭 GOOGLE MAPS STYLE BOTTOM SHEET (NAVIGATION HUD) */}
      {isInterceptMode && (
        <div className="absolute inset-x-0 bottom-6 px-4 z-[100] pointer-events-none">
          <div className="w-full max-w-[500px] mx-auto bg-white rounded-[32px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 pointer-events-auto flex flex-col gap-5 relative overflow-hidden">
            
            {/* Drag Handle (Visual Only) */}
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

            {/* Arrived Feedback Overlay */}
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
      `}</style>
    </div>
  );
};

export default VictimMap;
