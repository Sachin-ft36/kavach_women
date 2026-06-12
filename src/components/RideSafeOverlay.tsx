import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import MapplsVictimMap from './maps/MapplsVictimMap';
import VictimMap from './maps/VictimMap';
import { useRideSafeLogic } from '../hooks/useRideSafeLogic';
import RideSafeConfig from './ridesafe/RideSafeConfig';
import RideSafeActiveHUD from './ridesafe/RideSafeActiveHUD';

interface RideSafeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isRideActive: boolean;
  setIsRideActive: (active: boolean) => void;
  vehicleNo: string;
  setVehicleNo: (no: string) => void;
}

export default function RideSafeOverlay({
  isOpen, onClose, isRideActive, setIsRideActive, vehicleNo, setVehicleNo
}: RideSafeOverlayProps) {
  
  const {
    destinationQuery, setDestinationQuery,
    selectedDestination, setSelectedDestination,
    useMapboxFallback, setUseMapboxFallback,
    mapStyle, setMapStyle,
    showLayerMenu, setShowLayerMenu,
    showPinModal, setShowPinModal,
    pinInput, setPinInput,
    holdProgress, handleSOSPress, handleSOSRelease,
    displayDistance, displayMinutes,
    verifyPinAndEnd
  } = useRideSafeLogic(isOpen, isRideActive, setIsRideActive, onClose);

  if (!isOpen) return null;

  const overlayContent = (
    <div className="fixed inset-0 z-[2000000] bg-[#0A0A0B] flex flex-col overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_70%)]" />

      <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 pt-6 sm:pt-10">
        
        {isRideActive && (
          <div className="absolute -inset-x-4 -top-6 -bottom-4 sm:-inset-x-6 sm:-top-10 sm:-bottom-6 z-0 pointer-events-auto">
            {!useMapboxFallback ? <MapplsVictimMap onFallback={() => setUseMapboxFallback(true)} /> : <VictimMap />}
          </div>
        )}

        {!isRideActive && (
          <div className="relative z-10 flex items-center justify-between mb-6 sm:mb-10 pointer-events-auto">
            <button onClick={() => { onClose(); setIsRideActive(false); }} className="p-2 sm:p-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white shadow-xl hover:bg-white/10 transition-all flex items-center gap-1.5 sm:gap-2">
              <ChevronRight size={16} className="rotate-180 sm:size-[18px]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Exit</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/10 border border-blue-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-[2px]">Standby Grid</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-8 pb-24 scrollbar-hide pointer-events-none">
          {!isRideActive ? (
            <RideSafeConfig 
              vehicleNo={vehicleNo} setVehicleNo={setVehicleNo}
              destinationQuery={destinationQuery} setDestinationQuery={setDestinationQuery}
              selectedDestination={selectedDestination} setSelectedDestination={setSelectedDestination}
              setIsRideActive={setIsRideActive}
            />
          ) : (
            <RideSafeActiveHUD 
              holdProgress={holdProgress} handleSOSPress={handleSOSPress} handleSOSRelease={handleSOSRelease}
              setShowPinModal={setShowPinModal} showLayerMenu={showLayerMenu} setShowLayerMenu={setShowLayerMenu}
              mapStyle={mapStyle} setMapStyle={setMapStyle} displayMinutes={displayMinutes} displayDistance={displayDistance}
            />
          )}

          {showPinModal && (
            <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 rounded-t-[40px] pointer-events-auto">
              <div className="w-full max-w-sm bg-[#0F172A] border border-emerald-500/30 rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"></div>
                <ShieldCheck className="w-14 h-14 text-emerald-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <h3 className="text-white text-lg font-black tracking-widest uppercase mb-2">Authorize Drop-Off</h3>
                <p className="text-gray-400 text-xs font-medium mb-8">Enter your 4-digit Kavach Security PIN.</p>
                <input
                  type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} autoFocus
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-[16px] text-white focus:outline-none focus:border-emerald-500 mb-8" placeholder="••••"
                />
                <div className="flex gap-4">
                  <button onClick={() => { setShowPinModal(false); setPinInput(""); }} className="flex-1 py-4 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-[2px] active:scale-95">Cancel</button>
                  <button onClick={verifyPinAndEnd} className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95">Verify & End</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
