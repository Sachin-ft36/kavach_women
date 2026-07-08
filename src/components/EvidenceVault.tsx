import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEvidenceVaultLogic } from './evidence/useEvidenceVaultLogic';
import { ComplaintHistory } from './evidence/ComplaintHistory';
import { VaultControls } from './evidence/VaultControls';
import { EvidenceLedger } from './evidence/EvidenceLedger';
import { Lock } from 'lucide-react';

import ZeroFIR from './ZeroFIR';

export default function EvidenceVault({ targetUid }: { targetUid?: string }) {
  const {
    logs, firs, loading,
    isVerifying,
    verifyIntegrity, handleDownload, exportAllEvidence, generateLegalAudit,
    latestUnusedLogs
  } = useEvidenceVaultLogic(targetUid);

  return (
    <div className="space-y-6 sm:space-y-10 pt-4 sm:pt-6 pb-24 px-4 sm:px-6 h-[80vh] flex flex-col relative font-sans selection:bg-[#2563EB]/10 overflow-hidden">
      
      {/* 🔒 Centered High-Tech Watermark Overlay */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-transparent pointer-events-auto">
        <div className="bg-[#0F172A]/95 border border-gray-200/20 backdrop-blur-md px-8 py-8 rounded-[28px] shadow-2xl text-center max-w-[340px] mx-auto transform hover:scale-[1.02] transition-all">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ">
            <Lock size={20} className="text-red-500" />
          </div>
          <h2 className="text-white text-[16px] font-black uppercase tracking-[2px] leading-tight">
            Justice, Just a Tap Away
          </h2>
          <div className="h-[1px] w-12 bg-white/10 my-4 mx-auto" />
          <p className="text-gray-300 text-[10.5px] font-medium leading-relaxed">
            Building a secure channel between you and the authorities. This module will activate once our official government partnerships are finalized.
          </p>
        </div>
      </div>

      {/* 🏛️ BACKGROUND WATERMARK (Extremely Subtle) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden opacity-[0.008]">
        <h1 className="text-[25vw] font-black uppercase text-gray-900 -rotate-12 select-none tracking-tighter leading-none">
          KAVACH
        </h1>
      </div>

      {/* 🌫️ Background Content wrapped in low opacity & blur */}
      <div className="relative z-10 space-y-6 sm:space-y-10 opacity-[0.12] blur-[1.5px] select-none pointer-events-none">
        <ZeroFIR evidenceLogs={latestUnusedLogs} />

        {/* 📋 COMPLAINT HISTORY SECTION */}
        <ComplaintHistory firs={firs} />

        {/* 🔐 SECURE EVIDENCE VAULT AREA */}
        <VaultControls 
          isVerifying={isVerifying}
          verifyIntegrity={verifyIntegrity}
          exportAllEvidence={exportAllEvidence}
          generateLegalAudit={generateLegalAudit}
        />

        {/* 📊 EVIDENCE HISTORY LOG */}
        <EvidenceLedger 
          logs={logs}
          firs={firs}
          handleDownload={handleDownload}
        />
      </div>
    </div>
  );
}
