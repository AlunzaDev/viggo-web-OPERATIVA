import {
  BINDING_STATUS_LABEL,
  resolveHeartbeatStatus,
  summarizeHeartbeat,
  type HeartbeatStatus,
} from "@alunzadev/viggo-contracts";
import type { HeartbeatStatusFilterValue } from "@alunzadev/viggo-ui";
import type { ModuleEntity } from "../../../domain/entities/module.entity";

// The heartbeat rule, its labels and the counts come from @alunzadev/viggo-contracts.
export type DeviceHeartbeatStatus = HeartbeatStatus;
export type DeviceHeartbeatFilter = HeartbeatStatusFilterValue;

export const formatDateTime = (value?: Date | null) => {
  if (!value || value.getTime() <= 0) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export const getStatusHint = (module: ModuleEntity) => {
  const runtime = module.deviceRuntime;
  if (!runtime) return "Sin runtime reportado";
  if (!runtime.isAuthorized) return "Dispositivo no autorizado";
  if (!runtime.isConnected) return "Sin conexión activa";
  return runtime.message || "Heartbeat recibido correctamente";
};

export const getBindingLabel = (module: ModuleEntity) => BINDING_STATUS_LABEL[module.bindingStatus];

/** The modules in each status, plus how many submodules they have. */
export const buildHeartbeatStats = (modules: ModuleEntity[]) => ({
  ...summarizeHeartbeat(modules.map((module) => resolveHeartbeatStatus(module.deviceRuntime))),
  submodules: modules.reduce((total, module) => total + module.submodulos.length, 0),
});
