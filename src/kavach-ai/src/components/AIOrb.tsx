import React, { useRef } from "react";
import { useKavachAI } from "../KavachAIProvider";

export function AIOrb({ position = "br" }: { position?: "br" | "bl" | "tr" | "tl" }) {
  const { openChat, openVoice, chatOpen, voiceOpen } = useKavachAI();
  const longPressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  if (chatOpen || voiceOpen) return null;

  const onPointerDown = () => {
    longPressed.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      openVoice();
    }, 380);
  };
  const onPointerUp = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    if (!longPressed.current) openChat();
  };
  const onPointerLeave = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
  };

  return (
    <button
      data-testid="kavach-ai-orb"
      className={`kai-orb kai-orb--${position}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      aria-label="Open KAVACH AI"
      type="button"
    >
      <span className="kai-orb__pulse" />
      <span className="kai-orb__core">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
            fill="currentColor"
          />
          <circle cx="18" cy="5" r="1.5" fill="currentColor" />
          <circle cx="5" cy="18" r="1.2" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
