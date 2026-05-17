import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Shield, MapPin, Activity, Clock, Phone, 
  ChevronRight, Users, Navigation, AlertTriangle,
  User, Mail, Fingerprint, ShieldCheck, Heart,
  Zap, Search, Globe, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy, doc, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

export function TransitIntelligence({ 
  journeys, 
  onJourneyClick, 
  onNavigate,
  userStatusMap = {} 
}: { 
  journeys: any[], 
  onJourneyClick: (id: string) => void, 
  onNavigate?: (tab: string) => void,
  userStatusMap?: Record<string, any> 
}) {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [nearbyPolice, setNearbyPolice] = useState<any[]>([]);
  const [loadingPolice, setLoadingPolice] = useState(false);

  const resolveIdentity = (item: any) => {
    const uid = item.userId || item.uid || item.victimUid;
    return userStatusMap[uid]?.name || item.userName || 'Unknown Passenger';
  };

  const selectedJourney = journeys?.find(j => j.userId === selectedJourneyId);

  // 📡 RESOLVE VERIFIED ADDRESS IN REAL-TIME
  const resolveAddress = async (lat: number, lng: number) => {
    if (!lat || !lng) return;
    try {
      setLoadingAddress(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setResolvedAddress(data.display_name || "Verified GPS Signal // Address Undetermined");
    } catch (error) {
      setResolvedAddress("Tactical Resolution Failed");
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (selectedJourney?.latitude && selectedJourney?.longitude) {
      resolveAddress(selectedJourney.latitude, selectedJourney.longitude);
    } else {
      setResolvedAddress(null);
    }
  }, [selectedJourneyId, selectedJourney?.latitude, selectedJourney?.longitude]);

  // 📡 REAL-TIME POLICE SCANNER TRIGGERED BY MOVEMENT IN EMERGENCY
  useEffect(() => {
    if (selectedJourney?.latitude && selectedJourney?.longitude && selectedJourney?.status === 'emergency') {
      const loadPolice = async () => {
        setLoadingPolice(true);
        try {
          const { fetchNearbyPoliceMappls } = await import('../../services/MapplsService');
          const data = await fetchNearbyPoliceMappls(selectedJourney.latitude, selectedJourney.longitude);
          setNearbyPolice(data.slice(0, 3)); 
        } catch (e) {
          console.error("Error loading police in transit intel:", e);
        } finally {
          setLoadingPolice(false);
        }
      };
      loadPolice();
    } else {
      setNearbyPolice([]);
    }
  }, [selectedJourneyId, selectedJourney?.latitude, selectedJourney?.longitude, selectedJourney?.status]);

  return (
    <div className="h-full flex flex-col bg-white border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
        <h2 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
          <Car size={16} className="animate-pulse" /> Transit Intelligence
        </h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black border border-blue-200">
          {(journeys?.length || 0)} LIVE TRANSITS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {(!journeys || journeys.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
             <Globe size={40} className="mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest text-center px-10">No Active Transits in National Grid</p>
          </div>
        ) : (
          journeys.map((journey) => (
            <motion.div
              key={journey.userId}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => {
                setSelectedJourneyId(journey.userId);
                onJourneyClick(journey.userId);
              }}
              className={cn(
                "p-4 border transition-all cursor-pointer group relative overflow-hidden",
                selectedJourneyId === journey.userId 
                  ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xl scale-[1.01]" 
                  : "bg-gray-50 border-gray-100 hover:bg-gray-100"
              )}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center border transition-all",
                    selectedJourneyId === journey.userId ? "bg-white/10 border-white/20" : "bg-white border-gray-100 shadow-sm"
                  )}>
                    <Car size={18} className={selectedJourneyId === journey.userId ? "text-blue-400" : "text-blue-600"} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase">{resolveIdentity(journey)}</h4>
                    <p className={cn("text-[9px] font-black uppercase mt-0.5", selectedJourneyId === journey.userId ? "text-blue-300" : "text-blue-600")}>
                      Vehicle: {journey.vehicleNo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("text-[8px] font-black uppercase px-2 py-0.5", journey.status === 'emergency' ? "bg-red-500 text-white" : "bg-green-500/10 text-green-600")}>
                    {journey.status || 'Active'}
                  </span>
                </div>
              </div>
              
              <AnimatePresence>
                {selectedJourneyId === journey.userId && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-white/10 space-y-4"
                  >
                    {/* 🛡️ JOURNEY INTEL BRIEF */}
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-white/5 p-2 border border-white/10">
                          <p className="text-[7px] font-black uppercase text-gray-400">Tactical Start</p>
                          <p className="text-[9px] font-bold mt-0.5 flex items-center gap-1"><Clock size={10} className="text-blue-400" /> {new Date(journey.startTime).toLocaleTimeString()}</p>
                       </div>
                       <div className="bg-white/5 p-2 border border-white/10">
                          <p className="text-[7px] font-black uppercase text-gray-400">System Link</p>
                          <p className="text-[9px] font-bold mt-0.5 flex items-center gap-1"><Zap size={10} className="text-amber-400" /> VETTING ACTIVE</p>
                       </div>
                        <div className="col-span-2 bg-white/5 p-2 border border-white/10">
                           <p className="text-[7px] font-black uppercase text-gray-400">Current Geocode Sector</p>
                           <p className="text-[9px] font-bold mt-0.5 leading-tight">
                              {loadingAddress ? "Verifying GPS Address..." : (resolvedAddress || "Streaming Telemetry...")}
                           </p>
                        </div>
                     {/* 🚨 MOVEMENT SYNCED POLICE COVERAGE IN EMERGENCY */}
                     {journey.status === 'emergency' && (
                        <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 space-y-2">
                           <div className="flex justify-between items-center">
                              <p className="text-[8px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                 <Shield size={10} className="text-red-500" /> Movement Synced Safeguards
                              </p>
                              {loadingPolice && (
                                 <span className="text-[7px] font-black uppercase text-red-400 animate-pulse tracking-wider">
                                    LOCATING...
                                 </span>
                              )}
                           </div>
                           
                           <div className="space-y-1.5">
                              {nearbyPolice.length === 0 ? (
                                 <p className="text-[7.5px] text-gray-500 font-bold uppercase italic">Querying nearest safeguards...</p>
                              ) : (
                                 nearbyPolice.map((station) => (
                                    <div key={station.id} className="p-2 bg-black/40 rounded-lg border border-white/5 flex justify-between items-center">
                                       <div className="flex flex-col min-w-0">
                                          <span className="text-[8.5px] font-black text-white uppercase italic truncate max-w-[120px]">{station.name}</span>
                                          <span className="text-[6.5px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[120px]">{station.address}</span>
                                       </div>
                                       <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[8px] font-black text-red-400 tabular-nums">{station.dist}</span>
                                          <button 
                                             onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                   const { updateDoc, doc } = await import('firebase/firestore');
                                                   await updateDoc(doc(db, 'journeys', journey.userId), {
                                                      alertDispatchedUnit: station.name,
                                                      alertDispatchedAt: new Date().toISOString()
                                                   });
                                                   toast.success(`Interceptor unit dispatched from ${station.name}!`);
                                                } catch (err) {
                                                   console.error("Failed to dispatch to transit:", err);
                                                }
                                             }}
                                             className="px-2 py-0.5 bg-red-600 text-white rounded text-[7px] font-black uppercase hover:bg-red-700 transition-all"
                                          >
                                             DISPATCH
                                          </button>
                                       </div>
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>
                     )}
                    </div>

                    <div className="flex gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onJourneyClick(journey.userId);
                           onNavigate?.('MAP');
                         }}
                         className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                       >
                          <Navigation size={12} /> Live Trace
                       </button>
                       <button className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest transition-all">
                          INTERCEPT
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
