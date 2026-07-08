// ============================================================
// springEngine.ts — Damped spring physics simulation
// Runs per-frame on a number value toward a target.
// Used for smooth orb scale, opacity, and position transitions.
// ============================================================

export interface SpringState {
  value: number;
  velocity: number;
}

export interface SpringConfig {
  /** Spring stiffness — higher = snappier (default: 220) */
  stiffness: number;
  /** Damping — higher = less overshoot (default: 26) */
  damping: number;
  /** Object mass — higher = heavier/slower (default: 1) */
  mass: number;
  /** Minimum velocity threshold to stop simulation */
  precision?: number;
}

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  /** Snappy UI transitions */
  snappy:    { stiffness: 380, damping: 36, mass: 1 },
  /** Default balanced feel */
  default:   { stiffness: 220, damping: 26, mass: 1 },
  /** Gentle, floaty animations */
  gentle:    { stiffness: 120, damping: 18, mass: 1 },
  /** Slow, weighted elastic */
  wobbly:    { stiffness: 180, damping: 12, mass: 1 },
  /** Stiff with minimal overshoot */
  stiff:     { stiffness: 500, damping: 50, mass: 1 },
  /** Emergency: fast hard snap */
  emergency: { stiffness: 600, damping: 40, mass: 1 },
};

/**
 * Advances a spring simulation by `dt` seconds toward `target`.
 * Returns the new state. Pure function — no side effects.
 */
export function stepSpring(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dt: number,
): SpringState {
  const precision = config.precision ?? 0.001;

  // Spring force: F = -k * (x - target)
  // Damping force: F_d = -c * v
  const displacement = state.value - target;
  const springForce  = -config.stiffness * displacement;
  const dampingForce = -config.damping * state.velocity;
  const acceleration = (springForce + dampingForce) / config.mass;

  const newVelocity = state.velocity + acceleration * dt;
  const newValue    = state.value    + newVelocity * dt;

  // Settle to target if both displacement and velocity are negligible
  const atRest =
    Math.abs(newValue - target) < precision &&
    Math.abs(newVelocity) < precision;

  return atRest
    ? { value: target, velocity: 0 }
    : { value: newValue, velocity: newVelocity };
}

/** Creates a fresh spring state at a given starting value */
export function createSpring(initialValue: number): SpringState {
  return { value: initialValue, velocity: 0 };
}
