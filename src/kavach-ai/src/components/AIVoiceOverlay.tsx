import React, { useState } from "react";
import { useKavachAI } from "../KavachAIProvider";
import { useVoiceSTT } from "../hooks/useVoiceSTT";
import { useTTS } from "../hooks/useTTS";

export function AIVoiceOverlay() {
  const { voiceOpen, chatOpen, closeVoice, sendMessage, isStreaming, messages, preferredLanguage } = useKavachAI();
  const tts = useTTS();
  const [transcript, setTranscript] = useState("");

  const stt = useVoiceSTT({
    language: preferredLanguage,
    onPartial: (t) => setTranscript(t),
    onFinal: (t) => { setTranscript(""); sendMessage(t); },
  });

  if (!voiceOpen || chatOpen) return null;

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const showText = lastAssistant?.display ?? lastAssistant?.text ?? "";

  const state: "listening" | "processing" | "speaking" = stt.listening
    ? "listening"
    : isStreaming
    ? "processing"
    : lastAssistant && !lastAssistant.streaming
    ? "speaking"
    : "listening";

  const submit = () => {
    const t = transcript.trim();
    if (!t) return;
    setTranscript("");
    sendMessage(t);
  };

  return (
    <div className="kai-voice" data-testid="kavach-ai-voice-overlay">
      <div className="kai-voice__top">
        <div className="kai-voice__label">
          {state === "listening" ? "LISTENING" : state === "processing" ? "THINKING" : "SPEAKING"}
        </div>
        <button data-testid="kavach-ai-voice-close" className="kai-icon-btn kai-icon-btn--ghost" onClick={closeVoice} type="button" aria-label="Close">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="kai-voice__center">
        <div className={`kai-voice__orb-stack kai-voice__orb-stack--${state}`}>
          <div className="kai-voice__ring-outer" />
          <div className="kai-voice__ring-spinner" />
          <div className="kai-voice__core">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" />
            </svg>
          </div>
        </div>

        <div className="kai-voice__helper">
          {stt.listening && "Listening… speak now."}
          {!stt.listening && state === "listening" && (stt.supported
            ? "Tap the mic to speak — or type below."
            : "Speech recognition unavailable on this device. Type below.")}
          {state === "processing" && "Working on it…"}
          {state === "speaking" && "Tap replay to hear again."}
        </div>

        {!!stt.partial && <div className="kai-voice__partial">{stt.partial}</div>}

        {!!showText && (
          <div className="kai-voice__transcript">{showText}</div>
        )}
      </div>

      <div className="kai-voice__bottom">
        <div className="kai-voice__quick">
          {["Open Ride Safe", "Call Mom", "Share location", "Trigger SOS"].map((q) => (
            <button key={q} className="kai-suggestion" onClick={() => sendMessage(q)} type="button">{q}</button>
          ))}
        </div>

        <div className="kai-voice__input-row">
          <input
            data-testid="kavach-ai-voice-input"
            type="text"
            className="kai-input kai-input--single"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={stt.listening ? "Listening…" : "Speak with KAVACH…"}
            disabled={stt.listening}
          />
          {stt.supported && (
            <button
              data-testid="kavach-ai-voice-mic"
              type="button"
              className={`kai-icon-btn ${stt.listening ? "kai-icon-btn--danger" : "kai-icon-btn--accent-outline"}`}
              onClick={() => (stt.listening ? stt.stop() : stt.start())}
              aria-label={stt.listening ? "Stop" : "Speak"}
            >
              {stt.listening ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 11a7 7 0 0 1-14 0M12 18v4" /></svg>
              )}
            </button>
          )}
          <button
            data-testid="kavach-ai-voice-replay"
            type="button"
            className="kai-icon-btn kai-icon-btn--ghost"
            onClick={() => showText && tts.speak(showText, preferredLanguage)}
            aria-label="Replay"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
          </button>
          <button
            data-testid="kavach-ai-voice-send"
            type="button"
            className="kai-icon-btn kai-icon-btn--accent"
            onClick={submit}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
