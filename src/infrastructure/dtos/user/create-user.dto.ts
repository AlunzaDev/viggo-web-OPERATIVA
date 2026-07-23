import type { UserRole } from "../../../domain/entities/user.entity";
import {
  normalizeUserModules,
  type AppModuleAccess,
} from "../../../domain/entities/module-access";

export class CreateUserDto {
  public readonly nombre: string;
  public readonly apellido: string;
  public readonly correo: string;
  public readonly telefono: string;
  public readonly password: string;
  public readonly rol: UserRole;
  public readonly coordinates?: number[];
  public readonly nacimiento?: number;
  public readonly img?: string;
  public readonly estado: boolean;
  public readonly google: boolean;
  public readonly emailValidated: boolean;
  public readonly parkings: string[];
  public readonly permissionProfileId?: string;
  public readonly modules: AppModuleAccess[];

  private constructor(payload: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    password: string;
    rol: UserRole;
    coordinates?: number[];
    nacimiento?: number;
    img?: string;
    estado: boolean;
    google: boolean;
    emailValidated: boolean;
    parkings: string[];
    permissionProfileId?: string;
    modules: AppModuleAccess[];
  }) {
    this.nombre = payload.nombre;
    this.apellido = payload.apellido;
    this.correo = payload.correo;
    this.telefono = payload.telefono;
    this.password = payload.password;
    this.rol = payload.rol;
    this.coordinates = payload.coordinates;
    this.nacimiento = payload.nacimiento;
    this.img = payload.img;
    this.estado = payload.estado;
    this.google = payload.google;
    this.emailValidated = payload.emailValidated;
    this.parkings = payload.parkings;
    this.permissionProfileId = payload.permissionProfileId;
    this.modules = payload.modules;
  }

  static create(props: Record<string, unknown>): [string?, CreateUserDto?] {
    const nombre = String(props.nombre ?? "").trim();
    const apellido = String(props.apellido ?? "").trim();
    const correo = String(props.correo ?? "").trim().toLowerCase();
    const telefono = String(props.telefono ?? "").trim();
    const password = typeof props.password === "string" ? props.password : "";
    const rol = props.rol as UserRole;
    const coordinates = Array.isArray(props.coordinates)
      ? props.coordinates.map((coordinate) => Number(coordinate))
      : undefined;
    const nacimiento =
      typeof props.nacimiento === "number"
        ? props.nacimiento
        : props.nacimiento
          ? Number(props.nacimiento)
          : undefined;
    const img = typeof props.img === "string" && props.img.trim() ? props.img.trim() : undefined;
    const estado = typeof props.estado === "boolean" ? props.estado : true;
    const google = typeof props.google === "boolean" ? props.google : false;
    const emailValidated = typeof props.emailValidated === "boolean" ? props.emailValidated : false;
    const parkings = Array.isArray(props.parkings)
      ? Array.from(
          new Set(
            props.parkings
              .map((parkingId) => String(parkingId ?? "").trim())
              .filter(Boolean),
          ),
        )
      : [];
    const permissionProfileId =
      typeof props.permissionProfileId === "string" &&
      props.permissionProfileId.trim().length > 0
        ? props.permissionProfileId.trim()
        : undefined;
    const modules = normalizeUserModules(props.modules);

    if (!nombre) return ["Falta el nombre"];
    if (!apellido) return ["Falta el apellido"];
    if (!correo) return ["Falta el correo electronico"];
    if (!telefono) return ["Falta el telefono"];
    if (!password) return ["Falta la contrasena"];
    if (password.length < 6) return ["La contrasena debe tener al menos 6 caracteres"];
    if (!["SUPER_ROLE", "ADMIN_ROLE", "PENSION_ROLE", "CLIENT_ROLE"].includes(rol)) {
      return ["Rol invalido"];
    }
    if (coordinates?.some((coordinate) => Number.isNaN(coordinate))) {
      return ["Las coordenadas deben ser numericas"];
    }
    if (nacimiento !== undefined && Number.isNaN(nacimiento)) {
      return ["La fecha de nacimiento debe ser numerica"];
    }

    return [
      undefined,
      new CreateUserDto({
        nombre,
        apellido,
        correo,
        telefono,
        password,
        rol,
        coordinates,
        nacimiento,
        img,
        estado,
        google,
        emailValidated,
        parkings,
        permissionProfileId,
        modules,
      }),
    ];
  }
}
