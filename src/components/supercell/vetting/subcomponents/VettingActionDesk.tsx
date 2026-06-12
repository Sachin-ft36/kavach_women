import React from 'react';
import { ShieldCheck, XCircle, UserCheck, UserX } from 'lucide-react';

interface Props {
  user: any;
  activeSubTab: 'pending' | 'approved' | 'rejected';
  rejectionReason: string;
  setRejectionReason: (r: string) => void;
  isActionLoading: boolean;
  onApprove: (userId: string, gender: string) => void;
  onReject: (userId: string, gender: string) => void;
}

export function VettingActionDesk({
  user: u, activeSubTab, rejectionReason, setRejectionReason,
  isActionLoading, onApprove, onReject
}: Props) {
  return (
    <div className="border-t border-slate-800 pt-6 space-y-4">
      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Rejection explanation (Only required if rejecting request)
            </label>
            <textarea
              placeholder="State reason: e.g. profile selfie blurred, badge ID invalid..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full bg-[#070b12] border border-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => onReject(u.id, u.gender)}
              disabled={isActionLoading}
              className="flex-1 py-4 bg-rose-600/10 border border-rose-600/30 hover:bg-rose-600 active:scale-[0.98] transition-all rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserX size={16} /> Disapprove & Reject
            </button>
            <button
              onClick={() => onApprove(u.id, u.gender)}
              disabled={isActionLoading}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <UserCheck size={16} /> Verify & Authorize
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'approved' && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wide">
          <span className="flex items-center gap-2"><ShieldCheck size={16} /> User is actively authorized on the Kavach network</span>
          <button
            onClick={() => onReject(u.id, u.gender)}
            className="px-3 py-1.5 border border-rose-500/20 rounded-xl text-[9px] text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-black tracking-widest cursor-pointer"
          >
            Revoke Access
          </button>
        </div>
      )}

      {activeSubTab === 'rejected' && (
        <div className="space-y-4">
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-1 text-xs text-rose-400">
            <span className="font-black uppercase tracking-widest flex items-center gap-2"><XCircle size={16} /> User Registration Rejected</span>
            <p className="text-slate-300 font-semibold mt-1">Reason: {u.rejectionReason}</p>
          </div>
          <button
            onClick={() => onApprove(u.id, u.gender)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            Re-authorize User
          </button>
        </div>
      )}
    </div>
  );
}
