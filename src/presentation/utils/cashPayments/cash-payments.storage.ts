import type {
  CashSession,
  PersistedCashPaymentState,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";
import {
  asRecord,
  CASH_PAYMENT_FLOW_TTL_MS,
  getNumber,
  getText,
  mapSession,
  mapTicket,
} from "./cash-payments.formatters";

type PersistCashPaymentStateInput = {
  storageKey: string;
  qrValue: string;
  selectedCashierId: string;
  insertAmount: string;
  openingAmount: string;
  openingNotes: string;
  resolvedTicket: TicketView | null;
  session: CashSession | null;
};

export const clearPersistedCashPaymentState = (storageKey: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
};

export const readPersistedCashPaymentState = (
  storageKey: string,
): PersistedCashPaymentState | null => {
  if (typeof window === "undefined") return null;

  const rawSnapshot = window.localStorage.getItem(storageKey);
  if (!rawSnapshot) return null;

  try {
    const parsedSnapshot = JSON.parse(rawSnapshot) as unknown;
    const snapshot = asRecord(parsedSnapshot);

    if (getNumber(snapshot.version) !== 1) {
      clearPersistedCashPaymentState(storageKey);
      return null;
    }

    const updatedAt = getNumber(snapshot.updatedAt);
    if (!updatedAt || Date.now() - updatedAt > CASH_PAYMENT_FLOW_TTL_MS) {
      clearPersistedCashPaymentState(storageKey);
      return null;
    }

    return {
      version: 1,
      qrValue: getText(snapshot.qrValue),
      selectedCashierId: getText(snapshot.selectedCashierId),
      insertAmount: getText(snapshot.insertAmount),
      openingAmount: getText(snapshot.openingAmount),
      openingNotes: getText(snapshot.openingNotes),
      resolvedTicket: snapshot.resolvedTicket ? mapTicket(snapshot.resolvedTicket) : null,
      session: snapshot.session ? mapSession(snapshot.session) : null,
      successMessage: null,
      updatedAt,
    };
  } catch {
    clearPersistedCashPaymentState(storageKey);
    return null;
  }
};

export const persistCashPaymentState = ({
  storageKey,
  qrValue,
  selectedCashierId,
  insertAmount,
  openingAmount,
  openingNotes,
  resolvedTicket,
  session,
}: PersistCashPaymentStateInput) => {
  if (typeof window === "undefined") return;

  const hasStateToPersist =
    qrValue.trim().length > 0 ||
    selectedCashierId.trim().length > 0 ||
    insertAmount.trim().length > 0 ||
    openingAmount.trim().length > 0 ||
    openingNotes.trim().length > 0 ||
    resolvedTicket !== null ||
    session !== null;

  if (!hasStateToPersist) {
    clearPersistedCashPaymentState(storageKey);
    return;
  }

  const snapshot: PersistedCashPaymentState = {
    version: 1,
    qrValue,
    selectedCashierId,
    insertAmount,
    openingAmount,
    openingNotes,
    resolvedTicket,
    session,
    successMessage: null,
    updatedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    clearPersistedCashPaymentState(storageKey);
  }
};
