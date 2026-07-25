import { api } from "../../../infrastructure/http/axios.instance";

export type LocalConfigStatus = {
  cloudApiUrl: string;
  installationId: string;
  configured: boolean;
  proyectoId: string | null;
  proyectoNombre: string | null;
  proyectoIdentificador: string | null;
  lastLocalUpdateAt: number | null;
  lastConfigurationVersion: number | null;
  lastAccessVersion: number | null;
  lastSyncAt: number | null;
  lastSyncStatus: "success" | "success_with_warnings" | "failed" | null;
  lastSyncError: string;
  syncTokenConfigured: boolean;
};

export type LocalConfigSyncResult = {
  synced: boolean;
  syncedAt: number;
  configurationVersion: number | null;
  accessVersion: number | null;
  configuration: {
    proyecto: number;
    modulos: number;
    pensiones: number;
    pensionPasses: number;
  };
  access: {
    users: number;
    permissionProfiles: number;
  };
  integrity?: {
    ok: boolean;
    warnings: Array<{ message: string }>;
    errors: Array<{ message: string }>;
  };
};

export const getLocalConfigStatus = async (): Promise<LocalConfigStatus> => {
  const { data } = await api.get<{ status: LocalConfigStatus }>("/api/config/status");
  return data.status;
};

export const syncLocalConfiguration = async (): Promise<LocalConfigSyncResult> => {
  const { data } = await api.post<LocalConfigSyncResult>("/api/config/sync-now", {});
  return data;
};
