import { describe, expect, it } from "vitest";
import {
  getConfigSyncStatusLabel,
  normalizeConfigSyncError,
} from "./config-status.presenter";

describe("config-status.presenter", () => {
  it("maps sync statuses to user labels", () => {
    expect(getConfigSyncStatusLabel("success")).toBe("Correcto");
    expect(getConfigSyncStatusLabel("success_with_warnings")).toBe("Con alertas");
    expect(getConfigSyncStatusLabel("failed")).toBe("Fallido");
    expect(getConfigSyncStatusLabel(null)).toBe("Sin registro");
  });

  it("normalizes backend and cloud sync errors for load and sync flows", () => {
    expect(normalizeConfigSyncError("Network Error", "load")).toContain(
      "avisa a soporte",
    );
    expect(
      normalizeConfigSyncError("La nube no esta disponible", "sync"),
    ).toContain("no se puede sincronizar con el panel administrativo");
    expect(
      normalizeConfigSyncError(
        "La instalacion local aun no esta vinculada a un proyecto",
        "sync",
      ),
    ).toContain("todavía no está vinculado a un proyecto");
  });

  it("normalizes validation and integrity issues", () => {
    expect(
      normalizeConfigSyncError("La sincronizacion dejo inconsistencias locales", "sync"),
    ).toContain("no coinciden");
    expect(
      normalizeConfigSyncError(
        "Validation failed: coordinates: coordinates debe contener [lon,lat]",
        "sync",
      ),
    ).toContain("ubicación");
    expect(
      normalizeConfigSyncError("Hay datos inválidos en la solicitud", "sync"),
    ).toContain("no son válidos");
  });
});
