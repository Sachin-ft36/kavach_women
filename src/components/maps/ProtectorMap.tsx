import React, { useEffect, useRef, memo } from 'react';
import { Zap } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../store/useKavachStore';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
mapboxgl.accessToken = MAPBOX_TOKEN;

const ProtectorMap = memo(({ nearbyAlerts = [], nearbyRides = [], activeProtectors = [], acceptedSOSId = null, hideHeader = false }: { nearbyAlerts?: any[], nearbyRides?: any[], activeProtectors?: any[], acceptedSOSId?: string | null, hideHeader?: boolean }) => {
  const { userPos, user } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{
    user?: mapboxgl.Marker,
    colleagues: { [key: string]: mapboxgl.Marker },
    alerts: { [key: string]: mapboxgl.Marker },
    pursuitLines: { [key: string]: any }
  }>({ colleagues: {}, alerts: {}, pursuitLines: {} });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Mapbox expects [lng, lat]
    const initialCoords: [number, number] = userPos ? [userPos[1], userPos[0]] : [78.9629, 20.5937];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCoords,
      zoom: 16,
      pitch: 45,
      bearing: 0,
      antialias: true
    });

    map.current.on('load', () => {
      console.log("🛰️ PROTECTOR HUD: Mapbox Tactical Grid Online.");
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // 🛰️ LIVE GRID SYNC: User, Colleagues, and SOS Alerts
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    // 1. User Position
    if (userPos) {
      const coords: [number, number] = [userPos[1], userPos[0]];
      if (!markersRef.current.user) {
        const el = document.createElement('div');
        el.className = 'user-pos-marker-hud';
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; background: rgba(37, 99, 235, 0.2); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
            <div style="background: #2563EB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(37, 99, 235, 0.6); position: relative; z-index: 2;"></div>
          </div>
        `;
        markersRef.current.user = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(m);
      } else {
        markersRef.current.user.setLngLat(coords);
      }
    }

    // 2. Colleagues
    const activeColleagueIds = activeProtectors.map(p => p.id || p.uid).filter(id => id !== user?.uid);
    Object.keys(markersRef.current.colleagues).forEach(id => {
      if (!activeColleagueIds.includes(id)) {
        markersRef.current.colleagues[id].remove();
        delete markersRef.current.colleagues[id];
      }
    });

    activeProtectors.forEach(p => {
      const pid = p.id || p.uid;
      if (pid === user?.uid) return;

      // 🛰️ Skip rendering if this colleague is currently a victim in an active alert to avoid double markers
      const isVictimColleague = [...nearbyAlerts, ...nearbyRides].some(a => 
        (a.userId === pid || a.id === pid || a.phone === p.phone || a.phoneNumber === p.phoneNumber)
      );
      if (isVictimColleague) return;

      const lat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.coords?.[0];
      const lng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.coords?.[1];
      
      if (lat && lng) {
        if (!markersRef.current.colleagues[pid]) {
          const el = document.createElement('div');
          el.innerHTML = `<div style="background: #3B82F6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`;
          markersRef.current.colleagues[pid] = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(m);
        } else {
          markersRef.current.colleagues[pid].setLngLat([lng, lat]);
        }
      }
    });

    // 3. SOS Alerts
    const allAlerts = [...nearbyAlerts, ...nearbyRides];
    const activeAlertIds = allAlerts.map(a => a.id);
    Object.keys(markersRef.current.alerts).forEach(id => {
      if (!activeAlertIds.includes(id)) {
        markersRef.current.alerts[id].remove();
        delete markersRef.current.alerts[id];
        
        if (m.getLayer(`pursuit-${id}`)) m.removeLayer(`pursuit-${id}`);
        if (m.getSource(`pursuit-${id}`)) m.removeSource(`pursuit-${id}`);
      }
    });

    allAlerts.forEach(alert => {
      const lat = alert.location?.latitude || alert.coords?.[0];
      const lng = alert.location?.longitude || alert.coords?.[1];
      if (lat && lng) {
        const isAccepted = alert.id === acceptedSOSId;
        if (!markersRef.current.alerts[alert.id]) {
          const el = document.createElement('div');
          el.className = 'alert-marker-hud';
          el.innerHTML = `<div style="background: ${isAccepted ? '#10B981' : '#EF4444'}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px ${isAccepted ? '#10B981' : '#EF4444'}; cursor: pointer;"><div style="position: absolute; inset: -8px; background: ${isAccepted ? '#10B98120' : '#EF444420'}; border-radius: 50%; animation: pulse 2s infinite;"></div>${isAccepted ? '📍' : '!'}</div>`;
          markersRef.current.alerts[alert.id] = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(m);
        } else {
          markersRef.current.alerts[alert.id].setLngLat([lng, lat]);
        }

        // 🧭 PURSUIT VECTORS (FOOTPRINTS)
        if (alert.path && alert.path.length > 1) {
          const pathCoords = alert.path.slice(-30).map((p: any) => [p.lng || p[1], p.lat || p[0]]);
          
          if (m.getSource(`pursuit-${alert.id}`)) {
            (m.getSource(`pursuit-${alert.id}`) as mapboxgl.GeoJSONSource).setData({
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': pathCoords
              }
            });
          } else {
            m.addSource(`pursuit-${alert.id}`, {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': pathCoords
                }
              }
            });

            m.addLayer({
              'id': `pursuit-${alert.id}`,
              'type': 'line',
              'source': `pursuit-${alert.id}`,
              'layout': { 'line-join': 'round', 'line-cap': 'round' },
              'paint': {
                'line-color': '#EF4444',
                'line-width': 4,
                'line-opacity': 0.6,
                'line-dasharray': [2, 1]
              }
            });
          }
        }
      }
    });

  }, [nearbyAlerts, nearbyRides, activeProtectors, userPos, acceptedSOSId]);

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
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 1; }
          80%, 100% { transform: scale(1); opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
});

export default ProtectorMap;
