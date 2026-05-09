import React from 'react';
import { FileText, Clock, MapPin, ChevronRight, Gavel, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DataJusticeLedgerProps {
  zeroFirs: any[];
  onViewFir: (fir: any) => void;
}

export function DataJusticeLedger({ zeroFirs, onViewFir }: DataJusticeLedgerProps) {
  const aggregatedFirs = React.useMemo(() => {
    const groups: { [key: string]: any } = {};
    zeroFirs.forEach(fir => {
      const key = fir.userName || fir.uid || fir.id;
      if (!groups[key]) {
        groups[key] = {
          ...fir,
          count: 1,
          reports: [fir]
        };
      } else {
        groups[key].count += 1;
        groups[key].reports.push(fir);
      }
    });
    return Object.values(groups);
  }, [zeroFirs]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-blue-600/5 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Gavel size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 leading-none">National Justice Registry</h2>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Aggregated Victim Intelligence Hub</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase">
          {aggregatedFirs.length} Active Victims
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {aggregatedFirs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
             <FileText size={48} />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No Intelligence Records Found</p>
          </div>
        ) : aggregatedFirs.map((fir: any) => {
          const firDate = fir.timestamp ? new Date(fir.timestamp.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Live";
          const locString = typeof (fir.locationName || fir.location) === 'string' 
            ? (fir.locationName || fir.location) 
            : (fir.location?.latitude ? `${fir.location.latitude.toFixed(2)}, ${fir.location.longitude.toFixed(2)}` : "Sector Identified");

          return (
            <div key={fir.id} className="group bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                       <img src={fir.userPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${fir.userName}`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 leading-none mb-1">{fir.userName || "Unknown Citizen"}</h3>
                       <div className="flex items-center gap-2">
                          <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                             Reports Filed: {fir.count}
                          </span>
                          <span className="text-[7px] font-bold text-gray-400">{firDate}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    {fir.officialResponse ? (
                      <div className="px-2 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100 text-[6px] font-black uppercase tracking-widest flex items-center gap-1">
                         <CheckCircle2 size={10} /> Case Resolved
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 text-[6px] font-black uppercase tracking-widest flex items-center gap-1">
                         <Clock size={10} /> Under Audit
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                 <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-red-500" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Last Known Activity: <span className="text-gray-900">{locString}</span></span>
                 </div>
                 <button 
                   onClick={() => onViewFir(fir)}
                   className="px-6 py-2 bg-gray-900 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black transition-all flex items-center gap-2"
                 >
                    Inspect Dossier <ChevronRight size={12} />
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
