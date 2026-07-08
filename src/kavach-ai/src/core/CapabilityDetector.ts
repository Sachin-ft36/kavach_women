export type RenderQuality = "low" | "balanced" | "high" | "ultra";

export interface CapabilityStats {
  quality: RenderQuality;
  batteryLevel: number;
  isPowerSaving: boolean;
  reduceMotion: boolean;
}

export class CapabilityDetector {
  private reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

  public async detect(): Promise<CapabilityStats> {
    let batteryLevel = 1.0;
    let isCharging = true;

    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level;
        isCharging = battery.charging;
      }
    } catch {}

    const reduceMotion = this.reduceMotionMedia.matches;
    const isPowerSaving = batteryLevel < 0.15 && !isCharging;

    // Detect quality profile based on CPU cores, RAM, and battery state
    let quality: RenderQuality = "balanced";

    // High performance device
    const cores = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory || 4;

    if (cores >= 8 && deviceMemory >= 8) {
      quality = "ultra";
    } else if (cores >= 6 && deviceMemory >= 6) {
      quality = "high";
    } else if (cores <= 2 || deviceMemory <= 2) {
      quality = "low";
    }

    // Force lower quality in power saving or reduced motion
    if (isPowerSaving) {
      quality = "low";
    }

    return {
      quality,
      batteryLevel,
      isPowerSaving,
      reduceMotion
    };
  }

  public subscribeToMotionReduction(callback: (reduce: boolean) => void): () => void {
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    try {
      this.reduceMotionMedia.addEventListener("change", handler);
    } catch {
      this.reduceMotionMedia.addListener(handler);
    }
    return () => {
      try {
        this.reduceMotionMedia.removeEventListener("change", handler);
      } catch {
        this.reduceMotionMedia.removeListener(handler);
      }
    };
  }
}

export const capabilityDetector = new CapabilityDetector();
