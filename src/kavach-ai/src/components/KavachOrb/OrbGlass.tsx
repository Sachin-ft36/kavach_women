// ============================================================
// OrbGlass.tsx — Frosted glass specular highlight overlay
// Presentation-only. Receives resolved OrbRenderConfig.
// ============================================================

import React from "react";
import type { OrbRenderConfig } from "./OrbTypes";

interface Props {
  size: number;
  config: OrbRenderConfig;
}

export const OrbGlass: React.FC<Props> = ({ size, config }) => {
  const showReflection = config.featureFlags.enableReflection;

  return (
    <>
      {/* Main glass specular highlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 32% 28%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 45%, transparent 65%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Secondary bottom-right rim reflection */}
      {showReflection && (
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "30%",
            height: "18%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.09) 0%, transparent 80%)",
            transform: "rotate(-20deg)",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};
