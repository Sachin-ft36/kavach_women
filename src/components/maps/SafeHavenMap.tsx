import React, { useEffect, useState } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { X, Navigation, LocateFixed, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useMapplsInit } from './hooks/useMapplsInit';
import { useSafeHavenData } from './hooks/useSafeHavenData';
import { useSafeHavenSync } from './hooks/useSafeHavenSync';
import { useMapplsControls } from './hooks/useMapplsControls';

export default function SafeHavenMap({ onClose, initialTarget }: { onClose: () => void, initialTarget?: {lat: number, lng: number, name: string, dist?: string} }) {
  const { userPos, activeRadius } = useKavachStore();
  const [targetPoint, setTargetPoint] = useState<{lat: number, lng: number, name: string, type: 'police'|'protector', dist?: string} | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all'|'police'|'pcr'|'civilian'>('all');

  const { mapRef, isLoaded, mapId } = useMapplsInit(userPos);
  const { policeStations, protectors } = useSafeHavenData(userPos);
  useSafeHavenSync(mapRef, isLoaded, userPos, policeStations, protectors, activeFilter, targetPoint, setTargetPoint, isNavigating, isCameraLocked);

  const { mapStyle, toggleMapStyle, handleZoom } = useMapplsControls(mapRef, userPos);

  // Auto-Select Initial Target
  useEffect(() => {
    if (isLoaded && initialTarget && !targetPoint) {
      setTargetPoint({
        lat: initialTarget.lat,
        lng: initialTarget.lng,
        name: initialTarget.name,
        type: 'police',
        dist: initialTarget.dist || 'NEARBY'
      });
      setIsNavigating(true);
    }
  }, [isLoaded, initialTarget]);

  const handleFilterClick = (filter: 'police' | 'pcr' | 'civilian') => {
    const newFilter = activeFilter === filter ? 'all' : filter;
    setActiveFilter(newFilter);
    setIsCameraLocked(false);
    
    if (mapRef.current && userPos) {
      if (typeof mapRef.current.setPitch === 'function') mapRef.current.setPitch(0);
      let minLat = userPos.lat, maxLat = userPos.lat;
      let minLng = userPos.lng, maxLng = userPos.lng;

      if (newFilter === 'all' || newFilter === 'police') {
        policeStations.forEach(s => {
          if(s.lat && s.lng) {
            if(s.lat < minLat) minLat = s.lat; if(s.lat > maxLat) maxLat = s.lat;
            if(s.lng < minLng) minLng = s.lng; if(s.lng > maxLng) maxLng = s.lng;
          }
        });
      }

      protectors.forEach(p => {
        if(p.coords) {
          const isPCR = p.protectorVetting?.occupation?.toLowerCase().includes('police');
          if (newFilter !== 'all' && newFilter === 'pcr' && !isPCR) return;
          if (newFilter !== 'all' && newFilter === 'civilian' && isPCR) return;
          if (newFilter === 'police') return;

          if(p.coords[0] < minLat) minLat = p.coords[0]; if(p.coords[0] > maxLat) maxLat = p.coords[0];
          if(p.coords[1] < minLng) minLng = p.coords[1]; if(p.coords[1] > maxLng) maxLng = p.coords[1];
        }
      });

      mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 15 });
    }
  };

  const startInternalNav = () => {
    if (!targetPoint || !userPos || !mapRef.current) return;
    setIsNavigating(true);
    mapRef.current.setCenter({ lat: userPos.lat, lng: userPos.lng });
    mapRef.current.setZoom(18);
    setIsCameraLocked(true);
    if (typeof mapRef.current.setPitch === 'function') {
      mapRef.current.setPitch(60);
    }
    toast.success(`Navigating to ${targetPoint.name}`);
  };

  const handleRecenter = () => {
    if (mapRef.current && userPos) {
      mapRef.current.setCenter({ lat: userPos.lat, lng: userPos.lng });
      mapRef.current.setZoom(17);
      setIsCameraLocked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <style>{`
        .tactical-marker {
          width: 32px; height: 32px;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 14px; cursor: pointer; transition: all 0.2s;
        }
        .tactical-marker.police { border-color: #3B82F6; }
        .tactical-marker.pcr { border-color: #F59E0B; }
        .tactical-marker.protector { border-color: #10B981; }
        .tactical-marker:active { transform: scale(0.9); }
        .pulse-marker-victim {
          width: 20px; height: 20px;
          background: #EF4444; border: 3px solid white;
          border-radius: 50%; position: relative;
          margin: 15px; 
        }
        .nav-pulse-marker {
          width: 24px; height: 24px;
          background: #3B82F6; border: 4px solid white;
          border-radius: 50%; position: relative;
          margin: 12px;
        }
        div[title="Start"], div[title="End"], .mappls-popup, .mapboxgl-popup { display: none !important; }
        [class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"] { display: none !important; }
        .mappls-direction-box, .mappls-layer-control, .mappls-control-layer, .layer-control, div[title="Map Layers"] { display: none !important; }
      `}</style>

      <div id={mapId} style={{ width: '100%', height: '100%' }} />

      {/* Top Header Area: Close Button + Legend */}
      <div className="absolute top-8 left-4 right-4 z-[20] flex items-center justify-between gap-2 max-w-[500px] mx-auto">
        {/* Close Button */}
        <button onClick={onClose} className="w-10 h-10 shrink-0 bg-[#050B14] shadow-[0_4px_15px_rgba(0,0,0,0.5)] text-white rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Premium Map Legend (Click to Filter & Zoom) */}
        {!initialTarget && (
          <div className="flex-1 bg-[#141416] border border-[#2A2A2D] p-1 rounded-full flex items-center gap-1">
            
            <button 
              onClick={() => handleFilterClick('police')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 border", 
                activeFilter === 'police' 
                  ? "bg-blue-500/20 border-blue-500/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.3)] scale-[1.02]" 
                  : activeFilter === 'all' 
                    ? "bg-white/5 border-white/5 hover:bg-white/10" 
                    : "bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
               <span className="text-[11px] drop-shadow-md">🚨</span>
               <span className={cn("text-[7px] font-black uppercase tracking-wider", activeFilter === 'police' ? "text-blue-400" : "text-white/90")}>Station</span>
            </button>
            
            <button 
              onClick={() => handleFilterClick('pcr')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 border", 
                activeFilter === 'pcr' 
                  ? "bg-amber-500/20 border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]" 
                  : activeFilter === 'all' 
                    ? "bg-white/5 border-white/5 hover:bg-white/10" 
                    : "bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
               <span className="text-[11px] drop-shadow-md">🚓</span>
               <span className={cn("text-[7px] font-black uppercase tracking-wider", activeFilter === 'pcr' ? "text-amber-400" : "text-white/90")}>PCR</span>
            </button>

            <button 
              onClick={() => handleFilterClick('civilian')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 border", 
                activeFilter === 'civilian' 
                  ? "bg-emerald-500/20 border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]" 
                  : activeFilter === 'all' 
                    ? "bg-white/5 border-white/5 hover:bg-white/10" 
                    : "bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
               <span className="text-[11px] drop-shadow-md">🛡️</span>
               <span className={cn("text-[7px] font-black uppercase tracking-wider", activeFilter === 'civilian' ? "text-emerald-400" : "text-white/90")}>Civilian</span>
            </button>

          </div>
        )}
      </div>

      {/* 🚀 BULLETPROOF REACT MAP CONTROLS - VERTICALLY CENTERED */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[20] flex flex-col gap-3 pointer-events-auto">
        {/* Recenter / My Location */}
        <button 
          onClick={handleRecenter} 
          className="w-12 h-12 bg-[#141416] rounded-2xl border border-[#2A2A2D] flex items-center justify-center active:scale-90 transition-transform group"
        >
          <LocateFixed size={22} className={cn("transition-colors", isCameraLocked ? "text-blue-500" : "text-gray-400 group-hover:text-white")} />
        </button>
      </div>

      {/* Selected Target HUD or Active Navigation HUD */}
      <AnimatePresence>
        {targetPoint && !isNavigating && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-8 inset-x-4 z-[20]"
          >
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-3xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {targetPoint.type === 'police' ? 'Verified Station' : 'Active Unit'}
                  </span>
                  <h3 className="text-white font-black text-lg mt-2 leading-tight pr-4">{targetPoint.name}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                    <Activity size={10} className="text-emerald-500" /> 
                    {targetPoint.dist || 'Calculating ETA...'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                    {targetPoint.type === 'police' ? <ShieldCheck size={24} /> : <Navigation size={20} />}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTargetPoint(null)}
                  className="w-full py-3.5 rounded-[16px] font-bold text-[11px] uppercase tracking-wider border border-white/10 text-white/70 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={startInternalNav}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[16px] font-bold text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={14} /> Navigate
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isNavigating && targetPoint && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[30] w-11/12 max-w-sm"
          >
            <div className="bg-[#141416] border border-[#2A2A2D] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                   <Navigation size={20} className="text-emerald-400" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Navigating To</span>
                  <h3 className="text-white font-black text-sm truncate">{targetPoint.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsNavigating(false);
                  if (mapRef.current && typeof mapRef.current.setPitch === 'function') {
                    mapRef.current.setPitch(0); // Reset pitch
                  }
                }}
                className="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-all flex-shrink-0 ml-2"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
