import {
  extractNamedCollection,
  extractNamedEntity,
} from "../../../infrastructure/http/api-contracts";
import { PermissionProfileEntity } from "../../../domain/entities/permission-profile.entity";

export const normalizePermissionProfileRecord = (
  data: unknown,
): Record<string, unknown> =>
  extractNamedEntity(data, "profile", "Respuesta invalida del perfil");

export const normalizePermissionProfileCollection = (
  data: unknown,
): PermissionProfileEntity[] =>
  extractNamedCollection(data, "profiles").map((item) =>
    PermissionProfileEntity.fromObject(
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {},
    ),
  );
