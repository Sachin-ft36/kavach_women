import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import VictimMap from '../components/maps/VictimMap';
import { Shield, MapPin, Activity, Phone, Car, Clock, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function TrackScreen() {
  const [id, setId] = useState<string | null>(null);
  const [rideData, setRideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const extractedId = path.split('/')[2];
    if (extractedId) setId(extractedId);
  }, []);

  useEffect(() => {
    if (!id) return;

    // 🛰️ REAL-TIME GUARDIAN UPLINK
    const unsub = onSnapshot(doc(db, 'active_rides', id), (doc) => {
      if (doc.exists()) {
        setRideData(doc.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[5px] text-gray-500 animate-pulse italic">Establishing Secure Neural Link...</p>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-accent-red/10 rounded-3xl flex items-center justify-center text-accent-red mb-8 border border-accent-red/20">
          <Shield size={40} />
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Session Terminated</h2>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px]">This tracking link is no longer active or verified.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 🛡️ HEADER: KAVACH GUARDIAN PORTAL */}
      <header className="bg-[#050505] p-6 pt-10 pb-10 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none"><Shield size={120} /></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
             <Shield className="text-accent-blue" size={24} />
          </div>
          <div>
             <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Guardian <span className="text-accent-blue">Link</span></h1>
             <p className="text-[8px] text-gray-500 font-black uppercase tracking-[3px] mt-1.5">National Strategic Command Node</p>
          </div>
        </div>
      </header>

      {/* 🗺️ LIVE TACTICAL MAP */}
      <main className="flex-1 p-4 -mt-6 space-y-4 relative z-20">
        <div className="bg-white rounded-[40px] overflow-hidden border border-[#E5E7EB] shadow-xl h-[450px] relative">
           <VictimMap customPos={[rideData.location.latitude, rideData.location.longitude]} />
           <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Live: {rideData.victimName}</span>
           </div>
        </div>

        {/* 📊 TELEMETRY GRID */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-[32px] border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                 <Car size={20} className="text-gray-400" />
                 <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
              </div>
              <h5 className="text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest">Vehicle No</h5>
              <p className="text-md font-black text-gray-900 uppercase italic tracking-tighter">{rideData.vehicleNo}</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                 <Activity size={20} className="text-accent-green" />
                 <span className="text-[8px] font-black text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Normal</span>
              </div>
              <h5 className="text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest">Status</h5>
              <p className="text-md font-black text-gray-900 uppercase italic tracking-tighter">On Route</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-[#E5E7EB] shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                 <Clock size={24} />
              </div>
              <div>
                 <h5 className="text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest">Last Update</h5>
                 <p className="text-sm font-black text-gray-900 uppercase">Synchronized Just Now</p>
              </div>
           </div>
        </div>

        <button 
          onClick={() => window.open('tel:100', '_self')}
          className="w-full py-6 bg-accent-red text-white rounded-[32px] text-xs font-black uppercase tracking-[3px] flex items-center justify-center gap-3 shadow-2xl shadow-accent-red/30 active:scale-95 transition-all"
        >
           <Phone size={18} /> Call National Emergency (100)
        </button>
      </main>

      <footer className="p-8 text-center">
         <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[4px] leading-relaxed">
           This session is monitored by KAVACH National Strategic Command. <br/>
           Access is restricted to authorized guardians only.
         </p>
      </footer>
    </div>
  );
}
