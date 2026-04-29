import React, { useEffect, useRef, memo } from 'react';
import { Zap } from 'lucide-react';
import { useKavachStore } from '../../store/useKavachStore';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const ProtectorMap = memo(({ nearbyAlerts = [], acceptedSOSId = null, hideHeader = false }: { nearbyAlerts?: any[], acceptedSOSId?: string | null, hideHeader?: boolean }) => {
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const alertMarkers = useRef<{ [key: string]: any }>({});

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

      map.current.on('error', (e: any) => {
        console.error("KAVACH Protection: Map Style load failed. Engaging fallback...", e.error);
        if (map.current) map.current.setStyle('mapbox://styles/mapbox/streets-v11');
      });

      map.current.addControl(new mb.NavigationControl(), 'bottom-right');
    };

    initMap();

    return () => {
      Object.values(alertMarkers.current).forEach(m => m.remove());
      if (userMarker.current) userMarker.current.remove();
      map.current?.remove();
    };
  }, []);

  // 2. High-Precision Auto-Follow (1s Sync)
  useEffect(() => {
    if (!map.current || !userPos) return;

    // Smoothly follow the protector coordinates in real-time
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
      el.innerHTML = `<div style="background: #0A84FF; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #0A84FF; position: relative;"><div style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; background: #0A84FF; border-radius: 50%; opacity: 0.4; transform: scale(3);"></div></div>`;
      userMarker.current = new mb.Marker(el)
        .setLngLat([userPos[1], userPos[0]])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userPos[1], userPos[0]]);
    }
  }, [userPos]);

  // 3. SOS Marker Sync
  useEffect(() => {
    if (!map.current || !mapboxgl) return;

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
      if (!lat || !lng) return;

      if (!alertMarkers.current[alert.id]) {
        const el = document.createElement('div');
        const isAccepted = alert.id === acceptedSOSId;

        el.innerHTML = `
          <div style="background: ${isAccepted ? '#ffae00' : 'red'}; 
                      width: 35px; height: 35px; border-radius: 50%; 
                      border: 2px solid white; display: flex; 
                      align-items: center; justify-content: center; 
                      box-shadow: 0 0 20px ${isAccepted ? '#ffae00' : 'red'};
                      cursor: pointer;">
            ${isAccepted ? '📍' : '⚡'}
          </div>`;

        el.onclick = () => {
          map.current?.flyTo({
            center: [lng, lat],
            zoom: 17,
            pitch: 60,
            duration: 1500
          });
        };

        alertMarkers.current[alert.id] = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    });

    if (acceptedSOSId && alertMarkers.current[acceptedSOSId]) {
      const target = nearbyAlerts.find(a => a.id === acceptedSOSId);
      if (target) {
        const tLat = target.location?.latitude || target.coords?.[0];
        const tLng = target.location?.longitude || target.coords?.[1];
        if (tLat && tLng) map.current.flyTo({ center: [tLng, tLat], zoom: 16 });
      }
    }
  }, [nearbyAlerts, acceptedSOSId]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {!hideHeader && (
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-red-500" />
            <h3 className="text-sm font-black italic uppercase text-white tracking-widest">Responder HUD</h3>
          </div>
          {acceptedSOSId && (
            <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-full">
              MISSION ACTIVE
            </span>
          )}
        </div>
      )}
      <div className="flex-1 relative rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl min-h-[450px]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }} />
      </div>
    </div>
  );
});

export default ProtectorMap;
