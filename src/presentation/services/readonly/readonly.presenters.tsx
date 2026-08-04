import { CrudStatusBadge } from "../../components/shared/CrudStatusBadge";

export const renderReadonlyStatusBadge = (
  label: string,
  variant: "active" | "inactive" | "pending" | "error" | "free",
) => <CrudStatusBadge label={label} variant={variant} />;

export const renderReadonlyBooleanStatus = (
  value: boolean,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
) => renderReadonlyStatusBadge(value ? activeLabel : inactiveLabel, value ? "active" : "inactive");

export const resolveReadonlyTicketStatus = (item: {
  status?: string;
  horaSalida: number;
}) => {
  const normalized = String(item.status ?? "").trim().toUpperCase();
  if (normalized === "FRAUD") {
    return { label: "Boleto fraude", variant: "error" as const };
  }
  if (normalized === "COMPLETED" || item.horaSalida >= 0) {
    return { label: "Completado", variant: "active" as const };
  }
  return { label: "Activo", variant: "pending" as const };
};
