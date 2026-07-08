import React, { useState } from 'react';
import { ShieldX, AlertOctagon, Send, ShieldAlert, CheckCircle2, ChevronDown } from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const APPEAL_REASONS = [
  "Technical Device Malfunction / Glitch",
  "Accidental Trigger by Minor / Family Member",
  "Emergency was Legitimate (Evidence Available)",
  "System Protocol Misunderstanding",
  "Unauthorized Device Access / Stolen",
  "Other (Specify in Comments)"
];

export default function BannedOverlay() {
  const { isSOSBlocked, sosBlockedReason, profile, user } = useKavachStore();
  const [isAppealMode, setIsAppealMode] = useState(false);
  const [selectedReason, setSelectedReason] = useState(APPEAL_REASONS[0]);
  const [appealText, setAppealText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isSOSBlocked) return null;

  const handleSendAppeal = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hasPendingAppeal: true,
        appealReason: selectedReason,
        appealContext: appealText,
        appealTimestamp: serverTimestamp()
      });
      setIsSent(true);
      toast.success("APPEAL TRANSMITTED TO SUPERCELL");
    } catch (e) {
      toast.error("TRANSMISSION FAILED");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[50000] bg-black flex items-center justify-center p-6 select-none touch-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15),transparent)] pointer-events-none" />
      
      <div className="relative w-full max-w-sm flex flex-col items-center z-[50001] pointer-events-auto">
        {/* 🛡️ Red Shield Icon */}
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 relative">
           <div className="absolute inset-0 bg-red-500/5 rounded-full " />
           <ShieldAlert size={40} className="text-red-500 relative z-10" strokeWidth={1.5} />
        </div>

        {/* 📋 Official Status */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-black uppercase text-white tracking-tighter italic">Account Blocked</h1>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[4px]">Grid Access Revoked by Supercell</p>
        </div>

        <div className="w-full pointer-events-auto">
          {!isAppealMode ? (
            <div className="w-full space-y-8">
              {/* 🔎 Reason Box */}
              <div className="w-full p-8 bg-[#111111] border border-white/5 rounded-[40px] space-y-4">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Reason for Suspension</span>
                <p className="text-sm font-bold text-white leading-relaxed">
                  {sosBlockedReason || "Forensic protocols indicate systemic misuse of emergency signaling services."}
                </p>
              </div>

              {/* ⚡ Primary Action - BULLETPROOF BUTTON */}
              <button 
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("⚡ APPEAL CLICKED");
                  setIsAppealMode(true);
                }}
                className="w-full py-6 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[3px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.97] transition-all cursor-pointer relative z-[60000] pointer-events-auto touch-manipulation"
              >
                Appeal Suspension
              </button>
            </div>
          ) : (
            <div className="w-full p-8 bg-[#111111] border border-white/5 rounded-[40px] space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Institutional Appeal</span>
                <button onClick={() => setIsAppealMode(false)} className="text-gray-500 hover:text-white transition-colors p-2">
                  <ShieldX size={16} />
                </button>
              </div>

              {isSent ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                     <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Appeal Transmitted</p>
                  <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                    SuperCell HQ has received your request.<br/>Administrative review in progress.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 🏛️ Reason Selector */}
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-gray-600 uppercase tracking-widest ml-1">Primary Justification</label>
                    <div className="relative group">
                      <select 
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 pr-10 text-[11px] text-white font-bold outline-none appearance-none cursor-pointer focus:border-red-500/50 transition-all"
                      >
                        {APPEAL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  {/* ✍️ Context Textarea */}
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-gray-600 uppercase tracking-widest ml-1">Additional Context (Optional)</label>
                    <textarea 
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      placeholder="Explain your situation in detail..."
                      className="w-full h-24 bg-black border border-white/5 rounded-2xl p-4 text-xs text-white font-medium outline-none resize-none placeholder:text-gray-800 leading-relaxed transition-all focus:border-white/10"
                    />
                  </div>

                  <button 
                    onClick={handleSendAppeal}
                    disabled={isSending}
                    className={cn(
                      "w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                      isSending ? "bg-gray-800 text-gray-500" : "bg-red-600 text-white shadow-lg shadow-red-600/20 active:scale-[0.98]"
                    )}
                  >
                    {isSending ? "Transmitting..." : (
                      <>
                        Submit Appeal <Send size={12} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-12 text-[7px] font-black text-gray-600 uppercase tracking-[4px]">
           National Safety Network Forensic Lockdown
        </p>
      </div>
    </div>
  );
}
