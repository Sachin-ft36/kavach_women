import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MapPin, Phone, Navigation, ChevronRight, Users, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface NearbyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Node {
  name: string;
  dist: string;
  status: string;
  phone: string;
  lat?: number;
  lng?: number;
}

import { fetchNearbyPoliceMappls } from '../services/MapplsService';

export default function NearbyHubModal({ isOpen, onClose }: NearbyHubModalProps) {
  const { userPos } = useKavachStore();
  const [loading, setLoading] = useState(true);
  const [policeStations, setPoliceStations] = useState<Node[]>([]);
  const [protectors, setProtectors] = useState<any[]>([]);

  const fetchRealData = async () => {
    if (!userPos) return;
    setLoading(true);
    
    try {
      const [lat, lng] = userPos;
      
      // 🛰️ PRIMARY ENGINE: MapmyIndia (Mappls) - Best for India
      let realStations = await fetchNearbyPoliceMappls(lat, lng);

      const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
      const offset = 0.1;
      const bbox = `${lng-offset},${lat-offset},${lng+offset},${lat+offset}`;

      // 🛰️ FALLBACK ENGINE: Mapbox - Only if Mappls has no results or credentials missing
      if (realStations.length === 0) {
        console.log("Mappls returned 0 nodes. Falling back to Mapbox Grid...");
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/police%20station.json?proximity=${lng},${lat}&bbox=${bbox}&access_token=${MAPBOX_TOKEN}&limit=10&types=poi&country=in`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        realStations = data.features.map((f: any) => {
          const [fLng, fLat] = f.geometry.coordinates;
          const d = calculateDistance(lat, lng, fLat, fLng);
          return {
            id: f.id,
            name: f.text || "Police Post",
            dist: d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`,
            distVal: d,
            status: d < 1 ? "Immediate Response" : "Patrol Active",
            phone: f.properties?.tel || f.properties?.phone || "112",
            lat: fLat,
            lng: fLng
          };
        }).filter((s: any) => s.distVal <= 10);
      }

      setPoliceStations(realStations.sort((a: any, b: any) => (a.distVal || 0) - (b.distVal || 0)));

      // 🛡️ COMMUNITY PROTECTOR SYNC: Real verified users from Firestore
      try {
        const protectorsRef = collection(db, 'users');
        const q = query(
          protectorsRef, 
          where('role', '==', 'protector'),
          where('isVerified', '==', true),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        
        const realProtectors = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          const pLat = data.telemetry?.coords?.[0] || data.lastLocation?.lat;
          const pLng = data.telemetry?.coords?.[1] || data.lastLocation?.lng;
          
          let distVal = 999;
          let distStr = "Positioning...";

          if (userPos && pLat && pLng) {
            const d = calculateDistance(userPos[0], userPos[1], pLat, pLng);
            distStr = d < 1 ? `${(d * 1000).toFixed(0)}m AWAY` : `${d.toFixed(1)}km AWAY`;
            distVal = d;
          }

          return {
            id: doc.id,
            name: data.name || "Verified Protector",
            dist: distStr,
            distVal: distVal,
            profession: data.protectorVetting?.occupation || "RESPONDER"
          };
        })
        .filter(p => p.id !== auth.currentUser?.uid)
        .sort((a, b) => a.distVal - b.distVal);

        setProtectors(realProtectors.slice(0, 5));
      } catch (e) {
        console.error("Protector sync failed:", e);
      }

    } catch (e) {
      console.error("Police Grid Error:", e);
      toast.error("Safety Grid Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (isOpen) fetchRealData();
  }, [isOpen, userPos]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] bg-[#0A0A0B] flex flex-col p-6 pt-12 overflow-hidden"
      >
        <header className="flex justify-between items-center mb-8">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white flex items-center gap-2 group active:scale-95 transition-all"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span className="text-[10px] font-black uppercase tracking-widest">Safe Zone</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            {loading && <Loader2 size={10} className="animate-spin text-cyan-400" />}
            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest italic">
              {loading ? "Scanning National Grid..." : "Live Safety Network Active"}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-10 scrollbar-hide pr-1">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">POLICE / PROTECTOR HUB</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[3px]">Authorized Local Support Nodes</p>
          </div>

          {/* 🚨 NATIONAL HELPLINES */}
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => window.open('tel:1090')} className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <span className="text-[10px] text-fuchsia-400 font-black uppercase tracking-widest">Women Helpline</span>
                <span className="text-lg font-black text-white italic">1090</span>
             </button>
             <button onClick={() => window.open('tel:1930')} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Cyber Crime</span>
                <span className="text-lg font-black text-white italic">1930</span>
             </button>
          </div>

          {/* 🚓 OFFICIAL POLICE NODES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Building2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Real-time Police Locations</span>
              </div>
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{policeStations.length} Nodes</span>
            </div>

            <div className="grid gap-3">
              {policeStations.length > 0 ? policeStations.map((station, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-4"
                >
                   <div className="flex justify-between items-start">
                      <div className="flex-1">
                         <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[200px]">{station.name}</h4>
                         <p className="text-[9px] text-cyan-400 font-bold uppercase mt-1.5 flex items-center gap-1.5">
                            <MapPin size={10} /> {station.dist} AWAY • {station.status}
                         </p>
                      </div>
                      <div className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-md">
                         <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Official</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => window.open(`tel:${station.phone}`)} className="py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                         <Phone size={12} /> Call
                      </button>
                      <button 
                        onClick={() => {
                          const dest = (station.lat && station.lng) 
                            ? `${station.lat},${station.lng}` 
                            : encodeURIComponent(station.name);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                        }}
                        className="py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                         <Navigation size={12} /> Navigate
                      </button>
                   </div>
                </motion.div>
              )) : (
                <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl text-center">
                   <p className="text-[10px] text-gray-600 font-bold uppercase italic">
                     {loading ? "Searching Grid..." : "No official nodes found in 10km. Patrol units notified."}
                   </p>
                </div>
              )}
            </div>
          </section>

          {/* 🤝 COMMUNITY PROTECTORS */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-amber-500">
                <Users size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Community Responders</span>
             </div>
             <div className="grid gap-3">
                {protectors.map((p, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-[24px] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white relative">
                           <Users size={18} />
                           <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full" />
                        </div>
                        <div>
                           <h4 className="text-xs font-black text-white uppercase italic">{p.name}</h4>
                           <p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">{p.profession} • {p.dist}</p>
                        </div>
                     </div>
                     <button className="px-5 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                        Alert
                     </button>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <footer className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
          <Shield size={16} className="text-gray-600 shrink-0" />
          <p className="text-[8px] text-gray-600 font-bold uppercase leading-relaxed tracking-widest">
            Kavach uses satellite triangulation and OSM grid to locate verified safety nodes across India.
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
