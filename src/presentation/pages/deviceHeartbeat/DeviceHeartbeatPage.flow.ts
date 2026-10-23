import { type ParkingEntity } from "../../../domain/entities/parking.entity";
import {
  type ModuleEntity,
  type ModuleSubmodule,
} from "../../../domain/entities/module.entity";
import { loadHeartbeatWorkspaceSnapshot } from "../../services/heartbeat/heartbeat.service";
import type { LocalConfigStatus } from "../../services/config/config.api";
import {
  HEARTBEAT_STATUS_LABEL,
  MODULE_TYPE_LABEL,
  heartbeatAgeLabel,
  resolveHeartbeatStatus,
  submoduleTypeLabel,
} from "@alunzadev/viggo-contracts";
import {
  buildHeartbeatStats,
  type DeviceHeartbeatFilter,
  type DeviceHeartbeatStatus,
} from "./DeviceHeartbeatPage.helpers";
import {
  toHeartbeatMapAreaPoint,
  toHeartbeatMapLatLng,
} from "./device-heartbeat.map";

export type DeviceMapMarker = {
  key: string;
  moduleId: string;
  label: string;
  lat: number;
  lng: number;
  tone: DeviceHeartbeatStatus;
  meta: string;
  statusLabel: string;
  heartbeatLabel: string;
};

export type HeartbeatLoadResult = {
  linkedProject: ParkingEntity | null;
  modules: ModuleEntity[];
  selectedModuleId: string | null;
  detailModuleId: string | null;
  configStatus: LocalConfigStatus;
};

const buildSubdeviceStatus = (
  moduleStatus: DeviceHeartbeatStatus,
  submodule: ModuleSubmodule,
): DeviceHeartbeatStatus => {
  if (!submodule.estado) return "offline";
  return moduleStatus === "pending" ? "pending" : moduleStatus;
};

export const toValidAreaPoint = toHeartbeatMapAreaPoint;

export const loadHeartbeatPageData = async (current: {
  selectedModuleId: string | null;
  detailModuleId: string | null;
}): Promise<HeartbeatLoadResult> => {
  const snapshot = await loadHeartbeatWorkspaceSnapshot();
  const project = snapshot.linkedProject;
  const activeModules = snapshot.modules;

  return {
    linkedProject: project,
    modules: activeModules,
    configStatus: snapshot.configStatus,
    selectedModuleId:
      current.selectedModuleId &&
      activeModules.some((module) => module.id === current.selectedModuleId)
        ? current.selectedModuleId
        : activeModules[0]?.id ?? null,
    detailModuleId:
      current.detailModuleId &&
      activeModules.some((module) => module.id === current.detailModuleId)
        ? current.detailModuleId
        : null,
  };
};

export const getFilteredHeartbeatModules = (
  modules: ModuleEntity[],
  statusFilter: DeviceHeartbeatFilter,
) =>
  modules.filter((module) => {
    if (statusFilter === "all") return true;
    return resolveHeartbeatStatus(module.deviceRuntime) === statusFilter;
  });

export const getHeartbeatSelectedModule = (
  modules: ModuleEntity[],
  selectedModuleId: string | null,
) =>
  modules.find((module) => module.id === selectedModuleId) ?? modules[0] ?? null;

export const getHeartbeatDetailModule = (
  modules: ModuleEntity[],
  detailModuleId: string | null,
) => modules.find((module) => module.id === detailModuleId) ?? null;

export const getHeartbeatMapMarkers = (
  filteredModules: ModuleEntity[],
): DeviceMapMarker[] => {
  const items: DeviceMapMarker[] = [];

  filteredModules.forEach((module) => {
    const moduleStatus = resolveHeartbeatStatus(module.deviceRuntime);
    const modulePoint = toHeartbeatMapLatLng(module.coordinates);

    if (modulePoint) {
      items.push({
        key: module.id,
        moduleId: module.id,
        label: module.nombre,
        lat: modulePoint.latitude,
        lng: modulePoint.longitude,
        tone: moduleStatus,
        meta: `${module.identificador} · ${MODULE_TYPE_LABEL[module.tipo]}`,
        statusLabel: HEARTBEAT_STATUS_LABEL[moduleStatus],
        heartbeatLabel: heartbeatAgeLabel(module.deviceRuntime?.lastHeartbeatAt),
      });
    }

    module.submodulos.forEach((submodule) => {
      const submodulePoint = toHeartbeatMapLatLng(submodule.coordinates);
      if (!submodulePoint) return;
      const submoduleStatus = buildSubdeviceStatus(moduleStatus, submodule);

      items.push({
        key: `${module.id}-${submodule.submoduloId}`,
        moduleId: module.id,
        label: submodule.nombre,
        lat: submodulePoint.latitude,
        lng: submodulePoint.longitude,
        tone: submoduleStatus,
        meta: `${submoduleTypeLabel(submodule.tipo)} · ${module.nombre}`,
        statusLabel: HEARTBEAT_STATUS_LABEL[submoduleStatus],
        heartbeatLabel: heartbeatAgeLabel(module.deviceRuntime?.lastHeartbeatAt),
      });
    });
  });

  return items;
};

export const getHeartbeatStatsSummary = (modules: ModuleEntity[]) =>
  buildHeartbeatStats(modules);
