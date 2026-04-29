import React, { useState, useEffect } from 'react';
import { Shield, MapPin, PhoneCall, ArrowLeft, Zap, Navigation, CheckCircle2, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { useCall } from '../contexts/CallContext';
import { cn } from '../lib/utils';
import SecurityRadarMap from '../components/maps/SecurityRadarMap';

export default function ProtectorsRadarScreen() {
  const { userPos, setActiveTab } = useKavachStore();
  const { initiateCall } = useCall();
  const [nearbyProtectors, setNearbyProtectors] = useState<any[]>([]);

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

  useEffect(() => {
    if (!userPos) return;

    // Listen to all active verified protectors
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'protector'),
      where('isVerified', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeProtectors = snapshot.docs.map(doc => {
        const data = doc.data();
        let distanceKm = null;

        // Only use real GPS data. Skip if real location is not available.
        if (data.lastLocation && data.lastLocation.lat && data.lastLocation.lng) {
          distanceKm = calculateDistance(userPos[0], userPos[1], data.lastLocation.lat, data.lastLocation.lng);
        }

        return {
          id: doc.id,
          ...data,
          distanceKm
        };
      })
        // Filter out protectors without valid real coordinates and those outside ~1.5km
        .filter(p => p.distanceKm !== null && p.distanceKm <= 1.5)
        // Strictly sort by nearest first (Critical Requirement)
        .sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));

      setNearbyProtectors(activeProtectors);
    }, (error) => {
      console.error("Failed to fetch nearby tactical units:", error);
    });

    return () => unsubscribe();
  }, [userPos]);

  return (
    <div className="bento-grid relative p-4 bg-[#0a0a0a] text-white min-h-[90vh]">
      {/* Header */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 flex items-center justify-between border border-accent-blue/20 bg-black">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
              <Shield size={22} className="text-accent-blue" />
              Protector Radar
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">1KM Tactical Perimeter Live</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center border border-accent-blue/30 shadow-[0_0_20px_rgba(0,122,255,0.2)]">
          <Zap size={20} className="text-accent-blue" />
        </div>
      </section>

      {/* Map Sub-component overlaying protectors */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 p-0 group overflow-hidden border border-white/5 min-h-[450px] sm:min-h-[550px]">
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/20">
            <span className="text-[9px] font-mono font-bold tracking-[2px] text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              RADAR ACTIVE
            </span>
          </div>
        </div>
        <SecurityRadarMap protectors={nearbyProtectors} />
      </section>

      {/* Roster / Call Interface */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 bg-[#111] border border-white/5 flex flex-col">
        <div className="bento-card-title flex items-center justify-between mb-4 pb-4 border-b border-white/5">
          <span className="text-white text-xs">Nearest Responders ({nearbyProtectors.length})</span>
          <span className="text-[9px] text-green-500 uppercase tracking-widest font-mono font-bold">Scanning...</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          <AnimatePresence>
            {nearbyProtectors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10"
              >
                <Shield size={48} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No verified protectors in radius.</p>
                <p className="text-[8px] font-mono mt-2">Expanding radar net...</p>
              </motion.div>
            ) : (
              nearbyProtectors.map((protector, idx) => (
                <motion.div
                  key={protector.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-black border border-white/10 rounded-xl p-4 overflow-hidden relative group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue" />
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center text-accent-blue">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black italic uppercase flex items-center gap-1.5">
                          {protector.name || 'Verified Responder'}
                          <CheckCircle2 size={12} className="text-accent-blue" />
                        </h4>
                        <p className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                          Distance: <span className="text-white">{(protector.distanceKm * 1000).toFixed(0)}m</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Masked Call Interface */}
                  <div className="pt-3 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => {
                        // Masking number - Using App's native VoIP/WebRTC link so no physical number is exposed to either party.
                        initiateCall(protector.uid || protector.id, protector.name || 'Protector');
                      }}
                      className="w-full py-3 bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white border border-green-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <PhoneCall size={14} /> SECURE MASKED CALL
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400">
          <Lock size={12} />
          <span className="text-[8px] font-black uppercase tracking-widest">End-to-End Encrypted VoIP. Phone Numbers are strictly hidden.</span>
        </div>
      </section>
    </div>
  );
}
