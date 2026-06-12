import React from 'react';
import { BookOpen, Heart, Shield } from 'lucide-react';

interface GuideCenterSectionProps {
  selectedState: string;
}

export function GuideCenterSection({ selectedState }: GuideCenterSectionProps) {
  return (
    <div className="h-full p-8 bg-white border border-gray-100 rounded-[2.5rem] overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-600/5 border border-amber-100">
            <BookOpen size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">National Guide Center</h2>
          <p className="text-xs text-gray-400 font-bold uppercase mt-2">Operational Guidelines for the {selectedState} Sector</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-purple-600 tracking-[0.2em] flex items-center gap-2">
              <Heart size={14} className="fill-purple-600" />
              For Women Safety
            </h3>
            <div className="bg-purple-50/30 border border-purple-100 rounded-3xl p-6 space-y-6">
              {[
                { t: "Emergency Trigger", d: "Instantly press the SOS button to alert all nearby protectors and SuperCell." },
                { t: "Guardian Link", d: "Ensure at least 2 guardians are linked for secondary alert redundancy." },
                { t: "Safe Passage", d: "Use the tactical radar to navigate through verified safe corridors." }
              ].map((g, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-purple-300 font-black text-xl leading-none">0{i+1}</div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-purple-900 mb-1">{g.t}</p>
                    <p className="text-[8px] font-bold text-purple-900/40 leading-relaxed uppercase">{g.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] flex items-center gap-2">
              <Shield size={14} className="fill-blue-600" />
              For Protectors
            </h3>
            <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-6 space-y-6">
              {[
                { t: "Rapid Response", d: "Acknowledge alerts within 30 seconds of broadcast for maximum efficiency." },
                { t: "On-Site Protocols", d: "Maintain absolute respect and provide tactical support until police arrival." },
                { t: "Node Maintenance", d: "Keep background permissions active for high-fidelity geospace tracking." }
              ].map((g, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-blue-300 font-black text-xl leading-none">0{i+1}</div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-900 mb-1">{g.t}</p>
                    <p className="text-[8px] font-bold text-blue-900/40 leading-relaxed uppercase">{g.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
