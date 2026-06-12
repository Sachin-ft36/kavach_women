import React from 'react';
import { Camera, ShieldCheck, Download, Trash2, Video, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function EvidenceVisualGallery({
  snapshots,
  blobUrls,
  setSelectedImage,
  handleDownload,
  handleReview
}: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-emerald-500 rounded-xl" />
        <h3 className="text-[14px] font-black text-white uppercase tracking-[4px]">Visual Intel (Snapshots & CCTV)</h3>
      </div>
      
      {snapshots.length === 0 ? (
        <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest ">No visual evidence available.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {snapshots.map((item: any) => {
            const blobSrc = blobUrls[item.vaultId] || '';
            const imgSrc = item.type === 'Snapshot' ? (item.url || blobSrc) : blobSrc;
            const hasSrc = !!(blobSrc || item.url);
            const isVideo = item.type === 'CCTV_FEED';

            return (
              <div key={item.id} className="bg-black/40 rounded-[2rem] p-2 border border-white/5 group relative overflow-hidden flex flex-col">
                {/* Header Info */}
                <div className="flex items-center justify-between mb-2 z-10 relative">
                  <span className={cn(
                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                    isVideo ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  )}>
                    {isVideo ? 'CCTV' : 'Snap'}
                  </span>
                  <span className="text-[8px] font-bold text-gray-400 bg-black/60 px-1.5 py-0.5 rounded uppercase backdrop-blur-md">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'SYNC'}
                  </span>
                </div>

                {/* Media Viewer */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] border border-white/5 flex-1 flex items-center justify-center">
                  {item.status === 'Reviewed' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-60 bg-gray-900">
                      <ShieldCheck size={24} className="text-emerald-500" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 text-center">Cleared</p>
                    </div>
                  ) : isVideo ? (
                    blobSrc ? (
                      <video controls className="w-full h-full object-cover"><source src={blobSrc} type={item.mimeType || 'video/webm'} /></video>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                        <Video size={24} className="text-blue-500 animate-pulse" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 text-center">Local Only</p>
                      </div>
                    )
                  ) : imgSrc ? (
                    <img 
                      src={imgSrc} 
                      alt="Evidence" 
                      className="w-full h-full object-contain bg-black/50 transition-transform duration-500 group-hover:scale-105 cursor-zoom-in" 
                      onClick={() => setSelectedImage(imgSrc)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <Camera size={24} className="text-gray-500" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Loading...</p>
                    </div>
                  )}
                  
                  {item.status !== 'Reviewed' && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6 flex flex-col items-start gap-1">
                      <p className="text-[7px] font-black text-white/50 uppercase tracking-widest truncate w-full">
                        HASH: {item.hash || 'COMPUTING...'}
                      </p>
                      {(item.digitalSignature || item.hash) && (
                        <p className="text-[7px] font-black text-emerald-400/80 uppercase tracking-widest truncate w-full flex items-center gap-1">
                          <ShieldCheck size={8} /> SIGN: {item.digitalSignature || `SIG_0x${(item.hash || 'A1B2').slice(0, 16)}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-2 flex gap-1 z-10 relative">
                  {hasSrc && item.status !== 'Reviewed' && (
                    <button onClick={() => handleDownload(item)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all">
                      <Download size={10} /> Save
                    </button>
                  )}
                  {item.status !== 'Reviewed' ? (
                    <button onClick={() => handleReview(item)} className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-white shadow-lg text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all">
                      <Trash2 size={10} /> Clear
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                      <CheckCircle2 size={10} /> Log Saved
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
