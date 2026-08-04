import { asRecord, extractPaginatedCollection } from "../../../infrastructure/http/api-contracts";
import type {
  LogKind,
  LogScope,
  LogSeverity,
  OperationalLogItem,
  OperationalLogsListResult,
  OperationalLogsSummary,
} from "./operational-logs.api";

const LOG_KINDS: LogKind[] = ["event", "incident"];
const LOG_SCOPES: LogScope[] = ["access_flow", "device", "payment", "system"];
const LOG_SEVERITIES: LogSeverity[] = ["info", "warning", "critical"];
const LOG_SOURCES: OperationalLogItem["source"][] = [
  "backend",
  "device",
  "app",
  "sync",
  "system",
];

const normalizeEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => {
  const normalized = String(value ?? "").trim() as T;
  return allowed.includes(normalized) ? normalized : fallback;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

export const normalizeOperationalLogItem = (value: unknown): OperationalLogItem => {
  const item = asRecord(value) ?? {};

  return {
    id: normalizeText(item.id),
    kind: normalizeEnum(item.kind, LOG_KINDS, "event"),
    scope: normalizeEnum(item.scope, LOG_SCOPES, "system"),
    severity: normalizeEnum(item.severity, LOG_SEVERITIES, "info"),
    source: normalizeEnum(item.source, LOG_SOURCES, "system"),
    type: normalizeText(item.type),
    message: normalizeText(item.message),
    createdAt: Number(item.createdAt ?? 0) || 0,
    metadata: normalizeMetadata(item.metadata),
    projectName: normalizeText(item.projectName) || undefined,
    moduloNombre: normalizeText(item.moduloNombre) || undefined,
    ticketId: normalizeText(item.ticketId) || undefined,
    paymentSessionId: normalizeText(item.paymentSessionId) || undefined,
  };
};

export const normalizeOperationalLogsSummary = (
  value: unknown,
): OperationalLogsSummary | undefined => {
  const summary = asRecord(value);
  if (!summary) return undefined;

  const byKindRecord = asRecord(summary.byKind);
  const bySeverityRecord = asRecord(summary.bySeverity);

  return {
    byKind: byKindRecord
      ? {
          event: Number(byKindRecord.event ?? 0) || 0,
          incident: Number(byKindRecord.incident ?? 0) || 0,
        }
      : undefined,
    bySeverity: bySeverityRecord
      ? {
          info: Number(bySeverityRecord.info ?? 0) || 0,
          warning: Number(bySeverityRecord.warning ?? 0) || 0,
          critical: Number(bySeverityRecord.critical ?? 0) || 0,
        }
      : undefined,
  };
};

export const normalizeOperationalLogsListResponse = (
  data: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
): OperationalLogsListResult => {
  const collection = extractPaginatedCollection(data, "items", fallbackPage, fallbackLimit);
  const payload = asRecord(data) ?? {};

  return {
    items: collection.items.map((item) => normalizeOperationalLogItem(item)),
    page: collection.page,
    totalPages: collection.totalPages,
    total: collection.total,
    summary: normalizeOperationalLogsSummary(payload.summary),
  };
};
