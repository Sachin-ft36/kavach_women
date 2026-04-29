import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from 'sonner';

const KavachNative = registerPlugin<any>('KavachPlugin');

/**
 * 🎙️ KAVACH VOICE TRIGGER (Beta)
 * Listens for distress keywords (Help/Bachao) to trigger SOS.
 * Implements 'Hardware Handshake' to prevent Mic clashes.
 */
export const useVoiceTrigger = () => {
  const { isSOSActive, isVoiceTriggerActive, setSOSActive, isHubReady } = useKavachStore();
  const recognitionRef = useRef<any>(null);
  const helpCountRef = useRef(0);
  const lastHelpTimeRef = useRef(0);

  useEffect(() => {
    // 1. Only listen if enabled and NOT already in SOS
    if (!isVoiceTriggerActive || isSOSActive) {
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
            if (transcript.includes('help') || transcript.includes('bachao') || transcript.includes('emergency')) {
              if (now - lastHelpTimeRef.current > 2000) { // Debounce
                helpCountRef.current++;
                lastHelpTimeRef.current = now;
                
                console.warn(`🎙️ VOICE SENTINEL: Distress detected! [${helpCountRef.current}/3]`);
                
                if (Capacitor.isNativePlatform() && isHubReady) {
                    KavachNative.triggerHapticPulse().catch(() => {});
                }

                if (helpCountRef.current >= 3) {
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
                try { recognition.start(); } catch(e) {}
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
  }, [isSOSActive, isVoiceTriggerActive, isHubReady]);
};
