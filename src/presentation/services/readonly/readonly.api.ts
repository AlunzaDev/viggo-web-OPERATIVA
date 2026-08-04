import { api } from "../../../infrastructure/http/axios.instance";
import { asRecord, extractPaginatedCollection } from "../../../infrastructure/http/api-contracts";
import {
  loadModuleOptions,
  loadPensionPassOptions,
  loadProjectOptions,
  loadUserOptions,
} from "../catalogs/catalog-options";

const getId = (value: unknown) => String(asRecord(value)?.id ?? asRecord(value)?._id ?? "");
const getText = (value: unknown, fallback = "") => String(value ?? fallback);
const toRecord = (value: unknown): Record<string, unknown> => asRecord(value) ?? {};

export type ReadonlyTicketRow = {
  id: string;
  proyecto: string;
  entrada: string;
  salida: string;
  usuario: string;
  idBoleto: string;
  horaInicio: number;
  horaConsulta: number;
  horaCobro: number;
  horaSalida: number;
  duracion: number;
  monto: number;
  pagado: boolean;
};

export type ReadonlyPensionMoveRow = {
  id: string;
  modulo: string;
  proyecto: string;
  pensionPass: string;
  tipo: string;
  fecha: number;
};

export type ReadonlyPaymentRow = {
  id: string;
  type: string;
  concept: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: number;
  reference?: Record<string, unknown>;
  parking?: Record<string, unknown>;
  paymentMethod?: Record<string, unknown>;
};

export const loadReadonlyTicketsData = async (params: {
  page: number;
  limit: number;
  search?: string;
  proyecto?: string;
  status?: string;
  pagado?: string;
  from?: number;
  to?: number;
}) => {
  const [ticketsResponse, projects, modules, users] = await Promise.all([
    api.get("/api/tickets", { params }),
    loadProjectOptions(),
    loadModuleOptions(),
    loadUserOptions(),
  ]);

  const pageResult = extractPaginatedCollection(
    ticketsResponse.data,
    "tickets",
    params.page,
    params.limit,
  );

  const rows = pageResult.items.map((value) => {
    const item = toRecord(value);
    return {
      id: getId(item),
      proyecto: getText(item.proyecto),
      entrada: getText(item.entrada),
      salida: getText(item.salida),
      usuario: getText(item.usuario),
      idBoleto: getText(item.idBoleto),
      horaInicio: Number(item.horaInicio ?? -1),
      horaConsulta: Number(item.horaConsulta ?? -1),
      horaCobro: Number(item.horaCobro ?? -1),
      horaSalida: Number(item.horaSalida ?? -1),
      duracion: Number(item.duracion ?? 0),
      monto: Number(item.monto ?? 0),
      pagado: Boolean(item.pagado),
    } satisfies ReadonlyTicketRow;
  });

  return { rows, projects, modules, users, total: pageResult.total, totalPages: pageResult.totalPages };
};

export const loadReadonlyPensionMovesData = async (params: {
  page: number;
  limit: number;
  search?: string;
  proyecto?: string;
  tipo?: string;
  from?: number;
  to?: number;
}) => {
  const [movesResponse, projects, modules, passes] = await Promise.all([
    api.get("/api/pension-moves", { params }),
    loadProjectOptions(),
    loadModuleOptions(),
    loadPensionPassOptions(),
  ]);

  const pageResult = extractPaginatedCollection(
    movesResponse.data,
    "pensionMoves",
    params.page,
    params.limit,
  );

  const rows = pageResult.items.map((value) => {
    const item = toRecord(value);
    return {
      id: getId(item),
      modulo: getText(item.modulo),
      proyecto: getText(item.proyecto),
      pensionPass: getText(item.pensionPass),
      tipo: getText(item.tipo),
      fecha: Number(item.fecha ?? -1),
    } satisfies ReadonlyPensionMoveRow;
  });

  return { rows, projects, modules, passes, total: pageResult.total, totalPages: pageResult.totalPages };
};

export const loadReadonlyPaymentsData = async (params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  status?: string;
  from?: number;
  to?: number;
}) => {
  const { data } = await api.get("/api/payments/history", { params });
  const pageResult = extractPaginatedCollection(data, "payments", params.page, params.limit);

  const rows = pageResult.items.map((value) => {
    const item = toRecord(value);
    return {
      id: getId(item),
      type: getText(item.type),
      concept: getText(item.concept),
      amount: Number(item.amount ?? 0),
      currency: getText(item.currency, "MXN"),
      status: getText(item.status),
      paidAt: Number(item.paidAt ?? -1),
      reference: toRecord(item.reference),
      parking: toRecord(item.parking),
      paymentMethod: toRecord(item.paymentMethod),
    } satisfies ReadonlyPaymentRow;
  });

  return {
    rows,
    total: pageResult.total,
    totalPages: pageResult.totalPages,
  };
};
