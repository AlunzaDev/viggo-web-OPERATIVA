export type AppUserRole = "superRole" | "adminRole" | "monitRole";

const ROLE_ALIASES: Record<string, AppUserRole> = {
  superrole: "superRole",
  super_role: "superRole",
  superadmin: "superRole",
  superadministrador: "superRole",
  adminrole: "adminRole",
  admin_role: "adminRole",
  admin: "adminRole",
  administrador: "adminRole",
  monitrole: "monitRole",
  monitor: "monitRole",
  pension_role: "monitRole",
  client_role: "monitRole",
};

export const normalizeUserRole = (value: unknown): AppUserRole => {
  if (typeof value !== "string") {
    return "monitRole";
  }

  const normalized = value.trim();

  if (normalized === "superRole" || normalized === "adminRole" || normalized === "monitRole") {
    return normalized;
  }

  return ROLE_ALIASES[normalized.toLowerCase()] ?? "monitRole";
};
