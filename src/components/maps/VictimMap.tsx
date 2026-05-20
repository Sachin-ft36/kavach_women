import React, { useEffect, useRef } from 'react';
import { PhoneCall, X, CheckCircle2, Navigation, Phone } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useCall } from '../../contexts/CallContext';
import { fetchRouteMappls } from '../../services/MapplsService';

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
  distance = '---',
  mapStyle = 'streets',
  customPos
}: { 
  activeAlerts?: any[], 
  onClose?: () => void, 
  isInterceptMode?: boolean, 
  isNavigating?: boolean,
  onToggleNav?: () => void,
  onResolve?: () => void,
  distance?: string,
  mapStyle?: 'streets' | 'satellite' | 'dark',
  customPos?: [number, number]
}) => {
  const { userPos } = useKavachStore();
  const activePos = customPos || userPos;
  const metrics = useSafetyIntelligence();
  const { initiateCall } = useCall();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{user?: mapboxgl.Marker, victim?: mapboxgl.Marker, path?: any}>({});
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if WebGL is supported to prevent crashes
    if (!mapboxgl.supported()) {
      console.warn("⚠️ KAVACH: WebGL is not supported on this browser. Map disabled.");
      return;
    }

    // Ensure container is empty before initializing (fixes strict mode duplicate render)
    mapContainer.current.innerHTML = '';

    // Mapbox expects [lng, lat]
    const initialCoords: [number, number] = activePos ? [activePos[1], activePos[0]] : [78.9629, 20.5937];

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCoords,
        zoom: 18,
        pitch: 60,
        bearing: 0,
        antialias: true
      });

      map.current.on('style.load', () => {
        console.log("🛰️ KAVACH: Mapbox Tactical Grid Online.");
        setIsMapLoaded(true);
      
      // Add 3D building layer
      if (map.current) {
        const layers = map.current.getStyle()?.layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        map.current.addLayer(
          {
            'id': 'add-3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId
        );

        // 🛡️ INITIALIZE 1KM SAFETY RADIUS
        map.current.addSource('safety-radius', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} }
        });

        map.current.addLayer({
          id: 'safety-radius-fill',
          type: 'fill',
          source: 'safety-radius',
          paint: {
            'fill-color': '#EF4444',
            'fill-opacity': 0.05
          }
        });

        map.current.addLayer({
          id: 'safety-radius-outline',
          type: 'line',
          source: 'safety-radius',
          paint: {
            'line-color': '#EF4444',
            'line-width': 2,
            'line-opacity': 0.3,
            'line-dasharray': [2, 2]
          }
        });
      }
    });

    } catch (error) {
      console.error("⚠️ KAVACH: Mapbox GL initialization failed:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 🛰️ HELPER: GENERATE 1KM CIRCLE POLYGON
  const getCirclePoints = (center: [number, number], radiusKm: number) => {
    const points = 64;
    const coords = [];
    const distanceX = radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]);
    return [coords];
  };

  // 🛰️ DYNAMIC MAP STYLE LAYER SYNC
  useEffect(() => {
    if (!map.current) return;
    
    let styleUrl = 'mapbox://styles/mapbox/streets-v12';
    if (mapStyle === 'satellite') {
      styleUrl = 'mapbox://styles/mapbox/satellite-streets-v12';
    } else if (mapStyle === 'dark') {
      styleUrl = 'mapbox://styles/mapbox/dark-v11';
    }
    
    // Clear old layers/markers before changing style to prevent duplicate ID crashes
    if (markersRef.current.user) { markersRef.current.user.remove(); delete markersRef.current.user; }
    if (markersRef.current.victim) { markersRef.current.victim.remove(); delete markersRef.current.victim; }
    
    setIsMapLoaded(false);
    map.current.setStyle(styleUrl);
  }, [mapStyle]);

  // 🛰️ USER LOCATION SYNC
  useEffect(() => {
    if (!map.current || !activePos || !isMapLoaded) return;
    const coords: [number, number] = [activePos[1], activePos[0]];

    // 🛡️ UPDATE SAFETY RADIUS VISUAL (Hide if in Intercept Mode)
    if (map.current.getSource('safety-radius')) {
      if (isInterceptMode) {
        if (map.current.getLayer('safety-radius-fill')) map.current.setLayoutProperty('safety-radius-fill', 'visibility', 'none');
        if (map.current.getLayer('safety-radius-outline')) map.current.setLayoutProperty('safety-radius-outline', 'visibility', 'none');
      } else {
        if (map.current.getLayer('safety-radius-fill')) {
          map.current.setLayoutProperty('safety-radius-fill', 'visibility', 'visible');
          const color = metrics.level === 'OPTIMAL' ? '#10B981' : metrics.level === 'CAUTION' ? '#F59E0B' : '#EF4444';
          map.current.setPaintProperty('safety-radius-fill', 'fill-color', color);
        }
        if (map.current.getLayer('safety-radius-outline')) {
          map.current.setLayoutProperty('safety-radius-outline', 'visibility', 'visible');
          const color = metrics.level === 'OPTIMAL' ? '#10B981' : metrics.level === 'CAUTION' ? '#F59E0B' : '#EF4444';
          map.current.setPaintProperty('safety-radius-outline', 'line-color', color);
        }
        
        (map.current.getSource('safety-radius') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: getCirclePoints(coords, 0.5) // 🛡️ Focus on 500m immediate safety
          },
          properties: {}
        });
      }
    }

    if (!markersRef.current.user) {
      const el = document.createElement('div');
      el.className = 'user-pos-marker';
      el.innerHTML = `<div style="width: 16px; height: 16px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);"></div>`;
      
      markersRef.current.user = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current);
    } else {
      markersRef.current.user.setLngLat(coords);
    }

    if (isNavigating) {
      map.current.setCenter(coords);
      map.current.setZoom(19);
    }
  }, [activePos, isNavigating, isMapLoaded]);

  // 🚨 VICTIM & ROUTE SYNC
  useEffect(() => {
    const m = map.current;
    if (!m || !activePos || !isMapLoaded) return;

    const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding');
    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
      
      if (vLat && vLng) {
        const vCoords: [number, number] = [vLng, vLat];
        const uCoords: [number, number] = [activePos[1], activePos[0]];

        // Update Victim Marker
        if (!markersRef.current.victim) {
          const el = document.createElement('div');
          el.className = 'victim-pos-marker';
          el.innerHTML = `<div style="width: 20px; height: 20px; background: #EF4444; border: 3px solid white; border-radius: 50%; shadow: 0 0 10px rgba(239, 68, 68, 0.4);"></div>`;
          markersRef.current.victim = new mapboxgl.Marker(el)
            .setLngLat(vCoords)
            .addTo(m);
        } else {
          markersRef.current.victim.setLngLat(vCoords);
        }

        // Update Route Source (Mappls Advanced Navigation Integration)
        const updateMapboxRoute = (coordinates: any[]) => {
          if (!m.getSource('route')) {
            m.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': coordinates
                }
              }
            });

            m.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'route',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#3B82F6', // Tactical Blue
                'line-width': 6,
                'line-opacity': 0.8
              }
            });
          } else {
            (m.getSource('route') as mapboxgl.GeoJSONSource).setData({
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': coordinates
              }
            });
          }
        };

        // Smart Re-fetching logic to avoid API spamming (only fetch if moved > ~10-20 meters)
        const prev = (window as any)._last_mappls_route_coords;
        const uLng = uCoords[0], uLat = uCoords[1];
        
        let shouldFetch = false;
        if (!prev) {
          shouldFetch = true;
        } else {
          const distSq = Math.pow(uLng - prev.uLng, 2) + Math.pow(uLat - prev.uLat, 2) + 
                         Math.pow(vLng - prev.vLng, 2) + Math.pow(vLat - prev.vLat, 2);
          if (distSq > 0.0000005) shouldFetch = true; // Roughly 15 meters
        }

        if (shouldFetch) {
          (window as any)._last_mappls_route_coords = { uLng, uLat, vLng, vLat };
          fetchRouteMappls(uLng, uLat, vLng, vLat).then(routePath => {
             let finalPath;
             if (routePath && routePath.length > 0) {
                 // 🚨 OFF-ROAD LAST-MILE VECTOR FIX:
                 // Mappls routes to the nearest drivable road. If the victim is deep in a forest, 
                 // inside a building compound, or down a cliff, we MUST draw a line from the 
                 // road's drop-off point directly to their raw GPS coordinates.
                 finalPath = [...routePath, vCoords];
             } else {
                 finalPath = [uCoords, vCoords];
             }
             updateMapboxRoute(finalPath);
          });
        } else {
          // If not fetching, ensure straight line is drawn if nothing else exists
          if (!m.getSource('route')) updateMapboxRoute([uCoords, vCoords]);
        }

        // Smart Camera Tracking
        if (!isNavigating) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(uCoords);
          bounds.extend(vCoords);
          m.fitBounds(bounds, { padding: 60, maxZoom: 18, pitch: 45 });
        } else {
          // Calculate heading/bearing so camera faces the victim from the protector's perspective
          const calculateBearing = (start: [number, number], end: [number, number]) => {
             const toRad = (deg: number) => deg * Math.PI / 180;
             const toDeg = (rad: number) => rad * 180 / Math.PI;
             const lon1 = toRad(start[0]), lat1 = toRad(start[1]);
             const lon2 = toRad(end[0]), lat2 = toRad(end[1]);
             const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
             const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
             return (toDeg(Math.atan2(y, x)) + 360) % 360;
          };

          // When navigating, camera locks behind the protector facing the victim
          const bearing = calculateBearing(uCoords, vCoords);
          m.easeTo({ 
            center: uCoords, 
            zoom: 18.5, 
            pitch: 65, // Tactical 3D Angle
            bearing: bearing, // Auto-rotate map to face victim
            duration: 1000 
          });
        }
      }
    } else {
      if (markersRef.current.victim) { markersRef.current.victim.remove(); delete markersRef.current.victim; }
      if (m.getLayer('route')) m.removeLayer('route');
      if (m.getSource('route')) m.removeSource('route');
      m.setCenter([activePos[1], activePos[0]]);
      m.setZoom(19);
    }
  }, [activePos, activeAlerts]);

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
      
      <div className={cn(
        "absolute left-6 z-[10] flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-lg transition-all",
        isInterceptMode ? "top-24" : "top-6"
      )}>
         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
         <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Live Tracking</span>
      </div>

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
      `}</style>
    </div>
  );
});

export default VictimMap;
