import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2, Gavel, FileText, Shield } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { cn } from '../lib/utils';

export default function WarningOverlay() {
  const { hasPendingWarning, warningMessage, acknowledgeWarning, profile } = useKavachStore();
  const [isAcknowledgeLoading, setIsAcknowledgeLoading] = React.useState(false);

  if (!hasPendingWarning) return null;

  const handleAcknowledge = async () => {
    setIsAcknowledgeLoading(true);
    try {
      await acknowledgeWarning();
    } catch (e) {
      console.error("Acknowledgment failed:", e);
    } finally {
      setIsAcknowledgeLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[10000] bg-[#0F172A] flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent)] pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="relative w-full max-w-lg bg-white rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20"
        >
          {/* 🏛️ Official Gov Header */}
          <div className="bg-[#FF9933] px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5 opacity-50" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-2">
                <ShieldAlert size={42} className="text-[#FF9933]" strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h2 className="text-[10px] font-black uppercase tracking-[4px] text-white/80">National Safety Network</h2>
                <h1 className="text-2xl font-black uppercase text-white tracking-tight leading-none">Disciplinary Citation</h1>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 space-y-8">
            {/* 🛡️ Forensic Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#1E293B]">
                <FileText size={18} className="text-[#FF9933]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Forensic Citation Record</span>
              </div>
              
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] p-6 relative group transition-all hover:border-[#FF9933]/30">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-[#E2E8F0] rounded-full">
                  <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest">Official Message</span>
                </div>
                <p className="text-sm font-bold text-[#1E293B] leading-relaxed italic">
                  "{warningMessage || "Unspecified protocol violation detected in safety grid operations."}"
                </p>
              </div>
            </div>

            {/* ⚖️ Legal Acknowledgment */}
            <div className="space-y-4 bg-orange-50/50 border border-orange-100 rounded-[24px] p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                  <Gavel size={16} className="text-[#EA580C]" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#1E293B] leading-relaxed">
                    I, <span className="text-[#EA580C] uppercase">{profile?.name || 'Authorized Citizen'}</span>, have read and understood this official disciplinary citation. 
                  </p>
                  <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">
                    I acknowledge that further misuse of the Kavach Emergency Grid may result in permanent suspension of safety services and institutional investigation.
                  </p>
                </div>
              </div>
            </div>

            {/* ⚡ Action Button */}
            <button
              onClick={handleAcknowledge}
              disabled={isAcknowledgeLoading}
              className={cn(
                "w-full py-6 rounded-3xl text-sm font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]",
                isAcknowledgeLoading 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-black/20"
              )}
            >
              {isAcknowledgeLoading ? (
                <>
                  <Activity size={18} className="animate-spin" />
                  Processing Acknowledgment...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  I Understand & Acknowledge
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-1 h-1 bg-[#22C55E] rounded-full animate-pulse" />
              <span className="text-[7px] font-black text-[#64748B] uppercase tracking-[2px]">National Security Protocol Active</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
