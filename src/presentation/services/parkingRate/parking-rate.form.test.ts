import { describe, expect, it } from "vitest";
import { DEFAULT_RATE_FORM, formToRules, rulesToForm, toMinutes } from "./parking-rate.form";

describe("parking-rate.form", () => {
  it("turns the form into rules, an empty cap meaning none", () => {
    expect(formToRules(DEFAULT_RATE_FORM)).toEqual({ rules: {
      toleranceMinutes: 15, firstBlockMinutes: 60, firstBlockPrice: 20, fractionMinutes: 15, fractionPrice: 5, dailyMax: 150,
    } });
    expect(formToRules({ ...DEFAULT_RATE_FORM, dailyMax: " ", fractionPrice: "7,50" })).toMatchObject({ rules: { dailyMax: null, fractionPrice: 7.5 } });
  });

  it("explains what is wrong", () => {
    expect(formToRules({ ...DEFAULT_RATE_FORM, toleranceMinutes: "60" })).toEqual({ error: "La tolerancia debe ser menor que el primer bloque" });
    expect(formToRules({ ...DEFAULT_RATE_FORM, fractionMinutes: "0" })).toMatchObject({ error: expect.stringContaining("fracción") });
    expect(formToRules({ ...DEFAULT_RATE_FORM, fractionPrice: "5.555" })).toMatchObject({ error: expect.stringContaining("2 decimales") });
    expect(formToRules({ ...DEFAULT_RATE_FORM, dailyMax: "10" })).toMatchObject({ error: expect.stringContaining("tope") });
    expect(formToRules({ ...DEFAULT_RATE_FORM, firstBlockPrice: "0" })).toMatchObject({ error: expect.stringContaining("$0") });
    expect(formToRules({ ...DEFAULT_RATE_FORM, firstBlockMinutes: "una hora" })).toMatchObject({ error: expect.stringContaining("minutos") });
  });

  it("round-trips a saved rate and reads the calculator's duration", () => {
    const rules = { toleranceMinutes: 10, firstBlockMinutes: 30, firstBlockPrice: 12.5, fractionMinutes: 10, fractionPrice: 3, dailyMax: null };
    expect(formToRules(rulesToForm(rules))).toEqual({ rules });
    expect(toMinutes("2", "30")).toBe(150);
    expect(toMinutes("", "45")).toBe(45);
    expect(toMinutes("1.5", "0")).toBeNull();
  });
});
