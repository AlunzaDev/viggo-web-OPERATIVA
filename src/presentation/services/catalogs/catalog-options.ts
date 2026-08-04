import { PermissionProfileEntity } from "../../../domain/entities/permission-profile.entity";
import { api } from "../../../infrastructure/http/axios.instance";
import { asRecord, extractNamedCollection } from "../../../infrastructure/http/api-contracts";

export type CatalogOption = {
  id: string;
  nombre: string;
};

const toId = (value: unknown) =>
  String(asRecord(value)?.id ?? asRecord(value)?._id ?? asRecord(value)?.uid ?? "").trim();

const normalizeNamedOption = (
  value: unknown,
  nameKeys: string[] = ["nombre", "name"],
): CatalogOption | null => {
  const record = asRecord(value);
  const id = toId(value);
  const nombre = nameKeys
    .map((key) => String(record?.[key] ?? "").trim())
    .filter(Boolean)
    .join(" ");

  if (!id) return null;
  return { id, nombre: nombre || id };
};

export const loadProjectOptions = async (): Promise<CatalogOption[]> => {
  const { data } = await api.get("/api/proyectos");
  return extractNamedCollection(data, "proyectos")
    .map((item) => normalizeNamedOption(item))
    .filter((item): item is CatalogOption => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};

export const loadModuleOptions = async (): Promise<CatalogOption[]> => {
  const { data } = await api.get("/api/modulos");
  return extractNamedCollection(data, "modulos")
    .map((item) => normalizeNamedOption(item))
    .filter((item): item is CatalogOption => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};

export const loadUserOptions = async (): Promise<CatalogOption[]> => {
  const { data } = await api.get("/api/usuarios");
  return extractNamedCollection(data, "usuarios")
    .map((item) => normalizeNamedOption(item, ["nombre", "apellido", "correo"]))
    .filter((item): item is CatalogOption => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};

export const loadPensionOptions = async (): Promise<CatalogOption[]> => {
  const { data } = await api.get("/api/pensiones");
  return extractNamedCollection(data, "pensiones")
    .map((item) => normalizeNamedOption(item))
    .filter((item): item is CatalogOption => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};

export const loadPensionPassOptions = async (): Promise<CatalogOption[]> => {
  const { data } = await api.get("/api/pension-pass");
  return extractNamedCollection(data, "pensionPasses")
    .map((item) => normalizeNamedOption(item, ["name", "idPass"]))
    .filter((item): item is CatalogOption => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};

export const loadPermissionProfileOptions = async (): Promise<
  PermissionProfileEntity[]
> => {
  const { data } = await api.get("/api/permission-profiles");
  return extractNamedCollection(data, "profiles")
    .map((item) => PermissionProfileEntity.fromObject(asRecord(item) ?? {}))
    .filter((item) => item.id.length > 0 && item.estado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};
