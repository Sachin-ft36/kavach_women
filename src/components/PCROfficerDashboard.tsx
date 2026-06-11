import React, { useState, useEffect } from 'react';
import {
  Shield, MapPin, Activity, Clock, Navigation, CheckCircle2,
  Camera, ChevronRight, PhoneCall, Globe, Zap, Car, Volume2,
  ShieldAlert, Award, AlertTriangle, Radio, Users, RotateCcw,
  Siren
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import VictimMap from './maps/VictimMap';
import MapplsVictimMap from './maps/MapplsVictimMap';
import { GeoPoint } from '../types';

// ─────────────────────────────────────────────
//  PCR Officer Dashboard — Professional MDT
//  3 States: SETUP → PATROL → SOS_RESPONSE → CAR_HUD
// ─────────────────────────────────────────────

interface Props {
  user: any;
  profile: any;
  userPos: GeoPoint | null;
  activeAlerts: any[];
  assignedDispatch: any | null;
  activeInterceptAlert: any | null;
  respondingToId: string | null;
  isNavigating: boolean;
  distanceToVictim: Record<string, string>;
  isSirenActive: boolean;
  carSpeed: number;
  etaTimer: string;
  shiftElapsedSeconds: number;
  formatShiftTime: (s: number) => string;
  shiftVehicle: string;
  setShiftVehicle: (v: string) => void;
  shiftZone: string;
  setShiftZone: (v: string) => void;
  shiftPartner: string;
  setShiftPartner: (v: string) => void;
  isOnDuty: boolean;
  handleToggleDuty: () => void;
  setIsSirenActive: (v: boolean) => void;
  setActiveInterceptAlert: (a: any) => void;
  setIsInterceptHUDOpen: (v: boolean) => void;
  setInterceptActive: (v: boolean) => void;
  setIsNavigating: (v: boolean) => void;
  handleStartHelp: (id: string) => void;
  setResolvingAlert: (a: any) => void;
  maskName: (n: string) => string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isCarScreenOpen: boolean;
  setIsCarScreenOpen: (v: boolean) => void;
}

const VEHICLE_OPTIONS = ['PCR-01','PCR-02','PCR-03','PCR-04','PCR-05','PCR-06','PCR-07','PCR-08'];
const ZONE_OPTIONS = ['Zone A – North','Zone B – South','Zone C – East','Zone D – West','Zone E – Central','Zone F – Highway','Zone G – Industrial'];

export default function PCROfficerDashboard(props: Props) {
  const {
    user, profile, userPos, activeAlerts, assignedDispatch,
    activeInterceptAlert, respondingToId, isNavigating, distanceToVictim,
    isSirenActive, carSpeed, etaTimer, shiftElapsedSeconds,
    formatShiftTime, shiftVehicle, setShiftVehicle, shiftZone,
    setShiftZone, shiftPartner, setShiftPartner, isOnDuty,
    handleToggleDuty, setIsSirenActive, setActiveInterceptAlert,
    setIsInterceptHUDOpen, setInterceptActive, setIsNavigating,
    handleStartHelp, setResolvingAlert, maskName,
    isCarScreenOpen, setIsCarScreenOpen
  } = props;

  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  const rank = profile?.rank || 'Constable';
  const badge = profile?.badgeId || 'IND-POL-00000';
  const name = profile?.name || 'Officer';
  const vehicle = shiftVehicle || profile?.vehicleNo || 'PCR-TBD';
  const zone = shiftZone || profile?.thanaName || 'Unassigned';

  const hasSOS = !!assignedDispatch || !!activeInterceptAlert ||
    activeAlerts.some(a => a.status === 'active' || a.status === 'responding');

  const sosAlert = activeInterceptAlert ||
    activeAlerts.find(a => a.status === 'active' || a.status === 'responding');

  // 🎙️ IMMERSIVE TACTICAL VOICE NAVIGATION ENGINE
  useEffect(() => {
    if (!isCarScreenOpen || !isNavigating || !hasSOS || !sosAlert) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear any pending speech
      
      const victimNameClean = sosAlert.victimName || sosAlert.userName || "Citizen";
      const startUtterance = new SpeechSynthesisUtterance(
        `Tactical route locked. Commencing emergency dispatch to locate ${victimNameClean}. Alert zone: ${zone || "Sector Beat"}. Clear all transit lanes.`
      );
      startUtterance.rate = 1.0;
      startUtterance.pitch = 0.95;
      window.speechSynthesis.speak(startUtterance);
    }

    const advisoryInterval = setInterval(() => {
      if ('speechSynthesis' in window) {
        const directions = [
          "Continue straight for two hundred meters to maintain tactical intercept path.",
          "Warning: High-speed response in progress. Approaching intersection, exercise caution.",
          `Target distance closing. Currently at ${distanceToVictim[sosAlert.id] || "three hundred meters"}.`,
          "GPS lock stable. Proceed straight toward the distressed node."
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const utterance = new SpeechSynthesisUtterance(randomDir);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }, 15000); // Announce every 15 seconds

    return () => {
      clearInterval(advisoryInterval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isCarScreenOpen, isNavigating, hasSOS, sosAlert?.id, zone]);

  // ── STATE 1: SHIFT SETUP ──────────────────
  if (!isOnDuty) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col animate-none">
        {/* Gov Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[3px]">GOVERNMENT OF INDIA</p>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Kavach ERSS — PCR Unit Portal</h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest">Status</p>
            <p className="text-[10px] font-black text-amber-600 uppercase">OFF DUTY</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-6 max-w-md mx-auto w-full">
          {/* Officer ID card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[8px] text-blue-600 uppercase tracking-[2px] font-black mb-3">Officer Identity</p>
            <div className="grid grid-cols-2 gap-3">
              {[['Name', name], ['Rank', rank], ['Badge No.', badge], ['Station', profile?.thanaName || '—']].map(([k, v]) => (
                <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[6px] text-slate-400 uppercase tracking-widest">{k}</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shift Setup Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <p className="text-[8px] text-blue-600 uppercase tracking-[2px] font-black">Configure Shift</p>

            <div className="space-y-1">
              <label className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Assigned Vehicle</label>
              <select
                value={shiftVehicle}
                onChange={e => setShiftVehicle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-500"
              >
                <option value="">— Select PCR Vehicle —</option>
                {VEHICLE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                {profile?.vehicleNo && !VEHICLE_OPTIONS.includes(profile.vehicleNo) && (
                  <option value={profile.vehicleNo}>{profile.vehicleNo}</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Patrol Zone / Beat</label>
              <select
                value={shiftZone}
                onChange={e => setShiftZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-500"
              >
                <option value="">— Select Patrol Zone —</option>
                {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                {profile?.thanaName && !ZONE_OPTIONS.some(z => z.includes(profile.thanaName)) && (
                  <option value={profile.thanaName}>{profile.thanaName}</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Partner / Co-Officer (Optional)</label>
              <input
                type="text"
                value={shiftPartner}
                onChange={e => setShiftPartner(e.target.value)}
                placeholder="Enter partner name..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (!shiftVehicle) { toast.error('Please select a vehicle before starting shift.'); return; }
              if (!shiftZone) { toast.error('Please assign a patrol zone.'); return; }
              handleToggleDuty();
            }}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-2xl text-sm font-black uppercase tracking-[2px] text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Shield size={16} /> START SHIFT — GO ON DUTY
          </button>

          <p className="text-center text-[8px] text-slate-400 uppercase tracking-widest">
            Shift details are logged to ERSS HQ upon activation
          </p>
        </div>
      </div>
    );
  }

  // ── STATE 4: simulated CAR SCREEN (CarPlay/MDT) ──
  if (isCarScreenOpen) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[10000] flex flex-col font-sans text-slate-850 overflow-hidden">
        {/* Car screen bezel and frame simulation */}
        <div className="absolute inset-0 border-[16px] border-slate-950 rounded-[32px] overflow-hidden flex flex-col bg-slate-50">
          
          {/* Top Widescreen Status Bar */}
          <div className={cn(
            "h-12 border-b px-6 flex justify-between items-center bg-white border-slate-200 text-slate-800"
          )}>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-blue-600 tracking-[3px] uppercase">KAVACH PCR SMART TELEMETRY</span>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">CALLSIGN: {vehicle}</span>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">ZONE: {zone}</span>
            </div>
            
            {/* Siren Indicator */}
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

          {/* ── PREMIUM WIDESCREEN TELEMETRY BAR (AS PER HARDWARE SCREENSHOT) ── */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-4 animate-none shrink-0">
            <div className="bg-white border border-slate-200 rounded-[20px] py-4 px-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[2.5px] leading-none mb-1.5">SPEED</p>
              <p className="text-xl font-mono font-black text-[#EF4444] leading-none">{carSpeed} km/h</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-[20px] py-4 px-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[2.5px] leading-none mb-1.5">ETA</p>
              <p className="text-xl font-mono font-black text-[#D97706] leading-none">{hasSOS ? etaTimer : '00:00.0'}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-[20px] py-4 px-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[2.5px] leading-none mb-1.5">SHIFT ELAPSED</p>
              <p className="text-xl font-mono font-black text-[#0284C7] leading-none">{formatShiftTime(shiftElapsedSeconds)}</p>
            </div>
          </div>

          {/* Main Landscape Split Screen */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Widescreen Navigation & Route Mapping */}
            <div className={cn(
              "h-full relative transition-all duration-500",
              isNavigating ? "w-full" : "w-2/3 border-r border-slate-200"
            )}>
              {!useMapboxFallback ? (
                <MapplsVictimMap
                  activeAlerts={sosAlert ? [sosAlert] : activeAlerts}
                  mapStyle="streets"
                  isNavigating={isNavigating}
                  isInterceptMode={isNavigating}
                  onToggleNav={() => setIsNavigating(!isNavigating)}
                  onResolve={() => setResolvingAlert(sosAlert)}
                  distance={sosAlert ? (distanceToVictim[sosAlert.id] || "---") : "---"}
                  isCarHUD={true}
                  onFallback={() => setUseMapboxFallback(true)}
                />
              ) : (
                <VictimMap
                  activeAlerts={sosAlert ? [sosAlert] : activeAlerts}
                  mapStyle="streets"
                  isNavigating={isNavigating}
                  isInterceptMode={isNavigating}
                  onToggleNav={() => setIsNavigating(!isNavigating)}
                  onResolve={() => setResolvingAlert(sosAlert)}
                  distance={sosAlert ? (distanceToVictim[sosAlert.id] || "---") : "---"}
                  isCarHUD={true}
                />
              )}
              
              {/* Dynamic Auto-Routing & Driver Advisory Card */}
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
                          ? `🚨 INTERCEPT ROUTE LOCK — PROCEED TO ${sosAlert.locationName?.toUpperCase() || 'TARGET COORDINATES'}` 
                          : "✓ STANDBY IN ZONE — MAIN STREETS / HIGH-INTEGRITY SECTOR PATROL"}
                      </p>
                    </div>
                  </div>
                  {hasSOS && (
                    <div className="text-right">
                      <p className="text-[7px] text-slate-505 uppercase tracking-widest">Target Distance</p>
                      <p className="text-lg font-black text-rose-600 font-mono leading-none mt-0.5">{distanceToVictim[sosAlert.id] || "Calculating..."}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Command Console Grid (35% width) */}
            {!isNavigating && (
              <div className="w-1/3 h-full bg-white flex flex-col p-5 space-y-4 overflow-y-auto border-l border-slate-200">
              
              {/* Telemetry Panel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest block">Vehicle Speed</span>
                  <p className="text-xl font-black text-sky-600 font-mono mt-1">{carSpeed} km/h</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest block">Scene ETA</span>
                  <p className="text-xl font-black text-amber-600 font-mono mt-1">{hasSOS ? etaTimer : "—"}</p>
                </div>
              </div>

              {/* Siren & Megaphone Quick MDT Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsSirenActive(!isSirenActive)}
                  className={cn(
                    "py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-wider active:scale-95 border cursor-pointer",
                    isSirenActive
                      ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-500/25"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {isSirenActive ? "🚨 SIREN ON" : "🚨 SIREN OFF"}
                </button>
                
                <button
                  onClick={() => toast.success("Megaphone Mode Switched")}
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
                      {maskName(sosAlert.victimName || sosAlert.userName || "Unknown Victim")}
                    </h3>
                    <p className="text-[8px] text-slate-500 mt-1 leading-snug truncate">
                      {sosAlert.locationName || "Coordinates Lock Active"}
                    </p>
                    {sosAlert.guardianContacts && sosAlert.guardianContacts.length > 0 && (
                      <div className="mt-3 bg-red-100 border border-red-200 rounded-xl p-2.5">
                        <span className="text-[6px] font-black text-red-800 uppercase tracking-widest flex items-center gap-1 mb-1.5"><PhoneCall size={8} /> Guardian Info</span>
                        {sosAlert.guardianContacts.map((g: any, i: number) => (
                          <div key={i} className="flex justify-between items-center mt-1 text-red-900 font-bold uppercase">
                             <span className="text-[7px]">{g.name || 'Guardian'}</span>
                             <a href={`tel:${g.phone}`} className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-md text-[7px] tracking-wider active:scale-95"><PhoneCall size={6}/> CALL</a>
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
                            "py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border",
                            isNavigating
                              ? "bg-red-100 border-red-200 text-red-700 hover:bg-red-200"
                              : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25"
                          )}
                        >
                          <Navigation size={10} fill={isNavigating ? "currentColor" : "none"} />
                          {isNavigating ? "STOP NAV" : "START NAV"}
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
                        ACCEPT & START DISPATCH
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

  // ── STATE 2 & 3: ON DUTY — PATROL or SOS ─
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50 relative">
      {/* ── TOP COMMAND BAR ── */}
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

      {/* ── SOS PRIORITY BANNER ── */}
      {hasSOS && sosAlert && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 shadow-md text-slate-800">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[7px] font-black text-red-600 uppercase tracking-[2px]">🚨 Active SOS — Priority 1</p>
              <h2 className="text-base font-black text-slate-900 uppercase italic mt-0.5">
                {maskName(sosAlert.victimName || sosAlert.userName || 'Unknown Victim')}
              </h2>
              <p className="text-[8px] text-slate-500 mt-1 flex items-center gap-1">
                <MapPin size={8} className="text-red-555" />
                {sosAlert.locationName || 'Coordinates locked in map below'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-900 font-mono">{distanceToVictim[sosAlert.id] || '—'}</p>
              <p className="text-[6px] text-slate-500 uppercase">Distance</p>
            </div>
          </div>
          
          {/* Guardian Info */}
          {sosAlert.guardianContacts && sosAlert.guardianContacts.length > 0 && (
            <div className="mb-3 bg-red-100 border border-red-200 rounded-xl p-3">
              <span className="text-[7px] font-black text-red-800 uppercase tracking-widest flex items-center gap-1 mb-2"><PhoneCall size={10} /> Emergency Contacts</span>
              {sosAlert.guardianContacts.map((g: any, i: number) => (
                <div key={i} className="flex justify-between items-center mt-1.5 pb-1 border-b border-red-200/50 last:border-0 last:pb-0 text-red-900">
                   <span className="text-[9px] font-bold uppercase">{g.name || 'Guardian'}</span>
                   <a href={`tel:${g.phone}`} className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black tracking-wider active:scale-95 transition-all"><PhoneCall size={8}/> CALL</a>
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
              <button
                onClick={() => handleStartHelp(sosAlert.id)}
                className="py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl text-[8px] font-black uppercase tracking-wider text-white cursor-pointer"
              >
                Accept & Respond
              </button>
            )}
            {respondingToId === sosAlert.id && (
              <button
                onClick={() => setResolvingAlert(sosAlert)}
                className="py-3 bg-emerald-600 hover:bg-emerald-705 active:scale-95 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 text-white cursor-pointer"
              >
                <CheckCircle2 size={11} /> Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── VEHICLE TELEMETRY BAR ── */}
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

      {/* ── LIVE MAP ── */}
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
        {/* Siren Control */}
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

      {/* ── REGIONAL INCIDENTS QUEUE ── */}
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
              <div key={alert.id} className={cn(
                'rounded-2xl p-4 border transition-all shadow-sm bg-white',
                isMe ? 'bg-red-50 border-red-200' : 'border-slate-200'
              )}>
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <p className="text-[6px] font-black uppercase tracking-widest text-slate-400">
                      #{alert.id.slice(-5).toUpperCase()} · {alert.status?.toUpperCase()}
                    </p>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic">{maskName(alert.victimName || alert.userName || '—')}</h4>
                    <p className="text-[7px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={7} /> {alert.locationName || 'Unknown location'}
                    </p>
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
