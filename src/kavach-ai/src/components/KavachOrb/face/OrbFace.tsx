// ============================================================
// OrbFace.tsx — Compositor assembling Face Mask + EyeRig + MouthRig + Star
// Owns blink scheduling, hybrid cursor tracking + idle look-around (saccades & gaze),
// mouth vertical breathing, and emotional expressions.
// ============================================================

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { OrbState } from "../OrbTypes";
import type { EmotionState, Viseme } from "./FaceTypes";
import { EyeRig } from "./EyeRig";
import { MouthRig } from "./MouthRig";
import { useBlinkController } from "./useBlinkController";

interface Props {
  orbState: OrbState;
  /** Active color driven by Orb state */
  color: string;
  /** Stroke width from face tokens */
  stroke: number;
  /** Eye center-to-center separation */
  eyeSeparation: number;
  /** Current TTS viseme (driven by voice hook) */
  viseme?: Viseme;
  /** Container size — face scales proportionally */
  size: number;
  /** Custom overlay emotion for rich facial expressions */
  customEmotion?: EmotionState;
  /** Unique id for SVG tags */
  uid: string;
}

/** Map OrbState → EmotionState for face expression */
function orbStateToEmotion(state: OrbState): EmotionState {
  switch (state) {
    case "listening": return "curious"; // 😮
    case "thinking": return "focused"; // 🤔
    case "speaking": return "happy";   // 😄
    case "warning": return "sad";     // 😟
    case "emergency": return "alert";   // 😠
    default: return "neutral"; // 😊
  }
}

