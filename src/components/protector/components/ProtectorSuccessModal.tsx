import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export function ProtectorSuccessModal({
  showSuccessMotivation,
  setShowSuccessMotivation,
  lastResolvedVictim,
  isCancelledByVictim = false,
  deEscalationReason = '',
  onCloseModal
}: any) {
  if (!showSuccessMotivation) return null;

  const handleClose = onCloseModal || (() => setShowSuccessMotivation(false));

  if (isCancelledByVictim) {
    return (
      <div className="fixed inset-0 z-[3000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-center text-slate-800">
        <div className="bg-white border border-slate-200 rounded-[32px] p-10 max-w-md w-full space-y-8 shadow-2xl relative">
          <div className="relative mx-auto w-32 h-32">
            <div className="relative w-full h-full rounded-full border border-slate-100 flex items-center justify-center bg-blue-50 shadow-inner animate-pulse">
              <Info size={64} className="text-blue-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">SOS Closed By Victim</p>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-slate-900">Stand Down</h2>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Victim Safety Status</p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                The citizen <strong className="font-extrabold">{lastResolvedVictim}</strong> has closed this alert and verified they are safe.
              </p>
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mt-2">
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">Reason Provided</span>
                <p className="text-xs text-blue-800 font-bold italic mt-0.5">"{deEscalationReason}"</p>
              </div>
              <div className="h-px w-full bg-slate-200 my-4" />
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center leading-normal">
                Thank you for responding so swiftly! Your willingness to protect keeps our community safe.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer">
            Return to Standby
          </button>
        </div>
      </div>
    );
  }

  // Normal Victory Modal
  return (
    <div className="fixed inset-0 z-[3000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-center text-slate-800">
      <div className="bg-white border border-slate-200 rounded-[32px] p-10 max-w-md w-full space-y-8 shadow-2xl relative">
        <div className="relative mx-auto w-32 h-32">
          <div className="relative w-full h-full rounded-full border border-slate-100 flex items-center justify-center bg-emerald-50 shadow-inner">
            <ShieldCheck size={64} className="text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Grid Victory Secured</p>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-slate-900">Mission Complete</h2>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <p className="text-sm font-bold text-slate-600 uppercase leading-relaxed tracking-wider">
              "The citizen {lastResolvedVictim} is safe. Your tactical response ensured the safety grid remained unbroken."
            </p>
            <div className="h-px w-12 bg-slate-200 mx-auto" />
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kavach Honor: Unblemished</p>
          </div>
        </div>
        <button onClick={handleClose} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer">
          Return to Duty
        </button>
      </div>
    </div>
  );
}
