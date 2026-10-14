import { asRecord } from "../../../infrastructure/http/api-contracts";
import type {
  BrowserInstallationLocation,
  LocalInstallation,
  LocalInstallationStatus,
} from "./installation.api";

/** Project a link token belongs to, shown to the operator before requesting the link. */
export type InstallationLinkProject = {
  id: string;
  nombre: string;
  identificador: string;
  codigoProyecto: string;
  ciudad: string;
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

export const normalizeInstallationLinkProject = (
  data: unknown,
): InstallationLinkProject | null => {
  const record = asRecord(asRecord(data)?.proyecto);
  if (!record) return null;

  const id = normalizeText(record.id ?? record._id);
  const nombre = normalizeText(record.nombre);

  if (!id || !nombre) return null;

  return {
    id,
    nombre,
    identificador: normalizeText(record.identificador),
    codigoProyecto: normalizeText(record.codigoProyecto),
    ciudad: normalizeText(record.ciudad),
  };
};

// The cloud derives the project from the link token: no project id is sent.
export const buildInstallationRequestPayload = (
  installationLinkToken: string,
  browserLocation?: BrowserInstallationLocation,
) => ({
  installationLinkToken,
  browserCoordinates: browserLocation?.coordinates,
  browserLocationAccuracy: browserLocation?.accuracy,
  browserLocationCapturedAt: browserLocation?.capturedAt,
});
