export type AnyRecord = Record<string, unknown>;

export type TicketView = {
  id: string;
  idBoleto: string;
  usuario: string;
  proyecto: string;
  monto: number;
  duracion: number;
  horaInicio: number;
  horaCobro: number;
  pagado: boolean;
};

export type CashSessionEvent = {
  type: string;
  amount?: number;
  createdAt: number;
  payload?: AnyRecord;
};

export type CashSession = {
  id: string;
  ticketId: string;
  idBoleto: string;
  status: string;
  amountExpected: number;
  amountReceived: number;
  changeAmount: number;
  moduloId: string;
  moduloIdentificador?: string;
  moduloNombre?: string;
  deviceId?: string;
  startedAt: number;
  completedAt?: number;
  cancelledAt?: number;
  events: CashSessionEvent[];
};

export type CashRegisterShift = {
  id: string;
  proyectoId: string;
  moduloId: string;
  moduloIdentificador?: string;
  moduloNombre?: string;
  openedByUserId: string;
  openedByUserName?: string;
  status: string;
  openingAmount: number;
  openedAt: number;
  closedAt?: number;
  closingAmountExpected?: number;
  closingAmountCounted?: number;
  differenceAmount?: number;
  notes?: string;
};

export type CashRegisterShiftSummary = {
  openingAmount: number;
  totalIn: number;
  totalOut: number;
  expectedAmount: number;
  countedAmount: number | null;
  differenceAmount: number | null;
  hasCut: boolean;
  cutStatus: string | null;
};

export type CashRegisterMovement = {
  id: string;
  type: string;
  direction: string;
  concept: string;
  amount: number;
  createdAt: number;
  createdByUserName?: string;
  notes?: string;
  metadata?: AnyRecord;
  relatedTicketId?: string;
  relatedPaymentId?: string;
  relatedCashPaymentSessionId?: string;
};

export type CashRegisterCount = {
  id: string;
  countedByUserName?: string;
  countedAt: number;
  totalAmount: number;
  notes?: string;
};

export type CashRegisterCut = {
  id: string;
  generatedByUserName?: string;
  generatedAt: number;
  expectedAmount: number;
  countedAmount: number;
  differenceAmount: number;
  status: string;
};

export type CashRegisterShiftDetail = {
  shift: CashRegisterShift;
  summary: CashRegisterShiftSummary;
  movements: CashRegisterMovement[];
  counts?: CashRegisterCount[];
  cut?: CashRegisterCut | null;
};

export type CashRegisterShiftAggregate = {
  totalShifts: number;
  openShifts: number;
  closedShifts: number;
  openingAmount: number;
  totalIn: number;
  totalOut: number;
  expectedAmount: number;
  countedAmount: number;
  differenceAmount: number;
};

export type CashRegisterCutPreview = {
  openingAmount: number;
  totalIn: number;
  totalOut: number;
  expectedAmount: number;
  countedAmount: number;
  differenceAmount: number;
  status: string;
};

export type CashRegisterDenominationLine = {
  label: string;
  value: number;
  quantity: string;
};

export type CashierOption = {
  id: string;
  nombre: string;
  identificador: string;
  proyecto: string;
};

export type NamedOption = {
  id: string;
  nombre: string;
};

export type PersistedCashPaymentState = {
  version: 1;
  qrValue: string;
  selectedCashierId: string;
  insertAmount: string;
  openingAmount: string;
  openingNotes: string;
  resolvedTicket: TicketView | null;
  session: CashSession | null;
  successMessage: string | null;
  updatedAt: number;
};

export type ScannerInputMeta = {
  isScannerLikely: boolean;
  lastCompletedInput: "scanner" | "manual" | null;
};
