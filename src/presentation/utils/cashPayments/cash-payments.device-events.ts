import type {
  CashSession,
  CashierOption,
} from "../../types/cashPayments/cash-payments.types";

export const createManualCashDeviceEvent = (
  session: CashSession,
  selectedCashier: CashierOption | null,
) => ({
  idempotencyKey:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${session.id}-${Date.now()}`,
  source: "viggo_web",
  moduloId: session.moduloId,
  moduloIdentificador: session.moduloIdentificador ?? selectedCashier?.identificador,
  deviceMode: "manual",
  hardwareDeviceId: null,
  inputMode: "manual",
});
