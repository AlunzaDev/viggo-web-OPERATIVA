import type {
  BrowserInstallationLocation,
  LocalInstallation,
  LocalInstallationStatus,
} from "./installation.api";
import {
  isOperationalBackendUnavailable,
  normalizeOperationalUserMessage,
} from "../operations/operational-state.presenter";

export type InstallationAlertTone = "error" | "warning";
export type InstallationGateMode = "backendUnavailable" | "ready" | "waitingApproval";

const WAITING_INSTALLATION_STATUSES: LocalInstallationStatus[] = ["requested", "approved"];
const INSTALLATION_STATUS_COPY: Record<LocalInstallationStatus, string> = {
  pending: "Escribe el código de vinculación del proyecto para conectar este equipo.",
  requested: "Solicitud enviada. Falta que la aprueben en el panel administrativo.",
  approved: "Solicitud aprobada. Recarga la página para terminar.",
  rejected: "La solicitud fue rechazada. Revisa el motivo y vuelve a solicitarla.",
  linked: "Este equipo ya está vinculado al proyecto.",
};

/** How often the gate checks whether the cloud approved the request. */
export const INSTALLATION_POLL_INTERVAL_MS = 12_000;

export const GEOLOCATION_TIMEOUT_MS = 8000;
export const GEOLOCATION_RELAXED_TIMEOUT_MS = 15000;
export const GEOLOCATION_CACHE_MAX_AGE_MS = 1000 * 60 * 5;

export const LOCATION_REQUIRED_ERROR = "__location_required__";
export const LOCATION_PERMISSION_DENIED_ERROR = "__location_permission_denied__";
export const LOCATION_TIMEOUT_ERROR = "__location_timeout__";
export const LOCATION_UNAVAILABLE_ERROR = "__location_unavailable__";
export const LOCATION_FETCH_FAILED_ERROR = "__location_fetch_failed__";

const logGeolocationFailure = (
  label: string,
  payload: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;
  console.debug(label, payload);
};

export const isBackendUnavailableMessage = (rawMessage: string): boolean => {
  return isOperationalBackendUnavailable(rawMessage);
};

export const shouldRedirectToSessionExpired = (rawMessage: string): boolean => {
  const normalized = rawMessage.trim().toLowerCase();

  return (
    normalized.includes("user not found or inactive") ||
    normalized.includes("unauthorized") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid token")
  );
};

export const isInstallationWaitingApproval = (
  installation: LocalInstallation | null,
): boolean =>
  Boolean(
    installation?.status &&
      WAITING_INSTALLATION_STATUSES.includes(installation.status),
  );

/**
 * Linked by PROJECT_ID or the seed (or with a token that no longer decrypts): it looks
 * configured, but online login, sync and event delivery cannot reach the cloud.
 */
export const needsCloudRelink = (installation: LocalInstallation | null): boolean =>
  Boolean(installation?.configured && installation.cloudCredentials === false);

export const shouldPollInstallation = (
  installation: LocalInstallation | null,
  backendUnavailable: boolean,
): boolean => !backendUnavailable && isInstallationWaitingApproval(installation);

export const getInstallationStatusCopy = (
  installation: LocalInstallation | null,
) => {
  if (needsCloudRelink(installation)) {
    return "Este equipo está vinculado, pero no puede conectarse con el panel administrativo: no funcionan el inicio de sesión en línea ni el envío de información. Vuelve a vincularlo con el código del proyecto.";
  }
  if (!installation) return INSTALLATION_STATUS_COPY.pending;
  return INSTALLATION_STATUS_COPY[installation.status] ?? INSTALLATION_STATUS_COPY.pending;
};

export const getInstallationWaitingMeta = (
  installation: LocalInstallation | null,
) => {
  if (installation?.status === "approved") {
    return {
      title: "Aprobación recibida",
      description:
        "Este equipo ya fue aprobado. Revisa el estado para terminar y entrar al sistema.",
    };
  }

  return {
    title: "Solicitud enviada correctamente",
    description:
      "La solicitud está en revisión. En cuanto la aprueben en el panel administrativo, esta pantalla continúa sola.",
  };
};

export const getInstallationGateMode = (
  installation: LocalInstallation | null,
  backendUnavailable: boolean,
): InstallationGateMode => {
  if (backendUnavailable) return "backendUnavailable";
  if (isInstallationWaitingApproval(installation)) return "waitingApproval";
  return "ready";
};

/**
 * Code the technician reads to whoever approves the request in ADMINISTRATIVO (last 6
 * characters of the installation id, shown there too), so the right device is approved.
 */
export const getInstallationShortCode = (installation: LocalInstallation | null): string | null => {
  const code = String(installation?.installationId ?? "").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
  return code || null;
};

export const getInstallationIdLabel = (
  installation: LocalInstallation | null,
  backendUnavailable: boolean,
): string =>
  installation?.installationId ??
  (backendUnavailable ? "no disponible" : "sin identificar");

export const getInstallationBackendMessage = (
  backendUnavailable: boolean,
): string | null =>
  backendUnavailable
    ? "El sistema de este estacionamiento no responde. Espera un momento y pulsa «Revisar estado»; si sigue igual, avisa a soporte."
    : null;

export const getInstallationWaitingBadgeLabel = (
  installation: LocalInstallation | null,
): string => (installation?.status === "approved" ? "Aprobado" : "En revisión");

