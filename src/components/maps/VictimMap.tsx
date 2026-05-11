import React, { useEffect, useRef } from 'react';
import { PhoneCall, X, CheckCircle2, Navigation, Phone } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useCall } from '../../contexts/CallContext';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
mapboxgl.accessToken = MAPBOX_TOKEN;

const VictimMap = React.memo(({ 
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
  const { initiateCall } = useCall();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{user?: mapboxgl.Marker, victim?: mapboxgl.Marker, path?: any}>({});
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Mapbox expects [lng, lat]
    const initialCoords: [number, number] = userPos ? [userPos[1], userPos[0]] : [78.9629, 20.5937];

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

    return () => {
      if (map.current) map.current.remove();
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

  // 🛰️ USER LOCATION SYNC
  useEffect(() => {
    if (!map.current || !userPos || !isMapLoaded) return;
    const coords: [number, number] = [userPos[1], userPos[0]];

    // 🛡️ UPDATE SAFETY RADIUS VISUAL
    if (map.current.getSource('safety-radius')) {
      (map.current.getSource('safety-radius') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: getCirclePoints(coords, 1.0)
        },
        properties: {}
      });
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
      map.current.setZoom(18);
    }
  }, [userPos, isNavigating, isMapLoaded]);

  // 🚨 VICTIM & ROUTE SYNC
  useEffect(() => {
    const m = map.current;
    if (!m || !userPos || !isMapLoaded) return;

    const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding');
    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
      
      if (vLat && vLng) {
        const vCoords: [number, number] = [vLng, vLat];
        const uCoords: [number, number] = [userPos[1], userPos[0]];

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

        // Update Route Source
        if (m.getSource('route')) {
          (m.getSource('route') as mapboxgl.GeoJSONSource).setData({
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [uCoords, vCoords]
            }
          });
        } else {
          m.addSource('route', {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': [uCoords, vCoords]
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
              'line-color': '#3B82F6',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });
        }

        // Fit Bounds
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(uCoords);
        bounds.extend(vCoords);
        m.fitBounds(bounds, { padding: 100 });
      }
    } else {
      if (markersRef.current.victim) { markersRef.current.victim.remove(); delete markersRef.current.victim; }
      if (m.getLayer('route')) m.removeLayer('route');
      if (m.getSource('route')) m.removeSource('route');
      m.setCenter([userPos[1], userPos[0]]);
      m.setZoom(16);
    }
  }, [userPos, activeAlerts]);

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
