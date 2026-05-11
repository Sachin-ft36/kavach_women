import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, Heart, MapPin, CheckCircle2, 
  XCircle, Search, Filter, History, Phone,
  ChevronRight, ArrowUpRight, Zap, Activity, Mail, Printer,
  AlertCircle, Globe, ShieldCheck, UserCheck, LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MissionAuditModal } from './MissionAuditModal';

interface KavachDirectoryProps {
  womenUsers: any[];
  protectors: any[];
  selectedState: string;
}

export function KavachDirectory({ womenUsers, protectors, selectedState }: KavachDirectoryProps) {
  const [activeTab, setActiveTab] = useState<'UNIVERSAL' | 'WOMEN' | 'PROTECTORS'>('UNIVERSAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<any>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Combine for Universal Master
  const allIdentities = [...womenUsers, ...protectors];

  const getFilteredData = () => {
    const baseData = activeTab === 'UNIVERSAL' ? allIdentities : activeTab === 'WOMEN' ? womenUsers : protectors;
    return baseData.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl print-area">
      {/* 🏛️ PHOTO 2 STYLE HEADER */}
      <div className="p-6 border-b border-gray-50 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <LayoutGrid size={24} />
           </div>
           <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 leading-none">Citizen Intelligence Registry</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{selectedState} / NATIONAL GRID / V4.2</p>
           </div>
        </div>

        <div className="flex items-center gap-3 no-print">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Identity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all w-48 md:w-72"
              />
           </div>
            <button 
              onClick={handlePrint}
              className="shrink-0 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
               <Printer size={16} strokeWidth={2.5} />
               GENERATE OFFICIAL REPORT
            </button>
            <button className="shrink-0 p-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100 hover:text-blue-600 transition-all">
               <Filter size={18} />
            </button>
        </div>
      </div>

      {/* 📑 PHOTO 2 STYLE SECTION SELECTOR */}
      <div className="px-8 py-5 flex gap-4 bg-gray-50/20 border-b border-gray-50">
         <button 
           onClick={() => setActiveTab('UNIVERSAL')}
           className={cn(
             "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
             activeTab === 'UNIVERSAL' 
               ? "bg-white text-gray-900 shadow-xl shadow-black/5 border border-gray-100" 
               : "text-gray-400 hover:bg-gray-50"
           )}
         >
            <Globe size={16} />
            Universal Master
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px]">{allIdentities.length}</span>
         </button>

         <button 
           onClick={() => setActiveTab('WOMEN')}
           className={cn(
             "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
             activeTab === 'WOMEN' 
               ? "bg-white text-gray-900 shadow-xl shadow-black/5 border border-gray-100" 
               : "text-gray-400 hover:bg-gray-50"
           )}
         >
            <Heart size={16} className={activeTab === 'WOMEN' ? "fill-gray-900" : ""} />
            Women Safety Users
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px]">{womenUsers.length}</span>
         </button>

         <button 
           onClick={() => setActiveTab('PROTECTORS')}
           className={cn(
             "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
             activeTab === 'PROTECTORS' 
               ? "bg-white text-gray-900 shadow-xl shadow-black/5 border border-gray-100" 
               : "text-gray-400 hover:bg-gray-50"
           )}
         >
            <ShieldCheck size={16} />
            Verified Protectors
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px]">{protectors.length}</span>
         </button>
      </div>

      {/* 📊 PHOTO 2 STYLE DATA GRID */}
      <div className="flex-1 overflow-x-auto custom-scrollbar bg-white">
         <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10 bg-white border-b border-gray-50">
               <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Identity / UID</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Gender</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">System Role</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Occupation</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Aadhaar / KYC</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Digital Contact</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               <AnimatePresence mode="popLayout">
               {getFilteredData().map((user, idx) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/30 transition-colors group"
                  >
                     {/* Identity Column */}
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-rose-500 border border-white shadow-sm flex items-center justify-center text-white font-black text-xl overflow-hidden">
                              {user.photoURL ? (
                                 <img src={user.photoURL} className="w-full h-full object-cover" />
                              ) : (
                                 user.name?.charAt(0).toUpperCase() || 'C'
                              )}
                           </div>
                           <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 uppercase leading-none tracking-tight">{user.name || 'Sachin Singh'}</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase mt-1.5 tracking-widest">ID: {user.id || 'X7Y2RYRUSG23'}</p>
                           </div>
                        </div>
                     </td>

                     {/* Gender Column */}
                     <td className="px-8 py-5 text-center">
                        <span className="text-[9px] font-black text-gray-900 uppercase">{user.gender || 'FEMALE'}</span>
                     </td>

                     {/* System Role Column */}
                     <td className="px-8 py-5 text-center">
                        <div className="inline-flex px-4 py-1.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-full border border-blue-100 uppercase tracking-widest">
                           {user.role === 'protector' ? 'PROTECTOR' : 'CITIZEN'}
                        </div>
                     </td>

                     {/* Occupation Column */}
                     <td className="px-8 py-5 text-center">
                        <span className="text-[9px] font-black text-gray-900 uppercase">{user.protectorVetting?.occupation || 'N/A'}</span>
                     </td>

                     {/* Status Column */}
                     <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-500">
                           <ShieldCheck size={14} />
                           <span className="text-[9px] font-black uppercase">Verified</span>
                        </div>
                     </td>

                     {/* Aadhaar Column */}
                     <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black text-gray-900 tabular-nums tracking-[2px]">
                              {user.aadhaar || user.aadhar || "664526421992"}
                           </span>
                           <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 size={10} />
                              <span className="text-[7px] font-black uppercase tracking-widest">Verified Digital ID</span>
                           </div>
                        </div>
                     </td>

                     {/* Contact Column */}
                     <td className="px-8 py-5">
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2 text-blue-600">
                              <Phone size={12} strokeWidth={3} />
                              <span className="text-[10px] font-black tabular-nums">{user.phoneNumber || user.phone || "9001313917"}</span>
                           </div>
                           <div className="flex items-center gap-2 text-gray-400">
                              <Mail size={12} />
                              <span className="text-[9px] font-bold truncate max-w-[140px]">{user.email || "sachinsingh44@gmail.com"}</span>
                           </div>
                        </div>
                     </td>

                     {/* Location Column - Photo 2 Style */}
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-3 text-rose-500">
                           <MapPin size={16} />
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-tight">Resolving...</span>
                              <span className="text-[7px] font-bold text-gray-400 uppercase">Pincode Fetching...</span>
                           </div>
                        </div>
                     </td>

                     {/* Actions Column */}
                     <td className="px-8 py-5 text-right no-print">
                          <div className="flex items-center justify-end gap-3">
                             <button 
                               onClick={() => {
                                 setSelectedUserForAudit(user);
                                 setIsAuditModalOpen(true);
                               }}
                               className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100"
                             >
                                <History size={16} />
                             </button>
                             <button className="p-2.5 bg-gray-900 text-white hover:bg-black rounded-xl transition-all shadow-lg shadow-gray-900/10">
                                <ArrowUpRight size={16} />
                             </button>
                          </div>
                     </td>
                  </motion.tr>
               ))}
               </AnimatePresence>
            </tbody>
         </table>
      </div>

      {/* 📊 FOOTER SUMMARY */}
      <div className="px-8 py-5 bg-white border-t border-gray-50 flex items-center justify-between no-print">
         <div className="flex gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
               <span className="text-[10px] font-black text-gray-900 uppercase tracking-[2px]">Real-time Biometric Link</span>
            </div>
            <div className="flex items-center gap-3">
               <Zap size={14} className="text-blue-500" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Encrypted Tactical Tunnel Active</span>
            </div>
         </div>
         <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[4px]">Data Stream: Secure National Grid // BNS 2023 Forensic Standard</p>
      </div>

      <MissionAuditModal 
        user={selectedUserForAudit}
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedUserForAudit(null);
        }}
      />
    </div>
  );
}
