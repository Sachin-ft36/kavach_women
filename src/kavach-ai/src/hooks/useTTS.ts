/**
 * Web Speech API TTS hook. Speaks AI replies in the matching BCP-47 voice.
 */
import { useCallback } from "react";

const LANG_TO_BCP47: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Hinglish: "en-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Gujarati: "gu-IN",
  Punjabi: "pa-IN",
  Marathi: "mr-IN",
  Bengali: "bn-IN",
  Urdu: "ur-IN",
};

export function useTTS() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback((text: string, language: string) => {
    if (!supported || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_TO_BCP47[language] || "en-IN";
      u.rate = 1.0;
      u.pitch = 1.02;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    try { window.speechSynthesis.cancel(); } catch {}
  }, [supported]);

  return { supported, speak, stop };
}
