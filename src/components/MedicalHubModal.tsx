import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MapPin, Phone, Navigation, ChevronRight, Activity, Loader2, Heart, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { fetchNearbyHospitalsMappls } from '../services/MapplsService';

interface MedicalHubModalProps {
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

export default function MedicalHubModal({ isOpen, onClose }: MedicalHubModalProps) {
  const { userPos } = useKavachStore();
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<Node[]>([]);

  const fetchRealData = async () => {
    if (!userPos) return;
    setLoading(true);
    
    try {
      const [lat, lng] = userPos;
      
      // 🛰️ PRIMARY ENGINE: MapmyIndia (Mappls)
      let realHospitals = await fetchNearbyHospitalsMappls(lat, lng);

      // 🛰️ FALLBACK ENGINE: Mapbox
      if (realHospitals.length === 0) {
        console.log("Mappls returned 0 hospital nodes. Falling back to Mapbox Grid...");
        const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
        const offset = 0.1;
        const bbox = `${lng-offset},${lat-offset},${lng+offset},${lat+offset}`;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/hospital.json?proximity=${lng},${lat}&bbox=${bbox}&access_token=${MAPBOX_TOKEN}&limit=10&types=poi&country=in`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        realHospitals = data.features.map((f: any) => {
          const [fLng, fLat] = f.geometry.coordinates;
          const d = calculateDistance(lat, lng, fLat, fLng);
          return {
            id: f.id,
            name: f.text || "Medical Center",
            dist: d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`,
            distVal: d,
            status: "Emergency Care Ready",
            phone: f.properties?.tel || f.properties?.phone || "108",
            lat: fLat,
            lng: fLng
          };
        }).filter((s: any) => s.distVal <= 10);
      }

      setHospitals(realHospitals.sort((a: any, b: any) => (a.distVal || 0) - (b.distVal || 0)));
    } catch (e) {
      console.error("Medical Grid Error:", e);
      toast.error("Medical Grid Sync Failed");
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
            <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
            {loading && <Loader2 size={10} className="animate-spin text-rose-400" />}
            <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest italic">
              {loading ? "Locating Trauma Centers..." : "Medical Shield Active"}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-10 scrollbar-hide pr-1">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">EMERGENCY MEDICAL HUB</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[3px]">24/7 Trauma & Ambulance Services</p>
          </div>

          {/* 🚨 PRIORITY MEDICAL HELPLINES */}
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => window.open('tel:108')} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Ambulance</span>
                <span className="text-xl font-black text-white italic">108</span>
             </button>
             <button onClick={() => window.open('tel:102')} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Pregnancy Help</span>
                <span className="text-xl font-black text-white italic">102</span>
             </button>
          </div>

          {/* 🚑 TRAUMA & HOSPITALS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <Activity size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Nearby Hospitals</span>
              </div>
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{hospitals.length} Nodes</span>
            </div>

            <div className="grid gap-3">
              {hospitals.length > 0 ? hospitals.map((station, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-4"
                >
                   <div className="flex justify-between items-start">
                      <div className="flex-1">
                         <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[220px]">{station.name}</h4>
                         <p className="text-[9px] text-rose-500 font-bold uppercase mt-1.5 flex items-center gap-1.5">
                            <MapPin size={10} /> {station.dist} AWAY • Emergency Care Ready
                         </p>
                      </div>
                      <div className="px-2 py-1 bg-rose-500/20 border border-rose-500/30 rounded-md">
                         <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">24x7</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => window.open(`tel:${station.phone}`)} className="py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                         <Phone size={12} /> Call Hospital
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
                     {loading ? "Scanning Hospital Grid..." : "No hospitals found in 10km. Contact emergency services."}
                   </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
          <ShieldAlert size={16} className="text-gray-600 shrink-0" />
          <p className="text-[8px] text-gray-600 font-bold uppercase leading-relaxed tracking-widest">
            Kavach synchronizes with medical registries and Mapbox grids to prioritize trauma centers and pregnancy helplines.
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
