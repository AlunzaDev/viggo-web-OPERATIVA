import { extractNamedCollection, extractNamedEntity, extractPaginatedCollection } from "../http/api-contracts";

export const normalizeModuleRecord = (
  data: { modulo?: unknown } | unknown,
): Record<string, unknown> => {
  return extractNamedEntity(data, "modulo", "Respuesta de modulo invalida");
};

export const normalizeModuleCollection = (data: unknown): Record<string, unknown>[] =>
  extractNamedCollection(data, "modulos").map((item) => normalizeModuleRecord(item));

export const normalizeModulePage = (
  data: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
) => {
  const pageResult = extractPaginatedCollection(
    data,
    "modulos",
    fallbackPage,
    fallbackLimit,
  );

  return {
    ...pageResult,
    items: pageResult.items.map((item) => normalizeModuleRecord(item)),
  };
};
