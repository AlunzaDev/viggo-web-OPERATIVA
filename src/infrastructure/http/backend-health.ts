import { apiUrl } from "../../config/backend";

const BACKEND_HEALTH_TIMEOUT_MS = 4_000;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const buildHealthcheckUrls = () => {
  const baseUrl = trimTrailingSlash(apiUrl || window.location.origin);

  return [
    `${baseUrl}/api/health`,
    `${baseUrl}/health`,
    `${baseUrl}/api/proyectos`,
    baseUrl,
  ];
};

const isReachableStatus = (status: number) => status > 0 && status < 500;

const checkUrl = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BACKEND_HEALTH_TIMEOUT_MS);

  try {
    const response = await window.fetch(url, {
      cache: "no-store",
      method: "GET",
      signal: controller.signal,
      credentials: "include",
    });

    return isReachableStatus(response.status);
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const checkBackendAvailability = async () => {
  const results = await Promise.all(buildHealthcheckUrls().map((url) => checkUrl(url)));

  return results.some(Boolean);
};
