import darkTheme from "../styles/tokens/themes/dark.json";
import emergencyTheme from "../styles/tokens/themes/emergency.json";

export interface ThemeConfig {
  mode: string;
  primary: string;
  surface: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
}

export class ThemeRegistry {
  private registry: Map<string, ThemeConfig> = new Map();

  constructor() {
    // Pre-register core themes
    this.register("dark", darkTheme.theme);
    this.register("emergency", emergencyTheme.theme);
  }

  public register(name: string, config: ThemeConfig) {
    this.registry.set(name, config);
  }

  public resolve(name: string): ThemeConfig {
    const config = this.registry.get(name);
    if (!config) {
      // Fallback to dark theme
      return this.registry.get("dark")!;
    }
    return config;
  }
}

export const themeRegistry = new ThemeRegistry();
