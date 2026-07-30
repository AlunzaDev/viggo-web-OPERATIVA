import axios from "axios";
import { apiUrl, fallbackApiUrl } from "../../config/backend";

let sessionTokenMarker: string | null = null;

declare module "axios" {
  export interface AxiosRequestConfig {
    skipSessionExpiredHandling?: boolean;
    _viggoRetriedWithFallback?: boolean;
  }
}

export const setSessionTokenMarker = (token: string | null) => {
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

// Interceptor de respuesta: detecta token expirado (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const canRetryWithFallback =
      !!fallbackApiUrl &&
      !config?._viggoRetriedWithFallback &&
      !config?.skipSessionExpiredHandling &&
      !error.response &&
      (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED");

    if (canRetryWithFallback && config) {
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
      error.response?.data !== null &&
      !Array.isArray(error.response.data)
        ? (error.response.data as Record<string, unknown>)
        : null;

    const normalizedMessage =
      (typeof responseData?.error === "string" && responseData.error.trim()) ||
      (typeof responseData?.message === "string" && responseData.message.trim()) ||
      null;

    if (normalizedMessage) {
      error.message = normalizedMessage;
    }

    const shouldHandleSessionExpired = !error.config?.skipSessionExpiredHandling;

    if (error.response?.status === 401 && shouldHandleSessionExpired && sessionTokenMarker) {
      setSessionTokenMarker(null);

      // Notifica a la app via CustomEvent (el AuthProvider lo escucha)
      window.dispatchEvent(new CustomEvent("sikk:session-expired"));
    }

    const status = error.response?.status as number | undefined;
    const hasNoResponse = !error.response;
    const isBackendUnavailable =
      error.code !== "ERR_CANCELED" &&
      (hasNoResponse || (typeof status === "number" && status >= 500));

    if (isBackendUnavailable) {
      window.dispatchEvent(
        new CustomEvent("sikk:backend-unavailable", {
          detail: {
            source: "http",
            status: status ?? null,
            message: error.message ?? "Backend no disponible",
          },
        })
      );
    }

    return Promise.reject(error);
  }
);
