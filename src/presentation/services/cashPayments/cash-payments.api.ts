import { api } from "../../../infrastructure/http/axios.instance";
import type {
  CashRegisterDenominationLine,
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
  CashSession,
} from "../../types/cashPayments/cash-payments.types";
import {
  asRecord,
  getNumber,
  getDenominationCountPayload,
  mapCutPreview,
  mapShiftAggregate,
  mapShiftDetail,
  mapSession,
  mapTicket,
} from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterCutPreview,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";

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
  const payload = asRecord(data);

  return {
    items: Array.isArray(payload.items) ? payload.items.map(mapShiftDetail) : [],
    total: getNumber(payload.total),
  };
};

export const getCashRegisterShiftStats = async (
  params: CashRegisterShiftFilters,
): Promise<CashRegisterShiftAggregate> => {
  const { data } = await api.get("/api/cash-register/shifts/stats/summary", {
    params,
  });
  return mapShiftAggregate(data);
};

export const getCashRegisterShiftDetail = async (
  shiftId: string,
): Promise<CashRegisterShiftDetail> => {
  const { data } = await api.get(`/api/cash-register/shifts/${shiftId}`);
  return mapShiftDetail(data);
};

export const getActiveCashRegisterShift = async (
  cashierId: string,
): Promise<CashRegisterShiftDetail | null> => {
  const { data } = await api.get(`/api/cash-register/shifts/active/${cashierId}`);
  const detail = asRecord(data).detail;
  return detail ? mapShiftDetail(detail) : null;
};

export const resolveCashTicketQr = async (
  qrValue: string,
): Promise<ResolveQrResult> => {
  const { data } = await api.post("/api/cash-payments/tickets/resolve-qr", {
    qrValue,
  });
  const payload = asRecord(data);

  return {
    ticket: mapTicket(payload.ticket),
    activeSession: payload.activeSession ? mapSession(payload.activeSession) : null,
  };
};

export const startCashTicketSession = async (
  ticketId: string,
  moduloId: string,
): Promise<CashSession> => {
  const { data } = await api.post(`/api/cash-payments/tickets/${ticketId}/start`, {
    moduloId,
  });
  return mapSession(asRecord(data).session);
};

export const insertCashIntoSession = async (
  sessionId: string,
  amount: number,
  rawEvent: Record<string, unknown>,
): Promise<CashSession> => {
  const { data } = await api.post(`/api/cash-payments/sessions/${sessionId}/insert-cash`, {
    amount,
    rawEvent,
  });
  return mapSession(asRecord(data).session);
};

export const cancelCashTicketSession = async (
  sessionId: string,
  cancellationReason?: string,
): Promise<CashSession> => {
  const { data } = await api.post(`/api/cash-payments/sessions/${sessionId}/cancel`, {
    cancellationReason,
  });
  return mapSession(asRecord(data).session);
};

export const openCashRegisterShift = async (input: {
  moduloId: string;
  openingAmount: number;
  notes?: string;
}): Promise<CashRegisterShiftDetail> => {
  const { data } = await api.post("/api/cash-register/shifts/open", input);
  return mapShiftDetail(data);
};

export const registerCashRegisterMovement = async (
  shiftId: string,
  input: {
    type: "manual_income" | "manual_expense";
    concept: string;
    amount: number;
  },
): Promise<CashRegisterShiftDetail | null> => {
  const { data } = await api.post(
    `/api/cash-register/shifts/${shiftId}/movements`,
    input,
  );
  const detail = asRecord(data).detail;
  return detail ? mapShiftDetail(detail) : null;
};

export const saveCashRegisterCount = async (
  shiftId: string,
  denominationLines: CashRegisterDenominationLine[],
  notes?: string,
) => {
  await api.post(`/api/cash-register/shifts/${shiftId}/counts`, {
    denominations: getDenominationCountPayload(denominationLines),
    notes,
  });
};

export const getCashRegisterCutPreview = async (
  shiftId: string,
): Promise<CashRegisterCutPreview> => {
  const { data } = await api.get(`/api/cash-register/shifts/${shiftId}/cut-preview`);
  return mapCutPreview(asRecord(data).preview);
};

export const closeCashRegisterShift = async (
  shiftId: string,
  denominationLines: CashRegisterDenominationLine[],
  notes?: string,
) => {
  await api.post(`/api/cash-register/shifts/${shiftId}/close`, {
    denominations: getDenominationCountPayload(denominationLines),
    notes,
  });
};
