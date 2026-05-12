import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Users, Navigation, ShieldAlert, User } from 'lucide-react';

interface CommandMapProps {
  activeAlerts: any[];
  activeProtectors: any[];
  pendingProtectors?: any[];
  activeFirs?: any[];
  activeJourneys?: any[];
  onAlertClick?: (id: string) => void;
  centerOverride?: [number, number];
  selectedState?: string;
  selectedAlertId?: string | null;
  selectedProtectorId?: string | null;
  isSovereignActive?: boolean;
  showHeatmap?: boolean;
  
  // Forensic & Transit Props (Restored for Stability)
  victimPath?: any[];
  protectorPath?: any[];
  safePath?: any[];
  projectedPath?: any[];
  replayProgress?: number;
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

export default function CommandMap({
  activeAlerts,
  activeProtectors,
  pendingProtectors = [],
  activeFirs = [],
  activeJourneys = [],
  onAlertClick,
  centerOverride,
  selectedState = 'National',
  selectedAlertId,
  selectedProtectorId,
  isSovereignActive = false,
  showHeatmap = false,
  victimPath = [],
  protectorPath = [],
  safePath = [],
  projectedPath = [],
  replayProgress = 1
}: CommandMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  // 🛡️ TACTICAL MARKER STYLES
  const injectStyles = () => {
    if (document.getElementById('tactical-map-styles')) return;
    const style = document.createElement('style');
    style.id = 'tactical-map-styles';
    style.innerHTML = `
      .marker-sos { width: 16px; height: 16px; background: #FF0000; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); cursor: pointer; z-index: 100; position: relative; }
      .marker-sos::after { content: ''; position: absolute; inset: -10px; border-radius: 50%; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.2); }
      .marker-prot-normal { width: 10px; height: 10px; background: #3B82F6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.6); }
      .marker-prot-pro { width: 12px; height: 12px; background: #EAB308; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(234, 179, 8, 0.8); }
      .marker-prot-elite { width: 14px; height: 14px; background: #FACC15; border: 2px solid #FFF; border-radius: 50%; box-shadow: 0 0 20px rgba(250, 204, 21, 1); position: relative; }
      .marker-prot-elite::before { content: ''; position: absolute; inset: -4px; border: 1px solid #FACC15; border-radius: 50%; opacity: 0.5; }
      .marker-prot-responding { width: 18px; height: 18px; background: #2563EB; border: 3px solid #FFF; border-radius: 50%; box-shadow: 0 0 25px rgba(37, 99, 235, 0.8); animation: pulse-blue 2s infinite; z-index: 1000; }
      @keyframes pulse-blue {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }
      .marker-transit { width: 24px; height: 24px; background: #3B82F6; border: 2px solid white; border-radius: 6px; transform: rotate(45deg); box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
    `;
    document.head.appendChild(style);
  };

  useEffect(() => {
    injectStyles();
    const mb = (window as any).mapboxgl;
    if (!mapContainer.current || !mb) return;

    mb.accessToken = MAPBOX_TOKEN;
    map.current = new mb.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 23.5937],
      zoom: 4.5,
      pitch: 45,
      antialias: true
    });

    map.current.on('style.load', () => {
      setIsMapLoaded(true);
      // Radius Sources
      map.current.addSource('selected-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({ id: 'radius-circle', type: 'fill', source: 'selected-radius', paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.1 } });
      map.current.addLayer({ id: 'radius-outline', type: 'line', source: 'selected-radius', paint: { 'line-color': '#3B82F6', 'line-width': 2, 'line-dasharray': [2, 2] } });

      // Forensic Sources
      map.current.addSource('forensic-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({ id: 'f-safe', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'safe'], paint: { 'line-color': '#10B981', 'line-width': 4, 'line-dasharray': [2, 2], 'line-opacity': 0.4 } });
      map.current.addLayer({ id: 'f-victim', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'victim'], paint: { 'line-color': '#F43F5E', 'line-width': 5 } });
      map.current.addLayer({ id: 'f-projected', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'projected'], paint: { 'line-color': '#22D3EE', 'line-width': 3, 'line-dasharray': [2, 1] } });
    });

