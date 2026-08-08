const truthyValues = new Set(["1", "true", "yes", "on"]);

const normalizeUrl = (value: string | undefined): string | null => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (typeof value !== "string") return fallback;
  return truthyValues.has(value.trim().toLowerCase());
};

const isProductionBuild = parseBoolean(import.meta.env.VITE_PROD);
const useDevProxy = !isProductionBuild && parseBoolean(import.meta.env.VITE_DEV_USE_PROXY);

const directApiUrl = normalizeUrl(import.meta.env.VITE_API_URL);
const directSocketUrl = normalizeUrl(import.meta.env.VITE_SOCKET_URL);

const prodApiUrl = normalizeUrl(import.meta.env.VITE_PROD_API_URL);
const prodSocketUrl = normalizeUrl(import.meta.env.VITE_PROD_SOCKET_URL);
const devApiUrl = normalizeUrl(import.meta.env.VITE_DEV_API_URL);
const devSocketUrl = normalizeUrl(import.meta.env.VITE_DEV_SOCKET_URL);
const apiFallbackEnabled = parseBoolean(import.meta.env.VITE_API_FALLBACK_ENABLED);

const runtimeOrigin =
  typeof window !== "undefined" ? window.location.origin : "";

export const apiUrl = useDevProxy
  ? ""
  : (isProductionBuild ? prodApiUrl ?? directApiUrl : devApiUrl ?? directApiUrl) ??
    prodApiUrl ??
    devApiUrl ??
    "";

export const socketUrl = useDevProxy
  ? runtimeOrigin
  : (isProductionBuild
      ? prodSocketUrl ?? directSocketUrl
      : devSocketUrl ?? devApiUrl ?? directSocketUrl) ??
    prodSocketUrl ??
    devSocketUrl ??
    directSocketUrl ??
    apiUrl;

export const backendScopeKey =
  (useDevProxy ? runtimeOrigin : apiUrl) || "default";
export const isProdBackend = isProductionBuild;

const getAlternateLocalhostUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    const isLocalHost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1";

    if (!isLocalHost) return null;

    if (parsed.port === "3002") {
      parsed.port = "3000";
      return parsed.toString().replace(/\/$/, "");
    }

    if (parsed.port === "3000") {
      parsed.port = "3002";
      return parsed.toString().replace(/\/$/, "");
    }

    return null;
  } catch {
    return null;
  }
};

export const fallbackApiUrl =
  apiFallbackEnabled && apiUrl ? getAlternateLocalhostUrl(apiUrl) : null;
