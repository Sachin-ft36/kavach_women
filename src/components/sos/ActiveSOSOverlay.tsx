import React from 'react';
import { Shield, Eye, MessageSquare, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useKavachStore } from '../../state/useKavachStore';
import { useSosMission } from '../../hooks/useSosMission';
import { useCall } from '../../contexts/CallContext';
import { useSOSScreenActions } from './hooks/useSOSScreenActions';

import StealthDecoy from './StealthDecoy';
import PinVerificationOverlay from './PinVerificationOverlay';
import SafetyHandshakePopup from './SafetyHandshakePopup';
import MissionAbortModal from './MissionAbortModal';
import SosHeader from './SosHeader';
import SosStatusCard from './SosStatusCard';
import ResponderHub from './ResponderHub';
import QuickEscapeNavigator from './QuickEscapeNavigator';
import AcousticPanicController from './AcousticPanicController';
import RescueVerificationCode from './RescueVerificationCode';
import TacticalRadarModal from './TacticalRadarModal';
import KavachAIChat from '../KavachAIChat';
import KavachMap from '../maps/KavachMap';
import { Lock } from 'lucide-react';

export function ActiveSOSOverlay() {
  const { safetyPin, handshakeCode } = useKavachStore();
  const { initiateCall } = useCall();
  const {
    nearbyCount,
    protectors,
    nearestPolice,
    isBeingMonitored,
    showSafetyVerification,
    activeAlertData
  } = useSosMission();

  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = React.useState(false);
  const [isSafeHavenMapOpen, setIsSafeHavenMapOpen] = React.useState(false);
  const [safeHavenTarget, setSafeHavenTarget] = React.useState<any>(null);

  const {
    showPinOverlay, setShowPinOverlay,
    showAbortReason, setAbortReason,
    abortReason,
    enteredPin, setEnteredPin,
    unreadCount,
    isStealthDisguised, setIsStealthDisguised,
    isAborting,
    handleConfirmSafety,
    handleRequestMoreHelp,
    handleAbort,
    handlePinSubmit,
    handleFinalAbort
  } = useSOSScreenActions(isAIChatOpen);

  if (isStealthDisguised) {
    return <StealthDecoy safetyPin={safetyPin} setIsStealthDisguised={setIsStealthDisguised} />;
  }

  return (
    <div
      className="fixed inset-0 z-[5000] overflow-y-auto px-4 pt-6 pb-8"
      style={{
        background: `
          radial-gradient(
            circle at left center,
            rgba(92,140,255,0.55) 0%,
            rgba(92,140,255,0.18) 28%,
            transparent 52%
          ),
          linear-gradient(
            180deg,
            #071433 0%,
            #0B1D4A 15%,
            #173778 35%,
            #3D67AF 58%,
            #8DB5EA 82%,
            #F5F8FD 100%
          )
        `
      }}
    >
      {showPinOverlay && (
        <PinVerificationOverlay
          enteredPin={enteredPin}
          setEnteredPin={setEnteredPin}
          setShowPinOverlay={setShowPinOverlay}
          handlePinSubmit={handlePinSubmit}
        />
      )}

      {showSafetyVerification && (
        <SafetyHandshakePopup
          handleConfirmSafety={handleConfirmSafety}
          handleRequestMoreHelp={handleRequestMoreHelp}
        />
      )}

      <AnimatePresence>
        {showAbortReason && (
          <MissionAbortModal
            abortReason={abortReason}
            setAbortReason={setAbortReason}
            isAborting={isAborting}
            handleFinalAbort={handleFinalAbort}
            activeAlertData={activeAlertData}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-36 right-4 z-50 flex flex-col items-center gap-1">
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white/20 active:scale-95 transition-all"
        >
          <MessageSquare size={20} />
        </button>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center text-[8px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        <span className="text-[8px] font-semibold text-white/50 uppercase tracking-widest">AI Help</span>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-180px] top-[25%] w-[420px] h-[420px] rounded-full blur-[120px]" style={{ background: "rgba(126,167,255,0.35)" }} />
        <div className="absolute left-0 right-0 bottom-[25%] mx-auto w-[500px] h-[220px] rounded-full blur-[140px]" style={{ background: "rgba(255,255,255,0.28)" }} />
      </div>

      {isBeingMonitored && (
        <div className="absolute top-16 left-0 right-0 z-50 flex justify-center">
          <div className="px-6 py-2 bg-blue-700/10 border border-blue-700/30 rounded-full flex items-center gap-3">
            <Eye size={14} className="text-blue-400" />
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-[3px]">WATCHING YOU</span>
          </div>
        </div>
      )}

      <SosHeader
        setIsStealthDisguised={setIsStealthDisguised}
        setIsSafeHavenMapOpen={setIsSafeHavenMapOpen}
        setSafeHavenTarget={setSafeHavenTarget}
        nearbyCount={nearbyCount}
      />

      <div className="flex-1 flex flex-col gap-3 relative z-10">
        <SosStatusCard />

        <a href="tel:112" className="relative z-10 w-full flex items-center justify-between rounded-xl px-3 py-2 overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-500" />
          <div className="relative z-10 flex items-center gap-2">
            <Phone size={14} className="text-white" fill="white" />
            <span className="text-white font-bold text-[11px]">Emergency Call</span>
          </div>
          <span className="relative z-10 text-white font-black text-lg">112</span>
        </a>

        <div className="w-full space-y-3 mt-1 pointer-events-auto">
          <ResponderHub activeAlertData={activeAlertData} initiateCall={initiateCall} />
          <QuickEscapeNavigator
            nearestPolice={nearestPolice}
            setSafeHavenTarget={setSafeHavenTarget}
            setIsSafeHavenMapOpen={setIsSafeHavenMapOpen}
          />
          <RescueVerificationCode handshakeCode={handshakeCode} activeAlertData={activeAlertData} />
        </div>
      </div>

      <div className="relative z-10 mt-3 sm:mt-4 lg:mt-5 pb-safe pb-8 sm:pb-12 space-y-4 px-2">
        <AcousticPanicController />

        <div className="border-t border-white/10 pt-4">
          <button
            onClick={handleAbort}
            className="w-full min-h-[56px] py-4 bg-[#003366] text-white rounded-2xl font-semibold uppercase tracking-[2px] sm:tracking-[3px] text-[10px] sm:text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg"
          >
            <Lock size={18} />
            Close Emergency Request
          </button>
        </div>

        <div className="px-1 mt-2">
          <div className="h-[36px] rounded-full border flex items-center justify-center gap-2 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.18)", borderColor: "rgba(120,140,180,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)" }}>
            <div className="flex items-center justify-center">
              <Shield size={12} className="text-[#6B8FE8]" strokeWidth={2.4} />
            </div>
            <span className="text-[6px] font-medium uppercase tracking-[3px] text-[#8A96AF]">KAVACH NATIONAL SAFETY NETWORK</span>
            <span className="text-[#B4BCCB] text-[6px]">•</span>
            <span className="text-[6px] font-medium uppercase tracking-[3px] text-[#8A96AF]">SECURE</span>
          </div>
        </div>
      </div>

      <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />

      <TacticalRadarModal
        isMapModalOpen={isMapModalOpen}
        setIsMapModalOpen={setIsMapModalOpen}
        protectors={protectors}
        nearbyCount={nearbyCount}
      />

      {isSafeHavenMapOpen && (
        <KavachMap
          mode="safehaven"
          onClose={() => {
            setIsSafeHavenMapOpen(false);
            setSafeHavenTarget(null);
          }}
          initialTarget={safeHavenTarget}
        />
      )}
    </div>
  );
}
