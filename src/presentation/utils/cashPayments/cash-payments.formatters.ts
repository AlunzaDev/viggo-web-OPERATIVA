import type {
  AnyRecord,
  CashRegisterMovement,
  CashRegisterCount,
  CashRegisterCut,
  CashRegisterCutPreview,
  CashRegisterDenominationLine,
  CashRegisterShift,
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
  CashRegisterShiftSummary,
  CashSession,
  CashSessionEvent,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";

export const CASH_PAYMENT_FLOW_STORAGE_PREFIX = "viggo.cash-payments.flow";
export const CASH_PAYMENT_FLOW_TTL_MS = 12 * 60 * 60 * 1000;
export const CASHIER_STORAGE_KEY = "viggo.cash-payments.selected-pos";
export const AUTH_USER_STORAGE_KEY = "viggo.auth.user";
export const CLOSED_SESSION_STATUSES = ["cancelled", "expired", "failed"];
export const STEPS = [
  { key: "scan-pos", label: "Escanear boleto y seleccionar caja" },
  { key: "cash", label: "Registrar efectivo" },
  { key: "done", label: "Completado" },
] as const;

export const asRecord = (value: unknown): AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};

export const getText = (value: unknown, fallback = "") => String(value ?? fallback);

export const getNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getProjectId = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value !== null) {
    const item = value as AnyRecord;
    return getText(item.id ?? item._id).trim();
  }
  return "";
};

export const formatMoney = (value: number, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);

export const formatDateTime = (value?: number) => {
  if (!value || !Number.isFinite(value) || value < 0) return "Sin registro";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const formatSessionStatus = (status?: string) => {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "created":
      return "Creada";
    case "pending_cash":
      return "Esperando efectivo";
    case "partially_paid":
      return "Pago parcial";
    case "paid":
      return "Pagado";
    case "cancelled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    case "failed":
      return "Fallida";
    default:
      return status || "Sin cobro";
  }
};

export const formatSessionEventType = (type?: string) => {
  const normalizedType = String(type ?? "").trim().toLowerCase();

  switch (normalizedType) {
    case "session_created":
      return "Cobro iniciado";
    case "cash_inserted":
      return "Efectivo registrado";
    case "change_calculated":
      return "Cambio calculado";
    case "session_completed":
      return "Cobro completado";
    case "session_cancelled":
      return "Cobro cancelado";
    default:
      return type || "Evento";
  }
};

export const formatShiftStatus = (status?: string) => {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "open":
      return "Turno abierto";
    case "closed":
      return "Turno cerrado";
    case "reconciled":
      return "Corte conciliado";
    case "cancelled":
      return "Turno cancelado";
    default:
      return status || "Sin turno";
  }
};

export const formatMovementType = (type?: string) => {
  const normalizedType = String(type ?? "").trim().toLowerCase();

  switch (normalizedType) {
    case "opening_fund":
      return "Fondo inicial";
    case "ticket_payment_income":
      return "Cobro de boleto";
    case "manual_income":
      return "Ingreso manual";
    case "manual_expense":
      return "Gasto manual";
    case "cash_withdrawal":
      return "Retiro de efectivo";
    case "refund":
      return "Reembolso";
    case "adjustment":
      return "Ajuste";
    default:
      return type || "Movimiento";
  }
};

export const formatCutStatus = (status?: string) => {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "balanced":
      return "Cuadre exacto";
    case "short":
      return "Faltante";
    case "over":
      return "Sobrante";
    default:
      return status || "Sin corte";
  }
};

export const mapTicket = (value: unknown): TicketView => {
  const item = asRecord(value);
  return {
    id: getText(item.id),
    idBoleto: getText(item.idBoleto),
    usuario: getText(item.usuario),
    proyecto: getText(item.proyecto),
    monto: getNumber(item.monto),
    duracion: getNumber(item.duracion),
    horaInicio: getNumber(item.horaInicio, -1),
    horaCobro: getNumber(item.horaCobro, -1),
    pagado: Boolean(item.pagado),
  };
};

export const mapSessionEvent = (value: unknown): CashSessionEvent => {
  const item = asRecord(value);
  return {
    type: getText(item.type),
    amount: item.amount === undefined ? undefined : getNumber(item.amount),
    createdAt: getNumber(item.createdAt, -1),
    payload: asRecord(item.payload),
  };
};

