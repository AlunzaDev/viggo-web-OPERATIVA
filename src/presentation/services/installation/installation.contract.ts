import { asRecord, extractNamedCollection } from "../../../infrastructure/http/api-contracts";
import type {
  BrowserInstallationLocation,
  LocalInstallation,
  LocalInstallationStatus,
} from "./installation.api";

export type InstallationCloudProject = {
  id: string;
  nombre: string;
  identificador: string;
};

const INSTALLATION_STATUSES: LocalInstallationStatus[] = [
  "pending",
  "requested",
  "approved",
  "rejected",
  "linked",
];

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeNullableText = (value: unknown) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const normalizeNullableNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeInstallationStatus = (value: unknown): LocalInstallationStatus => {
  const normalized = normalizeText(value) as LocalInstallationStatus;
  return INSTALLATION_STATUSES.includes(normalized) ? normalized : "pending";
};

export const normalizeLocalInstallation = (value: unknown): LocalInstallation => {
  const record = asRecord(asRecord(value)?.installation ?? value) ?? {};
  const proyectoId = normalizeNullableText(record.proyectoId);
  const status = normalizeInstallationStatus(record.status ?? (proyectoId ? "linked" : "pending"));

  return {
    configured: Boolean(record.configured) || (status === "linked" && Boolean(proyectoId)),
    installationId: normalizeText(record.installationId),
    status,
    source:
      normalizeText(record.source) === "env" ||
      normalizeText(record.source) === "cloudApproval"
        ? (normalizeText(record.source) as "env" | "cloudApproval")
        : "manual",
    proyectoId,
    proyectoNombre: normalizeNullableText(record.proyectoNombre),
    proyectoIdentificador: normalizeNullableText(record.proyectoIdentificador),
    cloudRequestId: normalizeNullableText(record.cloudRequestId),
    reviewNote: normalizeNullableText(record.reviewNote),
    requestedAt: normalizeNullableNumber(record.requestedAt),
    reviewedAt: normalizeNullableNumber(record.reviewedAt),
    assignedByUserId: normalizeNullableText(record.assignedByUserId),
    assignedAt: normalizeNullableNumber(record.assignedAt),
    updatedAt: normalizeNullableNumber(record.updatedAt),
  };
};

export const normalizeInstallationCloudProject = (
  value: unknown,
): InstallationCloudProject | null => {
  const record = asRecord(value);
  if (!record) return null;

  const id = normalizeText(record.id ?? record._id);
  const nombre = normalizeText(record.nombre);
  const identificador = normalizeText(record.identificador);

  if (!id || !nombre) return null;

  return {
    id,
    nombre,
    identificador,
  };
};

export const normalizeInstallationCloudProjects = (
  data: unknown,
): InstallationCloudProject[] =>
  extractNamedCollection(data, "proyectos")
    .map((item) => normalizeInstallationCloudProject(item))
    .filter((item): item is InstallationCloudProject => Boolean(item));

export const buildInstallationRequestPayload = (
  proyectoId: string,
  installationLinkToken: string,
  browserLocation?: BrowserInstallationLocation,
) => ({
  proyectoId,
  installationLinkToken,
  browserCoordinates: browserLocation?.coordinates,
  browserLocationAccuracy: browserLocation?.accuracy,
  browserLocationCapturedAt: browserLocation?.capturedAt,
});
