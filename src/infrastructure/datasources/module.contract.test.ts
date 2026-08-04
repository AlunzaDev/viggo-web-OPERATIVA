import { describe, expect, it } from "vitest";
import { normalizeModuleCollection, normalizeModulePage, normalizeModuleRecord } from "./module.contract";

describe("module.contract", () => {
  it("normalizes module record and collections", () => {
    const record = normalizeModuleRecord({ modulo: { _id: "m1", nombre: "Entrada 1" } });
    const collection = normalizeModuleCollection({ modulos: [{ _id: "m2", nombre: "Salida 1" }] });

    expect(record.nombre).toBe("Entrada 1");
    expect(collection[0]?.nombre).toBe("Salida 1");
  });

  it("normalizes paginated module responses", () => {
    const page = normalizeModulePage({
      modulos: [{ _id: "m3", nombre: "Caja 1" }],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });

    expect(page.items).toHaveLength(1);
    expect(page.page).toBe(2);
    expect(page.totalPages).toBe(2);
  });
});
