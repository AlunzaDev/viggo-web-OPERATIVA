import { api } from "../../../infrastructure/http/axios.instance";
import type {
  CashRegisterDenominationLine,
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
  CashSession,
} from "../../types/cashPayments/cash-payments.types";
import {
} from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterCutPreview,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";
import {
  buildCashCountPayload,
  normalizeActiveCashShiftResponse,
  normalizeCashCutPreviewResponse,
  normalizeCashMovementDetailResponse,
  normalizeCashSessionResponse,
  normalizeCashShiftAggregateResponse,
  normalizeCashShiftDetailResponse,
  normalizeCashShiftListResponse,
  normalizeResolveQrResponse,
} from "./cash-payments.contract";

export type ResolveQrResult = {
  ticket: TicketView;
  activeSession: CashSession | null;
};

export type CashRegisterShiftFilters = {
  includeSummary?: boolean;
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: number;
  dateTo?: number;
};

export type CashRegisterShiftListResult = {
  items: CashRegisterShiftDetail[];
  total: number;
};

export const listCashRegisterShiftSummaries = async (
  params: CashRegisterShiftFilters,
): Promise<CashRegisterShiftListResult> => {
  const { data } = await api.get("/api/cash-register/shifts", { params });
  return normalizeCashShiftListResponse(data);
};

export const getCashRegisterShiftStats = async (
  params: CashRegisterShiftFilters,
): Promise<CashRegisterShiftAggregate> => {
  const { data } = await api.get("/api/cash-register/shifts/stats/summary", {
    params,
  });
  return normalizeCashShiftAggregateResponse(data);
};

export const getCashRegisterShiftDetail = async (
  shiftId: string,
): Promise<CashRegisterShiftDetail> => {
  const { data } = await api.get(`/api/cash-register/shifts/${shiftId}`);
  return normalizeCashShiftDetailResponse(data);
};

export const getActiveCashRegisterShift = async (
  cashierId: string,
): Promise<CashRegisterShiftDetail | null> => {
  const { data } = await api.get(`/api/cash-register/shifts/active/${cashierId}`);
  return normalizeActiveCashShiftResponse(data);
};

export const resolveCashTicketQr = async (
  qrValue: string,
): Promise<ResolveQrResult> => {
  const { data } = await api.post("/api/cash-payments/tickets/resolve-qr", {
    qrValue,
  });
  return normalizeResolveQrResponse(data);
};

export const startCashTicketSession = async (
  ticketId: string,
  moduloId: string,
): Promise<CashSession> => {
  const { data } = await api.post(`/api/cash-payments/tickets/${ticketId}/start`, {
    moduloId,
  });
  return normalizeCashSessionResponse(data);
};

export const insertCashIntoSession = async (
  sessionId: string,
  amount: number,
  rawEvent: Record<string, unknown>,
): Promise<CashSession> => {
  const idempotencyKey = String(rawEvent.idempotencyKey ?? "");
  const { data } = await api.post(
    `/api/cash-payments/sessions/${sessionId}/insert-cash`,
    { amount, rawEvent },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return normalizeCashSessionResponse(data);
};

export const cancelCashTicketSession = async (
  sessionId: string,
  cancellationReason?: string,
): Promise<CashSession> => {
  const { data } = await api.post(`/api/cash-payments/sessions/${sessionId}/cancel`, {
    cancellationReason,
  });
  return normalizeCashSessionResponse(data);
};

export const openCashRegisterShift = async (input: {
  moduloId: string;
  openingAmount: number;
  notes?: string;
}): Promise<CashRegisterShiftDetail> => {
  const { data } = await api.post("/api/cash-register/shifts/open", input);
  return normalizeCashShiftDetailResponse(data);
};

export const registerCashRegisterMovement = async (
  shiftId: string,
  idempotencyKey: string,
  input: {
    type: "manual_income" | "manual_expense";
    concept: string;
    amount: number;
  },
): Promise<CashRegisterShiftDetail | null> => {
  const { data } = await api.post(
    `/api/cash-register/shifts/${shiftId}/movements`,
    input,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return normalizeCashMovementDetailResponse(data);
};

export const saveCashRegisterCount = async (
  shiftId: string,
  denominationLines: CashRegisterDenominationLine[],
  notes?: string,
) => {
  await api.post(`/api/cash-register/shifts/${shiftId}/counts`, {
    ...buildCashCountPayload(denominationLines, notes),
  });
};

export const getCashRegisterCutPreview = async (
  shiftId: string,
): Promise<CashRegisterCutPreview> => {
  const { data } = await api.get(`/api/cash-register/shifts/${shiftId}/cut-preview`);
  return normalizeCashCutPreviewResponse(data);
};

export const closeCashRegisterShift = async (
  shiftId: string,
  denominationLines: CashRegisterDenominationLine[],
  notes?: string,
) => {
  await api.post(`/api/cash-register/shifts/${shiftId}/close`, {
    ...buildCashCountPayload(denominationLines, notes),
  });
};
