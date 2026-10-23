import {
  MODULE_TYPES,
  MODULE_TYPE_CAPABILITIES,
  MODULE_TYPE_LABEL,
  parseModuleType as parseSharedModuleType,
  type ModuleType,
  type ModuleTypeCapabilities,
} from "@alunzadev/viggo-contracts";

// Types, capabilities and labels are shared with every Viggo app (@alunzadev/viggo-contracts).
export { MODULE_TYPES, MODULE_TYPE_CAPABILITIES, MODULE_TYPE_LABEL, type ModuleType, type ModuleTypeCapabilities };

/** The module type of an API value; an unknown type means the API sent something broken. */
export const parseModuleType = (value: unknown): ModuleType => {
  const type = parseSharedModuleType(value);
  if (!type) throw new Error("El modulo incluyo un tipo invalido");
  return type;
};
