import React, { useEffect, useRef, memo, useState } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, ShieldAlert, Navigation } from 'lucide-react';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const SecurityRadarMap = memo(({ protectors = [] }: { protectors?: any[] }) => {
  const { userPos, activeAlertId, isSOSActive } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const protectorMarkers = useRef<{ [key: string]: any }>({});
  const timeoutRef = useRef<any>(null);
  const [responderId, setResponderId] = useState<string | null>(null);

  // 📡 LISTEN FOR RESPONDER HANDSHAKE
  useEffect(() => {
    if (!activeAlertId || !isSOSActive) {
      setResponderId(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'alerts', activeAlertId), (snap) => {
      if (snap.exists()) {
        setResponderId(snap.data().responderUid || null);
      }
    });
    return () => unsub();
  }, [activeAlertId, isSOSActive]);

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
          zoom: 14, 
          pitch: 45, 
          bearing: 0,
          antialias: true,
          preserveDrawingBuffer: true
        });

        map.current.on('load', () => {
          if (!map.current) return;
          map.current.resize(); 

          // ⚡ RESCUE ROUTE LAYER
          map.current.addSource('rescue-route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
          });

          map.current.addLayer({
            id: 'rescue-path',
            type: 'line',
            source: 'rescue-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 
              'line-color': '#10B981', // TACTICAL GREEN
              'line-width': 4, 
              'line-opacity': 0.8,
              'line-dasharray': [1, 1]
            }
          });

          if (userPos) {
            addRadiusLayer(userPos);
            fitPerimeter(userPos);
          }
        });

        map.current.on('error', (e: any) => {
          if (map.current) map.current.setStyle('mapbox://styles/mapbox/streets-v11');
        });
      } catch (e) { console.error("Mapbox init failed", e); }
    };

    initMap();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Object.values(protectorMarkers.current).forEach(m => { try { m.remove(); } catch(e){} });
      if (userMarker.current) try { userMarker.current.remove(); } catch(e){}
      if (map.current) { try { map.current.remove(); map.current = null; } catch (e) {} }
    };
  }, []);

  // 2. High-Precision Victim Tracking
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
        el.innerHTML = `<div style="background: #FFF; width: 12px; height: 12px; border-radius: 50%; border: 3px solid #0A84FF; box-shadow: 0 0 15px #0A84FF;"></div>`;
        userMarker.current = new mb.Marker(el).setLngLat([userPos[1], userPos[0]]).addTo(map.current);
      } else if (userMarker.current) {
        userMarker.current.setLngLat([userPos[1], userPos[0]]);
      }
      updateRadius(userPos);
    } catch (e) {}
  }, [userPos]);

  // 3. Protector Grid & Rescue Path Rendering
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

      let rescueCoords: [number, number] | null = null;

      protectors.forEach(p => {
        const coords = [p.telemetry?.coords?.[1] || p.lastLocation?.lng, p.telemetry?.coords?.[0] || p.lastLocation?.lat];
        if (!coords[0] || !coords[1]) return;
        const pid = p.id || p.uid;
        
        const isResponder = pid === responderId;
        if (isResponder) rescueCoords = [coords[0], coords[1]];

        const markerColor = isResponder ? '#10B981' : (p.isOnline !== false ? '#0070f3' : '#333');
        const markerGlow = isResponder ? '#10B981' : (p.isOnline !== false ? '#0070f3' : '#000');

        if (!protectorMarkers.current[pid]) {
          const el = document.createElement('div');
          el.innerHTML = `<div style="background: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${markerGlow}; transition: all 0.3s ease-out; ${isResponder ? 'animation: responder-pulse 2s infinite ease-in-out;' : ''}"></div>`;
          
          if (isResponder && !document.getElementById('responder-radar-styles')) {
            const style = document.createElement('style');
            style.id = 'responder-radar-styles';
            style.innerHTML = `@keyframes responder-pulse { 0% { scale: 1; box-shadow: 0 0 5px #10B981; } 50% { scale: 1.2; box-shadow: 0 0 20px #10B981; } 100% { scale: 1; box-shadow: 0 0 5px #10B981; } }`;
            document.head.appendChild(style);
          }

          protectorMarkers.current[pid] = new mapboxgl.Marker(el).setLngLat([coords[0], coords[1]]).addTo(map.current!);
        } else {
          // Update style if it becomes responder
          const el = protectorMarkers.current[pid].getElement();
          const dot = el.firstChild as HTMLElement;
          if (dot) {
            dot.style.background = markerColor;
            dot.style.boxShadow = `0 0 15px ${markerGlow}`;
            dot.style.animation = isResponder ? 'responder-pulse 2s infinite ease-in-out' : '';
          }
          protectorMarkers.current[pid].setLngLat([coords[0], coords[1]]);
        }
      });

      // 🏁 DRAW RESCUE ROUTE
      if (map.current.getSource('rescue-route')) {
        if (rescueCoords && userPos) {
          map.current.getSource('rescue-route').setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[userPos[1], userPos[0]], rescueCoords]
            }
          });
        } else {
          map.current.getSource('rescue-route').setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [] }
          });
        }
      }

    } catch (e) {}
  }, [protectors, responderId, userPos]);

  const fitPerimeter = (center: [number, number]) => {
    if (!map.current) return;
    try {
      const offset = 0.012; 
      const bounds = [[center[1] - offset, center[0] - offset], [center[1] + offset, center[0] + offset]];
      map.current.fitBounds(bounds as [[number, number], [number, number]], { padding: 40, duration: 2000, essential: true });
    } catch (e) {}
  };

  const addRadiusLayer = (center: [number, number]) => {
     if (!map.current) return;
     try {
       const points = 128; const radius = 1;
       const ret = [];
       const distanceX = radius / (111.32 * Math.cos(center[0] * Math.PI / 180));
       const distanceY = radius / 110.574;
       for (let i = 0; i <= points; i++) {
         const theta = (i / points) * (2 * Math.PI);
         ret.push([center[1] + (distanceX * Math.cos(theta)), center[0] + (distanceY * Math.sin(theta))]);
       }
       map.current.addSource('radar-1km', { 'type': 'geojson', 'data': { 'type': 'Feature', 'geometry': { 'type': 'Polygon', 'coordinates': [ret] } } });
       map.current.addLayer({ 'id': 'radar-1km-outline', 'type': 'line', 'source': 'radar-1km', 'paint': { 'line-color': '#0A84FF', 'line-width': 3, 'line-dasharray': [1, 1], 'line-opacity': 0.8 } });
       map.current.addLayer({ 'id': 'radar-1km-glow', 'type': 'line', 'source': 'radar-1km', 'paint': { 'line-color': '#0A84FF', 'line-width': 8, 'line-blur': 10, 'line-opacity': 0.3 } });
     } catch (e) {}
  };

  const updateRadius = (center: [number, number]) => {
    if (!map.current || !map.current.getSource('radar-1km')) return;
    try {
      const points = 128; const radius = 1;
      const ret = [];
      const distanceX = radius / (111.32 * Math.cos(center[0] * Math.PI / 180));
      const distanceY = radius / 110.574;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        ret.push([center[1] + (distanceX * Math.cos(theta)), center[0] + (distanceY * Math.sin(theta))]);
      }
      (map.current.getSource('radar-1km') as any).setData({ 'type': 'Feature', 'geometry': { 'type': 'Polygon', 'coordinates': [ret] } });
    } catch (e) {}
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-[#0A84FF] rounded-full animate-pulse" />
        <span className="text-[9px] font-black text-white uppercase tracking-widest">Tactical Radar Grid</span>
      </div>
      {responderId && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-green-500/10 backdrop-blur-xl border border-green-500/20 p-4 rounded-3xl flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <p className="text-[8px] font-black uppercase text-green-400 tracking-[2px]">Responder Identified</p>
                 <p className="text-[12px] font-black text-white uppercase">Help is Approaching</p>
              </div>
           </div>
           <div className="text-right">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                 <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Route</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
});

export default SecurityRadarMap;
