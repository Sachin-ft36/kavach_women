import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { X, Navigation, Shield, Compass, Target, Users, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
mapboxgl.accessToken = MAPBOX_TOKEN;

interface Protector {
  id: string;
  name?: string;
  photoUrl?: string;
  photoURL?: string;
  telemetry?: {
    coords?: [number, number];
  };
  lastLocation?: {
    lat?: number;
    latitude?: number;
    lng?: number;
    longitude?: number;
  };
  latitude?: number;
  longitude?: number;
  distanceStr?: string;
}

interface TacticalNavigationOverlayProps {
  victimName: string;
  victimLat: number;
  victimLng: number;
  guardianLat?: number;
  guardianLng?: number;
  nearbyProtectors: Protector[];
  activeSOSAlert: any;
  onClose: () => void;
}

const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Radius of earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function TacticalNavigationOverlay({
  victimName,
  victimLat,
  victimLng,
  guardianLat,
  guardianLng,
  nearbyProtectors,
  activeSOSAlert,
  onClose
}: TacticalNavigationOverlayProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(45);
  const [hudDistance, setHudDistance] = useState<string>("Calculating...");
  const [respondedCount, setRespondedCount] = useState(0);

  // Calculate live distance between guardian and victim
  useEffect(() => {
    if (guardianLat && guardianLng && victimLat && victimLng) {
      const dist = calculateDistanceMeters(guardianLat, guardianLng, victimLat, victimLng);
      if (dist < 1000) {
        setHudDistance(`${dist.toFixed(0)} meters`);
      } else {
        setHudDistance(`${(dist / 1000).toFixed(2)} km`);
      }
    }
  }, [guardianLat, guardianLng, victimLat, victimLng]);

  // Count active responders
  useEffect(() => {
    if (activeSOSAlert?.responders) {
      const count = Object.keys(activeSOSAlert.responders).length;
      setRespondedCount(count);
    } else {
      setRespondedCount(0);
    }
  }, [activeSOSAlert]);

  // Initialize Map & Markers
  useEffect(() => {
    if (!mapContainer.current || !victimLat || !victimLng) return;

    const victimCoords: [number, number] = [victimLng, victimLat];
    const initialCenter: [number, number] = guardianLat && guardianLng ? [guardianLng, guardianLat] : victimCoords;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCenter,
      zoom: 15,
      pitch: pitch,
      bearing: bearing
    });

    const m = map.current;

    m.on('style.load', () => {
      // Fetch optimal road routing or fallback to straight line
      if (guardianLat && guardianLng && victimLat && victimLng) {
        const drawStraightLine = () => {
          if (m.getSource('route-src')) return;
          m.addSource('route-src', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [guardianLng, guardianLat],
                  [victimLng, victimLat]
                ]
              }
            }
          });
          m.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route-src',
            paint: {
              'line-color': '#00E676',
              'line-width': 4,
              'line-opacity': 0.65,
              'line-dasharray': [2, 2]
            }
          });
        };

        const directDist = calculateDistanceMeters(guardianLat, guardianLng, victimLat, victimLng);
        if (directDist < 600) {
          // If close or off-road within same area/jungle, draw straight line directly
          drawStraightLine();
        } else {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${guardianLng},${guardianLat};${victimLng},${victimLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (data.routes && data.routes.length > 0) {
                const routeCoords = data.routes[0].geometry.coordinates;
                const coords = [
                  [guardianLng, guardianLat],
                  ...routeCoords,
                  [victimLng, victimLat]
                ];
                
                m.addSource('route-src', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: coords
                    }
                  }
                });
                m.addLayer({
                  id: 'route-layer',
                  type: 'line',
                  source: 'route-src',
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#00E676',
                    'line-width': 5,
                    'line-opacity': 0.8
                  }
                });
              } else {
                drawStraightLine();
              }
            })
            .catch(err => {
              console.warn("Directions API failed, using displacement vector:", err);
              drawStraightLine();
            });
        }
      }
    });

    // Update map reference values on rotate/pitch
    m.on('rotate', () => {
      setBearing(Math.round(m.getBearing()));
    });
    m.on('pitch', () => {
      setPitch(Math.round(m.getPitch()));
    });

    // Clean up
    return () => {
      m.remove();
    };
  }, [victimLat, victimLng]);

  // Sync / Draw Markers dynamically
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 1. Draw Guardian Marker (Sky Blue)
    if (guardianLat && guardianLng) {
      const guardEl = document.createElement('div');
      guardEl.className = 'relative flex items-center justify-center w-8 h-8';
      guardEl.innerHTML = `
        <div class="absolute inset-0 bg-[#06B6D4]/30 rounded-full "></div>
        <div class="w-4 h-4 bg-[#06B6D4] border-2 border-white rounded-full shadow-md z-10"></div>
      `;
      const guardMarker = new mapboxgl.Marker(guardEl)
        .setLngLat([guardianLng, guardianLat])
        .addTo(m);
      markersRef.current.push(guardMarker);
    }

    // 2. Draw Victim Marker (Pulsing Cyber Red)
    const victimEl = document.createElement('div');
    victimEl.className = 'relative flex items-center justify-center w-12 h-12';
    victimEl.innerHTML = `
      <div class="absolute inset-0 bg-[#E53E3E]/30 rounded-full " style="animation-duration: 1.5s;"></div>
      <div class="absolute inset-2 bg-[#E53E3E]/20 rounded-full "></div>
      <div class="w-6 h-6 bg-[#E53E3E] border-2 border-white rounded-full flex items-center justify-center shadow-lg z-10">
        <span class="text-white text-[9px] font-bold">▲</span>
      </div>
    `;
    const victimMarker = new mapboxgl.Marker(victimEl)
      .setLngLat([victimLng, victimLat])
      .addTo(m);
    markersRef.current.push(victimMarker);

    // 3. Draw Protectors
    nearbyProtectors.forEach(p => {
      const pLat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude;
      const pLng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude;
      if (!pLat || !pLng) return;

      const isResponded = activeSOSAlert?.responders?.[p.id];
      const distToVictim = calculateDistanceMeters(pLat, pLng, victimLat, victimLng);

      const pEl = document.createElement('div');
      
      if (isResponded) {
        // GOLDEN RESPONDED MARKER (Increased Size + Metres label above)
        pEl.className = 'relative flex flex-col items-center justify-end w-24 h-24';
        pEl.style.transform = 'translateY(-20px)'; // Center pivot offset
        pEl.innerHTML = `
          <!-- Distance Badge Above -->
          <div class="bg-[#F59E0B] border border-white/20 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg mb-1 leading-none whitespace-nowrap">
            ${distToVictim.toFixed(0)}m
          </div>
          <!-- Golden Pulse rings -->
          <div class="relative flex items-center justify-center w-11 h-11">
            <div class="absolute inset-0 bg-[#F59E0B]/30 rounded-full " style="animation-duration: 1.2s;"></div>
            <div class="absolute inset-2 bg-[#F59E0B]/20 rounded-full "></div>
            <!-- Star/Badge icon container -->
            <div class="w-9 h-9 bg-gradient-to-b from-[#FCD34D] to-[#F59E0B] border-2 border-white rounded-xl flex items-center justify-center shadow-xl z-10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-black">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
          </div>
        `;
      } else {
        // NORMAL PROTECTOR MARKER (Standard Cyan size)
        pEl.className = 'relative flex items-center justify-center w-8 h-8';
        pEl.innerHTML = `
          <div class="absolute inset-0 bg-[#00E676]/20 rounded-full"></div>
          <div class="w-4 h-4 bg-[#00E676] border-2 border-white rounded-full shadow-md z-10"></div>
        `;
      }

      const marker = new mapboxgl.Marker(pEl)
        .setLngLat([pLng, pLat])
        .addTo(m);
      markersRef.current.push(marker);
    });

  }, [nearbyProtectors, activeSOSAlert, victimLat, victimLng, guardianLat, guardianLng]);

  const recenterMap = () => {
    const m = map.current;
    if (!m) return;
    const victimCoords: [number, number] = [victimLng, victimLat];
    const targetCoords: [number, number] = guardianLat && guardianLng ? [guardianLng, guardianLat] : victimCoords;
    m.easeTo({ center: targetCoords, zoom: 15.5, pitch: 45, duration: 800 });
  };

  return (
    <div className="fixed inset-0 z-[3100000] bg-black/95 backdrop-blur-md flex flex-col font-sans text-white">
      {/* 📡 HEADER: TACTICAL TELEMETRY HUD */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#070D19]/85 backdrop-blur-md relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00E676] ">
            <Compass size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              Tactical Navigation Mode
            </h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
              Target Node: <span className="text-white">{victimName}</span> · Distance: <span className="text-[#00E676]">{hudDistance}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all active:scale-90"
        >
          <X size={18} />
        </button>
      </div>

      {/* 🗺️ FUTURE MAP CONTAINER */}
      <div className="flex-1 relative bg-[#090D1A]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* HUD Crosshairs/Compass Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-[#00E676]/5 z-10 flex items-center justify-center">
          <div className="w-40 h-40 border border-[#00E676]/10 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 border border-dashed border-[#00E676]/15 rounded-full" />
          </div>
          {/* Subtle axis */}
          <div className="absolute w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#00E676]/10 to-transparent" />
          <div className="absolute h-2/3 w-[1px] bg-gradient-to-b from-transparent via-[#00E676]/10 to-transparent" />
        </div>

        {/* Floating Left Control Panel */}
        <div className="absolute top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-2 pl-3 pr-4 py-2.5 bg-[#0D1527]/90 hover:bg-[#1E293B] border border-white/10 backdrop-blur-md rounded-2xl text-white text-[10px] font-medium uppercase tracking-wider transition-all active:scale-95 shadow-xl cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back
          </button>
          
          <div className="bg-[#070D19]/90 border border-white/10 backdrop-blur-md rounded-2xl p-3.5 space-y-2.5 text-[9px] font-medium text-slate-300 w-44 shadow-2xl">
            <div className="flex items-center justify-between">
              <span>Compass Bearing</span>
              <span className="text-[#00E676]">{bearing}°</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tilt Angle</span>
              <span className="text-[#00E676]">{pitch}°</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Responders</span>
              <span className="text-amber-400 font-bold">{respondedCount} Units</span>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons Overlay (Right Side) */}
        <div className="absolute right-4 top-4 z-[100] flex flex-col gap-2 pointer-events-auto">
          <button 
            onClick={recenterMap}
            className="w-10 h-10 rounded-xl bg-[#070D19]/90 hover:bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#00E676] shadow-xl transition-all active:scale-90"
            title="Recenter"
          >
            <Target size={18} />
          </button>
        </div>
      </div>

      {/* 📊 FOOTER SUMMARY & RESPONDING UNITS TACTICAL ROSTER */}
      <div className="p-5 border-t border-white/10 bg-[#070D19]/95 backdrop-blur-md relative z-10 shrink-0 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-[#00E676] uppercase tracking-[2px]">Responders Status</span>
            <span className="text-[8px] text-slate-400 font-medium mt-0.5">Golden Markers represent accepted responders</span>
          </div>
          <div className="px-2.5 py-1 bg-amber-400/10 border border-amber-500/20 text-amber-400 rounded-lg text-[9px] font-medium uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full " /> {respondedCount} Golden Units Active
          </div>
        </div>

        {/* Horizontal scroll list of responders */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {nearbyProtectors.length === 0 ? (
            <p className="text-[9px] text-slate-500 uppercase tracking-widest py-2">No units detected in coordinates range.</p>
          ) : (
            nearbyProtectors.map(p => {
              const isResponded = activeSOSAlert?.responders?.[p.id];
              return (
                <div 
                  key={p.id} 
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl border shrink-0 w-56 transition-all",
                    isResponded 
                      ? "bg-amber-500/10 border-amber-500/35 text-white" 
                      : "bg-white/5 border-white/5 text-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    isResponded ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-slate-400"
                  )}>
                    <Shield size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[11px] font-medium truncate flex items-center gap-1">
                      {p.name || 'Protector'}
                      {isResponded && <Check size={12} className="text-amber-400 shrink-0" strokeWidth={3} />}
                    </h5>
                    <span className="text-[8px] text-slate-400 block mt-0.5 uppercase tracking-wider">
                      {isResponded ? '👉 RESPONDED' : 'STANDBY'} · {p.distanceStr || '---'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
