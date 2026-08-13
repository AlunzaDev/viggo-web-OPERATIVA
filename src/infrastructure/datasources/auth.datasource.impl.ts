import { isAxiosError } from "axios";

import type {
  AuthDataSource,
  AuthSession,
  ChangePasswordParams,
  ForgotPasswordParams,
  LoginParams,
  ResendValidationEmailParams,
  ResetPasswordParams,
} from "../../domain/datasources/auth.datasource";

import {
  authUserFromObject,
  type AuthUserEntity,
} from "../../domain/entities/auth-user.entity";
import {
  hasWebOperativeAccess,
  USER_APPS,
} from "../../domain/entities/user-app-access";

import { api } from "../http/axios.instance";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapAuthPayload = (data: unknown): Record<string, unknown> => {
  if (!isRecord(data)) return {};

  const nestedCandidates = [data.data, data.result, data.payload, data];

  const payload = nestedCandidates.find(
    (candidate): candidate is Record<string, unknown> =>
      isRecord(candidate) &&
      ("token" in candidate ||
        "accessToken" in candidate ||
        "access_token" in candidate ||
        "jwt" in candidate ||
        "jwtToken" in candidate),
  );

  return payload ?? data;
};

const getTokenFromResponse = (data: Record<string, unknown>): string => {
  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    data.jwtToken,
  ];

  const token = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
  );

  if (typeof token !== "string") {
    throw new Error("La respuesta de autenticación no incluyó un token válido");
  }

  return token.trim();
};

const hasUserIdentity = (value: Record<string, unknown>): boolean => {
  const id = value.uid ?? value.id ?? value._id;
  const email = value.email ?? value.correo;

  return (
    (typeof id === "string" && id.trim().length > 0) ||
    (typeof email === "string" && email.trim().length > 0)
  );
};

const getUserFromResponse = (data: Record<string, unknown>) => {
  const candidates = [data.user, data.usuario, data.authUser, data.profile];

  const userRecord =
    candidates.find(isRecord) ?? (hasUserIdentity(data) ? data : null);

  if (!userRecord) {
    throw new Error(
      "La respuesta de autenticación no incluyó un usuario válido",
    );
  }

  const user = authUserFromObject(userRecord);

  if (!hasWebOperativeAccess(user.allowedApps)) {
    throw new Error("El usuario no tiene acceso al Web Operativo");
  }

  return user;
};

const getMessageFromResponse = (
  data: Record<string, unknown>,
  fallback: string,
): string => {
  const candidates = [data.message, data.msg, data.detail];

  const message = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
  );

  return typeof message === "string" ? message : fallback;
};

const formatRetryAfterMessage = (retryAfter: unknown): string | null => {
  const seconds =
    typeof retryAfter === "string" && retryAfter.trim().length > 0
      ? Number(retryAfter)
      : typeof retryAfter === "number"
        ? retryAfter
        : null;

  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const minutes = Math.ceil(seconds / 60);

  return `Demasiados intentos. Intenta de nuevo en ${minutes} min.`;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const retryAfterMessage =
    isAxiosError(error) && error.response?.status === 429
      ? formatRetryAfterMessage(error.response.headers?.["retry-after"])
      : null;

  if (retryAfterMessage) {
    return retryAfterMessage;
  }

  const errorData =
    isAxiosError(error) && isRecord(error.response?.data)
      ? error.response.data
      : null;

  return (
    (typeof errorData?.message === "string" && errorData.message) ||
    (typeof errorData?.error === "string" && errorData.error) ||
    (error instanceof Error && error.message.trim().length > 0
      ? error.message
      : null) ||
    fallback
  );
};

export class AuthDataSourceImpl implements AuthDataSource {
  async login({ email, password }: LoginParams): Promise<AuthSession> {
    try {
      const { data } = await api.post(
        "/api/auth/login-correo",
        {
          correo: email.trim().toLowerCase(),
          password,
          app: USER_APPS.OPERATIVE_WEB,
        },
        {
          skipSessionExpiredHandling: true,
        },
      );

      const payload = unwrapAuthPayload(data);

      return {
        token: getTokenFromResponse(payload),
        user: getUserFromResponse(payload),
      };
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "No se pudo iniciar sesión"));
    }
  }

  async getSession(): Promise<AuthUserEntity | null> {
    return null;
  }

  async logout(): Promise<void> {
    return Promise.resolve();
  }

  async updateBarrierBlasterHighScore(score: number): Promise<number> {
    const { data } = await api.patch(
      "/api/auth/me/barrier-blaster-high-score",
      { score },
    );

    if (!isRecord(data)) {
      throw new Error("El servidor no devolvio el record actualizado");
    }

    const highScore = data.barrierBlasterHighScore;
    if (typeof highScore !== "number" || !Number.isFinite(highScore)) {
      throw new Error("El servidor no devolvio un record valido");
    }

    return Math.max(0, Math.floor(highScore));
  }

  async forgotPassword({ email }: ForgotPasswordParams): Promise<string> {
    try {
      const { data } = await api.post("/api/auth/forgot-password", {
        correo: email.trim().toLowerCase(),
      });

      const payload = unwrapAuthPayload(data);

      return getMessageFromResponse(
        payload,
        "Si el correo existe, se envió un enlace de recuperación.",
      );
    } catch (error: unknown) {
      throw new Error(
        getErrorMessage(error, "No se pudo procesar la solicitud"),
      );
    }
  }

  async resendValidationEmail({
    email,
  }: ResendValidationEmailParams): Promise<string> {
    try {
      const { data } = await api.post("/api/auth/resend-validation-email", {
        correo: email.trim().toLowerCase(),
      });

      const payload = unwrapAuthPayload(data);

      return getMessageFromResponse(
        payload,
        "Si el correo existe y sigue pendiente, se reenviará el enlace de validación.",
      );
    } catch (error: unknown) {
      throw new Error(
        getErrorMessage(error, "No se pudo reenviar la validación"),
      );
    }
  }

  async resetPassword({
    token,
    newPassword,
  }: ResetPasswordParams): Promise<string> {
    try {
      const { data } = await api.post("/api/auth/reset-password", {
        token,
        newPassword,
      });

      const payload = unwrapAuthPayload(data);

      return getMessageFromResponse(
        payload,
        "La contraseña se actualizó correctamente.",
      );
    } catch (error: unknown) {
      throw new Error(
        getErrorMessage(error, "No se pudo restablecer la contraseña"),
      );
    }
  }

  async changePassword({
    currentPassword,
    newPassword,
  }: ChangePasswordParams): Promise<string> {
    void currentPassword;
    void newPassword;

    throw new Error(
      "El backend actual no expone cambio de contraseña autenticado.",
    );
  }
}
