import type { ModuleRemoteSupport } from "../../../domain/entities/module.entity";

export type RemoteSupportProvider = ModuleRemoteSupport["provider"];

export type RemoteSupportLink = {
  label: string;
  url: string;
  kind: "primary" | "desktop" | "terminal";
};

const MESH_CENTRAL_DEVICE_VIEWMODE = 10;

const cleanBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const buildMeshCentralDeviceUrl = (baseUrl?: string, deviceId?: string) => {
  const normalizedBaseUrl = cleanBaseUrl(String(baseUrl ?? ""));
  const normalizedDeviceId = String(deviceId ?? "").trim();

  if (!normalizedBaseUrl || !normalizedDeviceId) return "";

  return `${normalizedBaseUrl}/?viewmode=${MESH_CENTRAL_DEVICE_VIEWMODE}&gotonode=${normalizedDeviceId}`;
};

export const getRemoteSupportLinks = (
  remoteSupport?: ModuleRemoteSupport | null,
  options: { inheritedBaseUrl?: string } = {},
): RemoteSupportLink[] => {
  if (!remoteSupport?.enabled) return [];

  if (remoteSupport.provider === "MESHCENTRAL") {
    const url =
      buildMeshCentralDeviceUrl(remoteSupport.baseUrl || options.inheritedBaseUrl, remoteSupport.deviceId) ||
      remoteSupport.supportUrl ||
      "";

    return url ? [{ label: "Abrir soporte", url, kind: "primary" }] : [];
  }

  return remoteSupport.supportUrl
    ? [{ label: "Abrir soporte", url: remoteSupport.supportUrl, kind: "primary" }]
    : [];
};

export const getRemoteSupportProviderLabel = (
  provider?: RemoteSupportProvider,
) => {
  if (provider === "MESHCENTRAL") return "MeshCentral";
  return "Soporte remoto";
};
