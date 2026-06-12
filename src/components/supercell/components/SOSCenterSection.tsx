import React from 'react';
import { Bell, Zap } from 'lucide-react';
import { WomenSafetyOPS } from '../WomenSafetyOPS';

export function SOSCenterSection() {
  return (
    <div className="h-full grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden">
        <div className="bg-red-50/50 border border-red-100 rounded-[2.5rem] p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/20">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-red-600">Critical Response Unit</h3>
              <p className="text-[8px] text-red-400 font-bold uppercase mt-1">Direct State Emergency Dispatch</p>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden">
          <WomenSafetyOPS />
        </div>
      </div>
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <div className="bg-[#0F172A] rounded-[2rem] p-6 text-white h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={80}/></div>
          <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-4">SOS Protocols</h4>
          <div className="space-y-4">
            {[
              "Priority 1: Life Threat Detection",
              "Priority 2: Protector Dispatch",
              "Priority 3: Police Linkage",
              "Priority 4: Legal Forensic Log"
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">{i+1}</div>
                <span className="text-[8px] font-bold uppercase text-white/60">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
