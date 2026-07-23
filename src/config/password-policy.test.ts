import { describe, expect, it } from "vitest";
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from "./password-policy";

describe("password policy", () => {
  it("accepts passwords with at least 8 chars, uppercase, lowercase and number", () => {
    expect(PASSWORD_POLICY_REGEX.test("Sikkounter1")).toBe(true);
    expect(PASSWORD_POLICY_REGEX.test("Mexico2026")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(PASSWORD_POLICY_REGEX.test("short1A")).toBe(false);
    expect(PASSWORD_POLICY_REGEX.test("sinmayuscula1")).toBe(false);
    expect(PASSWORD_POLICY_REGEX.test("SINMINUSCULA1")).toBe(false);
    expect(PASSWORD_POLICY_REGEX.test("SinNumeros")).toBe(false);
  });

  it("keeps a user-facing Spanish validation message", () => {
    expect(PASSWORD_POLICY_MESSAGE).toContain("contraseña");
    expect(PASSWORD_POLICY_MESSAGE).toContain("mayúscula");
    expect(PASSWORD_POLICY_MESSAGE).toContain("minúscula");
    expect(PASSWORD_POLICY_MESSAGE).toContain("número");
  });
});
