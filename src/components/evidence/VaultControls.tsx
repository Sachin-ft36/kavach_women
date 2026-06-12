import React from 'react';
import { Lock, Database, CheckCircle, Download, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface VaultControlsProps {
  isVerifying: boolean;
  verifyIntegrity: () => void;
  exportAllEvidence: () => void;
  generateLegalAudit: () => void;
}

export function VaultControls({ isVerifying, verifyIntegrity, exportAllEvidence, generateLegalAudit }: VaultControlsProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-[#F1F5F9] rounded-[40px] p-8 sm:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 text-[#2563EB]/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
         <Database size={200} strokeWidth={0.5} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#2563EB]/30">
            <Lock size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-[#1E293B]">{t('vault')}</h3>
        </div>

        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl mb-10">
          Emergency recordings and evidence files are stored securely for safety reporting and support purposes. All data is protected with high-level privacy protocols.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button 
            onClick={verifyIntegrity}
            disabled={isVerifying}
            className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-[#0F172A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#1E293B] transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <CheckCircle size={18} /> {isVerifying ? "Verifying..." : "Verify Evidence"}
          </button>
          <button 
            onClick={exportAllEvidence}
            className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} /> Download Records
          </button>
        </div>
        <div className="mt-4">
          <button 
            onClick={generateLegalAudit}
            className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 bg-red-50 text-red-600 border border-red-200 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm active:scale-95"
          >
            <FileText size={18} /> Generate Legal PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
