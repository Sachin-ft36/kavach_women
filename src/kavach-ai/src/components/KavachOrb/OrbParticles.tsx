// ============================================================
// OrbParticles.tsx — Floating particle field around Orb
// Conforms 100% to KAVACH AI ORB Master Design Spec.
// Renders 35 slow-drifting particles with soft glows and opacity 20%-80%.
// ============================================================

import React, { useMemo } from "react";
import type { OrbRenderConfig } from "./OrbTypes";

interface Props {
  size: number;
  config: OrbRenderConfig;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

function generateParticles(count: number, orbSize: number): Particle[] {
  const colors = ["#FFFFFF", "#EC4899", "#22D3EE", "#A855F7"];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = orbSize * (0.6 + Math.random() * 0.5);
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      radius: 0.8 + Math.random() * 1.5,
      // Spec approved: Opacity between 20% and 80%
      opacity: 0.2 + Math.random() * 0.6,
      // Slow float duration
      duration: 3500 + Math.random() * 3500,
      delay: Math.random() * -4000,
      color,
    };
  });
}

export const OrbParticles: React.FC<Props> = ({ size, config }) => {
  // Spec approved: 30-50 particles, center around 35
  const count = 35;

  const particles = useMemo(
    () => generateParticles(count, size / 2),
    [count, size]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <svg
        width={size * 3}
        height={size * 3}
        style={{
          position: "absolute",
          top: `${-size}px`,
          left: `${-size}px`,
          overflow: "visible",
        }}
      >
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={size * 1.5 + p.x}
            cy={size * 1.5 + p.y}
            r={p.radius}
            fill={p.color}
            opacity={p.opacity}
            style={{
              animation: `orbParticleFloat ${p.duration}ms ease-in-out infinite`,
              animationDelay: `${p.delay}ms`,
              filter: p.color === "#FFFFFF" ? "drop-shadow(0 0 1.5px rgba(255,255,255,0.7))" : `drop-shadow(0 0 2px ${p.color}aa)`,
            }}
          />
        ))}
      </svg>

      <style>{`
        @keyframes orbParticleFloat {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: inherit; }
          50% { transform: translate(calc(var(--x, 4px) * -1), -8px) scale(1.2); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};
