// ============================================================
// MouthRig.tsx — Animated SVG mouth with viseme morphing
// Presentation-only. Receives FaceRigConfig — holds no state.
// Supports funny expressions: happy, sad, crying, teasing (tongue out), and waiting.
// ============================================================

import React, { useMemo } from "react";
import type { FaceRigConfig } from "./FaceTypes";
import { getVisemePath } from "./visemeMap";

interface Props {
  config: FaceRigConfig;
  /** Vertical offset from face center (px) */
  offsetY?: number;
}

export const MouthRig: React.FC<Props> = ({ config, offsetY = 18 }) => {
  const pathD = useMemo(() => {
    if (config.viseme === "rest") {
      switch (config.emotion) {
        case "happy": return "M -12 -1 Q 0 6 12 -1";
        case "curious": return "M -6 -3 Q 0 5 6 -3";
        case "focused": return "M -10 1 Q 0 -2 10 1";
        case "sad": return "M -12 2 Q 0 -4 12 2";
        case "crying": return "M -12 4 Q 0 -5 12 4";   // deep sad frown for crying
        case "alert": return "M -12 3 Q 0 -4 12 3";
        case "teasing": return "M -10 -2 Q 0 4 10 -2 Q 0 10 -10 -2"; // open teasing mouth
        case "waiting": return "M -4 0 A 3 3 0 1 1 4 0 A 3 3 0 1 1 -4 0"; // tiny circular bored sigh
        default: return "M -12 0 Q 0 4 12 0";
      }
    }
    return getVisemePath(config.viseme);
  }, [config.viseme, config.emotion]);

  const showTongue = config.emotion === "teasing" && config.viseme === "rest";

  return (
    <g
      transform={`translate(0, ${offsetY}) scale(0.8)`}
      aria-hidden="true"
    >
      {/* Dark mouth cavity background when tongue is sticking out */}
      {showTongue && (
        <path
          d="M -10 -2 Q 0 4 10 -2 Q 0 10 -10 -2 Z"
          fill="#06020c"
        />
      )}

      {/* Main mouth outline */}
      <path
        d={pathD}
        fill="none"
        stroke={config.color}
        strokeWidth={config.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "d 120ms cubic-bezier(0.19,1,0.22,1), opacity 150ms ease",
          opacity: 0.95, // Keep mouth bright white always
        }}
      />

      {/* Large, clear candy-pink tongue sticking out beyond the lower lip */}
      {showTongue && (
        <g>
          {/* Tongue Body */}
          <path
            d="M -4.2 2 C -4.2 2, -4.2 12.5, 0 12.5 C 4.2 12.5, 4.2 2, 4.2 2 Z"
            fill="#FF2A6D"
            style={{
              filter: "drop-shadow(0 0 2.5px rgba(255, 42, 109, 0.85))",
            }}
          />
          {/* Tongue Center Fold Line */}
          <path
            d="M 0 4 L 0 9.5"
            stroke="#7F0022"
            strokeWidth={0.8}
            strokeLinecap="round"
            opacity={0.5}
          />
        </g>
      )}
    </g>
  );
};
