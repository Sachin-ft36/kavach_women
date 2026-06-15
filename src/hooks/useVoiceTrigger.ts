import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { startVoiceSentinel, stopVoiceSentinel, isVoiceSentinelRunning } from './KavachVoiceEngine';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';

/**
 * 🎙️ KAVACH COOPERATIVE VOICE SENTINEL HOOK
 * Manages the transition between Passive decibel metering (Layer 1) and Speech Recognition (Layer 2).
 */

export const useVoiceTrigger = () => {
  const {
    isSOSActive, isVoiceTriggerActive, isBriefingActive, setPendingSOS, 
    isSOSBlocked, pendingSOS, performanceMode, role, user, isRegistered, isHardwareSynced, isVerified
  } = useKavachStore();

  // Create absolute thread-safe immutable reference points for loop processes
  const isVoiceTriggerActiveRef = useRef(isVoiceTriggerActive);
  const isSOSActiveRef = useRef(isSOSActive);
  const isBriefingActiveRef = useRef(isBriefingActive);
  const isSOSBlockedRef = useRef(isSOSBlocked);
  const pendingSOSRef = useRef(!!pendingSOS);
  const performanceModeRef = useRef(performanceMode);

  // Native hardware asset tracking bindings scoped securely within instance refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastAudioActivityRef = useRef<number>(0);
  const isHandoffInProgressRef = useRef<boolean>(false);
  const isVerifiedRef = useRef(isVerified);

  useEffect(() => {
    isVoiceTriggerActiveRef.current = isVoiceTriggerActive;
    isSOSActiveRef.current = isSOSActive;
    isBriefingActiveRef.current = isBriefingActive;
    isSOSBlockedRef.current = isSOSBlocked;
    pendingSOSRef.current = !!pendingSOS;
    performanceModeRef.current = performanceMode;
    isVerifiedRef.current = isVerified;
  }, [isVoiceTriggerActive, isSOSActive, isBriefingActive, isSOSBlocked, pendingSOS, performanceMode, isVerified]);

  useEffect(() => {
    // 🛡️ ROLE GATING: Only Citizens require the voice monitoring layer
    const isResponder = 
      role === 'protector' || 
      role === 'super_cell' || 
      role === 'admin';

    if (isResponder) {
      if (isVoiceTriggerActive) {
        console.log("🛡️ VOICE SENTINEL: Responder profile. Revoking voice configuration permissions.");
        useKavachStore.getState().setVoiceTriggerActive(false);
      }
      stopPassiveAudioGate();
      stopVoiceSentinel();
      return;
    }

    async function triggerVoiceSOS() {
      console.error("🚨 VOICE TRIGGER: CRITICAL THRESHOLD REACHED. DISPATCHING SOS.");
      stopVoiceSentinel();
      stopPassiveAudioGate();
      
      // Delay allows native audio drivers to clear before launching alarms
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPendingSOS(true, 'voice');
    }

    function stopPassiveAudioGate() {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (e) {
          console.warn("Error releasing AudioContext runtime allocation:", e);
        }
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.warn("Error closing media collection audio tracks:", e);
        }
        streamRef.current = null;
      }
      analyserRef.current = null;
      isHandoffInProgressRef.current = false;
      console.log("🎙️ PASSIVE GATE: Natively shut down & audio hardware streams fully closed.");
    }

    function resumePassiveAudioGate() {
      isHandoffInProgressRef.current = false;
      if (
        isVoiceTriggerActiveRef.current && 
        !isSOSActiveRef.current && 
        !isResponder && 
        !isBriefingActiveRef.current && 
        !isSOSBlockedRef.current && 
        !pendingSOSRef.current && 
        document.hasFocus()
      ) {
        console.log("🔄 HANDOFF: Resuming Passive Audio decibel meter...");
        initGlobalSentinel();
      }
    }

    const initGlobalSentinel = async () => {
      if (!document.hasFocus()) {
        console.log("📡 KAVACH: Tab out of focus. Holding Speech Sentinel on standby...");
        return;
      }

      const hasSeenIntro = localStorage.getItem('kavach_intro_seen') === 'true';
      if (
        !isVoiceTriggerActiveRef.current || 
        isSOSActiveRef.current || 
        isResponder || 
        role === null || 
        isBriefingActiveRef.current || 
        isSOSBlockedRef.current || 
        pendingSOSRef.current || 
        !user || 
        !isRegistered || 
        !isHardwareSynced || 
        !isVerifiedRef.current || 
        !hasSeenIntro
      ) {
        return;
      }

      const usePassiveGate = performanceModeRef.current === 'auto' || performanceModeRef.current === 'power_save';

      if (!usePassiveGate) {
        console.log("🎙️ SENTINEL: Running High-Precision Engine continuously (Bypassing Layer 1)...");
        startVoiceSentinel(triggerVoiceSOS);
        return;
      }

      // 🛡️ NATIVE COOPERATIVE BRIDGE
      // If we are on Android Native, we don't need React's Passive Gate.
      // Vosk handles background listening 24/7 autonomously.
      if (Capacitor.isNativePlatform()) {
        console.log("🎙️ NATIVE OVERRIDE: React Passive Gate disabled. Vosk Native Engine is active.");
        startVoiceSentinel(triggerVoiceSOS);
        return;
      }

      // Safeguard against overlapping background loops
      if (!streamRef.current && !isHandoffInProgressRef.current) {
        try {
          const hardwareStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });

          streamRef.current = hardwareStream;
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(hardwareStream);
          const analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 256;
          source.connect(analyserNode);
          analyserRef.current = analyserNode;

          const bufferLength = analyserNode.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudioLevel = async () => {
            // Guard execution against external toggle modifications
            if (!analyserRef.current || !isVoiceTriggerActiveRef.current) {
              stopPassiveAudioGate();
              return;
            }

            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const averageVolume = sum / bufferLength;

            if (averageVolume > 22) {
              lastAudioActivityRef.current = Date.now();
              if (!isVoiceSentinelRunning() && !isHandoffInProgressRef.current) {
                isHandoffInProgressRef.current = true;

                console.log("🔄 HANDOFF: Loud audio detected (>22). Releasing Layer 1 hardware lock...");
                stopPassiveAudioGate();

                setTimeout(() => {
                  if (isVoiceTriggerActiveRef.current && !isSOSActiveRef.current && document.hasFocus()) {
                    console.log("🔄 HANDOFF: Lock cleared. Waking up High-Precision Sentinel Engine (Layer 2)...");
                    startVoiceSentinel(triggerVoiceSOS, resumePassiveAudioGate);
                  } else {
                    isHandoffInProgressRef.current = false;
                  }
                }, 400);
              }
            } else {
              if (isVoiceSentinelRunning()) {
                const timeSinceLastActivity = Date.now() - lastAudioActivityRef.current;
                if (timeSinceLastActivity > 8000) {
                  console.log("🎙️ PASSIVE GATE: Standby timeout reached. Reverting control to Layer 1 decibel gate...");
                  stopVoiceSentinel();
                }
              }
            }

            if (analyserRef.current) {
              animationFrameIdRef.current = requestAnimationFrame(checkAudioLevel);
            }
          };

          checkAudioLevel();
        } catch (err) {
          console.error("🎙️ PASSIVE GATE: Audio Gate initialization failed:", err);
          startVoiceSentinel(triggerVoiceSOS);
        }
      }
    }

    const handleWindowFocus = () => {
      if (isVoiceTriggerActiveRef.current && !isSOSActiveRef.current) {
        console.log("📡 KAVACH: Tab focused. Resuming Speech Sentinel...");
        initGlobalSentinel();
      }
    };

    const handleWindowBlur = () => {
      console.log("📡 KAVACH: Tab blurred. Suspending active Speech Sentinel...");
      if (!Capacitor.isNativePlatform()) {
          stopVoiceSentinel(true);
          stopPassiveAudioGate();
      }
    };

    const hasSeenIntro = localStorage.getItem('kavach_intro_seen') === 'true';
    if (isVoiceTriggerActive && user && isRegistered && isHardwareSynced && isVerified && hasSeenIntro) {
      if (document.hasFocus()) {
        initGlobalSentinel();
      } else {
        console.log("📡 KAVACH: Tab booted in background. Holding Speech Sentinel on standby...");
      }
    } else {
      stopPassiveAudioGate();
      stopVoiceSentinel();
    }

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Enforce clean resource resets on every component unmount or state shift
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      stopPassiveAudioGate();
    };
  }, [isVoiceTriggerActive, isSOSActive, isBriefingActive, isSOSBlocked, pendingSOS, role, user, isRegistered, isHardwareSynced, isVerified]);
};
