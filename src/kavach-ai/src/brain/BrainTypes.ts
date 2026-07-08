// ============================================================
// BrainTypes.ts — Shared interfaces for the Brain Engine
// Defines BrainState, ContextFrame, MemoryEntry, and SafetyScore
// ============================================================

/** Internal cognitive states — never exposed to the UI directly */
export type BrainState =
  | "observing"     // passive, processing ambient context
  | "planning"      // resolving next action
  | "reasoning"     // executing LLM inference
  | "memoryUpdate"  // writing to local memory store
  | "safetyAnalysis"; // evaluating risk score

export interface ContextFrame {
  /** Current screen the user is on */
  currentScreen: string;
  /** User's preferred language code (e.g. "hi", "en") */
  language: string;
  /** User's name for personalization */
  userName: string;
  /** Current timestamp in ISO format */
  timestamp: string;
  /** Optional geofence zone label */
  geofenceZone?: string;
  /** Battery level 0–1 */
  batteryLevel?: number;
  /** Whether device is connected to network */
  isOnline: boolean;
}

export interface MemoryEntry {
  id: string;
  /** UTC timestamp (ms) */
  createdAt: number;
  /** Short textual summary of the memory */
  summary: string;
  /** Importance weight 0–1 */
  weight: number;
  /** Optional topic tags */
  tags?: string[];
}

export interface SafetyScore {
  /** Overall risk 0 (safe) → 1 (critical) */
  score: number;
  /** What triggered the risk signal */
  signals: string[];
  /** Recommended UI state to switch to */
  recommendedState: "idle" | "warning" | "emergency";
}
