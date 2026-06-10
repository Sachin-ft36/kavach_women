import React, { useState, useEffect } from 'react';
import { Shield, MapPin, PhoneCall, ArrowLeft, Zap, Navigation, CheckCircle2, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { useCall } from '../contexts/CallContext';
import { cn } from '../lib/utils';
import SecurityRadarMap from '../components/maps/SecurityRadarMap';
import MapplsSecurityRadarMap from '../components/maps/MapplsSecurityRadarMap';

export default function ProtectorsRadarScreen() {
  const { userPos, setActiveTab, activeAlertId } = useKavachStore();
  const { initiateCall } = useCall();
  const [nearbyProtectors, setNearbyProtectors] = useState<any[]>([]);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const [allProtectors, setAllProtectors] = useState<any[]>([]);

  // 📡 PRIMARY SUBSCRIPTION: Listen to both global protectors and on-duty PCR units
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['protector', 'pcr_officer'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => {
          if (p.role === 'protector') {
            return p.isVerified === true;
          }
          if (p.role === 'pcr_officer') {
            return p.isOnDuty === true;
          }
          return false;
        });
      setAllProtectors(docs);
    }, (error) => {
      console.error("Tactical Net Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const [activeRadius, setActiveRadius] = useState(5.0);

  // 🎯 MULTI-LAYER ADAPTIVE FILTERING: Direct 5km scan
  useEffect(() => {
    if (!userPos || allProtectors.length === 0) return;

    let foundProtectors: any[] = [];
    let currentRadius = 5.0;

    const allWithDistance = allProtectors.map(p => {
      const lat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude || (p.coords && p.coords[0]);
      const lng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude || (p.coords && p.coords[1]);
      const distanceKm = (lat && lng) ? calculateDistance(userPos[0], userPos[1], lat, lng) : null;
      return { ...p, distanceKm };
    });

    foundProtectors = allWithDistance
      .filter(p => p.distanceKm !== null && p.distanceKm <= currentRadius)
      .sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));

    setNearbyProtectors(foundProtectors);
    setActiveRadius(currentRadius);
  }, [userPos, allProtectors]);

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#1E293B] overflow-hidden">
      {/* 📡 HEADER: TACTICAL CONTROL */}
      <header className="px-3 sm:px-6 py-3 sm:py-5 border-b border-[#E5E7EB] bg-white flex items-center gap-2 sm:gap-5 z-30 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center hover:bg-gray-50 transition-all text-[#1E293B] shrink-0 shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-lg font-bold tracking-tight flex items-center gap-1.5 leading-none text-[#1E293B]">
              <Shield size={16} className="text-[#2563EB] shrink-0" />
              <span className="truncate">Protector Radar</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
               <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#22C55E] rounded-full animate-pulse" />
               <p className="text-[7px] sm:text-[9px] text-[#64748B] font-bold uppercase tracking-widest leading-none truncate">5KM Perimeter // Live</p>
            </div>
          </div>
        </div>
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-[#2563EB] rounded-lg sm:rounded-2xl flex items-center gap-1.5 sm:gap-3 shadow-lg shadow-[#2563EB]/10 shrink-0">
          <Zap size={12} className="text-white" />
          <span className="text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-widest">{nearbyProtectors.length} Units</span>
        </div>
      </header>

      {/* 🗺️ MAP: PRIMARY VISUALIZATION */}
      <main className="flex-1 relative min-h-0 bg-[#F1F5F9]">
        {!useMapboxFallback ? (
          <MapplsSecurityRadarMap protectors={nearbyProtectors} activeRadius={activeRadius} onFallback={() => setUseMapboxFallback(true)} />
        ) : (
          <SecurityRadarMap protectors={nearbyProtectors} activeRadius={activeRadius} />
        )}
        
        {/* Radar Overlay Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
           <button className="p-3 bg-white rounded-xl border border-[#E5E7EB] text-[#1E293B] shadow-xl active:scale-90 transition-all">
             <Navigation size={18} />
           </button>
        </div>
      </main>

      {/* 📊 TACTICAL INTEL PANEL: PROTECTOR ROSTER */}
      <section className="h-[40vh] sm:h-[45vh] bg-white border-t border-[#E5E7EB] flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-30">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-[#F8FAFC]">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#2563EB] uppercase tracking-[2px]">Mission Assets</span>
            <span className="text-[8px] text-[#64748B] font-medium mt-0.5">Real-time Tactical Intercept</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-ping" /> Scanning
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {nearbyProtectors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-12 h-12 border border-dashed border-[#E5E7EB] rounded-full flex items-center justify-center mb-4">
                   <Shield size={24} className="text-[#94A3B8]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Zero Tactical Units in Radius</p>
                <p className="text-[8px] mt-2 italic text-[#94A3B8]">Waiting for Handshake...</p>
              </motion.div>
            ) : (
              nearbyProtectors.map((protector, idx) => {
                const distanceM = (protector.distanceKm * 1000).toFixed(0);
                const isInRadius = protector.distanceKm <= 1.0;
                const isOnline = protector.isOnline !== false;
                const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].includes(protector.protectorVetting?.occupation) || protector.role === 'pcr_officer';

                return (
                  <motion.div
                    key={protector.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group relative bg-white border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm overflow-hidden",
                      isElite 
                        ? "border-amber-400 bg-amber-50/20 shadow-[0_4px_20px_rgba(245,158,11,0.15)]" 
                        : (isInRadius ? "border-[#2563EB]/10" : "border-[#E5E7EB]")
                    )}
                  >
                    {isElite && (
                       <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-400 text-white text-[6px] font-black uppercase tracking-widest rounded-bl-lg shadow-sm">
                          {protector.role === 'pcr_officer' ? "PCR PATROL" : "Elite"}
                       </div>
                    )}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center transition-all border",
                           isElite 
                             ? "bg-amber-100 border-amber-200" 
                             : (isOnline ? "bg-[#EFF6FF] border-[#2563EB]/10" : "bg-gray-50 border-[#E5E7EB]")
                        )}>
                          <UserIcon size={20} className={isElite ? "text-amber-600" : (isOnline ? "text-[#2563EB]" : "text-[#94A3B8]")} />
                        </div>
                        {isOnline && (
                           <div className={cn(
                             "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full transition-all",
                             isElite ? "bg-amber-500" : "bg-[#22C55E]"
                           )} />
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className={cn(
                          "text-sm font-bold flex items-center gap-1.5 truncate",
                          isElite ? "text-amber-900" : "text-[#1E293B]"
                        )}>
                          {protector.role === 'pcr_officer' 
                            ? (protector.vehicleNo || `PCR Patrol Unit`) 
                            : (protector.name || 'Unit')}
                          {(protector.isVerified || protector.role === 'pcr_officer') && <CheckCircle2 size={12} className={isElite ? "text-amber-500" : "text-[#2563EB]"} />}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wide truncate max-w-[120px]",
                            isElite ? "text-amber-600" : "text-[#64748B]"
                          )}>
                             {protector.role === 'pcr_officer' 
                               ? "🚨 ACTIVE MOBILE PATROL" 
                               : (protector.protectorVetting?.occupation || protector.profession || 'RESPONDER')}
                          </span>
                          <span className="w-1 h-1 bg-[#E5E7EB] rounded-full shrink-0" />
                          <span className={cn(
                            "text-[10px] font-bold tracking-tight",
                            isElite ? "text-amber-700" : "text-[#1E293B]"
                          )}>{distanceM}m</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => initiateCall(protector.uid || protector.id, protector.name || 'Protector', activeAlertId || undefined)}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90 shrink-0",
                        isElite 
                          ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                          : (isOnline 
                              ? "bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-[#22C55E]/20" 
                              : "bg-gray-50 text-[#CBD5E1] border border-[#E5E7EB] cursor-not-allowed")
                      )}
                      disabled={!isOnline}
                    >
                      <PhoneCall size={18} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* 🛡️ SECURITY FOOTER */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 opacity-60">
             <Lock size={10} className="text-[#2563EB]" />
             <span className="text-[8px] font-bold uppercase tracking-widest text-[#64748B]">Tactical Encrypted Intercept Active</span>
          </div>
          <div className="flex gap-1">
             {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-[#2563EB] rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
