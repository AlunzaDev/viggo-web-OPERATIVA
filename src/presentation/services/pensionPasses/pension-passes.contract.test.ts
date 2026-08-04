import { describe, expect, it } from "vitest";
import {
  buildPensionPassForm,
  buildPensionPassPayload,
  createInitialPensionPassForm,
  normalizePensionPassCollection,
  normalizePensionPassRecord,
} from "./pension-passes.contract";

describe("pension-passes.contract", () => {
  it("normalizes pass records and collections", () => {
    const record = normalizePensionPassRecord({
      _id: "pp-1",
      name: "Juan",
      pension: "p-1",
      idPass: "ABC",
      vigent: true,
    });

    expect(record).toMatchObject({
      id: "pp-1",
      name: "Juan",
      pension: "p-1",
      idPass: "ABC",
      vigent: true,
    });

    const items = normalizePensionPassCollection({
      pensionPasses: [{ _id: "pp-2", name: "Maria" }],
    });
    expect(items[0]?.id).toBe("pp-2");
  });

  it("builds pass form and payload", () => {
    const baseForm = createInitialPensionPassForm();
    expect(baseForm.estado).toBe(true);

    const form = buildPensionPassForm({
      id: "pp-1",
      name: " Pase 1 ",
      pension: "p-1",
      idPass: " CARD-1 ",
      vigent: true,
      antiPassback: false,
      inParking: false,
      created: 10,
      from: -1,
      to: -1,
      estado: true,
      usuario: "u-1",
    });

    const payload = buildPensionPassPayload(form);
    expect(payload).toMatchObject({
      name: "Pase 1",
      pension: "p-1",
      idPass: "CARD-1",
      usuario: "u-1",
    });
  });
});
