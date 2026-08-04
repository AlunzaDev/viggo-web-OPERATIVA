import {
  extractNamedCollection,
  extractNamedEntity,
  extractPaginatedCollection,
} from "../http/api-contracts";

const resolveProjectImageUrl = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith("/")) return normalized;
  return `/${normalized.replace(/^\/+/, "")}`;
};

export const normalizeProjectRecord = (
  data: unknown,
): Record<string, unknown> => {
  const payload = extractNamedEntity(data, "proyecto", "Respuesta de proyecto invalida");
  return {
    ...payload,
    img: resolveProjectImageUrl(payload.img),
  };
};

export const normalizeProjectCollection = (
  data: unknown,
): Record<string, unknown>[] =>
  extractNamedCollection(data, "proyectos").map((item) => normalizeProjectRecord(item));

export const normalizeProjectPage = (
  data: unknown,
  page: number,
  limit: number,
) => {
  const pageResult = extractPaginatedCollection(data, "proyectos", page, limit);
  return {
    ...pageResult,
    items: pageResult.items.map((item) => normalizeProjectRecord(item)),
  };
};
