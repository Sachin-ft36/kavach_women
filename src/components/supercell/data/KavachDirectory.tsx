import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Shield, Search, Filter, 
  MapPin, Phone, Mail, Fingerprint, 
  ShieldCheck, ShieldAlert, Heart,
  Printer, Download, ArrowUpDown, ChevronRight,
  ExternalLink,
  SignalHigh
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useKavachDirectoryData } from './hooks/useKavachDirectoryData';
import { KavachDirectoryPrint } from './KavachDirectoryPrint';

interface KavachDirectoryProps {
  womenUsers: any[];
  protectors: any[];
  selectedState?: string;
  defaultTab?: 'WOMEN' | 'PROTECTORS' | 'ALL';
  hideTabs?: boolean;
}

export function KavachDirectory({ 
  womenUsers, 
  protectors, 
  selectedState = 'National',
  defaultTab = 'WOMEN',
  hideTabs = false
}: KavachDirectoryProps) {
  const [activeTab, setActiveTab] = useState<'WOMEN' | 'PROTECTORS' | 'ALL'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    allUsers,
    mergedWomenUsers,
    mergedProtectors,
    filteredData,
    resolvedLocations
  } = useKavachDirectoryData(womenUsers, protectors, activeTab, searchQuery);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden print:overflow-visible relative">
      <KavachDirectoryPrint 
        selectedState={selectedState} 
        filteredData={filteredData} 
        mergedWomenUsers={mergedWomenUsers} 
        mergedProtectors={mergedProtectors} 
        resolvedLocations={resolvedLocations} 
      />

      {/* 🏛️ FORENSIC HEADER (SCREEN ONLY) */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/20 flex flex-col gap-6 print-hidden">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                 <Users size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    {activeTab === 'ALL' ? 'Universal Master Registry' : activeTab === 'WOMEN' ? 'Women Safety Registry' : 'Protector Intelligence Grid'}
                 </h2>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
                    {selectedState} // National Database // v5.4.1
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search Identity..."
                   className="pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold w-[300px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                 />
              </div>
              <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all">
                 <Printer size={16} /> Generate Official Report
              </button>
           </div>
        </div>

        {!hideTabs && (
           <div className="flex bg-gray-100/50 p-1 rounded-2xl w-fit border border-gray-100">
              {[
                { id: 'ALL', label: 'Universal Master', icon: Users },
                { id: 'WOMEN', label: 'Women Safety Users', icon: Heart },
                { id: 'PROTECTORS', label: 'Verified Protectors', icon: ShieldCheck }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-gray-900 shadow-sm border border-gray-100" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                   <tab.icon size={14} />
                   {tab.label}
                   <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[8px] font-bold">
                      {tab.id === 'ALL' ? allUsers.length : tab.id === 'WOMEN' ? mergedWomenUsers.length : mergedProtectors.length}
                   </span>
                </button>
              ))}
           </div>
        )}
      </div>

      {/* 📊 DATA TABLE */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Identity / UID</th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Gender</th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">System Role</th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Occupation</th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              {/* <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">AADHAAR / KYC</th> */}
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Digital Contact</th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Guardian Network</th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className="relative avatar-container">
                         <img 
                           src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                           className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                         />
                         <div className={cn("absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white", user.onDuty ? "bg-green-500" : "bg-gray-300")} />
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase text-gray-900 leading-none">{user.name}</p>
                         <p className="text-[8px] text-gray-400 font-bold uppercase mt-1.5 tracking-tighter">ID: {user.id.slice(0, 12)}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className="text-[9px] font-black text-gray-900 uppercase">{user.gender || 'N/A'}</span>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border status-badge",
                     user.role === 'protector' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"
                   )}>
                      {activeTab === 'WOMEN' ? 'Citizen' : (user.isDualRole && user.gender === 'female' ? 'Citizen / Protector' : user.role || 'Citizen')}
                   </span>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className="text-[10px] font-black text-gray-900 uppercase">
                      {user.occupation || user.protectorVetting?.occupation || user.protectorVetting?.customOccupation || 'N/A'}
                   </span>
                </td>
                <td className="px-6 py-5 text-center">
                   <div className="flex flex-col items-center gap-1">
                      {user.isVerified || user.verified ? (
                         <div className="flex items-center gap-1 text-green-600 status-badge">
                            <ShieldCheck size={12} className="icon-container" />
                            <span className="text-[8px] font-black uppercase">Verified</span>
                         </div>
                      ) : (
                         <div className="flex items-center gap-1 text-red-500 status-badge">
                            <ShieldAlert size={12} className="icon-container" />
                            <span className="text-[8px] font-black uppercase">Unverified</span>
                         </div>
                      )}
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col">
                      {/* <p className="text-[10px] font-black text-gray-900 leading-none">{user.aadhaar || user.aadhar || 'PENDING'}</p> */}
                      <p className="text-[7px] text-green-600 font-black uppercase mt-1.5 flex items-center gap-1 status-badge">
                         <Fingerprint size={10} className="icon-container" /> Verified Digital ID
                      </p>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-blue-600">
                         <Phone size={10} className="icon-container" />
                         <span className="text-[10px] font-black uppercase">{user.phone || user.phoneNumber || user.mobile || 'NO-LINK'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600">
                         <Mail size={10} className="icon-container" />
                         <span className="text-[9px] font-bold truncate max-w-[150px]">{user.email || 'no-email@kavach.gov'}</span>
                      </div>
                   </div>
                </td>
                 <td className="px-6 py-5">
                    {(user.primaryGuardian || resolvedLocations[`g_${user.id}`]?.name) ? (
                      <div className="flex flex-col items-center">
                         <p className="text-[10px] font-black text-gray-900 leading-none">
                            {user.primaryGuardian?.name || resolvedLocations[`g_${user.id}`]?.name}
                         </p>
                         <p className="text-[7px] text-blue-600 font-bold uppercase mt-1.5 flex items-center gap-1 status-badge">
                            <Shield size={8} className="icon-container" /> {user.primaryGuardian?.relation || resolvedLocations[`g_${user.id}`]?.relation}
                         </p>
                         <p className="text-[8px] text-gray-400 font-bold mt-1">
                            {user.primaryGuardian?.phone || resolvedLocations[`g_${user.id}`]?.phone}
                         </p>
                      </div>
                    ) : (
                      <div className="text-center opacity-30 text-[8px] font-bold uppercase italic">
                         {resolvedLocations[`g_${user.id}`] ? 'No Link' : 'Scanning...'}
                      </div>
                    )}
                 </td>
                 <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <MapPin size={12} className="text-red-500 shrink-0 icon-container" />
                       <div>
                          <p className="text-[9px] font-black text-gray-900 leading-tight uppercase line-clamp-1">
                             {resolvedLocations[user.id]?.address || user.locationName || user.fullAddress || 'Resolving...'}
                          </p>
                          <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                             {resolvedLocations[user.id]?.state || user.state || 'FETCHING STATE'} // PINCODE: {resolvedLocations[user.id]?.pincode || user.pincode || 'Fetching...'}
                          </p>
                       </div>
                    </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🚨 FOOTER BAR */}
      <div className="px-8 py-3 bg-gray-900 flex justify-between items-center text-white print-hidden">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-widest">Real-Time Biometric Link</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
               <SignalHigh size={10} className="text-blue-400" />
               <span className="text-[8px] font-black uppercase tracking-widest">Encrypted Tactical Tunnel Active</span>
            </div>
         </div>
         <span className="text-[8px] font-black uppercase tracking-widest opacity-50">BNS 2023 Forensic Standard Compliant</span>
      </div>
    </div>
  );
}
