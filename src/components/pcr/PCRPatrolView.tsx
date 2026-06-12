import React, { useState } from 'react';
import { Shield, MapPin, Activity, Navigation, CheckCircle2, PhoneCall, Car, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import VictimMap from '../maps/VictimMap';
import MapplsVictimMap from '../maps/MapplsVictimMap';

interface Props {
  vehicle: string;
  zone: string;
  shiftPartner: string;
  hasSOS: boolean;
  sosAlert: any;
  carSpeed: number;
  etaTimer: string;
  shiftElapsedSeconds: number;
  formatShiftTime: (s: number) => string;
  isSirenActive: boolean;
  setIsSirenActive: (v: boolean) => void;
  isNavigating: boolean;
  setIsNavigating: (v: boolean) => void;
  respondingToId: string | null;
  distanceToVictim: Record<string, string>;
  activeAlerts: any[];
  setActiveInterceptAlert: (a: any) => void;
  setIsInterceptHUDOpen: (v: boolean) => void;
  setInterceptActive: (v: boolean) => void;
  setResolvingAlert: (a: any) => void;
  handleStartHelp: (id: string) => void;
  maskName: (n: string) => string;
  user: any;
  handleToggleDuty: () => void;
  setIsCarScreenOpen: (v: boolean) => void;
}

export default function PCRPatrolView({
  vehicle, zone, shiftPartner, hasSOS, sosAlert,
  carSpeed, etaTimer, shiftElapsedSeconds, formatShiftTime,
  isSirenActive, setIsSirenActive, isNavigating, setIsNavigating,
  respondingToId, distanceToVictim, activeAlerts,
  setActiveInterceptAlert, setIsInterceptHUDOpen, setInterceptActive,
  setResolvingAlert, handleStartHelp, maskName, user,
  handleToggleDuty, setIsCarScreenOpen
}: Props) {
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50 relative">
      {/* Top Command Bar */}
      <div className="sticky top-0 z-30 px-5 py-3 flex justify-between items-center border-b bg-white border-slate-200 text-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-2 h-2 rounded-full', hasSOS ? 'bg-red-500' : 'bg-emerald-500')} />
          <div>
            <p className={cn('text-[8px] font-black uppercase tracking-[2px]', hasSOS ? 'text-red-600' : 'text-emerald-600')}>
              {hasSOS ? 'SOS ALERT — RESPOND NOW' : 'ON PATROL'}
            </p>
            <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-0.5">
              {vehicle} · {zone} · {shiftPartner ? `W/ ${shiftPartner.toUpperCase()}` : 'SOLO PATROL'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCarScreenOpen(true)}
            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-[7px] font-black uppercase tracking-wider rounded-lg active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Car size={10} /> CAR SCREEN
          </button>
          <button
            onClick={handleToggleDuty}
            className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-[7px] font-black uppercase tracking-wider rounded-lg active:scale-95 cursor-pointer"
          >
            END SHIFT
          </button>
        </div>
      </div>

      {/* SOS Priority Banner */}
      {hasSOS && sosAlert && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 shadow-md text-slate-800">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[7px] font-black text-red-600 uppercase tracking-[2px]">🚨 Active SOS — Priority 1</p>
              <h2 className="text-base font-black text-slate-900 uppercase italic mt-0.5">
                {maskName(sosAlert.victimName || sosAlert.userName || 'Unknown Victim')}
              </h2>
              <p className="text-[8px] text-slate-500 mt-1 flex items-center gap-1">
                <MapPin size={8} className="text-red-500" />
                {sosAlert.locationName || 'Coordinates locked in map below'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-900 font-mono">{distanceToVictim[sosAlert.id] || '—'}</p>
              <p className="text-[6px] text-slate-500 uppercase">Distance</p>
            </div>
          </div>

          {sosAlert.guardianContacts && sosAlert.guardianContacts.length > 0 && (
            <div className="mb-3 bg-red-100 border border-red-200 rounded-xl p-3">
              <span className="text-[7px] font-black text-red-800 uppercase tracking-widest flex items-center gap-1 mb-2"><PhoneCall size={10} /> Emergency Contacts</span>
              {sosAlert.guardianContacts.map((g: any, i: number) => (
                <div key={i} className="flex justify-between items-center mt-1.5 pb-1 border-b border-red-200/50 last:border-0 last:pb-0 text-red-900">
                  <span className="text-[9px] font-bold uppercase">{g.name || 'Guardian'}</span>
                  <a href={`tel:${g.phone}`} className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black tracking-wider active:scale-95 transition-all"><PhoneCall size={8} /> CALL</a>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveInterceptAlert(sosAlert);
                setIsInterceptHUDOpen(true);
                setInterceptActive(true);
                setIsNavigating(true);
              }}
              className="py-3 bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-white cursor-pointer"
            >
              <Navigation size={11} /> Navigate to Scene
            </button>
            {!respondingToId && (
              <button onClick={() => handleStartHelp(sosAlert.id)}
                className="py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl text-[8px] font-black uppercase tracking-wider text-white cursor-pointer">
                Accept &amp; Respond
              </button>
            )}
            {respondingToId === sosAlert.id && (
              <button onClick={() => setResolvingAlert(sosAlert)}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 text-white cursor-pointer">
                <CheckCircle2 size={11} /> Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Telemetry Bar */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-2 animate-none">
        {[
          ['Speed', `${carSpeed} km/h`, hasSOS ? 'text-red-600' : 'text-emerald-600'],
          ['ETA', hasSOS ? etaTimer : '—', 'text-amber-600'],
          ['Shift Elapsed', formatShiftTime(shiftElapsedSeconds), 'text-sky-600'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-[6px] text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={cn('text-sm font-black font-mono mt-0.5', color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Live Map */}
      <div className="mx-4 mt-4 h-[260px] rounded-[32px] overflow-hidden border border-slate-200 relative shadow-sm">
        {!useMapboxFallback ? (
          <MapplsVictimMap
            activeAlerts={sosAlert ? [sosAlert] : activeAlerts}
            mapStyle="streets"
            isCarHUD={true}
            onFallback={() => setUseMapboxFallback(true)}
          />
        ) : (
          <VictimMap
            activeAlerts={sosAlert ? [sosAlert] : activeAlerts}
            mapStyle="streets"
            isCarHUD={true}
          />
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-1.5 z-10 border border-slate-200 shadow-sm">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Live Map — {zone}</span>
        </div>
        <button
          onClick={() => { setIsSirenActive(!isSirenActive); toast.info(isSirenActive ? 'Siren Off' : '🚨 Siren Active'); }}
          className={cn(
            'absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 z-10 cursor-pointer shadow-sm',
            isSirenActive ? 'bg-red-600 border border-red-500' : 'bg-white border border-slate-200 text-slate-500'
          )}
        >
          <Volume2 size={16} className={isSirenActive ? 'text-white' : 'text-slate-500'} />
        </button>
      </div>

      {/* Incoming Incidents Queue */}
      <div className="mx-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] flex items-center gap-1.5">
            <Activity size={12} className="text-blue-600" /> Incoming Incidents
          </h3>
          <span className="text-[7px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase">
            {activeAlerts.length} Active
          </span>
        </div>

        <div className="space-y-3 pb-32">
          {activeAlerts.length > 0 ? activeAlerts.map(alert => {
            const isMe = alert.responderUid === user?.uid;
            return (
              <div key={alert.id} className={cn('rounded-2xl p-4 border transition-all shadow-sm bg-white', isMe ? 'bg-red-50 border-red-200' : 'border-slate-200')}>
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <p className="text-[6px] font-black uppercase tracking-widest text-slate-400">
                      #{alert.id.slice(-5).toUpperCase()} · {alert.status?.toUpperCase()}
                    </p>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic">{maskName(alert.victimName || alert.userName || '—')}</h4>
                    <p className="text-[7px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={7} /> {alert.locationName || 'Unknown location'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-800 font-mono">{distanceToVictim[alert.id] || '—'}</p>
                    <p className="text-[5px] text-slate-500 uppercase">Away</p>
                  </div>
                </div>
                {isMe ? (
                  <div className="flex items-center gap-2 py-2.5 bg-red-100 border border-red-200 rounded-xl justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">You Are Responding</span>
                  </div>
                ) : alert.responderUid && alert.status === 'responding' ? (
                  <div className="flex items-center gap-2 py-2.5 bg-slate-100 border border-slate-200 rounded-xl justify-center opacity-80">
                    <Shield size={10} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Intercepted by {alert.responderName || 'Another PCR'}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartHelp(alert.id)}
                    className="w-full py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-95 rounded-xl text-[8px] font-black uppercase tracking-wider text-blue-600 transition-all cursor-pointer"
                  >
                    Respond to This SOS
                  </button>
                )}
              </div>
            );
          }) : (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
              <Shield size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Active Incidents in Sector</p>
              <p className="text-[7px] text-slate-500 mt-1 uppercase tracking-wider">Patrol zone is clear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
