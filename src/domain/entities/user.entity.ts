import { normalizeUserModules, type AppModuleAccess } from "./module-access";

export type UserRole = "SUPER_ROLE" | "ADMIN_ROLE" | "PENSION_ROLE" | "CLIENT_ROLE";

const ROLE_VALUES: UserRole[] = ["SUPER_ROLE", "ADMIN_ROLE", "PENSION_ROLE", "CLIENT_ROLE"];

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: UserRole;
  coordinates: number[];
  nacimiento?: number;
  img: string;
  estado: boolean;
  google: boolean;
  parkings: string[];
  permissionProfileId?: string;
  modules: AppModuleAccess[];

  name: string;
  email: string;
  role: UserRole;
  active: boolean;
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

const parseCoordinates = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((coordinate) => Number(coordinate))
    .filter((coordinate) => Number.isFinite(coordinate));
};

const parseParkingIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((parkingId) => String(parkingId ?? "").trim())
        .filter((parkingId) => parkingId.length > 0),
    ),
  );
};

const normalizeBackendRole = (value: unknown): UserRole => {
  if (typeof value !== "string") return "CLIENT_ROLE";
  const normalized = value.trim().toUpperCase();
  return ROLE_VALUES.includes(normalized as UserRole) ? (normalized as UserRole) : "CLIENT_ROLE";
};

export class UserEntity implements User {
  public id: string;
  public nombre: string;
  public apellido: string;
  public correo: string;
  public telefono: string;
  public rol: UserRole;
  public coordinates: number[];
  public nacimiento?: number;
  public img: string;
  public estado: boolean;
  public google: boolean;
  public parkings: string[];
  public permissionProfileId?: string;
  public modules: AppModuleAccess[];

  constructor(options: User) {
    this.id = options.id;
    this.nombre = options.nombre;
    this.apellido = options.apellido;
    this.correo = options.correo;
    this.telefono = options.telefono;
    this.rol = options.rol;
    this.coordinates = options.coordinates;
    this.nacimiento = options.nacimiento;
    this.img = options.img;
    this.estado = options.estado;
    this.google = options.google;
    this.parkings = options.parkings;
    this.permissionProfileId = options.permissionProfileId;
    this.modules = options.modules;
  }

  get name() {
    return [this.nombre, this.apellido].filter(Boolean).join(" ").trim();
  }

  get email() {
    return this.correo;
  }

  get role() {
    return this.rol;
  }

  get active() {
    return this.estado;
  }

  static fromObject(object: Record<string, unknown>): UserEntity {
    const id = String(object.uid ?? object.id ?? object._id ?? "").trim();
    const nombre = String(object.nombre ?? "").trim();
    const apellido = String(object.apellido ?? "").trim();
    const correo = String(object.correo ?? "").trim();
    const telefono = String(object.telefono ?? "").trim();
    const nacimiento =
      typeof object.nacimiento === "number"
        ? object.nacimiento
        : object.nacimiento
          ? Number(object.nacimiento)
          : undefined;

    return new UserEntity({
      id,
      nombre,
      apellido,
      correo,
      telefono,
      rol: normalizeBackendRole(object.rol),
      coordinates: parseCoordinates(object.coordinates),
      nacimiento: Number.isFinite(nacimiento) ? nacimiento : undefined,
      img: typeof object.img === "string" ? object.img : "",
      estado: parseBooleanValue(object.estado, true),
      google: parseBooleanValue(object.google, false),
      parkings: parseParkingIds(object.parkings ?? object.projects ?? object.projectIds),
      permissionProfileId:
        typeof object.permissionProfileId === "string" &&
        object.permissionProfileId.trim().length > 0
          ? object.permissionProfileId.trim()
          : undefined,
      modules: normalizeUserModules(object.modules),
      name: "",
      email: "",
      role: "CLIENT_ROLE",
      active: true,
    });
  }
}
