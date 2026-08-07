import type { AuthUserEntity } from "../../domain/entities/auth-user.entity";

import {
  hasModuleAccess,
  type AppModuleAccess,
} from "../../domain/entities/module-access";

const MODULE_DEFAULT_PATH: Record<AppModuleAccess, string> = {
  cashPayments: "/caja/cobro",
  modules: "/modulos",
  pensions: "/pensiones",
  pensionPasses: "/pension-pass",
  tickets: "/tickets",
  pensionMoves: "/movimientos",
  payments: "/pagos",
};

const MODULE_PRIORITY: AppModuleAccess[] = [
  "cashPayments",
  "tickets",
  "payments",
  "pensions",
  "pensionPasses",
  "pensionMoves",
  "modules",
];

export const getModuleRoute = (module: AppModuleAccess): string =>
  MODULE_DEFAULT_PATH[module];

export const getDefaultAuthorizedPath = (
  user: AuthUserEntity | null | undefined,
): string => {
  if (!user) {
    return "/login";
  }

  const allowedModule = MODULE_PRIORITY.find((module) =>
    hasModuleAccess(user.modules, module),
  );

  if (!allowedModule) {
    return "/account";
  }

  return getModuleRoute(allowedModule);
};
