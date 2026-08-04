import { api } from "../http/axios.instance";
import { asRecord, extractNamedCollection } from "../http/api-contracts";

export const normalizeUserPayload = (data: unknown): Record<string, unknown> => {
  const source = asRecord(data);
  if (!source) {
    throw new Error("Respuesta de usuario invalida");
  }

  const nestedUser = asRecord(source.usuario) ?? asRecord(source.user);
  return nestedUser ?? source;
};

export const resolveUserImageUrl = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const normalized = value.trim();
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith("data:")) {
    return normalized;
  }
  if (!normalized.startsWith("/")) return normalized;

  const baseUrl = String(api.defaults.baseURL ?? "").trim();
  if (!baseUrl) return normalized;

  return `${baseUrl.replace(/\/+$/, "")}${normalized}`;
};

export const normalizeUserRecord = (data: unknown): Record<string, unknown> => {
  const payload = normalizeUserPayload(data);
  return {
    ...payload,
    img: resolveUserImageUrl(payload.img),
  };
};

export const normalizeUserCollection = (data: unknown): Record<string, unknown>[] =>
  extractNamedCollection(data, "usuarios").map((item) => normalizeUserRecord(item));
