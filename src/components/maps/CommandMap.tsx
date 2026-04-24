import React, { useEffect, useRef, memo } from 'react';

// Mapbox gl ko direct import karein agar install kiya hai: import mapboxgl from 'mapbox-gl';
const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaHlxcmcwMHRpMnNxdnQ4YThsYmE2In0.C1n-oZWeUvxlOkXbNeFUTA";

const CommandMap = memo(({ activeAlerts = [], activeProtectors = [], centerOverride = null }: { activeAlerts?: any[], activeProtectors?: any[], centerOverride?: [number, number] | null }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  
  // Markers ko track karne ke liye refs
  const alertMarkers = useRef<{ [key: string]: any }>({});
  const protectorMarkers = useRef<{ [key: string]: any }>({});

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainer.current || !mapboxgl) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      // Mapbox expects [lng, lat]
      center: centerOverride ? [centerOverride[1], centerOverride[0]] : [78.9629, 20.5937], 
      zoom: centerOverride ? 12 : 4,
      pitch: 30
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    return () => {
      // Cleanup markers on unmount
      Object.values(alertMarkers.current).forEach(m => m.remove());
      Object.values(protectorMarkers.current).forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  // 2. Fly to new center when updated
  useEffect(() => {
    if (map.current && centerOverride) {
      map.current.flyTo({ 
        center: [centerOverride[1], centerOverride[0]], 
        zoom: 14, // Zoom thoda badha diya taaki location clear dikhe
        essential: true 
      });
    }
  }, [centerOverride]);

  // 3. Sync Markers (With Cleanup)
  useEffect(() => {
    if (!map.current || !mapboxgl) return;

    // --- Sync Alerts ---
    // Pehle purane markers check karein jo ab list mein nahi hain unhe remove karein
    const activeAlertIds = activeAlerts.map(a => a.id);
    Object.keys(alertMarkers.current).forEach(id => {
      if (!activeAlertIds.includes(id)) {
        alertMarkers.current[id].remove();
        delete alertMarkers.current[id];
      }
    });

    activeAlerts.forEach(alert => {
      if (!alert.coords) return;
      if (!alertMarkers.current[alert.id]) {
        const el = document.createElement('div');
        el.className = 'marker-alert'; // CSS class use karna behtar hai
        el.innerHTML = `<div style="background: #ff0000; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #ff0000; animation: pulse 2s infinite;"></div>`;
        
        alertMarkers.current[alert.id] = new mapboxgl.Marker(el)
          .setLngLat([alert.coords[1], alert.coords[0]])
          .addTo(map.current!);
      }
    });

    // --- Sync Protectors ---
    const activeProtIds = activeProtectors.map(p => p.id || p.uid);
    Object.keys(protectorMarkers.current).forEach(id => {
      if (!activeProtIds.includes(id)) {
        protectorMarkers.current[id].remove();
        delete protectorMarkers.current[id];
      }
    });

    activeProtectors.forEach(p => {
      const coords = [p.lastLocation?.lng, p.lastLocation?.lat];
      if (!coords[0] || !coords[1]) return;
      const pid = p.id || p.uid;

      if (!protectorMarkers.current[pid]) {
        const el = document.createElement('div');
        el.innerHTML = '<div style="font-size: 20px; filter: drop-shadow(0 0 5px #3b82f6);">👮</div>';
        protectorMarkers.current[pid] = new mapboxgl.Marker(el)
          .setLngLat([coords[0], coords[1]])
          .addTo(map.current!);
      } else {
        // Update position if protector is moving
        protectorMarkers.current[pid].setLngLat([coords[0], coords[1]]);
      }
    });
  }, [activeAlerts, activeProtectors]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#050505]">
       <div ref={mapContainer} className="absolute inset-0" />
       
       {/* Dashboard Overlay */}
       <div className="absolute top-8 right-8 z-10 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-end shadow-2xl">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Kavach Systems</p>
             <p className="text-xl font-black italic text-red-500 uppercase tracking-tighter mt-1">
                {activeAlerts.length} ACTIVE ALERTS
             </p>
          </div>
       </div>

       {/* Add CSS for Pulse Effect */}
       <style>{`
         @keyframes pulse {
           0% { transform: scale(1); opacity: 1; }
           50% { transform: scale(1.3); opacity: 0.7; }
           100% { transform: scale(1); opacity: 1; }
         }
       `}</style>
    </div>
  );
});

export default CommandMap;
