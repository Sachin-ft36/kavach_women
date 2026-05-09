import React, { useEffect, useRef, memo } from 'react';
import { Zap } from 'lucide-react';
import { useKavachStore } from '../../store/useKavachStore';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const ProtectorMap = memo(({ nearbyAlerts = [], nearbyRides = [], activeProtectors = [], acceptedSOSId = null, hideHeader = false }: { nearbyAlerts?: any[], nearbyRides?: any[], activeProtectors?: any[], acceptedSOSId?: string | null, hideHeader?: boolean }) => {
  const { userPos, user } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const alertMarkers = useRef<{ [key: string]: any }>({});
  const rideMarkers = useRef<{ [key: string]: any }>({});
  const colleagueMarkers = useRef<{ [key: string]: any }>({});

  // 1. Initialize Map
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
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialCoords as [number, number],
        zoom: userPos ? 15 : 4,
        pitch: 45,
        antialias: true
      });

      map.current.on('load', () => {
        if (!map.current) return;
        
        // ⚡ TACTICAL PURSUIT LAYERS
        map.current.addSource('pursuit-line', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        // Victim's Footprints (Trail)
        map.current.addLayer({
          id: 'victim-footprints',
          type: 'line',
          source: 'pursuit-line',
          filter: ['==', ['get', 'type'], 'footprint'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 
            'line-color': '#EF4444', 
            'line-width': 4, 
            'line-opacity': 0.6,
            'line-dasharray': [1, 1] 
          }
        });

        // Interception Route (Navigation)
        map.current.addLayer({
          id: 'interception-route',
          type: 'line',
          source: 'pursuit-line',
          filter: ['==', ['get', 'type'], 'route'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 
            'line-color': '#10B981', 
            'line-width': 6, 
            'line-opacity': 0.8
          }
        });

        map.current.resize(); 
      });

      map.current.on('error', (e: any) => {
        if (map.current) map.current.setStyle('mapbox://styles/mapbox/streets-v11');
      });

      map.current.addControl(new mb.NavigationControl(), 'bottom-right');
    };

    initMap();

    return () => {
      Object.values(alertMarkers.current).forEach(m => m.remove());
      Object.values(rideMarkers.current).forEach(m => m.remove());
      Object.values(colleagueMarkers.current).forEach(m => m.remove());
      if (userMarker.current) userMarker.current.remove();
      map.current?.remove();
    };
  }, []);

  // 2. High-Precision Auto-Follow (1s Sync)
  useEffect(() => {
    if (!map.current || !userPos) return;

    map.current.easeTo({
      center: [userPos[1], userPos[0]],
      zoom: map.current.getZoom() < 10 ? 15 : map.current.getZoom(),
      duration: 1000, 
      essential: true
    });

    if (!userMarker.current) {
      const mb = (window as any).mapboxgl;
      if (!mb) return;
      const el = document.createElement('div');
      el.className = 'user-location-dot';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; background: rgba(37, 99, 235, 0.2); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
          <div style="background: #2563EB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(37, 99, 235, 0.6); position: relative; z-index: 2;"></div>
        </div>
      `;
      userMarker.current = new mb.Marker(el)
        .setLngLat([userPos[1], userPos[0]])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userPos[1], userPos[0]]);
    }
  }, [userPos]);

  // 3. Pursuit Data Rendering (Footprints + Navigation)
  useEffect(() => {
    if (!map.current || !map.current.getSource('pursuit-line')) return;

    const features = [];

    // 👣 Render Victim Footprints
    [...nearbyAlerts, ...nearbyRides].forEach(target => {
      if (target.path && target.path.length > 1) {
        features.push({
          type: 'Feature',
          properties: { type: 'footprint', id: target.id },
          geometry: { type: 'LineString', coordinates: target.path.slice(-30) } // Recent trail
        });
      }
    });

    // 🧭 Render Interception Route (If SOS Accepted)
    if (acceptedSOSId && userPos) {
      const target = nearbyAlerts.find(a => a.id === acceptedSOSId) || nearbyRides.find(r => r.id === acceptedSOSId);
      if (target) {
        const tLat = target.latitude || target.location?.latitude || target.coords?.[0];
        const tLng = target.longitude || target.location?.longitude || target.coords?.[1];
        
        if (tLat && tLng) {
          // Tactical Interception Vector (Direct line for now, upgradeable to Directions API)
          features.push({
            type: 'Feature',
            properties: { type: 'route' },
            geometry: { 
              type: 'LineString', 
              coordinates: [[userPos[1], userPos[0]], [tLng, tLat]] 
            }
          });
        }
      }
    }

    map.current.getSource('pursuit-line').setData({
      type: 'FeatureCollection',
      features: features
    });

  }, [nearbyAlerts, nearbyRides, userPos, acceptedSOSId]);

  // 4. Colleagues & Markers Sync
  useEffect(() => {
    if (!map.current || !mapboxgl) return;

    // Colleague Markers
    const colleagueIds = activeProtectors.map(p => p.id || p.uid).filter(id => id !== user?.uid);
    Object.keys(colleagueMarkers.current).forEach(id => {
      if (!colleagueIds.includes(id)) {
        colleagueMarkers.current[id].remove();
        delete colleagueMarkers.current[id];
      }
    });
    activeProtectors.forEach(p => {
      const pid = p.id || p.uid;
      if (pid === user?.uid) return;
      const lat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.coords?.[0];
      const lng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.coords?.[1];
      if (lat && lng) {
        if (!colleagueMarkers.current[pid]) {
          const el = document.createElement('div');
          el.innerHTML = `<div style="background: #3B82F6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`;
          colleagueMarkers.current[pid] = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
        } else colleagueMarkers.current[pid].setLngLat([lng, lat]);
      }
    });

    // SOS Markers
    const activeAlertIds = nearbyAlerts.map(a => a.id);
    Object.keys(alertMarkers.current).forEach(id => {
      if (!activeAlertIds.includes(id)) {
        alertMarkers.current[id].remove();
        delete alertMarkers.current[id];
      }
    });
    nearbyAlerts.forEach(alert => {
      const lat = alert.location?.latitude || alert.coords?.[0];
      const lng = alert.location?.longitude || alert.coords?.[1];
      if (lat && lng) {
        const isAccepted = alert.id === acceptedSOSId;
        if (!alertMarkers.current[alert.id]) {
          const el = document.createElement('div');
          el.innerHTML = `<div style="background: ${isAccepted ? '#10B981' : '#EF4444'}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px ${isAccepted ? '#10B981' : '#EF4444'}; cursor: pointer;"><div style="position: absolute; inset: -8px; background: ${isAccepted ? '#10B98120' : '#EF444420'}; border-radius: 50%; animation: pulse 2s infinite;"></div>${isAccepted ? '📍' : '!'}</div>`;
          alertMarkers.current[alert.id] = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
        } else alertMarkers.current[alert.id].setLngLat([lng, lat]);
      }
    });

  }, [nearbyAlerts, activeProtectors, acceptedSOSId]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {!hideHeader && (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Zap size={18} className="text-red-500" />
                <h3 className="text-sm font-black italic uppercase text-white tracking-widest">Responder HUD</h3>
            </div>
        </div>
      )}
      <div className="flex-1 relative rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl min-h-[450px]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }} />
      </div>
    </div>
  );
});

export default ProtectorMap;
