import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, AlertTriangle, Zap } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { cn } from '../lib/utils';
import { KavachSafe } from '../services/KavachNative';
import { Capacitor } from '@capacitor/core';

export default function SOSConfirmationOverlay() {
  const { pendingSOS, cancelPendingSOS, setSOSActive } = useKavachStore();
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!pendingSOS) {
      setTimeLeft(5);
      return;
    }

    // 📳 Tactical Haptic Pulse on Trigger
    if (Capacitor.isNativePlatform()) {
      KavachSafe.triggerHapticPulse();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        
        // 📳 Rhythmic Pulse during countdown
        if (Capacitor.isNativePlatform()) {
           KavachSafe.triggerHapticPulse();
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingSOS]);

  // 🚀 MISSION DISPATCH WATCHER
  useEffect(() => {
    if (timeLeft === 0 && pendingSOS) {
      setSOSActive(true, null, pendingSOS.method);
    }
  }, [timeLeft, pendingSOS, setSOSActive]);

  if (!pendingSOS) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0B] flex flex-col items-center justify-between p-8 sm:p-12 text-white">
      {/* Background Tactical Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 rounded-[32px] bg-red-600/10 border-2 border-red-600/30 flex items-center justify-center text-red-500 shadow-[0_0_40px_rgba(220,38,38,0.1)]">
          <ShieldAlert size={48} strokeWidth={1.5} />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black uppercase tracking-widest leading-tight">
            Emergency Trigger<br />Detected
          </h2>
          <div className="flex items-center justify-center gap-2 text-red-500/80">
            <Zap size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[3px]">Trigger Method: {pendingSOS.method}</span>
          </div>
        </div>

        <div className="relative w-40 h-40 flex items-center justify-center">
           <svg className="w-full h-full -rotate-90">
              <circle
                cx="80" cy="80" r="70"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/5"
              />
              <circle
                cx="80" cy="80" r="70"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-red-600 transition-all duration-1000"
                style={{
                  strokeDasharray: '440',
                  strokeDashoffset: (440 - (440 * (5 - timeLeft) / 5)).toString()
                }}
              />
           </svg>
           <span className="absolute text-7xl font-black font-mono">{timeLeft}</span>
        </div>

        <div className="space-y-4">
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
             Broadcasting Live SOS in {timeLeft}s
           </p>
           <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <AlertTriangle size={14} className="text-yellow-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">National Grid Authorities Standing By</span>
           </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto pt-10">
        <button 
          onClick={cancelPendingSOS}
          className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-[4px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          <X size={24} strokeWidth={3} />
          Cancel Request
        </button>
        <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-6">
          System Response Hardened for Reliability
        </p>
      </div>
    </div>
  );
}
