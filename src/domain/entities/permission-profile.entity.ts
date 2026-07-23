import { normalizeUserModules, type AppModuleAccess } from "./module-access";

export interface PermissionProfile {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  modules: AppModuleAccess[];
}

const parseBooleanValue = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return defaultValue;
};

export class PermissionProfileEntity implements PermissionProfile {
  public id: string;
  public nombre: string;
  public descripcion?: string;
  public estado: boolean;
  public modules: AppModuleAccess[];

  constructor(options: PermissionProfile) {
    this.id = options.id;
    this.nombre = options.nombre;
    this.descripcion = options.descripcion;
    this.estado = options.estado;
    this.modules = options.modules;
  }

  static fromObject(object: Record<string, unknown>): PermissionProfileEntity {
    return new PermissionProfileEntity({
      id: String(object.id ?? object._id ?? "").trim(),
      nombre: String(object.nombre ?? "").trim(),
      descripcion:
        typeof object.descripcion === "string" && object.descripcion.trim().length > 0
          ? object.descripcion.trim()
          : undefined,
      estado: parseBooleanValue(object.estado, true),
      modules: normalizeUserModules(object.modules),
    });
  }
}
