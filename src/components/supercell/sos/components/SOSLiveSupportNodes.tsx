import React from 'react';
import { Heart, Globe, Shield, MapPin, Phone } from 'lucide-react';

interface SOSLiveSupportNodesProps {
  victimData: any;
  guardians: any[];
  nearbyPolice: any[];
  nearbyHospitals: any[];
  loadingNodes: boolean;
}

export function SOSLiveSupportNodes({
  victimData,
  guardians,
  nearbyPolice,
  nearbyHospitals,
  loadingNodes
}: SOSLiveSupportNodesProps) {
  return (
    <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
      <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Heart size={10} className="text-rose-500" /> Support Nodes</p>
      <div className="space-y-2.5">
         {victimData?.primaryGuardian && (
            <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 ">
               <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-black text-white uppercase ">{victimData.primaryGuardian.name}</span>
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded-xl uppercase tracking-widest">Primary</span>
               </div>
               <span className="text-[13px] font-black text-rose-400 tabular-nums">{victimData.primaryGuardian.phone}</span>
            </div>
         )}
         {guardians.map((g: any) => (
            <div key={g.id} className="flex justify-between items-center bg-black/20 px-4 py-2 rounded-xl border border-white/5">
               <span className="text-[13px] font-black text-white uppercase ">{g.name}</span>
               <span className="text-[13px] font-black text-blue-400 tabular-nums">{g.phone || g.phoneNumber}</span>
            </div>
         ))}

         {/* 🚀 DYNAMIC EMERGENCY NODES (POLICE & HOSPITALS) */}
         {loadingNodes ? (
            <div className="py-2 text-center">
               <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Scanning Nearby Grid...</p>
            </div>
         ) : (
            (nearbyPolice.length > 0 || nearbyHospitals.length > 0) && (
               <div className="pt-3 border-t border-white/5 mt-3 space-y-2.5">
                  <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                     <Globe size={10} className="text-cyan-400" /> Nearby Emergency Nodes
                  </p>
                  
                  {/* POLICE STATIONS */}
                  {nearbyPolice.map((station: any, idx: number) => (
                     <div key={`police-${idx}`} className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                 <Shield size={8} className="text-blue-400 shrink-0" />
                                 <span className="text-[13px] font-black text-white uppercase leading-none truncate block max-w-[140px]">{station.name}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-none truncate block max-w-[160px]">{station.address}</p>
                           </div>
                           <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[5px] font-black rounded uppercase tracking-widest scale-90 shrink-0">POLICE</span>
                        </div>
                        <div className="flex gap-1.5">
                           <button onClick={() => window.open(`tel:${station.phone || '112'}`)} className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                              <Phone size={8} /> Call
                           </button>
                           <button onClick={() => {
                              const dest = (station.lat && station.lng) ? `${station.lat},${station.lng}` : encodeURIComponent(station.name);
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                           }} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                              <MapPin size={8} /> Navigate
                           </button>
                        </div>
                     </div>
                  ))}

                  {/* HOSPITALS */}
                  {nearbyHospitals.map((hospital: any, idx: number) => (
                     <div key={`hospital-${idx}`} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                 <Heart size={8} className="text-emerald-400 shrink-0" />
                                 <span className="text-[13px] font-black text-white uppercase leading-none truncate block max-w-[140px]">{hospital.name}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-none truncate block max-w-[160px]">{hospital.address}</p>
                           </div>
                           <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[5px] font-black rounded uppercase tracking-widest scale-90 shrink-0">TRAUMA</span>
                        </div>
                        <div className="flex gap-1.5">
                           <button onClick={() => window.open(`tel:${hospital.phone || '108'}`)} className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                              <Phone size={8} /> Call
                           </button>
                           <button onClick={() => {
                              const dest = (hospital.lat && hospital.lng) ? `${hospital.lat},${hospital.lng}` : encodeURIComponent(hospital.name);
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                           }} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                              <MapPin size={8} /> Navigate
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )
         )}
      </div>
    </div>
  );
}
