import {
  getLocalInstallation,
  previewInstallationLink,
  requestLocalInstallationProject,
  type LocalInstallation,
} from "./installation.api";
import type { InstallationLinkProject } from "./installation.contract";
import { isBackendUnavailableMessage, resolveBrowserLocation } from "./installation-gate.service";

export type InstallationGateState = {
  installation: LocalInstallation | null;
  backendUnavailable: boolean;
};

export const loadInstallationGateState = async (): Promise<InstallationGateState> => {
  try {
    return { installation: await getLocalInstallation(), backendUnavailable: false };
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

/** Finds the project the link token belongs to, so the operator can confirm it. */
export const previewInstallationGateLink = async (
  installationLinkToken: string,
): Promise<InstallationLinkProject> => {
  const token = installationLinkToken.trim();
  if (!token) {
    throw new Error("Ingresa el token de vinculacion del proyecto.");
  }

  const project = await previewInstallationLink(token);
  if (!project) {
    throw new Error("Token de vinculacion invalido");
  }
  return project;
};

export const submitInstallationGateRequest = async (input: {
  installationLinkToken: string;
}): Promise<LocalInstallation> => {
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
    input.installationLinkToken.trim(),
    locationResolution.location,
  );
};
