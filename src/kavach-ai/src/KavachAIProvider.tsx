import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { streamChat, type ChatContext } from "./services/api";
import { parseActions, type AIAction } from "./services/actionParser";
import { useTTS } from "./hooks/useTTS";
import { useKavachTheme } from "./hooks/useKavachTheme";

export type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  display?: string;
  actions?: AIAction[];
  emergency?: boolean;
  streaming?: boolean;
  ts: number;
};

type Ctx = {
  // ui
  chatOpen: boolean;
  voiceOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  openVoice: () => void;
  closeVoice: () => void;

  // messages
  messages: Msg[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;

  // state
  userName: string;
  preferredLanguage: string;
  currentScreen: string;
  emergencyMode: boolean;
  exitEmergency: () => void;

  // config
  apiBase: string;
  appContext: ChatContext;
  onAction: (a: AIAction) => void;
  themeControl: ReturnType<typeof useKavachTheme>;
};

const C = createContext<Ctx | null>(null);

const SESSION_STORAGE_KEY = "kavach-ai:session-id";

function readSessionId(): string {
  try {
    const v = localStorage.getItem(SESSION_STORAGE_KEY);
    if (v) return v;
  } catch {}
  const fresh = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try { localStorage.setItem(SESSION_STORAGE_KEY, fresh); } catch {}
  return fresh;
}

export function KavachAIProvider(props: {
  apiBase: string;
  userId?: string;
  userName: string;
  preferredLanguage: string;
  currentScreen: string;
  appContext: ChatContext;
  onAction: (a: AIAction) => void;
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const sessionIdRef = useRef<string>(readSessionId());
  const tts = useTTS();

  const themeControl = useKavachTheme(emergencyMode ? "emergency" : "dark");

  useEffect(() => {
    themeControl.setTheme(emergencyMode ? "emergency" : "dark");
  }, [emergencyMode, themeControl.setTheme]);

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const openVoice = useCallback(() => setVoiceOpen(true), []);
  const closeVoice = useCallback(() => { setVoiceOpen(false); tts.stop(); }, [tts]);

  const clearMessages = useCallback(() => { setMessages([]); setEmergencyMode(false); }, []);
  const exitEmergency = useCallback(() => setEmergencyMode(false), []);

  const dispatchAction = useCallback((a: AIAction) => {
    // chat/voice should close on navigation-style actions
    if (a.type === "nav") { setChatOpen(false); setVoiceOpen(false); }
    props.onAction(a);
  }, [props]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: trimmed, ts: Date.now() };
    const assistantId = `a-${Date.now() + 1}`;
    const placeholder: Msg = { id: assistantId, role: "assistant", text: "", display: "", streaming: true, ts: Date.now() + 1 };
    setMessages((p) => [...p, userMsg, placeholder]);
    setIsStreaming(true);

    const ctx: ChatContext = {
      current_screen: props.currentScreen,
      ...props.appContext,
    };

    let buffer = "";
    try {
      await streamChat({
        apiBase: props.apiBase,
        sessionId: sessionIdRef.current,
        userId: props.userId || "default-user",
        text: trimmed,
        context: ctx,
        onChunk: (_, full) => {
          buffer = full;
          const parsed = parseActions(buffer);
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, text: buffer, display: parsed.display, streaming: true } : m,
          ));
        },
      });
      const parsed = parseActions(buffer);
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, text: buffer, display: parsed.display, actions: parsed.actions, emergency: parsed.emergency, streaming: false } : m,
      ));
      if (parsed.emergency) setEmergencyMode(true);
      if (voiceOpen && parsed.display) tts.speak(parsed.display, props.preferredLanguage);
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, text: "I'm offline right now. Please try again.", display: "I'm offline right now. Please try again.", streaming: false } : m,
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, props.apiBase, props.userId, props.currentScreen, props.appContext, props.preferredLanguage, voiceOpen, tts]);

  // Stop TTS when voice closes
  useEffect(() => { if (!voiceOpen) tts.stop(); }, [voiceOpen, tts]);

  const value = useMemo<Ctx>(() => ({
    chatOpen, voiceOpen, openChat, closeChat, openVoice, closeVoice,
    messages, isStreaming, sendMessage, clearMessages,
    userName: props.userName,
    preferredLanguage: props.preferredLanguage,
    currentScreen: props.currentScreen,
    emergencyMode, exitEmergency,
    apiBase: props.apiBase,
    appContext: props.appContext,
    onAction: dispatchAction,
    themeControl,
  }), [
    chatOpen, voiceOpen, openChat, closeChat, openVoice, closeVoice,
    messages, isStreaming, sendMessage, clearMessages,
    props.userName, props.preferredLanguage, props.currentScreen,
    emergencyMode, exitEmergency, props.apiBase, props.appContext, dispatchAction,
    themeControl,
  ]);

  return <C.Provider value={value}>{props.children}</C.Provider>;
}

export function useKavachAI() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useKavachAI must be used inside <KavachAI /> or <KavachAIProvider>");
  return ctx;
}
