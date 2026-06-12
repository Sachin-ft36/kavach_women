import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Activity, Fingerprint } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEvidenceViewer } from './hooks/useEvidenceViewer';
import { EvidenceAudioLogs } from './components/EvidenceAudioLogs';
import { EvidenceVisualGallery } from './components/EvidenceVisualGallery';

interface EvidenceViewerModalProps {
  alertId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceViewerModal({ alertId, isOpen, onClose }: EvidenceViewerModalProps) {
  const {
    evidence,
    loading,
    blobUrls,
    snapshots,
    audioLogs,
    handleReview,
    handleDownload
  } = useEvidenceViewer(alertId, isOpen);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                <EvidenceAudioLogs audioLogs={audioLogs} blobUrls={blobUrls} />

                {/* 📸 SNAPSHOTS & VIDEO GALLERY */}
                <EvidenceVisualGallery
                  snapshots={snapshots}
                  blobUrls={blobUrls}
                  setSelectedImage={setSelectedImage}
                  handleDownload={handleDownload}
                  handleReview={handleReview}
                />
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
