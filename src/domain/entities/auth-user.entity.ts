import { normalizeUserModules, type AppModuleAccess } from "./module-access";
import { normalizeUserApps, type UserAppAccess } from "./user-app-access";
import { normalizeUserRole, type AppUserRole } from "./role.utils";

export type AuthUserRole = AppUserRole;

export interface AuthUserEntity {
  id: string;
  name: string;
  email: string;
  role: AuthUserRole;
  active: boolean;
  parkings: string[];
  permissionProfileId?: string;
  modules: AppModuleAccess[];
  allowedApps: UserAppAccess[];
}

const normalizeParkingIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((parkingId) => String(parkingId ?? "").trim())
          .filter((parkingId) => parkingId.length > 0),
      ),
    );
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((parkingId) => parkingId.trim())
          .filter((parkingId) => parkingId.length > 0),
      ),
    );
  }

  return [];
};

const normalizeActiveStatus = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      ["false", "inactive", "inactivo", "disabled", "0"].includes(normalized)
    ) {
      return false;
    }

    if (["true", "active", "activo", "enabled", "1"].includes(normalized)) {
      return true;
    }
  }

  return true;
};

const normalizeUserName = (object: Record<string, unknown>): string => {
  if (typeof object.name === "string" && object.name.trim().length > 0) {
    return object.name.trim();
  }

  const fullName = [object.nombre, object.apellido]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(" ");

  return fullName || "Usuario Viggo";
};

export const authUserFromObject = (
  object: Record<string, unknown>,
): AuthUserEntity => {
  return {
    id: String(object.uid ?? object.id ?? object._id ?? "").trim(),
    name: normalizeUserName(object),
    email: String(object.email ?? object.correo ?? "")
      .trim()
      .toLowerCase(),
    role: normalizeUserRole(object.rol ?? object.role),
    active: normalizeActiveStatus(
      object.estado ?? object.state ?? object.active,
    ),
    parkings: normalizeParkingIds(
      object.parkings ?? object.projects ?? object.projectIds,
    ),
    permissionProfileId:
      typeof object.permissionProfileId === "string" &&
      object.permissionProfileId.trim().length > 0
        ? object.permissionProfileId.trim()
        : undefined,
    modules: normalizeUserModules(object.modules),
    allowedApps: normalizeUserApps(object.allowedApps),
  };
};