export const mapSession = (value: unknown): CashSession => {
  const item = asRecord(value);
  const events = Array.isArray(item.events) ? item.events.map(mapSessionEvent) : [];
  return {
    id: getText(item.id),
    ticketId: getText(item.ticketId),
    idBoleto: getText(item.idBoleto),
    status: getText(item.status),
    amountExpected: getNumber(item.amountExpected),
    amountReceived: getNumber(item.amountReceived),
    changeAmount: getNumber(item.changeAmount),
    moduloId: getText(item.moduloId),
    moduloIdentificador: getText(item.moduloIdentificador) || undefined,
    moduloNombre: getText(item.moduloNombre) || undefined,
    deviceId: getText(item.deviceId) || undefined,
    startedAt: getNumber(item.startedAt, -1),
    completedAt:
      item.completedAt === undefined ? undefined : getNumber(item.completedAt, -1),
    cancelledAt:
      item.cancelledAt === undefined ? undefined : getNumber(item.cancelledAt, -1),
    events,
  };
};

export const mapShift = (value: unknown): CashRegisterShift => {
  const item = asRecord(value);

  return {
    id: getText(item.id ?? item._id),
    proyectoId: getText(item.proyectoId),
    moduloId: getText(item.moduloId),
    moduloIdentificador: getText(item.moduloIdentificador) || undefined,
    moduloNombre: getText(item.moduloNombre) || undefined,
    openedByUserId: getText(item.openedByUserId),
    openedByUserName: getText(item.openedByUserName) || undefined,
    status: getText(item.status),
    openingAmount: getNumber(item.openingAmount),
    openedAt: getNumber(item.openedAt, -1),
    closedAt: item.closedAt === undefined ? undefined : getNumber(item.closedAt, -1),
    closingAmountExpected:
      item.closingAmountExpected === undefined
        ? undefined
        : getNumber(item.closingAmountExpected),
    closingAmountCounted:
      item.closingAmountCounted === undefined
        ? undefined
        : getNumber(item.closingAmountCounted),
    differenceAmount:
      item.differenceAmount === undefined ? undefined : getNumber(item.differenceAmount),
    notes: getText(item.notes) || undefined,
  };
};

export const mapShiftSummary = (value: unknown): CashRegisterShiftSummary => {
  const item = asRecord(value);

  return {
    openingAmount: getNumber(item.openingAmount),
    totalIn: getNumber(item.totalIn),
    totalOut: getNumber(item.totalOut),
    expectedAmount: getNumber(item.expectedAmount),
    countedAmount:
      item.countedAmount === null || item.countedAmount === undefined
        ? null
        : getNumber(item.countedAmount),
    differenceAmount:
      item.differenceAmount === null || item.differenceAmount === undefined
        ? null
        : getNumber(item.differenceAmount),
    hasCut: Boolean(item.hasCut),
    cutStatus: getText(item.cutStatus) || null,
  };
};

export const mapShiftMovement = (value: unknown): CashRegisterMovement => {
  const item = asRecord(value);

  return {
    id: getText(item.id ?? item._id),
    type: getText(item.type),
    direction: getText(item.direction),
    concept: getText(item.concept),
    amount: getNumber(item.amount),
    createdAt: getNumber(item.createdAt, -1),
    createdByUserName: getText(item.createdByUserName) || undefined,
    notes: getText(item.notes) || undefined,
    metadata: asRecord(item.metadata),
    relatedTicketId: getText(item.relatedTicketId) || undefined,
    relatedPaymentId: getText(item.relatedPaymentId) || undefined,
    relatedCashPaymentSessionId:
      getText(item.relatedCashPaymentSessionId) || undefined,
  };
};

export const mapShiftCount = (value: unknown): CashRegisterCount => {
  const item = asRecord(value);

  return {
    id: getText(item.id ?? item._id),
    countedByUserName: getText(item.countedByUserName) || undefined,
    countedAt: getNumber(item.countedAt, -1),
    totalAmount: getNumber(item.totalAmount),
    notes: getText(item.notes) || undefined,
  };
};