export const normalizeInstallationError = (
  rawMessage: string,
): { title: string; message: string; tone: InstallationAlertTone } => {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (normalized.includes("nube no esta disponible para validar el token")) {
    return {
      title: "No pudimos conectar con el panel administrativo",
      message:
        "Revisa la conexión a internet e intenta de nuevo en unos momentos.",
      tone: "warning",
    };
  }

  if (normalized.includes("token de vinculacion invalido")) {
    return {
      title: "Código de vinculación no válido",
      message:
        "Revisa que el código sea de un proyecto activo. Puedes copiarlo de nuevo desde el panel administrativo.",
      tone: "error",
    };
  }

  if (normalized.includes("nube no esta disponible para solicitar la vinculacion")) {
    return {
      title: "No pudimos enviar la solicitud",
      message:
        "No hay conexión con el panel administrativo en este momento. Intenta de nuevo en unos minutos.",
      tone: "warning",
    };
  }

  if (normalized.includes("no se pudo cargar la configuracion de instalacion")) {
    return {
      title: "No pudimos revisar este equipo",
      message:
        "Intenta de nuevo en unos momentos.",
      tone: "warning",
    };
  }

  if (normalized.includes("confirma el proyecto")) {
    return {
      title: "Confirma el proyecto",
      message: "Valida el código y revisa que el proyecto sea el correcto antes de solicitar la vinculación.",
      tone: "warning",
    };
  }

  if (normalized.includes("ingresa el token")) {
    return {
      title: "Falta el código de vinculación",
      message:
        "Escribe el código del proyecto para solicitar la vinculación de este equipo.",
      tone: "warning",
    };
  }

  if (normalized.includes("no hay proyectos disponibles")) {
    return {
      title: "No hay proyectos disponibles",
      message: "Todavía no hay proyectos listos para vincular.",
      tone: "warning",
    };
  }

  if (message === LOCATION_REQUIRED_ERROR) {
    return {
      title: "Activa tu ubicación",
      message:
        "Necesitamos la ubicación del navegador para confirmar que este equipo está cerca del estacionamiento.",
      tone: "warning",
    };
  }

  if (message === LOCATION_PERMISSION_DENIED_ERROR) {
    return {
      title: "Permite la ubicación",
      message: "Da permiso de ubicación en el navegador e intenta de nuevo.",
      tone: "warning",
    };
  }

  if (message === LOCATION_TIMEOUT_ERROR) {
    return {
      title: "No se obtuvo la ubicación a tiempo",
      message:
        "El navegador tardó demasiado en obtener tu ubicación. Intenta de nuevo en un lugar con mejor señal.",
      tone: "warning",
    };
  }

  if (message === LOCATION_UNAVAILABLE_ERROR) {
    return {
      title: "Ubicación no disponible",
      message:
        "El equipo no pudo obtener tu ubicación. Revisa que la ubicación esté activada e intenta de nuevo.",
      tone: "warning",
    };
  }

  if (message === LOCATION_FETCH_FAILED_ERROR) {
    return {
      title: "No pudimos validar tu ubicación",
      message: "Intenta de nuevo en unos segundos. Si sigue igual, revisa el permiso de ubicación del navegador.",
      tone: "warning",
    };
  }

  if (isBackendUnavailableMessage(message)) {
    return normalizeOperationalUserMessage(message, "installation_request");
  }

  return normalizeOperationalUserMessage(message, "installation_request");
};

export const resolveBrowserLocation = async (): Promise<{
  location?: BrowserInstallationLocation;
  errorMessage?: string;
}> => {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return { errorMessage: LOCATION_REQUIRED_ERROR };
  }

  const getPermissionState = async (): Promise<PermissionState | "unknown"> => {
    if (!("permissions" in navigator) || typeof navigator.permissions?.query !== "function") {
      return "unknown";
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      return permission.state;
    } catch {
      return "unknown";
    }
  };

  const getPosition = (options: PositionOptions) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  const toBrowserLocation = (
    position: GeolocationPosition,
  ): BrowserInstallationLocation | undefined => {
    const longitude = Number(position.coords.longitude);
    const latitude = Number(position.coords.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return undefined;
    }

    return {
      coordinates: [longitude, latitude],
      accuracy: Number.isFinite(position.coords.accuracy)
        ? Number(position.coords.accuracy)
        : undefined,
      capturedAt: Date.now(),
    };
  };

  const attempts: PositionOptions[] = [
    {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: GEOLOCATION_CACHE_MAX_AGE_MS,
    },
    {
      enableHighAccuracy: true,
      timeout: GEOLOCATION_RELAXED_TIMEOUT_MS,
      maximumAge: 0,
    },
  ];

  let lastErrorCode: number | null = null;
  const permissionState = await getPermissionState();

  for (const attempt of attempts) {
    try {
      const position = await getPosition(attempt);
      const browserLocation = toBrowserLocation(position);
      if (browserLocation) return { location: browserLocation };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        lastErrorCode = Number((error as GeolocationPositionError).code);
        logGeolocationFailure("[InstallationGate] Geolocation attempt failed", {
          code: lastErrorCode,
          message:
            "message" in (error as object)
              ? String((error as { message?: unknown }).message ?? "")
              : "",
          permissionState,
          attempt,
        });
        if (lastErrorCode === 1) {
          return {
            errorMessage:
              permissionState === "denied"
                ? LOCATION_PERMISSION_DENIED_ERROR
                : LOCATION_FETCH_FAILED_ERROR,
          };
        }
      } else {
        logGeolocationFailure("[InstallationGate] Geolocation attempt failed with unknown error", {
          error,
          permissionState,
          attempt,
        });
      }
    }
  }

  if (lastErrorCode === 3) {
    return { errorMessage: LOCATION_TIMEOUT_ERROR };
  }

  if (lastErrorCode === 2) {
    return { errorMessage: LOCATION_UNAVAILABLE_ERROR };
  }

  return {
    errorMessage:
      permissionState === "granted"
        ? LOCATION_FETCH_FAILED_ERROR
        : LOCATION_REQUIRED_ERROR,
  };
};
