import {
  listOperationalLogs,
  type LogKind,
  type LogSeverity,
  type OperationalLogItem,
  type OperationalLogsSummary,
} from "./operational-logs.api";

export const QUICK_FILTERS = [
  { id: "all", label: "Todo", keywords: [] as string[] },
  { id: "qr", label: "QR", keywords: ["qr_"] },
  { id: "cash", label: "Efectivo", keywords: ["cash_", "payment_"] },
  { id: "barrier", label: "Barrera", keywords: ["barrier_", "vehicle_passed", "loop_"] },
  { id: "heartbeat", label: "Heartbeat", keywords: ["heartbeat", "device_", "socket_"] },
] as const;

export type OperationalQuickFilterId = (typeof QUICK_FILTERS)[number]["id"];

export type OperationalLogsFlowResult = {
  items: OperationalLogItem[];
  total: number;
  totalPages: number;
  summary?: OperationalLogsSummary;
  error: string;
};

export const loadOperationalLogsFlow = async (input: {
  page: number;
  search: string;
  kind: string;
  scope: string;
  severity: string;
}): Promise<OperationalLogsFlowResult> => {
  try {
    const result = await listOperationalLogs({
      page: input.page,
      limit: 20,
      search: input.search,
      kind: input.kind,
      scope: input.scope,
      severity: input.severity,
    });

    return {
      items: result.items,
      total: Math.max(0, Number(result.total ?? 0)),
      totalPages: Math.max(1, Number(result.totalPages ?? 1)),
      summary: result.summary,
      error: "",
    };
  } catch (error) {
    return {
      items: [],
      total: 0,
      totalPages: 1,
      summary: undefined,
      error:
        error instanceof Error && error.message.trim()
          ? error.message
          : "No pudimos cargar la bitacora operativa.",
    };
  }
};

export const filterOperationalLogsByQuickFilter = (
  logs: OperationalLogItem[],
  quickFilter: OperationalQuickFilterId,
) => {
  const selectedFilter = QUICK_FILTERS.find((filter) => filter.id === quickFilter);
  if (!selectedFilter || selectedFilter.keywords.length === 0) {
    return logs;
  }

  return logs.filter((item) => {
    const haystack = `${item.type} ${item.message}`.toLowerCase();
    return selectedFilter.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  });
};

export const buildOperationalLogsStats = (
  logs: OperationalLogItem[],
  summary?: OperationalLogsSummary,
) => [
  {
    label: "Eventos",
    value: summary?.byKind?.event ?? logs.filter((item) => item.kind === "event").length,
    helper: "actividad normal",
    tone: "info",
  },
  {
    label: "Incidencias",
    value: summary?.byKind?.incident ?? logs.filter((item) => item.kind === "incident").length,
    helper: "requieren atencion",
    tone: "warning",
  },
  {
    label: "Criticas",
    value:
      summary?.bySeverity?.critical ??
      logs.filter((item) => item.severity === "critical").length,
    helper: "impacto alto",
    tone: "critical",
  },
];

export const getKindLabel = (kind: LogKind) => (kind === "incident" ? "Incidencia" : "Evento");

export const getSeverityLabel = (severity: LogSeverity) =>
  ({
    info: "Info",
    warning: "Advertencia",
    critical: "Critica",
  })[severity] ?? severity;
