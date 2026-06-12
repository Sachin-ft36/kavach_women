import React from 'react';
import { Shield, User } from 'lucide-react';

interface SOSLiveRespondersProps {
  selectedAlert: any;
}

export function SOSLiveResponders({ selectedAlert }: SOSLiveRespondersProps) {
  return (
    <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
      <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
         <Shield size={10} className="text-blue-500" /> Active Tactical Responders
      </p>
      <div className="space-y-2.5">
         {selectedAlert?.activeResponders?.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i).map((responder: any) => (
            <div key={responder.uid} className="flex justify-between items-center bg-blue-500/5 px-4 py-2.5 rounded-xl border border-blue-500/10 ">
               <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                     {responder.photo ? (
                        <img src={responder.photo} className="w-full h-full object-cover" />
                     ) : (
                        <User size={10} className="text-blue-400" />
                     )}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[13px] font-black text-white uppercase leading-none">{responder.name}</span>
                     <span className="text-[5px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Intercepting</span>
                  </div>
               </div>
               <span className="text-[13px] font-black text-blue-400 tabular-nums">{responder.phone}</span>
            </div>
         ))}
         {(!selectedAlert?.activeResponders || selectedAlert.activeResponders.length === 0) && (
            <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest text-center py-2">Scanning for nearest protectors...</p>
         )}
      </div>
    </div>
  );
}
