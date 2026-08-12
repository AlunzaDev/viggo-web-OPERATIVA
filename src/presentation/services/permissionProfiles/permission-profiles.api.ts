import { api } from "../../../infrastructure/http/axios.instance";
import { PermissionProfileEntity } from "../../../domain/entities/permission-profile.entity";
import {
  normalizePermissionProfileCollection,
  normalizePermissionProfileRecord,
} from "../../hooks/permissionProfiles/permission-profiles.contract";

type PermissionProfilePayload = {
  nombre: string;
  descripcion?: string;
  estado?: boolean;
  modules: string[];
};

export const fetchPermissionProfiles = async (): Promise<PermissionProfileEntity[]> => {
  const { data } = await api.get("/api/permission-profiles");
  return normalizePermissionProfileCollection(data);
};

export const createPermissionProfile = async (
  payload: PermissionProfilePayload,
): Promise<PermissionProfileEntity> => {
  const { data } = await api.post("/api/permission-profiles", payload);
  return PermissionProfileEntity.fromObject(normalizePermissionProfileRecord(data));
};

export const updatePermissionProfile = async (
  id: string,
  payload: Partial<PermissionProfilePayload>,
): Promise<PermissionProfileEntity> => {
  const { data } = await api.patch(`/api/permission-profiles/${id}`, payload);
  return PermissionProfileEntity.fromObject(normalizePermissionProfileRecord(data));
};

export const deletePermissionProfile = async (id: string): Promise<void> => {
  await api.delete(`/api/permission-profiles/${id}`);
};