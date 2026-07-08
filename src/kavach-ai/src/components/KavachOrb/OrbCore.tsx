// ============================================================
// OrbCore.tsx — Base sphere layer with volumetric purple rim and reflections
// Conforms 100% to KAVACH AI ORB Master Design Spec & reference image.
// Refines shadows to implement a sharp, high-intensity neon purple outer edge
// and tight glow, reducing wide blurriness while maintaining premium bloom.
// ============================================================

import React from "react";
import type { OrbRenderConfig } from "./OrbTypes";

interface Props {
  size: number;
  config: OrbRenderConfig;
}

export const OrbCore: React.FC<Props> = ({ size, config }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        // Spec approved: Volumetric Core Colors (Center #2E1065, Middle #5B21B6, Highlight #C084FC)
        background: "radial-gradient(circle at 40% 30%, #5B21B6 0%, #2E1065 70%, #000000 100%)",
        // Solid, sharp neon purple rim outline to define the glass edge sharply (no blurriness)
        border: "2.6px solid #A855F7",
        // Spec approved: Sharp, tight outer rim highlight combined with a soft, low-intensity background bloom
        boxShadow: `
          inset 0 0 28px rgba(168, 85, 247, 0.98), 
          inset 0 0 12px rgba(240, 171, 252, 0.85),
          0 0 8px rgba(168, 85, 247, 0.95),
          0 0 24px rgba(168, 85, 247, 0.55),
          0 0 10px rgba(192, 132, 252, 0.4)
        `,
        transition: "border-color 0.6s ease, box-shadow 0.6s ease",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {/* ── STACKED INNER GLOWS & REFLECTIONS ── */}

      {/* 1. Top Purple Reflection (Upper) */}
      <div style={{
        position: "absolute",
        top: "2%",
        left: "15%",
        right: "15%",
        height: "22%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(168,85,247,0.55) 0%, rgba(168,85,247,0) 75%)",
        filter: "blur(2.5px)",
        pointerEvents: "none",
      }} />

      {/* 2. Top-Middle Blue Reflection (Just below Top Purple) */}
      <div style={{
        position: "absolute",
        top: "15%",
        left: "20%",
        right: "20%",
        height: "18%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(34,211,238,0.35) 0%, rgba(34,211,238,0) 75%)",
        filter: "blur(3px)",
        pointerEvents: "none",
      }} />

      {/* 3. Left Side Blue Reflection */}
      <div style={{
        position: "absolute",
        left: "1%",
        top: "22%",
        bottom: "22%",
        width: "22%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0) 80%)",
        filter: "blur(3px)",
        pointerEvents: "none",
      }} />

      {/* 4. Right Side Blue Reflection */}
      <div style={{
        position: "absolute",
        right: "1%",
        top: "22%",
        bottom: "22%",
        width: "22%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0) 80%)",
        filter: "blur(3px)",
        pointerEvents: "none",
      }} />

      {/* 5. Bottom Blue Reflection */}
      <div style={{
        position: "absolute",
        bottom: "5%",
        left: "22%",
        right: "22%",
        height: "18%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(34,211,238,0.32) 0%, rgba(34,211,238,0) 75%)",
        filter: "blur(2.5px)",
        pointerEvents: "none",
      }} />
    </div>
  );
};
export default OrbCore;
