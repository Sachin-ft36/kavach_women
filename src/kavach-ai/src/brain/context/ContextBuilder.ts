// ============================================================
// context/ContextBuilder.ts — Assembles a ContextFrame
// Collects current screen, language, battery and network state.
// Pure builder — no side effects on the AI or UI layers.
// ============================================================

import type { ContextFrame } from "../BrainTypes";

export interface ContextBuilderInput {
  currentScreen: string;
  language: string;
  userName: string;
  geofenceZone?: string;
}

export class ContextBuilder {
  private input: ContextBuilderInput;

  constructor(input: ContextBuilderInput) {
    this.input = input;
  }

  public async build(): Promise<ContextFrame> {
    let batteryLevel: number | undefined;

    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level as number;
      }
    } catch {
      // Battery API not available — ignore
    }

    return {
      currentScreen: this.input.currentScreen,
      language:      this.input.language,
      userName:      this.input.userName,
      timestamp:     new Date().toISOString(),
      geofenceZone:  this.input.geofenceZone,
      batteryLevel,
      isOnline:      navigator.onLine,
    };
  }
}
