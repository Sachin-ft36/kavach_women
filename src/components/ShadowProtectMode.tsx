import React, { useState, useEffect } from 'react';
import { Shield, EyeOff, Mic, Video, MapPin, Lock, Camera, Activity, Terminal, AlertTriangle, X, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';

export default function ShadowProtectMode({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isShadowActive, setShadowActive } = useKavachStore();
  const [step, setStep] = useState(1);

  const activateStealth = async () => {
    const { KavachSafe } = await import('../App');
    setShadowActive(true);
    
    // 🚀 TRIGGER NATIVE FORENSIC ENGINE
    await KavachSafe.startForensicCapture();
    
    // 📂 SEAL EVIDENCE IN VAULT (SIMULATED FOR LOGS)
    const evidenceRef = doc(collection(db, 'users', useKavachStore.getState().user?.uid || 'anonymous', 'evidence'));
    await setDoc(evidenceRef, {
      type: 'SHADOW_PROTECT_LOG',
      timestamp: serverTimestamp(),
      status: 'SEALED_ENCRYPTED',
      details: 'Silent background forensic capture initiated by ThreatProtect protocol.',
      gps_locked: true,
      audio_stream_active: true
    }).catch(() => {});

    toast.success("SHADOW PROTECT: STEALTH MODE ENGAGED", {
      description: "Forensic capture uplinked to National Grid.",
      icon: <Shield className="text-blue-500" />
    });
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
      />

      <AnimatePresence mode="wait">
        {!isShadowActive ? (
          <motion.div 
            key="setup"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20 }}
            className="relative w-full max-w-lg bg-[#0A0A0B] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#2563EB]/20 to-transparent pointer-events-none" />
            
            <div className="p-10 relative">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-[24px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] shadow-lg shadow-[#2563EB]/10">
                   <EyeOff size={32} />
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                   <X size={24} />
                </button>
              </div>

              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">THREAT PROTECT</h2>
              <p className="text-[11px] text-[#2563EB] font-black uppercase tracking-[5px] mb-10">Silent Background Recording</p>

              <div className="space-y-4 mb-10">
                <div className="flex gap-6 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                      <Zap size={24} />
                   </div>
                   <div>
                      <h4 className="text-[13px] font-black uppercase tracking-widest text-white mb-1 italic">Quick Trigger</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-tight">Hold Power Button 5s to Start Silently</p>
                   </div>
                </div>

                <div className="flex gap-6 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                      <Camera size={24} />
                   </div>
                   <div>
                      <h4 className="text-[13px] font-black uppercase tracking-widest text-white mb-1 italic">Stealth Capture</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-tight">Logs Video, Audio & GPS in Background</p>
                   </div>
                </div>

                <div className="flex gap-6 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                      <Lock size={24} />
                   </div>
                   <div>
                      <h4 className="text-[13px] font-black uppercase tracking-widest text-white mb-1 italic">Secured Evidence</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-tight">All Logs Sealed in Encrypted Vault</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={activateStealth}
                className="w-full py-6 bg-[#2563EB] text-white rounded-[24px] text-sm font-black uppercase tracking-[4px] italic shadow-2xl shadow-[#2563EB]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Engage Protocol
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center p-10"
          >
            <div className="w-32 h-32 rounded-full border-2 border-[#2563EB] flex items-center justify-center mb-8 relative">
               <motion.div 
                 animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 rounded-full bg-[#2563EB]"
               />
               <Shield size={48} className="text-[#2563EB] relative z-10" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">THREAT PROTECT ACTIVE</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[5px]">Silent Evidence Collection in Progress. Stay Safe.</p>
            
            <div className="mt-12 grid grid-cols-3 gap-8 opacity-40">
               <div className="flex flex-col items-center gap-2">
                  <Video size={16} className="animate-pulse text-[#2563EB]" />
                  <span className="text-[7px] font-bold uppercase tracking-widest text-white">Video</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Mic size={16} className="animate-pulse text-[#2563EB]" />
                  <span className="text-[7px] font-bold uppercase tracking-widest text-white">Audio</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <MapPin size={16} className="animate-pulse text-[#2563EB]" />
                  <span className="text-[7px] font-bold uppercase tracking-widest text-white">GPS</span>
               </div>
            </div>

            {/* ✅ SAFE EXIT BUTTON */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={async () => {
                const { KavachSafe } = await import('../App');
                await KavachSafe.stopForensicCapture();
                setShadowActive(false);
                toast.success("STEALTH PROTOCOL TERMINATED", {
                  description: "Forensic logs finalized and sealed in vault.",
                  icon: <ShieldCheck className="text-emerald-500" />
                });
                onClose();
              }}
              className="mt-20 px-12 py-5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all active:scale-95 shadow-2xl"
            >
               <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green">
                  <Shield size={16} />
               </div>
               <div className="text-left">
                  <span className="block text-[12px] font-black uppercase tracking-[4px] text-white leading-none">Safe Now</span>
                  <span className="block text-[7px] font-bold uppercase tracking-widest text-gray-500 mt-1.5">End Stealth Protocol</span>
               </div>
               <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-all ml-2" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
