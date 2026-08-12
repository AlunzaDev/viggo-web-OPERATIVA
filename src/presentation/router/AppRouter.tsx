import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { MainLayout } from "../components/mainLayout/MainLayout";
import { ScreenLoader } from "../components/shared/loading/ScreenLoader";
import { useAuth } from "../context/auth/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";
import { getDefaultAuthorizedPath } from "./module-routing";

const LoginPage = lazy(async () => {
  const module = await import("../pages/auth/LoginPage");
  return { default: module.LoginPage };
});

const SessionExpiredPage = lazy(async () => {
  const module = await import("../pages/auth/SessionExpiredPage");
  return { default: module.SessionExpiredPage };
});

const ResetPasswordPage = lazy(async () => {
  const module = await import("../pages/auth/ResetPasswordPage");
  return { default: module.ResetPasswordPage };
});

const CashCheckoutPage = lazy(async () => {
  const module = await import("../pages/cashPayments/CashCheckoutPage");
  return { default: module.CashCheckoutPage };
});

const DashboardPage = lazy(async () => {
  const module = await import("../pages/dashboard/DashboardPage");
  return { default: module.DashboardPage };
});

const CashShiftPage = lazy(async () => {
  const module = await import("../pages/cashPayments/CashShiftPage");
  return { default: module.CashShiftPage };
});

const CashHistoryPage = lazy(async () => {
  const module = await import("../pages/cashPayments/CashHistoryPage");
  return { default: module.CashHistoryPage };
});

const DeviceHeartbeatPage = lazy(async () => {
  const module = await import("../pages/deviceHeartbeat/DeviceHeartbeatPage");
  return { default: module.DeviceHeartbeatPage };
});

const ModulesPage = lazy(async () => {
  const module = await import("../pages/modules/ModulesPage");
  return { default: module.ModulesPage };
});

const RemoteSupportLauncherPage = lazy(async () => {
  const module = await import("../pages/remoteSupport/RemoteSupportLauncherPage");
  return { default: module.RemoteSupportLauncherPage };
});

const OperationalLogsPage = lazy(async () => {
  const module = await import("../pages/operationalLogs/OperationalLogsPage");
  return { default: module.OperationalLogsPage };
});

const PensionsPage = lazy(async () => {
  const module = await import("../pages/pensions/PensionsPage");
  return { default: module.PensionsPage };
});

const PensionPassesPage = lazy(async () => {
  const module = await import("../pages/pensionPasses/PensionPassesPage");
  return { default: module.PensionPassesPage };
});

const TicketsPage = lazy(async () => {
  const module = await import("../pages/readonly/ReadonlyPages");
  return { default: module.TicketsPage };
});

const PensionMovesPage = lazy(async () => {
  const module = await import("../pages/readonly/ReadonlyPages");
  return { default: module.PensionMovesPage };
});

const PaymentsPage = lazy(async () => {
  const module = await import("../pages/readonly/ReadonlyPages");
  return { default: module.PaymentsPage };
});

const SettingsPage = lazy(async () => {
  const module = await import("../pages/settings/SettingsPage");
  return { default: module.SettingsPage };
});

function RouteFallback({ fullscreen = true }: { fullscreen?: boolean }) {
  return <ScreenLoader label="vista" fullscreen={fullscreen} />;
}

function PrivateLayoutRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<RouteFallback fullscreen={false} />}>
          <Outlet />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}

function NotFoundPage() {
  return (
    <div style={{ padding: "100px", textAlign: "center" }}>
      <h1>404 - Ruta No Encontrada</h1>
      <p>Verifica que la URL coincida con lo esperado.</p>
      <button type="button" onClick={() => window.history.back()}>
        Volver
      </button>
    </div>
  );
}

export function AppRouter() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <ScreenLoader label="sesion" />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultAuthorizedPath(user)} replace />
          ) : (
            <Suspense fallback={<RouteFallback />}>
              <LoginPage />
            </Suspense>
          )
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <Suspense fallback={<RouteFallback />}>
            <ResetPasswordPage />
          </Suspense>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? getDefaultAuthorizedPath(user) : "/login"} replace />}
      />

      <Route
        path="/soporte-remoto/:moduleId"
        element={
          <ProtectedRoute modules={["modules"]}>
            <Suspense fallback={<RouteFallback />}>
              <RemoteSupportLauncherPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route element={<PrivateLayoutRoute />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/actividad" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/users" element={<Navigate to="/caja/cobro" replace />} />
        <Route
          path="/caja"
          element={<Navigate to="/caja/cobro" replace />}
        />
        <Route
          path="/caja/cobro"
          element={
            <ProtectedRoute modules={["cashPayments", "payments"]}>
              <CashCheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caja/turno"
          element={
            <ProtectedRoute modules={["cashPayments", "payments"]}>
              <CashShiftPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caja/historial"
          element={
            <ProtectedRoute modules={["cashPayments", "payments"]}>
              <CashHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="/cobro-caja" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/accesos" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/perfiles-permisos" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/projects" element={<Navigate to="/caja/cobro" replace />} />
        <Route
          path="/projects/:projectId/modulos"
          element={
            <ProtectedRoute modules={["modules"]}>
              <ModulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modulos"
          element={
            <ProtectedRoute modules={["modules"]}>
              <ModulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/devices"
          element={<Navigate to="/caja/cobro" replace />}
        />
        <Route
          path="/pensiones"
          element={
            <ProtectedRoute modules={["pensions"]}>
              <PensionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pension-pass"
          element={
            <ProtectedRoute modules={["pensionPasses"]}>
              <PensionPassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute modules={["tickets"]}>
              <TicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movimientos"
          element={
            <ProtectedRoute modules={["pensionMoves"]}>
              <PensionMovesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagos"
          element={
            <ProtectedRoute modules={["payments"]}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/incidences" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/cashiers/*" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/cashier-guard/*" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/moves" element={<Navigate to="/caja/cobro" replace />} />
        <Route path="/device-map/*" element={<Navigate to="/heartbeat" replace />} />
        <Route
          path="/heartbeat"
          element={
            <ProtectedRoute modules={["modules"]}>
              <DeviceHeartbeatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bitacora"
          element={
            <ProtectedRoute modules={["modules", "cashPayments", "payments", "tickets"]}>
              <OperationalLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Navigate to="/account" replace />} />
        <Route path="/config" element={<Navigate to="/account" replace />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute allowInactive>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/session-expired"
        element={
          <Suspense fallback={<RouteFallback />}>
            <SessionExpiredPage />
          </Suspense>
        }
      />

      <Route path="/configiuration" element={<Navigate to="/account" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
