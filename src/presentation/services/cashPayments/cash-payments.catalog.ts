import { api } from "../../../infrastructure/http/axios.instance";
import { extractNamedCollection } from "../../../infrastructure/http/api-contracts";
import type {
  CashierOption,
  NamedOption,
} from "../../types/cashPayments/cash-payments.types";
import {
  asRecord,
  CASHIER_STORAGE_KEY,
  getProjectId,
  getText,
} from "../../utils/cashPayments/cash-payments.formatters";

export type CashPaymentsCatalog = {
  cashiers: CashierOption[];
  projects: NamedOption[];
};

export const loadCashPaymentsCatalog = async (): Promise<CashPaymentsCatalog> => {
  const [modulesResponse, projectsResponse] = await Promise.all([
    api.get<{ modulos?: unknown[] } | unknown[]>("/api/modulos", {
      params: { tipo: "POS", estado: true },
    }),
    api.get<{ proyectos?: unknown[] } | unknown[]>("/api/proyectos"),
  ]);

  const modules = extractNamedCollection(modulesResponse.data, "modulos");

  const cashiers = modules
    .map((item) => {
      const moduleItem = asRecord(item);
      return {
        id: getText(moduleItem.id),
        nombre: getText(moduleItem.nombre),
        identificador: getText(moduleItem.identificador),
        proyecto: getProjectId(moduleItem.proyecto),
      } satisfies CashierOption;
    })
    .filter(
      (cashier) =>
        cashier.id.trim().length > 0 && cashier.identificador.trim().length > 0,
    );

  const projectsRaw = extractNamedCollection(projectsResponse.data, "proyectos");

  const projects = projectsRaw
    .map((item) => {
      const projectItem = asRecord(item);
      return {
        id: getText(projectItem.id ?? projectItem._id).trim(),
        nombre: getText(projectItem.nombre ?? projectItem.name).trim(),
      } satisfies NamedOption;
    })
    .filter((project) => project.id && project.nombre);

  return { cashiers, projects };
};

export const getInitialCashierId = (
  currentCashierId: string,
  cashiers: CashierOption[],
) => {
  const storedCashierId =
    typeof window !== "undefined"
      ? window.localStorage.getItem(CASHIER_STORAGE_KEY)?.trim() ?? ""
      : "";

  if (currentCashierId && cashiers.some((cashier) => cashier.id === currentCashierId)) {
    return currentCashierId;
  }

  if (storedCashierId && cashiers.some((cashier) => cashier.id === storedCashierId)) {
    return storedCashierId;
  }

  return cashiers[0]?.id ?? "";
};
