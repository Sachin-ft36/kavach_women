import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, MapPin, Mic, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
              <ShieldCheck size={16} className="text-[#2563EB]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Privacy Policy</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KAVACH Safety Network</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-slate-600 custom-scrollbar">
          
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500" /> Background Location
            </h3>
            <p className="text-xs leading-relaxed">
              KAVACH collects background location data exclusively to enable core safety features like <b>Safe Arrival, Ride Deviation detection, and Guardian Live Monitoring</b> when an active safety session or emergency is triggered, even if the app is closed. This data is required to ensure your Guardians can track your safety status during critical moments.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Mic size={14} className="text-red-500" /> Microphone Access
            </h3>
            <p className="text-xs leading-relaxed">
              The app uses microphone access strictly for <b>voice activation detection</b> (e.g., detecting "Kavach Help") and <b>emergency evidence capture after a user-initiated alert</b>. Trigger detection happens entirely offline. Audio evidence is only recorded and securely vaulted after an active SOS protocol is engaged. We do not continuously record or upload your background conversations.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database size={14} className="text-blue-500" /> Data Retention & Deletion
            </h3>
            <p className="text-xs leading-relaxed">
              We store your data securely in our infrastructure. You have the full right to request deletion of your account and all associated telemetry, activity logs, and evidence at any time directly through the app's Account Settings.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Information Sharing</h3>
            <p className="text-xs leading-relaxed">
              KAVACH does not sell your personal data. Location and emergency data are only shared with your explicitly chosen Guardians or official Volunteer Protectors when you trigger an emergency protocol.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed font-medium">
            By using KAVACH, you consent to our data practices as described in this policy. For a full legal document or queries, please contact support@kavach.app.
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95"
          >
            I Understand
          </button>
        </div>
      </motion.div>
    </div>
  );
}
