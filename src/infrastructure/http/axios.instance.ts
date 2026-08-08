import axios from "axios";
import { apiUrl, fallbackApiUrl } from "../../config/backend";

const SESSION_EXPIRED_EVENT = "sikk:session-expired";

const BACKEND_UNAVAILABLE_EVENT = "sikk:backend-unavailable";

const SESSION_INVALIDATING_MESSAGES = new Set([
  "El usuario no tiene acceso al Web Operativo",
  "El usuario no tiene acceso a esta aplicación",
  "La cuenta aún no ha sido validada",
]);

let sessionTokenMarker: string | null = null;

declare module "axios" {
  export interface AxiosRequestConfig {
    skipSessionExpiredHandling?: boolean;
    _viggoRetriedNetworkError?: boolean;
    _viggoRetriedWithFallback?: boolean;
  }
}

export const setSessionTokenMarker = (token: string | null): void => {
  sessionTokenMarker = token;
};

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (sessionTokenMarker) {
    config.headers.Authorization = `Bearer ${sessionTokenMarker}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const canRetryNetworkError =
      Boolean(config) &&
      !config._viggoRetriedNetworkError &&
      !error.response &&
      (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED");

    if (canRetryNetworkError && config) {
      return api.request({
        ...config,
        _viggoRetriedNetworkError: true,
      });
    }

    const canRetryWithFallback =
      Boolean(fallbackApiUrl) &&
      Boolean(config) &&
      !config._viggoRetriedWithFallback &&
      !error.response &&
      (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED");

    if (canRetryWithFallback && config && fallbackApiUrl) {
      console.warn("[axios] Primary API unavailable, retrying with fallback", {
        primary: apiUrl,
        fallback: fallbackApiUrl,
        url: config.url,
      });

      return api.request({
        ...config,
        baseURL: fallbackApiUrl,
        _viggoRetriedWithFallback: true,
      });
    }

    const responseData =
      typeof error.response?.data === "object" &&
      error.response.data !== null &&
      !Array.isArray(error.response.data)
        ? (error.response.data as Record<string, unknown>)
        : null;

    const normalizedMessage =
      (typeof responseData?.error === "string" && responseData.error.trim()) ||
      (typeof responseData?.message === "string" &&
        responseData.message.trim()) ||
      null;

    if (normalizedMessage) {
      error.message = normalizedMessage;
    }

    const status = error.response?.status as number | undefined;

    const shouldHandleSessionExpired = !config?.skipSessionExpiredHandling;

    const accessWasRevoked =
      status === 403 &&
      normalizedMessage !== null &&
      SESSION_INVALIDATING_MESSAGES.has(normalizedMessage);

    const sessionIsInvalid = status === 401 || accessWasRevoked;

    if (sessionIsInvalid && shouldHandleSessionExpired && sessionTokenMarker) {
      setSessionTokenMarker(null);

      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    const hasNoResponse = !error.response;

    const isBackendUnavailable =
      error.code !== "ERR_CANCELED" &&
      (hasNoResponse || (typeof status === "number" && status >= 500));

    if (isBackendUnavailable) {
      window.dispatchEvent(
        new CustomEvent(BACKEND_UNAVAILABLE_EVENT, {
          detail: {
            source: "http",
            status: status ?? null,
            message: error.message ?? "Backend no disponible",
          },
        }),
      );
    }

    return Promise.reject(error);
  },
);
