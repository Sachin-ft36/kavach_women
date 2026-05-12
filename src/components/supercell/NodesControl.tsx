import React, { useState } from 'react';
import { UserPlus, Shield, CheckCircle2, XCircle, MapPin, Phone, Users, Search, Filter, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

interface NodesControlProps {
  pendingProtectors: any[];
  verifiedProtectors: any[];
  viewMode: string;
}

export function NodesControl({ pendingProtectors, verifiedProtectors, viewMode }: NodesControlProps) {
  const [protectorTab, setProtectorTab] = useState<'QUEUE' | 'ACTIVE'>('ACTIVE');

  const approveProtector = async (p: any) => {
    try { 
      const coll = p.originCollection || 'users';
      // 🛡️ SYNC FIX: Update both legacy and new verification fields
      await updateDoc(doc(db, coll, p.id), { 
        isVerified: true,
        verified: true 
      }); 
      toast.success("OPERATIVE VERIFIED"); 
    } catch (err) { 
      toast.error("VERIFICATION FAILED"); 
    }
  };

  const rejectProtector = async (p: any) => {
    try { 
      const coll = p.originCollection || 'users';
      // 🛡️ REVERSION: Clear all verification flags when reverting to citizen
      await updateDoc(doc(db, coll, p.id), { 
        role: 'citizen', 
        isVerified: false,
        verified: false 
      }); 
      toast.success("RECRUIT REVERTED TO CITIZEN"); 
    } catch (err) { 
      toast.error("ACTION FAILED"); 
    }
  };

  const currentList = protectorTab === 'QUEUE' ? pendingProtectors : verifiedProtectors;

  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-md border border-gray-100 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all", 
      viewMode === 'PROTECTORS' ? "flex-1" : "flex-[1.2]"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Users size={14} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1E293B]">Nodes Control</h3>
            <p className="text-[6px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Operative Recruitment Grid</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-lg border border-gray-100"><Search size={12}/></button>
           <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-lg border border-gray-100"><Filter size={12}/></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 pb-2 gap-2">
        <button 
           onClick={() => setProtectorTab('ACTIVE')} 
           className={cn(
             "flex-1 py-2.5 flex items-center justify-center gap-2 text-[8px] font-black rounded-2xl transition-all border shadow-sm", 
             protectorTab === 'ACTIVE' 
               ? "bg-green-600 text-white border-green-600 shadow-green-600/20" 
               : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
           )}
        >
           ACTIVE NODES
           <span className={cn("px-1.5 py-0.5 rounded-full text-[6px]", protectorTab === 'ACTIVE' ? "bg-white/20" : "bg-gray-100")}>{verifiedProtectors.length}</span>
        </button>
        <button 
           onClick={() => setProtectorTab('QUEUE')} 
           className={cn(
             "flex-1 py-2.5 flex items-center justify-center gap-2 text-[8px] font-black rounded-2xl transition-all border shadow-sm", 
             protectorTab === 'QUEUE' 
               ? "bg-blue-600 text-white border-blue-600 shadow-blue-600/20" 
               : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
           )}
        >
           PENDING QUEUE
           <span className={cn("px-1.5 py-0.5 rounded-full text-[6px]", protectorTab === 'QUEUE' ? "bg-white/20" : "bg-gray-100")}>{pendingProtectors.length}</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 py-4 custom-scrollbar bg-gray-50/20">
        {currentList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2 py-10">
             <UserPlus size={40} />
             <p className="text-[9px] font-black uppercase tracking-widest text-center">No Operatives In System</p>
          </div>
        ) : currentList.map(p => (
          <div key={p.id} className="group relative bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-gray-50 shrink-0">
                  <img src={p.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} className="w-full h-full object-cover" />
                </div>
                <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm", protectorTab === 'ACTIVE' ? "bg-green-500" : "bg-orange-500")}>
                   {protectorTab === 'ACTIVE' ? <CheckCircle2 size={8} className="text-white" /> : <Shield size={8} className="text-white" />}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-[#1E293B] leading-none uppercase truncate group-hover:text-blue-600 transition-colors">{p.name || "Unknown Operative"}</p>
                   {protectorTab === 'QUEUE' && (
                      <span className="text-[6px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full uppercase border border-orange-200">Pre-Verified</span>
                   )}
                </div>
                
                {/* Identity Matrix - Aadhaar, Phone, Email */}
                <div className={cn(
                   "grid grid-cols-1 gap-1 mt-2 bg-gray-50/50 p-2 rounded-xl border transition-all",
                   ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].includes(p.protectorVetting?.occupation) 
                     ? "border-amber-200 bg-amber-50/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                     : "border-gray-100/50"
                )}>
                   <div className="flex items-center justify-between text-[7px] font-bold">
                      <span className="text-gray-400 uppercase tracking-tighter">Aadhaar:</span>
                      <span className="text-gray-900 font-black">{p.aadhaar || p.aadhar || "NOT-LINKED"}</span>
                   </div>
                   <div className="flex items-center justify-between text-[7px] font-bold">
                      <span className="text-gray-400 uppercase tracking-tighter">Occupation:</span>
                      <span className={cn(
                         "font-black uppercase px-1.5 py-0.5 rounded text-[6px]",
                         ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].includes(p.protectorVetting?.occupation)
                           ? "bg-amber-100 text-amber-700"
                           : "text-blue-600"
                      )}>
                         {p.protectorVetting?.occupation || "GENERAL OPERATIVE"}
                      </span>
                   </div>
                   {p.protectorVetting?.reason && (
                      <div className="mt-1 pt-1 border-t border-gray-100/50 italic text-[6px] text-gray-400 font-bold line-clamp-2">
                         "{p.protectorVetting.reason}"
                      </div>
                   )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                   <p className="text-[7px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                      <MapPin size={8} className="text-red-500/50" />
                      {typeof (p.city || p.location) === 'string' ? (p.city || p.location) : (p.location?.latitude ? `${p.location.latitude.toFixed(2)}, ${p.location.longitude.toFixed(2)}` : "Region")}
                   </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0 ml-4">
              {protectorTab === 'QUEUE' ? (
                <>
                  <button 
                    onClick={() => approveProtector(p)} 
                    className="p-2 bg-green-50 text-green-600 border border-green-100 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                    title="Verify Operative"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button 
                    onClick={() => rejectProtector(p)} 
                    className="p-2 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                    title="Remove Recruite"
                  >
                    <XCircle size={14} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => rejectProtector(p)} 
                  className="p-2 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-90 flex items-center gap-2 group/btn"
                  title="Revoke Operational Status"
                >
                  <ShieldAlert size={14} />
                  <span className="text-[7px] font-black uppercase tracking-widest hidden group-hover/btn:block">Revoke</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
        <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Security Grid v4.0</span>
        <button className="text-[8px] font-black text-blue-600 uppercase hover:underline tracking-widest">Global Node Directory</button>
      </div>
    </div>
  );
}
