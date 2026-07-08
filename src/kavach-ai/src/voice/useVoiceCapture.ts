// ============================================================
// useVoiceCapture.ts — Web Audio API microphone capture hook
// Handles getUserMedia, AudioContext, and AnalyserNode setup.
// Returns volume level (0–1) and raw AnalyserNode for downstream.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

export interface VoiceCaptureState {
  /** Normalized RMS volume 0→1 */
  volume: number;
  /** Whether microphone is currently active */
  isCapturing: boolean;
  /** Error message if capture fails */
  error: string | null;
  /** Start capturing from microphone */
  start: () => Promise<void>;
  /** Stop capturing */
  stop: () => void;
  /** Raw analyser for downstream processors (VAD, viseme, FFT) */
  analyserRef: React.RefObject<AnalyserNode | null>;
}

const FFT_SIZE        = 256;
const SMOOTHING       = 0.8;
const VOLUME_INTERVAL = 50; // ms between volume samples

export function useVoiceCapture(): VoiceCaptureState {
  const [volume, setVolume]           = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const streamRef    = useRef<MediaStream | null>(null);
  const ctxRef       = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const sourceRef    = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});

    streamRef.current   = null;
    ctxRef.current      = null;
    analyserRef.current = null;
    sourceRef.current   = null;
    dataArrayRef.current = null;

    setVolume(0);
    setIsCapturing(false);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const ctx     = new AudioContext();
      const source  = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();

      analyser.fftSize        = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      streamRef.current    = stream;
      ctxRef.current       = ctx;
      analyserRef.current  = analyser;
      sourceRef.current    = source;
      dataArrayRef.current = dataArray;

      setIsCapturing(true);

      // Poll RMS volume at VOLUME_INTERVAL cadence
      intervalRef.current = setInterval(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const sample = (dataArrayRef.current[i] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        setVolume(Math.min(rms * 4, 1)); // scale RMS to 0–1 range
      }, VOLUME_INTERVAL);
    } catch (err: any) {
      setError(err?.message ?? "Microphone access denied.");
      setIsCapturing(false);
    }
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { volume, isCapturing, error, start, stop, analyserRef };
}
