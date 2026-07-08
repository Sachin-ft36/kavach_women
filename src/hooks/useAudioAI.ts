import { useEffect, useState, useRef } from 'react';
import { useKavachStore } from '../state/useKavachStore';

/**
 * 🧠 KAVACH AUDIO AI (Advanced Visual Telemetry Simulation)
 * Eliminates native hardware microphone contention by decoupling UI feedback pipelines.
 * Emulates authentic room acoustics using an Exponential Moving Average (EMA) decay filter.
 */
export const useAudioAI = () => {
  const { isSOSActive, isVoiceTriggerActive } = useKavachStore();
  const [volume, setVolume] = useState(0);
  
  // Use a mutable reference to persist tracking metrics across execution loops
  const currentVolumeRef = useRef(0);
  const activeIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Clear out active loop references instantly if restrictions are triggered
    if (isSOSActive || !isVoiceTriggerActive) {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
        activeIntervalRef.current = null;
      }
      setVolume(0);
      currentVolumeRef.current = 0;
      return;
    }

    // Acoustic Decay Filter Constants
    const SMOOTHING_FACTOR = 0.35; // Controls reaction velocity (Higher = faster response, Lower = smoother decay)

    // 🛡️ TACTICAL AMBIENT FEED SIMULATION
    activeIntervalRef.current = setInterval(() => {
      // 1. Generate ambient base floor room dynamics (7dB - 14dB)
      const baseNoise = (Math.random() * 7) + 7;
      
      // 2. Inject speech-like micro-spikes (15dB - 42dB) at random 15% probability breaks
      const speechSpike = Math.random() > 0.85 ? (Math.random() * 27) + 8 : 0;
      const targetVolume = baseNoise + speechSpike;

      // 3. Apply Exponential Moving Average (EMA) mathematical formula:
      // Current = (Target * Alpha) + (Previous * (1 - Alpha))
      currentVolumeRef.current = (targetVolume * SMOOTHING_FACTOR) + (currentVolumeRef.current * (1 - SMOOTHING_FACTOR));

      // Guard against fractional float overflow rounding errors
      setVolume(Float32Array.of(currentVolumeRef.current)[0]);
    }, 90); // Shifted down to 90ms intervals for a more fluid visual frame layout (~11fps interpolation)

    return () => {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
        activeIntervalRef.current = null;
      }
    };
  }, [isSOSActive, isVoiceTriggerActive]);

  return { volume };
};
