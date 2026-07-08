import React, { useState } from 'react';
import { ArrowLeft, Cloud, ShieldCheck, Check, ChevronRight, HardDrive, Database, Info, Calendar, RefreshCw, Key } from 'lucide-react';
import { toast } from 'sonner';

interface BackupRestoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackupRestore({ isOpen, onClose }: BackupRestoreProps) {
  const [autoBackup, setAutoBackup] = useState(true);
  const [frequency, setFrequency] = useState('Daily');
  const [network, setNetwork] = useState('Wi-Fi Only');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0b0914] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-1 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Backup & Restore</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">Secure your data, restore it anytime</p>
            </div>
          </div>
          
          {/* Reference matched cloud database SVG graphic (Enlarged & positioned absolutely to float outside the box) */}
          <div className="absolute right-[-12px] top-[-16px] w-[140px] h-[80px] overflow-visible z-20 pointer-events-none">
            <svg width="140" height="80" viewBox="0 0 96 54" fill="none" className="overflow-visible">
              {/* Cloud Path */}
              <path d="M42 22C42 13.1634 49.1634 6 58 6C64.6738 6 70.3621 10.0768 72.7661 15.9084C74.1504 14.7176 75.9892 14 78 14C82.4183 14 86 17.5817 86 22C86 22.3957 85.9713 22.7847 85.9157 23.1654C89.4754 24.6308 92 28.1691 92 32.2857C92 37.896 87.2941 42 81.8235 42H44.1765C38.7059 42 34 37.896 34 32.2857C34 27.5312 37.4913 23.5414 42.1797 22.1802C42.0624 22.1226 42 22.0617 42 22Z" fill="url(#cloudGlow)" stroke="#7c3aed" strokeWidth="1.5" />
              {/* Arrow inside Cloud pointing up */}
              <path d="M60 32V20M60 20L56 24M60 20L64 24" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Database Cylinder Stack on the Right */}
              <g transform="translate(68, 12)">
                {/* Cylinder 2 (lower database stack) */}
                <path d="M4 18V28C4 30.5 8.5 32.5 14 32.5C19.5 32.5 24 30.5 24 28V18" fill="url(#dbBodyBack)" stroke="#00b4d8" strokeWidth="1.5" />
                <ellipse cx="14" cy="18" rx="10" ry="4" fill="url(#dbFaceBack)" stroke="#00b4d8" strokeWidth="1.5" />
                <path d="M4 23C4 25.5 8.5 27.5 14 27.5C19.5 27.5 24 25.5 24 23" stroke="rgba(0,180,216,0.4)" strokeWidth="1.2" strokeDasharray="2,2" />

                {/* Cylinder 1 (upper database stack) */}
                <path d="M4 6V16C4 18.5 8.5 20.5 14 20.5C19.5 20.5 24 18.5 24 16V6" fill="url(#dbBodyBack)" stroke="#00b4d8" strokeWidth="1.5" />
                <ellipse cx="14" cy="6" rx="10" ry="4" fill="url(#dbFaceBack)" stroke="#00b4d8" strokeWidth="1.5" />
                <path d="M4 11C4 13.5 8.5 15.5 14 15.5C19.5 15.5 24 13.5 24 11" stroke="rgba(0,180,216,0.4)" strokeWidth="1.2" strokeDasharray="2,2" />
              </g>
              {/* Floating Shield Check badge in front of Database */}
              <g transform="translate(82, 32)">
                <path d="M8 1L1 3.5V8.5C1 12.8 4 16.8 8 17.8C12 16.8 15 12.8 15 8.5V3.5L8 1Z" fill="#06120e" stroke="#00e599" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,229,153,0.3))' }} />
                <path d="M5.5 9L7 10.5L10.5 7" stroke="#00e599" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Definitions */}
              <defs>
                <linearGradient id="cloudGlow" x1="58" y1="6" x2="68" y2="42" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4c1d95" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#1e1b4b" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="dbFaceBack" x1="4" y1="6" x2="24" y2="6" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0077b6" />
                  <stop offset="1" stopColor="#030712" />
                </linearGradient>
                <linearGradient id="dbBodyBack" x1="4" y1="6" x2="4" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#023e8a" />
                  <stop offset="1" stopColor="#030712" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </header>

        {/* Top Status Box */}
        <section className="bg-gradient-to-br from-[#1b1836] to-[#0f0b24] border border-[#2d2754] rounded-[18px] p-4 flex items-center justify-between gap-3 relative overflow-hidden text-left shadow-lg">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Shield Icon container matching exact styling */}
            <div className="w-12 h-12 rounded-full bg-[#1b193d]/80 border border-[#44387a] flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_4px_16px_rgba(96,53,245,0.2)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4" stroke="#4f46e5" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-[13.5px] font-bold text-white leading-tight">Your data is safe</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Last backup was <span className="text-[#00e599] font-semibold">2 hours ago</span></p>
              <div className="flex items-center gap-x-2.5 gap-y-0.5 text-[9.5px] text-slate-350 mt-1.5 flex-wrap font-medium">
                <span className="flex items-center gap-0.5"><Check size={10} className="text-[#00e599]" /> Encrypted</span>
                <span className="flex items-center gap-0.5"><Check size={10} className="text-[#00e599]" /> Secure</span>
                <span className="flex items-center gap-0.5"><Check size={10} className="text-[#00e599]" /> Up to date</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => toast.success("Backup process started successfully!")}
            className="bg-[#1b103e] hover:bg-[#251754] text-purple-300 border border-purple-800/40 px-3.5 py-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 hover:border-purple-650 hover:text-white"
          >
            <Cloud size={12} className="text-purple-400" /> Back Up Now
          </button>
        </section>

        {/* AUTOMATIC BACKUP */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Automatic Backup</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Automatic Backup Toggle */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                  <Cloud size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Automatic Backup</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automatically backup data to keep it protected</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setAutoBackup(!autoBackup);
                    toast.success(`Automatic backup toggled ${!autoBackup ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${autoBackup ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoBackup ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Backup Frequency */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Backup Frequency</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose how often you want data backed up</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={frequency} 
                  disabled={!autoBackup}
                  onChange={(e) => { setFrequency(e.target.value); toast.success(`Backup frequency set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Back Up Using */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Database size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Back Up Using</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose your preferred network</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={network} 
                  disabled={!autoBackup}
                  onChange={(e) => { setNetwork(e.target.value); toast.success(`Backup network set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="Wi-Fi Only">Wi-Fi Only</option>
                  <option value="Wi-Fi & Cellular">Wi-Fi &amp; Cellular</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

          </div>
        </section>

        {/* BACKUP DETAILS */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Backup Details</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* What's Included */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => toast.info("12 categories included in backup")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">What's Included</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Profile, settings, contacts, safety records...</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="bg-[#00e599]/15 text-[#00e599] text-[8.5px] px-1.5 py-0.2 rounded font-semibold">12 Categories</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Backup Location */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <HardDrive size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Backup Location</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Data is securely stored in the cloud</p>
                </div>
              </div>
              <span className="text-[10.5px] font-semibold text-blue-400 mr-1">Cloud Storage</span>
            </div>

            {/* Last Backup */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Last Backup</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">May 11, 2025 at 10:30 AM</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mr-1 flex items-center gap-1">2 hours ago <Check size={10} className="text-[#00e599]" /></span>
            </div>

            {/* Backup Size */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
                  <Database size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Backup Size</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total size of backup data</p>
                </div>
              </div>
              <span className="text-[10.5px] font-semibold text-[#00e599] mr-1">2.45 GB</span>
            </div>

            {/* Encryption */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#7c4eff]/10 flex items-center justify-center text-[#9f80ff] shrink-0">
                  <Key size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Encryption</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Your backup is end-to-end encrypted</p>
                </div>
              </div>
              <span className="text-[10.5px] font-semibold text-[#9f80ff] mr-1">AES-256</span>
            </div>

          </div>
        </section>

        {/* RESTORE DATA */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Restore Data</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Restore from Backup */}
            <div className="flex items-center justify-between py-3 px-3.5 bg-[#0b0f17]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8.5 h-8.5 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-450 shrink-0">
                  <RefreshCw size={15} />
                </div>
                <div>
                  <h4 className="text-[12px] font-medium text-white leading-tight">Restore from Backup</h4>
                  <p className="text-[9.5px] text-slate-450 mt-0.5">Restore your data from a previous backup</p>
                </div>
              </div>
              <button 
                onClick={() => toast.success("Restoring backup files...")}
                className="bg-transparent border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg text-[9.5px] font-semibold cursor-pointer transition-colors"
              >
                Restore Now
              </button>
            </div>

          </div>
        </section>

        {/* Footer info box */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-[12px] p-3 flex items-start gap-2.5 text-left">
          <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            Your backups are private and secure. Only you can access and restore your data.
          </p>
        </div>

      </div>
    </div>
  );
}
