export const MODULE_TYPES = ["ENTRADA", "SALIDA", "POS"] as const;

export type ModuleType = (typeof MODULE_TYPES)[number];

export const MODULE_TYPE_LABEL: Record<ModuleType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  POS: "POS",
};

export type ModuleTypeCapabilities = {
  canIssueTickets: boolean;
  canValidateExit: boolean;
  canChargePayments: boolean;
  requiresDeviceBinding: boolean;
  supportsRemoteSupport: boolean;
};

export const MODULE_TYPE_CAPABILITIES: Record<ModuleType, ModuleTypeCapabilities> = {
  ENTRADA: {
    canIssueTickets: true,
    canValidateExit: false,
    canChargePayments: false,
    requiresDeviceBinding: true,
    supportsRemoteSupport: true,
  },
  SALIDA: {
    canIssueTickets: false,
    canValidateExit: true,
    canChargePayments: false,
    requiresDeviceBinding: true,
    supportsRemoteSupport: true,
  },
  POS: {
    canIssueTickets: false,
    canValidateExit: false,
    canChargePayments: true,
    requiresDeviceBinding: false,
    supportsRemoteSupport: true,
  },
};

export const parseModuleType = (value: unknown): ModuleType => {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (MODULE_TYPES.includes(normalized as ModuleType)) {
    return normalized as ModuleType;
  }

  throw new Error("El modulo incluyo un tipo invalido");
};
