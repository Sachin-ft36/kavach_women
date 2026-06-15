import React, { useState, useEffect } from 'react';
import { Shield, MapPin, PhoneCall, ArrowLeft, Zap, Navigation, CheckCircle2, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { useCall } from '../contexts/CallContext';
import { cn } from '../lib/utils';
import KavachMap from '../components/maps/KavachMap';

export default function ProtectorsRadarScreen() {
  const { role, user, userPos, setActiveTab, activeAlertId } = useKavachStore();
  const isCitizen = role === 'citizen';
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

  const [activeRadius, setActiveRadius] = useState(2.0);

  // 🎯 MULTI-LAYER ADAPTIVE FILTERING: Direct 2km scan
  useEffect(() => {
    if (!userPos || allProtectors.length === 0) return;

    let foundProtectors: any[] = [];
    let currentRadius = 2.0;

    const allWithDistance = allProtectors.map(p => {
      const lat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude || (p.coords && p.coords[0]);
      const lng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude || (p.coords && p.coords[1]);
      const distanceKm = (lat && lng) ? calculateDistance(userPos.lat, userPos.lng, lat, lng) : null;
      return { ...p, distanceKm };
    });

    foundProtectors = allWithDistance
      .filter(p => {
        if (p.distanceKm === null) return false;
        if (p.id === user?.uid || p.uid === user?.uid) return false;
        const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].includes(p.protectorVetting?.occupation || p.profession) || p.role === 'pcr_officer';
        if (isElite) {
          return p.distanceKm <= 5.0;
        }
        return p.distanceKm <= currentRadius;
      })
      .sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));

    setNearbyProtectors(foundProtectors);
    setActiveRadius(currentRadius);
  }, [userPos, allProtectors]);

  return (
    <div className={cn("flex flex-col h-screen overflow-hidden", isCitizen ? "bg-[#F8FAFC] text-slate-800" : "bg-[#0F172A] text-white")}>
      {/* 📡 HEADER: TACTICAL CONTROL */}
      <header className={cn("px-3 sm:px-6 py-3 sm:py-5 border-b flex items-center gap-2 sm:gap-5 z-30 shadow-sm", isCitizen ? "bg-white border-slate-200" : "bg-[#1E293B] border-white/10")}>
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all shrink-0 shadow-sm active:scale-95", isCitizen ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10")}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className={cn("text-sm sm:text-lg font-bold tracking-tight flex items-center gap-1.5 leading-none", isCitizen ? "text-slate-800" : "text-white")}>
              <Shield size={16} className="text-blue-400 shrink-0" />
              <span className="truncate">Protector Radar</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
               <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse" />
               <p className={cn("text-[7px] sm:text-[9px] font-bold uppercase tracking-widest leading-none truncate", isCitizen ? "text-slate-500" : "text-slate-400")}>2KM Perimeter // Live</p>
            </div>
          </div>
        </div>
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-[#2563EB] rounded-lg sm:rounded-2xl flex items-center gap-1.5 sm:gap-3 shadow-lg shadow-[#2563EB]/10 shrink-0">
          <Zap size={12} className="text-white" />
          <span className="text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-widest">{nearbyProtectors.length} Units</span>
        </div>
      </header>

      {/* 🗺️ MAP: PRIMARY VISUALIZATION */}
      <main className="flex-1 relative min-h-0 bg-[#F1F5F9] pt-3 px-3 sm:pt-4 sm:px-4 pb-0">
        <div className="w-full h-full relative rounded-t-[24px] sm:rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 bg-[#0F172A]">
          <KavachMap 
            mode="radar" 
            activeProtectors={nearbyProtectors} 
            {...{protectors: nearbyProtectors, activeRadius}}
            useMapboxFallback={useMapboxFallback} 
            onFallback={() => setUseMapboxFallback(true)} 
          />
          
          {/* Radar Overlay Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
             <button className={cn("p-3 rounded-xl border shadow-xl active:scale-90 transition-all", isCitizen ? "bg-white border-slate-200 text-slate-600" : "bg-[#1E293B] border-white/10 text-slate-300")}>
               <Navigation size={18} />
             </button>
          </div>
        </div>
      </main>

      {/* 📊 TACTICAL INTEL PANEL: PROTECTOR ROSTER */}
      <section className={cn("h-[40vh] sm:h-[45vh] border-t flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.2)] z-30", isCitizen ? "bg-[#F8FAFC] border-slate-200" : "bg-[#0F172A] border-white/10")}>
        <div className={cn("px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between shrink-0", isCitizen ? "bg-white border-slate-200" : "bg-[#1E293B] border-white/5")}>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[2px]">Mission Assets</span>
            <span className="text-[8px] text-slate-400 font-medium mt-0.5">Real-time Tactical Intercept</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" /> Scanning
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-24 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {nearbyProtectors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-12 h-12 border border-dashed border-white/20 rounded-full flex items-center justify-center mb-4">
                   <Shield size={24} className="text-slate-600" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Zero Tactical Units in Radius</p>
                <p className="text-[8px] mt-2 italic text-slate-600">Waiting for Handshake...</p>
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
                      "group relative border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm overflow-hidden",
                      isCitizen ? "bg-white" : "bg-[#1E293B]",
                      isElite 
                        ? "border-amber-500/50 bg-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.1)]" 
                        : (isInRadius ? (isCitizen ? "border-blue-300" : "border-blue-500/20") : (isCitizen ? "border-slate-200" : "border-white/10"))
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
                             ? (isCitizen ? "bg-amber-50 border-amber-200" : "bg-amber-500/20 border-amber-500/30") 
                             : (isOnline ? (isCitizen ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20") : (isCitizen ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"))
                        )}>
                          <UserIcon size={20} className={isElite ? "text-amber-400" : (isOnline ? "text-blue-400" : "text-slate-500")} />
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
                          isElite ? "text-amber-500" : (isCitizen ? "text-slate-800" : "text-white")
                        )}>
                          {protector.role === 'pcr_officer' 
                            ? (protector.vehicleNo || `PCR Patrol Unit`) 
                            : (protector.name || 'Unit')}
                          {(protector.isVerified || protector.role === 'pcr_officer') && <CheckCircle2 size={12} className={isElite ? "text-amber-400" : "text-blue-400"} />}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wide truncate max-w-[120px]",
                            isElite ? "text-amber-600" : (isCitizen ? "text-slate-500" : "text-slate-400")
                          )}>
                             {protector.role === 'pcr_officer' 
                               ? "🚨 ACTIVE MOBILE PATROL" 
                               : (protector.protectorVetting?.occupation || protector.profession || 'RESPONDER')}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold shrink-0",
                            isCitizen ? "text-slate-400" : "text-slate-500"
                          )}>•</span>
                          <span className={cn(
                            "text-[10px] font-bold tracking-tight",
                            isElite ? "text-amber-400" : (isCitizen ? "text-slate-600" : "text-slate-300")
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


      </section>
    </div>
  );
}
