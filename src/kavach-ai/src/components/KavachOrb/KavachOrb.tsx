// ============================================================
// KavachOrb.tsx — Main compositor assembling all Orb layers
// Presentation-only. Conforms 100% to KAVACH AI ORB Master Design Spec.
// Implements a stationary neon platform below the Orb with high-intensity
// purple glow and soft diffused borders.
// ============================================================

import React, { useMemo, useId } from "react";
import { OrbCore } from "./OrbCore";
import { OrbGlass } from "./OrbGlass";
import { OrbGlow } from "./OrbGlow";
import { OrbRing } from "./OrbRing";
import { OrbParticles } from "./OrbParticles";
import { OrbFace } from "./face/OrbFace";
import type { OrbRenderConfig } from "./OrbTypes";
import type { Viseme } from "./face/FaceTypes";

interface Props {
  /** Outer diameter in pixels */
  size?: number;
  /** Fully resolved config from core engine — Orb holds NO state */
  config: OrbRenderConfig;
  /** Optional accessibility label */
  ariaLabel?: string;
  /** Custom overlay emotion for rich facial expressions */
  customEmotion?: "neutral" | "happy" | "curious" | "focused" | "alert" | "sad" | "teasing" | "crying" | "waiting";
  /** Current active phoneme viseme for voice lipsync */
  viseme?: Viseme;
  /** If true, all animations and background particles are disabled for static icons/logos */
  staticMode?: boolean;
  /** If true, background particles and bottom platform are disabled, but animations/blinks/looks stay active */
  logoMode?: boolean;
}

// Float + platform breathing keyframe animations (stable size, high-intensity glow)
const FLOAT_KEYFRAMES = `
  @keyframes orbFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes orbPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.82; }
  }
  @keyframes orbEmergency {
    0%, 100% { transform: translateY(0px) scale(1); }
    25% { transform: translateY(-4px) scale(1.02); }
    75% { transform: translateY(4px) scale(0.98); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes orbPlatformBreath {
    0%, 100% { 
      opacity: 0.95; 
      filter: blur(4.5px);
      box-shadow: 
        0 0 45px rgba(168,85,247,0.98), 
        0 0 20px rgba(192,132,252,0.85),
        0 0 12px rgba(255,255,255,0.6);
    }
    45%, 55% { 
      opacity: 0.58; 
      filter: blur(6.5px);
      box-shadow: 
        0 0 24px rgba(168,85,247,0.65), 
        0 0 10px rgba(192,132,252,0.5);
    }
  }
`;

export const KavachOrb: React.FC<Props> = ({
  size = 120,
  config,
  ariaLabel,
  customEmotion,
  viseme,
  staticMode = false,
  logoMode = false,
}) => {
  const floatDuration = config.motion.float.duration;
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);

  // Resolve config overrides for static mode & logo mode (disabling particles/bloom)
  const resolvedConfig = useMemo(() => {
    if (!staticMode && !logoMode) return config;
    return {
      ...config,
      featureFlags: {
        ...config.featureFlags,
        enableParticles: false,
        enableBloom: false,
        enableWaves: false,
      }
    };
  }, [config, staticMode, logoMode]);

  // Resolve unified duration to keep Orb float and platform glow 100% in phase
  const resolvedDuration = useMemo(() => {
    if (config.state === "emergency") return 800;
    if (config.state === "idle") return floatDuration;
    return floatDuration * 0.7;
  }, [config.state, floatDuration]);

  const floatAnimation = useMemo(() => {
    if (staticMode) return "none";
    if (config.state === "emergency") {
      return `orbEmergency 0.8s ease-in-out infinite`;
    }
    if (config.state === "idle") {
      return `orbFloat ${resolvedDuration}ms ease-in-out infinite`;
    }
    return `orbFloat ${resolvedDuration}ms ease-in-out infinite, orbPulse ${floatDuration}ms ease-in-out infinite`;
  }, [config.state, resolvedDuration, floatDuration, staticMode]);

  const isEmergency = config.state === "emergency";

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `KAVACH AI — ${config.state}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* Inject global keyframes once */}
      <style>{FLOAT_KEYFRAMES}</style>

      {/* Float wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          animation: floatAnimation,
          willChange: "transform",
          zIndex: 1,
        }}
      >
        {/* Layer order: Glow → Particles → Core → Glass → Ring → Face */}
        <OrbGlow size={size} config={resolvedConfig} />
        <OrbParticles size={size} config={resolvedConfig} />
        <OrbCore size={size} config={resolvedConfig} />
        <OrbGlass size={size} config={resolvedConfig} />
        <OrbRing size={size} config={resolvedConfig} />
        <OrbFace
          orbState={resolvedConfig.state}
          color={resolvedConfig.colors[resolvedConfig.state] ?? resolvedConfig.colors.idle}
          stroke={resolvedConfig.face.eyes.stroke}
          eyeSeparation={resolvedConfig.face.eyes.separation}
          size={size}
          customEmotion={customEmotion}
          viseme={viseme}
          uid={uid}
        />
      </div>

      {/* Neon Light Floor Platform (Renders matching pure Purple/Violet glow of the Orb's bottom rim) */}
      {!logoMode && !staticMode && (
        <div
          style={{
            position: "absolute",
            bottom: `-${size * 0.12}px`,
            left: "5%",
            right: "5%",
            height: `${size * 0.08}px`,
            borderRadius: "50%",
            // Spec approved colors: radial gradient of neon purple (#A855F7) and deep violet (#7C3AED)
            background: isEmergency 
              ? "radial-gradient(ellipse at center, #EF4444 0%, #991B1B 50%, rgba(0,0,0,0) 80%)"
              : "radial-gradient(ellipse at center, #A855F7 0%, #7C3AED 50%, rgba(0,0,0,0) 80%)",
            filter: "blur(4.5px)",
            // Platform glow is perfectly in-phase with the floating orb duration
            animation: isEmergency 
              ? "orbPlatformBreath 0.8s ease-in-out infinite"
              : `orbPlatformBreath ${resolvedDuration}ms ease-in-out infinite`,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

export default KavachOrb;
