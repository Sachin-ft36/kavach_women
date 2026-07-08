import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { useAudioAI } from '../hooks/useAudioAI';
import { useKavachStore } from '../state/useKavachStore';
import { cn } from '../lib/utils';

interface VoiceVisualizerProps {
  isSOSActive: boolean;
}

const VoiceVisualizer = React.memo(({ isSOSActive }: VoiceVisualizerProps) => {
  const { volume } = useAudioAI();
  const { isBriefingActive } = useKavachStore();

  // 💓 HEARTBEAT GENERATOR: Flat when silent, Spikes when voice detected
  const generateHeartbeatPath = useMemo(() => {
    const vol = (isSOSActive || isBriefingActive) ? 0 : volume;
    const isSilent = vol < 10;

    // Base line at y=25
    let path = "M 0,25 ";
    const segments = 20;
    const width = 200;
    const step = width / segments;

    for (let i = 1; i <= segments; i++) {
      const x = i * step;
      let y = 25;

      if (!isSilent) {
        // Create heartbeat-like spikes based on volume
        if (i % 4 === 0) {
          const spikeHeight = Math.min(20, (vol / 5));
          // Up-Down spike pattern
          path += `L ${x - step / 2},25 L ${x - step / 4},${25 - spikeHeight} L ${x},${25 + spikeHeight / 2} L ${x + step / 4},25 `;
          continue;
        }
      }

      // Subtle micro-ripples even in silence for "alive" feel
      const ripple = isSilent ? (Math.sin(i + Date.now() / 200) * 0.5) : 0;
      path += `L ${x},${25 + ripple} `;
    }

    return path;
  }, [volume, isSOSActive]);

  return (
    <div className="w-full px-6 py-2 flex items-center justify-between gap-4 bg-transparent mb-2">
      {/* 🏷️ MINIMAL LABEL */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm",
          isSOSActive ? "bg-accent-red/10 text-accent-red" : "bg-[#2563EB]/10 text-[#2563EB]"
        )}>
          <Activity size={16} className={cn(volume > 10 && "")} />
        </div>
        <div className="hidden xs:block">
          <span className="text-[10px] font-black text-gray-900 uppercase italic tracking-tight leading-none block">Voice SOS</span>
          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">
            {isBriefingActive ? 'Kavach Briefing Active' : 'Safety Monitoring Active'}
          </span>
        </div>
      </div>

      {/* 📈 HEARTBEAT WAVEFORM */}
      <div className="flex-1 h-12 flex items-center px-4 relative overflow-visible">
        <svg viewBox="0 0 200 50" className="w-full h-full preserve-3d overflow-visible">
          {/* Background Static Line (Ghost) */}
          <path d="M 0,25 L 200,25" stroke="currentColor" className="text-gray-100" strokeWidth="1" />

          <motion.path
            d={generateHeartbeatPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              opacity: [0.8, 1, 0.8],
              strokeWidth: volume > 10 ? 3 : 2
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] transition-colors duration-300"
          />
        </svg>
      </div>

      {/* 📊 DB LEVEL (COMPACT) */}
      <div className="text-right flex flex-col items-end">
        <span className="text-[12px] font-black text-gray-900 leading-none">
          {isBriefingActive ? '0' : volume.toFixed(0)}
        </span>
        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">dB</span>
      </div>
    </div>
  );
});

VoiceVisualizer.displayName = 'VoiceVisualizer';
export default VoiceVisualizer;
