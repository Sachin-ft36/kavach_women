// ============================================================
// useOrbSpring.ts — Hooks spring + transition matrix together
// Drives animated scale and opacity for the Orb based on state.
// ============================================================

import { useMemo, useRef } from "react";
import { useSpring } from "./useSpring";
import { resolveTransition } from "./stateTransitions";
import type { OrbState } from "../components/KavachOrb/OrbTypes";
import { SPRING_PRESETS } from "./springEngine";

interface OrbSpringValues {
  scale: number;
  opacity: number;
  glowOpacity: number;
}

/** Target values per OrbState */
const STATE_TARGETS: Record<OrbState, { scale: number; opacity: number; glowOpacity: number }> = {
  idle:      { scale: 1.00, opacity: 0.90, glowOpacity: 0.40 },
  listening: { scale: 1.06, opacity: 1.00, glowOpacity: 0.60 },
  thinking:  { scale: 1.03, opacity: 0.95, glowOpacity: 0.45 },
  speaking:  { scale: 1.05, opacity: 1.00, glowOpacity: 0.55 },
  warning:   { scale: 1.04, opacity: 1.00, glowOpacity: 0.65 },
  emergency: { scale: 1.08, opacity: 1.00, glowOpacity: 0.85 },
};

export function useOrbSpring(currentState: OrbState): OrbSpringValues {
  const prevStateRef = useRef<OrbState>(currentState);

  const transition = useMemo(() => {
    const spec = resolveTransition(prevStateRef.current, currentState);
    prevStateRef.current = currentState;
    return spec;
  }, [currentState]);

  const springConfig = SPRING_PRESETS[transition.springPreset] ?? SPRING_PRESETS.default;
  const targets = STATE_TARGETS[currentState];

  const scale       = useSpring(targets.scale,       { config: springConfig });
  const opacity     = useSpring(targets.opacity,     { config: springConfig });
  const glowOpacity = useSpring(targets.glowOpacity, { config: springConfig });

  return { scale, opacity, glowOpacity };
}
