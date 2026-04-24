import React, { useEffect, useRef, memo } from 'react';
import { Zap } from 'lucide-react';
import { useKavachStore } from '../../store/useKavachStore';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaHlxcmcwMHRpMnNxdnQ4YThsYmE2In0.C1n-oZWeUvxlOkXbNeFUTA";

const ProtectorMap = memo(({ nearbyAlerts = [], acceptedSOSId = null, hideHeader = false }: { nearbyAlerts?: any[], acceptedSOSId?: string | null, hideHeader?: boolean }) => {
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const alertMarkers = useRef<{ [key: string]: any }>({});

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainer.current || !mapboxgl) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [userPos?.[1] || 77.2090, userPos?.[0] || 28.6139],
      zoom: 14,
      pitch: 45
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    return () => {
      Object.values(alertMarkers.current).forEach(m => m.remove());
      if (userMarker.current) userMarker.current.remove();
      map.current?.remove();
    };
  }, []);

  // 2. Smooth User Location Sync
  useEffect(() => {
    if (!map.current || !userPos || !mapboxgl) return;

    if (!userMarker.current) {
      // Custom Blue Dot for Protector
      const el = document.createElement('div');
      el.className = 'user-location-dot';
      el.innerHTML = `<div style="background: #0A84FF; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #0A84FF;"></div>`;
      
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userPos[1], userPos[0]])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userPos[1], userPos[0]]);
    }
  }, [userPos]);

  // 3. SOS Marker Sync & Cleanup
  useEffect(() => {
    if (!map.current || !mapboxgl) return;

    // Remove markers that are no longer in nearbyAlerts
    const activeAlertIds = nearbyAlerts.map(a => a.id);
    Object.keys(alertMarkers.current).forEach(id => {
      if (!activeAlertIds.includes(id)) {
        alertMarkers.current[id].remove();
        delete alertMarkers.current[id];
      }
    });

    // Add or Update markers
    nearbyAlerts.forEach(alert => {
      if (!alert.coords) return;
      
      if (!alertMarkers.current[alert.id]) {
        const el = document.createElement('div');
        // Is accepted? Check styling
        const isAccepted = alert.id === acceptedSOSId;
        
        el.innerHTML = `
          <div style="background: ${isAccepted ? '#ffae00' : 'red'}; 
                      width: 35px; height: 35px; border-radius: 50%; 
                      border: 2px solid white; display: flex; 
                      align-items: center; justify-content: center; 
                      box-shadow: 0 0 20px ${isAccepted ? '#ffae00' : 'red'};
                      cursor: pointer; animation: pulse 1.5s infinite;">
            ${isAccepted ? '📍' : '⚡'}
          </div>`;

        el.onclick = () => {
          map.current?.flyTo({ 
            center: [alert.coords[1], alert.coords[0]], 
            zoom: 17, 
            pitch: 60, 
            duration: 1500 
          });
        };

        alertMarkers.current[alert.id] = new mapboxgl.Marker(el)
          .setLngLat([alert.coords[1], alert.coords[0]])
          .addTo(map.current);
      }
    });

    // Auto-focus on accepted SOS
    if (acceptedSOSId && alertMarkers.current[acceptedSOSId]) {
      const target = nearbyAlerts.find(a => a.id === acceptedSOSId);
      if (target) {
        map.current.flyTo({ center: [target.coords[1], target.coords[0]], zoom: 16 });
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
                <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">
                   MISSION ACTIVE
                </span>
            )}
        </div>
      )}
      <div className="flex-1 relative rounded-[32px] overflow-hidden border border-white/10 bg-[#0b0c10] shadow-2xl">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
});

export default ProtectorMap;
