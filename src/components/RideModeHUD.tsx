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
        status: coords ? 'linked' : 'displacement_only',
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
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 bg-[#020512] border-accent-blue/20 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
            <Car size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black italic uppercase text-white leading-none">Safe Ride Mode</h3>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">AI Route Intercept</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent-blue transition-colors" size={16} />
            <input
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Destination Address..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent-blue transition-colors" size={16} />
            <input
              value={vehicleInput}
              onChange={(e) => setVehicleInput(e.target.value)}
              placeholder="Vehicle No (e.g. DL 1S AB 1234)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <button
            onClick={handleStartRide}
            disabled={isLoading || !destinationInput || !vehicleInput}
            className="w-full py-4 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <span className="animate-spin text-white">⏳</span> : <><Navigation size={14} /> Initiate Tactical Link</>}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={cn(
      "col-span-1 md:col-span-2 lg:col-span-2 p-1 rounded-[36px] transition-all duration-500 relative overflow-hidden",
      isDeviating ? "bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)]" : "bg-accent-blue/40"
    )}>
      <div className="p-6 bg-[#0a0a0c] rounded-[34px] space-y-6 relative overflow-hidden h-full">

        {/* Danger Glow Effect */}
        <AnimatePresence>
          {isDeviating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-red-600 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-black transition-all",
              isDeviating ? "bg-red-600 shadow-lg scale-110" : "bg-accent-blue"
            )}>
              <Car size={20} className={isDeviating ? "animate-bounce" : ""} />
            </div>
            <div>
              <h3 className="text-white font-black italic uppercase text-lg leading-none">
                {rideData?.vehicleNo || "GHOST RIDE"}
              </h3>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2",
                isDeviating ? "text-red-500 font-black" : "text-green-500"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", isDeviating ? "bg-red-500 animate-ping" : "bg-green-500 animate-pulse")} />
                {isDeviating ? "⚠️ DEVIATION DETECTED" : "Neural Link: Optimal"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setRideMode(false)}
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-accent-blue">
              <Activity size={12} className="animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest">Ghost Monitor</span>
            </div>
            <p className="text-xs font-black uppercase text-white/90">Pulse Active</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-green-500">
              <Navigation size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Route Integrity</span>
            </div>
            <p className="text-xs font-black uppercase text-white/90 truncate">
              {isDeviating ? "RE-CALIBRATING..." : "100.0% SECURE"}
            </p>
          </div>
        </div>

        {/* Dynamic Threat Monitor */}
        <motion.div
          animate={isDeviating ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className={cn(
            "p-4 rounded-2xl flex items-center justify-between border relative overflow-hidden",
            isDeviating ? "bg-red-600/20 border-red-600/50" : "bg-white/5 border-white/5"
          )}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className={cn(
              "p-2 rounded-lg",
              isDeviating ? "bg-red-500/20 text-red-500" : "bg-white/5 text-gray-500"
            )}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest", isDeviating ? "text-red-500" : "text-gray-400")}>
                Deviation Radius
              </p>
              <p className="text-white text-[14px] font-black italic">
                {rideData?.deviationDistance.toFixed(2)} KM OFF-HUD
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-600" />
        </motion.div>
      </div>
    </div>
  );
}
