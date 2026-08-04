import { extractNamedCollection } from "../../../infrastructure/http/api-contracts";

export type PensionPassRecord = {
  id: string;
  usuario?: string;
  name: string;
  pension: string;
  idPass: string;
  vigent: boolean;
  antiPassback: boolean;
  inParking: boolean;
  created: number;
  from: number;
  to: number;
  estado: boolean;
};

export type PensionPassForm = {
  name: string;
  pension: string;
  idPass: string;
  vigent: boolean;
  antiPassback: boolean;
  inParking: boolean;
  created: string;
  from: string;
  to: string;
  estado: boolean;
  usuario: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const createInitialPensionPassForm = (): PensionPassForm => ({
  name: "",
  pension: "",
  idPass: "",
  vigent: false,
  antiPassback: true,
  inParking: false,
  created: String(Date.now()),
  from: "-1",
  to: "-1",
  estado: true,
  usuario: "",
});

export const normalizePensionPassRecord = (
  value: unknown,
): PensionPassRecord => {
  const item = asRecord(value);
  return {
    id: String(item.id ?? item._id ?? ""),
    usuario: typeof item.usuario === "string" ? item.usuario : undefined,
    name: String(item.name ?? ""),
    pension: String(item.pension ?? ""),
    idPass: String(item.idPass ?? ""),
    vigent: Boolean(item.vigent),
    antiPassback: Boolean(item.antiPassback),
    inParking: Boolean(item.inParking),
    created: Number(item.created ?? 0),
    from: Number(item.from ?? -1),
    to: Number(item.to ?? -1),
    estado: Boolean(item.estado ?? true),
  };
};

export const normalizePensionPassCollection = (data: unknown) =>
  extractNamedCollection(data, "pensionPasses").map((item) =>
    normalizePensionPassRecord(item),
  );

export const buildPensionPassPayload = (form: PensionPassForm) => ({
  name: form.name.trim(),
  pension: form.pension,
  idPass: form.idPass.trim(),
  vigent: form.vigent,
  antiPassback: form.antiPassback,
  inParking: form.inParking,
  created: Number(form.created),
  from: Number(form.from),
  to: Number(form.to),
  estado: form.estado,
  usuario: form.usuario || undefined,
});

export const buildPensionPassForm = (
  item: PensionPassRecord,
): PensionPassForm => ({
  name: item.name,
  pension: item.pension,
  idPass: item.idPass,
  vigent: item.vigent,
  antiPassback: item.antiPassback,
  inParking: item.inParking,
  created: String(item.created),
  from: String(item.from),
  to: String(item.to),
  estado: item.estado,
  usuario: item.usuario ?? "",
});
