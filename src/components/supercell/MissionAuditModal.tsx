import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Database, Lock } from 'lucide-react';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { createPortal } from 'react-dom';
import { useMissionAudit } from './hooks/useMissionAudit';
import { MissionAuditIntel } from './components/MissionAuditIntel';
import { MissionAuditTimeline } from './components/MissionAuditTimeline';

interface MissionAuditModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function MissionAuditModal({ user, isOpen, onClose }: MissionAuditModalProps) {
  const {
    history,
    guardians,
    loading,
    isIssuingWarning,
    selectedEvidenceAlertId,
    setSelectedEvidenceAlertId,
    handleIssueWarning,
    falseAlertCount,
    integrityScore
  } = useMissionAudit(user, isOpen, onClose);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999]">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 w-full h-full bg-[#0F172A] border border-white/10 overflow-hidden flex flex-col"
          >
            {/* 🏛️ HIGH-FIDELITY AUDIT HEADER */}
            <div className="p-10 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 relative">
                  <Database size={28} />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0F172A] flex items-center justify-center">
                     <Lock size={10} />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic leading-none">Mission Audit File</h2>
                  <p className="text-[11px] font-black text-blue-400 uppercase tracking-[4px] mt-2 opacity-60">Registry Ref: {user.id?.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* 📊 LEFT SIDE: CITIZEN INTEL */}
              <MissionAuditIntel
                user={user}
                integrityScore={integrityScore}
                historyCount={history.length}
                falseAlertCount={falseAlertCount}
                guardians={guardians}
                handleIssueWarning={handleIssueWarning}
                isIssuingWarning={isIssuingWarning}
              />

              {/* 🔗 RIGHT SIDE: IMMUTABLE CHAIN TIMELINE */}
              <MissionAuditTimeline
                loading={loading}
                history={history}
                setSelectedEvidenceAlertId={setSelectedEvidenceAlertId}
              />
            </div>

            {/* 🛡️ MODAL FOOTER: SECURITY PROTOCOL */}
            <div className="p-8 bg-black/60 border-t border-white/10 flex items-center justify-between">
               <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Security Clearance: Level 7</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Data Immutability: 100%</span>
                  </div>
               </div>
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-[4px] italic">KAVACH_SUPERCELL_PROTOCOL_V4.92</p>
            </div>
          </motion.div>
        </div>
      )}
      
      {selectedEvidenceAlertId && (
        <EvidenceViewerModal
          alertId={selectedEvidenceAlertId}
          isOpen={!!selectedEvidenceAlertId}
          onClose={() => setSelectedEvidenceAlertId(null)}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
