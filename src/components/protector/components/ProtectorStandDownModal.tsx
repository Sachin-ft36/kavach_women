import React, { useState } from 'react';
import { AlertTriangle, X, ShieldOff, ChevronRight } from 'lucide-react';

const PRESET_REASONS = [
  { id: 'emergency', emoji: '🚨', label: 'Personal emergency', short: 'PERSONAL_EMERGENCY' },
  { id: 'vehicle', emoji: '🚗', label: 'Vehicle breakdown / no transport', short: 'VEHICLE_ISSUE' },
  { id: 'far', emoji: '📍', label: 'Location too far away', short: 'TOO_FAR' },
  { id: 'health', emoji: '🏥', label: 'Feeling unwell / health issue', short: 'HEALTH_ISSUE' },
  { id: 'resolved', emoji: '✅', label: 'Victim confirmed safe by another', short: 'RESOLVED_BY_OTHER' },
  { id: 'other', emoji: '✏️', label: 'Other reason (please specify)', short: 'OTHER' },
];

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isAborting?: boolean;
}

export function ProtectorStandDownModal({ isOpen, onCancel, onConfirm, isAborting }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const selected = PRESET_REASONS.find(r => r.id === selectedId);
    if (!selected) return;

    const finalReason = selectedId === 'other'
      ? (customText.trim() || 'Other reason not specified')
      : selected.label;

    onConfirm(finalReason);
    // Reset
    setSelectedId(null);
    setCustomText('');
  };

  const canConfirm = selectedId !== null && (selectedId !== 'other' || customText.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[9999999] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-t-[32px] shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header */}
        <div className="relative bg-rose-600 px-6 pt-6 pb-5">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={16} strokeWidth={3} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldOff size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-200">Mission Abort</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mt-0.5">Stand Down</h2>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 bg-white/10 rounded-2xl p-3">
            <AlertTriangle size={14} className="text-rose-200 mt-0.5 shrink-0" />
            <p className="text-[11px] text-rose-100 font-semibold leading-relaxed">
              You must provide a reason before standing down. This is recorded for accountability and helps improve the Kavach system.
            </p>
          </div>
        </div>

        {/* Reason picker */}
        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Select a reason</p>
          <div className="flex flex-col gap-2">
            {PRESET_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedId(reason.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                  selectedId === reason.id
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}
              >
                <span className="text-xl leading-none">{reason.emoji}</span>
                <span className={`flex-1 text-[13px] font-bold leading-snug ${
                  selectedId === reason.id ? 'text-rose-700' : 'text-slate-700'
                }`}>
                  {reason.label}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedId === reason.id
                    ? 'border-rose-500 bg-rose-500'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedId === reason.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom input for "Other" */}
          {selectedId === 'other' && (
            <div className="mt-3 animate-fadeIn">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe your reason briefly…"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-rose-200 bg-rose-50 text-[13px] text-slate-800 font-medium focus:outline-none focus:border-rose-500 resize-none placeholder:text-slate-400"
                autoFocus
              />
              <p className="text-right text-[10px] text-slate-400 mt-1">{customText.length}/200</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-8 pt-2 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
          >
            Stay On Mission
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isAborting}
            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all ${
              canConfirm && !isAborting
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAborting ? (
              <span className="animate-pulse">Aborting…</span>
            ) : (
              <>
                Confirm Abort <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease both; }
      `}</style>
    </div>
  );
}