export const OrbFace: React.FC<Props> = ({
  orbState,
  color,
  stroke,
  eyeSeparation,
  viseme = "rest",
  size,
  customEmotion,
  uid,
}) => {
  const blinkState = useBlinkController(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [idleEmotion, setIdleEmotion] = useState<EmotionState | null>(null);

  // Random idle emotion cycle (40% chance every 8s to make a funny/cute face for 2.5s)
  useEffect(() => {
    if (orbState !== "idle") {
      setIdleEmotion(null);
      return;
    }

    const interval = setInterval(() => {
      const isIdle = performance.now() - lastPointerTime.current > 3000;
      if (isIdle && Math.random() < 0.45) {
        const emotions: EmotionState[] = ["happy", "curious", "teasing", "waiting", "sad"];
        const randomEm = emotions[Math.floor(Math.random() * emotions.length)];
        setIdleEmotion(randomEm);

        // Reset to neutral after 2.5 seconds
        setTimeout(() => {
          setIdleEmotion(null);
        }, 2500);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [orbState]);

  const emotion = useMemo(() => {
    return customEmotion ?? idleEmotion ?? orbStateToEmotion(orbState);
  }, [orbState, customEmotion, idleEmotion]);

  // ── Hybrid Pointer + Idle Gaze Tracking System ──────────────────
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const lastPointerTime = useRef(performance.now());
  const idleTarget = useRef({ x: 0, y: 0 });

  // Update idle look targets randomly when user is inactive (no mouse move)
  useEffect(() => {
    const interval = setInterval(() => {
      const isIdle = performance.now() - lastPointerTime.current > 2000;
      if (isIdle) {
        const rand = Math.random();
        if (rand < 0.3) {
          // Look straight
          idleTarget.current = { x: 0, y: 0 };
        } else if (rand < 0.65) {
          // Look left / right
          idleTarget.current = { x: Math.random() > 0.5 ? 3.6 : -3.6, y: (Math.random() - 0.5) * 1.2 };
        } else {
          // Look slightly up / down
          idleTarget.current = { x: (Math.random() - 0.5) * 2.0, y: Math.random() > 0.5 ? 2.0 : -2.0 };
        }
      }
    }, 1200 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, []);

  // Smoothly LERP towards the idle target when pointer is inactive (snappier transition)
  useEffect(() => {
    let frameId: number;
    function tick() {
      const isIdle = performance.now() - lastPointerTime.current > 2000;
      if (isIdle) {
        setGaze((prev) => ({
          x: prev.x + (idleTarget.current.x - prev.x) * 0.14,
          y: prev.y + (idleTarget.current.y - prev.y) * 0.14,
        }));
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Cursor following mousemove/touchmove listener
  useEffect(() => {
    let lastTime = 0;

    function handlePointerMove(e: MouseEvent | TouchEvent) {
      const now = performance.now();
      if (now - lastTime < 16) return;
      lastTime = now;

      lastPointerTime.current = now; // update activity timestamp

      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const orbCenterX = rect.left + rect.width / 2;
      const orbCenterY = rect.top + rect.height / 2;

      let clientX = 0;
      let clientY = 0;
      if ("touches" in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const dx = clientX - orbCenterX;
      const dy = clientY - orbCenterY;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) return;

      const maxGaze = 3.0;
      const angle = Math.atan2(dy, dx);
      const factor = Math.min(dist / 280, 1.0);

      setGaze({
        x: Math.cos(angle) * maxGaze * factor,
        y: Math.sin(angle) * maxGaze * factor * 0.7,
      });
    }

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, []);

  // ── Saccadic Micro-Movements ──────────────────────────────────
  const [saccade, setSaccade] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Tiny random saccades (0.1px to 0.4px) to simulate eye muscles twitching
      setSaccade({
        x: (Math.random() - 0.5) * 0.6,
        y: (Math.random() - 0.5) * 0.4,
      });
    }, 180 + Math.random() * 150);
    return () => clearInterval(interval);
  }, []);

  // ── Mouth Breathing / Smiling Up & Down Cycle ──────────────
  const [mouthOffset, setMouthOffset] = useState(0);

  useEffect(() => {
    let frameId: number;
    let t = 0;
    function tick() {
      t += 0.04;
      setMouthOffset(Math.sin(t) * 1.0); // 1px smooth vertical breath shift
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Keep face shapes pure white and thin for high contrast premium look
  const faceConfig = useMemo(() => ({
    emotion,
    viseme,
    blinkState,
    color: "#FFFFFF",
    stroke: 3.2,
    eyeSeparation,
  }), [emotion, viseme, blinkState, eyeSeparation]);

  const scale = size / 120; // 120px is the base design size

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.95,
        transition: "opacity 400ms ease",
        zIndex: 10,
      }}
      aria-hidden="true"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes tearFall {
          0% { transform: translateY(0px) scaleY(0); opacity: 0; }
          10% { transform: translateY(2px) scaleY(1); opacity: 1; }
          80% { transform: translateY(16px) scaleY(1.1); opacity: 0.8; }
          100% { transform: translateY(20px) scaleY(0.1); opacity: 0; }
        }
        `
      }} />

      <g transform={`scale(${scale})`}>
        {/* Mockup Face Mask: solid black inverse heart/silhouette mask inside the sphere */}
        <path 
          d="M -44 12 C -44 -26, -24 -34, 0 -22 C 24 -34, 44 -26, 44 12 C 44 38, 28 46, 0 46 C -28 46, -44 38, -44 12 Z" 
          fill="#06020c"
          style={{
            filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.9))",
            opacity: 0.98,
          }}
        />

        {/* Glowing Star Sparkle at the forehead center, right at the top of the black mask */}
        <g
          transform="translate(0, -22)"
          style={{
            transformOrigin: "0px 0px",
            animation: orbState === "thinking"
              ? "spin 3s linear infinite"
              : orbState === "speaking"
                ? "spin 1.5s linear infinite"
                : "none"
          }}
        >
          <path
            d="M 0 -9 L 2.5 -2.5 L 9 0 L 2.5 2.5 L 0 9 L -2.5 2.5 L -9 0 L -2.5 -2.5 Z"
            fill="#FFFFFF"
            style={{
              filter: "drop-shadow(0 0 6px rgba(255, 255, 255, 0.95))",
            }}
          />
        </g>

        {/* Eyes positioned lower and shifting slightly to follow user's pointer + pupils shifting inside them */}
        <g
          transform={`translate(${(gaze.x + saccade.x) * 0.25}, ${3 + (gaze.y + saccade.y) * 0.25})`}
          style={{ transition: "transform 100ms ease-out" }}
        >
          <EyeRig config={faceConfig} gaze={{ x: gaze.x + saccade.x, y: gaze.y + saccade.y }} uid={uid} />
        </g>

        {/* Blushing Cheeks (Fades in during happy, speaking, and teasing expressions) */}
        <g style={{
          opacity: (emotion === "happy" || emotion === "teasing" || emotion === "speaking" as any) ? 0.65 : 0,
          transition: "opacity 350ms ease-in-out",
        }}>
          {/* Left Cheek Blush */}
          <ellipse
            cx={-eyeSeparation / 2 - 3 + (gaze.x * 0.25)}
            cy={12}
            rx={6.2}
            ry={2.6}
            fill="#F472B6"
            style={{ filter: "blur(1.5px)" }}
          />
          {/* Right Cheek Blush */}
          <ellipse
            cx={eyeSeparation / 2 + 3 + (gaze.x * 0.25)}
            cy={12}
            rx={6.2}
            ry={2.6}
            fill="#F472B6"
            style={{ filter: "blur(1.5px)" }}
          />
        </g>

        {/* Dynamic Crying Tears */}
        {emotion === "crying" && (
          <g>
            {/* Left Tear */}
            <circle
              cx={-eyeSeparation / 2 + (gaze.x * 0.25)}
              cy={10}
              r={1.8}
              fill="#60A5FA"
              style={{
                animation: "tearFall 1.5s linear infinite",
                filter: "drop-shadow(0 0 3px rgba(96,165,250,0.9))",
              }}
            />
            {/* Right Tear */}
            <circle
              cx={eyeSeparation / 2 + (gaze.x * 0.25)}
              cy={10}
              r={1.8}
              fill="#60A5FA"
              style={{
                animation: "tearFall 1.5s linear infinite",
                animationDelay: "0.75s",
                filter: "drop-shadow(0 0 3px rgba(96,165,250,0.9))",
              }}
            />
          </g>
        )}

        {/* Mouth positioned lower and breathing up/down */}
        <g
          transform={`translate(${gaze.x * 0.4}, ${gaze.y * 0.4})`}
          style={{ transition: "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)" }}
        >
          <MouthRig
            config={faceConfig}
            offsetY={24 + mouthOffset}
          />
        </g>
      </g>
    </svg>
  );
};
export default OrbFace;
