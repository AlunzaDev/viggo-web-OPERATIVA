import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authRepository, loginUseCase, markSessionToken } from "../../../application/dependencies/auth.dependencies";
import {
  authUserFromObject,
  type AuthUserEntity,
} from "../../../domain/entities/auth-user.entity";
import { hasWebOperativeAccess } from "../../../domain/entities/user-app-access";
import { AuthContext } from "./AuthContext";
import type { LoginPayload } from "./auth.types";

const AUTH_TOKEN_STORAGE_KEY = "viggo.auth.token";
const AUTH_USER_STORAGE_KEY = "viggo.auth.user";
const SESSION_EXPIRED_EVENT = "sikk:session-expired";
const isValidWebOperativeUser = (user: AuthUserEntity): boolean => {
  return (
    user.id.length > 0 && user.active && hasWebOperativeAccess(user.allowedApps)
  );
};

const readStoredUser = (): AuthUserEntity | null => {
  const storedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const user = authUserFromObject(parsed as Record<string, unknown>);

    return isValidWebOperativeUser(user) ? user : null;
  } catch {
    return null;
  }
};

const storeSession = (token: string, nextUser: AuthUserEntity): void => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
};

const clearStoredSession = (): void => {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUserEntity | null>(null);

  const [loading, setLoading] = useState(true);

  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    const storedUser = readStoredUser();

    if (storedToken && storedUser) {
      markSessionToken(storedToken);
      setToken(storedToken);
      setUser(storedUser);
    } else {
      clearStoredSession();
      markSessionToken(null);
      setToken(null);
      setUser(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoredSession();
      markSessionToken(null);
      setToken(null);
      setUser(null);
      setSessionExpired(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginPayload) => {
    setSessionExpired(false);

    const session = await loginUseCase.execute({
      email,
      password,
    });

    if (!isValidWebOperativeUser(session.user)) {
      clearStoredSession();
      markSessionToken(null);

      throw new Error("El usuario no tiene acceso al Web Operativo");
    }

    storeSession(session.token, session.user);

    markSessionToken(session.token);
    setToken(session.token);
    setUser(session.user);

    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authRepository.logout();
    } finally {
      clearStoredSession();
      markSessionToken(null);
      setToken(null);
      setUser(null);
      setSessionExpired(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      sessionExpired,
      login,
      logout,
    }),
    [token, user, loading, sessionExpired, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
