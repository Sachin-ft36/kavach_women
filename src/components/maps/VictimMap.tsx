import React, { useEffect, useRef, memo } from 'react';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useKavachStore } from '../../store/useKavachStore';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaHlxcmcwMHRpMnNxdnQ4YThsYmE2In0.C1n-oZWeUvxlOkXbNeFUTA";

const VictimMap = memo(({ hideHeader = false, radarProtectors = [] }: { hideHeader?: boolean, radarProtectors?: any[] }) => {
  const { t } = useLanguage();
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const victimMarker = useRef<any>(null);
  const protectorMarkers = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [userPos?.[1] || 77.2090, userPos?.[0] || 28.6139],
      zoom: 16,
      pitch: 45
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    return () => {
      Object.values(protectorMarkers.current).forEach(m => m.remove());
      if (victimMarker.current) victimMarker.current.remove();
      map.current?.remove();
    };
  }, []);

  // Sync Victim Marker with Pulse Effect
  useEffect(() => {
    if (!map.current || !userPos || !mapboxgl) return;

    if (!victimMarker.current) {
      const el = document.createElement('div');
      el.className = 'victim-pulse-container';
      el.innerHTML = `
        <div class="pulse-ring"></div>
        <div style="background: #0A84FF; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; position: relative; z-index: 2;"></div>
      `;
      
      victimMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userPos[1], userPos[0]])
        .addTo(map.current);
    } else {
      victimMarker.current.setLngLat([userPos[1], userPos[0]]);
    }

    map.current.easeTo({ center: [userPos[1], userPos[0]], duration: 1000 });
  }, [userPos]);

  // Sync Protectors (With Proper Cleanup)
  useEffect(() => {
    if (!map.current || !mapboxgl) return;

    // 1. Remove protectors who left the radar
    const activeProtIds = radarProtectors.map(p => p.id || p.uid);
    Object.keys(protectorMarkers.current).forEach(id => {
      if (!activeProtIds.includes(id)) {
        protectorMarkers.current[id].remove();
        delete protectorMarkers.current[id];
      }
    });

    // 2. Add or Update protectors
    radarProtectors.forEach(p => {
      const coords = [p.lastLocation?.lng, p.lastLocation?.lat];
      if (!coords[0] || !coords[1]) return;
      const pid = p.id || p.uid;

      if (!protectorMarkers.current[pid]) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 18px;">
            👮
          </div>`;
        
        protectorMarkers.current[pid] = new mapboxgl.Marker(el)
          .setLngLat([coords[0], coords[1]])
          .addTo(map.current!);
      } else {
        // Smoothly move the protector icon
        protectorMarkers.current[pid].setLngLat([coords[0], coords[1]]);
      }
    });
  }, [radarProtectors]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
               <MapPin size={18} />
            </div>
            <div>
               <h3 className="text-sm font-black italic uppercase tracking-tighter text-white">Security Radar</h3>
               <p className="text-[8px] text-blue-400 font-bold uppercase tracking-[2px] leading-none">
                {radarProtectors.length} Protectors Nearby
               </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative rounded-[32px] overflow-hidden border border-white/10 bg-[#0b0c10] shadow-inner">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Radar Scanning Overlay Effect */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-blue-500/10 rounded-[32px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent"></div>
        </div>
      </div>

      <style>{`
        .victim-pulse-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
        }
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgba(10, 132, 255, 0.4);
          border-radius: 50%;
          animation: victim-pulse 2s infinite;
        }
        @keyframes victim-pulse {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

export default VictimMap;
