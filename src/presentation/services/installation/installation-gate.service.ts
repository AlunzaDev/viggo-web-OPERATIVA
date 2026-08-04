import type {
  BrowserInstallationLocation,
  LocalInstallation,
  LocalInstallationStatus,
} from "./installation.api";
import {
  isOperationalBackendUnavailable,
  normalizeOperationalUserMessage,
} from "../operations/operational-state.presenter";

export type ProjectOption = {
  id: string;
  nombre: string;
  identificador: string;
};

export type InstallationAlertTone = "error" | "warning";
export type InstallationGateMode = "backendUnavailable" | "ready" | "waitingApproval";

const WAITING_INSTALLATION_STATUSES: LocalInstallationStatus[] = ["requested", "approved"];
const INSTALLATION_STATUS_COPY: Record<LocalInstallationStatus, string> = {
  pending: "Selecciona el proyecto de esta terminal local.",
  requested: "Solicitud enviada. Esperando aprobacion en la nube.",
  approved: "Solicitud aprobada. Recarga para terminar la vinculacion.",
  rejected: "Solicitud rechazada. Revisa el motivo y solicita de nuevo.",
  linked: "Este punto local ya esta vinculado al proyecto seleccionado.",
};

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

export const normalizeProjectOption = (value: unknown): ProjectOption | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? record._id ?? "").trim();
  const nombre = String(record.nombre ?? "").trim();
  const identificador = String(record.identificador ?? "").trim();
  if (!id || !nombre) return null;
  return { id, nombre, identificador };
};

export const mapInstallationProjects = (projects: unknown[]): ProjectOption[] =>
  projects
    .map((project) => normalizeProjectOption(project))
    .filter((project): project is ProjectOption => Boolean(project));

export const isInstallationWaitingApproval = (
  installation: LocalInstallation | null,
): boolean =>
  Boolean(
    installation?.status &&
      WAITING_INSTALLATION_STATUSES.includes(installation.status),
  );

export const getInstallationStatusCopy = (
  installation: LocalInstallation | null,
) => {
  if (!installation) return INSTALLATION_STATUS_COPY.pending;
  return INSTALLATION_STATUS_COPY[installation.status] ?? INSTALLATION_STATUS_COPY.pending;
};

export const getInstallationWaitingMeta = (
  installation: LocalInstallation | null,
) => {
  if (installation?.status === "approved") {
    return {
      title: "Aprobacion recibida",
      description:
        "Este punto local ya fue aprobado. Revisa el estado para terminar la vinculacion y entrar al sistema.",
    };
  }

  return {
    title: "Solicitud enviada correctamente",
    description:
      "La solicitud ya quedo en revision. Solo falta que la aprueben en administrativo para habilitar este punto local.",
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

export const getInstallationIdLabel = (
  installation: LocalInstallation | null,
  backendUnavailable: boolean,
): string =>
  installation?.installationId ??
  (backendUnavailable ? "API local sin iniciar" : "sin identificar");

export const getInstallationBackendMessage = (
  backendUnavailable: boolean,
): string | null =>
  backendUnavailable
    ? "El backend local no esta disponible. Inicia el API operativo para continuar con esta instalacion."
    : null;

export const getInstallationProjectsPlaceholder = (input: {
  backendUnavailable: boolean;
  projectsCount: number;
}): string => {
  if (input.backendUnavailable) return "Backend local no disponible";
  if (input.projectsCount === 0) return "No hay proyectos disponibles en nube";
  return "Selecciona un proyecto";
};

export const getInstallationWaitingBadgeLabel = (
  installation: LocalInstallation | null,
): string => (installation?.status === "approved" ? "Aprobado" : "En revision");

export const normalizeInstallationError = (
  rawMessage: string,
): { title: string; message: string; tone: InstallationAlertTone } => {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (normalized.includes("nube no esta disponible para consultar proyectos")) {
    return {
      title: "No pudimos conectar con la nube",
      message:
        "Revisa la conexion o intenta nuevamente en unos momentos para cargar los proyectos disponibles.",
      tone: "warning",
    };
  }

  if (normalized.includes("nube no esta disponible para solicitar la vinculacion")) {
    return {
      title: "No pudimos enviar la solicitud",
      message:
        "La nube no esta disponible en este momento. Intenta nuevamente en unos minutos.",
      tone: "warning",
    };
  }

  if (normalized.includes("no se pudo cargar la configuracion de instalacion")) {
    return {
      title: "No pudimos revisar esta instalacion",
      message:
        "Intenta nuevamente en unos momentos para consultar el estado local y la vinculacion.",
      tone: "warning",
    };
  }

  if (normalized.includes("selecciona un proyecto")) {
    return {
      title: "Selecciona un proyecto",
      message: "Elige el proyecto que quieres vincular antes de continuar.",
      tone: "warning",
    };
  }

  if (normalized.includes("ingresa el token")) {
    return {
      title: "Falta el token de vinculacion",
      message:
        "Captura el token del proyecto para poder solicitar la vinculacion de este punto local.",
      tone: "warning",
    };
  }

  if (normalized.includes("token de vinculacion invalido")) {
    return {
      title: "El token no coincide",
      message: "Verifica que el token pertenezca a este proyecto e intenta nuevamente.",
      tone: "error",
    };
  }

  if (normalized.includes("no hay proyectos disponibles")) {
    return {
      title: "No hay proyectos disponibles",
      message: "Todavia no hay proyectos listos para vincular desde la nube.",
      tone: "warning",
    };
  }

  if (message === LOCATION_REQUIRED_ERROR) {
    return {
      title: "Activa tu ubicacion",
      message:
        "Necesitamos la ubicacion del navegador para validar que esta instalacion este cerca del proyecto antes de solicitar la vinculacion.",
      tone: "warning",
    };
  }

  if (message === LOCATION_PERMISSION_DENIED_ERROR) {
    return {
      title: "Permite la ubicacion",
      message: "Da permiso de ubicacion en el navegador e intenta nuevamente.",
      tone: "warning",
    };
  }

  if (message === LOCATION_TIMEOUT_ERROR) {
    return {
      title: "No se obtuvo la ubicacion a tiempo",
      message:
        "El navegador tardo demasiado en resolver tu ubicacion. Intenta de nuevo en un lugar con mejor senal o GPS.",
      tone: "warning",
    };
  }

  if (message === LOCATION_UNAVAILABLE_ERROR) {
    return {
      title: "Ubicacion no disponible",
      message:
        "El dispositivo no pudo determinar tu ubicacion actual. Revisa si la ubicacion del sistema esta activa e intenta de nuevo.",
      tone: "warning",
    };
  }

  if (message === LOCATION_FETCH_FAILED_ERROR) {
    return {
      title: "No pudimos validar tu ubicacion",
      message: "Intenta nuevamente en unos segundos. Si sigue igual, revisa el permiso de ubicacion del navegador.",
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
