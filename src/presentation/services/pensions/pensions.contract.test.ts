import { describe, expect, it } from "vitest";
import {
  buildPensionForm,
  buildPensionPayload,
  cloneDefaultValidez,
  createInitialPensionForm,
  normalizePensionRecord,
  normalizePensionsPage,
} from "./pensions.contract";

describe("pensions.contract", () => {
  it("normalizes pension records and paginated responses", () => {
    const record = normalizePensionRecord({
      _id: "p1",
      proyecto: "proj-1",
      nombre: "Mensual",
      precio: "450",
      estado: false,
    });

    expect(record).toMatchObject({
      id: "p1",
      proyecto: "proj-1",
      nombre: "Mensual",
      precio: 450,
      estado: false,
    });

    const page = normalizePensionsPage(
      { pensiones: [{ _id: "p2", nombre: "Nocturna" }], total: 1 },
      1,
      10,
    );

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe("p2");
  });

  it("builds clean pension forms and payloads", () => {
    const form = createInitialPensionForm();
    expect(form.validez).toHaveLength(7);
    expect(cloneDefaultValidez()).toHaveLength(7);

    const editForm = buildPensionForm({
      id: "p1",
      proyecto: "proj-1",
      nombre: " Mensual ",
      validez: [],
      precio: 300,
      estado: true,
      descripcion: " Desc ",
    });

    const payload = buildPensionPayload(editForm);
    expect(payload).toMatchObject({
      proyecto: "proj-1",
      nombre: "Mensual",
      precio: 300,
      descripcion: "Desc",
      estado: true,
    });
  });
});
