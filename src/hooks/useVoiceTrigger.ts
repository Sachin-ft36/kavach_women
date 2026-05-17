import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';

/**
 * 🎙️ KAVACH VOICE TRIGGER (Beta)
 * Listens for distress keywords (Help/Bachao) to trigger SOS.
 * Implements 'Hardware Handshake' to prevent Mic clashes.
 */
export const useVoiceTrigger = () => {
  const { 
    isSOSActive, isVoiceTriggerActive, setSOSActive, isHubReady, 
    isBriefingActive, setPendingSOS, isSOSBlocked, pendingSOS 
  } = useKavachStore();
  const recognitionRef = useRef<any>(null);
  const helpCountRef = useRef(0);
  const lastHelpTimeRef = useRef(0);
  const consecutiveAbortsRef = useRef(0);

  useEffect(() => {
    // 🛡️ ROLE GATING: Only Citizens need Voice Trigger Sentinel
    const { role } = useKavachStore.getState();
    const isResponder = role === 'protector' || role === 'super_cell' || role === 'admin';

    const isPending = !!pendingSOS;

    if (!isVoiceTriggerActive || isSOSActive || isResponder || role === null || isBriefingActive || isSOSBlocked || isPending) {
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

            console.log(`🎙️ VOICE SENTINEL HEARD (${isFinal ? 'FINAL' : 'PARTIAL'}): "${transcript}"`);

            // 🛡️ MULTI-LINGUAL DISTRESS PATTERNS (Hindi + English + Phonetic Variations for 'Kavach' & 'Bachao')
            const keywords = [
              'kavach', 'kabach', 'kovach', 'cover', 'cabbage', 'canvas', 'car wash', 'kavat',
              'help', 'emergency', 'मदद', 'बचाओ', 'कवच',
              'bachao', 'bachai', 'machao', 'but y\'all', 'but y', 'bet you', 'what you'
            ];
            
            // Count how many times ANY keyword appears in the current transcript segment
            let segmentDistressCount = 0;
            keywords.forEach(kw => {
              const regex = new RegExp(kw, 'g');
              const matches = transcript.match(regex);
              if (matches) segmentDistressCount += matches.length;
            });

            if (segmentDistressCount > 0) {
              const timeSinceLastDistress = now - lastHelpTimeRef.current;
              
              // 🛡️ DELTA TRACKING: Only count NEW words in the growing transcript
              const lastSegmentCount = (window as any)._kavach_last_segment_count || 0;
              const newWordsCount = Math.max(0, segmentDistressCount - lastSegmentCount);
              (window as any)._kavach_last_segment_count = isFinal ? 0 : segmentDistressCount;

              if (newWordsCount > 0) {
                if (timeSinceLastDistress > 5000) {
                  helpCountRef.current = newWordsCount;
                } else {
                  helpCountRef.current += newWordsCount;
                }
                lastHelpTimeRef.current = now;

                if (Capacitor.isNativePlatform() && isHubReady) {
                  KavachSafe.triggerHapticPulse();
                }

                // 🛡️ SOS SENSITIVITY OVERHAUL: Set threshold to 3 as requested (e.g. "help help help", "kavach help help", "bachao bachao bachao")
                const threshold = 3;
                console.warn(`🎙️ VOICE SENTINEL: Total cumulative distress [${helpCountRef.current}/${threshold}]`);

                if (helpCountRef.current >= threshold) {
                  triggerVoiceSOS();
                  (window as any)._kavach_last_segment_count = 0;
                }
              }
            }
          }
        };

        recognition.onstart = () => {
          console.log("🎙️ VOICE SENTINEL: Tactical mic uplink online.");
          // Reset consecutive aborts after 3 seconds of stable listening
          setTimeout(() => {
            if (recognitionRef.current) {
              consecutiveAbortsRef.current = 0;
            }
          }, 3000);
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'aborted' || e.error === 'audio-capture' || e.error === 'not-allowed') {
            consecutiveAbortsRef.current += 1;
            
            if (e.error === 'not-allowed') {
              toast.error("Microphone Access Denied! Please enable microphone permissions in your browser settings to allow Voice Distress trigger.", {
                id: 'voice-permission-denied',
                duration: 5000
              });
            } else if (e.error === 'audio-capture' && consecutiveAbortsRef.current === 3) {
              toast.error("Microphone hardware busy! Please ensure another application is not using your mic.", {
                id: 'voice-hardware-busy',
                duration: 5000
              });
            }
          }
          
          if (e.error === 'no-speech' || e.error === 'audio-capture' || e.error === 'network' || e.error === 'aborted') {
            console.log(`🎙️ VOICE SENTINEL: Silent recovery from error [${e.error}] (Consecutive: ${consecutiveAbortsRef.current})`);
          } else {
            console.warn(`🎙️ VOICE SENTINEL: Error [${e.error}]. Entering standby.`);
          }
        };

        recognition.onend = () => {
          // 🛡️ AGGRESSIVE RESTART LOOP: If SOS is not active, keep listening ALWAYS
          if (!isSOSActive && isVoiceTriggerActive) {
            // Exponential backoff if aborting persistently
            const delay = consecutiveAbortsRef.current > 3 
              ? Math.min(10000, 2000 * (consecutiveAbortsRef.current - 2)) 
              : 800; // Increased base delay to 800ms for stable hardware release

            console.log(`🎙️ VOICE SENTINEL: Restart scheduled in ${delay}ms...`);

            setTimeout(() => {
              if (recognitionRef.current && isVoiceTriggerActive && !isSOSActive) {
                try { 
                  recognitionRef.current.start(); 
                  console.log("🎙️ VOICE SENTINEL: Continuous listener resumed.");
                } catch (e) { 
                  // If already started, ignore
                }
              }
            }, delay);
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

      // 🛡️ HARDWARE HANDSHAKE: Instant Abort to release Mic BEFORE SOS starts
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try { recognitionRef.current.abort(); } catch (e) { }
        recognitionRef.current = null;
      }

      // Wait for hardware release
      await new Promise(r => setTimeout(r, 800));

      setPendingSOS(true, 'voice');
      helpCountRef.current = 0;
    };

    const startTimeout = setTimeout(() => {
      startListening();
    }, 800);

    return () => {
      clearTimeout(startTimeout);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try { recognitionRef.current.abort(); } catch (e) { }
        recognitionRef.current = null;
      }
    };
  }, [isSOSActive, isVoiceTriggerActive, isHubReady, isBriefingActive, isSOSBlocked, pendingSOS]);
};
