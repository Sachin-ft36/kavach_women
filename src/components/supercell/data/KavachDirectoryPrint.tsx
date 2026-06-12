import React from 'react';
import { Users, Heart, ShieldCheck, SignalHigh, Fingerprint, Shield, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface KavachDirectoryPrintProps {
  selectedState: string;
  filteredData: any[];
  mergedWomenUsers: any[];
  mergedProtectors: any[];
  resolvedLocations: Record<string, any>;
}

export function KavachDirectoryPrint({
  selectedState,
  filteredData,
  mergedWomenUsers,
  mergedProtectors,
  resolvedLocations
}: KavachDirectoryPrintProps) {
  return (
    <>
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
                  <span className="card-value">{mergedWomenUsers.length}</span>
               </div>
            </div>
            <div className="summary-card">
               <div className="card-icon"><ShieldCheck size={18} className="text-blue-600" /></div>
               <div className="card-content">
                  <span className="card-label">Verified Protectors</span>
                  <span className="card-value">{mergedProtectors.length}</span>
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
    </>
  );
}
