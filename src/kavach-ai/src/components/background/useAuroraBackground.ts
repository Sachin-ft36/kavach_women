// ============================================================
// useAuroraBackground.ts — Canvas-based aurora + wave renderer
// Conforms 100% to KAVACH AI ORB Master Design Spec DNA wave.
// Renders slowly flowing 3D DNA strands with purple, pink, cyan, and white sparkles.
// Uses configuration referencing (useRef) to ensure the animation loop is never
// torn down or interrupted on re-renders, guaranteeing zero stutters.
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import type { RenderQuality } from "../KavachOrb/OrbTypes";

interface AuroraConfig {
  quality: RenderQuality;
  primaryColor: string;
  accentColor: string;
  /** Whether to draw at all (false = skip on low battery) */
  enabled: boolean;
}

interface WaveLayer {
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  opacity: number;
  color: string;
  isSparkle?: boolean;
}

function buildWaveLayers(quality: RenderQuality): WaveLayer[] {
  // Spec approved: DNA Colors (Purple #8B5CF6, Pink #EC4899, Cyan #22D3EE)
  // Speeds set to 2.5 - 3.0 for a fluid, elegant flow
  const base: WaveLayer[] = [
    { amplitude: 22, frequency: 0.016, speed: 2.5, phase: 0, opacity: 0.65, color: "#8B5CF6" }, // Purple strand
    { amplitude: 14, frequency: 0.024, speed: 3.0, phase: 2.1, opacity: 0.50, color: "#EC4899" }, // Pink strand
  ];

  if (quality === "high" || quality === "ultra") {
    base.push(
      { amplitude: 10, frequency: 0.036, speed: 2.0, phase: 4.3, opacity: 0.40, color: "#22D3EE" }, // Cyan strand
    );
  }

  return base;
}

export function useAuroraBackground(config: AuroraConfig) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Store config in a ref to avoid tearing down the V-Sync loop when parent state changes
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const draw = useCallback((
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
  ) => {
    ctx.clearRect(0, 0, w, h);

    const activeConfig = configRef.current;
    const layers = buildWaveLayers(activeConfig.quality);

    layers.forEach((layer) => {
      // Draw double helix strands (DNA style) offset by 180 degrees
      const strands = [layer.phase, layer.phase + Math.PI];

      strands.forEach((phase, strandIdx) => {
        const step = 8; // Render a dot particle every 8 pixels along the wave
        for (let x = 0; x <= w; x += step) {
          const y =
            h * 0.5 +
            Math.sin(x * layer.frequency + t * layer.speed + phase) * layer.amplitude +
            Math.sin(x * layer.frequency * 1.5 + t * layer.speed * 0.6 + phase * 1.2) * (layer.amplitude * 0.25);

          // 3D perspective depth modulation
          const zDepth = Math.cos(x * layer.frequency * 2 + t * layer.speed * 1.2 + phase);
          const r = (1.4 + zDepth * 0.9) * (layer.amplitude > 15 ? 1.4 : 1.0);

          // Spec approved: Render white sparkles along the DNA strands
          const isSparkle = (Math.sin(x * 0.05 + phase * 5.0) > 0.85);
          ctx.fillStyle = isSparkle ? "#FFFFFF" : layer.color;
          ctx.globalAlpha = isSparkle
            ? 0.9
            : (strandIdx === 0 ? layer.opacity : layer.opacity * 0.6);

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    ctx.globalAlpha = 1.0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize observer to handle container size changes without resetting loop
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let lastFrame = performance.now();

    function animate(now: number) {
      const elapsed = now - lastFrame;
      lastFrame = now;

      if (configRef.current.enabled) {
        // Smooth accumulated time wrapped at 360 to prevent float overflow / lag
        timeRef.current = (timeRef.current + elapsed * 0.001) % 360;
        draw(ctx!, canvas!.width, canvas!.height, timeRef.current);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [draw]); // Stable dependency array guarantees uninterrupted V-Sync loop

  return canvasRef;
}
export default useAuroraBackground;
