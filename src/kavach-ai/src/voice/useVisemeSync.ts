// ============================================================
// useVisemeSync.ts — Maps TTS text characters to Viseme keys
// Reads TTS text chunks and emits the current active Viseme
// for OrbFace/MouthRig to animate in sync with speech output.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import type { Viseme } from "../components/KavachOrb/face/FaceTypes";

// Phoneme-to-viseme mapping (simplified English rules)
const CHAR_TO_VISEME: Record<string, Viseme> = {
  a: "aa", e: "ee", i: "aa", o: "oh", u: "oo",
  m: "rest", b: "rest", p: "rest",
  f: "ff",  v: "ff",
  t: "th",  h: "th", d: "th",
  s: "ss",  z: "ss", c: "ss", x: "ss",
  n: "nn",  l: "nn", r: "nn",
  k: "kk",  g: "kk", q: "kk",
  w: "oo",  y: "ee",
};

function charToViseme(char: string): Viseme {
  return CHAR_TO_VISEME[char.toLowerCase()] ?? "rest";
}

interface UseVisemeSyncOptions {
  /** The text currently being spoken by TTS */
  speakingText: string;
  /** Whether TTS is actively speaking */
  isSpeaking: boolean;
  /** Approximate ms per character at current TTS rate */
  msPerChar?: number;
}

export function useVisemeSync({
  speakingText,
  isSpeaking,
  msPerChar = 65,
}: UseVisemeSyncOptions): Viseme {
  const [viseme, setViseme] = useState<Viseme>("rest");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSpeaking || !speakingText) {
      clearTimer();
      indexRef.current = 0;
      setViseme("rest");
      return;
    }

    indexRef.current = 0;

    function advanceChar() {
      const idx = indexRef.current;
      if (idx >= speakingText.length) {
        setViseme("rest");
        return;
      }

      const char = speakingText[idx];
      setViseme(charToViseme(char));
      indexRef.current = idx + 1;

      timerRef.current = setTimeout(advanceChar, msPerChar);
    }

    advanceChar();

    return clearTimer;
  }, [speakingText, isSpeaking, msPerChar, clearTimer]);

  return viseme;
}
