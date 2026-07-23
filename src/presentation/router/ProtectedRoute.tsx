import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { AuthUserRole } from "../../domain/entities/auth-user.entity";
import type { AppModuleAccess } from "../../domain/entities/module-access";
import { hasModuleAccess } from "../../domain/entities/module-access";
import { ScreenLoader } from "../components/shared/loading/ScreenLoader";
import { useAuth } from "../context/auth/useAuth";
import { getDefaultAuthorizedPath } from "./module-routing";

type ProtectedRouteProps = {
  children: ReactNode;
  roles?: AuthUserRole[];
  modules?: AppModuleAccess[];
  allowInactive?: boolean;
};

export function ProtectedRoute({
  children,
  roles,
  modules,
  allowInactive = false,
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, user, logout, sessionExpired } = useAuth();

  // Si hay token pero no hay user (estado corrupto), limpiar sesión
  useEffect(() => {
    if (!loading && isAuthenticated && !user) {
      logout();
    }
  }, [loading, isAuthenticated, user, logout]);

  if (loading) {
    return <ScreenLoader label="sesión" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={sessionExpired ? "/session-expired" : "/login"} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={getDefaultAuthorizedPath(user)} replace />;
  }

  if (
    user.role !== "superRole" &&
    modules &&
    modules.length > 0 &&
    !modules.some((module) => hasModuleAccess(user.modules, module))
  ) {
    return <Navigate to={getDefaultAuthorizedPath(user)} replace />;
  }

  if (!allowInactive && !user.active) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}

