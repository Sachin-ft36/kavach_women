// ============================================================
// safety/SafetyScorer.ts — Evaluates risk from context signals
// Pure function: takes ContextFrame + user message → SafetyScore
// No side effects. No network calls. No state.
// ============================================================

import type { ContextFrame, SafetyScore } from "../BrainTypes";

// Keyword sets for tiered risk detection
const EMERGENCY_KEYWORDS = [
  "help", "emergency", "danger", "attack", "unsafe", "follow", "threat",
  "hurt", "trapped", "kidnap", "harassment", "assault", "sos", "scared",
  "bachao", "madad", "khatara", "dar", "maar", "uthao",
];

const WARNING_KEYWORDS = [
  "uncomfortable", "nervous", "worried", "alone", "dark", "suspicious",
  "uneasy", "strange", "problem", "issue", "akela", "darr",
];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

/**
 * Stateless safety scorer.
 * Returns a SafetyScore based on the text content and device context.
 */
export function scoreSafety(
  userMessage: string,
  context: ContextFrame,
): SafetyScore {
  const signals: string[] = [];
  let score = 0;

  // --- Text signal analysis ---
  const emergencyHits = countMatches(userMessage, EMERGENCY_KEYWORDS);
  const warningHits   = countMatches(userMessage, WARNING_KEYWORDS);

  if (emergencyHits >= 2) {
    score += 0.7;
    signals.push(`High-risk keywords detected (${emergencyHits})`);
  } else if (emergencyHits === 1) {
    score += 0.4;
    signals.push(`Risk keyword detected`);
  }

  if (warningHits >= 1) {
    score += 0.15;
    signals.push(`Discomfort signals in message`);
  }

  // --- Context signal analysis ---
  if (!context.isOnline) {
    score += 0.1;
    signals.push("Device offline");
  }

  if (context.batteryLevel !== undefined && context.batteryLevel < 0.1) {
    score += 0.05;
    signals.push("Critical battery level");
  }

  // Cap at 1.0
  score = Math.min(score, 1.0);

  // Recommend UI state
  let recommendedState: SafetyScore["recommendedState"] = "idle";
  if (score >= 0.5) recommendedState = "emergency";
  else if (score >= 0.2) recommendedState = "warning";

  return { score, signals, recommendedState };
}
