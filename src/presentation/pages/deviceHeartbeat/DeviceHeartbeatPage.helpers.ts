import type { ModuleDeviceRuntime, ModuleEntity, ModuleType } from "../../../domain/entities/module.entity";

export type DeviceHeartbeatStatus = "online" | "offline" | "pending";
export type DeviceHeartbeatFilter = "all" | DeviceHeartbeatStatus;

const HEARTBEAT_STALE_MS = 45_000;

export const getModuleTypeLabel = (type: ModuleType) => {
  if (type === "ENTRADA") return "Entrada";
  if (type === "SALIDA") return "Salida";
  return "POS";
};

export const formatDateTime = (value?: Date | null) => {
  if (!value || value.getTime() <= 0) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export const getHeartbeatAgeLabel = (value?: Date | null) => {
  if (!value || value.getTime() <= 0) return "Sin heartbeat";

  const elapsedMs = Math.max(0, Date.now() - value.getTime());
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  if (elapsedSeconds < 60) return `Hace ${elapsedSeconds}s`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes}min`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Hace ${elapsedHours}h`;
};

export const resolveDeviceStatus = (runtime: ModuleDeviceRuntime | null): DeviceHeartbeatStatus => {
  if (!runtime) return "pending";

  const lastHeartbeatAt = runtime.lastHeartbeatAt?.getTime() ?? 0;
  const heartbeatIsFresh = lastHeartbeatAt > 0 && Date.now() - lastHeartbeatAt <= HEARTBEAT_STALE_MS;

  if (runtime.isConnected && runtime.isAuthorized && heartbeatIsFresh) return "online";
  if (runtime.connectionStatus === "PENDING") return "pending";
  return "offline";
};

export const getStatusLabel = (status: DeviceHeartbeatStatus) => {
  if (status === "online") return "Online";
  if (status === "offline") return "Offline";
  return "Esperando";
};

export const getStatusHint = (module: ModuleEntity) => {
  const runtime = module.deviceRuntime;
  if (!runtime) return "Sin runtime reportado";
  if (!runtime.isAuthorized) return "Dispositivo no autorizado";
  if (!runtime.isConnected) return "Sin conexion activa";
  return runtime.message || "Heartbeat recibido correctamente";
};

export const getBindingLabel = (module: ModuleEntity) => {
  if (module.bindingStatus === "BOUND") return "Vinculado";
  if (module.bindingStatus === "PENDING") return "Pendiente de aprobar";
  return "Sin vincular";
};

export const buildHeartbeatStats = (modules: ModuleEntity[]) => {
  const online = modules.filter((module) => resolveDeviceStatus(module.deviceRuntime) === "online").length;
  const offline = modules.filter((module) => resolveDeviceStatus(module.deviceRuntime) === "offline").length;
  const pending = modules.filter((module) => resolveDeviceStatus(module.deviceRuntime) === "pending").length;
  const submodules = modules.reduce((total, module) => total + module.submodulos.length, 0);

  return {
    total: modules.length,
    online,
    offline,
    pending,
    submodules,
  };
};
