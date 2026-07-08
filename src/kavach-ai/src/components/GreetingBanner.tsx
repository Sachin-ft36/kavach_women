/**
 * Optional standalone greeting widget. Drop it on your home page:
 *   <GreetingBanner apiBase={apiBase} name="Sachin" language="English" />
 */
import React, { useState } from "react";
import { useGreeting } from "../hooks/useGreeting";

export function GreetingBanner({
  apiBase,
  name,
  language,
  context = {},
  onClick,
}: {
  apiBase: string;
  name: string;
  language: string;
  context?: Record<string, unknown>;
  onClick?: () => void;
}) {
  const { greeting, loading } = useGreeting(apiBase, name, language, context);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="kai-greeting" data-testid="kavach-ai-greeting" onClick={onClick} role={onClick ? "button" : undefined}>
      <div className="kai-greeting__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" /></svg>
      </div>
      <div className="kai-greeting__text">
        {loading ? "KAVACH is preparing your daily brief…" : greeting}
      </div>
      <button
        data-testid="kavach-ai-greeting-dismiss"
        className="kai-greeting__dismiss"
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        type="button"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
