// ============================================================
// OrbGlow.tsx — Dynamic ambient glow layer below the sphere
// Presentation-only. Receives resolved OrbRenderConfig.
// ============================================================

import React, { useMemo } from "react";
import type { OrbRenderConfig } from "./OrbTypes";

interface Props {
  size: number;
  config: OrbRenderConfig;
}

export const OrbGlow: React.FC<Props> = ({ size, config }) => {
  const glowConfig = useMemo(() => {
    return config.glow[config.state] ?? config.glow.idle;
  }, [config.glow, config.state]);

  const showBloom = config.featureFlags.enableBloom;

  return (
    <>
      {/* Primary glow halo */}
      <div
        style={{
          position: "absolute",
          inset: `-${size * 0.35}px`,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowConfig.color}${Math.round(glowConfig.opacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          filter: `blur(${glowConfig.radius})`,
          transition: `background ${config.motion.float.duration}ms ${config.motion.float.easing}, filter ${config.motion.float.duration}ms ${config.motion.float.easing}`,
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      />

      {/* Bloom layer (only on high/ultra quality) */}
      {showBloom && (
        <div
          style={{
            position: "absolute",
            inset: `-${size * 0.55}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowConfig.color}22 0%, transparent 65%)`,
            filter: `blur(${size * 0.4}px)`,
            pointerEvents: "none",
            zIndex: -2,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};
