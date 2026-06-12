import React, { useState, useEffect } from 'react';
import { GeoPoint } from '../types';

import PCRShiftSetup from './pcr/PCRShiftSetup';
import PCRCarScreen from './pcr/PCRCarScreen';
import PCRPatrolView from './pcr/PCRPatrolView';

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

  const vehicle = shiftVehicle || profile?.vehicleNo || 'PCR-TBD';
  const zone = shiftZone || profile?.thanaName || 'Unassigned';

  const hasSOS = !!assignedDispatch || !!activeInterceptAlert ||
    activeAlerts.some(a => a.status === 'active' || a.status === 'responding');

  const sosAlert = activeInterceptAlert ||
    activeAlerts.find(a => a.status === 'active' || a.status === 'responding');

  // 🎙️ Tactical voice navigation engine
  useEffect(() => {
    if (!isCarScreenOpen || !isNavigating || !hasSOS || !sosAlert) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const victimNameClean = sosAlert.victimName || sosAlert.userName || 'Citizen';
      const startUtterance = new SpeechSynthesisUtterance(
        `Tactical route locked. Commencing emergency dispatch to locate ${victimNameClean}. Alert zone: ${zone || 'Sector Beat'}. Clear all transit lanes.`
      );
      startUtterance.rate = 1.0;
      startUtterance.pitch = 0.95;
      window.speechSynthesis.speak(startUtterance);
    }

    const advisoryInterval = setInterval(() => {
      if ('speechSynthesis' in window) {
        const directions = [
          'Continue straight for two hundred meters to maintain tactical intercept path.',
          'Warning: High-speed response in progress. Approaching intersection, exercise caution.',
          `Target distance closing. Currently at ${distanceToVictim[sosAlert.id] || 'three hundred meters'}.`,
          'GPS lock stable. Proceed straight toward the distressed node.'
        ];
        const utterance = new SpeechSynthesisUtterance(directions[Math.floor(Math.random() * directions.length)]);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }, 15000);

    return () => {
      clearInterval(advisoryInterval);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isCarScreenOpen, isNavigating, hasSOS, sosAlert?.id, zone]);

  // ── STATE 1: SHIFT SETUP ──
  if (!isOnDuty) {
    return (
      <PCRShiftSetup
        profile={profile}
        shiftVehicle={shiftVehicle}
        setShiftVehicle={setShiftVehicle}
        shiftZone={shiftZone}
        setShiftZone={setShiftZone}
        shiftPartner={shiftPartner}
        setShiftPartner={setShiftPartner}
        handleToggleDuty={handleToggleDuty}
      />
    );
  }

  // ── STATE 2: CAR SCREEN / MDT ──
  if (isCarScreenOpen) {
    return (
      <PCRCarScreen
        vehicle={vehicle}
        zone={zone}
        isSirenActive={isSirenActive}
        setIsSirenActive={setIsSirenActive}
        carSpeed={carSpeed}
        etaTimer={etaTimer}
        shiftElapsedSeconds={shiftElapsedSeconds}
        formatShiftTime={formatShiftTime}
        hasSOS={hasSOS}
        sosAlert={sosAlert}
        isNavigating={isNavigating}
        setIsNavigating={setIsNavigating}
        respondingToId={respondingToId}
        distanceToVictim={distanceToVictim}
        setResolvingAlert={setResolvingAlert}
        handleStartHelp={handleStartHelp}
        maskName={maskName}
        setIsCarScreenOpen={setIsCarScreenOpen}
      />
    );
  }

  // ── STATE 3: ON PATROL / SOS RESPONSE ──
  return (
    <PCRPatrolView
      vehicle={vehicle}
      zone={zone}
      shiftPartner={shiftPartner}
      hasSOS={hasSOS}
      sosAlert={sosAlert}
      carSpeed={carSpeed}
      etaTimer={etaTimer}
      shiftElapsedSeconds={shiftElapsedSeconds}
      formatShiftTime={formatShiftTime}
      isSirenActive={isSirenActive}
      setIsSirenActive={setIsSirenActive}
      isNavigating={isNavigating}
      setIsNavigating={setIsNavigating}
      respondingToId={respondingToId}
      distanceToVictim={distanceToVictim}
      activeAlerts={activeAlerts}
      setActiveInterceptAlert={setActiveInterceptAlert}
      setIsInterceptHUDOpen={setIsInterceptHUDOpen}
      setInterceptActive={setInterceptActive}
      setResolvingAlert={setResolvingAlert}
      handleStartHelp={handleStartHelp}
      maskName={maskName}
      user={user}
      handleToggleDuty={handleToggleDuty}
      setIsCarScreenOpen={setIsCarScreenOpen}
    />
  );
}
