import React, { useState, useEffect } from 'react';
import { Navigation, Phone, AlertCircle, Shield, Activity, Zap, Clock, MapPin, MessageSquare, Send, X } from 'lucide-react';
import ProtectorMap from './maps/ProtectorMap';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { useCall } from '../contexts/CallContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProtectorDashboard() {
  const { initiateCall } = useCall();
  const { user, userPos } = useKavachStore();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [isGrievanceOpen, setIsGrievanceOpen] = useState(false);
  const [grievanceText, setGrievanceText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGrievanceSubmit = async () => {
    if (!grievanceText.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'protector_grievances'), {
        uid: user.uid,
        name: user.displayName || 'Protector',
        message: grievanceText,
        timestamp: serverTimestamp(),
        status: 'pending',
        type: 'incident_report'
      });
      setGrievanceText('');
      setIsGrievanceOpen(false);
      alert("MISSION REPORT SENT TO SUPERCELL.");
    } catch (error) {
      console.error("Grievance submission failed:", error);
      alert("FAILED TO SEND REPORT.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'alerts'),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (userPos) {
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const mapped = alerts.map((a: any) => {
          const lat = a.location?.latitude || a.coords?.[0] || 0;
          const lng = a.location?.longitude || a.coords?.[1] || 0;
          const dist = (lat && lng) ? calculateDistance(userPos[0], userPos[1], lat, lng) : 999;
          return { ...a, distanceKm: dist, tacticalCoords: [lat, lng] };
        }).filter(a => a.victimUid !== user?.uid);

        setActiveAlerts(mapped);
      } else {
        setActiveAlerts(alerts.map((a: any) => ({
          ...a,
          tacticalCoords: [
            (a.location?.latitude || a.coords?.[0] || 0),
            (a.location?.longitude || a.coords?.[1] || 0)
          ]
        })));
      }
    });
    return () => unsubscribe();
  }, [userPos, user]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-mono overflow-hidden">
      {/* 📍 TACTICAL MAP SECTION */}
      <div className="flex-1 relative border-b border-white/5">
        <div className="absolute top-4 left-4 z-[50] flex flex-wrap gap-2 sm:gap-3">
          <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-50" />
            </div>
            <span className="text-[10px] font-black tracking-[3px] uppercase italic text-green-500">
              Uplink Stable
            </span>
          </div>

          <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
            <Activity size={12} className="text-accent-blue" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              Grid: Active
            </span>
          </div>
        </div>

        <ProtectorMap hideHeader nearbyAlerts={activeAlerts} />

        {/* Tactical Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-blue/10 animate-scan pointer-events-none" />
      </div>

      {/* 📋 MISSION LOGS SECTION */}
      <div className="h-[45%] bg-[#080808] flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-accent-blue" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-[3px] italic">Mission Intercepts</h2>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Real-time SOS Feed</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <span className="text-[9px] font-black text-accent-red animate-pulse uppercase">
              {activeAlerts.length} Active
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
          <AnimatePresence mode="popLayout">
            {activeAlerts.length > 0 ? (
              <div className="space-y-3">
                {activeAlerts.map((alert, idx) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-white/[0.03] border border-white/5 hover:border-accent-blue/30 rounded-2xl p-4 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent-red/40 group-hover:bg-accent-blue transition-colors" />

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
                            <Zap size={14} className="text-accent-red" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black italic uppercase tracking-tight flex items-center gap-2">
                              SOS-ALPHA-{alert.id.slice(-4).toUpperCase()}
                              <span className="text-[8px] px-1.5 py-0.5 bg-accent-red text-white rounded font-black not-italic tracking-normal">URGENT</span>
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase">
                                <MapPin size={10} className="text-accent-blue" />
                                {alert.distanceKm ? `${alert.distanceKm.toFixed(2)} KM` : 'CALC...'}
                              </span>
                              <span className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase">
                                <Clock size={10} />
                                {alert.timestamp ? new Date(alert.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => initiateCall(alert.victimUid, "TARGET")}
                          className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-green-500/20 hover:border-green-500/40 transition-all group/btn"
                        >
                          <Phone size={18} className="text-green-500 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[7px] font-black mt-1 uppercase">Call</span>
                        </button>

                        <button
                          onClick={() => {
                            const coords = alert.tacticalCoords;
                            if (coords) window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
                          }}
                          className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-accent-blue/20 hover:border-accent-blue/40 transition-all group/btn"
                        >
                          <Navigation size={18} className="text-accent-blue group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[7px] font-black mt-1 uppercase">Nav</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-10"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <AlertCircle size={32} className="text-gray-600" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[5px] text-gray-500">Scanning Perimeter</h3>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">No Active SOS Signal Detected</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


