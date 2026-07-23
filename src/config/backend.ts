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
