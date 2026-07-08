import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ChevronRight, MapPin, Clock, ShieldCheck, AlertCircle, Download, Send, Camera, Video, Plus, Trash2, Shield, Fingerprint, Mic, X } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../state/useKavachStore';
import { cn } from '../lib/utils';
import { useZeroFIRLogic } from './zerofir/useZeroFIRLogic';
import { VaultPicker } from './zerofir/VaultPicker';

interface ZeroFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZeroFIRModal({ isOpen, onClose }: ZeroFIRModalProps) {
  const { user, userPos } = useKavachStore();
  
  const {
    step, setStep,
    incidentType, setIncidentType,
    description, setDescription,
    attachments, setAttachments,
    vaultAttachments, setVaultAttachments,
    isVaultPickerOpen, setIsVaultPickerOpen,
    fileInputRef, printRef,
    incidentTypes,
    handleFileChange, removeAttachment, handleDownload, handleForward
  } = useZeroFIRLogic({ user, userPos });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0A0A0B] flex flex-col p-4 sm:p-6 pt-6 sm:pt-12 overflow-hidden font-sans">
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <button 
          onClick={onClose}
          className="p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white flex items-center gap-1.5 sm:gap-2 group"
        >
          <ChevronRight size={16} className="rotate-180 sm:size-[18px]" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <div className="px-3 py-1 bg-accent-red/20 rounded-full border border-accent-red/30">
           <span className="text-[7px] sm:text-[8px] font-black text-accent-red uppercase tracking-widest italic">Legal Protocol</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 flex flex-col sm:justify-center">
        <div className="space-y-6 sm:space-y-12 py-4">
          <div className="space-y-1 sm:space-y-4 text-center">
            <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Zero FIR Assistant</h2>
            <p className="text-[9px] sm:text-[11px] text-gray-500 font-bold uppercase tracking-[2px] sm:tracking-[4px]">Digital Complaint Registration (Sec. 154 CrPC)</p>
          </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: -20, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-3 sm:space-y-6 text-center">
                <label className="text-[9px] sm:text-[12px] font-black uppercase tracking-[1.5px] sm:tracking-[3px] text-gray-500 block">Select Incident Category</label>
                <div className="grid grid-cols-1 gap-2.5 sm:gap-4">
                  {incidentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setIncidentType(type)}
                      className={cn(
                        "p-3.5 sm:p-6 rounded-xl sm:rounded-[24px] border transition-all text-center",
                        incidentType === type 
                          ? "bg-accent-red/10 border-accent-red text-white" 
                          : "bg-white/5 border-white/10 text-white/60"
                      )}
                    >
                      <span className="text-[11px] sm:text-sm font-black uppercase tracking-widest">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button 
                disabled={!incidentType}
                onClick={() => setStep(2)}
                className="w-full py-4 sm:py-6 bg-white text-black rounded-xl sm:rounded-[24px] text-[10px] sm:text-xs font-black uppercase tracking-[2px] sm:tracking-[4px] disabled:opacity-20 transition-all shadow-2xl"
              >
                Continue to Evidence Details
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: -20, x: 0 }}
              className="space-y-6"
            >
               {/* Evidence Upload Section */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 block">Attach Media Proof</label>
                    <button 
                      onClick={() => setIsVaultPickerOpen(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-500 rounded-full border border-blue-500/30 text-[8px] font-black uppercase"
                    >
                      <Fingerprint size={10} /> Select from Vault
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                     {vaultAttachments.map((item, idx) => (
                        <div key={`vault-${idx}`} className="relative aspect-square bg-blue-600/10 rounded-xl border border-blue-500/30 flex items-center justify-center overflow-hidden group">
                           {item.type === 'Snapshot' ? <img src={item.url} className="w-full h-full object-cover" /> : <Mic size={16} className="text-blue-500" />}
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Trash2 size={12} className="text-white cursor-pointer" onClick={() => setVaultAttachments(prev => prev.filter((_, i) => i !== idx))} />
                           </div>
                        </div>
                     ))}
                     {attachments.map((file, idx) => (
                        <div key={`file-${idx}`} className="relative aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                           {file.type.startsWith('image') ? <Camera size={16} className="text-gray-500" /> : <Video size={16} className="text-gray-500" />}
                           <button 
                             onClick={() => removeAttachment(idx)}
                             className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                           >
                              <Trash2 size={8} />
                           </button>
                        </div>
                     ))}
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-accent-red transition-all"
                     >
                        <Plus size={20} className="text-gray-500" />
                        <span className="text-[8px] font-bold text-gray-600 uppercase">External</span>
                     </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    className="hidden" 
                    accept="image/*,video/*"
                  />
               </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 block">Describe the Incident</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about the person, vehicle, or event..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-accent-red/50 transition-all"
                />
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full py-5 bg-accent-red text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-accent-red/20"
              >
                Generate Official FIR Copy
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center pt-10 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-accent-green/20 rounded-full flex items-center justify-center text-accent-green shadow-2xl shadow-accent-green/20">
                <ShieldCheck size={48} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-white uppercase italic">Document Secured</h3>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-10">Your Zero FIR with {vaultAttachments.length + attachments.length} linked assets has been generated.</p>
              </div>
              
              <div className="grid grid-cols-1 w-full gap-3">
                <button 
                  onClick={handleDownload}
                  className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                   <Download size={16} /> Download Official PDF
                </button>
                <button 
                  onClick={handleForward}
                  className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                   <Send size={16} /> Forward to E-Police Hub
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-white/5 border-t border-white/10 flex items-center gap-3">
         <FileText size={16} className="text-gray-500" />
         <p className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest">A Zero FIR can be filed at ANY police station irrespective of jurisdiction.</p>
      </div>

      {/* 🔐 VAULT PICKER MODAL */}
      <AnimatePresence>
        {isVaultPickerOpen && (
          <VaultPicker 
            onClose={() => setIsVaultPickerOpen(false)} 
            onSelect={(item) => {
              if (!vaultAttachments.find(v => v.id === item.id)) {
                setVaultAttachments(prev => [...prev, item]);
              }
            }}
            selectedIds={vaultAttachments.map(v => v.id)}
          />
        )}
      </AnimatePresence>

      <div ref={printRef} className="hidden" />
    </div>
  );
}

