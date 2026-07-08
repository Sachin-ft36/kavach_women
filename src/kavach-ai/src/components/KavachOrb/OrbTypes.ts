// ============================================================
// OrbTypes.ts — Shared interfaces for the entire Orb system
// All renderers receive OrbRenderConfig — they hold NO state.
// ============================================================

export type RenderQuality = "low" | "balanced" | "high" | "ultra";

export type OrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "warning"
  | "emergency";

export interface MotionToken {
  duration: number;
  easing: string;
  delay?: number;
  spring?: { stiffness: number; damping: number };
}

export interface MotionTokens {
  float: MotionToken;
  pulse: MotionToken;
  blink: MotionToken;
  listeningExpand: MotionToken;
  thinkingRotate: MotionToken;
  emergencyPulse: MotionToken;
}

export interface OrbColors {
  idle: string;
  listening: string;
  thinking: string;
  success: string;
  warning: string;
  emergency: string;
}

export interface GlowLayer {
  color: string;
  radius: string;
  opacity: number;
}

export interface GlowTokens {
  idle: GlowLayer;
  listening: GlowLayer;
  thinking: GlowLayer;
  success: GlowLayer;
  warning: GlowLayer;
  emergency: GlowLayer;
}

export interface FaceTokens {
  eyes: { stroke: number; blinkRate: number; separation: number };
  mouth: { width: number; height: number; stroke: number };
  sparkle: { rotation: boolean; offsetY: number };
}

export interface PhysicsTokens {
  gravity: number;
  levitation: number;
  friction: number;
  mass: number;
  tension: number;
  elasticity: number;
}

export interface OrbRenderConfig {
  state: OrbState;
  colors: OrbColors;
  glow: GlowTokens;
  face: FaceTokens;
  physics: PhysicsTokens;
  motion: MotionTokens;
  quality: RenderQuality;
  featureFlags: {
    enableParticles: boolean;
    enableReflection: boolean;
    enableBloom: boolean;
    enableWaves: boolean;
    enableGyroscope: boolean;
  };
}
