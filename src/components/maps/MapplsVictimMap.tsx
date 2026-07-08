import React from 'react';
import { useKavachStore } from '../../state/useKavachStore';
import { X, Navigation, CheckCircle2, Crosshair, Activity } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { cn } from '../../lib/utils';
import { useMapplsInit } from './hooks/useMapplsInit';
import { useMapplsSync } from './hooks/useMapplsSync';
import { useMapplsControls } from './hooks/useMapplsControls';

export default function MapplsVictimMap({
  activeAlerts = [],
  onClose,
  isInterceptMode = false,
  isNavigating = false,
  onToggleNav,
  onResolve,
  onAbort,
  distance = '---',
  onFallback,
  onVictimClick,
  isCarHUD = false,
  isProtectorHUD = false
}: any) {
  const { userPos } = useKavachStore();
  const { initiateCall } = useCall();

  const activeAlert = activeAlerts.find((a: any) => a.status === 'active' || a.status === 'responding');

  const { mapRef, isLoaded, mapId } = useMapplsInit(userPos, onFallback);
  useMapplsSync(mapRef, isLoaded, userPos, activeAlert, isNavigating, onVictimClick, isCarHUD, isProtectorHUD);
  const { handleRecenter, handleZoom, toggleMapStyle } = useMapplsControls(mapRef, userPos);

  React.useEffect(() => {
    const handleRecenterEvent = () => {
      handleRecenter();
    };
    const handleToggleStyleEvent = () => {
      toggleMapStyle();
    };

    window.addEventListener('recenter-map', handleRecenterEvent);
    window.addEventListener('toggle-map-style', handleToggleStyleEvent);

    return () => {
      window.removeEventListener('recenter-map', handleRecenterEvent);
      window.removeEventListener('toggle-map-style', handleToggleStyleEvent);
    };
  }, [handleRecenter, toggleMapStyle]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0F172A]">
      <style>{`
        /* 🌑 Optimized Dark Mode Filter to Keep Streets & Alleys White */
        .mapboxgl-canvas, .mappls-map-canvas, canvas {
          filter: invert(0.88) hue-rotate(195deg) brightness(1.25) contrast(1.35) saturate(0.7) !important;
        }
        .pulse-marker-victim {
          width: 20px; height: 20px;
          background: #EF4444; border: 3px solid white;
          border-radius: 50%; position: relative;
          margin: 15px; 
        }
        .pulse-marker-protector {
          width: 16px; height: 16px;
          background: #3B82F6; border: 3px solid white;
          border-radius: 50%; position: relative;
          margin: 10px;
        }
        /* 🚫 Hide ONLY the ugly Green Start/End Markers via precise CSS, but keep the Bike! */
        div[title="Start"], div[title="End"], 
        .mappls-marker[style*="marker.png"], 
        .mapboxgl-marker[style*="marker.png"],
        .mapboxgl-popup, .mappls-popup {
          display: none !important;
        }
        /* Make sure the map doesn't show direction boxes */
        [class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"],
        .mappls-ctrl, .mapboxgl-ctrl, .mmi-ctrl, .mappls-control,
        [title="Map layers"], [title="Map Layers"] { 
          display: none !important; 
        }
        /* Hidden native boxes to preserve HUD */
        .mappls-direction-box, .mappls-direction-step-container, 
        .mappls-direction-header, .mappls-direction-summary, .mappls-routing-box { 
          display: none !important; 
        }
      `}</style>
      <div id={mapId} style={{ width: '100%', height: '100%', display: 'inline-block' }} />
      <div id={`direction-container-${mapId}`} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px', overflow: 'hidden' }} />

      {/* 🚀 BULLETPROOF REACT MAP CONTROLS - VERTICALLY CENTERED */}
      {!isProtectorHUD && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[20] flex flex-col gap-3 pointer-events-auto">
          {/* Layer Switcher Removed */}

          {/* Zoom Controls */}
          <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
            <button onClick={() => handleZoom('in')} className="w-12 h-12 flex items-center justify-center active:bg-gray-100 border-b border-gray-100 transition-colors">
              <span className="text-gray-700 text-xl font-medium leading-none">+</span>
            </button>
            <button onClick={() => handleZoom('out')} className="w-12 h-12 flex items-center justify-center active:bg-gray-100 transition-colors">
              <span className="text-gray-700 text-3xl font-medium leading-none mb-1">-</span>
            </button>
          </div>

          {/* Recenter / My Location */}
          <button onClick={handleRecenter} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center active:scale-90 transition-all mt-1">
            <Crosshair size={22} className="text-blue-600" />
          </button>
        </div>
      )}

      {/* TACTICAL HUD */}
      {isInterceptMode && (
        <div className="absolute top-40 right-4 flex flex-col gap-3 z-[20] pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-red-500/30 p-3 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <span className="text-[7px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1.5"><Crosshair size={10} /> TARGET LOCK</span>
            <span className="text-2xl text-white font-black italic tracking-tighter tabular-nums leading-none mt-2">{distance}</span>
            <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-1">Intercept Distance</span>
          </div>
          {isNavigating && (
            <div className="bg-blue-600/90 backdrop-blur-md border border-blue-400 p-3 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <span className="text-[7px] text-blue-200 font-black uppercase tracking-widest flex items-center gap-1"><Activity size={10} /> ROUTING ETA</span>
              <span className="text-xl text-white font-black italic tracking-tighter tabular-nums leading-none mt-2">
                {parseInt(distance) > 0 ? `${Math.ceil(parseInt(distance) / 1000 * 2.5)} MIN` : '1 MIN'}
              </span>
            </div>
          )}
        </div>
      )}

      {isInterceptMode && onClose && (
        <div className="absolute top-8 left-6 z-[20] pointer-events-auto">
          <button onClick={onClose} className="w-10 h-10 bg-white text-[#0F172A] rounded-full shadow-xl flex items-center justify-center border border-gray-100 active:scale-95 transition-transform">
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      )}

      {isInterceptMode && (
        <div className="absolute inset-x-0 bottom-6 px-4 z-[20] pointer-events-none">
          <div className="w-full max-w-[500px] mx-auto bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 pointer-events-auto flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-[#0F172A]">{parseInt(distance) < 50 ? 'Arrived' : 'ETA Active'}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{distance}</p>
              </div>
              <div className="flex items-center gap-2">
                {onAbort && (
                  <button onClick={onAbort} className="px-4 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all">
                    Stand Down
                  </button>
                )}
                <button onClick={onToggleNav} className={cn("px-4 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm transition-all active:scale-95", isNavigating ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-600 text-white shadow-blue-600/20")}>
                  <Navigation size={12} fill={isNavigating ? "currentColor" : "none"} />
                  <span>{isNavigating ? "Stop" : "Navigate"}</span>
                </button>
                <button onClick={onResolve} className="px-4 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
                  <CheckCircle2 size={12} /> Safe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}