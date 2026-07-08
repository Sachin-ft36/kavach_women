/**
 * Web Speech API STT hook (Chrome / Capacitor Android WebView).
 * Returns supported=false on iOS WKWebView — swap to capacitor-community/speech-recognition
 * if you need iOS support.
 */
import { useCallback, useEffect, useRef, useState } from "react";

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

type SR = any;

function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - SpeechRecognition is non-standard
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useVoiceSTT(opts: {
  language: string;
  onFinal: (text: string) => void;
  onPartial?: (text: string) => void;
}) {
  const [supported] = useState<boolean>(() => !!getSR());
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const recRef = useRef<any>(null);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) return false;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = LANG_TO_BCP47[opts.language] || "en-IN";

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) {
        setPartial(interim);
        opts.onPartial?.(interim);
      }
      if (final) {
        setPartial("");
        setListening(false);
        opts.onFinal(final.trim());
      }
    };
    rec.onerror = () => { setListening(false); setPartial(""); };
    rec.onend = () => { setListening(false); };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
      setPartial("");
      return true;
    } catch {
      setListening(false);
      return false;
    }
  }, [opts]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, partial, start, stop };
}
