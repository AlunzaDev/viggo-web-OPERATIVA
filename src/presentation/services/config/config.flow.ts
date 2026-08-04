import {
  getLocalConfigStatus,
  syncLocalConfiguration,
  type LocalConfigStatus,
  type LocalConfigSyncResult,
} from "./config.api";
import { normalizeConfigSyncError } from "./config-status.presenter";

export type LocalConfigFlowState = {
  status: LocalConfigStatus | null;
  error: string | null;
};

export type LocalConfigSyncFlowResult = {
  status: LocalConfigStatus | null;
  result: LocalConfigSyncResult;
};

export const loadLocalConfigFlowState = async (
  canManageLocalConfig: boolean,
): Promise<LocalConfigFlowState> => {
  if (!canManageLocalConfig) {
    return {
      status: null,
      error: null,
    };
  }

  try {
    const status = await getLocalConfigStatus();
    return {
      status,
      error: null,
    };
  } catch (error) {
    return {
      status: null,
      error:
        error instanceof Error
          ? normalizeConfigSyncError(error.message, "load")
          : "No pudimos cargar la configuracion local. Intenta nuevamente en unos momentos.",
    };
  }
};

export const runLocalConfigSyncFlow = async (): Promise<LocalConfigSyncFlowResult> => {
  const result = await syncLocalConfiguration();
  const status = await getLocalConfigStatus();

  return {
    status,
    result,
  };
};
