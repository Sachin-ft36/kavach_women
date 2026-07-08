// ============================================================
// FaceTypes.ts — Shared interfaces for the Face Rig system
// ============================================================

export type BlinkState = "open" | "half" | "closed";
export type EmotionState = "neutral" | "happy" | "curious" | "focused" | "alert" | "sad" | "teasing" | "crying" | "waiting";

/** Viseme phoneme targets for mouth morphing */
export type Viseme =
  | "rest"   // silence / M,B,P
  | "aa"     // 'A', 'I'
  | "oh"     // 'O'
  | "ee"     // 'E'
  | "oo"     // 'U', 'W'
  | "ff"     // 'F', 'V'
  | "th"     // 'TH'
  | "ss"     // 'S', 'Z'
  | "nn"     // 'N', 'L'
  | "kk";    // 'K', 'G'

export interface EyeGeometry {
  /** Eye circle radius (px) */
  r: number;
  /** Vertical scale for blink animation (0=closed, 1=fully open) */
  scaleY: number;
  /** Horizontal offset from center */
  offsetX: number;
}

export interface MouthGeometry {
  /** SVG path d-string for current viseme */
  path: string;
  /** Opacity for emphasis */
  opacity: number;
}

export interface FaceRigConfig {
  emotion: EmotionState;
  viseme: Viseme;
  blinkState: BlinkState;
  /** Face tint color driven by Orb state color */
  color: string;
  /** Stroke width */
  stroke: number;
  /** Eye separation center-to-center */
  eyeSeparation: number;
}
