import React, { useState } from 'react';
import { UserPlus, Shield, CheckCircle2, XCircle, MapPin, Phone, Users, Search, Filter, ShieldAlert, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

interface NodesControlProps {
  pendingProtectors: any[];
  verifiedProtectors: any[];
  viewMode: string;
  onSelectPendingProtector?: (id: string) => void;
  onSelectVerifiedProtector?: (id: string) => void;
  selectedId?: string | null;
}

export function NodesControl({ 
  pendingProtectors, 
  verifiedProtectors, 
  viewMode,
  onSelectPendingProtector,
  onSelectVerifiedProtector,
  selectedId
}: NodesControlProps) {
  const [protectorTab, setProtectorTab] = useState<'QUEUE' | 'ACTIVE'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  const rejectProtector = async (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to revoke the operational status of ${p.name || 'this operative'}?`)) {
      return;
    }
    try { 
      const coll = p.originCollection || 'users';
      // 🛡️ REVERSION: Clear all verification flags when reverting to citizen
      await updateDoc(doc(db, coll, p.id), { 
        role: 'citizen', 
        isVerified: false,
        verified: false 
      }); 
      toast.success("OPERATIVE REVERTED TO CITIZEN"); 
    } catch (err) { 
      toast.error("ACTION FAILED"); 
    }
  };

  const currentList = protectorTab === 'QUEUE' ? pendingProtectors : verifiedProtectors;
  
  const filteredList = currentList.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className={cn(
      "bg-[#1E293B]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all h-full", 
      viewMode === 'PROTECTORS' ? "flex-1" : "flex-[1.2]"
    )}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white italic leading-none">Nodes Control</h3>
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1.5 opacity-60">Operative Grid</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text" 
            placeholder="SEARCH OPERATIVE..." 
            className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black uppercase text-white tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-600" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 pt-4 pb-2 gap-2">
        <button 
           onClick={() => setProtectorTab('ACTIVE')} 
           className={cn(
             "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black rounded-2xl transition-all border cursor-pointer", 
             protectorTab === 'ACTIVE' 
               ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20" 
               : "bg-[#0F172A] text-slate-400 border-white/5 hover:bg-white/5"
           )}
        >
           ACTIVE NODES
           <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black", protectorTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-white/5 text-slate-500")}>{verifiedProtectors.length}</span>
        </button>
        <button 
           onClick={() => setProtectorTab('QUEUE')} 
           className={cn(
             "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black rounded-2xl transition-all border cursor-pointer", 
             protectorTab === 'QUEUE' 
               ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
               : "bg-[#0F172A] text-slate-400 border-white/5 hover:bg-white/5"
           )}
        >
           PENDING QUEUE
           <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black", protectorTab === 'QUEUE' ? "bg-white/20 text-white" : "bg-white/5 text-slate-500")}>{pendingProtectors.length}</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3 py-4 custom-scrollbar bg-[#0F172A]/20">
        {filteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2 py-12">
             <UserPlus size={40} className="text-white" />
             <p className="text-[10px] font-black uppercase tracking-widest text-center text-white">No Operatives Found</p>
          </div>
        ) : filteredList.map(p => {
          const isSelected = selectedId === p.id;
          const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].includes(p.protectorVetting?.occupation);
          return (
            <div 
              key={p.id} 
              onClick={() => {
                if (protectorTab === 'ACTIVE') {
                  onSelectVerifiedProtector?.(p.id);
                } else {
                  onSelectPendingProtector?.(p.id);
                }
              }}
              className={cn(
                "group relative bg-[#1E293B]/50 border rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer",
                isSelected ? "border-blue-500/40 bg-blue-600/5" : "border-white/5 hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl border border-white/10 shadow-sm overflow-hidden bg-[#0F172A] flex items-center justify-center">
                    <img 
                      src={p.photoUrl || p.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`;
                      }}
                    />
                  </div>
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1E293B] flex items-center justify-center shadow-sm", protectorTab === 'ACTIVE' ? "bg-emerald-500" : "bg-amber-500")}>
                     {protectorTab === 'ACTIVE' ? <CheckCircle2 size={9} className="text-white" /> : <Shield size={9} className="text-white" />}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                     <p className="text-[11px] font-black text-white leading-none uppercase truncate group-hover:text-blue-400 transition-colors">{p.name || "Unknown Operative"}</p>
                     {protectorTab === 'QUEUE' && isElite && (
                        <span className="text-[7px] font-black bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full uppercase border border-amber-500/20 shrink-0">Elite Desk</span>
                     )}
                  </div>
                  
                  {/* Identity Matrix */}
                  <div className={cn(
                     "grid grid-cols-1 gap-1 mt-2 p-2.5 rounded-xl border transition-all text-[8px] font-bold",
                     isElite 
                       ? "border-amber-500/20 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-300" 
                       : "border-white/[0.03] bg-white/[0.01] text-slate-300"
                  )}>
                     <div className="flex items-center justify-between">
                        <span className="text-slate-500 uppercase tracking-widest text-[7px]">Occupation:</span>
                        <span className={cn(
                           "font-black uppercase px-1.5 py-0.5 rounded text-[7px]",
                           isElite ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                           {p.protectorVetting?.occupation || "GENERAL OPERATIVE"}
                        </span>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                     <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                        <MapPin size={10} className="text-rose-500/70" />
                        {typeof (p.city || p.location) === 'string' ? (p.city || p.location) : (p.location?.latitude ? `${p.location.latitude.toFixed(2)}, ${p.location.longitude.toFixed(2)}` : "Region")}
                     </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0 ml-4">
                {protectorTab === 'QUEUE' ? (
                  <button 
                    onClick={() => onSelectPendingProtector?.(p.id)} 
                    className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5 animate-pulse"
                    title="Open Vetting Desk"
                  >
                    <Eye size={12} />
                    <span className="text-[7.5px] font-black uppercase tracking-widest">Vet</span>
                  </button>
                ) : (
                  <button 
                    onClick={(e) => rejectProtector(p, e)} 
                    className="p-2 bg-white/5 text-slate-400 border border-white/5 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90 flex items-center gap-1.5 group/btn"
                    title="Revoke Operational Status"
                  >
                    <ShieldAlert size={12} />
                    <span className="text-[7.5px] font-black uppercase tracking-widest hidden group-hover/btn:block">Revoke</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/10">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Security Grid v4.0</span>
        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Kavach National HQ</span>
      </div>
    </div>
  );
}
