export type OperationalFeedbackTone = "error" | "warning";

export type OperationalMessageContext =
  | "installation_load"
  | "installation_request"
  | "config_load"
  | "config_sync"
  | "heartbeat"
  | "operational_logs"
  | "generic";

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
        title: "El backend local no esta disponible",
        message:
          "Inicia el API operativo para revisar la instalacion, cargar proyectos o solicitar la vinculacion.",
        tone: "error",
      };
    }

    if (context === "config_load" || context === "config_sync") {
      return {
        title: "El backend local no esta disponible",
        message:
          "Inicia el API operativo y vuelve a intentar para consultar o sincronizar la configuracion local.",
        tone: "error",
      };
    }

    if (context === "heartbeat") {
      return {
        title: "No pudimos revisar el estado del punto local",
        message:
          "El backend operativo no esta disponible en este momento. Inicialo para volver a consultar el heartbeat.",
        tone: "error",
      };
    }

    if (context === "operational_logs") {
      return {
        title: "No pudimos cargar la bitacora local",
        message:
          "El backend operativo no esta disponible en este momento. Inicialo para volver a consultar los eventos.",
        tone: "error",
      };
    }
  }

  if (isOperationalCloudUnavailable(message)) {
    return {
      title: "No pudimos conectar con administrativo",
      message:
        context === "config_sync"
          ? "El punto local sigue funcionando, pero la sincronizacion con administrativo no esta disponible por ahora."
          : "La nube no esta disponible en este momento. Intenta nuevamente mas tarde.",
      tone: "warning",
    };
  }

  if (normalized.includes("aun no esta vinculada a un proyecto")) {
    return {
      title: "Esta instalacion aun no esta vinculada",
      message:
        "Completa la vinculacion del punto local antes de continuar con la sincronizacion.",
      tone: "warning",
    };
  }

  if (
    normalized.includes("hay datos invã¡lidos en la solicitud") ||
    normalized.includes("hay datos invalidos en la solicitud") ||
    normalized.includes("invalid request")
  ) {
    return {
      title: "Hay datos pendientes por revisar",
      message:
        "Se detectaron datos invalidos en la configuracion sincronizada. Revisa proyecto, modulos o coordenadas.",
      tone: "warning",
    };
  }

  return {
    title: "No pudimos completar la accion",
    message: message || "Intenta nuevamente en unos momentos.",
    tone: "error",
  };
};
