import React from "react";
import { actionLabel, type AIAction } from "../services/actionParser";

type Props = { action: AIAction; onPress: () => void; emergency?: boolean };

const ICON_MAP: Record<AIAction["type"], string> = {
  nav: "M5 12h14M13 6l6 6-6 6",
  call: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z",
  share_location: "M12 22s-8-7.58-8-13a8 8 0 0 1 16 0c0 5.42-8 13-8 13Zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  record_audio: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0M12 18v4",
  record_video: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
  fake_call: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2",
  emergency: "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  confirm: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
};

export function ActionChip({ action, onPress, emergency }: Props) {
  const isEmergency =
    emergency || action.type === "confirm" || (action.type === "call" && action.target === "112");
  return (
    <button
      data-testid={`kavach-ai-action-${action.type}`}
      type="button"
      onClick={onPress}
      className={`kai-chip ${isEmergency ? "kai-chip--danger" : ""}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICON_MAP[action.type]} />
      </svg>
      <span>{actionLabel(action)}</span>
    </button>
  );
}

export function EmergencyCard({ action, onPress }: Props) {
  return (
    <button
      data-testid="kavach-ai-emergency-card"
      type="button"
      onClick={onPress}
      className="kai-em-card"
    >
      <span className="kai-em-card__icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICON_MAP[action.type]} />
        </svg>
      </span>
      <span className="kai-em-card__body">
        <span className="kai-em-card__title">{actionLabel(action)}</span>
        <span className="kai-em-card__sub">Tap to proceed</span>
      </span>
      <svg className="kai-em-card__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}
