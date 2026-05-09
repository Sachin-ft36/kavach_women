import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { KavachSafe } from '../App';

/**
 * 🎙️ KAVACH VOICE TRIGGER (Beta)
 * Listens for distress keywords (Help/Bachao) to trigger SOS.
 * Implements 'Hardware Handshake' to prevent Mic clashes.
 */
export const useVoiceTrigger = () => {
  const { isSOSActive, isVoiceTriggerActive, setSOSActive, isHubReady, isBriefingActive } = useKavachStore();
  const recognitionRef = useRef<any>(null);
  const helpCountRef = useRef(0);
  const lastHelpTimeRef = useRef(0);

  useEffect(() => {
    // 🛡️ ROLE GATING: Only Citizens need Voice Trigger Sentinel
    const { role } = useKavachStore.getState();
    const isResponder = role === 'protector' || role === 'super_cell' || role === 'admin';

    if (!isVoiceTriggerActive || isSOSActive || isResponder || role === null || isBriefingActive) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const startListening = () => {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Optimized for common distress calls

        recognition.onresult = (event: any) => {
          const now = Date.now();
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.toLowerCase();

            // 🚨 DISTRESS KEYWORD DETECTION
            const isKavachDistress = transcript.includes('kavach help') || transcript.includes('kavach');
            const isGenericDistress = transcript.includes('help') || transcript.includes('bachao') || transcript.includes('emergency');

            if (isKavachDistress || isGenericDistress) {
              if (now - lastHelpTimeRef.current > 1500) { // Faster debounce for tactical response
                helpCountRef.current++;
                lastHelpTimeRef.current = now;

                console.warn(`🎙️ VOICE SENTINEL: Distress detected! [${helpCountRef.current}/${isKavachDistress ? '2' : '3'}]`);

                if (Capacitor.isNativePlatform() && isHubReady) {
                  KavachSafe.triggerHapticPulse();
                }

                // Adaptive Threshold: 'Kavach Help' triggers on 2, generic on 3
                const threshold = isKavachDistress ? 2 : 3;
                if (helpCountRef.current >= threshold) {
                  triggerVoiceSOS();
                }
              }
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'not-allowed') {
            console.error("Mic Permission Denied for Voice Trigger");
          }
        };

        recognition.onend = () => {
          if (!isSOSActive && isVoiceTriggerActive) {
            setTimeout(() => {
              try { recognition.start(); } catch (e) { }
            }, 1000);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.error("Voice Trigger initialization failed:", e);
      }
    };

    const triggerVoiceSOS = async () => {
      console.error("🚨 VOICE TRIGGER: CRITICAL THRESHOLD REACHED. DISPATCHING SOS.");

      // 🛡️ HARDWARE HANDSHAKE: Release Mic BEFORE SOS starts
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Wait for hardware release
      await new Promise(r => setTimeout(r, 500));

      setSOSActive(true, null, 'voice');
      helpCountRef.current = 0;
    };

    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isSOSActive, isVoiceTriggerActive, isHubReady, isBriefingActive]);
};
