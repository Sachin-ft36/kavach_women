import React from "react";
import { KavachAIProvider } from "./KavachAIProvider";
import { AIOrb } from "./components/AIOrb";
import { AIChatSheet } from "./components/AIChatSheet";
import { AIVoiceOverlay } from "./components/AIVoiceOverlay";
import type { AIAction } from "./services/actionParser";
import type { ChatContext } from "./services/api";

export type KavachAIProps = {
  apiBase: string;
  userId?: string;
  userName?: string;
  preferredLanguage?: string;
  currentScreen?: string;
  appContext?: ChatContext;
  onAction: (a: AIAction) => void;
  position?: "br" | "bl" | "tr" | "tl";
  hideOrb?: boolean;
  disableVoice?: boolean;
  children?: React.ReactNode;
};

/** Single drop-in component. Mounts orb + chat sheet + voice overlay. */
export function KavachAI({
  apiBase,
  userId = "default-user",
  userName = "friend",
  preferredLanguage = "English",
  currentScreen = "/",
  appContext = {},
  onAction,
  position = "br",
  hideOrb = false,
  disableVoice = false,
  children,
}: KavachAIProps) {
  return (
    <KavachAIProvider
      apiBase={apiBase}
      userId={userId}
      userName={userName}
      preferredLanguage={preferredLanguage}
      currentScreen={currentScreen}
      appContext={appContext}
      onAction={onAction}
    >
      {!hideOrb && <AIOrb position={position} />}
      <AIChatSheet />
      {!disableVoice && <AIVoiceOverlay />}
      {children}
    </KavachAIProvider>
  );
}
