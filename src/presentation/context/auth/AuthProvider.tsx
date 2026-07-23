import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUserEntity } from "../../../domain/entities/auth-user.entity";
import { authUserFromObject } from "../../../domain/entities/auth-user.entity";
import { LoginUseCase } from "../../../application/use-cases/auth/login.usecase";
import { AuthDataSourceImpl } from "../../../infrastructure/datasources/auth.datasource.impl";
import { AuthRepositoryImpl } from "../../../infrastructure/repositories/auth.repository.impl";
import { AuthContext } from "./AuthContext";
import type { LoginPayload } from "./auth.types";
import { setSessionTokenMarker } from "../../../infrastructure/http/axios.instance";

const AUTH_TOKEN_STORAGE_KEY = "viggo.auth.token";
const AUTH_USER_STORAGE_KEY = "viggo.auth.user";

const datasource = new AuthDataSourceImpl();
const repository = new AuthRepositoryImpl(datasource);
const loginUseCase = new LoginUseCase(repository);

const readStoredUser = (): AuthUserEntity | null => {
  const storedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const parsed = JSON.parse(storedUser) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    return authUserFromObject(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
};

const storeSession = (token: string, nextUser: AuthUserEntity) => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
};

const clearStoredSession = () => {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUserEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const storedUser = readStoredUser();

    if (isMounted && storedToken && storedUser) {
      setSessionTokenMarker(storedToken);
      setToken(storedToken);
      setUser(storedUser);
    } else {
      clearStoredSession();
      setSessionTokenMarker(null);
      setToken(null);
      setUser(null);
    }

    setLoading(false);

    return () => {
      isMounted = false;
    };
  }, []);

  // Escucha el evento de sesión expirada emitido por el interceptor de Axios
  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoredSession();
      setSessionTokenMarker(null);
      setToken(null);
      setUser(null);
      setSessionExpired(true);
    };

    window.addEventListener("sikk:session-expired", handleSessionExpired);
    return () => window.removeEventListener("sikk:session-expired", handleSessionExpired);
  }, []);


  const login = useCallback(async ({ email, password }: LoginPayload) => {
    setSessionExpired(false);
    const session = await loginUseCase.execute({ email, password });

    storeSession(session.token, session.user);
    setSessionTokenMarker(session.token);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await repository.logout();
    } finally {
      clearStoredSession();
      setSessionTokenMarker(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      sessionExpired,
      login,
      logout,
    }),
    [token, user, loading, sessionExpired, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
