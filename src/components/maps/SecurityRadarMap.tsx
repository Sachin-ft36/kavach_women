import React, { useEffect, useRef, memo } from 'react';
import { useKavachStore } from '../../store/useKavachStore';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const SecurityRadarMap = memo(({ protectors = [] }: { protectors?: any[] }) => {
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const protectorMarkers = useRef<{ [key: string]: any }>({});
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const initMap = () => {
      const mb = (window as any).mapboxgl;
      if (!mapContainer.current || !mb || !mb.Map) {
        timeoutRef.current = setTimeout(initMap, 500);
        return;
      }

      try {
        mb.accessToken = MAPBOX_TOKEN;
        const initialCoords = userPos ? [userPos[1], userPos[0]] : [78.9629, 20.5937];

        map.current = new mb.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: initialCoords as [number, number],
          zoom: userPos ? 16 : 4,
          pitch: 0,
          antialias: true,
          preserveDrawingBuffer: true
        });

        map.current.on('load', () => {
          map.current.resize(); // Force layout recalculation
          if (userPos) addRadiusLayer(userPos);
        });

        map.current.on('error', (e: any) => {
          console.error("Radar Map Critical Error:", e);
          if (map.current) map.current.setStyle('mapbox://styles/mapbox/streets-v11');
        });
      } catch (e) { 
        console.error("Mapbox init failed", e); 
      }
    };

    initMap();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // 🔥 ABSOLUTE CLEANUP: Release GPU memory and DOM nodes
      Object.values(protectorMarkers.current).forEach(m => { try { m.remove(); } catch(e){} });
      if (userMarker.current) try { userMarker.current.remove(); } catch(e){}
      if (map.current) {
        try {
          map.current.remove();
          map.current = null;
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !userPos) return;
    try {
      const mb = (window as any).mapboxgl;
      map.current.easeTo({
        center: [userPos[1], userPos[0]],
        duration: 1000, 
        essential: true
      });

      if (!userMarker.current && mb) {
        const el = document.createElement('div');
        el.className = 'radar-user-dot';
        el.innerHTML = `<div style="background: #FFF; width: 12px; height: 12px; border-radius: 50%; border: 3px solid #0A84FF; box-shadow: 0 0 15px #0A84FF;"></div>`;
        userMarker.current = new mb.Marker(el)
          .setLngLat([userPos[1], userPos[0]])
          .addTo(map.current);
      } else if (userMarker.current) {
        userMarker.current.setLngLat([userPos[1], userPos[0]]);
      }
      updateRadius(userPos);
    } catch (e) {}
  }, [userPos]);

  useEffect(() => {
    if (!map.current || !mapboxgl) return;
    try {
      const activeIds = protectors.map(p => p.id || p.uid);
      Object.keys(protectorMarkers.current).forEach(id => {
        if (!activeIds.includes(id)) {
          protectorMarkers.current[id].remove();
          delete protectorMarkers.current[id];
        }
      });

      protectors.forEach(p => {
        const coords = [p.telemetry?.coords?.[1] || p.lastLocation?.lng, p.telemetry?.coords?.[0] || p.lastLocation?.lat];
        if (!coords[0] || !coords[1]) return;
        const pid = p.id || p.uid;

        if (!protectorMarkers.current[pid]) {
          const el = document.createElement('div');
          el.innerHTML = `<div style="font-size: 20px; filter: drop-shadow(0 0 5px #3b82f6);">👮</div>`;
          protectorMarkers.current[pid] = new mapboxgl.Marker(el)
            .setLngLat([coords[0], coords[1]])
            .addTo(map.current!);
        } else {
          protectorMarkers.current[pid].setLngLat([coords[0], coords[1]]);
        }
      });
    } catch (e) {}
  }, [protectors]);

  const addRadiusLayer = (center: [number, number]) => {
     if (!map.current) return;
     try {
       const points = 64; const radius = 1; 
       const ret = [];
       const distanceX = radius / (111.32 * Math.cos(center[0] * Math.PI / 180));
       const distanceY = radius / 110.574;
       for (let i = 0; i <= points; i++) {
         const theta = (i / points) * (2 * Math.PI);
         ret.push([center[1] + (distanceX * Math.cos(theta)), center[0] + (distanceY * Math.sin(theta))]);
       }

       map.current.addSource('radar-1km', {
         'type': 'geojson',
         'data': { 'type': 'Feature', 'geometry': { 'type': 'Polygon', 'coordinates': [ret] } }
       });
       map.current.addLayer({
         'id': 'radar-1km-layer', 'type': 'fill', 'source': 'radar-1km',
         'paint': { 'fill-color': '#0A84FF', 'fill-opacity': 0.1, 'fill-outline-color': '#0A84FF' }
       });
     } catch (e) {}
  };

  const updateRadius = (center: [number, number]) => {
    if (!map.current || !map.current.getSource('radar-1km')) return;
    try {
      const points = 64; const radius = 1;
      const ret = [];
      const distanceX = radius / (111.32 * Math.cos(center[0] * Math.PI / 180));
      const distanceY = radius / 110.574;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        ret.push([center[1] + (distanceX * Math.cos(theta)), center[0] + (distanceY * Math.sin(theta))]);
      }
      (map.current.getSource('radar-1km') as any).setData({
        'type': 'Feature', 'geometry': { 'type': 'Polygon', 'coordinates': [ret] }
      });
    } catch (e) {}
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />
        <span className="text-[9px] font-black text-white uppercase tracking-widest">Tactical Radar Grid</span>
      </div>
    </div>
  );
});

export default SecurityRadarMap;
