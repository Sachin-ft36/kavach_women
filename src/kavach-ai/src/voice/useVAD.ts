// ============================================================
// useVAD.ts — Voice Activity Detection hook
// Reads volume from useVoiceCapture to emit isSpeaking signal.
// Uses energy threshold + hold-off timer to debounce silence.
// ============================================================

import { useState, useEffect, useRef } from "react";

interface VADOptions {
  /** Volume 0–1 from useVoiceCapture */
  volume: number;
  /** Whether capture is active */
  isCapturing: boolean;
  /** RMS threshold to classify as speech (default 0.05) */
  threshold?: number;
  /** Ms of silence before isSpeaking → false (default 800) */
  silenceHoldMs?: number;
}

export function useVAD({
  volume,
  isCapturing,
  threshold = 0.05,
  silenceHoldMs = 800,
}: VADOptions): boolean {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isCapturing) {
      setIsSpeaking(false);
      return;
    }

    if (volume >= threshold) {
      // Cancel any pending silence hold-off
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsSpeaking(true);
    } else {
      // Start silence hold-off timer only once
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          setIsSpeaking(false);
          silenceTimerRef.current = null;
        }, silenceHoldMs);
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [volume, isCapturing, threshold, silenceHoldMs]);

  return isSpeaking;
}
