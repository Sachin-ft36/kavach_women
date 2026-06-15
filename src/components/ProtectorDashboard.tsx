import React, { useState, useEffect } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { supabase } from '../lib/supabase';

import NearbyHubModal from './NearbyHubModal';
import MedicalHubModal from './MedicalHubModal';
import PCROfficerDashboard from './PCROfficerDashboard';
import TacticalModal from './TacticalModal';

// Imported modular components & hooks
import ProtectorHeader from './protector/ProtectorHeader';
import ProtectorTabs from './protector/ProtectorTabs';
import ProtectorAlertList from './protector/ProtectorAlertList';
import ProtectorMapContainer from './protector/ProtectorMapContainer';
import ProtectorHQHub from './protector/panels/ProtectorHQHub';
import { useProtectorShift } from '../hooks/useProtectorShift';
import { useProtectorCarSimulation } from '../hooks/useProtectorCarSimulation';
import { useProtectorAlerts } from '../hooks/useProtectorAlerts';
import { useProtectorHandlers } from '../hooks/useProtectorHandlers';
import { ProtectorClosureModal } from './protector/components/ProtectorClosureModal';
import { ProtectorInterceptHUD } from './protector/components/ProtectorInterceptHUD';
import { ProtectorSuccessModal } from './protector/components/ProtectorSuccessModal';
import { ProtectorShiftCompleteModal } from './protector/components/ProtectorShiftCompleteModal';
import { ProtectorStandDownModal } from './protector/components/ProtectorStandDownModal';

