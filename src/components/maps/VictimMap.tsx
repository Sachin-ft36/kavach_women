import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useKavachStore } from '../../store/useKavachStore';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const VictimMap = ({ hideHeader = false, radarProtectors = [] }: { hideHeader?: boolean, radarProtectors?: any[] }) => {
  const { t } = useLanguage();
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const victimMarker = useRef<any>(null);
  const protectorMarkers = useRef<{ [key: string]: any }>({});

  // 1. Initialize Map with Persistence
  useEffect(() => {
    const initMap = () => {
      const mb = (window as any).mapboxgl;
      if (!mapContainer.current || !mb || !mb.Map) {
        setTimeout(initMap, 500);
        return;
      }

      mb.accessToken = MAPBOX_TOKEN;
      
      // PERSISTENT ANCHOR: Force start from exact User Anchor (Global Store)
      const initialCoords = userPos ? [userPos[1], userPos[0]] : [78.9629, 20.5937]; 

      map.current = new mb.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialCoords as [number, number],
        zoom: userPos ? 16 : 4,
        pitch: 60,
        antialias: true
      });

      map.current.on('load', () => {
        map.current.resize();
      });

      map.current.addControl(new mb.NavigationControl(), 'bottom-right');
    };

    initMap();

    return () => {
      Object.values(protectorMarkers.current).forEach(m => m.remove());
      if (victimMarker.current) victimMarker.current.remove();
      map.current?.remove();
    };
  }, []);

  // 2. High-Precision Auto-Follow Loop (1s Sync)
  useEffect(() => {
    if (!map.current || !userPos) return;

    // TACTICAL FOLLOW: Smoothly pan to victim coordinates in real-time
    map.current.easeTo({
      center: [userPos[1], userPos[0]],
      zoom: map.current.getZoom() < 10 ? 16 : map.current.getZoom(),
      duration: 1000, 
      essential: true
    });

    // Sync Marker position
    const mb = (window as any).mapboxgl;
    if (!victimMarker.current && mb) {
      const el = document.createElement('div');
      el.className = 'victim-pulse-container';
      el.style.zIndex = "999";
      el.innerHTML = `
        <div class="pulse-ring"></div>
        <div style="background: #0A84FF; width: 26px; height: 26px; border-radius: 50%; border: 4px solid white; position: relative; z-index: 2; box-shadow: 0 0 25px rgba(10, 132, 255, 0.8);"></div>
      `;
      
      victimMarker.current = new mb.Marker(el)
        .setLngLat([userPos[1], userPos[0]])
        .addTo(map.current);
    } else if (victimMarker.current) {
      victimMarker.current.setLngLat([userPos[1], userPos[0]]);
    }
  }, [userPos]);

  // 3. Sync Protectors on Radar
  useEffect(() => {
    if (!map.current || !mapboxgl) return;

    const activeProtIds = radarProtectors.map(p => p.id || p.uid);
    Object.keys(protectorMarkers.current).forEach(id => {
      if (!activeProtIds.includes(id)) {
        protectorMarkers.current[id].remove();
        delete protectorMarkers.current[id];
      }
    });

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
                {radarProtectors.length} {t('protectors_nearby') || 'Protectors Nearby'}
               </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-inner min-h-[450px]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }} />
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
};

export default VictimMap;
