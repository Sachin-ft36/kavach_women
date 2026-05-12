import { useEffect, useRef, useState } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../App';

/**
 * 🧠 KAVACH AUDIO AI (Advanced Stress Detection)
 */
export const useAudioAI = () => {
  const { isSOSActive, setSOSActive, isHubReady, role, user, isSOSBlocked } = useKavachStore();
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const stressPersistenceRef = useRef<number>(0);

  useEffect(() => {
    const stopAnalysis = () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      setVolume(0);
    };

    const { isVoiceTriggerActive } = useKavachStore.getState();
    if (role !== 'citizen' || isSOSActive || !isVoiceTriggerActive || !user || isSOSBlocked) {
      stopAnalysis();
      return;
    }

    const startAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        analyzeLoop();
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          console.warn("🧠 AUDIO_AI: Microphone access standby. (Permission Pending)");
        } else {
          console.error("🧠 AUDIO_AI: Hardware Access Denied", err);
        }
      }
    };

    const analyzeLoop = () => {
      if (analyserRef.current && dataArrayRef.current) {
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        analyser.getByteFrequencyData(dataArray as any);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const averageAmplitude = sum / dataArray.length;
        setVolume(averageAmplitude);

        let highFreqSum = 0;
        for (let i = 100; i < dataArray.length; i++) {
          highFreqSum += dataArray[i];
        }
        const highFreqEnergy = highFreqSum / (dataArray.length - 100);

        if (averageAmplitude > 75 && highFreqEnergy > 45) {
          stressPersistenceRef.current += 1;
          if (stressPersistenceRef.current > 60) { // Optimized sensitivity
            triggerAISOS();
          }
        } else {
          stressPersistenceRef.current = Math.max(0, stressPersistenceRef.current - 2);
        }
      }

      if (audioContextRef.current && !isSOSActive) {
        requestAnimationFrame(analyzeLoop);
      }
    };

    const triggerAISOS = () => {
      if (Capacitor.isNativePlatform() && isHubReady) {
        KavachSafe.triggerHapticPulse();
      }
      setSOSActive(true, null, 'voice');
      stopAnalysis();
    };

    startAnalysis();
    return () => stopAnalysis();
  }, [isSOSActive, isHubReady, role, user, isSOSBlocked]);

  return { volume };
};
