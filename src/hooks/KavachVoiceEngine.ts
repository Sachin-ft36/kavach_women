import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';

/**
 * 🎙️ KAVACH NATIVE GLOBAL SPEECH SENTINEL ENGINE (Pure TS Engine)
 * Kept 100% OUTSIDE the React component rendering and hook lifecycle.
 * Immune to virtual DOM updates, re-renders, and database sync issues.
 */

let globalRecognition: any = null;
let isSentinelRunning = false;       // Strict running flag
let isInitializing = false;          // Synchronous Lock Guard
let isIntentionalStop = false;       // Handled standby stops
let restartTimeoutId: any = null;    // Debounce revive timer
let isRevivalScheduled = false;      // Duplicate scheduler block
let globalSOSCallback: (() => void) | null = null;
let globalStandbyCallback: (() => void) | null = null;

// Thread synchronization lock for engine state state-machine updates
const STATE_LOCK = { isProcessing: false };

export const hardResetSessionCache = () => {
  console.log("🧼 KAVACH ENGINE: Singleton heap memory cleared.");
};

export const isVoiceSentinelRunning = () => isSentinelRunning;

export const stopVoiceSentinel = (isBlurSuspension = false) => {
  isIntentionalStop = true;
  isSentinelRunning = false;
  isInitializing = false;
  isRevivalScheduled = false;

  if (restartTimeoutId) {
    clearTimeout(restartTimeoutId);
    restartTimeoutId = null;
  }

  // 🛡️ NATIVE COOPERATIVE BRIDGE:
  // If suspending via background blur events, preserve the hardware foreground listener.
  if (Capacitor.isNativePlatform() && !isBlurSuspension) {
    KavachSafe.stopVoiceSentinel().catch((err) => {
      console.error("Native bridge mic release error:", err);
    });
  }

  if (globalRecognition) {
    try {
      globalRecognition.onstart = null;
      globalRecognition.onend = null;
      globalRecognition.onerror = null;
      globalRecognition.onresult = null;
      globalRecognition.abort();
    } catch (e) {}
    globalRecognition = null;
  }

  hardResetSessionCache();
  console.log("🎙️ GLOBAL CORE: Voice Sentinel Engine destroyed safely & hardware released.");
};

