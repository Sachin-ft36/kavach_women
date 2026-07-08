// ============================================================
// useSpring.ts — React hook wrapping springEngine per-value
// Drives a single animated number toward a target on RAF.
// Returns the current animated value (re-renders on change).
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import {
  stepSpring,
  createSpring,
  type SpringConfig,
  type SpringState,
  SPRING_PRESETS,
} from "./springEngine";

interface UseSpringOptions {
  config?: SpringConfig;
  /** One of the named presets */
  preset?: keyof typeof SPRING_PRESETS;
  /** Called when spring settles at target */
  onRest?: (value: number) => void;
}

export function useSpring(
  target: number,
  options: UseSpringOptions = {},
): number {
  const config = options.preset
    ? SPRING_PRESETS[options.preset]
    : options.config ?? SPRING_PRESETS.default;

  const stateRef   = useRef<SpringState>(createSpring(target));
  const targetRef  = useRef<number>(target);
  const rafRef     = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const onRestRef  = useRef(options.onRest);

  const [value, setValue] = useState<number>(target);

  // Keep refs in sync without re-running effect
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { onRestRef.current = options.onRest; }, [options.onRest]);

  const animate = useCallback((now: number) => {
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.064); // cap at ~15fps
    lastTimeRef.current = now;

    const next = stepSpring(stateRef.current, targetRef.current, config, dt);
    stateRef.current = next;

    setValue(next.value);

    if (next.velocity === 0 && next.value === targetRef.current) {
      onRestRef.current?.(next.value);
      return; // settled — stop loop
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [config]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, animate]);

  return value;
}
