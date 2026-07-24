import { api } from "../../../infrastructure/http/axios.instance";

export type LocalInstallationStatus =
  | "pending"
  | "requested"
  | "approved"
  | "rejected"
  | "linked";

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

type InstallationResponse = {
  installation: LocalInstallation;
};

export const getLocalInstallation = async (): Promise<LocalInstallation> => {
  const { data } = await api.get<InstallationResponse>("/api/installation/status");
  return data.installation;
};

export const getInstallationCloudProjects = async (): Promise<unknown[]> => {
  const { data } = await api.get<{ proyectos?: unknown[] }>("/api/installation/cloud-projects");
  return Array.isArray(data.proyectos) ? data.proyectos : [];
};

export const requestLocalInstallationProject = async (
  proyectoId: string,
  installationLinkToken: string,
): Promise<LocalInstallation> => {
  const { data } = await api.post<InstallationResponse>("/api/installation/project-request", {
    proyectoId,
    installationLinkToken,
  });
  return data.installation;
};
