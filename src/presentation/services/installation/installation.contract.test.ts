import { describe, expect, it } from "vitest";
import {
  buildInstallationRequestPayload,
  normalizeInstallationLinkProject,
  normalizeLocalInstallation,
} from "./installation.contract";

describe("installation.contract", () => {
  it("normalizes local installation payloads", () => {
    const installation = normalizeLocalInstallation({
      installation: {
        configured: true,
        installationId: "viggo-local-1",
        status: "approved",
        source: "cloudApproval",
        proyectoId: "project-1",
        proyectoNombre: "AKIA",
        proyectoIdentificador: "AKIA1",
        requestedAt: "123",
      },
    });

    expect(installation.configured).toBe(true);
    expect(installation.installationId).toBe("viggo-local-1");
    expect(installation.status).toBe("approved");
    expect(installation.source).toBe("cloudApproval");
    expect(installation.proyectoNombre).toBe("AKIA");
    expect(installation.requestedAt).toBe(123);
  });

  it("normalizes the project a link token belongs to", () => {
    expect(
      normalizeInstallationLinkProject({
        proyecto: { id: "1", nombre: "AKIA", identificador: "AKIA1", codigoProyecto: "AK", ciudad: "GDL" },
      }),
    ).toEqual({ id: "1", nombre: "AKIA", identificador: "AKIA1", codigoProyecto: "AK", ciudad: "GDL" });
    expect(normalizeInstallationLinkProject({ proyecto: { _id: "2", nombre: "MORELIA" } })).toEqual({
      id: "2",
      nombre: "MORELIA",
      identificador: "",
      codigoProyecto: "",
      ciudad: "",
    });
    expect(normalizeInstallationLinkProject({ proyecto: null })).toBeNull();
    expect(normalizeInstallationLinkProject({ proyecto: { nombre: "" } })).toBeNull();
  });

  it("builds request payload with browser location", () => {
    const payload = buildInstallationRequestPayload("token-1", {
      coordinates: [-101.1, 19.7],
      accuracy: 12,
      capturedAt: 999,
    });

    expect(payload).toEqual({
      installationLinkToken: "token-1",
      browserCoordinates: [-101.1, 19.7],
      browserLocationAccuracy: 12,
      browserLocationCapturedAt: 999,
    });
  });

  it("builds request payload without browser location", () => {
    const payload = buildInstallationRequestPayload("token-1");

    expect(payload).toEqual({
      installationLinkToken: "token-1",
      browserCoordinates: undefined,
      browserLocationAccuracy: undefined,
      browserLocationCapturedAt: undefined,
    });
  });
});
