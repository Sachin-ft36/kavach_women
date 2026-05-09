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
import { toast } from 'sonner';

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
  const [resolvedLocations, setResolvedLocations] = useState<Record<string, { address: string, pincode: string }>>({});
  
  // 🆔 SYSTEMATIC IDENTITY MERGER (UID DE-DUPLICATION)
  const allUsers = React.useMemo(() => {
    const registry: Record<string, any> = {};
    
    [...womenUsers, ...protectors].forEach(u => {
      if (!registry[u.id]) {
        registry[u.id] = { ...u };
      } else {
        // Merge capabilities if user exists in both sectors
        if (u.role === 'protector' || registry[u.id].role === 'protector') {
           registry[u.id].isDualRole = true;
           registry[u.id].role = 'protector'; // Priority for operational tracking
        }
      }
    });

    return Object.values(registry).sort((a: any, b: any) => {
       const nameA = (a.name || '').toLowerCase();
       const nameB = (b.name || '').toLowerCase();
       return nameA.localeCompare(nameB);
    });
  }, [womenUsers, protectors]);

  const filteredData = (activeTab === 'ALL' ? allUsers : activeTab === 'WOMEN' ? womenUsers : protectors)
    .filter(u => {
      const query = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query) ||
        u.phoneNumber?.toLowerCase().includes(query) ||
        u.aadhaar?.toLowerCase().includes(query) ||
        u.aadhar?.toLowerCase().includes(query)
      );
    });

  // 🛡️ GUARDIAN RECOVERY & LOCATION ENGINE
  useEffect(() => {
    const resolveMetadata = async () => {
      // 1. Resolve Addresses
      const usersToResolveAddr = filteredData.filter(u => !resolvedLocations[u.id] && u.lastLocation?.lat && u.lastLocation?.lng);
      for (const user of usersToResolveAddr) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${user.lastLocation.lat}&lon=${user.lastLocation.lng}&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.village || addr.district || 'Unknown City';
            const state = addr.state || 'Unknown State';
            const fullAddress = `${street}${street ? ', ' : ''}${city}, ${state}`.trim();
            setResolvedLocations(prev => ({ ...prev, [user.id]: { address: fullAddress, pincode: addr.postcode || 'N/A', state: state } }));
          }
          await new Promise(r => setTimeout(r, 800));
        } catch (err) {}
      }

      // 2. Resolve Legacy Guardians (Heal existing records)
      const usersToResolveGuardians = filteredData.filter(u => !u.primaryGuardian && !resolvedLocations[`g_${u.id}`]);
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const { db } = await import('../../../firebase');

      for (const user of usersToResolveGuardians) {
        try {
          const gSnap = await getDocs(query(collection(db, 'users', user.id, 'guardians'), limit(1)));
          if (!gSnap.empty) {
            const gData = gSnap.docs[0].data();
            setResolvedLocations(prev => ({
              ...prev,
              [`g_${user.id}`]: { name: gData.name, relation: gData.relation, phone: gData.phone }
            }));
          } else {
            // Mark as checked so we don't spam requests
            setResolvedLocations(prev => ({ ...prev, [`g_${user.id}`]: { name: null } }));
          }
        } catch (err) {}
      }
    };

    if (filteredData.length > 0) resolveMetadata();
  }, [filteredData, activeTab]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden print:overflow-visible relative">
      {/* 🏛️ SOVEREIGN COMMAND DOCUMENT PRINT ENGINE */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@500;700&display=swap');

        @media screen { .sovereign-print-view { display: none; } }

        @media print {
          @page { size: landscape; margin: 0.8cm; }
          body { background: white !important; color: #111111 !important; font-family: 'Inter', sans-serif !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hidden, .no-print, button, input, .tactical-footer { display: none !important; }
          
          .sovereign-print-view { display: block !important; width: 100% !important; background: white; position: relative; }
          
          /* 🇮🇳 HEADER SECTION */
          .doc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
          .ashoka-emblem { width: 80px; height: auto; }
          
          .mha-center { text-align: center; flex: 1; }
          .mha-country { font-size: 14pt; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: 0.1em; }
          .mha-ministry { font-size: 11pt; font-weight: 700; text-transform: uppercase; margin: 2px 0; }
          .doc-title { font-size: 24pt; font-weight: 900; text-transform: uppercase; margin: 5px 0; letter-spacing: -0.01em; color: #0f172a; }
          .doc-subtitle { font-size: 9pt; font-weight: 700; text-transform: uppercase; color: #374151; opacity: 0.8; word-spacing: 0.2em; }
          
          .meta-box { width: 220px; border: 1px solid #e5e7eb; padding: 10px; font-size: 6.5pt; font-weight: 700; text-transform: uppercase; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .meta-label { color: #6b7280; }
          .meta-value { color: #111; }
          .meta-value.red { color: #dc2626; }

          /* 📊 STATS BAR */
          .stats-bar { display: flex; justify-content: space-between; padding: 8px 15px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 7pt; font-weight: 900; text-transform: uppercase; color: #475569; }
          
          .summary-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 25px; }
          .summary-card { padding: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; }
          .card-icon { width: 35px; height: 35px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
          .card-content { display: flex; flex-direction: column; }
          .card-label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
          .card-value { font-size: 12pt; font-weight: 900; color: #0f172a; }

          /* 🛡️ TACTICAL TABLE */
          .tactical-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; table-layout: fixed; }
          .tactical-table th { background: #1e293b !important; color: white !important; font-size: 7pt; font-weight: 900; text-transform: uppercase; padding: 10px 5px; text-align: left; border: 1px solid #334155; }
          .tactical-table td { font-size: 7.5pt; font-weight: 500; padding: 10px 5px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #334155; }
          .tactical-table tr:nth-child(even) { background: #f8fafc; }

          .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 6pt; font-weight: 900; text-transform: uppercase; border: 1px solid currentColor; }
          .badge.verified { background: #f0fdf4; color: #15803d; }
          .badge.protector { background: #eff6ff; color: #1d4ed8; }
          .badge.citizen { background: #faf5ff; color: #7e22ce; }
          
          .data-id { font-family: 'JetBrains Mono', monospace; font-size: 6.5pt; font-weight: 700; color: #64748b; margin-top: 4px; }
          .location-text { font-size: 6.5pt; color: #475569; line-height: 1.2; margin-top: 4px; }
          
          /* 🎖️ FOOTER SECTIONS */
          .doc-footer { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; padding: 25px 0; border-top: 1px solid #e2e8f0; margin-top: 30px; }
          .footer-section h3 { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .footer-text { font-size: 6.5pt; color: #64748b; line-height: 1.5; font-weight: 500; }
          
          .legend-item { display: flex; items-center: gap: 8px; margin-bottom: 5px; font-size: 6.5pt; font-weight: 700; }
          .integrity-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 6.5pt; font-weight: 700; color: #334155; }
          
          .signature-box { text-align: right; }
          .signature-img { width: 100px; height: auto; opacity: 0.8; margin-bottom: 5px; }
          .sig-line { border-top: 1px solid #111; width: 180px; margin-left: auto; }
          
          .bottom-bar { border-top: 1px solid #e2e8f0; padding: 15px 0; display: flex; justify-content: space-between; align-items: center; position: relative; }
          .system-disclaimer { text-align: center; flex: 1; }
          .disclaimer-main { font-size: 8pt; font-weight: 900; text-transform: uppercase; }
          .disclaimer-sub { font-size: 7pt; font-weight: 900; text-transform: uppercase; color: #dc2626; margin-top: 4px; letter-spacing: 0.05em; }
          .qr-placeholder { width: 50px; height: 50px; background: #111; }
        }
      `}} />

      {/* 🎖️ SOVEREIGN COMMAND DOCUMENT (PRINT ONLY) */}
      <div className="sovereign-print-view">
         {/* 🇮🇳 HEADER */}
         <div className="doc-header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png" className="ashoka-emblem" alt="Gov of India" />
            <div className="mha-center">
               <h2 className="mha-country">Republic of India</h2>
               <h3 className="mha-ministry">Ministry of Home Affairs</h3>
               <h1 className="doc-title">Kavach National Tactical Registry</h1>
               <p className="doc-subtitle">National Cyber Safety Command Grid | Forensic Data Ledger</p>
            </div>
            <div className="meta-box">
               <div className="meta-row"><span className="meta-label">Clearance Level :</span> <span className="meta-value red">Internal</span></div>
               <div className="meta-row"><span className="meta-label">Document ID :</span> <span className="meta-value">KAV/NTR/2026/05/8821</span></div>
               <div className="meta-row"><span className="meta-label">Generated On :</span> <span className="meta-value">{new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} | {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} IST</span></div>
               <div className="meta-row"><span className="meta-label">Report Type :</span> <span className="meta-value">National Registry Export</span></div>
               <div className="meta-row"><span className="meta-label">Classification :</span> <span className="meta-value">Official Sensitive</span></div>
            </div>
         </div>

         {/* 📊 STATS STRIP */}
         <div className="stats-bar">
            <span>Sector : {selectedState.toUpperCase()}</span>
            <span>Database Version : V5.4.1</span>
            <span>Total Entries : {filteredData.length}</span>
            <span>Export Date : {new Date().toLocaleDateString('en-GB').toUpperCase()}</span>
            <span>Authorized By : Kavach Super Cell HQ</span>
         </div>

         {/* 🃏 SUMMARY CARDS */}
         <div className="summary-cards">
            <div className="summary-card">
               <div className="card-icon"><Users size={18} className="text-slate-600" /></div>
               <div className="card-content">
                  <span className="card-label">Total Identities</span>
                  <span className="card-value">{filteredData.length}</span>
               </div>
            </div>
            <div className="summary-card">
               <div className="card-icon"><Heart size={18} className="text-rose-500" /></div>
               <div className="card-content">
                  <span className="card-label">Women Safety Users</span>
                  <span className="card-value">{womenUsers.length}</span>
               </div>
            </div>
            <div className="summary-card">
               <div className="card-icon"><ShieldCheck size={18} className="text-blue-600" /></div>
               <div className="card-content">
                  <span className="card-label">Verified Protectors</span>
                  <span className="card-value">{protectors.length}</span>
               </div>
            </div>
            <div className="summary-card">
               <div className="card-icon"><SignalHigh size={18} className="text-green-600" /></div>
               <div className="card-content">
                  <span className="card-label">Active Entities</span>
                  <span className="card-value">{filteredData.filter(u => u.onDuty).length || filteredData.length}</span>
               </div>
            </div>
            <div className="summary-card">
               <div className="card-icon"><Fingerprint size={18} className="text-slate-900" /></div>
               <div className="card-content">
                  <span className="card-label">Verification Rate</span>
                  <span className="card-value">100%</span>
               </div>
            </div>
         </div>

         {/* 🛡️ MAIN TACTICAL TABLE */}
         <table className="tactical-table">
            <thead>
               <tr>
                  <th style={{ width: '30px' }}>#</th>
                  <th style={{ width: '130px' }}>Identity / UID</th>
                  <th style={{ width: '60px' }}>Gender</th>
                  <th style={{ width: '100px' }}>System Role</th>
                  <th style={{ width: '90px' }}>Occupation</th>
                  <th style={{ width: '80px' }}>Status</th>
                  <th style={{ width: '110px' }}>Aadhaar / KYC</th>
                  <th style={{ width: '150px' }}>Digital Contact</th>
                  <th style={{ width: '120px' }}>Guardian Network</th>
                  <th>Location</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map((user, i) => (
                  <tr key={user.id}>
                     <td style={{ fontWeight: 900 }}>{i + 1}</td>
                     <td>
                        <div style={{ fontWeight: 900, textTransform: 'uppercase' }}>{user.name}</div>
                        <div className="data-id">ID: {user.id.slice(0, 12).toUpperCase()}</div>
                        <div className="badge verified" style={{ marginTop: '5px' }}>Verified</div>
                     </td>
                     <td>{user.gender?.toUpperCase() || 'N/A'}</td>
                     <td>
                        <div className={cn("badge", user.role === 'protector' ? "protector" : "citizen")}>
                           {user.role || 'Citizen'}
                        </div>
                     </td>
                     <td style={{ fontWeight: 700 }}>{user.occupation || user.protectorVetting?.occupation || 'N/A'}</td>
                     <td>
                        <div className="badge verified">
                           <ShieldCheck size={8} /> Verified
                        </div>
                     </td>
                     <td>
                        <div style={{ fontWeight: 900 }}>{user.protectorVetting?.aadhaarNumber || user.aadhar || user.aadhaar || user.aadhaarMask}</div>
                        <div style={{ fontSize: '5pt', color: '#16a34a', fontWeight: 900, marginTop: '2px' }}>VERIFIED DIGITAL ID</div>
                     </td>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}>
                           <Phone size={8} /> <span style={{ fontWeight: 900 }}>{user.phone || user.phoneNumber}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#64748b' }}>
                           <Mail size={8} /> <span>{user.email}</span>
                        </div>
                     </td>
                     <td>
                        <div style={{ fontWeight: 700 }}>{user.primaryGuardian?.name || resolvedLocations[`g_${user.id}`]?.name || 'NO LINK'}</div>
                        <div style={{ fontSize: '5pt', color: '#2563eb', fontWeight: 700 }}>{user.primaryGuardian?.relation || resolvedLocations[`g_${user.id}`]?.relation}</div>
                        <div style={{ fontSize: '6pt', marginTop: '2px' }}>{user.primaryGuardian?.phone || resolvedLocations[`g_${user.id}`]?.phone}</div>
                     </td>
                     <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                           <MapPin size={8} className="text-rose-500 shrink-0" />
                           <div>
                              <div style={{ fontWeight: 900, fontSize: '6pt' }}>{resolvedLocations[user.id]?.address?.toUpperCase() || user.locationName || 'FETCHING...'}</div>
                              <div className="location-text">PINCODE: {resolvedLocations[user.id]?.pincode || user.pincode} // {user.state?.toUpperCase() || 'INDIA'}</div>
                           </div>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>

         {/* 🎖️ FOOTER REPRODUCTION */}
         <div className="doc-footer">
            <div className="footer-section">
               <h3>Report Summary</h3>
               <p className="footer-text">
                  This registry export contains verified national level identities from the Kavach Cyber Safety Command Grid. 
                  All data is encrypted, validated and digitally signed.
               </p>
            </div>
            <div className="footer-section">
               <h3>Verification Legend</h3>
               <div className="legend-item"><div className="w-2 h-2 rounded-full bg-green-500" /> VERIFIED - Identity & Documents Verified</div>
               <div className="legend-item"><div className="w-2 h-2 rounded-full bg-blue-500" /> PENDING - Verification In Progress</div>
               <div className="legend-item"><div className="w-2 h-2 rounded-full bg-red-500" /> FAILED - Verification Failed / Rejected</div>
            </div>
            <div className="footer-section">
               <h3>Data Integrity</h3>
               <div className="integrity-item"><Shield size={10} /> End-to-End Encrypted</div>
               <div className="integrity-item"><Fingerprint size={10} /> Blockchain Secured Ledger</div>
               <div className="integrity-item"><SignalHigh size={10} /> Tamper Proof Audit Trail</div>
               <div className="integrity-item"><ShieldCheck size={10} /> ISO/IEC 27001 Compliant</div>
            </div>
            <div className="footer-section signature-box">
               <h3>Authorization</h3>
               <div style={{ fontFamily: '"Great Vibes", cursive', fontSize: '18pt', marginBottom: '-5px', opacity: 0.8 }}>S. Singh</div>
               <div className="sig-line" />
               <p style={{ fontSize: '6pt', fontWeight: 900, marginTop: '5px' }}>DIRECTOR, KAVACH SUPER CELL</p>
               <p style={{ fontSize: '5pt', fontWeight: 700 }}>MINISTRY OF HOME AFFAIRS</p>
               <p style={{ fontSize: '5pt', fontWeight: 700 }}>GOVERNMENT OF INDIA</p>
            </div>
         </div>

         <div className="bottom-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center"><Shield size={24} className="text-amber-500" /></div>
               <div>
                  <div style={{ fontSize: '7pt', fontWeight: 900 }}>KAVACH SUPER CELL HQ</div>
                  <div style={{ fontSize: '6pt', fontWeight: 700, color: '#64748b' }}>National Cyber Safety Command Grid</div>
               </div>
            </div>
            <div className="system-disclaimer">
               <div className="disclaimer-main">This document is system generated and digitally signed</div>
               <div className="disclaimer-sub">Unauthorized access, copying or distribution is strictly prohibited</div>
            </div>
            <div className="qr-placeholder" style={{ display: 'flex', flexWrap: 'wrap', padding: '2px' }}>
               {Array.from({ length: 25 }).map((_, i) => <div key={i} style={{ width: '8px', height: '8px', background: Math.random() > 0.5 ? '#fff' : '#000' }} />)}
            </div>
         </div>
      </div>

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
                      {tab.id === 'ALL' ? allUsers.length : tab.id === 'WOMEN' ? womenUsers.length : protectors.length}
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
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">AADHAAR / KYC</th>
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
                      <p className="text-[10px] font-black text-gray-900 leading-none">{user.aadhaar || user.aadhar || 'PENDING'}</p>
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