export const mapShiftCut = (value: unknown): CashRegisterCut | null => {
  const item = asRecord(value);
  const id = getText(item.id ?? item._id);
  if (!id) return null;

  return {
    id,
    generatedByUserName: getText(item.generatedByUserName) || undefined,
    generatedAt: getNumber(item.generatedAt, -1),
    expectedAmount: getNumber(item.expectedAmount),
    countedAmount: getNumber(item.countedAmount),
    differenceAmount: getNumber(item.differenceAmount),
    status: getText(item.status),
  };
};

export const mapShiftDetail = (value: unknown): CashRegisterShiftDetail => {
  const item = asRecord(value);

  return {
    shift: mapShift(item.shift),
    summary: mapShiftSummary(item.summary),
    movements: Array.isArray(item.movements) ? item.movements.map(mapShiftMovement) : [],
    counts: Array.isArray(item.counts) ? item.counts.map(mapShiftCount) : [],
    cut: mapShiftCut(item.cut),
  };
};

export const mapShiftAggregate = (value: unknown): CashRegisterShiftAggregate => {
  const item = asRecord(value);

  return {
    totalShifts: getNumber(item.totalShifts),
    openShifts: getNumber(item.openShifts),
    closedShifts: getNumber(item.closedShifts),
    openingAmount: getNumber(item.openingAmount),
    totalIn: getNumber(item.totalIn),
    totalOut: getNumber(item.totalOut),
    expectedAmount: getNumber(item.expectedAmount),
    countedAmount: getNumber(item.countedAmount),
    differenceAmount: getNumber(item.differenceAmount),
  };
};

export const mapCutPreview = (value: unknown): CashRegisterCutPreview => {
  const item = asRecord(value);

  return {
    openingAmount: getNumber(item.openingAmount),
    totalIn: getNumber(item.totalIn),
    totalOut: getNumber(item.totalOut),
    expectedAmount: getNumber(item.expectedAmount),
    countedAmount: getNumber(item.countedAmount),
    differenceAmount: getNumber(item.differenceAmount),
    status: getText(item.status),
  };
};

export const DEFAULT_DENOMINATIONS: Array<Omit<CashRegisterDenominationLine, "quantity">> = [
  { label: "$1000", value: 1000 },
  { label: "$500", value: 500 },
  { label: "$200", value: 200 },
  { label: "$100", value: 100 },
  { label: "$50", value: 50 },
  { label: "$20", value: 20 },
  { label: "$10", value: 10 },
  { label: "$5", value: 5 },
  { label: "$2", value: 2 },
  { label: "$1", value: 1 },
  { label: "50c", value: 0.5 },
];

export const createDefaultDenominationLines = (): CashRegisterDenominationLine[] =>
  DEFAULT_DENOMINATIONS.map((line) => ({
    ...line,
    quantity: "",
  }));

export const getDenominationCountPayload = (
  lines: CashRegisterDenominationLine[],
) =>
  lines.map((line) => ({
    label: line.label,
    value: line.value,
    quantity: Math.max(0, Number(line.quantity || 0)),
  }));

export const getDenominationCountTotal = (lines: CashRegisterDenominationLine[]) =>
  Number(
    lines
      .reduce((sum, line) => sum + line.value * Math.max(0, Number(line.quantity || 0)), 0)
      .toFixed(2),
  );

export const getErrorMessage = (error: unknown, fallback: string) => {
  const data = asRecord(asRecord(asRecord(error).response).data);
  return String(data.error ?? data.message ?? fallback);
};

export const getCashPaymentFlowStorageKey = () => {
  if (typeof window === "undefined") {
    return `${CASH_PAYMENT_FLOW_STORAGE_PREFIX}.anonymous`;
  }

  try {
    const rawUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!rawUser) return `${CASH_PAYMENT_FLOW_STORAGE_PREFIX}.anonymous`;

    const parsedUser = JSON.parse(rawUser) as unknown;
    const userRecord = asRecord(parsedUser);
    const userId = getText(userRecord.id ?? userRecord._id ?? userRecord.correo).trim();

    return `${CASH_PAYMENT_FLOW_STORAGE_PREFIX}.${userId || "anonymous"}`;
  } catch {
    return `${CASH_PAYMENT_FLOW_STORAGE_PREFIX}.anonymous`;
  }
};
