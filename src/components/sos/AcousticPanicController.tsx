import React from 'react';
import { Siren, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../../services/KavachNative';
import { stopVoiceSentinel, startVoiceSentinel } from '../../hooks/KavachVoiceEngine';
import { startWebSiren, stopWebSiren } from '../../utils/sirenUtils';
import { useKavachStore } from '../../state/useKavachStore';

export default function AcousticPanicController() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* Emergency Siren */}
      <button
        onClick={async () => {
          stopVoiceSentinel();
          startWebSiren();

          if (Capacitor.isNativePlatform()) {
            await KavachSafe.startContinuousSiren();
          }

          (window as any)._kavach_manual_siren = true;

          toast.error("MANUAL PANIC ALARM ACTIVE", {
            icon: "🚨",
            duration: 5000,
          });
        }}
        className="relative h-[118px] rounded-[22px] flex flex-col items-center justify-center active:scale-[0.98] transition-all"
        style={{
          background: "#FFF8F8",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: `
            0 4px 18px rgba(15,23,42,0.04),
            inset 0 1px 0 rgba(255,255,255,0.9)
          `
        }}
      >
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3" style={{ background: "#FFEFEF" }}>
          <Siren size={22} strokeWidth={2} className="text-[#FF4343]" />
        </div>
        <h3 className="text-[13px] font-bold tracking-[-0.2px]" style={{ color: "#EF2D2D" }}>
          EMERGENCY SIREN
        </h3>
        <p className="text-[11px] mt-1 font-medium" style={{ color: "#7A8599" }}>
          Alert nearby people
        </p>
      </button>

      {/* Stop Siren */}
      <button
        onClick={async () => {
          stopWebSiren();

          if (Capacitor.isNativePlatform()) {
            await KavachSafe.stopContinuousSiren();
          }

          (window as any)._kavach_manual_siren = false;

          toast.success("All Audible Alarms Silenced.");

          const state = useKavachStore.getState();

          if (state.isVoiceTriggerActive) {
            startVoiceSentinel(() => {
              state.setPendingSOS(true, "voice");
            });
          }
        }}
        className="relative h-[118px] rounded-[22px] flex flex-col items-center justify-center active:scale-[0.98] transition-all"
        style={{
          background: "#F8FAFD",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: `
            0 4px 18px rgba(15,23,42,0.04),
            inset 0 1px 0 rgba(255,255,255,0.9)
          `
        }}
      >
        <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3" style={{ background: "#EEF2F7" }}>
          <Volume2 size={22} strokeWidth={2} className="text-[#5E6F92]" />
        </div>
        <h3 className="text-[13px] font-bold tracking-[-0.2px]" style={{ color: "#143C7D" }}>
          STOP SIREN
        </h3>
        <p className="text-[11px] mt-1 font-medium" style={{ color: "#7A8599" }}>
          Silence the alert
        </p>
      </button>
    </div>
  );
}
