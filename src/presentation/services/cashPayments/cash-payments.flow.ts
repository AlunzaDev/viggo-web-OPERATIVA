import {
  cancelCashTicketSession,
  closeCashRegisterShift,
  getCashRegisterCutPreview,
  insertCashIntoSession,
  openCashRegisterShift,
  registerCashRegisterMovement,
  resolveCashTicketQr,
  saveCashRegisterCount,
  startCashTicketSession,
  type ResolveQrResult,
} from "./cash-payments.api";
import type {
  CashRegisterCutPreview,
  CashRegisterDenominationLine,
  CashRegisterShiftDetail,
  CashSession,
  CashierOption,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";
import {
  createDefaultDenominationLines,
  getDenominationCountTotal,
} from "../../utils/cashPayments/cash-payments.formatters";
import { createManualCashDeviceEvent } from "../../utils/cashPayments/cash-payments.device-events";

export type ResolveQrFlowResult = {
  ticket: TicketView;
  session: CashSession | null;
  successMessage: string;
};

export const resolveQrFlow = async (input: {
  qrValue: string;
  selectedCashierId: string;
  activeShiftDetail: CashRegisterShiftDetail | null;
}): Promise<ResolveQrFlowResult> => {
  if (!input.qrValue.trim()) {
    throw new Error("Captura o escanea un QR de boleto.");
  }

  const { ticket, activeSession }: ResolveQrResult = await resolveCashTicketQr(
    input.qrValue.trim(),
  );

  if (activeSession) {
    return {
      ticket,
      session: activeSession,
      successMessage: "Se recupero un cobro activo para este boleto.",
    };
  }

  if (!ticket.pagado && input.selectedCashierId && input.activeShiftDetail) {
    const startedSession = await startCashTicketSession(
      ticket.id,
      input.selectedCashierId,
    );

    return {
      ticket,
      session: startedSession,
      successMessage: "Boleto validado y cobro iniciado automaticamente.",
    };
  }

  return {
    ticket,
    session: null,
    successMessage: input.selectedCashierId
      ? input.activeShiftDetail
        ? "Boleto validado correctamente."
        : "Boleto validado. Abre el turno de la caja para continuar."
      : "Boleto validado. Ahora selecciona la caja para continuar.",
  };
};

export const startCashSessionFlow = async (input: {
  ticket: TicketView | null;
  selectedCashierId: string;
  activeShiftDetail: CashRegisterShiftDetail | null;
}): Promise<CashSession> => {
  if (!input.ticket) {
    throw new Error("Primero valida un boleto.");
  }

  if (!input.selectedCashierId) {
    throw new Error("Selecciona una caja antes de iniciar el cobro.");
  }

  if (!input.activeShiftDetail) {
    throw new Error("La caja seleccionada no tiene un turno abierto.");
  }

  return startCashTicketSession(input.ticket.id, input.selectedCashierId);
};

export const insertCashFlow = async (input: {
  session: CashSession | null;
  insertAmount: string;
  selectedCashier: CashierOption | null;
  idempotencyKey: string;
}): Promise<CashSession> => {
  if (!input.session) {
    throw new Error("No hay un cobro activo.");
  }

  const amount = Number(input.insertAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Captura un monto valido para registrar efectivo.");
  }

  return insertCashIntoSession(
    input.session.id,
    amount,
    createManualCashDeviceEvent(
      input.session,
      input.selectedCashier,
      input.idempotencyKey,
    ),
  );
};

export const cancelCashSessionFlow = async (input: {
  session: CashSession | null;
  cancellationReason?: string;
}): Promise<CashSession> => {
  if (!input.session) {
    throw new Error("No hay un cobro activo para cancelar.");
  }

  if (input.session.amountReceived > 0 && !input.cancellationReason?.trim()) {
    throw new Error("Captura un motivo para cancelar un cobro con efectivo registrado.");
  }

  return cancelCashTicketSession(
    input.session.id,
    input.cancellationReason?.trim() || undefined,
  );
};

export const openCashShiftFlow = async (input: {
  selectedCashierId: string;
  openingAmount: string;
  openingNotes: string;
}): Promise<CashRegisterShiftDetail> => {
  if (!input.selectedCashierId) {
    throw new Error("Selecciona una caja POS antes de abrir el turno.");
  }

  const amount = Number(input.openingAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Captura un fondo inicial valido para abrir la caja.");
  }

  return openCashRegisterShift({
    moduloId: input.selectedCashierId,
    openingAmount: amount,
    notes: input.openingNotes.trim() || undefined,
  });
};

export const registerCashMovementFlow = async (input: {
  activeShiftDetail: CashRegisterShiftDetail | null;
  movementType: "manual_income" | "manual_expense";
  movementConcept: string;
  movementAmount: string;
  idempotencyKey: string;
}): Promise<CashRegisterShiftDetail | null> => {
  if (!input.activeShiftDetail) {
    throw new Error("No hay un turno abierto para registrar movimientos.");
  }

  const amount = Number(input.movementAmount);
  if (!input.movementConcept.trim()) {
    throw new Error("Captura el concepto del movimiento.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Captura un importe valido para el movimiento.");
  }

  return registerCashRegisterMovement(
    input.activeShiftDetail.shift.id,
    input.idempotencyKey,
    {
      type: input.movementType,
      concept: input.movementConcept.trim(),
      amount,
    },
  );
};

export const previewCashCutFlow = async (input: {
  activeShiftDetail: CashRegisterShiftDetail | null;
  denominationLines: CashRegisterDenominationLine[];
  countNotes: string;
}): Promise<CashRegisterCutPreview> => {
  if (!input.activeShiftDetail) {
    throw new Error("No hay un turno abierto para previsualizar el corte.");
  }

  await saveCashRegisterCount(
    input.activeShiftDetail.shift.id,
    input.denominationLines,
    input.countNotes.trim() || undefined,
  );

  return getCashRegisterCutPreview(input.activeShiftDetail.shift.id);
};

export const closeCashShiftFlow = async (input: {
  activeShiftDetail: CashRegisterShiftDetail | null;
  denominationLines: CashRegisterDenominationLine[];
  countNotes: string;
}) => {
  if (!input.activeShiftDetail) {
    throw new Error("No hay un turno abierto para cerrar.");
  }

  const countedTotal = getDenominationCountTotal(input.denominationLines);
  const expectedAmount = input.activeShiftDetail.summary.expectedAmount;
  const differenceAmount = Number((countedTotal - expectedAmount).toFixed(2));

  if (differenceAmount !== 0 && !input.countNotes.trim()) {
    throw new Error("Captura una nota explicando la diferencia antes de cerrar el turno.");
  }

  await closeCashRegisterShift(
    input.activeShiftDetail.shift.id,
    input.denominationLines,
    input.countNotes.trim() || undefined,
  );
};

export const resetCashCountState = () => ({
  cutPreview: null as CashRegisterCutPreview | null,
  denominationLines: createDefaultDenominationLines(),
  countNotes: "",
});
