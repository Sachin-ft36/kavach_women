import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Play, Pause, RotateCcw, X, Clock, MapPin, Navigation } from 'lucide-react';
import { cn } from '../../lib/utils';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
mapboxgl.accessToken = MAPBOX_TOKEN;

interface JourneyPlaybackOverlayProps {
  journey: any;
  onClose: () => void;
}

export default function JourneyPlaybackOverlay({ journey, onClose }: JourneyPlaybackOverlayProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const playMarker = useRef<mapboxgl.Marker | null>(null);
  
  const path = journey.path || [];
  const plannedRoute = journey.plannedRoute || [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4 | 8>(2);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || path.length === 0) return;

    const firstPt = path[0];
    const firstCoords: [number, number] = [firstPt.lng || firstPt.longitude || 75.7873, firstPt.lat || firstPt.latitude || 26.9124];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: firstCoords,
      zoom: 15.5,
      pitch: 45,
      bearing: 0
    });

    const m = map.current;

    m.on('style.load', () => {
      // 1. Draw Planned Route Line (Blue dashed)
      if (plannedRoute.length > 0) {
        const plannedCoords = plannedRoute.map((p: any) => [p.lng || p.longitude, p.lat || p.latitude]);
        m.addSource('planned-route-src', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: plannedCoords }
          }
        });
        m.addLayer({
          id: 'planned-route-layer',
          type: 'line',
          source: 'planned-route-src',
          paint: {
            'line-color': '#3B82F6',
            'line-width': 4,
            'line-opacity': 0.4,
            'line-dasharray': [2, 2]
          }
        });
      }

      // 2. Draw Traveled Route Line (Thick Orange/Red line)
      const traveledCoords = path.map((p: any) => [p.lng || p.longitude || p[0], p.lat || p.latitude || p[1]]);
      m.addSource('traveled-route-src', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: traveledCoords }
        }
      });
      m.addLayer({
        id: 'traveled-route-layer',
        type: 'line',
        source: 'traveled-route-src',
        paint: {
          'line-color': '#EF4444',
          'line-width': 5,
          'line-opacity': 0.85
        }
      });

      // 3. Draw Start Pin (Green)
      const startEl = document.createElement('div');
      startEl.className = 'w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg';
      new mapboxgl.Marker(startEl)
        .setLngLat(firstCoords)
        .addTo(m);

      // 4. Draw Destination Pin (Red Checker)
      if (journey.targetCoords) {
        const targetCoords: [number, number] = [journey.targetCoords.lng || journey.targetCoords.longitude || journey.targetCoords[1], journey.targetCoords.lat || journey.targetCoords.latitude || journey.targetCoords[0]];
        const destEl = document.createElement('div');
        destEl.className = 'w-4.5 h-4.5 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg';
        destEl.innerHTML = '<div class="w-1.5 h-1.5 bg-white rounded-full"></div>';
        new mapboxgl.Marker(destEl)
          .setLngLat(targetCoords)
          .addTo(m);
      }

      // 5. Draw Playback Moving Marker (Pulsing Green dot)
      const playEl = document.createElement('div');
      playEl.className = 'relative flex items-center justify-center w-8 h-8';
      playEl.innerHTML = `
        <div class="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping" style="animation-duration: 1.2s;"></div>
        <div class="w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-md z-10"></div>
      `;
      playMarker.current = new mapboxgl.Marker(playEl)
        .setLngLat(firstCoords)
        .addTo(m);

      // Fit bounds to show the entire traveled path
      const bounds = new mapboxgl.LngLatBounds();
      traveledCoords.forEach(coord => bounds.extend(coord as [number, number]));
      m.fitBounds(bounds, { padding: 50, maxZoom: 17, duration: 1000 });
    });

    return () => {
      m.remove();
    };
  }, [journey.id]);

  // Handle Playback Loop
  useEffect(() => {
    if (!isPlaying || path.length === 0) return;

    const baseSpeed = 1000; // 1s per step at 1x
    const stepDuration = baseSpeed / playbackSpeed;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => {
        if (prev >= path.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, path.length]);

  // Sync Marker Position and Map Center to currentIdx
  useEffect(() => {
    const m = map.current;
    if (!m || !playMarker.current || path.length === 0) return;

    const pt = path[currentIdx];
    const coords: [number, number] = [pt.lng || pt.longitude, pt.lat || pt.latitude];

    playMarker.current.setLngLat(coords);
    m.easeTo({ center: coords, duration: 200, essential: true });
  }, [currentIdx, path]);

  const progressPercent = path.length > 1 ? (currentIdx / (path.length - 1)) * 100 : 100;

  return (
    <div className="fixed inset-0 z-[3100000] bg-black/95 backdrop-blur-md flex flex-col font-sans text-white">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#070D19]/80 backdrop-blur-md relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            <Navigation size={18} className="rotate-45" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider">Tactical Route Playback</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
              Citizen: <span className="text-white">{journey.userName}</span> · Status: Complete
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

      {/* Map Body */}
      <div className="flex-1 relative bg-[#090D1A]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* Floating Back Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-[100] flex items-center gap-2 pl-3 pr-4 py-2.5 bg-[#0D1527]/90 hover:bg-[#1E293B] border border-white/15 backdrop-blur-md rounded-2xl text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-xl cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </button>
      </div>

      {/* Playback Controls Panel */}
      <div className="p-6 border-t border-white/10 bg-[#070D19]/95 backdrop-blur-md relative z-10 shrink-0 space-y-4">
        {/* Timeline Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9.5px] font-black uppercase tracking-wider text-slate-400">
            <span>START PATH</span>
            <span>Step {currentIdx + 1} of {path.length}</span>
            <span>DESTINATION</span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 flex items-center">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-150" 
              style={{ width: `${progressPercent}%` }} 
            />
            <input 
              type="range"
              min={0}
              max={path.length - 1}
              value={currentIdx}
              onChange={(e) => setCurrentIdx(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-white/10 shadow-lg cursor-pointer",
                isPlaying ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button
              onClick={() => {
                setCurrentIdx(0);
                setIsPlaying(false);
              }}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer text-slate-350"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Speed Toggle */}
          <div className="flex bg-slate-800/80 border border-white/5 rounded-2xl p-1 gap-1">
            {([1, 2, 4, 8] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  playbackSpeed === speed 
                    ? "bg-emerald-600 text-white shadow-md" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
