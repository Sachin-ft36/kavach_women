import { useEffect, useState, useCallback } from "react";
import { themeRegistry, type ThemeConfig } from "../core/ThemeRegistry";
import { TokenLoader } from "../core/TokenLoader";
import { logger } from "../core/Logger";

export function useKavachTheme(initialThemeName: string = "dark") {
  const [themeName, setThemeName] = useState<string>(initialThemeName);
  const [resolvedTheme, setResolvedTheme] = useState<ThemeConfig>(themeRegistry.resolve(initialThemeName));

  const changeTheme = useCallback((name: string) => {
    logger.debug("ThemeEngine", `Changing theme context to: ${name}`);
    const resolved = themeRegistry.resolve(name);
    setThemeName(name);
    setResolvedTheme(resolved);
  }, []);

  // Sync theme changes with DOM CSS Custom Properties
  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    logger.debug("ThemeEngine", `Injecting CSS tokens for mode: ${themeName}`);

    // Colors Custom Properties
    root.style.setProperty("--kai-color-primary", resolvedTheme.primary);
    root.style.setProperty("--kai-color-surface", resolvedTheme.surface);
    root.style.setProperty("--kai-color-background", resolvedTheme.background);
    root.style.setProperty("--kai-color-text-primary", resolvedTheme.textPrimary);
    root.style.setProperty("--kai-color-text-secondary", resolvedTheme.textSecondary);
    root.style.setProperty("--kai-color-success", resolvedTheme.success);
    root.style.setProperty("--kai-color-warning", resolvedTheme.warning);
    root.style.setProperty("--kai-color-danger", resolvedTheme.danger);

    // Spacing Custom Properties
    const spacing = TokenLoader.getSpacing().spacing;
    root.style.setProperty("--kai-space-xs", `${spacing.xs}px`);
    root.style.setProperty("--kai-space-sm", `${spacing.sm}px`);
    root.style.setProperty("--kai-space-md", `${spacing.md}px`);
    root.style.setProperty("--kai-space-lg", `${spacing.lg}px`);
    root.style.setProperty("--kai-space-xl", `${spacing.xl}px`);

    // Motion Custom Properties
    const motion = TokenLoader.getMotion();
    root.style.setProperty("--kai-motion-float-duration", `${motion.float.duration}ms`);
    root.style.setProperty("--kai-motion-float-easing", motion.float.easing);
    root.style.setProperty("--kai-motion-pulse-duration", `${motion.pulse.duration}ms`);
    root.style.setProperty("--kai-motion-pulse-easing", motion.pulse.easing);

  }, [themeName, resolvedTheme]);

  return {
    themeName,
    theme: resolvedTheme,
    setTheme: changeTheme,
    isEmergency: themeName === "emergency",
    isDark: themeName === "dark"
  };
}
