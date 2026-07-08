// ============================================================
// AuroraBackground.tsx — Presentation canvas wrapper component
// Renders animated aurora wave field behind the Orb.
// Quality-adaptive: skips render on low / power-saving mode.
// ============================================================

import React from "react";
import { useAuroraBackground } from "./useAuroraBackground";
import type { RenderQuality } from "../KavachOrb/OrbTypes";

interface Props {
  quality: RenderQuality;
  /** CSS color string for primary wave layer */
  primaryColor: string;
  /** CSS color string for accent wave layer */
  accentColor: string;
  /** Disable rendering entirely (power saving / reduce motion) */
  disabled?: boolean;
}

export const AuroraBackground: React.FC<Props> = ({
  quality,
  primaryColor,
  accentColor,
  disabled = false,
}) => {
  const canvasRef = useAuroraBackground({
    quality,
    primaryColor,
    accentColor,
    enabled: !disabled,
  });

  // On low quality or disabled, render a simple static gradient instead
  if (disabled || quality === "low") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 70%, ${primaryColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.85,
      }}
      aria-hidden="true"
    />
  );
};

export default AuroraBackground;
