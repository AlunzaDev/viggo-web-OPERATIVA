export const AVAILABLE_USER_MODULES = [
  "cashPayments",
  "users",
  "permissionProfiles",
  "installations",
  "projects",
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
  users: "Accesos",
  permissionProfiles: "Perfiles",
  installations: "Instalaciones",
  projects: "Proyectos",
  modules: "Módulos",
  pensions: "Pensiones",
  pensionPasses: "Pension Pass",
  tickets: "Tickets",
  pensionMoves: "Movimientos",
  payments: "Pagos",
};

const USER_MODULE_SET = new Set<string>(AVAILABLE_USER_MODULES);

const MODULE_ALIASES: Record<string, AppModuleAccess> = {
  users: "users",
  permissionprofiles: "permissionProfiles",
  installations: "installations",
  projects: "projects",
  modules: "modules",
  pensions: "pensions",
  pensionpasses: "pensionPasses",
  tickets: "tickets",
  pensionmoves: "pensionMoves",
  payments: "payments",
  cashpayments: "cashPayments",
  pospayments: "cashPayments",
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
): boolean => {
  return normalizeUserModules(modules).includes(module);
};
