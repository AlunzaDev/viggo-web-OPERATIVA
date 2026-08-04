import {
  getCashRegisterShiftDetail,
  getCashRegisterShiftStats,
  listCashRegisterShiftSummaries,
  type CashRegisterShiftFilters,
} from "./cash-payments.api";
import type {
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
} from "../../types/cashPayments/cash-payments.types";
import {
  formatMoney,
  getNumber,
} from "../../utils/cashPayments/cash-payments.formatters";

export type ShiftStatusFilter = "all" | "open" | "closed" | "reconciled" | "cancelled";

export const CASH_HISTORY_PAGE_SIZE = 20;

export const defaultCashShiftAggregate: CashRegisterShiftAggregate = {
  totalShifts: 0,
  openShifts: 0,
  closedShifts: 0,
  openingAmount: 0,
  totalIn: 0,
  totalOut: 0,
  expectedAmount: 0,
  countedAmount: 0,
  differenceAmount: 0,
};

export const toStartOfDay = (date: string) => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : undefined;
};

export const toEndOfDay = (date: string) => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T23:59:59.999`);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : undefined;
};

export const buildCashHistoryFilters = (input: {
  status: ShiftStatusFilter;
  dateFrom: string;
  dateTo: string;
}): CashRegisterShiftFilters => {
  const params: CashRegisterShiftFilters = {
    includeSummary: true,
    page: 1,
    limit: CASH_HISTORY_PAGE_SIZE,
  };

  if (input.status !== "all") params.status = input.status;

  const from = toStartOfDay(input.dateFrom);
  const to = toEndOfDay(input.dateTo);
  if (from) params.dateFrom = from;
  if (to) params.dateTo = to;

  return params;
};

export const getCashHistoryActiveFiltersCount = (input: {
  status: ShiftStatusFilter;
  dateFrom: string;
  dateTo: string;
}) => {
  let count = 0;
  if (input.status !== "all") count += 1;
  if (input.dateFrom) count += 1;
  if (input.dateTo) count += 1;
  return count;
};

export const getCashierLabel = (detail: CashRegisterShiftDetail) =>
  [detail.shift.moduloIdentificador, detail.shift.moduloNombre]
    .filter(Boolean)
    .join(" - ") || detail.shift.moduloId;

export const getMovementDetail = (
  movement: CashRegisterShiftDetail["movements"][number],
) => {
  const received = getNumber(movement.metadata?.amountReceived, NaN);
  const change = getNumber(movement.metadata?.changeAmount, NaN);

  if (Number.isFinite(received)) {
    return `Recibido ${formatMoney(received)}${
      Number.isFinite(change) ? ` · Cambio ${formatMoney(change)}` : ""
    }`;
  }

  return movement.notes || movement.concept;
};

export const loadCashHistoryFlow = async (params: CashRegisterShiftFilters) => {
  const [listResponse, summaryResponse] = await Promise.all([
    listCashRegisterShiftSummaries(params),
    getCashRegisterShiftStats(params),
  ]);

  return {
    items: listResponse.items,
    total: listResponse.total,
    aggregate: summaryResponse,
  };
};

export const resolveSelectedCashHistoryDetail = (input: {
  current: CashRegisterShiftDetail | null;
  items: CashRegisterShiftDetail[];
}) => {
  if (!input.current) {
    return input.items[0] ?? null;
  }

  return input.items.find((item) => item.shift.id === input.current?.shift.id) ?? null;
};

export const loadCashHistoryDetailFlow = async (shiftId: string) =>
  getCashRegisterShiftDetail(shiftId);
