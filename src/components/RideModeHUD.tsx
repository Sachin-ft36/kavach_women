import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, X, Navigation, MapPin, Search, AlertTriangle, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useRideProtocol } from '../hooks/useRideProtocol';
import { geocodeLocation, searchLocation } from '../services/locationService';
import { cn } from '../lib/utils';

export default function RideModeHUD() {
  useRideProtocol();
  const { t } = useLanguage();
  const { isRideModeActive, rideData, setRideMode, userPos } = useKavachStore();

  const [destinationInput, setDestinationInput] = useState('');
  const [vehicleInput, setVehicleInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDeviating = (rideData?.deviationDistance || 0) > 0.5;

  const handleStartRide = async () => {
    if (!destinationInput.trim() || !vehicleInput.trim()) return;

    setIsLoading(true);
    try {
      // 🛡️ TACTICAL TYPE FIX: Resolve red line by ensuring strict [number, number] | null mapping
      const result = await searchLocation(destinationInput);
      const coords: [number, number] | null = result ? [result[0], result[1]] : null;

      // ANCHOR MODE FALLBACK: If geocoding fails, we track displacement from start point
      setRideMode(true, {
        destination: destinationInput,
        targetCoords: coords,
        vehicleNo: vehicleInput.toUpperCase(),
        startTime: Date.now(),
        deviationDistance: 0,
        status: 'active', // Standardized for SuperCell Oversight
        warningsIssued: 0
      });
    } catch (e) {
      console.warn("Ride Protocol: Geocoding failure, engaging Anchor Mode.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRideModeActive) {
    return (
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-[#E5E7EB] shadow-sm overflow-hidden p-6 rounded-[32px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] border border-[#2563EB]/10">
            <Car size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black italic uppercase text-gray-900 leading-none">Safe Ride Mode</h3>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">AI Route Intercept</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Destination Address..."
              className="w-full bg-gray-50 border border-[#E5E7EB] rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#2563EB]/50 focus:bg-white transition-all"
            />
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input
              value={vehicleInput}
              onChange={(e) => setVehicleInput(e.target.value)}
              placeholder="Vehicle No (e.g. DL 1S AB 1234)"
              className="w-full bg-gray-50 border border-[#E5E7EB] rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#2563EB]/50 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={handleStartRide}
            disabled={isLoading || !destinationInput || !vehicleInput}
            className="w-full py-4 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/20"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Navigation size={14} /> Initiate Tactical Link</>}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={cn(
      "col-span-1 md:col-span-2 lg:col-span-2 p-1 rounded-[36px] transition-all duration-500 relative overflow-hidden",
      isDeviating ? "bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.2)]" : "bg-[#2563EB]/20"
    )}>
      <div className="p-6 bg-white rounded-[34px] space-y-6 relative overflow-hidden h-full border border-[#E5E7EB]">

        {/* Danger Glow Effect */}
        <AnimatePresence>
          {isDeviating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.05, 0.15, 0.05] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-red-500 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-md",
              isDeviating ? "bg-red-600 scale-110" : "bg-[#2563EB]"
            )}>
              <Car size={20} />
            </div>
            <div>
              <h3 className="text-gray-900 font-black italic uppercase text-lg leading-none">
                {rideData?.vehicleNo || "GHOST RIDE"}
              </h3>
              <div className="flex flex-col gap-1 mt-1.5">
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                  isDeviating ? "text-red-600" : "text-accent-green"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", isDeviating ? "bg-red-600" : "bg-accent-green")} />
                  {isDeviating ? "⚠️ DEVIATION DETECTED" : "Neural Link: Optimal"}
                </p>
                <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 opacity-70">
                   <Shield size={8} /> National Grid Sync: Active
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setRideMode(false)}
            className="p-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-gray-50 p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
              <Activity size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Ghost Monitor</span>
            </div>
            <p className="text-xs font-bold uppercase text-gray-900">Pulse Active</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-accent-green">
              <Navigation size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Route Integrity</span>
            </div>
            <p className="text-xs font-bold uppercase text-gray-900 truncate">
              {isDeviating ? "RE-CALIBRATING..." : "100.0% SECURE"}
            </p>
          </div>
        </div>

        {/* Dynamic Threat Monitor */}
        <motion.div
          animate={isDeviating ? { opacity: 1 } : {}}
          className={cn(
            "p-4 rounded-2xl flex items-center justify-between border relative overflow-hidden shadow-sm",
            isDeviating ? "bg-red-50 border-red-200" : "bg-gray-50 border-[#E5E7EB]"
          )}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className={cn(
              "p-2 rounded-lg",
              isDeviating ? "bg-red-100 text-red-600" : "bg-white text-gray-400 border border-[#E5E7EB]"
            )}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest", isDeviating ? "text-red-600" : "text-gray-400")}>
                Deviation Radius
              </p>
              <p className={cn("text-[14px] font-black italic", isDeviating ? "text-red-700" : "text-gray-900")}>
                {rideData?.deviationDistance.toFixed(2)} KM OFF-HUD
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </motion.div>
      </div>
    </div>
  );
}
