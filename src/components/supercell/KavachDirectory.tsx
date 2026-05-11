import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, Heart, MapPin, CheckCircle2, 
  XCircle, Search, Filter, History, Phone,
  ArrowUpRight, Zap, Activity, Mail, Printer,
  Globe, ShieldCheck, LayoutGrid, AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MissionAuditModal } from './MissionAuditModal';

interface KavachDirectoryProps {
  womenUsers: any[];
  protectors: any[];
  selectedState: string;
  activeAlerts?: any[];
  isSovereignActive?: boolean;
}

// 📡 ENHANCED ADDRESS RESOLVER WITH LIVE SOS LINKING
function AddressCell({ user, activeAlerts = [] }: { user: any, activeAlerts?: any[] }) {
  // 🛰️ CHECK FOR LIVE SOS LINK
  const activeAlert = activeAlerts.find(a => a.userId === user.id || a.id === user.id);
  
  // Prioritize SOS coordinates if active
  const lat = activeAlert ? (activeAlert.latitude || activeAlert.lat) : (user.latitude || user.lat || user.lastLat || user.currentLat);
  const lng = activeAlert ? (activeAlert.longitude || activeAlert.lng) : (user.longitude || user.lng || user.lastLng || user.currentLng || user.long);
  
  const [address, setAddress] = useState<string>(activeAlert?.locationName || activeAlert?.address || user.city || user.address || 'Sector Unknown');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have an active alert with an address already, use it immediately
    if (activeAlert && (activeAlert.locationName || activeAlert.address)) {
        setAddress(activeAlert.locationName || activeAlert.address);
        return;
    }

    if (!lat || !lng) return;
    
    const fetchAddr = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      } catch (e) {
        console.error("Directory Address Sync Failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAddr();
  }, [lat, lng, activeAlert]);

  return (
    <div className="flex items-center gap-3">
       <div className={cn(
         "w-8 h-8 rounded-full flex items-center justify-center transition-all relative",
         activeAlert ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40" : (lat && lng) ? "bg-rose-500/10 text-rose-500" : "bg-gray-100 text-gray-400"
       )}>
          {activeAlert ? <AlertTriangle size={14} className="animate-pulse" /> : <MapPin size={14} className={(lat && lng) ? "animate-bounce" : ""} />}
          {activeAlert && (
            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />
          )}
       </div>
       <div className="flex flex-col max-w-[220px]">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-tight leading-tight italic",
            activeAlert ? "text-rose-600 underline decoration-rose-600/30" : "text-rose-500"
          )}>
            {loading ? "Neural Mapping..." : address}
          </span>
          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {activeAlert ? "LIVE SOS LOCATION LINKED" : (lat && lng) ? "Verified Precision Signal" : "Registered Home Sector"}
          </span>
       </div>
    </div>
  );
}

