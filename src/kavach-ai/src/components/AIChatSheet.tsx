import React, { useEffect, useRef, useState, useMemo } from "react";
import { useKavachAI, type Msg } from "../KavachAIProvider";
import { ActionChip } from "./ActionChip";
import { X, Mic, Sparkles, Send, Shield, User, MapPin } from "lucide-react";
import { KavachOrb, resolveOrbConfig, type OrbState } from "./KavachOrb";
import { AuroraBackground } from "./background/AuroraBackground";
import { useOrbSpring } from "../motion/useOrbSpring";
import { useVoiceCapture } from "../voice/useVoiceCapture";
import { useVAD } from "../voice/useVAD";
import { useVisemeSync } from "../voice/useVisemeSync";
import { BrainOrchestrator } from "../brain/orchestration/BrainOrchestrator";
import { MemoryStore } from "../brain/memory/MemoryStore";
import { LocalStorageAdapter } from "../core/StorageAdapter";
import { capabilityDetector } from "../core/CapabilityDetector";
import { useVoiceSTT } from "../hooks/useVoiceSTT";

export function AIChatSheet() {
  const { chatOpen, closeChat, messages, sendMessage, isStreaming, userName, openVoice, closeVoice, emergencyMode, preferredLanguage } = useKavachAI();
  const [text, setText] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [quality, setQuality] = useState<"low" | "balanced" | "high" | "ultra">("balanced");
  const [customEmotion, setCustomEmotion] = useState<any>(undefined);
  const [ttsText, setTtsText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const stt = useVoiceSTT({
    language: preferredLanguage || "English",
    onPartial: (t) => setText(t),
    onFinal: (t) => {
      const trimmed = t.trim();
      if (trimmed) {
        setText("");
        sendMessage(trimmed);
      }
    },
  });

  // ── Capability detection on mount ──────────────────────────────
  useEffect(() => {
    capabilityDetector.detect().then((stats) => setQuality(stats.quality));
  }, []);

  // ── Brain engine (singleton per chat session) ──────────────────
  const brain = useMemo(() => {
    const adapter = new LocalStorageAdapter("kavach:");
    const memory = new MemoryStore(adapter);
    memory.load();
    return new BrainOrchestrator(memory, {
      currentScreen: "AIChatSheet",
      language: "en",
      userName,
    });
  }, [userName]);

  // ── Voice pipeline ─────────────────────────────────────────────
  const voice = useVoiceCapture();
  const talking = useVAD({ volume: voice.volume, isCapturing: voice.isCapturing });
  const viseme = useVisemeSync({ speakingText: ttsText, isSpeaking: orbState === "speaking" });

  // orbSpring removed — spring animations handled internally by KavachOrb

  // ── Orb state machine driven by AI + emergency + STT ───────────
  useEffect(() => {
    if (emergencyMode) {
      setOrbState("emergency");
    } else if (stt.listening || (talking && voice.isCapturing)) {
      setOrbState("listening");
    } else if (isStreaming) {
      setOrbState("thinking");
    } else {
      setOrbState("idle");
    }
  }, [emergencyMode, isStreaming, talking, voice.isCapturing, stt.listening]);

  // ── Sync TTS speaking state to Orb face animation ──────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const interval = setInterval(() => {
      const activeSpeaking = window.speechSynthesis.speaking;
      if (activeSpeaking) {
        setOrbState("speaking");
        const lastMsg = [...messages].reverse().find(m => m.role === "assistant" && !m.streaming);
        if (lastMsg) {
          setTtsText(lastMsg.display || lastMsg.text);
        }
      } else {
        setOrbState(prev => {
          if (prev === "speaking") {
            setTtsText("");
            return "idle";
          }
          return prev;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [messages]);

  useEffect(() => {
    if (chatOpen && listRef.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [chatOpen, messages.length]);

  if (!chatOpen) return null;

  const onSend = async () => {
    const t = text.trim();
    if (!t || isStreaming) return;
    setText("");

    // Custom expression easter egg keyword matching!
    const lower = t.toLowerCase();
    if (lower.includes("chidae") || lower.includes("tease") || lower.includes("tongue") || lower.includes("mzak") || lower.includes("funny")) {
      setCustomEmotion("teasing");
    } else if (lower.includes("cry") || lower.includes("rone") || lower.includes("sad") || lower.includes("tear") || lower.includes("pain")) {
      setCustomEmotion("crying");
    } else if (lower.includes("wait") || lower.includes("sabar") || lower.includes("bored")) {
      setCustomEmotion("waiting");
    } else if (lower.includes("angry") || lower.includes("gussa") || lower.includes("fight")) {
      setCustomEmotion("alert");
    } else if (lower.includes("smile") || lower.includes("happy") || lower.includes("laugh") || lower.includes("hanso")) {
      setCustomEmotion("happy");
    } else {
      setCustomEmotion(undefined);
    }

    // Run through Brain before sending to LLM
    const result = await brain.process(t);

    // If brain flags emergency, trigger emergency state
    if (result.safetyScore.recommendedState === "emergency") {
      setOrbState("emergency");
    } else if (result.safetyScore.recommendedState === "warning") {
      setOrbState("warning");
    } else {
      setOrbState("thinking");
    }

    sendMessage(t);

    // After response expected — transition to speaking → idle
    if (result.safetyScore.recommendedState === "idle") {
      setTimeout(() => setOrbState("speaking"), 1200);
      setTimeout(() => {
        setOrbState("idle");
        setTtsText("");
        setCustomEmotion(undefined); // reset funny expression
      }, 5000);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Determine layout state based on message count
  const layoutState: "empty" | "transition" | "chat" =
    messages.length === 0
      ? "empty"
      : messages.length < 4
        ? "transition"
        : "chat";

  const isEmergency = orbState === 'emergency';

  const handleClose = () => {
    closeVoice();
    closeChat();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999999, width: '100dvw', height: '100dvh', fontFamily: 'sans-serif' }}
      className={`transition-colors duration-1000 ${isEmergency ? 'bg-red-950' : 'bg-[#03040B]'}`}
      onClick={handleClose}
    >
      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1) translateY(0px); }
          50% { transform: scale(1.03) translateY(-6px); }
        }
        @keyframes orb-listen {
          0%, 100% { transform: scale(1.02); }
          50% { transform: scale(1.06); }
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes orb-speak {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.04); }
          75% { transform: scale(0.98); }
        }
        @keyframes orb-bounce {
          0%, 100% { transform: translateY(0px); }
          30% { transform: translateY(-15px); }
          50% { transform: translateY(0px); }
          70% { transform: translateY(-7px); }
        }
        @keyframes orb-warning {
          0%, 100% { transform: scale(1) opacity: 1; }
          50% { transform: scale(0.98) opacity: 0.9; }
        }
        @keyframes orb-emergency {
          0%, 100% { transform: scale(1); box-shadow: inset 0 20px 40px rgba(255,255,255,0.5), 0 0 50px rgba(239,68,68,0.9); }
          50% { transform: scale(1.1); box-shadow: inset 0 20px 40px rgba(255,255,255,0.7), 0 0 100px rgba(239,68,68,1); }
        }
        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes word-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .word-animate-1 { animation: word-fade-in 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards 0.2s; opacity: 0; }
        .word-animate-2 { animation: word-fade-in 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards 0.6s; opacity: 0; }
        .word-animate-3 { animation: word-fade-in 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards 1.0s; opacity: 0; }
        .subtitle-fade-in { animation: word-fade-in 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards 1.5s; opacity: 0; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-orb-breathe { animation: orb-breathe 3s ease-in-out infinite; }
        .animate-orb-listen { animation: orb-listen 0.8s ease-in-out infinite; }
        .animate-orb-float { animation: orb-float 4s ease-in-out infinite; }
        .animate-orb-speak { animation: orb-speak 0.4s ease-in-out infinite; }
        .animate-orb-bounce { animation: orb-bounce 1.2s ease-in-out infinite; }
        .animate-orb-warning { animation: orb-warning 1.5s ease-in-out infinite; }
        .animate-orb-emergency { animation: orb-emergency 0.6s ease-in-out infinite; }
        .mask-radial-gradient-horizontal {
          mask-image: radial-gradient(ellipse at center, black 40%, transparent 95%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 95%);
        }
      `
      }} />

      <div
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        className={`transition-all duration-1000 ${isEmergency ? 'bg-[#1A0505]' : 'bg-[#0B0C15]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── FIXED HEADER — always at the top ── */}
        <div className={`shrink-0 px-6 pt-5 pb-4 border-b transition-colors ${isEmergency ? 'border-red-900/30 bg-[#1A0505]' : 'border-white/[0.04] bg-[#0B0C15]'}`}>
          {/* AI Top Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Mini Orb Logo Image */}
              <div className="shrink-0 relative" style={{ width: 34, height: 34 }}>
                <img
                  src="/orb.png"
                  alt="KAVACH AI Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-[17px] font-black tracking-wide text-white leading-none">
                  KAVACH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] to-[#A855F7] drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">AI</span>
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-1 leading-none">
                  <span className={`w-1.5 h-1.5 rounded-full  ${isEmergency ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                  {isEmergency ? 'Emergency Mode' : 'On dashboard • English'}
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${isEmergency ? 'bg-red-950/80 border-red-900/60 text-red-400 hover:text-white hover:bg-red-900' : 'bg-[#151726]/80 border-white/[0.06] text-gray-400 hover:text-white hover:bg-[#202236]'}`}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── FIXED TOP PANEL — Orb, Greeting, Suggestions & SOS Banner ── */}
        <div className="shrink-0 flex flex-col items-center relative w-full overflow-hidden border-b border-white/[0.05] pt-5 pb-4 px-5">
          {/* Orb + Centered Wave Container */}
          <div className="relative flex items-center justify-center w-full" style={{
            height: 160,
          }}>
            {/* Wave background centered exactly behind the Orb */}
            <div className="mask-radial-gradient-horizontal absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <AuroraBackground
                quality={quality}
                primaryColor={resolveOrbConfig(orbState, quality).colors[orbState] ?? "#8B5CF6"}
                accentColor="#60A5FA"
                disabled={orbState === "idle" && quality === "low"}
              />
            </div>
            {/* Orb */}
            <div style={{
              position: "relative",
              width: 160,
              height: 160,
              zIndex: 1,
            }}>
              <KavachOrb
                size={160}
                config={resolveOrbConfig(orbState, quality)}
                ariaLabel={`KAVACH AI — ${orbState}`}
                customEmotion={customEmotion}
                viseme={viseme}
              />
            </div>
          </div>

          {/* Greeting */}
          <div className="flex flex-col items-center text-center px-4 z-10 mt-3">
            <h2 className="text-[24px] font-extrabold text-white tracking-tight leading-tight flex gap-2 justify-center items-center">
              <span className="word-animate-1">Hi</span>
              <span className="word-animate-2">{userName}!</span>
              <span className="word-animate-3">👋</span>
            </h2>
            <div className="flex flex-col items-center mt-1.5 text-[12px] px-2">
              <span className="font-bold text-white/90">
                I'm <span className="text-[#C084FC] drop-shadow-[0_0_10px_rgba(192,132,252,0.3)] font-black">KAVACH AI</span>, your personal safety assistant.
              </span>
            </div>
          </div>

          {/* Premium row of suggestions */}
          <div className={`grid grid-cols-3 gap-2.5 w-full mt-3 z-10 ${isEmergency ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            {/* Suggestion 1 */}
            <button
              onClick={() => { sendMessage("Open Ride Safe"); setOrbState('listening'); }}
              className="flex items-center gap-1.5 p-2 rounded-[16px] bg-[#141527]/60 border border-[#222438] hover:border-white/[0.12] transition-all active:scale-95 cursor-pointer text-left w-full h-[50px]"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <Shield size={14} className="text-purple-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] text-gray-400 uppercase tracking-wider font-extrabold">Open</span>
                <span className="text-[10px] font-black text-white leading-none truncate">Ride Safe</span>
              </div>
            </button>

            {/* Suggestion 2 */}
            <button
              onClick={() => { sendMessage("Where is Mom?"); setOrbState('listening'); }}
              className="flex items-center gap-1.5 p-2 rounded-[16px] bg-[#141527]/60 border border-[#222438] hover:border-white/[0.12] transition-all active:scale-95 cursor-pointer text-left w-full h-[50px]"
            >
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                <User size={14} className="text-pink-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] text-gray-400 uppercase tracking-wider font-extrabold">Where is</span>
                <span className="text-[10px] font-black text-white leading-none truncate">Mom?</span>
              </div>
            </button>

            {/* Suggestion 3 */}
            <button
              onClick={() => { sendMessage("Share my location"); setOrbState('listening'); }}
              className="flex items-center gap-1.5 p-2 rounded-[16px] bg-[#141527]/60 border border-[#222438] hover:border-white/[0.12] transition-all active:scale-95 cursor-pointer text-left w-full h-[50px]"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-blue-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] text-gray-400 uppercase tracking-wider font-extrabold">Share my</span>
                <span className="text-[10px] font-black text-white leading-none truncate">location</span>
              </div>
            </button>
          </div>

          {/* Emergency Banner */}
          <div className="w-full mt-3 p-2.5 rounded-[16px] bg-red-950/20 border border-red-900/30 flex items-center justify-between gap-3 z-10">
            <div className="flex gap-2 items-center">
              <div className="w-7.5 h-7.5 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Sparkles size={15} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10.5px] font-extrabold text-white">Need emergency help?</span>
                <span className="text-[8.5px] text-gray-400 leading-tight">Trigger SOS to call guardians.</span>
              </div>
            </div>
            <button
              onClick={() => { setOrbState("emergency"); sendMessage("HELP SOS"); }}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[9.5px] font-black tracking-wider uppercase transition-all shrink-0 flex items-center gap-1"
            >
              Trigger SOS
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT AREA — messages scroll here ── */}
        <div className="px-5 pt-3 flex-1 overflow-y-auto min-h-0 no-scrollbar flex flex-col" ref={listRef}>

          {/* CHAT MESSAGES TIMELINE */}
          {messages.length > 0 && (
            <div className="flex flex-col gap-4 py-2 z-10">
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} onAction={(a) => sendMessage(a.label)} />
              ))}
            </div>
          )}
        </div>{/* END scrollable content */}

        {/* Sticky Input Bar — always visible, never hidden behind navbar */}
        <div className={`w-full px-4 pt-3 pb-8 shrink-0 z-10 border-t transition-colors ${isEmergency ? 'border-red-900/40 bg-[#1A0505]' : 'border-[#1e2030] bg-[#0B0C15]'}`}>
          <div className={`w-full rounded-[32px] p-1.5 flex items-center justify-between border shadow-lg transition-colors ${isEmergency ? 'bg-red-950/50 border-red-900/50' : 'bg-[#161724] border-[#2A2C42]'}`}>
            <div className="flex-1 flex items-center gap-3 px-3">
              <textarea
                className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium text-white placeholder-gray-500 w-full resize-none min-h-[20px] max-h-[80px] py-2"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask KAVACH anything..."
                rows={1}
              />
            </div>
            <div className="flex items-center gap-2 pr-1.5">
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (text.trim()) {
                    onSend();
                  } else if (stt.supported) {
                    if (stt.listening) {
                      stt.stop();
                      closeVoice();
                    } else {
                      stt.start();
                      openVoice();
                    }
                  }
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all duration-300 cursor-pointer shrink-0 ${isEmergency ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : (text.trim() ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : (stt.listening ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-br from-[#9333EA] to-[#6B21A8] shadow-[0_0_15px_rgba(168,85,247,0.4)]'))}`}
              >
                {text.trim() ? (
                  <Send size={18} className="mr-0.5 mt-0.5" />
                ) : stt.listening ? (
                  <div className="w-3.5 h-3.5 bg-white rounded-sm" />
                ) : (
                  <Mic size={20} />
                )}
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={orbState === 'listening' ? ' text-[#A855F7]' : ''}>
                  <path d="M4 10v4M8 7v10M12 3v18M16 7v10M20 10v4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MessageBubble({ msg, onAction }: { msg: Msg; onAction: (a: any) => void }) {
  const isUser = msg.role === "user";
  const text = isUser ? msg.text : (msg.display ?? msg.text);
  return (
    <div className={`kai-msg-row ${isUser ? "kai-msg-row--user" : "kai-msg-row--ai"}`}>
      <div className={isUser ? "kai-bubble kai-bubble--user" : "kai-bubble kai-bubble--ai"} data-testid={isUser ? "kavach-ai-msg-user" : "kavach-ai-msg-assistant"}>
        <div className="kai-bubble__text">{text || (msg.streaming ? "…" : "")}</div>
        {!isUser && msg.actions && msg.actions.length > 0 && !msg.emergency && (
          <div className="kai-bubble__actions">
            {msg.actions.map((a, i) => <span key={i} onClick={() => onAction(a)} style={{ cursor: "pointer", margin: "4px" }}><ActionChip action={a} onPress={() => onAction(a)} /></span>)}
          </div>
        )}
      </div>
    </div>
  );
}
