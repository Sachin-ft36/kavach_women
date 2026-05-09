import React from 'react';
import { FileText, Clock, Shield, MapPin, ChevronRight, Gavel, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface JusticeLedgerProps {
  zeroFirs: any[];
  viewMode: string;
  onViewFir: (fir: any) => void;
}

export function JusticeLedger({ zeroFirs, viewMode, onViewFir }: JusticeLedgerProps) {
  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-md border border-gray-100 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all", 
      viewMode === 'JUSTICE' ? "flex-1" : "flex-1"
    )}>
      {/* 🏛️ NATIONAL JUSTICE HEADER */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-700/20">
            <Gavel size={14} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">Justice Ledger</h3>
            <p className="text-[6px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">National Zero FIR Network</p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-[6px] font-black text-blue-600 uppercase tracking-widest">{zeroFirs.length} Reports</span>
           </div>
        </div>
      </div>

      {/* 📋 REPORTS FEED */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 py-4 custom-scrollbar bg-gray-50/20">
        {zeroFirs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2 py-10">
             <FileText size={40} />
             <p className="text-[9px] font-black uppercase tracking-widest text-center">Zero Active Reports</p>
          </div>
        ) : zeroFirs.map(fir => {
          const firDate = fir.timestamp ? new Date(fir.timestamp.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Live";
          const locString = typeof (fir.locationName || fir.location) === 'string' 
            ? (fir.locationName || fir.location) 
            : (fir.location?.latitude ? `${fir.location.latitude.toFixed(2)}, ${fir.location.longitude.toFixed(2)}` : "Sector Identified");

          return (
            <div 
              key={fir.id} 
              className="group relative bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
            >
              {/* FIR Status Bar */}
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-1.5">
                   <span className="text-[7px] font-black text-[#1E293B] tracking-widest uppercase bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">FIR-2025-{fir.id.slice(0, 6).toUpperCase()}</span>
                   {fir.officialResponse ? (
                     <div className="flex items-center gap-1 bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">
                        <CheckCircle2 size={8} />
                        <span className="text-[5px] font-black uppercase tracking-widest">Responded</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-100">
                        <Clock size={8} />
                        <span className="text-[5px] font-black uppercase tracking-widest">Pending</span>
                     </div>
                   )}
                </div>
                <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[5px] font-black uppercase tracking-[0.1em] border border-red-100/50">Women Safety</span>
              </div>

              {/* Victim/Operative Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-gray-50 shrink-0">
                    <img src={fir.userPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${fir.userName}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                       <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none">{fir.userName || "Unknown Operative"}</p>
                       <div className="w-1 h-1 bg-gray-200 rounded-full" />
                       <span className="text-[6px] font-bold text-gray-400">{firDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-red-500/60" />
                      <p className="text-[9px] font-black text-[#0F172A] truncate leading-none uppercase tracking-tighter group-hover:text-blue-700 transition-colors">{locString}</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => onViewFir(fir)} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  View
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📊 LEDGER FOOTER */}
      <div className="p-3 border-t border-gray-50 flex items-center justify-center bg-gray-50/30">
        <button className="text-[8px] font-black text-blue-600 uppercase hover:underline tracking-[0.2em] flex items-center gap-2 group">
           <Shield size={10} />
           View Comprehensive Ledger
           <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