export function KavachDirectory({ womenUsers, protectors, selectedState, activeAlerts = [], isSovereignActive }: KavachDirectoryProps) {
  const [activeTab, setActiveTab] = useState<'UNIVERSAL' | 'WOMEN' | 'PROTECTORS'>('UNIVERSAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<any>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const allIdentities = [...womenUsers, ...protectors];

  const getFilteredData = () => {
    const baseData = activeTab === 'UNIVERSAL' ? allIdentities : activeTab === 'WOMEN' ? womenUsers : protectors;
    return baseData.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.aadhaar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.aadhar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl print-area font-['Outfit']">
      <div className="p-6 border-b border-gray-50 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <LayoutGrid size={24} />
           </div>
           <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 leading-none italic">Citizen Intelligence Registry</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{selectedState} / NATIONAL GRID / V5.5</p>
           </div>
        </div>

        <div className="flex items-center gap-3 no-print">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Identity/Aadhaar/Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all w-48 md:w-72"
              />
           </div>
            <button onClick={() => window.print()} className="shrink-0 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
               <Printer size={16} strokeWidth={2.5} />
               GENERATE REPORT
            </button>
        </div>
      </div>

      <div className="px-8 py-5 flex gap-4 bg-gray-50/20 border-b border-gray-50 overflow-x-auto custom-scrollbar no-print">
         <button onClick={() => setActiveTab('UNIVERSAL')} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shrink-0", activeTab === 'UNIVERSAL' ? "bg-white text-gray-900 shadow-xl shadow-black/5 border border-gray-100" : "text-gray-400 hover:bg-gray-50")}><Globe size={16} /> Universal Master <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px]">{allIdentities.length}</span></button>
         <button onClick={() => setActiveTab('WOMEN')} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shrink-0", activeTab === 'WOMEN' ? "bg-white text-gray-900 shadow-xl shadow-black/5 border border-gray-100" : "text-gray-400 hover:bg-gray-50")}><Heart size={16} className={activeTab === 'WOMEN' ? "fill-gray-900" : ""} /> Women Safety <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px]">{womenUsers.length}</span></button>
         <button onClick={() => setActiveTab('PROTECTORS')} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shrink-0", activeTab === 'PROTECTORS' ? "bg-white text-gray-900 shadow-xl shadow-black/5 border border-gray-100" : "text-gray-400 hover:bg-gray-50")}><ShieldCheck size={16} /> Verified Protectors <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px]">{protectors.length}</span></button>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar bg-white">
         <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10 bg-white border-b border-gray-50">
               <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Identity / UID</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Gender</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Role</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Occupation</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Aadhaar / Digital ID</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Digital Contact</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tactical Location</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               <AnimatePresence mode="popLayout">
               {getFilteredData().map((user) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50/30 transition-colors group">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-500 border border-white shadow-sm flex items-center justify-center text-white font-black text-xl overflow-hidden">{user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : (user.name?.charAt(0).toUpperCase() || 'C')}</div>
                           <div className="min-w-0"><p className="text-xs font-black text-gray-900 uppercase leading-none tracking-tight italic">{user.name || 'Anonymous citizen'}</p><p className="text-[8px] text-gray-400 font-bold uppercase mt-1.5 tracking-widest">ID: {user.id?.slice(0,12)}...</p></div>
                        </div>
                     </td>
                     <td className="px-8 py-5 text-center"><span className="text-[9px] font-black text-gray-900 uppercase">{user.gender || 'FEMALE'}</span></td>
                     <td className="px-8 py-5 text-center"><div className="inline-flex px-4 py-1.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-full border border-blue-100 uppercase tracking-widest">{user.role === 'protector' ? 'PROTECTOR' : 'CITIZEN'}</div></td>
                     <td className="px-8 py-5 text-center"><span className="text-[9px] font-black text-gray-900 uppercase">{user.protectorVetting?.occupation || 'N/A'}</span></td>
                     <td className="px-8 py-5 text-center">
                        {user.isVerified ? (
                           <div className="flex items-center justify-center gap-2 text-emerald-500">
                              <ShieldCheck size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                           </div>
                        ) : (
                           <div className="flex items-center justify-center gap-2 text-gray-400">
                              <ShieldAlert size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Pending</span>
                           </div>
                        )}
                     </td>
                     <td className="px-8 py-5"><div className="flex flex-col gap-1"><span className="text-[10px] font-black text-gray-900 tabular-nums tracking-[2px]">{user.aadhaar || user.aadhar || "DATA_NOT_SYNCED"}</span><div className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={10} /><span className="text-[7px] font-black uppercase tracking-widest">Full Forensic ID</span></div></div></td>
                     <td className="px-8 py-5"><div className="flex flex-col gap-2"><div className="flex items-center gap-2 text-blue-600"><Phone size={12} strokeWidth={3} /><span className="text-[10px] font-black tabular-nums">{user.phoneNumber || user.phone || "NO_PHONE_RECORD"}</span></div><div className="flex items-center gap-2 text-gray-400"><Mail size={12} /><span className="text-[9px] font-bold truncate max-w-[140px]">{user.email || "N/A"}</span></div></div></td>
                     <td className="px-8 py-5"><AddressCell user={user} activeAlerts={activeAlerts} /></td>
                     <td className="px-8 py-5 text-right no-print"><div className="flex items-center justify-end gap-3"><button onClick={() => { setSelectedUserForAudit(user); setIsAuditModalOpen(true); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100"><History size={16} /></button><button className="p-2.5 bg-gray-900 text-white hover:bg-black rounded-xl transition-all shadow-lg shadow-gray-900/10"><ArrowUpRight size={16} /></button></div></td>
                  </motion.tr>
               ))}
               </AnimatePresence>
            </tbody>
         </table>
      </div>

      <div className="px-8 py-5 bg-white border-t border-gray-50 flex items-center justify-between no-print">
         <div className="flex gap-10"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" /><span className="text-[10px] font-black text-gray-900 uppercase tracking-[2px]">National Grid Sync Active</span></div></div>
         <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[4px]">Sovereign Intelligence Standard V5.5</p>
      </div>

      <MissionAuditModal user={selectedUserForAudit} isOpen={isAuditModalOpen} onClose={() => { setIsAuditModalOpen(false); setSelectedUserForAudit(null); }} />
    </div>
  );
}
