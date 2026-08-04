import { api } from "../../../infrastructure/http/axios.instance";

export type MonthlyFlushHistoryItem = {
  monthKey: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  completedAt: number | null;
  error: string | null;
  summary: {
    daysProcessed: number;
    totalSourceRecordsAffected: number;
    flushedDocuments: number;
    deletedLogs: number;
  } | null;
};

export type MonthlyFlushStatus = {
  enabled: boolean;
  partialCurrentMonthEnabled: boolean;
  closeDay: number;
  partialDays: number[];
  hour: string;
  minute: string;
  updatedAt: number | null;
  updatedBy: string | null;
  history: MonthlyFlushHistoryItem[];
};

export const getMonthlyFlushStatus = async (): Promise<MonthlyFlushStatus> => {
  const { data } = await api.get<MonthlyFlushStatus>("/api/monthly-flush/admin");
  return data;
};

export const updateMonthlyFlushSettings = async (
  payload: Pick<
    MonthlyFlushStatus,
    "enabled" | "partialCurrentMonthEnabled" | "partialDays" | "hour" | "minute"
  >,
): Promise<MonthlyFlushStatus> => {
  const { data } = await api.patch<MonthlyFlushStatus>(
    "/api/monthly-flush/admin/settings",
    payload,
  );
  return data;
};

export const runMonthlyFlush = async (monthKey: string) => {
  const { data } = await api.post<{ ok: boolean; summary: Record<string, unknown> }>(
    "/api/monthly-flush/admin/run",
    { monthKey },
  );
  return data;
};
