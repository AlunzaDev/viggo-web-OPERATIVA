import { describe, expect, it } from "vitest";
import {
  buildInstallationRequestPayload,
  normalizeInstallationCloudProjects,
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

  it("normalizes cloud projects collection", () => {
    const projects = normalizeInstallationCloudProjects({
      proyectos: [
        { _id: "1", nombre: "AKIA", identificador: "AKIA1" },
        { id: "2", nombre: "MORELIA", identificador: "MOR1" },
        { nombre: "" },
      ],
    });

    expect(projects).toHaveLength(2);
    expect(projects[0]).toEqual({ id: "1", nombre: "AKIA", identificador: "AKIA1" });
    expect(projects[1]?.id).toBe("2");
  });

  it("builds request payload with browser location", () => {
    const payload = buildInstallationRequestPayload("project-1", "token-1", {
      coordinates: [-101.1, 19.7],
      accuracy: 12,
      capturedAt: 999,
    });

    expect(payload).toEqual({
      proyectoId: "project-1",
      installationLinkToken: "token-1",
      browserCoordinates: [-101.1, 19.7],
      browserLocationAccuracy: 12,
      browserLocationCapturedAt: 999,
    });
  });

  it("builds request payload without browser location", () => {
    const payload = buildInstallationRequestPayload("project-1", "token-1");

    expect(payload).toEqual({
      proyectoId: "project-1",
      installationLinkToken: "token-1",
      browserCoordinates: undefined,
      browserLocationAccuracy: undefined,
      browserLocationCapturedAt: undefined,
    });
  });
});
