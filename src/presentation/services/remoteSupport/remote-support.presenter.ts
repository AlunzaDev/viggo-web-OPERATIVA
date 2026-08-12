import type { ModuleRemoteSupport } from "../../../domain/entities/module.entity";

export type RemoteSupportProvider = ModuleRemoteSupport["provider"];

export type RemoteSupportLink = {
  label: string;
  url: string;
  kind: "primary" | "desktop" | "terminal";
  viewMode: number;
};

const MESH_CENTRAL_VIEW_MODES = {
  support: 10,
  desktop: 11,
  terminal: 12,
} as const;

const cleanBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const buildMeshCentralDeviceUrl = (
  baseUrl?: string,
  deviceId?: string,
  viewMode: number = MESH_CENTRAL_VIEW_MODES.support,
) => {
  const normalizedBaseUrl = cleanBaseUrl(String(baseUrl ?? ""));
  const normalizedDeviceId = String(deviceId ?? "").trim();

  if (!normalizedBaseUrl || !normalizedDeviceId) return "";

  return `${normalizedBaseUrl}/?viewmode=${viewMode}&gotonode=${normalizedDeviceId}`;
};

export const getRemoteSupportLinks = (
  remoteSupport?: ModuleRemoteSupport | null,
  options: { inheritedBaseUrl?: string } = {},
): RemoteSupportLink[] => {
  if (!remoteSupport?.enabled) return [];

  if (remoteSupport.provider === "MESHCENTRAL") {
    const baseUrl = remoteSupport.baseUrl || options.inheritedBaseUrl;
    const deviceId = remoteSupport.deviceId;
    const supportUrl = buildMeshCentralDeviceUrl(baseUrl, deviceId, MESH_CENTRAL_VIEW_MODES.support) || remoteSupport.supportUrl || "";
    const desktopUrl = buildMeshCentralDeviceUrl(baseUrl, deviceId, MESH_CENTRAL_VIEW_MODES.desktop) || remoteSupport.desktopUrl || "";
    const terminalUrl = buildMeshCentralDeviceUrl(baseUrl, deviceId, MESH_CENTRAL_VIEW_MODES.terminal) || remoteSupport.terminalUrl || "";

    return [
      supportUrl
        ? { label: "Abrir soporte", url: supportUrl, kind: "primary", viewMode: MESH_CENTRAL_VIEW_MODES.support }
        : null,
      desktopUrl
        ? { label: "Ver pantalla", url: desktopUrl, kind: "desktop", viewMode: MESH_CENTRAL_VIEW_MODES.desktop }
        : null,
      terminalUrl
        ? { label: "Terminal", url: terminalUrl, kind: "terminal", viewMode: MESH_CENTRAL_VIEW_MODES.terminal }
        : null,
    ].filter(Boolean) as RemoteSupportLink[];
  }

  return remoteSupport.supportUrl
    ? [{ label: "Abrir soporte", url: remoteSupport.supportUrl, kind: "primary", viewMode: MESH_CENTRAL_VIEW_MODES.support }]
    : [];
};

export const getRemoteSupportProviderLabel = (
  provider?: RemoteSupportProvider,
) => {
  if (provider === "MESHCENTRAL") return "MeshCentral";
  return "Soporte remoto";
};
