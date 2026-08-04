import { extractPaginatedCollection } from "../../../infrastructure/http/api-contracts";

export type ValidezItem = {
  weekDay: number;
  from: number[];
  to: number[];
};

export type PensionRecord = {
  id: string;
  proyecto: string;
  nombre: string;
  validez: ValidezItem[];
  precio: number;
  estado: boolean;
  descripcion?: string;
};

export type PensionForm = {
  proyecto: string;
  nombre: string;
  validez: ValidezItem[];
  precio: string;
  descripcion: string;
  estado: boolean;
};

const DEFAULT_VALIDEZ: ValidezItem[] = Array.from({ length: 7 }, (_, weekDay) => ({
  weekDay,
  from: [0, 0],
  to: [23, 59],
}));

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const WEEK_DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

export const cloneDefaultValidez = () =>
  DEFAULT_VALIDEZ.map((item) => ({
    ...item,
    from: [...item.from],
    to: [...item.to],
  }));

export const createInitialPensionForm = (): PensionForm => ({
  proyecto: "",
  nombre: "",
  validez: cloneDefaultValidez(),
  precio: "",
  descripcion: "",
  estado: true,
});

export const normalizePensionRecord = (value: unknown): PensionRecord => {
  const item = asRecord(value);
  return {
    id: String(item.id ?? item._id ?? ""),
    proyecto: String(item.proyecto ?? ""),
    nombre: String(item.nombre ?? ""),
    validez: normalizeValidez(item.validez),
    precio: Number(item.precio ?? 0),
    estado: Boolean(item.estado ?? true),
    descripcion:
      typeof item.descripcion === "string" ? item.descripcion : undefined,
  };
};

export const normalizePensionsPage = (
  data: unknown,
  page: number,
  pageSize: number,
) => {
  const pageResult = extractPaginatedCollection(data, "pensiones", page, pageSize);
  return {
    ...pageResult,
    items: pageResult.items.map((item) => normalizePensionRecord(item)),
  };
};

export const normalizeValidez = (value: unknown): ValidezItem[] => {
  if (!Array.isArray(value) || value.length === 0) return cloneDefaultValidez();
  const parsed = value.map((item) => {
    const record = asRecord(item);
    return {
      weekDay: Number(record.weekDay),
      from: Array.isArray(record.from) ? record.from.map(Number) : [],
      to: Array.isArray(record.to) ? record.to.map(Number) : [],
    };
  });
  return cloneDefaultValidez().map(
    (defaultItem) =>
      parsed.find((item) => item.weekDay === defaultItem.weekDay) ?? defaultItem,
  );
};

export const buildWeekSchedule = (from: number[], to: number[]) =>
  DEFAULT_VALIDEZ.map((item) => ({ ...item, from: [...from], to: [...to] }));

export const buildPensionForm = (item: PensionRecord): PensionForm => ({
  proyecto: item.proyecto,
  nombre: item.nombre,
  validez: normalizeValidez(item.validez),
  precio: String(item.precio),
  descripcion: item.descripcion ?? "",
  estado: item.estado,
});

export const buildPensionPayload = (form: PensionForm) => ({
  proyecto: form.proyecto,
  nombre: form.nombre.trim(),
  validez: form.validez,
  precio: Number(form.precio),
  descripcion: form.descripcion.trim() || undefined,
  estado: form.estado,
});
