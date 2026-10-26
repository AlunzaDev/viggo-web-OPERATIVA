export type OperationalFeedbackTone = "error" | "warning";

export type OperationalMessageContext =
  | "installation_load"
  | "installation_request"
  | "config_load"
  | "config_sync"
  | "heartbeat"
  | "operational_logs"
  | "generic";

const SYSTEM_DOWN_HINT = "Espera un momento e intenta de nuevo. Si sigue igual, avisa a soporte.";
const RETRY_HINT = "Intenta de nuevo en unos momentos. Si sigue pasando, avisa a soporte.";

/** Raw errors (English, status codes, internals) that mean nothing to the person using the app. */
export const isTechnicalMessage = (message: string): boolean =>
  /\b(status code|request|response|failed|exception|undefined|null|timeout|econn\w*|err_\w+|jwt|token|prisma|sql|internal|cannot|unexpected|api|backend)\b/i.test(message);

export const isOperationalBackendUnavailable = (rawMessage: string): boolean => {
  const normalized = rawMessage.trim().toLowerCase();

  return (
    normalized === "network error" ||
    normalized.includes("backend no disponible") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("err_network") ||
    normalized.includes("econnrefused")
  );
};

export const isOperationalCloudUnavailable = (rawMessage: string): boolean => {
  const normalized = rawMessage.trim().toLowerCase();

  return (
    normalized.includes("la nube no esta disponible") ||
    normalized.includes("administrativo no disponible") ||
    normalized.includes("no pudimos conectar con administrativo")
  );
};

export const normalizeOperationalUserMessage = (
  rawMessage: string,
  context: OperationalMessageContext = "generic",
): { title: string; message: string; tone: OperationalFeedbackTone } => {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (isOperationalBackendUnavailable(message)) {
    if (context === "installation_load" || context === "installation_request") {
      return {
        title: "El sistema de este estacionamiento no responde",
        message: SYSTEM_DOWN_HINT,
        tone: "error",
      };
    }

    if (context === "config_load" || context === "config_sync") {
      return {
        title: "El sistema de este estacionamiento no responde",
        message: SYSTEM_DOWN_HINT,
        tone: "error",
      };
    }

    if (context === "heartbeat") {
      return {
        title: "No pudimos revisar el estado de los equipos",
        message: `El sistema de este estacionamiento no responde. ${SYSTEM_DOWN_HINT}`,
        tone: "error",
      };
    }

    if (context === "operational_logs") {
      return {
        title: "No pudimos cargar la bitácora",
        message: `El sistema de este estacionamiento no responde. ${SYSTEM_DOWN_HINT}`,
        tone: "error",
      };
    }

    return {
      title: "Sin conexión con el sistema",
      message: SYSTEM_DOWN_HINT,
      tone: "error",
    };
  }

  if (isOperationalCloudUnavailable(message)) {
    return {
      title: "No pudimos conectar con el panel administrativo",
      message:
        context === "config_sync"
          ? "El estacionamiento sigue funcionando, pero por ahora no se puede sincronizar con el panel administrativo."
          : "Intenta de nuevo más tarde.",
      tone: "warning",
    };
  }

  if (normalized.includes("aun no esta vinculada a un proyecto")) {
    return {
      title: "Este equipo aún no está vinculado",
      message:
        "Completa la vinculación antes de continuar.",
      tone: "warning",
    };
  }

  if (
    normalized.includes("hay datos invã¡lidos en la solicitud") ||
    normalized.includes("hay datos invalidos en la solicitud") ||
    normalized.includes("invalid request")
  ) {
    return {
      title: "Hay datos por revisar",
      message:
        "Algunos datos de la configuración no son válidos. Revisa el proyecto, los módulos o la ubicación.",
      tone: "warning",
    };
  }

  return {
    title: "No pudimos completar la acción",
    message: message && !isTechnicalMessage(message) ? message : RETRY_HINT,
    tone: "error",
  };
};
