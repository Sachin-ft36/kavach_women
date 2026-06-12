import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEvidenceVaultLogic } from './evidence/useEvidenceVaultLogic';
import { ComplaintHistory } from './evidence/ComplaintHistory';
import { VaultControls } from './evidence/VaultControls';
import { EvidenceLedger } from './evidence/EvidenceLedger';

import ZeroFIR from './ZeroFIR';

export default function EvidenceVault({ targetUid }: { targetUid?: string }) {
  const {
    logs, firs, loading,
    isVerifying,
    verifyIntegrity, handleDownload, exportAllEvidence, generateLegalAudit,
    latestUnusedLogs
  } = useEvidenceVaultLogic(targetUid);

  return (
    <div className="space-y-6 sm:space-y-10 pt-4 sm:pt-6 pb-24 px-4 sm:px-6 h-full flex flex-col relative font-sans selection:bg-[#2563EB]/10">
      
      {/* 🏛️ BACKGROUND WATERMARK (Extremely Subtle) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden opacity-[0.008]">
        <h1 className="text-[25vw] font-black uppercase text-gray-900 -rotate-12 select-none tracking-tighter leading-none">
          KAVACH
        </h1>
      </div>

      <div className="relative z-10 space-y-6 sm:space-y-10">
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