export default function ProtectorDashboard() {
  const { user, profile, userPos, setInterceptActive, setActiveAlertsCount } = useKavachStore();
  const [activeTab, setActiveTab] = useState('map');
  const [isNearbyHubOpen, setIsNearbyHubOpen] = useState(false);
  const [hubViewMode, setHubViewMode] = useState<'all' | 'protectors_only'>('all');
  const [isMedicalHubOpen, setIsMedicalHubOpen] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  
  const isPcrOfficer = profile?.role === 'pcr_officer';
  
  const [isCarScreenOpen, setIsCarScreenOpen] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isMegaphoneActive, setIsMegaphoneActive] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInterceptHUDOpen, setIsInterceptHUDOpen] = useState(false);
  const [isStandDownOpen, setIsStandDownOpen] = useState(false);
  const [isAborting, setIsAborting] = useState(false);

  const [showTacticalPledge, setShowTacticalPledge] = useState<{ isOpen: boolean, alertId: string | null }>({ isOpen: false, alertId: null });
  const [rescuePhoto, setRescuePhoto] = useState<string | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [handshakeInput, setHandshakeInput] = useState('');
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  // Extract hooks
  const { 
    activeAlerts, setActiveAlerts, respondingToId, setRespondingToId, 
    activeInterceptAlert, setActiveInterceptAlert, assignedDispatch, setAssignedDispatch, 
    distanceToVictim, lastResolvedVictim, showSuccessMotivation, setShowSuccessMotivation, 
    resolvingAlert, setResolvingAlert, isCancelledByVictim, setIsCancelledByVictim,
    deEscalationReason, setDeEscalationReason, addToAbortedBlacklist, setAbortedVictims
  } = useProtectorAlerts(user, profile, userPos, activeTab || 'map', isPcrOfficer, setInterceptActive, setIsInterceptHUDOpen, setIsNavigating);

  // Sync alert count to global store for Header badge
  useEffect(() => {
    setActiveAlertsCount(activeAlerts.length);
    // Return cleanup to clear count if unmounted
    return () => setActiveAlertsCount(0);
  }, [activeAlerts.length, setActiveAlertsCount]);

  // Auto-switch to ALERTS tab when a new alert comes in
  const prevAlertCount = React.useRef(0);
  useEffect(() => {
    if (activeAlerts.length > prevAlertCount.current) {
      setActiveTab('list');
    }
    prevAlertCount.current = activeAlerts.length;
  }, [activeAlerts.length]);

  useEffect(() => {
    const handleOpenAlerts = () => setActiveTab('list');
    document.addEventListener('OPEN_ALERTS_TAB', handleOpenAlerts);
    return () => document.removeEventListener('OPEN_ALERTS_TAB', handleOpenAlerts);
  }, []);
  
  const { isOnDuty, shiftVehicle, setShiftVehicle, shiftZone, setShiftZone, shiftPartner, setShiftPartner, shiftStartTime, shiftElapsedSeconds, showShiftCompleteModal, setShowShiftCompleteModal, shiftStats, dynamicVehicleNo, customJurisdiction, handleToggleDuty, formatShiftTime } = useProtectorShift(user, profile, activeAlerts, assignedDispatch, setAssignedDispatch, setIsCarScreenOpen, setIsSirenActive, setIsMegaphoneActive);
  
  const { carSpeed, etaTimer } = useProtectorCarSimulation(isCarScreenOpen, respondingToId, isNavigating, isOnDuty, profile);

  const { handleStartHelp, confirmTacticalResponse, handleResolveAlert, handleAbortResponse, maskName } = useProtectorHandlers(
    user, isProcessingResponse, setIsProcessingResponse, showTacticalPledge, setShowTacticalPledge,
    setRespondingToId, activeAlerts, setActiveInterceptAlert, isCarScreenOpen, setIsInterceptHUDOpen,
    setInterceptActive, setIsNavigating, resolvingAlert, setResolvingAlert, handshakeInput, setHandshakeInput,
    resolutionSummary, setResolutionSummary, rescuePhoto, setRescuePhoto
  );

  const protectorStats = {
    rating: (profile as any)?.stats?.rating || (profile as any)?.rating || 0.0,
    ratingCount: (profile as any)?.stats?.ratingCount || (profile as any)?.ratingCount || 0,
    level: (profile as any)?.stats?.level || (profile as any)?.level || 1,
    xp: (profile as any)?.stats?.xp || (profile as any)?.xp || 0,
    livesHelped: (profile as any)?.stats?.livesHelped || (profile as any)?.livesHelped || 0,
    successRate: (profile as any)?.stats?.successRate || (profile as any)?.successRate || 0,
    avgResponse: (profile as any)?.stats?.avgResponse || (profile as any)?.avgResponse || '--'
  };

  if (isPcrOfficer) {
    return (
      <>
        <PCROfficerDashboard
          user={user}
          profile={profile}
          userPos={userPos}
          activeAlerts={activeAlerts}
          assignedDispatch={assignedDispatch}
          activeInterceptAlert={activeInterceptAlert}
          respondingToId={respondingToId}
          isNavigating={isNavigating}
          distanceToVictim={distanceToVictim}
          isSirenActive={isSirenActive}
          carSpeed={carSpeed}
          etaTimer={etaTimer}
          shiftElapsedSeconds={shiftElapsedSeconds}
          formatShiftTime={formatShiftTime}
          shiftVehicle={shiftVehicle}
          setShiftVehicle={setShiftVehicle}
          shiftZone={shiftZone}
          setShiftZone={setShiftZone}
          shiftPartner={shiftPartner}
          setShiftPartner={setShiftPartner}
          isOnDuty={isOnDuty}
          handleToggleDuty={handleToggleDuty}
          setIsSirenActive={setIsSirenActive}
          setActiveInterceptAlert={setActiveInterceptAlert}
          setIsInterceptHUDOpen={setIsInterceptHUDOpen}
          setInterceptActive={setInterceptActive}
          setIsNavigating={setIsNavigating}
          handleStartHelp={handleStartHelp}
          setResolvingAlert={setResolvingAlert}
          maskName={maskName}
          fileInputRef={fileInputRef}
          isCarScreenOpen={isCarScreenOpen}
          setIsCarScreenOpen={setIsCarScreenOpen}
        />

        <ProtectorShiftCompleteModal
          showShiftCompleteModal={showShiftCompleteModal}
          setShowShiftCompleteModal={setShowShiftCompleteModal}
          shiftStats={shiftStats}
          dynamicVehicleNo={dynamicVehicleNo}
          customJurisdiction={customJurisdiction}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] pb-6 font-sans overflow-x-hidden relative">
      <ProtectorHeader profile={profile} user={user} isOnDuty={isOnDuty} protectorStats={protectorStats} setActiveTab={setActiveTab} handleToggleDuty={handleToggleDuty} />
      


      <div className="mt-4">
        <ProtectorTabs 
          activeTab={activeTab || 'map'} 
          setActiveTab={setActiveTab} 
          activeAlertsLength={activeAlerts.length} 
          isPcrOfficer={isPcrOfficer} 
        />
      </div>

      {activeTab === 'list' && (
        <ProtectorAlertList 
          activeAlerts={activeAlerts} 
          profile={profile} 
          setActiveInterceptAlert={(alert) => {
            if (profile?.respondingToAlertId === alert.id) {
              setIsInterceptHUDOpen(true);
              setInterceptActive(true);
            } else {
              handleStartHelp(alert.id);
            }
          }} 
          setActiveTab={setActiveTab} 
          setIsNearbyHubOpen={setIsNearbyHubOpen} 
          setIsMedicalHubOpen={setIsMedicalHubOpen} 
        />
      )}

      {activeTab === 'hq' && (
        <ProtectorHQHub profile={profile} userPos={userPos} activeInterceptAlert={activeInterceptAlert} />
      )}

      {(!activeTab || activeTab === 'map') && (
        <ProtectorMapContainer 
          activeAlerts={activeAlerts}
          setIsNearbyHubOpen={setIsNearbyHubOpen} 
          setIsMedicalHubOpen={setIsMedicalHubOpen} 
          setActiveTab={setActiveTab} 
          setHubViewMode={setHubViewMode} 
          setActiveInterceptAlert={(alert) => {
            if (profile?.respondingToAlertId === alert.id) {
              setIsInterceptHUDOpen(true);
              setInterceptActive(true);
            } else {
              handleStartHelp(alert.id);
            }
          }}
        />
      )}

      <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => setIsNearbyHubOpen(false)} viewMode={hubViewMode} />
      <MedicalHubModal isOpen={isMedicalHubOpen} onClose={() => setIsMedicalHubOpen(false)} />

      <TacticalModal isOpen={showTacticalPledge.isOpen} onClose={() => setShowTacticalPledge({ isOpen: false, alertId: null })} onConfirm={confirmTacticalResponse} type="info" title="Emergency Response Activated" description="Your live activity and route will now be monitored securely while you assist the victim." confirmText="START RESPONSE" />

      {/* Handshake Closure modal */}
      <ProtectorClosureModal
        resolvingAlert={resolvingAlert}
        setResolvingAlert={setResolvingAlert}
        resolutionSummary={resolutionSummary}
        setResolutionSummary={setResolutionSummary}
        handshakeInput={handshakeInput}
        setHandshakeInput={setHandshakeInput}
        rescuePhoto={rescuePhoto}
        setRescuePhoto={setRescuePhoto}
        handleResolveAlert={handleResolveAlert}
        fileInputRef={fileInputRef}
      />

      {/* Dynamic Intercept HUD */}
      <ProtectorInterceptHUD
        isInterceptHUDOpen={isInterceptHUDOpen}
        activeInterceptAlert={activeInterceptAlert}
        useMapboxFallback={useMapboxFallback}
        isNavigating={isNavigating}
        distanceToVictim={distanceToVictim}
        setIsNavigating={setIsNavigating}
        setResolvingAlert={setResolvingAlert}
        setIsInterceptHUDOpen={setIsInterceptHUDOpen}
        setInterceptActive={setInterceptActive}
        setUseMapboxFallback={setUseMapboxFallback}
        onAbort={() => setIsStandDownOpen(true)}
      />

       {/* Stand Down Reason Modal */}
      <ProtectorStandDownModal
        isOpen={isStandDownOpen}
        isAborting={isAborting}
        onCancel={() => setIsStandDownOpen(false)}
        onConfirm={async (reason) => {
          const abortingAlertId = activeInterceptAlert?.id;
          const victimUid = activeInterceptAlert?.victimUid || activeInterceptAlert?.uid;
          setIsAborting(true);
          await handleAbortResponse(abortingAlertId, reason);
          // Blacklist this victim so their alerts do not appear for 3 hours for this protector
          if (victimUid) {
            addToAbortedBlacklist(victimUid);
          }
          setIsAborting(false);
          setIsStandDownOpen(false);
        }}
      />

      {/* Success / Mission Complete celebration */}
      <ProtectorSuccessModal
        showSuccessMotivation={showSuccessMotivation}
        setShowSuccessMotivation={setShowSuccessMotivation}
        lastResolvedVictim={lastResolvedVictim}
        isCancelledByVictim={isCancelledByVictim}
        deEscalationReason={deEscalationReason}
        onCloseModal={() => {
          setShowSuccessMotivation(false);
          setIsCancelledByVictim(false);
          setDeEscalationReason('');
        }}
      />
    </div>
  );
}
