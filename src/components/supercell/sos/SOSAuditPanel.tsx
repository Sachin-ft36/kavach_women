import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Activity } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'sonner';
import { UserProfile } from '../../../domain/types';

const WARNING_REASONS = [
  "Accidental SOS trigger without emergency.",
  "Testing the SOS system without authorization.",
  "Intentional false alarm reporting.",
  "Misuse of the grid for non-emergency communication.",
  "Inappropriate or prank SOS activation.",
  "Other (Type custom message below)"
];

interface SOSAuditPanelProps {
  victimData: UserProfile | any | null;
  pendingAppeal: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SOSAuditPanel({ victimData, pendingAppeal, isOpen, onClose }: SOSAuditPanelProps) {
  const [selectedReason, setSelectedReason] = useState(WARNING_REASONS[0]);
  const [customMsg, setCustomMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitWarning = async () => {
    if (!victimData) return;
    setIsSubmitting(true);
    const finalMsg = selectedReason.includes("Other") ? customMsg : selectedReason;
    try {
      await updateDoc(doc(db, 'users', victimData.id), {
        hasPendingWarning: true,
        warningMessage: finalMsg,
        sosStrikeCount: (victimData.sosStrikeCount || 0) + 1
      });
      toast.warning("Warning Issued");
      onClose();
    } catch (e) { 
      toast.error("Citation Failed"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="relative w-full max-w-xl bg-[#1E293B]/40 border border-white/5 rounded-[2rem] p-10"
          >
            <h3 className="text-xl font-black text-white uppercase mb-8">Issue Misuse Warning</h3>
            <div className="space-y-6">
              <select 
                value={selectedReason} 
                onChange={(e) => setSelectedReason(e.target.value)} 
                className="w-full bg-[#0F172A] border border-white/5 rounded-xl py-4 px-6 text-xs font-bold text-white appearance-none outline-none"
              >
                {WARNING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              
              {selectedReason.includes("Other") && (
                <input
                  type="text"
                  placeholder="Custom warning message..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/5 rounded-xl py-4 px-6 text-xs font-bold text-white outline-none"
                />
              )}

              <button 
                disabled={isSubmitting} 
                onClick={submitWarning} 
                className="w-full py-4 bg-amber-500 text-black rounded-xl text-[14px] font-black uppercase flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />} 
                Finalize Citation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
