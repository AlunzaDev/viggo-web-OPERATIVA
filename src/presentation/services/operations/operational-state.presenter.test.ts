import { describe, expect, it } from "vitest";
import { isTechnicalMessage, normalizeOperationalUserMessage } from "./operational-state.presenter";

describe("operational-state.presenter", () => {
  it("never shows raw technical errors to the user", () => {
    expect(isTechnicalMessage("Request failed with status code 500")).toBe(true);
    expect(isTechnicalMessage("Cannot read properties of undefined")).toBe(true);
    expect(isTechnicalMessage("El turno ya está cerrado")).toBe(false);
    expect(isTechnicalMessage("Error al guardar el turno")).toBe(false);

    expect(normalizeOperationalUserMessage("Request failed with status code 500").message).toContain("avisa a soporte");
    expect(normalizeOperationalUserMessage("El turno ya está cerrado").message).toBe("El turno ya está cerrado");
  });

  it("explains a down system without technical words", () => {
    const result = normalizeOperationalUserMessage("Network Error");
    expect(result.title).toBe("Sin conexión con el sistema");
    expect(`${result.title} ${result.message}`).not.toMatch(/api|backend/i);
  });
});
