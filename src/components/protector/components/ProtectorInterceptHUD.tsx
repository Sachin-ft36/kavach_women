import React from 'react';
import { Navigation, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import VictimMap from '../../maps/VictimMap';
import MapplsVictimMap from '../../maps/MapplsVictimMap';

export function ProtectorInterceptHUD({
  isInterceptHUDOpen,
  activeInterceptAlert,
  useMapboxFallback,
  isNavigating,
  distanceToVictim,
  setIsNavigating,
  setResolvingAlert,
  setIsInterceptHUDOpen,
  setInterceptActive,
  setUseMapboxFallback
}: any) {
  if (!isInterceptHUDOpen || !activeInterceptAlert) return null;

  return (
    <div className="fixed inset-0 z-[2000000] bg-white animate-none">
      <div className="absolute inset-0">
        {!useMapboxFallback ? (
          <MapplsVictimMap 
            activeAlerts={[activeInterceptAlert]} 
            isInterceptMode={true} 
            isNavigating={isNavigating} 
            distance={distanceToVictim[activeInterceptAlert.id] || '---'} 
            onToggleNav={() => setIsNavigating(!isNavigating)} 
            onResolve={() => { 
              setResolvingAlert(activeInterceptAlert); 
              setIsInterceptHUDOpen(false); 
              setInterceptActive(false); 
              setIsNavigating(false); 
            }} 
            onClose={() => { 
              setIsInterceptHUDOpen(false); 
              setInterceptActive(false); 
              setIsNavigating(false); 
            }} 
            onFallback={() => setUseMapboxFallback(true)} 
          />
        ) : (
          <VictimMap 
            activeAlerts={[activeInterceptAlert]} 
            isInterceptMode={true} 
            isNavigating={isNavigating} 
            distance={distanceToVictim[activeInterceptAlert.id] || '---'} 
            onToggleNav={() => setIsNavigating(!isNavigating)} 
            onResolve={() => { 
              setResolvingAlert(activeInterceptAlert); 
              setIsInterceptHUDOpen(false); 
              setInterceptActive(false); 
              setIsNavigating(false); 
            }} 
            onClose={() => { 
              setIsInterceptHUDOpen(false); 
              setInterceptActive(false); 
              setIsNavigating(false); 
            }} 
          />
        )}
      </div>
      <div className="absolute inset-x-0 top-0 pt-16 px-6 pointer-events-none">
        <div className={cn("backdrop-blur-xl rounded-[24px] p-5 border shadow-2xl flex items-center justify-between transition-all duration-700", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "bg-emerald-50/95 border-emerald-200" : "bg-white/95 border-slate-200")}>
          <div className="flex items-center gap-4">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white transition-all shadow-md", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "bg-emerald-600" : "bg-blue-600")}>
              {(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? <CheckCircle2 size={28} /> : <Navigation size={28} />}
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "text-emerald-600" : "text-blue-600")}>{(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "TARGET REACHED" : "Tactical Intercept Active"}</p>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mt-1">{(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "INITIATE CLEARANCE" : "LIVE TARGET LOCK"}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
