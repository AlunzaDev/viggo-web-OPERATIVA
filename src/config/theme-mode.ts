export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

const isThemeMode = (value: unknown): value is ThemeMode => {
  return value === "light" || value === "dark";
};

const parseEnvBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
};

const parseEnvThemeMode = (value: string | undefined): ThemeMode | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "dark") return "dark";
  if (normalized === "light") return "light";
  if (TRUE_VALUES.has(normalized)) return "dark";
  if (FALSE_VALUES.has(normalized)) return "light";
  return null;
};

const resolveThemeFromEnv = (): ThemeMode | null => {
  const explicitThemeMode = parseEnvThemeMode(import.meta.env.VITE_THEME_MODE);
  if (explicitThemeMode) return explicitThemeMode;

  // Compatibilidad con la llave anterior.
  const legacyDarkModeEnabled = parseEnvBoolean(import.meta.env.VITE_ENABLE_DARK_MODE, true);
  return legacyDarkModeEnabled ? null : "light";
};

export const themeFromEnv = resolveThemeFromEnv();
const requestedThemeLockFromEnv = parseEnvBoolean(import.meta.env.VITE_THEME_LOCK, false);
export const isThemeLockedByEnv = requestedThemeLockFromEnv && themeFromEnv !== null;

export const resolveThemeForRuntime = (theme: ThemeMode): ThemeMode => {
  if (isThemeLockedByEnv && themeFromEnv) return themeFromEnv;
  return theme;
};

export const readStoredTheme = (): ThemeMode | null => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(savedTheme) ? savedTheme : null;
  } catch {
    return null;
  }
};

export const resolveInitialTheme = (): ThemeMode => {
  if (isThemeLockedByEnv && themeFromEnv) return themeFromEnv;

  const savedTheme = readStoredTheme();
  if (savedTheme) return savedTheme;

  if (themeFromEnv) return themeFromEnv;

  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
};

export const applyTheme = (requestedTheme: ThemeMode): ThemeMode => {
  const runtimeTheme = resolveThemeForRuntime(requestedTheme);

  try {
    document.documentElement.setAttribute("data-theme", runtimeTheme);
    localStorage.setItem(THEME_STORAGE_KEY, runtimeTheme);
  } catch {
    // No-op: allow app render even when storage is blocked.
  }

  return runtimeTheme;
};
