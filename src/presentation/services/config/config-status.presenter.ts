import type {
  LocalConfigStatus,
  LocalConfigSyncResult,
} from "./config.api";
import {
  isOperationalBackendUnavailable,
  normalizeOperationalUserMessage,
} from "../operations/operational-state.presenter";

const isConfigBackendUnavailableMessage = (rawMessage: string): boolean => {
  return isOperationalBackendUnavailable(rawMessage);
};

export const formatConfigStatusDate = (value?: number | null) => {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getConfigSyncStatusLabel = (
  status?: LocalConfigStatus["lastSyncStatus"] | null,
) => {
  if (status === "success") return "Correcto";
  if (status === "success_with_warnings") return "Con alertas";
  if (status === "failed") return "Fallido";
  return "Sin registro";
};

export const getConfigSyncIssueLabel = (
  status?: LocalConfigStatus["lastSyncStatus"] | null,
) => (status === "failed" ? "Último error" : "Última alerta");

export const normalizeConfigSyncError = (
  rawMessage: string,
  context: "load" | "sync" = "sync",
) => {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (isConfigBackendUnavailableMessage(message)) {
    return normalizeOperationalUserMessage(
      message,
      context === "load" ? "config_load" : "config_sync",
    ).message;
  }

  if (normalized.includes("la nube no esta disponible")) {
    return normalizeOperationalUserMessage(message, "config_sync").message;
  }

  if (normalized.includes("aun no esta vinculada a un proyecto")) {
    return "Este equipo todavía no está vinculado a un proyecto. Completa la vinculación antes de sincronizar.";
  }

  if (normalized.includes("sync_service_token no esta configurado")) {
    return "La sincronización automática no está activada en este equipo.";
  }

  if (normalized.includes("la sincronizacion dejo inconsistencias locales")) {
    return "Algunos datos sincronizados no coinciden. Revisa los módulos, submódulos y catálogos del proyecto.";
  }

  if (
    normalized.includes("hay datos inválidos en la solicitud") ||
    normalized.includes("hay datos invalidos en la solicitud")
  ) {
    return "Algunos datos de la configuración no son válidos. Revisa el proyecto, los módulos o la ubicación.";
  }

  if (
    normalized.includes("coordinates debe contener") ||
    normalized.includes("longitud debe ser un numero valido")
  ) {
    return "La ubicación del proyecto o de alguno de sus módulos no es válida.";
  }

  if (context === "load" && normalized.includes("no se pudo cargar la configuracion local")) {
    return "No pudimos cargar la configuración. Intenta de nuevo en unos momentos.";
  }

  return normalizeOperationalUserMessage(
    message,
    context === "load" ? "config_load" : "config_sync",
  ).message;
};

export const formatConfigSyncSuccess = (result: LocalConfigSyncResult) =>
  `Aplicado: ${result.configuration.modulos} módulos, ${result.configuration.pensiones} pensiones, ${result.configuration.pensionPasses} pases de pensión, ${result.access.users} usuarios y ${result.access.permissionProfiles} perfiles.${
    result.integrity?.warnings?.length
      ? ` Alertas: ${result.integrity.warnings.length}.`
      : ""
  }`;
