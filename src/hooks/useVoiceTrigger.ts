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
  const { isSOSActive, isVoiceTriggerActive, setSOSActive, isHubReady, isBriefingActive, setPendingSOS } = useKavachStore();
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
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const now = Date.now();
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            const isFinal = event.results[i].isFinal;

            if (!isFinal) {
              console.log(`🎙️ VOICE PARTIAL: "${transcript}"`);
            }

            // 🛡️ ADAPTIVE PATTERN RECOGNITION
            const isKavachDistress = transcript.includes('kavach help') || transcript.includes('kavach');
            const isGenericDistress = ['help me', 'emergency', 'bachao', 'help help'].some(kw => transcript.includes(kw));

            if (isKavachDistress || isGenericDistress) {
              // 🛡️ TACTICAL DEBOUNCE: 1.5s between detections
              if (now - lastHelpTimeRef.current > 1500) {
                helpCountRef.current++;
                lastHelpTimeRef.current = now;
                
                if (Capacitor.isNativePlatform() && isHubReady) {
                  KavachSafe.triggerHapticPulse();
                }
                
                // 🛡️ ADAPTIVE THRESHOLD: Kavach triggers on 2, Generic on 3
                const threshold = isKavachDistress ? 2 : 3;
                console.warn(`🎙️ VOICE SENTINEL: Distress detected [${helpCountRef.current}/${threshold}]`);

                if (helpCountRef.current >= threshold) {
                  triggerVoiceSOS();
                }
              }
            }
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'not-allowed') {
            console.warn("🎙️ VOICE SENTINEL: Hardware Access Pending/Denied. Entering Standby.");
          }
          if (e.error === 'network') {
            console.warn("🎙️ VOICE SENTINEL: Link Unstable. Retrying...");
          }
        };

        recognition.onend = () => {
          if (!isSOSActive && isVoiceTriggerActive) {
            // 🛡️ TACTICAL BACK-OFF: Wait 10s to avoid system-level mic clashes
            setTimeout(() => {
              try { recognition.start(); } catch (e) { }
            }, 10000);
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

      setPendingSOS(true, 'voice');
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