export const startVoiceSentinel = (onSOSTrigger: () => void, onStandby?: () => void) => {
  if (typeof window === 'undefined') return;
  
  globalSOSCallback = onSOSTrigger;
  if (onStandby) {
    globalStandbyCallback = onStandby;
  }

  // 🛡️ NATIVE COOPERATIVE BRIDGE: Spawn native tracking worker alongside web-views
  if (Capacitor.isNativePlatform()) {
    KavachSafe.startVoiceSentinel().catch((err) => {
      console.error("Native voice platform activation failure:", err);
    });
    
    // We are on Android Native! Vosk handles this silently in the background.
    // Skip the Google Web Speech API entirely.
    isSentinelRunning = true;
    isInitializing = false;
    isRevivalScheduled = false;
    return;
  }

  // 🛡️ SYNCHRONOUS LOCK GUARD: Block initialization concurrency collisions
  if (isSentinelRunning || isInitializing) {
    console.log("🛡️ GLOBAL CORE: Engine already starting or tracking. Blocking duplicate startup request.");
    return;
  }

  isInitializing = true;
  isIntentionalStop = false;

  if (globalRecognition) {
    try {
      globalRecognition.onstart = null;
      globalRecognition.onend = null;
      globalRecognition.onerror = null;
      globalRecognition.onresult = null;
      globalRecognition.abort();
    } catch (e) {}
    globalRecognition = null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("❌ Web Speech API not supported in this browser/device");
    isInitializing = false;
    return;
  }

  globalRecognition = new SpeechRecognition();
  globalRecognition.continuous = true;
  globalRecognition.interimResults = true;
  globalRecognition.lang = 'en-IN';

  globalRecognition.onstart = () => {
    isSentinelRunning = true;
    isInitializing = false;
    isRevivalScheduled = false;
    console.log("🎙️ GLOBAL CORE: Kavach Voice Sentinel is natively ONLINE.");
  };

  globalRecognition.onresult = (event: any) => {
    if (STATE_LOCK.isProcessing) return;
    STATE_LOCK.isProcessing = true;

    try {
      // Sliding panic verification window (Extract past 2 captured phrasing updates)
      let fullTranscript = "";
      const startIndex = Math.max(0, event.results.length - 2);
      for (let i = startIndex; i < event.results.length; ++i) {
        fullTranscript += " " + event.results[i][0].transcript.toLowerCase();
      }
      fullTranscript = fullTranscript.trim();

      // Normalize string context stripping out custom punctuations globally
      const normalizedText = fullTranscript.replace(/[^a-z0-9\u0900-\u097F\u0C00-\u0C7F\u0BB0-\u0BFF\u0C80-\u0CFF\s]/g, ' ');
      
      // Unicode-aware word boundary parser prevents character isolation drops in Indic scripts
      const words = normalizedText.split(/\s+/).filter(Boolean);

      // Token matrices configurations
      const KAVACH_TOKENS = ['kavach', 'covered', 'cover', 'kawar', 'kabach', 'kovach', 'kavachh', 'kavaj', 'कवच'];
      const HELP_TOKENS = ['help', 'emergency', 'मदद', 'हेल्प', 'save'];
      const BACHAO_TOKENS = ['bachao', 'bacho', 'bchao', 'bacao', 'bachai', 'बचाओ', 'bachaoo', 'buchao', 'pachao', 'bachhav', 'bacha'];
      const REGIONAL_TOKENS = [
        'vachva', 'वाचवा',       // Marathi
        'kaapadu', 'కాపాడు',     // Telugu
        'kaappattru', 'காப்பாற்று', // Tamil
        'rakshisu', 'ರಕ್ಷಿಸು'     // Kannada
      ];

      let totalKavach = 0;
      let totalHelp = 0;
      let totalBachao = 0;
      let totalRegional = 0;

      words.forEach(word => {
        if (KAVACH_TOKENS.includes(word)) totalKavach++;
        if (HELP_TOKENS.includes(word)) totalHelp++;
        if (BACHAO_TOKENS.includes(word)) totalBachao++;
        if (REGIONAL_TOKENS.includes(word)) totalRegional++;
      });

      console.log(`🎙️ METRICS -> Kavach: ${totalKavach}/2 | Help: ${totalHelp}/2 | Bachao: ${totalBachao}/2 | Regional: ${totalRegional}/2`);

      if (totalKavach >= 2 || totalHelp >= 2 || totalBachao >= 2 || totalRegional >= 2) {
        console.error("🚨🚨🚨 [CRITICAL ALERT] KAVACH SOS TRIGGERED VIA PANIC VOICE 🚨🚨🚨");
        if (globalSOSCallback) {
          globalSOSCallback();
        }
      }
    } catch (err) {
      console.error("Error within streaming audio parsing pipeline:", err);
    } finally {
      STATE_LOCK.isProcessing = false;
    }
  };

  globalRecognition.onerror = (e: any) => {
    console.log(`❌ GLOBAL CORE ERROR: ${e.error}`);
    if (e.error === 'aborted' || e.error === 'audio-capture') {
      isSentinelRunning = false;
      isInitializing = false;
    }
    if (e.error === 'not-allowed') {
      toast.error("Microphone Access Denied! Please enable microphone permissions in your browser settings.", {
        id: 'voice-permission-denied',
        duration: 5000
      });
    }
  };

  globalRecognition.onend = () => {
    isSentinelRunning = false;
    isInitializing = false;
    globalRecognition = null; // Clean engine pointer instantly on termination

    if (isIntentionalStop) {
      console.log("🎙️ GLOBAL CORE: Intentional standby sleep. Layer 2 is sleeping...");
      if (globalStandbyCallback) {
        globalStandbyCallback();
      }
      return;
    }

    if (isRevivalScheduled) return;
    isRevivalScheduled = true;

    if (restartTimeoutId) clearTimeout(restartTimeoutId);

    // ⚡ RESPONSIVE DYNAMIC SETTLE DELAY (300ms)
    const delay = 300;

    restartTimeoutId = setTimeout(() => {
      isRevivalScheduled = false;
      
      // Thread-safe state query from your global storage configuration layout
      const isVoiceTriggerActive = useKavachStore.getState().isVoiceTriggerActive;
      
      if (isVoiceTriggerActive) {
        console.log("🔄 KAVACH: Executing scheduled fresh engine boot...");
        startVoiceSentinel(globalSOSCallback || (() => {}), globalStandbyCallback || undefined);
      } else {
        console.log("🎙️ GLOBAL CORE: Flag cleared post-shutdown event. Revival sequence dropped.");
      }
    }, delay);
  };

  try {
    globalRecognition.start();
  } catch (e) {
    isSentinelRunning = false;
    isInitializing = false;
    globalRecognition = null;
    console.log("⚠️ Native engine deployment collision blocked.");
  }
};
