// ============================================================
// visemeMap.ts — Maps Viseme phoneme keys to SVG mouth paths
// All paths are normalized to a 48×20 bounding box centered at (0,0)
// ============================================================

import type { Viseme } from "./FaceTypes";

export const VISEME_PATHS: Record<Viseme, string> = {
  // Closed / rest mouth
  rest: "M -12 0 Q 0 2 12 0",

  // 'A', 'I' — wide open oval
  aa: "M -12 -5 Q 0 10 12 -5 Q 0 -2 -12 -5",

  // 'O' — round open
  oh: "M -8 -4 Q 0 8 8 -4 Q 0 -6 -8 -4",

  // 'E' — wide, flattened smile
  ee: "M -14 0 Q 0 4 14 0",

  // 'U', 'W' — pursed small O
  oo: "M -6 -3 Q 0 6 6 -3 Q 0 -5 -6 -3",

  // 'F', 'V' — lower lip raised
  ff: "M -10 -1 Q 0 3 10 -1",

  // 'TH' — tongue-tip, slightly open
  th: "M -9 0 Q 0 5 9 0",

  // 'S', 'Z' — slight open, teeth showing
  ss: "M -11 -1 Q 0 4 11 -1",

  // 'N', 'L' — slightly open, neutral
  nn: "M -10 0 Q 0 3 10 0",

  // 'K', 'G' — back-of-mouth, moderate open
  kk: "M -10 -3 Q 0 7 10 -3 Q 0 -2 -10 -3",
};

/** Returns the SVG path string for the given viseme */
export function getVisemePath(viseme: Viseme): string {
  return VISEME_PATHS[viseme] ?? VISEME_PATHS.rest;
}
