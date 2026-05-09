import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, MapPin, Bell, Activity, Clock, Phone, 
  ChevronRight, Users, Navigation, AlertTriangle,
  User, Mail, Fingerprint, ShieldCheck, Heart
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy, doc, getDocs } from 'firebase/firestore';

export function WomenSafetyOPS({ activeAlerts, onAlertClick }: { activeAlerts: any[], onAlertClick: (id: string) => void }) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const selectedAlert = activeAlerts.find(a => a.id === selectedAlertId);

  // 📡 RESOLVE VERIFIED ADDRESS IN REAL-TIME
  const resolveAddress = async (lat: number, lng: number) => {
    if (!lat || !lng) return;
    try {
      setLoadingAddress(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) {
        setResolvedAddress(data.display_name);
      } else {
        setResolvedAddress("Verified GPS Signal // Address Undetermined");
      }
    } catch (error) {
      setResolvedAddress("Tactical Resolution Failed");
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (selectedAlert?.latitude && selectedAlert?.longitude) {
      resolveAddress(selectedAlert.latitude, selectedAlert.longitude);
    } else {
      setResolvedAddress(null);
    }
  }, [selectedAlertId, selectedAlert]);

  // 📡 FETCH LIVE GUARDIANS FOR SELECTED VICTIM
  useEffect(() => {
    if (!selectedAlertId) return;
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert?.victimUid) return;

    const unsub = onSnapshot(collection(db, 'users', alert.victimUid, 'guardians'), (snap) => {
      setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedAlertId, activeAlerts]);

  // 🛡️ UI DEDUPLICATION: Only show the latest alert per victim
  const uniqueMap = new Map();
  [...activeAlerts]
    .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
    .forEach(alert => {
      const uid = alert.victimUid || alert.id;
      if (!uniqueMap.has(uid)) {
        uniqueMap.set(uid, alert);
      }
    });
  const uniqueAlerts = Array.from(uniqueMap.values());

  return (
    <div className="h-full flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
          <Bell size={16} className="animate-pulse" /> Live SOS Briefs
        </h2>
        <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100">
          {uniqueAlerts.length} UNIQUE ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {uniqueAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
             <Shield size={40} className="mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest">Grid Secured</p>
          </div>
        ) : (
          uniqueAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => {
                setSelectedAlertId(alert.id);
                onAlertClick(alert.id);
              }}
              className={cn(
                "p-4 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden",
                selectedAlertId === alert.id 
                  ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xl scale-[1.02]" 
                  : "bg-gray-50 border-gray-100 hover:bg-gray-100"
              )}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all",
                    selectedAlertId === alert.id ? "bg-white/10 border-white/20" : "bg-white border-gray-100 shadow-sm"
                  )}>
                    <Activity size={18} className={selectedAlertId === alert.id ? "text-red-400" : "text-red-600"} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase">{alert.victimName || 'Unknown User'}</h4>
                    <p className={cn("text-[8px] font-bold uppercase mt-0.5 opacity-60")}>
                      {alert.locationName || 'Pinpointing Location...'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase">
                    {alert.timestamp?.toDate ? new Date(alert.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LIVE'}
                  </span>
                </div>
              </div>
              
              <AnimatePresence>
                {selectedAlertId === alert.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-white/10 space-y-4"
                  >
                    {/* 🛡️ FORENSIC INTEL BRIEF */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                         <p className="text-[7px] font-black uppercase text-gray-400">Aadhaar Verified</p>
                         <p className="text-[9px] font-bold mt-0.5 flex items-center gap-1">
                           <Fingerprint size={10} className={cn(alert.victimAadhaar ? "text-emerald-400" : "text-blue-400")} /> 
                           {alert.victimAadhaar || 'PENDING'}
                           {alert.victimAadhaar && <ShieldCheck size={8} className="text-emerald-500" />}
                         </p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                         <p className="text-[7px] font-black uppercase text-gray-400">Tactical Contact</p>
                         <p className="text-[9px] font-bold mt-0.5 flex items-center gap-1">
                           <Phone size={10} className="text-green-400" /> {alert.victimPhone || 'NO-LINK'}
                         </p>
                      </div>
                      <div className="col-span-2 bg-white/5 p-2 rounded-xl border border-white/10">
                         <p className="text-[7px] font-black uppercase text-gray-400">Precise Resolved Address</p>
                         <p className="text-[9px] font-bold mt-0.5 leading-tight">
                            {loadingAddress ? "Verifying GPS Address..." : (resolvedAddress || alert.fullAddress || 'Resolving Geocode Sector...')}
                         </p>
                      </div>
                    </div>

                    {/* 👥 GUARDIAN NETWORK */}
                    <div className="space-y-2">
                       <p className="text-[8px] font-black uppercase text-red-400 tracking-widest flex items-center gap-1">
                          <Heart size={10} /> Guardian Network
                       </p>
                       {guardians.length === 0 ? (
                         <p className="text-[8px] opacity-40 italic">No guardians linked to this node.</p>
                       ) : (
                         <div className="space-y-1.5">
                           {guardians.map(g => (
                             <div key={g.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-[9px] font-bold">{g.name} ({g.relation})</span>
                                <span className="text-[9px] font-black text-blue-300">{g.phone}</span>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>

                    <button 
                      onClick={() => {
                        const trackLink = `${window.location.origin}/track/${alert.victimUid || alert.id}`;
                        const msg = `🚨 *KAVACH POLICE DISPATCH*\n\n*Victim:* ${alert.victimName || 'Citizen'}\n*Situation:* Emergency SOS\n*Live Pursuit Link:* ${trackLink}\n\n_Intercept immediately. Pursuit footprints active._`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                       <Shield size={12} /> Dispatch Police Units
                    </button>
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
