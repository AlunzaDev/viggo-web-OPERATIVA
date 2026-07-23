import {
  ModuleEntity,
  type ModuleDeviceRuntime,
  type ModuleDeviceBindingRequest,
} from "../../../domain/entities/module.entity";

export const formatDateTime = (value?: Date) => {
  if (!value || Number.isNaN(value.getTime()) || value.getTime() <= 0) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export const getBindingStatusLabel = (item: ModuleEntity) => {
  if (item.deviceRuntime?.isConnected && item.deviceRuntime.isAuthorized) {
    return "Conectado";
  }
  if (item.deviceBinding) return "Vinculado";
  if (item.latestPendingBindingRequest) return "Pendiente";
  return "Libre";
};

export const getBindingStatusClassName = (item: ModuleEntity) => {
  if (item.deviceRuntime?.isConnected && item.deviceRuntime.isAuthorized) {
    return "admin-crud-status admin-crud-status--active";
  }
  if (item.deviceBinding) return "admin-crud-status admin-crud-status--active";
  if (item.latestPendingBindingRequest) return "admin-crud-status admin-crud-status--pending";
  return "admin-crud-status admin-crud-status--free";
};

export const getRequestStatusClassName = (
  status?: ModuleDeviceBindingRequest["status"],
) => {
  if (status === "APPROVED") return "admin-crud-status admin-crud-status--active";
  if (status === "REJECTED") return "admin-crud-status admin-crud-status--inactive";
  return "admin-crud-status admin-crud-status--pending";
};

export const getRuntimeStatusClassName = (
  status?: ModuleDeviceRuntime["connectionStatus"],
) => {
  if (status === "CONNECTED") return "admin-crud-status admin-crud-status--active";
  if (status === "DISCONNECTED") return "admin-crud-status admin-crud-status--free";
  if (status === "MISMATCH" || status === "REJECTED") {
    return "admin-crud-status admin-crud-status--inactive";
  }
  return "admin-crud-status admin-crud-status--pending";
};

export const buildBindingSummary = (
  binding?: {
    fingerprint: string;
    cpuSerial?: string;
    machineId?: string;
    primaryMac?: string;
  } | null,
  options?: {
    maskFingerprint?: boolean;
  },
) => [
  {
    label: "Fingerprint",
    value: binding?.fingerprint
      ? options?.maskFingerprint
        ? formatFingerprintPreview(binding.fingerprint)
        : binding.fingerprint
      : "Sin dato",
  },
  { label: "CPU serial", value: binding?.cpuSerial || "Sin dato" },
  { label: "Machine ID", value: binding?.machineId || "Sin dato" },
  { label: "MAC", value: binding?.primaryMac || "Sin dato" },
];

export const formatFingerprintPreview = (fingerprint?: string) => {
  const value = String(fingerprint ?? "").trim();
  if (!value) return "Sin fingerprint";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
};
