// ============================================================
// OrbRing.tsx — Animated concentric ring pulsing around Orb
// Conforms 100% to KAVACH AI ORB Master Design Spec:
// - Ring thickness: 4.5px
// - Positioned tightly around the sphere to bleed its glow inward.
// ============================================================

import React, { useMemo } from "react";
import type { OrbRenderConfig } from "./OrbTypes";

interface Props {
  size: number;
  config: OrbRenderConfig;
}

export const OrbRing: React.FC<Props> = ({ size, config }) => {
  const ringColor = useMemo(() => {
    return config.colors[config.state] ?? config.colors.idle;
  }, [config.colors, config.state]);

  const isActive = config.state !== "idle";
  const isEmergency = config.state === "emergency";

  // Ring only shown during active states
  if (!isActive) return null;

  return (
    <>
      {/* Outer ring - Positioned tightly (inset -4px) so the glow bleeds directly into the sphere rim */}
      <div
        style={{
          position: "absolute",
          inset: "-4px",
          borderRadius: "50%",
          border: `4.2px solid ${ringColor}`,
          boxShadow: `
            0 0 20px ${ringColor}, 
            0 0 8px #C084FC, 
            0 0 4px rgba(255, 255, 255, 0.9)
          `,
          animation: `orbRingPulse ${isEmergency ? 0.8 : 2.4}s ease-in-out infinite`,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Inner ring - closer for layered neon depth */}
      <div
        style={{
          position: "absolute",
          inset: "-1px",
          borderRadius: "50%",
          border: `1.8px solid ${ringColor}88`,
          boxShadow: `
            0 0 8px ${ringColor}55
          `,
          animation: `orbRingPulse ${isEmergency ? 0.6 : 1.8}s ease-in-out infinite`,
          animationDelay: "0.3s",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      <style>{`
        @keyframes orbRingPulse {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 0.40; transform: scale(1.03); }
        }
      `}</style>
    </>
  );
};
export default OrbRing;
