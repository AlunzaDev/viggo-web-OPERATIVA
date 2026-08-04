import {
  getMonthlyFlushStatus,
  runMonthlyFlush,
  updateMonthlyFlushSettings,
  type MonthlyFlushStatus,
} from "./monthlyFlush.api";

export type MonthlyFlushFormState = {
  enabled: boolean;
  partialCurrentMonthEnabled: boolean;
  partialDays: number[];
  hour: string;
  minute: string;
};

export type MonthlyFlushLoadResult = {
  status: MonthlyFlushStatus | null;
  error: string | null;
  form: MonthlyFlushFormState;
};

const getDefaultForm = (): MonthlyFlushFormState => ({
  enabled: false,
  partialCurrentMonthEnabled: false,
  partialDays: [],
  hour: "02",
  minute: "00",
});

export const createMonthlyFlushFormFromStatus = (
  status: MonthlyFlushStatus,
): MonthlyFlushFormState => ({
  enabled: status.enabled,
  partialCurrentMonthEnabled: status.partialCurrentMonthEnabled,
  partialDays: status.partialDays,
  hour: status.hour,
  minute: status.minute,
});

export const loadMonthlyFlushFlow = async (): Promise<MonthlyFlushLoadResult> => {
  try {
    const status = await getMonthlyFlushStatus();
    return {
      status,
      error: null,
      form: createMonthlyFlushFormFromStatus(status),
    };
  } catch (error) {
    return {
      status: null,
      error: error instanceof Error ? error.message : "No se pudo cargar el flush mensual",
      form: getDefaultForm(),
    };
  }
};

export const saveMonthlyFlushFlow = async (
  form: MonthlyFlushFormState,
): Promise<MonthlyFlushStatus> =>
  updateMonthlyFlushSettings({
    enabled: form.enabled,
    partialCurrentMonthEnabled: form.partialCurrentMonthEnabled,
    partialDays: form.partialDays,
    hour: form.hour,
    minute: form.minute,
  });

export const runMonthlyFlushFlow = async (
  manualMonth: string,
): Promise<MonthlyFlushStatus> => {
  await runMonthlyFlush(manualMonth);
  return getMonthlyFlushStatus();
};
