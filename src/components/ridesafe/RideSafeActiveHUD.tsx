import React from 'react';
import { ShieldAlert, ShieldCheck, Layers, Navigation, X, Route } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  holdProgress: number;
  handleSOSPress: () => void;
  handleSOSRelease: () => void;
  setShowPinModal: (show: boolean) => void;
  showLayerMenu: boolean;
  setShowLayerMenu: (show: boolean) => void;
  mapStyle: 'streets' | 'satellite' | 'dark';
  setMapStyle: (s: 'streets' | 'satellite' | 'dark') => void;
  displayMinutes: number | string;
  displayDistance: number | string;
}

export default function RideSafeActiveHUD({
  holdProgress, handleSOSPress, handleSOSRelease, setShowPinModal,
  showLayerMenu, setShowLayerMenu, mapStyle, setMapStyle,
  displayMinutes, displayDistance
}: Props) {
  return (
    <>
      <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-10 pointer-events-auto">
        <div className="max-w-lg mx-auto bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 sm:p-2.5 rounded-[28px] flex gap-2">
          <button
            onPointerDown={handleSOSPress} onPointerUp={handleSOSRelease} onPointerLeave={handleSOSRelease}
            className="relative overflow-hidden flex-1 py-3 sm:py-4 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-[22px] text-[11px] sm:text-[12px] font-black uppercase tracking-[2px] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center select-none"
          >
            <div className="absolute inset-y-0 left-0 bg-red-800 transition-all duration-100 ease-linear z-0" style={{ width: `${holdProgress}%` }} />
            <div className="relative z-10 flex items-center gap-1.5 drop-shadow-md">
              <ShieldAlert size={14} className={holdProgress > 0 ? "animate-ping" : ""} />
              <span>{holdProgress > 0 ? "HOLDING..." : "Trigger SOS"}</span>
            </div>
          </button>
          <button
            onClick={() => setShowPinModal(true)}
            className="flex-1 py-3 sm:py-4 bg-white/10 hover:bg-white/20 text-white rounded-[22px] text-[11px] sm:text-[12px] font-black uppercase tracking-[2px] active:scale-[0.98] transition-all flex items-center justify-center border border-white/5 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 drop-shadow-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>End Session</span>
            </div>
          </button>
        </div>
      </div>

      <div className="absolute top-24 sm:top-28 left-4 z-10 pointer-events-auto">
        <div className="w-[60px] h-[60px] bg-[#2C3338] rounded-full border-[3px] border-[#3A4349] flex flex-col items-center justify-center shadow-lg">
          <span className="text-white text-xl font-black leading-none mt-1">0</span>
          <span className="text-gray-400 text-[9px] font-bold">km/h</span>
        </div>
      </div>

      <div className="absolute top-24 sm:top-28 right-4 z-10 flex flex-col gap-3 pointer-events-auto items-end">
        <div className="relative">
          <button onClick={() => setShowLayerMenu(!showLayerMenu)} className={cn("w-14 h-14 bg-white rounded-[20px] flex items-center justify-center shadow-lg active:scale-95 transition-all border", showLayerMenu ? "border-blue-500/30" : "border-gray-100")}>
            <Layers size={24} strokeWidth={2.5} className={cn(showLayerMenu ? "text-blue-600" : "text-[#3A4349]")} />
          </button>
          {showLayerMenu && (
            <div className="absolute top-0 right-16 w-[260px] bg-white rounded-[24px] p-2 shadow-2xl border border-gray-100 flex flex-col gap-1 z-20 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 pt-3"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Map Layers</span></div>
              {(['streets', 'dark', 'satellite'] as const).map(s => (
                <button key={s} onClick={() => { setMapStyle(s); setShowLayerMenu(false); }} className={cn("w-full flex items-center gap-4 px-5 py-3 rounded-[18px] text-left font-black text-[12px] uppercase tracking-widest", mapStyle === s ? "bg-gray-900 text-white" : "hover:bg-gray-100/80 text-gray-600")}>
                  <div className={cn("w-2 h-2 rounded-full", mapStyle === s ? "bg-white" : "bg-gray-400")} />
                  {s === 'streets' ? 'Standard Streets' : s === 'dark' ? 'Tactical Dark' : 'Satellite Intel'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-28 sm:bottom-32 right-4 z-10 pointer-events-auto">
        <button onClick={() => window.dispatchEvent(new CustomEvent('recenter-map'))} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 active:scale-95 border border-gray-100 group">
          <Navigation size={24} strokeWidth={2.5} className="text-[#3A4349] group-active:text-blue-500 transition-colors" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-auto">
        <div className="bg-white rounded-[32px] p-4 flex items-center justify-between shadow-2xl max-w-lg mx-auto border border-gray-100">
          <button onClick={() => setShowPinModal(true)} className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 shrink-0"><X size={26} strokeWidth={2.5} /></button>
          <div className="flex flex-col items-center justify-center">
            <div className="text-red-600 text-[28px] font-black tracking-tight flex items-baseline gap-1.5 leading-none">{displayMinutes} <span className="text-base font-bold">min</span></div>
            <div className="text-[#3A4349] text-xs font-bold flex items-center gap-1.5 mt-1">
              <span>{displayDistance} km</span><span className="w-1 h-1 bg-gray-400 rounded-full" /><span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <button className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 shrink-0"><Route size={22} strokeWidth={2.5} className="text-[#3A4349]" /></button>
        </div>
      </div>
    </>
  );
}
