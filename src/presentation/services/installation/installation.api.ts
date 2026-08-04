import { api } from "../../../infrastructure/http/axios.instance";
import {
  buildInstallationRequestPayload,
  normalizeInstallationCloudProjects,
  normalizeLocalInstallation,
  type InstallationCloudProject,
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

export const getInstallationCloudProjects = async (): Promise<InstallationCloudProject[]> => {
  const { data } = await api.get("/api/installation/cloud-projects");
  return normalizeInstallationCloudProjects(data);
};

export const requestLocalInstallationProject = async (
  proyectoId: string,
  installationLinkToken: string,
  browserLocation?: BrowserInstallationLocation,
): Promise<LocalInstallation> => {
  const { data } = await api.post(
    "/api/installation/project-request",
    buildInstallationRequestPayload(proyectoId, installationLinkToken, browserLocation),
  );
  return normalizeLocalInstallation(data);
};
