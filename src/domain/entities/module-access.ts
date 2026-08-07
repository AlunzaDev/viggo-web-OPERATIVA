export const AVAILABLE_USER_MODULES = [
  "cashPayments",
  "modules",
  "pensions",
  "pensionPasses",
  "tickets",
  "pensionMoves",
  "payments",
] as const;

export type AppModuleAccess = (typeof AVAILABLE_USER_MODULES)[number];

export const USER_MODULE_LABELS: Record<AppModuleAccess, string> = {
  cashPayments: "Cobro en Caja",
  modules: "Módulos",
  pensions: "Pensiones",
  pensionPasses: "Pension Pass",
  tickets: "Tickets",
  pensionMoves: "Movimientos",
  payments: "Pagos",
};

const USER_MODULE_SET = new Set<string>(AVAILABLE_USER_MODULES);

const MODULE_ALIASES: Record<string, AppModuleAccess> = {
  cashpayments: "cashPayments",
  pospayments: "cashPayments",

  modules: "modules",

  pensions: "pensions",

  pensionpasses: "pensionPasses",

  tickets: "tickets",

  pensionmoves: "pensionMoves",

  payments: "payments",
};

export const getDefaultUserModules = (): AppModuleAccess[] => [
  ...AVAILABLE_USER_MODULES,
];

export const normalizeUserModules = (value: unknown): AppModuleAccess[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .map((item) => MODULE_ALIASES[item.toLowerCase()] ?? item)
        .filter((item): item is AppModuleAccess => USER_MODULE_SET.has(item)),
    ),
  );
};

export const hasModuleAccess = (
  modules: AppModuleAccess[] | undefined,
  module: AppModuleAccess,
): boolean => normalizeUserModules(modules).includes(module);
