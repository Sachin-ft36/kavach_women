import React, { useState } from 'react';
import { Shield, Navigation, CheckCircle2, PhoneCall, Car, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import VictimMap from '../maps/VictimMap';
import MapplsVictimMap from '../maps/MapplsVictimMap';

interface Props {
  vehicle: string;
  zone: string;
  isSirenActive: boolean;
  setIsSirenActive: (v: boolean) => void;
  carSpeed: number;
  etaTimer: string;
  shiftElapsedSeconds: number;
  formatShiftTime: (s: number) => string;
  hasSOS: boolean;
  sosAlert: any;
  isNavigating: boolean;
  setIsNavigating: (v: boolean) => void;
  respondingToId: string | null;
  distanceToVictim: Record<string, string>;
  setResolvingAlert: (a: any) => void;
  handleStartHelp: (id: string) => void;
  maskName: (n: string) => string;
  setIsCarScreenOpen: (v: boolean) => void;
}

export default function PCRCarScreen({
  vehicle, zone, isSirenActive, setIsSirenActive,
  carSpeed, etaTimer, shiftElapsedSeconds, formatShiftTime,
  hasSOS, sosAlert, isNavigating, setIsNavigating,
  respondingToId, distanceToVictim, setResolvingAlert,
  handleStartHelp, maskName, setIsCarScreenOpen
}: Props) {
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-900 z-[10000] flex flex-col font-sans text-slate-850 overflow-hidden">
      <div className="absolute inset-0 border-[16px] border-slate-950 rounded-[32px] overflow-hidden flex flex-col bg-slate-50">

        {/* Top Widescreen Status Bar */}
        <div className="h-12 border-b px-6 flex justify-between items-center bg-white border-slate-200 text-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-blue-600 tracking-[3px] uppercase">KAVACH PCR SMART TELEMETRY</span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">CALLSIGN: {vehicle}</span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">ZONE: {zone}</span>
          </div>

          {isSirenActive && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-600 rounded-sm" />
              <div className="w-4 h-2 bg-red-600 rounded-sm" />
              <span className="text-[8px] font-black uppercase tracking-wider text-red-600">SIREN BROADCAST ACTIVE</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono font-black text-slate-600">{formatShiftTime(shiftElapsedSeconds)}</span>
            <button
              onClick={() => setIsCarScreenOpen(false)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              📱 MOBILE VIEW
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-4 animate-none shrink-0">
          {[
            { label: 'SPEED', value: `${carSpeed} km/h`, color: '#EF4444' },
            { label: 'ETA', value: hasSOS ? etaTimer : '00:00.0', color: '#D97706' },
            { label: 'SHIFT ELAPSED', value: formatShiftTime(shiftElapsedSeconds), color: '#0284C7' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-[20px] py-4 px-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[2.5px] leading-none mb-1.5">{label}</p>
              <p className="text-xl font-mono font-black leading-none" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Main Landscape Split Screen */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className={cn('h-full relative transition-all duration-500', isNavigating ? 'w-full' : 'w-2/3 border-r border-slate-200')}>
            {!useMapboxFallback ? (
              <MapplsVictimMap
                activeAlerts={sosAlert ? [sosAlert] : []}
                mapStyle="streets"
                isNavigating={isNavigating}
                isInterceptMode={isNavigating}
                onToggleNav={() => setIsNavigating(!isNavigating)}
                onResolve={() => setResolvingAlert(sosAlert)}
                distance={sosAlert ? (distanceToVictim[sosAlert.id] || '---') : '---'}
                isCarHUD={true}
                onFallback={() => setUseMapboxFallback(true)}
              />
            ) : (
              <VictimMap
                activeAlerts={sosAlert ? [sosAlert] : []}
                mapStyle="streets"
                isNavigating={isNavigating}
                isInterceptMode={isNavigating}
                onToggleNav={() => setIsNavigating(!isNavigating)}
                onResolve={() => setResolvingAlert(sosAlert)}
                distance={sosAlert ? (distanceToVictim[sosAlert.id] || '---') : '---'}
                isCarHUD={true}
              />
            )}

            {!isNavigating && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 border border-slate-200 rounded-2xl p-4 flex items-center justify-between z-10 shadow-lg text-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-600">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Live Navigation Directive</span>
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 mt-0.5">
                      {hasSOS
                        ? `🚨 INTERCEPT ROUTE LOCK — PROCEED TO ${sosAlert?.locationName?.toUpperCase() || 'TARGET COORDINATES'}`
                        : '✓ STANDBY IN ZONE — MAIN STREETS / HIGH-INTEGRITY SECTOR PATROL'}
                    </p>
                  </div>
                </div>
                {hasSOS && (
                  <div className="text-right">
                    <p className="text-[7px] text-slate-500 uppercase tracking-widest">Target Distance</p>
                    <p className="text-lg font-black text-rose-600 font-mono leading-none mt-0.5">{distanceToVictim[sosAlert?.id] || 'Calculating...'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Command Console */}
          {!isNavigating && (
            <div className="w-1/3 h-full bg-white flex flex-col p-5 space-y-4 overflow-y-auto border-l border-slate-200">
              {/* Speed & ETA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest block">Vehicle Speed</span>
                  <p className="text-xl font-black text-sky-600 font-mono mt-1">{carSpeed} km/h</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest block">Scene ETA</span>
                  <p className="text-xl font-black text-amber-600 font-mono mt-1">{hasSOS ? etaTimer : '—'}</p>
                </div>
              </div>

              {/* Siren & Megaphone */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsSirenActive(!isSirenActive)}
                  className={cn(
                    'py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-wider active:scale-95 border cursor-pointer',
                    isSirenActive ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/25' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {isSirenActive ? '🚨 SIREN ON' : '🚨 SIREN OFF'}
                </button>
                <button
                  onClick={() => toast.success('Megaphone Mode Switched')}
                  className="py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-wider active:scale-95 cursor-pointer"
                >
                  📢 MEGAPHONE
                </button>
              </div>

              {/* Target Case Info */}
              {hasSOS && sosAlert ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[7px] text-rose-600 font-black uppercase tracking-widest block">🚨 Active Threat Locked</span>
                    <h3 className="text-sm font-black text-slate-800 uppercase italic leading-tight mt-1 truncate">
                      {maskName(sosAlert.victimName || sosAlert.userName || 'Unknown Victim')}
                    </h3>
                    <p className="text-[8px] text-slate-500 mt-1 leading-snug truncate">{sosAlert.locationName || 'Coordinates Lock Active'}</p>
                    {sosAlert.guardianContacts && sosAlert.guardianContacts.length > 0 && (
                      <div className="mt-3 bg-red-100 border border-red-200 rounded-xl p-2.5">
                        <span className="text-[6px] font-black text-red-800 uppercase tracking-widest flex items-center gap-1 mb-1.5"><PhoneCall size={8} /> Guardian Info</span>
                        {sosAlert.guardianContacts.map((g: any, i: number) => (
                          <div key={i} className="flex justify-between items-center mt-1 text-red-900 font-bold uppercase">
                            <span className="text-[7px]">{g.name || 'Guardian'}</span>
                            <a href={`tel:${g.phone}`} className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-md text-[7px] tracking-wider active:scale-95"><PhoneCall size={6} /> CALL</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {respondingToId === sosAlert.id ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setIsNavigating(!isNavigating)}
                          className={cn(
                            'py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border',
                            isNavigating
                              ? 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200'
                              : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25'
                          )}
                        >
                          <Navigation size={10} fill={isNavigating ? 'currentColor' : 'none'} />
                          {isNavigating ? 'STOP NAV' : 'START NAV'}
                        </button>
                        <button
                          onClick={() => setResolvingAlert(sosAlert)}
                          className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 border border-emerald-500"
                        >
                          <CheckCircle2 size={10} /> CLEAR (BNSS)
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartHelp(sosAlert.id)}
                        className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-wider active:scale-95 cursor-pointer"
                      >
                        ACCEPT &amp; START DISPATCH
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex-1 flex flex-col justify-center items-center text-center space-y-2 shadow-sm">
                  <Shield size={28} className="text-slate-400" />
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">ALL SECTORS SECURE</p>
                  <p className="text-[7px] text-slate-500 uppercase tracking-wider">No active emergency signals</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
