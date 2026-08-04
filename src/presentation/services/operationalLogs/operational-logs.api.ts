import { api } from "../../../infrastructure/http/axios.instance";
import { normalizeOperationalLogsListResponse } from "./operational-logs.contract";

export type LogKind = "event" | "incident";
export type LogScope = "access_flow" | "device" | "payment" | "system";
export type LogSeverity = "info" | "warning" | "critical";

export type OperationalLogItem = {
  id: string;
  kind: LogKind;
  scope: LogScope;
  severity: LogSeverity;
  source: "backend" | "device" | "app" | "sync" | "system";
  type: string;
  message: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
  projectName?: string;
  moduloNombre?: string;
  ticketId?: string;
  paymentSessionId?: string;
};

export type OperationalLogsSummary = {
  byKind?: Partial<Record<LogKind, number>>;
  bySeverity?: Partial<Record<LogSeverity, number>>;
};

export type OperationalLogsListResult = {
  items: OperationalLogItem[];
  page: number;
  totalPages: number;
  total: number;
  summary?: OperationalLogsSummary;
};

export type OperationalLogsQuery = {
  page: number;
  limit: number;
  search?: string;
  kind?: string;
  scope?: string;
  severity?: string;
};

export const listOperationalLogs = async (
  query: OperationalLogsQuery,
): Promise<OperationalLogsListResult> => {
  const { data } = await api.get("/api/operational-logs", {
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search || undefined,
      kind: query.kind || undefined,
      scope: query.scope || undefined,
      severity: query.severity || undefined,
    },
  });
  return normalizeOperationalLogsListResponse(data, query.page, query.limit);
};
