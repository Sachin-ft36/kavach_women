// ============================================================
// stateTransitions.ts — OrbState transition timing matrix
// Defines which spring preset + CSS transition duration to use
// when moving from one OrbState to another.
// ============================================================

import type { OrbState } from "../components/KavachOrb/OrbTypes";

export interface TransitionSpec {
  /** Spring preset key from SPRING_PRESETS */
  springPreset: string;
  /** Fallback CSS duration for non-spring properties (ms) */
  durationMs: number;
  /** CSS easing for non-spring properties */
  easing: string;
}

type TransitionMatrix = Record<OrbState, Record<OrbState, TransitionSpec>>;

const DEFAULT: TransitionSpec = {
  springPreset: "default",
  durationMs:   400,
  easing:       "cubic-bezier(0.4,0,0.2,1)",
};

const SNAP: TransitionSpec = {
  springPreset: "snappy",
  durationMs:   200,
  easing:       "cubic-bezier(0.34,1.56,0.64,1)",
};

const GENTLE: TransitionSpec = {
  springPreset: "gentle",
  durationMs:   600,
  easing:       "cubic-bezier(0.25,0.8,0.25,1)",
};

const EMERGENCY_IN: TransitionSpec = {
  springPreset: "emergency",
  durationMs:   180,
  easing:       "cubic-bezier(0.8,0,0.2,1)",
};

const EMERGENCY_OUT: TransitionSpec = {
  springPreset: "gentle",
  durationMs:   800,
  easing:       "cubic-bezier(0.25,0.8,0.25,1)",
};

/**
 * Resolves the transition spec for moving from `from` state to `to` state.
 * Falls back to DEFAULT if the specific pair is not defined.
 */
export const TRANSITION_MATRIX: Partial<TransitionMatrix> = {
  idle: {
    idle:      DEFAULT,
    listening: SNAP,
    thinking:  DEFAULT,
    speaking:  DEFAULT,
    warning:   SNAP,
    emergency: EMERGENCY_IN,
  },
  listening: {
    idle:      GENTLE,
    listening: DEFAULT,
    thinking:  SNAP,
    speaking:  SNAP,
    warning:   SNAP,
    emergency: EMERGENCY_IN,
  },
  thinking: {
    idle:      GENTLE,
    listening: DEFAULT,
    thinking:  DEFAULT,
    speaking:  SNAP,
    warning:   SNAP,
    emergency: EMERGENCY_IN,
  },
  speaking: {
    idle:      GENTLE,
    listening: DEFAULT,
    thinking:  DEFAULT,
    speaking:  DEFAULT,
    warning:   SNAP,
    emergency: EMERGENCY_IN,
  },
  warning: {
    idle:      GENTLE,
    listening: DEFAULT,
    thinking:  DEFAULT,
    speaking:  DEFAULT,
    warning:   DEFAULT,
    emergency: EMERGENCY_IN,
  },
  emergency: {
    idle:      EMERGENCY_OUT,
    listening: EMERGENCY_OUT,
    thinking:  EMERGENCY_OUT,
    speaking:  EMERGENCY_OUT,
    warning:   EMERGENCY_OUT,
    emergency: DEFAULT,
  },
};

export function resolveTransition(from: OrbState, to: OrbState): TransitionSpec {
  return TRANSITION_MATRIX[from]?.[to] ?? DEFAULT;
}
