type ApiErrorPayload = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

type PaginationPayload = {
  total?: unknown;
  page?: unknown;
  limit?: unknown;
  totalPages?: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

export { asRecord };

export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const parsedError = error as ApiErrorPayload;
  return parsedError.response?.data?.error || parsedError.response?.data?.message;
};

export const extractNamedEntity = (
  data: unknown,
  entityKey: string,
  fallbackMessage: string,
): Record<string, unknown> => {
  const source = asRecord(data);
  const candidate = source && entityKey in source ? source[entityKey] : data;
  const resolved = asRecord(candidate);

  if (!resolved) {
    throw new Error(fallbackMessage);
  }

  return resolved;
};

export const extractNamedCollection = (
  data: unknown,
  collectionKey: string,
): unknown[] => {
  if (Array.isArray(data)) return data;
  const source = asRecord(data);
  if (!source) return [];
  if (Array.isArray(source.items)) return source.items;
  const legacy = source[collectionKey];
  return Array.isArray(legacy) ? legacy : [];
};

export const extractPaginatedCollection = (
  data: unknown,
  collectionKey: string,
  fallbackPage = 1,
  fallbackLimit = 20,
) => {
  const source = asRecord(data) ?? {};
  const items = extractNamedCollection(data, collectionKey);
  const pagination = asRecord(source.pagination);

  const normalizedPagination: Required<PaginationPayload> = {
    total: pagination?.total ?? source.total ?? items.length,
    page: pagination?.page ?? source.page ?? fallbackPage,
    limit: pagination?.limit ?? source.limit ?? fallbackLimit,
    totalPages: pagination?.totalPages ?? source.totalPages ?? 1,
  };

  return {
    items,
    total: Number(normalizedPagination.total),
    page: Number(normalizedPagination.page),
    limit: Number(normalizedPagination.limit),
    totalPages: Number(normalizedPagination.totalPages),
  };
};
