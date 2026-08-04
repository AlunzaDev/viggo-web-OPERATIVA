import { asRecord, getNumber, getDenominationCountPayload, mapCutPreview, mapShiftAggregate, mapShiftDetail, mapSession, mapTicket } from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterCutPreview,
  CashRegisterDenominationLine,
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
  CashSession,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";

export type ResolveQrContractResult = {
  ticket: TicketView;
  activeSession: CashSession | null;
};

export type CashRegisterShiftListContractResult = {
  items: CashRegisterShiftDetail[];
  total: number;
};

export const normalizeCashShiftListResponse = (
  data: unknown,
): CashRegisterShiftListContractResult => {
  const payload = asRecord(data);

  return {
    items: Array.isArray(payload.items) ? payload.items.map(mapShiftDetail) : [],
    total: getNumber(payload.total),
  };
};

export const normalizeCashShiftAggregateResponse = (
  data: unknown,
): CashRegisterShiftAggregate => mapShiftAggregate(data);

export const normalizeCashShiftDetailResponse = (
  data: unknown,
): CashRegisterShiftDetail => mapShiftDetail(data);

export const normalizeActiveCashShiftResponse = (
  data: unknown,
): CashRegisterShiftDetail | null => {
  const detail = asRecord(data).detail;
  return detail ? mapShiftDetail(detail) : null;
};

export const normalizeResolveQrResponse = (
  data: unknown,
): ResolveQrContractResult => {
  const payload = asRecord(data);

  return {
    ticket: mapTicket(payload.ticket),
    activeSession: payload.activeSession ? mapSession(payload.activeSession) : null,
  };
};

export const normalizeCashSessionResponse = (data: unknown): CashSession =>
  mapSession(asRecord(data).session);

export const normalizeCashMovementDetailResponse = (
  data: unknown,
): CashRegisterShiftDetail | null => {
  const detail = asRecord(data).detail;
  return detail ? mapShiftDetail(detail) : null;
};

export const normalizeCashCutPreviewResponse = (
  data: unknown,
): CashRegisterCutPreview => mapCutPreview(asRecord(data).preview);

export const buildCashCountPayload = (
  denominationLines: CashRegisterDenominationLine[],
  notes?: string,
) => ({
  denominations: getDenominationCountPayload(denominationLines),
  notes,
});
