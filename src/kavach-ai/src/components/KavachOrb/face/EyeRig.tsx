// ============================================================
// EyeRig.tsx — High-fidelity, cute hybrid eyeballs
// Normal states: Renders beautiful 3D circular white eyeballs with large, friendly
// dark pupils and glossy specular highlights that track the cursor.
// Squint states (happy/speaking/sad): Transition into cute, clean curved lines (◠ ◠).
// ============================================================

import React, { useMemo } from "react";
import type { FaceRigConfig, BlinkState } from "./FaceTypes";

interface Props {
  config: FaceRigConfig;
  /** Active gaze offset vector from parent mouse-tracking */
  gaze: { x: number; y: number };
  uid: string;
}

function blinkScaleY(blink: BlinkState): number {
  switch (blink) {
    case "closed": return 0.08;
    case "half": return 0.52;
    case "open": return 1.0;
  }
}

export const EyeRig: React.FC<Props> = ({ config, gaze, uid }) => {
  const scaleY = blinkScaleY(config.blinkState);
  const halfSep = config.eyeSeparation / 2;

  // Perfect cute circular eye radius
  const r = 9.0;
  const leftCx = -halfSep;
  const rightCx = halfSep;

  // Determine if we should render friendly squint curves (happy/speaking/sad) or full 3D eyeballs
  const isSquinting =
    config.emotion === "happy" ||
    config.emotion === "speaking" as any ||
    config.emotion === "sad";

  // Squint curve paths
  const leftSquintPath = useMemo(() => {
    if (config.emotion === "sad") {
      // Concerned droop pointing downwards (◡)
      return `M ${leftCx - 9.5} -1 Q ${leftCx} 6.5 ${leftCx + 9.5} -1`;
    }
    // Happy squint arches pointing upwards (◠)
    return `M ${leftCx - 9.5} 1.5 Q ${leftCx} -6 ${leftCx + 9.5} 1.5`;
  }, [config.emotion, leftCx]);

  const rightSquintPath = useMemo(() => {
    if (config.emotion === "sad") {
      // Concerned droop pointing downwards (◡)
      return `M ${rightCx - 9.5} -1 Q ${rightCx} 6.5 ${rightCx + 9.5} -1`;
    }
    // Happy squint arches pointing upwards (◠)
    return `M ${rightCx - 9.5} 1.5 Q ${rightCx} -6 ${rightCx + 9.5} 1.5`;
  }, [config.emotion, rightCx]);

  // Dampen pupil movement to keep them inside the eyeball boundaries
  const pupilX = gaze.x * 0.95;
  const pupilY = gaze.y * 0.8;

  // Dynamic vertical squeeze (squinting when looking far or in focused states)
  const squeezeY = useMemo(() => {
    let baseSqueeze = 1.0;
    if (config.emotion === "focused") {
      baseSqueeze = 0.72; // slight squeeze for thinking/focused state
    } else if (config.emotion === "alert") {
      baseSqueeze = 0.82; // warning/emergency state
    }

    const gazeDist = Math.hypot(gaze.x, gaze.y);
    const gazeSquint = Math.min(gazeDist / 22, 0.12);

    return baseSqueeze * (1.0 - gazeSquint);
  }, [config.emotion, gaze.x, gaze.y]);

  const totalScaleY = scaleY * squeezeY;

  return (
    <g aria-hidden="true">
      {/* Radial Gradient for 3D Porcelain Eyeball Scleras */}
      <defs>
        <radialGradient id={`sclera-3d-left-${uid}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </radialGradient>
        <radialGradient id={`sclera-3d-right-${uid}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </radialGradient>

        <clipPath id={`left-eyeball-clip-${uid}`}>
          <circle cx={leftCx} cy={0} r={r} />
        </clipPath>
        <clipPath id={`right-eyeball-clip-${uid}`}>
          <circle cx={rightCx} cy={0} r={r} />
        </clipPath>
      </defs>

      {/* ── LEFT EYE SYSTEM ── */}
      <g
        style={{
          transform: `scaleY(${isSquinting ? scaleY : totalScaleY})`,
          transformOrigin: `${leftCx}px 0px`,
          transition: "transform 130ms cubic-bezier(0.19, 1, 0.22, 1)",
        }}
      >
        {isSquinting ? (
          // Clean stroked squint curve for happy/sad
          <path
            d={leftSquintPath}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3.4}
            strokeLinecap="round"
            style={{ transition: "d 180ms ease" }}
          />
        ) : (
          // Full 3D Eyeball with moving pupil
          <>
            {/* 3D White Sphere */}
            <circle cx={leftCx} cy={0} r={r} fill={`url(#sclera-3d-left-${uid})`} />

            {/* Clipped Pupil & Specular Highlights */}
            <g clipPath={`url(#left-eyeball-clip-${uid})`}>
              {/* Large, friendly dark pupil */}
              <circle
                cx={leftCx + pupilX}
                cy={pupilY}
                r={4.8}
                fill="#0F0A1C"
                style={{ transition: "cx 140ms ease-out, cy 140ms ease-out" }}
              />
              {/* Glossy glint highlight */}
              <circle
                cx={leftCx + pupilX - 1.6}
                cy={pupilY - 1.6}
                r={1.5}
                fill="#FFFFFF"
                style={{ transition: "cx 140ms ease-out, cy 140ms ease-out" }}
              />
              {/* Soft secondary reflection */}
              <circle
                cx={leftCx + pupilX + 1.8}
                cy={pupilY + 1.8}
                r={0.7}
                fill="#FFFFFF"
                opacity={0.5}
                style={{ transition: "cx 140ms ease-out, cy 140ms ease-out" }}
              />
            </g>
          </>
        )}
      </g>

      {/* ── RIGHT EYE SYSTEM ── */}
      <g
        style={{
          transform: `scaleY(${isSquinting ? scaleY : totalScaleY})`,
          transformOrigin: `${rightCx}px 0px`,
          transition: "transform 130ms cubic-bezier(0.19, 1, 0.22, 1)",
        }}
      >
        {isSquinting ? (
          // Clean stroked squint curve for happy/sad
          <path
            d={rightSquintPath}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3.4}
            strokeLinecap="round"
            style={{ transition: "d 180ms ease" }}
          />
        ) : (
          // Full 3D Eyeball with moving pupil
          <>
            {/* 3D White Sphere */}
            <circle cx={rightCx} cy={0} r={r} fill={`url(#sclera-3d-right-${uid})`} />

            {/* Clipped Pupil & Specular Highlights */}
            <g clipPath={`url(#right-eyeball-clip-${uid})`}>
              {/* Large, friendly dark pupil */}
              <circle
                cx={rightCx + pupilX}
                cy={pupilY}
                r={4.8}
                fill="#0F0A1C"
                style={{ transition: "cx 140ms ease-out, cy 140ms ease-out" }}
              />
              {/* Glossy glint highlight */}
              <circle
                cx={rightCx + pupilX - 1.6}
                cy={pupilY - 1.6}
                r={1.5}
                fill="#FFFFFF"
                style={{ transition: "cx 140ms ease-out, cy 140ms ease-out" }}
              />
              {/* Soft secondary reflection */}
              <circle
                cx={rightCx + pupilX + 1.8}
                cy={pupilY + 1.8}
                r={0.7}
                fill="#FFFFFF"
                opacity={0.5}
                style={{ transition: "cx 140ms ease-out, cy 140ms ease-out" }}
              />
            </g>
          </>
        )}
      </g>
    </g>
  );
};
