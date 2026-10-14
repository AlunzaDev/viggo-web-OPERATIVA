import { api } from "../../../infrastructure/http/axios.instance";
import {
  buildInstallationRequestPayload,
  normalizeInstallationLinkProject,
  normalizeLocalInstallation,
  type InstallationLinkProject,
} from "./installation.contract";

export type LocalInstallationStatus =
  | "pending"
  | "requested"
  | "approved"
  | "rejected"
  | "linked";

export type BrowserInstallationLocation = {
  coordinates: [number, number];
  accuracy?: number;
  capturedAt?: number;
};

export type LocalInstallation = {
  configured: boolean;
  installationId: string;
  status: LocalInstallationStatus;
  source: "env" | "manual" | "cloudApproval";
  proyectoId: string | null;
  proyectoNombre: string | null;
  proyectoIdentificador: string | null;
  cloudRequestId: string | null;
  reviewNote: string | null;
  requestedAt: number | null;
  reviewedAt: number | null;
  assignedByUserId: string | null;
  assignedAt: number | null;
  updatedAt: number | null;
};

export const getLocalInstallation = async (): Promise<LocalInstallation> => {
  const { data } = await api.get("/api/installation/status");
  return normalizeLocalInstallation(data);
};

/** Project the link token belongs to (null if the cloud does not recognize it). */
export const previewInstallationLink = async (
  installationLinkToken: string,
): Promise<InstallationLinkProject | null> => {
  const { data } = await api.post("/api/installation/link-preview", { installationLinkToken });
  return normalizeInstallationLinkProject(data);
};

export const requestLocalInstallationProject = async (
  installationLinkToken: string,
  browserLocation?: BrowserInstallationLocation,
): Promise<LocalInstallation> => {
  const { data } = await api.post(
    "/api/installation/project-request",
    buildInstallationRequestPayload(installationLinkToken, browserLocation),
  );
  return normalizeLocalInstallation(data);
};
