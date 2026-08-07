import { describe, expect, it } from "vitest";
import type { LocalInstallation } from "./installation.api";
import {
  LOCATION_FETCH_FAILED_ERROR,
  LOCATION_PERMISSION_DENIED_ERROR,
  getInstallationBackendMessage,
  getInstallationGateMode,
  getInstallationIdLabel,
  getInstallationProjectsPlaceholder,
  getInstallationStatusCopy,
  getInstallationWaitingBadgeLabel,
  getInstallationWaitingMeta,
  isBackendUnavailableMessage,
  isInstallationWaitingApproval,
  normalizeInstallationError,
  shouldRedirectToSessionExpired,
} from "./installation-gate.service";

const buildInstallation = (
  overrides: Partial<LocalInstallation> = {},
): LocalInstallation => ({
  configured: false,
  installationId: "viggo-local-123",
  status: "pending",
  source: "manual",
  proyectoId: null,
  proyectoNombre: null,
  proyectoIdentificador: null,
  cloudRequestId: null,
  reviewNote: null,
  requestedAt: null,
  reviewedAt: null,
  assignedByUserId: null,
  assignedAt: null,
  updatedAt: null,
  ...overrides,
});

describe("installation-gate.service", () => {
  it("detects backend unavailable messages consistently", () => {
    expect(isBackendUnavailableMessage("Network Error")).toBe(true);
    expect(isBackendUnavailableMessage("backend no disponible")).toBe(true);
    expect(isBackendUnavailableMessage("fetch failed")).toBe(true);
    expect(isBackendUnavailableMessage("otro error")).toBe(false);
  });

  it("detects auth/session expiration messages", () => {
    expect(shouldRedirectToSessionExpired("User not found or inactive")).toBe(true);
    expect(shouldRedirectToSessionExpired("jwt expired")).toBe(true);
    expect(shouldRedirectToSessionExpired("algo diferente")).toBe(false);
  });

  it("resolves waiting approval statuses", () => {
    expect(isInstallationWaitingApproval(buildInstallation({ status: "requested" }))).toBe(true);
    expect(isInstallationWaitingApproval(buildInstallation({ status: "approved" }))).toBe(true);
    expect(isInstallationWaitingApproval(buildInstallation({ status: "pending" }))).toBe(false);
    expect(isInstallationWaitingApproval(null)).toBe(false);
  });

  it("builds gate mode from backend and installation status", () => {
    expect(getInstallationGateMode(null, true)).toBe("backendUnavailable");
    expect(
      getInstallationGateMode(buildInstallation({ status: "requested" }), false),
    ).toBe("waitingApproval");
    expect(getInstallationGateMode(buildInstallation({ status: "pending" }), false)).toBe("ready");
  });

  it("returns consistent installation copy and waiting meta", () => {
    expect(getInstallationStatusCopy(null)).toContain("Selecciona el proyecto");
    expect(getInstallationStatusCopy(buildInstallation({ status: "requested" }))).toContain(
      "Solicitud enviada",
    );
    expect(getInstallationStatusCopy(buildInstallation({ status: "approved" }))).toContain(
      "Solicitud aprobada",
    );

    expect(
      getInstallationWaitingMeta(buildInstallation({ status: "requested" })).title,
    ).toBe("Solicitud enviada correctamente");
    expect(
      getInstallationWaitingMeta(buildInstallation({ status: "approved" })).title,
    ).toBe("Aprobacion recibida");
    expect(
      getInstallationWaitingBadgeLabel(buildInstallation({ status: "approved" })),
    ).toBe("Aprobado");
  });

  it("returns unified labels for id, backend message and project placeholder", () => {
    expect(getInstallationIdLabel(buildInstallation(), false)).toBe("viggo-local-123");
    expect(getInstallationIdLabel(null, true)).toBe("API local sin iniciar");
    expect(getInstallationIdLabel(null, false)).toBe("sin identificar");

    expect(getInstallationBackendMessage(true)).toContain("backend local no esta disponible");
    expect(getInstallationBackendMessage(false)).toBeNull();

    expect(
      getInstallationProjectsPlaceholder({ backendUnavailable: true, projectsCount: 0 }),
    ).toBe("Backend local no disponible");
    expect(
      getInstallationProjectsPlaceholder({ backendUnavailable: false, projectsCount: 0 }),
    ).toBe("No hay proyectos disponibles en nube");
    expect(
      getInstallationProjectsPlaceholder({ backendUnavailable: false, projectsCount: 2 }),
    ).toBe("Selecciona un proyecto");
  });

  it("normalizes installation and geolocation errors for the user", () => {
    expect(
      normalizeInstallationError("La nube no esta disponible para consultar proyectos").title,
    ).toBe("No pudimos conectar con la nube");
    expect(
      normalizeInstallationError("La nube no esta disponible para solicitar la vinculacion").title,
    ).toBe("No pudimos enviar la solicitud");
    expect(normalizeInstallationError("Selecciona un proyecto").title).toBe(
      "Selecciona un proyecto",
    );
    expect(normalizeInstallationError(LOCATION_PERMISSION_DENIED_ERROR).title).toBe(
      "Permite la ubicacion",
    );
    expect(normalizeInstallationError(LOCATION_FETCH_FAILED_ERROR).title).toBe(
      "No pudimos validar tu ubicacion",
    );
    expect(normalizeInstallationError("Network Error").title).toBe(
      "El backend local no esta disponible",
    );
  });
});
