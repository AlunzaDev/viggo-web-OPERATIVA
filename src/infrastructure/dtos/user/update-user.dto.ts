import type { UserRole } from "../../../domain/entities/user.entity";
import {
  normalizeUserModules,
  type AppModuleAccess,
} from "../../../domain/entities/module-access";

export type UpdateUserPayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  password?: string;
  rol?: UserRole;
  coordinates?: number[];
  nacimiento?: number;
  img?: string;
  google?: boolean;
  estado?: boolean;
  parkings?: string[];
  permissionProfileId?: string;
  modules?: AppModuleAccess[];
};

export class UpdateUserDto {
  public readonly nombre?: string;
  public readonly apellido?: string;
  public readonly correo?: string;
  public readonly telefono?: string;
  public readonly password?: string;
  public readonly rol?: UserRole;
  public readonly coordinates?: number[];
  public readonly nacimiento?: number;
  public readonly img?: string;
  public readonly google?: boolean;
  public readonly estado?: boolean;
  public readonly parkings?: string[];
  public readonly permissionProfileId?: string;
  public readonly modules?: AppModuleAccess[];

  private constructor(payload: UpdateUserPayload) {
    this.nombre = payload.nombre;
    this.apellido = payload.apellido;
    this.correo = payload.correo;
    this.telefono = payload.telefono;
    this.password = payload.password;
    this.rol = payload.rol;
    this.coordinates = payload.coordinates;
    this.nacimiento = payload.nacimiento;
    this.img = payload.img;
    this.google = payload.google;
    this.estado = payload.estado;
    this.parkings = payload.parkings;
    this.permissionProfileId = payload.permissionProfileId;
    this.modules = payload.modules;
  }

  static create(payload: UpdateUserPayload): [string?, UpdateUserDto?] {
    const dtoPayload: UpdateUserPayload = {};

    if (typeof payload.nombre === "string") {
      const nombre = payload.nombre.trim();
      if (!nombre) return ["El nombre no puede ir vacio"];
      dtoPayload.nombre = nombre;
    }

    if (typeof payload.apellido === "string") {
      const apellido = payload.apellido.trim();
      if (!apellido) return ["El apellido no puede ir vacio"];
      dtoPayload.apellido = apellido;
    }

    if (typeof payload.correo === "string") {
      const correo = payload.correo.trim().toLowerCase();
      if (!correo) return ["El correo no puede ir vacio"];
      dtoPayload.correo = correo;
    }

    if (typeof payload.telefono === "string") {
      const telefono = payload.telefono.trim();
      if (!telefono) return ["El telefono no puede ir vacio"];
      dtoPayload.telefono = telefono;
    }

    if (typeof payload.password === "string") {
      if (payload.password.length < 6) return ["La contrasena debe tener al menos 6 caracteres"];
      dtoPayload.password = payload.password;
    }

    if (payload.rol) {
      if (!["SUPER_ROLE", "ADMIN_ROLE", "PENSION_ROLE", "CLIENT_ROLE"].includes(payload.rol)) {
        return ["Rol invalido"];
      }
      dtoPayload.rol = payload.rol;
    }

    if (payload.coordinates !== undefined) {
      if (!Array.isArray(payload.coordinates)) return ["Las coordenadas deben ser un arreglo"];
      const coordinates = payload.coordinates.map((coordinate) => Number(coordinate));
      if (coordinates.some((coordinate) => Number.isNaN(coordinate))) {
        return ["Las coordenadas deben ser numericas"];
      }
      dtoPayload.coordinates = coordinates;
    }

    if (payload.nacimiento !== undefined) {
      const nacimiento = Number(payload.nacimiento);
      if (Number.isNaN(nacimiento)) return ["La fecha de nacimiento debe ser numerica"];
      dtoPayload.nacimiento = nacimiento;
    }

    if (typeof payload.img === "string") dtoPayload.img = payload.img.trim();
    if (typeof payload.google === "boolean") dtoPayload.google = payload.google;
    if (typeof payload.estado === "boolean") dtoPayload.estado = payload.estado;
    if (payload.parkings !== undefined) {
      dtoPayload.parkings = Array.from(
        new Set(
          payload.parkings
            .map((parkingId) => String(parkingId ?? "").trim())
            .filter(Boolean),
        ),
      );
    }
    if (payload.permissionProfileId !== undefined) {
      const permissionProfileId = payload.permissionProfileId.trim();
      if (!permissionProfileId) return ["Debes seleccionar un perfil valido"];
      dtoPayload.permissionProfileId = permissionProfileId;
    }
    if (payload.modules !== undefined) {
      dtoPayload.modules = normalizeUserModules(payload.modules);
    }

    if (Object.keys(dtoPayload).length === 0) {
      return ["Debes enviar al menos un campo para actualizar"];
    }

    return [undefined, new UpdateUserDto(dtoPayload)];
  }
}
