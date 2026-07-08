import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Timer, LifeBuoy, Gavel, FileText, X } from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';

export default function RestrictedSOSOverlay() {
  const { user, sosStrikeCount, setSOSActive, setOverlayActive, isSOSActive, profile, isRideModeActive } = useKavachStore();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Sync isOverlayActive status to store to hide bottom navbar
  useEffect(() => {
    if (remainingTime !== null && remainingTime > 0 && !isSOSActive && !isDismissed && !isRideModeActive) {
      setOverlayActive(true);
    } else {
      setOverlayActive(false);
    }
    return () => setOverlayActive(false);
  }, [remainingTime, setOverlayActive, isSOSActive, isDismissed, isRideModeActive]);

  // Progressive cooldown table based on strikes (Locked to 30 minutes)
  const COOLDOWN_TABLE: Record<number, number> = {
    0: 30 * 60 * 1000,        // Strike 0 -> 30 minutes
    1: 30 * 60 * 1000,        // Strike 1 -> 30 minutes
    2: 30 * 60 * 1000,        // Strike 2 -> 30 minutes
    3: 30 * 60 * 1000,        // Strike 3 -> 30 minutes
  };

  useEffect(() => {
    if (!user?.uid) return;
    const cooldownMs = COOLDOWN_TABLE[Math.min(sosStrikeCount, 3)] || 1800000;
    const cooldownKey = `kavach_sos_cooldown_${user.uid}`;
    
    const checkRemaining = () => {
      const lastSentLocal = parseInt(localStorage.getItem(cooldownKey) || '0', 10);
      if (lastSentLocal > 0) {
        const elapsed = Date.now() - lastSentLocal;
        if (elapsed < cooldownMs) {
          setRemainingTime(cooldownMs - elapsed);
          return;
        }
      }
      setRemainingTime(null);
      setIsDismissed(false); // Reset dismissal when cooldown expires
    };

    checkRemaining();
    const interval = setInterval(checkRemaining, 1000);
    return () => clearInterval(interval);
  }, [user?.uid, sosStrikeCount]);

  if (isSOSActive || isDismissed || remainingTime === null || remainingTime <= 0 || isRideModeActive) return null;

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const STRIKE_LABELS: Record<number, string> = {
    0: 'First Warning active. Repeated false triggers cause temporary lockouts.',
    1: 'Second warning active. System access restricted.',
    2: 'Third warning active. System access severely restricted.',
    3: 'Severe abuse flagged. Local admin dispatch supervisor notified.',
  };

  const handleOverride = () => {
    if (confirm("🚨 WARNING: False alarms under override restrictions are treated as a serious legal offense. Are you in REAL danger?")) {
      if (user?.uid) {
        const cooldownKey = `kavach_sos_cooldown_${user.uid}`;
        localStorage.removeItem(cooldownKey);
        localStorage.removeItem('kavach_last_cancellation_time');
      }
      setRemainingTime(null);
      setOverlayActive(false);
      (window as any)._kavach_sos_override = true;
      setSOSActive(true, null, 'duress');
      setTimeout(() => {
        (window as any)._kavach_sos_override = false;
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setOverlayActive(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-[#0F172A] flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent)] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative w-full max-w-md bg-white rounded-[32px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20"
        >
          {/* Close Button (X) */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-20 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 🏛️ Official Gov Header */}
          <div className="bg-[#FF9933] px-6 py-6 sm:py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5 opacity-50" />
            <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-xl mb-1">
                <ShieldAlert size={32} className="text-[#FF9933]" strokeWidth={2.5} />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-[8px] font-black uppercase tracking-[3px] text-white/80">National Safety Network</h2>
                <h1 className="text-xl font-black uppercase text-white tracking-tight leading-none">SOS Access Restricted</h1>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* ⏱️ Restricted Warning details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[#1E293B]">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#FF9933]" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Disciplinary Status</span>
                </div>
                <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded">
                  <Timer className="w-3 h-3" />
                  <span>{formatTime(remainingTime)}</span>
                </span>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] p-4 sm:p-5 relative group transition-all hover:border-[#FF9933]/30">
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-full">
                  <span className="text-[7px] font-black text-[#64748B] uppercase tracking-widest">Violation Message</span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-[#1E293B] leading-relaxed italic">
                  "{STRIKE_LABELS[Math.min(sosStrikeCount, 3)] || 'Access restricted.'}"
                </p>
              </div>
            </div>

            {/* ⚖️ Legal Acknowledgment */}
            <div className="space-y-3 bg-orange-50/50 border border-orange-100 rounded-[20px] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-orange-100 rounded-lg shrink-0">
                  <Gavel size={14} className="text-[#EA580C]" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-[#1E293B] leading-relaxed">
                    Account: <span className="text-[#EA580C] uppercase">{profile?.name || 'Authorized Citizen'}</span> (Strike {sosStrikeCount + 1}/4)
                  </p>
                  <p className="text-[9px] text-[#64748B] font-medium leading-relaxed">
                    Emergency services are locked due to repeated false alarms. Genuinely in danger right now? Use the override below to bypass.
                  </p>
                </div>
              </div>
            </div>

            {/* ⚡ Override Button */}
            <button
              onClick={handleOverride}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white shadow-2xl active:scale-[0.98]"
            >
              <LifeBuoy size={16} />
              I am in REAL danger — Bypass
            </button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-1 h-1 bg-red-600 rounded-full" />
              <span className="text-[7px] font-black text-[#64748B] uppercase tracking-[2px]">Override calls are logged for legal review</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
