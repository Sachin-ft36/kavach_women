import React from 'react';
import { ArrowLeft, Database, Wifi, ShieldCheck, ChevronRight, Video, Image, Map, FileText, Trash2, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';

interface DataStorageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataStorage({ isOpen, onClose }: DataStorageProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0b0914] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Data & Storage</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">Manage app data, storage usage and cleanup</p>
            </div>
          </div>
          {/* Custom 3D Stacked Database Cylinder SVG */}
          <div className="relative shrink-0 w-[54px] h-[54px] overflow-visible">
            <svg width="54" height="54" viewBox="0 0 54 54" fill="none" className="overflow-visible">
              {/* Glow Behind the 3D Database */}
              <circle cx="27" cy="27" r="18" fill="url(#dbGlow)" filter="blur(4px)" opacity="0.6" />
              
              {/* Bottom Database Cylinder */}
              <g transform="translate(11, 28)">
                <path d="M0 6V16C0 19.5 7.16 22.5 16 22.5C24.84 22.5 32 19.5 32 16V6" fill="#0a1210" stroke="#00e599" strokeWidth="1.8" />
                <ellipse cx="16" cy="6" rx="16" ry="6" fill="#0c1a16" stroke="#00e599" strokeWidth="1.8" />
                <path d="M0 11C0 14.5 7.16 17.5 16 17.5C24.84 17.5 32 14.5 32 11" stroke="rgba(0,229,153,0.4)" strokeWidth="1.2" strokeDasharray="3,3" />
              </g>

              {/* Middle Database Cylinder */}
              <g transform="translate(11, 16)">
                <path d="M0 6V16C0 19.5 7.16 22.5 16 22.5C24.84 22.5 32 19.5 32 16V6" fill="#0a1512" stroke="#00e599" strokeWidth="1.8" />
                <ellipse cx="16" cy="6" rx="16" ry="6" fill="#0d1f19" stroke="#00e599" strokeWidth="1.8" />
                <path d="M0 11C0 14.5 7.16 17.5 16 17.5C24.84 17.5 32 14.5 32 11" stroke="rgba(0,229,153,0.4)" strokeWidth="1.2" strokeDasharray="3,3" />
              </g>

              {/* Top Database Cylinder */}
              <g transform="translate(11, 4)">
                <path d="M0 6V16C0 19.5 7.16 22.5 16 22.5C24.84 22.5 32 19.5 32 16V6" fill="url(#dbBody)" stroke="#00e599" strokeWidth="1.8" />
                {/* Highlight top face drawn on top of body */}
                <ellipse cx="16" cy="6" rx="16" ry="6" fill="url(#dbTopFace)" stroke="#00e599" strokeWidth="2" />
                <path d="M0 11C0 14.5 7.16 17.5 16 17.5C24.84 17.5 32 14.5 32 11" stroke="rgba(0,229,153,0.4)" strokeWidth="1.2" strokeDasharray="3,3" />
              </g>

              {/* Definitions */}
              <defs>
                <radialGradient id="dbGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00e599" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <linearGradient id="dbTopFace" x1="0" y1="0" x2="32" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#052e16" />
                </linearGradient>
                <linearGradient id="dbBody" x1="0" y1="6" x2="0" y2="22.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#042f1a" />
                  <stop offset="1" stopColor="#02140a" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </header>

        {/* Storage Overview Card */}
        <section className="bg-gradient-to-br from-[#121028] to-[#0d0a1b] border border-[#22213a] rounded-[18px] p-3.5 flex items-center gap-4 relative overflow-hidden text-left shadow-lg">
          {/* Circular Storage Visualizer */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="40" stroke="#22213a" strokeWidth="9" fill="transparent" />
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="url(#storageGradient)" 
                strokeWidth="9" 
                fill="transparent" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 * (1 - 2.45 / 24.0)} 
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#00e599" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-white leading-none">2.45 GB</span>
              <span className="text-[8px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">Used</span>
            </div>
          </div>

          {/* Stats details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wider">Storage Overview</span>
              <span className="text-[9px] text-[#00e599] font-bold bg-[#00e599]/10 px-1.5 py-0.2 rounded border border-[#00e599]/20">Active</span>
            </div>
            
            <div className="space-y-1 text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Used:</span>
                <span className="text-[#8b5cf6] font-semibold">2.45 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Available:</span>
                <span className="text-white font-medium">21.55 GB</span>
              </div>
              <div className="w-full bg-[#18162b] h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#00e599] rounded-full" style={{ width: `${(2.45 / 24.0) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* DATA USAGE */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Data Usage</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Mobile Data Usage */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => toast.info("Mobile Data settings opening...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Wifi size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Mobile Data Usage</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage how KAVACH uses mobile data</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-purple-400">Low Data Mode</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Data Usage Summary */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => toast.info("Data Usage breakdown details...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Database size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Data Usage Summary</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">View your app data usage details</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-slate-300">156 MB</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

          </div>
        </section>

        {/* STORAGE MANAGEMENT */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Storage Management</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Cached Videos */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Video size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Cached Videos</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Temporary videos and thumbnails</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-red-400 mr-1">1.12 GB</span>
            </div>

            {/* Cached Images */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Image size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Cached Images</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Temporary images and previews</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-500 mr-1">512 MB</span>
            </div>

            {/* Offline Maps */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Map size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Offline Maps</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Downloaded maps for offline use</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#6035f5] mr-1">620 MB</span>
            </div>

            {/* Logs & Diagnostics */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <FileText size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Logs &amp; Diagnostics</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">System logs and crash reports</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-purple-400 mr-1">96 MB</span>
            </div>

            {/* Other App Data */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
                  <Database size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Other App Data</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Other files and app data</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-350 mr-1">126 MB</span>
            </div>

            {/* Clean Up Storage Card */}
            <div className="flex items-center justify-between py-3 px-3.5 bg-gradient-to-r from-[#20153f]/40 to-[#0e0a1c] border-t border-[#222135]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8.5 h-8.5 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h4 className="text-[12px] font-medium text-white leading-tight">Clean Up Storage</h4>
                  <p className="text-[9.5px] text-slate-450 mt-0.5">Remove unnecessary files and free space</p>
                </div>
              </div>
              <button 
                onClick={() => toast.success("Cleared 1.63 GB of temporary app cache!")}
                className="bg-[#6035f5] hover:bg-[#7c4eff] text-white px-3 py-1.5 rounded-lg text-[9.5px] font-semibold cursor-pointer border-none transition-colors"
              >
                Clean Now
              </button>
            </div>

          </div>
        </section>

        {/* DATA RETENTION */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Data Retention</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Auto Delete Old Data */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => toast.info("Set Data Retention period...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Auto Delete Old Data</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automatically delete non-essential data</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-[#00e599]">90 Days</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Delete Old SOS Media */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => toast.info("Set SOS Media Retention period...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-450 shrink-0">
                  <Shield size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Delete Old SOS Media</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automatically delete old SOS media files</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-purple-400">180 Days</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

          </div>
        </section>

        {/* Footer info box */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-[12px] p-3 flex items-start gap-2.5 text-left">
          <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            Deleting data may affect offline functionality. Your important safety data will never be deleted.
          </p>
        </div>

      </div>
    </div>
  );
}
