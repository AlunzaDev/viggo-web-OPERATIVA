import {
  getInstallationCloudProjects,
  getLocalInstallation,
  requestLocalInstallationProject,
  type LocalInstallation,
} from "./installation.api";
import {
  isBackendUnavailableMessage,
  mapInstallationProjects,
  resolveBrowserLocation,
  type ProjectOption,
} from "./installation-gate.service";

export type InstallationGateState = {
  installation: LocalInstallation | null;
  projects: ProjectOption[];
  backendUnavailable: boolean;
};

export const loadInstallationGateState = async (): Promise<InstallationGateState> => {
  try {
    const installation = await getLocalInstallation();

    if (installation.configured) {
      return {
        installation,
        projects: [],
        backendUnavailable: false,
      };
    }

    const projectRows = await getInstallationCloudProjects();

    return {
      installation,
      projects: mapInstallationProjects(projectRows),
      backendUnavailable: false,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la configuracion de instalacion.";

    return Promise.reject({
      message,
      backendUnavailable:
        error instanceof Error ? isBackendUnavailableMessage(error.message) : false,
    });
  }
};

export const submitInstallationGateRequest = async (input: {
  projectId: string;
  installationLinkToken: string;
}): Promise<LocalInstallation> => {
  if (!input.projectId) {
    throw new Error("Selecciona un proyecto para solicitar la vinculacion.");
  }

  if (!input.installationLinkToken.trim()) {
    throw new Error("Ingresa el token de vinculacion del proyecto.");
  }

  const locationResolution = await resolveBrowserLocation();

  if (!locationResolution.location && import.meta.env.DEV) {
    console.debug("[InstallationGate] Continuing without browser location", {
      reason: locationResolution.errorMessage,
    });
  }

  return requestLocalInstallationProject(
    input.projectId,
    input.installationLinkToken.trim(),
    locationResolution.location,
  );
};