    return () => map.current?.remove();
  }, []);

  // 🌍 FORENSIC PATH SYNC
  useEffect(() => {
    if (!map.current || !isMapLoaded || !map.current.getSource('forensic-source')) return;

    const slicePath = (path: any[], progress: number) => {
      if (!path || path.length === 0) return [];
      const count = Math.ceil(path.length * progress);
      return path.slice(0, count).map(p => Array.isArray(p) ? p : [p.lng, p.lat]);
    };

    const features = [];
    if (safePath.length > 1) features.push({ type: 'Feature', properties: { type: 'safe' }, geometry: { type: 'LineString', coordinates: safePath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });
    if (victimPath.length > 1) features.push({ type: 'Feature', properties: { type: 'victim' }, geometry: { type: 'LineString', coordinates: slicePath(victimPath, replayProgress) } });
    if (projectedPath.length > 1) features.push({ type: 'Feature', properties: { type: 'projected' }, geometry: { type: 'LineString', coordinates: projectedPath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });

    map.current.getSource('forensic-source').setData({ type: 'FeatureCollection', features });
  }, [victimPath, safePath, projectedPath, replayProgress]);

  // 📍 SYNC MARKERS & RADIUS
  useEffect(() => {
    const mb = (window as any).mapboxgl;
    if (!map.current || !mb || !isMapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    activeAlerts.forEach(alert => {
      const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
      const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === alert.id;
      const el = document.createElement('div');
      el.className = 'marker-sos';
      el.style.zIndex = isSelected ? '500' : '100'; // Higher when selected
      el.onclick = () => onAlertClick?.(alert.id);
      
      const marker = new mb.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      markersRef.current.push(marker);

    });

    // 🔴 TACTICAL RADIUS SYNC (Separate for Stability)
    if (selectedAlertId && map.current) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      if (alert) {
        const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
        const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
        
        if (lat && lng) {
          map.current.flyTo({ center: [lng, lat], zoom: 14, pitch: 45, duration: 2000 });
          const radiusGeoJSON = createGeoJSONCircle([lng, lat], 2);
          const updateRadius = () => {
            if (map.current.getSource('selected-radius')) {
              map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [radiusGeoJSON] });
              map.current.setPaintProperty('radius-circle', 'fill-color', '#EF4444');
              map.current.setPaintProperty('radius-circle', 'fill-opacity', 0.2);
              map.current.setPaintProperty('radius-outline', 'line-color', '#EF4444');
              map.current.setPaintProperty('radius-outline', 'line-width', 2);
              
              // Move to top to ensure visibility
              if (map.current.getLayer('radius-circle')) map.current.moveLayer('radius-circle');
              if (map.current.getLayer('radius-outline')) map.current.moveLayer('radius-outline');
            }
          };

          if (map.current.isStyleLoaded()) updateRadius();
          else map.current.once('styledata', updateRadius);
        }
      }
    } else if (map.current && map.current.getSource('selected-radius')) {
      map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [] });
    }

    activeProtectors.forEach(p => {
      // 🛰️ ROBUST COORDINATE RESOLUTION
      const lat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
      const lng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      
      if (!lat || !lng) return;

      const isSelected = selectedProtectorId === p.id;
      const occ = (p.protectorVetting?.occupation || '').toLowerCase();
      const rating = p.protectorVetting?.rating || 0;
      let category = 'marker-prot-normal';
      if (p.status === 'responding') category = 'marker-prot-responding';
      else {
        if (occ.includes('police') || occ.includes('army') || occ.includes('military')) category = 'marker-prot-pro';
        if (rating > 4.8) category = 'marker-prot-elite';
      }

      const el = document.createElement('div');
      el.className = category;
      el.style.zIndex = isSelected ? '1000' : '200'; // Selected protector ALWAYS on top
      
      const marker = new mb.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      markersRef.current.push(marker);
    });

    activeJourneys.forEach(j => {
      // 🛰️ ROBUST COORDINATE RESOLUTION
      const lat = j.latitude || j.lat || j.lastLat || j.currentLat || j.location?.latitude || j.location?.lat;
      const lng = j.longitude || j.lng || j.lastLng || j.currentLng || j.long || j.location?.longitude || j.location?.lng;
      
      if (!lat || !lng) return;
      const el = document.createElement('div');
      el.className = 'marker-transit';
      markersRef.current.push(new mb.Marker(el).setLngLat([lng, lat]).addTo(map.current));
    });

    if (selectedProtectorId) {
      const p = activeProtectors.find(p => p.id === selectedProtectorId);
      if (p) {
        const lat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        const lng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
        if (lat && lng) {
          map.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
        }
      }
    }

    if (!selectedAlertId && !selectedProtectorId && map.current.getSource('selected-radius')) map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [] });

  }, [activeAlerts, activeProtectors, activeJourneys, selectedAlertId, selectedProtectorId]);

  const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points: number = 64) => {
    const coords = { latitude: center[1], longitude: center[0] };
    const km = radiusInKm;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;
    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } };
  };

  return (
    <div className="relative w-full h-full group">
       <div ref={mapContainer} className="w-full h-full" />
       
       {/* 🏛️ ADVANCED TACTICAL HUD */}
       <div className="absolute inset-x-8 top-8 flex justify-between items-start pointer-events-none z-[100]">
          {/* 📡 GRID STATUS HUD */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex gap-4"
          >
             <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-4 shadow-2xl pointer-events-auto">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                   <AlertTriangle size={20} className="animate-pulse" />
                </div>
                <div>
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Active SOS</p>
                   <p className="text-xl font-black text-white tabular-nums leading-none">{activeAlerts.length}</p>
                </div>
             </div>
             
             <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-4 shadow-2xl pointer-events-auto">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                   <Users size={20} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Grid Nodes</p>
                   <p className="text-xl font-black text-white tabular-nums leading-none">{activeProtectors.length}</p>
                </div>
             </div>

             <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-4 shadow-2xl pointer-events-auto">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                   <Navigation size={20} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Transits</p>
                   <p className="text-xl font-black text-white tabular-nums leading-none">{activeJourneys.length}</p>
                </div>
             </div>
          </motion.div>

          {/* 🏹 MISSION INTEL HUD */}
          <AnimatePresence mode="wait">
             {selectedAlertId && activeAlerts.find(a => a.id === selectedAlertId) && (
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  className="bg-rose-600/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-rose-600/20 max-w-sm pointer-events-auto"
                >
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-xl">
                         <ShieldAlert size={24} />
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-white uppercase italic leading-none">{activeAlerts.find(a => a.id === selectedAlertId)?.victimName || 'Citizen Rescue'}</h3>
                         <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] mt-1">High-Priority Mission</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                         <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Location Sector</p>
                         <p className="text-[10px] font-bold text-white line-clamp-2 leading-relaxed">
                            {activeAlerts.find(a => a.id === selectedAlertId)?.address || 'Sector Scanning...'}
                         </p>
                      </div>
                      <div className="flex gap-2">
                         <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                            <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-[9px] font-black text-white uppercase">{activeAlerts.find(a => a.id === selectedAlertId)?.status}</p>
                         </div>
                         <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                            <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Responders</p>
                            <p className="text-[9px] font-black text-white uppercase">{(activeAlerts.find(a => a.id === selectedAlertId)?.activeResponders?.length || 0)} Units</p>
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}

             {selectedProtectorId && activeProtectors.find(p => p.id === selectedProtectorId) && !selectedAlertId && (
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  className="bg-blue-600/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-blue-600/20 max-w-sm pointer-events-auto"
                >
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl">
                         <User size={24} />
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-white uppercase italic leading-none">{activeProtectors.find(p => p.id === selectedProtectorId)?.name}</h3>
                         <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] mt-1">Verified Grid Node</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                         <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Occupation</p>
                         <p className="text-[10px] font-bold text-white uppercase">{activeProtectors.find(p => p.id === selectedProtectorId)?.protectorVetting?.occupation || 'Operative'}</p>
                      </div>
                      <div className="flex gap-2">
                         <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                            <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Reliability</p>
                            <p className="text-[9px] font-black text-white tabular-nums">{(activeProtectors.find(p => p.id === selectedProtectorId)?.protectorVetting?.rating || 5).toFixed(1)} / 5.0</p>
                         </div>
                         <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                            <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Strikes</p>
                            <p className="text-[9px] font-black text-white tabular-nums">{(activeProtectors.find(p => p.id === selectedProtectorId)?.sosStrikeCount || 0)}</p>
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
       </div>

       {/* 🛰️ SYSTEM COMPASS / COORDINATES */}
       <div className="absolute left-8 bottom-8 pointer-events-none z-[100]">
          <div className="bg-black/50 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black text-white/50 uppercase tracking-[4px]">Mapbox V11 Strategic Engine</span>
          </div>
       </div>
    </div>
  );
}
