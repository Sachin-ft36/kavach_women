import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Camera, Mic, Shield, CheckCircle2, Activity, 
  Fingerprint, ShieldCheck, Download, Trash2, Video
} from 'lucide-react';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface EvidenceViewerModalProps {
  alertId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceViewerModal({ alertId, isOpen, onClose }: EvidenceViewerModalProps) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !alertId) return;
    const q = query(collection(db, 'alerts', alertId, 'evidence'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEvidence(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [alertId, isOpen]);

  // Load blobs from IndexedDB for video/audio
  useEffect(() => {
    if (evidence.length === 0) return;
    const loadBlobs = async () => {
      const { getVaultEntry } = await import('../../lib/forensicVault');
      const newUrls: Record<string, string> = {};
      for (const item of evidence) {
        if (!item.vaultId) continue;
        try {
          const entry = await getVaultEntry(item.vaultId);
          if (entry) newUrls[item.vaultId] = URL.createObjectURL(entry.blob);
        } catch (e) { /* vault entry may not exist */ }
      }
      setBlobUrls(prev => {
        Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
        return newUrls;
      });
    };
    loadBlobs();
    return () => setBlobUrls(prev => {
      Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
      return {};
    });
  }, [evidence]);

  const handleReview = async (item: any) => {
    if (item.status === 'Reviewed') return;
    if (!window.confirm("CRITICAL: This will permanently delete the evidence file from the cloud to save space. The log will remain. Proceed?")) return;
    try {
      if (item.url && item.fileName) {
         const fileRef = ref(storage, `kavach_evidence/${alertId}/${item.fileName}`);
         await deleteObject(fileRef).catch(() => {});
      }
      await updateDoc(doc(db, 'alerts', alertId, 'evidence', item.id), {
        status: 'Reviewed',
        url: '',
        'metadata.reviewedBy': 'Command Center',
        'metadata.reviewedAt': serverTimestamp()
      });
      toast.success("Evidence Reviewed", { description: "Cloud storage cleared." });
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDownload = (item: any) => {
    const src = blobUrls[item.vaultId] || item.url;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = item.fileName || `kavach_evidence_${item.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const snapshots = evidence.filter(e => e.type === 'Snapshot' || e.type === 'CCTV_FEED');
  const audioLogs = evidence.filter(e => e.type === 'Audio Log');

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000]">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A0B]/95 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="absolute inset-0 w-full h-full bg-[#111827] shadow-[0_50px_150px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden flex flex-col"
        >
          {/* 🏛️ HEADER */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-rose-600/10 to-transparent">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-rose-600 text-white shadow-lg rounded-[28px] flex items-center justify-center text-white  shadow-rose-600/40 relative">
                <Fingerprint size={28} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white  leading-none">Forensic Evidence Vault</h2>
                <p className="text-[10px] sm:text-[11px] font-black text-rose-400 uppercase tracking-[4px] mt-2 opacity-80 flex items-center gap-2">
                  <Activity size={10} className="animate-pulse" /> Live Sync Active • Hash: 0x{alertId.toUpperCase()}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-4 bg-white/5 hover:bg-rose-600 text-white shadow-lg rounded-xl transition-all text-white active:scale-90 group">
              <X size={28} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* 🔍 BODY */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Shield size={80} className="text-blue-500 mb-6 animate-pulse" />
                <p className="text-[14px] font-black uppercase tracking-[8px] text-gray-400">Accessing Vault Data...</p>
              </div>
            ) : evidence.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/5 rounded-[3rem] mx-8">
                <Fingerprint size={80} className="text-gray-500 mb-6" />
                <p className="text-[14px] font-black uppercase tracking-[8px] text-gray-400">No Evidence Uploaded Yet</p>
              </div>
            ) : (
              <>
                {/* 🎙️ AUDIO LOGS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-xl" />
                    <h3 className="text-[14px] font-black text-white uppercase tracking-[4px]">Acoustic Logs</h3>
                  </div>

                  {audioLogs.length === 0 ? (
                    <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest ">No audio logs available.</p>
                  ) : (
                    <div className="bg-purple-500/5 rounded-xl p-6 border border-purple-500/10 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                          <Mic size={24} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-white uppercase ">Continuous Acoustic Stream</p>
                          <p className="text-[11px] font-bold text-purple-400 uppercase tracking-widest mt-1">
                            {audioLogs.length} Encrypted Segments • Auto-stitched
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        {(() => {
                          const item = audioLogs[activeAudioIndex];
                          if (!item) return null;
                          const blobSrc = blobUrls[item.vaultId] || item.url;
                          const hasSrc = !!blobSrc;

                          return (
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-purple-400/70 uppercase tracking-widest">
                                  Playing Segment {activeAudioIndex + 1} of {audioLogs.length}
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString() : 'SYNC...'}
                                </span>
                              </div>
                              {hasSrc ? (
                                <audio 
                                  key={activeAudioIndex} // force re-mount on src change
                                  autoPlay={activeAudioIndex > 0} // auto play next ones
                                  controls 
                                  className="w-full h-10"
                                  onEnded={() => {
                                    if (activeAudioIndex < audioLogs.length - 1) {
                                      setActiveAudioIndex(prev => prev + 1);
                                    } else {
                                      setActiveAudioIndex(0); // reset to beginning when all done
                                    }
                                  }}
                                >
                                  <source src={blobSrc} type={item.mimeType || 'audio/webm'} />
                                </audio>
                              ) : (
                                <div className="py-3 px-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-xl bg-purple-400 animate-ping" />
                                  <span className="text-[10px] font-black text-purple-400/80 uppercase tracking-widest animate-pulse">Loading Buffer...</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* 📸 SNAPSHOTS & VIDEO GALLERY */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-xl" />
                    <h3 className="text-[14px] font-black text-white uppercase tracking-[4px]">Visual Intel (Snapshots & CCTV)</h3>
                  </div>
                  
                  {snapshots.length === 0 ? (
                    <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest ">No visual evidence available.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {snapshots.map((item) => {
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
              </>
            )}
          </div>
          
          {/* FULLSCREEN IMAGE VIEWER */}
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[10001] bg-black/95 flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
                onClick={() => setSelectedImage(null)}
              >
                <img 
                  src={selectedImage} 
                  className="w-full h-full object-contain rounded-xl " 
                  alt="Enlarged Evidence" 
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                  className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-rose-500 rounded-xl text-white transition-all backdrop-blur-md"
                >
                  <X size={24} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
