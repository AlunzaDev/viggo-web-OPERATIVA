import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { api } from "../http/axios.instance";
import { AuthDataSourceImpl } from "./auth.datasource.impl";

vi.mock("../http/axios.instance", () => ({
  api: {
    post: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  post: Mock;
};

const datasource = new AuthDataSourceImpl();

describe("AuthDataSourceImpl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts Web Operative login credentials and normalizes the auth session", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        token: "jwt-token",
        usuario: {
          id: "user-1",
          nombre: "Admin",
          apellido: "Viggo",
          correo: "admin@viggo.com",
          rol: "SUPER_ROLE",
          estado: true,
          parkings: [],
          modules: [
            "users",
            "projects",
            "modules",
            "pensions",
            "pensionPasses",
          ],
          permissionProfileId: "profile-operative",
          allowedApps: ["OPERATIVE_WEB"],
        },
      },
    });

    const session = await datasource.login({
      email: "admin@viggo.com",
      password: "Password1",
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/api/auth/login-correo",
      {
        correo: "admin@viggo.com",
        password: "Password1",
        app: "OPERATIVE_WEB",
      },
      {
        skipSessionExpiredHandling: true,
      },
    );

    expect(session).toEqual({
      token: "jwt-token",
      user: {
        id: "user-1",
        name: "Admin Viggo",
        email: "admin@viggo.com",
        role: "superRole",
        active: true,
        parkings: [],
        modules: ["modules", "pensions", "pensionPasses"],
        permissionProfileId: "profile-operative",
        allowedApps: ["OPERATIVE_WEB"],
      },
    });
  });

  it("normalizes wrapped backend auth payloads", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        data: {
          token: "wrapped-jwt-token",
          usuario: {
            _id: "user-2",
            nombre: "Admin",
            apellido: "Operaciones",
            correo: "ops@viggo.com",
            rol: "ADMIN_ROLE",
            estado: "false",
            parkings: ["parking-1"],
            modules: ["projects", "pensions"],
            permissionProfileId: "profile-operative-2",
            allowedApps: ["OPERATIVE_WEB"],
          },
        },
      },
    });

    const session = await datasource.login({
      email: "ops@viggo.com",
      password: "Password1",
    });

    expect(session).toEqual({
      token: "wrapped-jwt-token",
      user: {
        id: "user-2",
        name: "Admin Operaciones",
        email: "ops@viggo.com",
        role: "adminRole",
        active: false,
        parkings: ["parking-1"],
        modules: ["pensions"],
        permissionProfileId: "profile-operative-2",
        allowedApps: ["OPERATIVE_WEB"],
      },
    });
  });

  it("normalizes missing modules as an empty array", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        token: "restricted-jwt-token",
        usuario: {
          id: "user-3",
          nombre: "Usuario",
          apellido: "Restringido",
          correo: "restricted@viggo.com",
          rol: "CLIENT_ROLE",
          estado: true,
          allowedApps: ["OPERATIVE_WEB"],
        },
      },
    });

    const session = await datasource.login({
      email: "restricted@viggo.com",
      password: "Password1",
    });

    expect(session.user.modules).toEqual([]);
    expect(session.user.parkings).toEqual([]);
    expect(session.user.allowedApps).toEqual(["OPERATIVE_WEB"]);
  });

  it("rejects users without access to the Web Operative application", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        token: "admin-only-token",
        usuario: {
          id: "user-4",
          nombre: "Usuario",
          apellido: "Administrativo",
          correo: "admin-only@viggo.com",
          rol: "ADMIN_ROLE",
          estado: true,
          modules: ["users"],
          allowedApps: ["ADMIN_WEB"],
        },
      },
    });

    await expect(
      datasource.login({
        email: "admin-only@viggo.com",
        password: "Password1",
      }),
    ).rejects.toThrow("El usuario no tiene acceso al Web Operativo");
  });

  it("rejects auth responses without a backend user payload", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        token: "jwt-token",
      },
    });

    await expect(
      datasource.login({
        email: "admin@viggo.com",
        password: "Password1",
      }),
    ).rejects.toThrow(
      "La respuesta de autenticación no incluyó un usuario válido",
    );
  });

  it("reports backend login rate limits with retry guidance", async () => {
    mockedApi.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 429,
        headers: {
          "retry-after": "300",
        },
        data: {
          error: "Demasiados intentos. Intenta de nuevo más tarde.",
        },
      },
    });

    await expect(
      datasource.login({
        email: "admin@viggo.com",
        password: "Password1",
      }),
    ).rejects.toThrow("Demasiados intentos. Intenta de nuevo en 5 min.");
  });

  it("posts reset password data and returns the backend message", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        message: "La contrasena se actualizo correctamente.",
      },
    });

    const message = await datasource.resetPassword({
      token: "valid-reset-token",
      newPassword: "Password1",
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/api/auth/reset-password", {
      token: "valid-reset-token",
      newPassword: "Password1",
    });

    expect(message).toBe("La contrasena se actualizo correctamente.");
  });

  it("reports that authenticated password change is not exposed by the backend", async () => {
    await expect(
      datasource.changePassword({
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1",
      }),
    ).rejects.toThrow(
      "El backend actual no expone cambio de contraseña autenticado.",
    );
  });
});
