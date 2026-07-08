// ============================================================
// OrbConfigResolver.ts — Bridges design tokens + orb state
// to produce a fully resolved OrbRenderConfig for the renderer.
// This is the ONLY file that reads token JSON and registry data.
// ============================================================

import type { OrbRenderConfig, OrbState, RenderQuality } from "./OrbTypes";

// Static token imports (read once at module load)
import colorsJson from "../../styles/tokens/colors.json";
import motionJson from "../../styles/tokens/motion.json";
import physicsJson from "../../styles/tokens/physics.json";
import faceJson from "../../styles/tokens/face.json";

export function resolveOrbConfig(
  state: OrbState,
  quality: RenderQuality
): OrbRenderConfig {
  // colors.json → { orb: {...}, glow: {...} }
  const orbColors = colorsJson.orb;
  const glowColors = colorsJson.glow;

  const colors = {
    idle: orbColors.idle,
    listening: orbColors.listening,
    thinking: orbColors.thinking,
    success: orbColors.success,
    warning: orbColors.warning,
    emergency: orbColors.emergency,
  };

  const glow = {
    idle:      { color: glowColors.idle,      radius: "24px", opacity: 0.40 },
    listening: { color: glowColors.listening, radius: "32px", opacity: 0.55 },
    thinking:  { color: glowColors.thinking,  radius: "28px", opacity: 0.35 },
    success:   { color: glowColors.success,   radius: "28px", opacity: 0.45 },
    warning:   { color: glowColors.warning,   radius: "36px", opacity: 0.55 },
    emergency: { color: glowColors.emergency, radius: "48px", opacity: 0.75 },
  };

  // face.json → { eyes: {...}, mouth: {...}, sparkle: {...} }
  const face = {
    eyes: {
      stroke:      faceJson.eyes.stroke,
      blinkRate:   faceJson.eyes.blinkRate,
      separation:  faceJson.eyes.separation,
    },
    mouth: {
      width:  faceJson.mouth.width,
      height: faceJson.mouth.height,
      stroke: faceJson.mouth.stroke,
    },
    sparkle: {
      rotation: faceJson.sparkle.rotation,
      offsetY:  faceJson.sparkle.offsetY,
    },
  };

  // physics.json → { physics: { gravity, levitation, ... } }
  const p = physicsJson.physics;
  const physics = {
    gravity:    p.gravity,
    levitation: p.levitation,
    friction:   p.friction,
    mass:       p.mass,
    tension:    p.tension,
    elasticity: p.elasticity,
  };

  // motion.json — top-level keys match our interface exactly
  const motion = {
    float:           { duration: motionJson.float.duration,           easing: motionJson.float.easing },
    pulse:           { duration: motionJson.pulse.duration,           easing: motionJson.pulse.easing },
    blink:           { duration: motionJson.blink.duration,           easing: motionJson.blink.easing },
    listeningExpand: { duration: motionJson.listeningExpand.duration, easing: motionJson.listeningExpand.easing },
    thinkingRotate:  { duration: motionJson.thinkingRotate.duration,  easing: motionJson.thinkingRotate.easing },
    emergencyPulse:  { duration: motionJson.emergencyPulse.duration,  easing: motionJson.emergencyPulse.easing },
  };

  // Feature flags based on quality profile
  const featureFlags = {
    enableParticles:  quality === "high" || quality === "ultra",
    enableReflection: quality !== "low",
    enableBloom:      quality === "high" || quality === "ultra",
    enableWaves:      quality !== "low",
    enableGyroscope:  quality === "ultra",
  };

  return { state, colors, glow, face, physics, motion, quality, featureFlags };
}
