import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaCloudDownloadAlt,
  FaHistory,
  FaMoon,
  FaShieldAlt,
  FaSignOutAlt,
  FaSun,
  FaSyncAlt,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  applyTheme,
  isThemeLockedByEnv,
  resolveInitialTheme,
  resolveThemeForRuntime,
  type ThemeMode,
} from "../../../config/theme-mode";
import { useAuth } from "../../context/auth/useAuth";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { buildInitials } from "../../utils/identity";
import {
  type LocalConfigStatus,
  type LocalConfigSyncResult,
} from "../../services/config/config.api";
import {
  loadLocalConfigFlowState,
  runLocalConfigSyncFlow,
} from "../../services/config/config.flow";
import {
  formatConfigStatusDate,
  formatConfigSyncSuccess,
  normalizeConfigSyncError,
  getConfigSyncIssueLabel,
  getConfigSyncStatusLabel,
} from "../../services/config/config-status.presenter";
import {
  type MonthlyFlushStatus,
} from "../../services/monthlyFlush/monthlyFlush.api";
import {
  createMonthlyFlushFormFromStatus,
  loadMonthlyFlushFlow,
  runMonthlyFlushFlow,
  saveMonthlyFlushFlow,
} from "../../services/monthlyFlush/monthlyFlush.flow";
import { MonthlyFlushModal } from "./MonthlyFlushModal";
import "../../styles/settings/SettingsPage.css";

export function SettingsPage() {
  usePageTitle("Cuenta");

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());
  const [configStatus, setConfigStatus] = useState<LocalConfigStatus | null>(null);
  const [syncResult, setSyncResult] = useState<LocalConfigSyncResult | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isMonthlyFlushOpen, setIsMonthlyFlushOpen] = useState(false);
  const [monthlyFlushStatus, setMonthlyFlushStatus] = useState<MonthlyFlushStatus | null>(null);
  const [monthlyFlushLoading, setMonthlyFlushLoading] = useState(false);
  const [monthlyFlushSaving, setMonthlyFlushSaving] = useState(false);
  const [monthlyFlushRunning, setMonthlyFlushRunning] = useState(false);
  const [monthlyFlushError, setMonthlyFlushError] = useState<string | null>(null);
  const [monthlyFlushEnabled, setMonthlyFlushEnabled] = useState(false);
  const [monthlyFlushPartialEnabled, setMonthlyFlushPartialEnabled] = useState(false);
  const [monthlyFlushPartialDays, setMonthlyFlushPartialDays] = useState<number[]>([]);
  const [monthlyFlushHour, setMonthlyFlushHour] = useState("02");
  const [monthlyFlushMinute, setMonthlyFlushMinute] = useState("00");
  const [manualMonth, setManualMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;
  });

  const runtimeTheme = resolveThemeForRuntime(theme);
  const ThemeIcon = runtimeTheme === "dark" ? FaMoon : FaSun;
  const themeBadge = isThemeLockedByEnv
    ? `${runtimeTheme === "dark" ? "Oscuro" : "Claro"} (ENV)`
    : runtimeTheme === "dark"
      ? "Oscuro"
      : "Claro";
  const userInitials = buildInitials(user?.name || "UV");
  const canManageLocalConfig =
    user?.role === "superRole" || user?.role === "adminRole";

  const loadConfigStatus = async () => {
    setConfigLoading(true);
    try {
      const state = await loadLocalConfigFlowState(canManageLocalConfig);
      setConfigStatus(state.status);
      setConfigError(state.error);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigStatus();
  }, [canManageLocalConfig]);

  const loadMonthlyFlushStatus = async () => {
    if (!canManageLocalConfig) return;
    setMonthlyFlushLoading(true);
    setMonthlyFlushError(null);

    const result = await loadMonthlyFlushFlow();
    setMonthlyFlushStatus(result.status);
    setMonthlyFlushEnabled(result.form.enabled);
    setMonthlyFlushPartialEnabled(result.form.partialCurrentMonthEnabled);
    setMonthlyFlushPartialDays(result.form.partialDays);
    setMonthlyFlushHour(result.form.hour);
    setMonthlyFlushMinute(result.form.minute);
    setMonthlyFlushError(result.error);
    setMonthlyFlushLoading(false);
  };

  const toggleTheme = () => {
    if (isThemeLockedByEnv) return;
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Cerrar sesion",
      text: "Quieres salir de tu cuenta?",
      showCancelButton: true,
      confirmButtonText: "Si, salir",
      cancelButtonText: "Cancelar",
      background: "transparent",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
      },
    });

    if (!result.isConfirmed) return;

    await logout();
    navigate("/login", { replace: true });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setConfigError(null);
    setSyncResult(null);
    try {
      const flow = await runLocalConfigSyncFlow();
      setConfigStatus(flow.status);
      setSyncResult(flow.result);
    } catch (error) {
      setConfigError(
        error instanceof Error
          ? normalizeConfigSyncError(error.message, "sync")
          : "No pudimos sincronizar en este momento. Intenta nuevamente mas tarde.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenMonthlyFlush = async () => {
    setIsMonthlyFlushOpen(true);
    if (!monthlyFlushStatus && !monthlyFlushLoading) {
      await loadMonthlyFlushStatus();
    }
  };

  const handleSaveMonthlyFlush = async () => {
    setMonthlyFlushSaving(true);
    setMonthlyFlushError(null);
    try {
      const status = await saveMonthlyFlushFlow({
        enabled: monthlyFlushEnabled,
        partialCurrentMonthEnabled: monthlyFlushPartialEnabled,
        partialDays: monthlyFlushPartialDays,
        hour: monthlyFlushHour,
        minute: monthlyFlushMinute,
      });
      setMonthlyFlushStatus(status);
      const form = createMonthlyFlushFormFromStatus(status);
      setMonthlyFlushEnabled(form.enabled);
      setMonthlyFlushPartialEnabled(form.partialCurrentMonthEnabled);
      setMonthlyFlushPartialDays(form.partialDays);
      setMonthlyFlushHour(form.hour);
      setMonthlyFlushMinute(form.minute);
    } catch (error) {
      setMonthlyFlushError(
        error instanceof Error ? error.message : "No se pudo guardar el flush mensual",
      );
    } finally {
      setMonthlyFlushSaving(false);
    }
  };

  const handleRunManualMonthlyFlush = async () => {
    setMonthlyFlushRunning(true);
    setMonthlyFlushError(null);
    try {
      const status = await runMonthlyFlushFlow(manualMonth);
      setMonthlyFlushStatus(status);
      const form = createMonthlyFlushFormFromStatus(status);
      setMonthlyFlushEnabled(form.enabled);
      setMonthlyFlushPartialEnabled(form.partialCurrentMonthEnabled);
      setMonthlyFlushPartialDays(form.partialDays);
      setMonthlyFlushHour(form.hour);
      setMonthlyFlushMinute(form.minute);
    } catch (error) {
      setMonthlyFlushError(
        error instanceof Error ? error.message : "No se pudo ejecutar el flush mensual",
      );
    } finally {
      setMonthlyFlushRunning(false);
    }
  };

  const handleTogglePartialDay = (day: number) => {
    setMonthlyFlushPartialDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b),
    );
  };

  const handleAddPartialDay = () => {
    setMonthlyFlushPartialDays((current) => {
      const candidate = Array.from({ length: 30 }, (_, index) => index + 2).find(
        (day) => !current.includes(day),
      );
      if (!candidate) return current;
      return [...current, candidate].sort((a, b) => a - b);
    });
  };

  const handleRemovePartialDay = (day: number) => {
    setMonthlyFlushPartialDays((current) => current.filter((item) => item !== day));
  };

  const handleUpdatePartialDay = (previousDay: number, nextValue: string) => {
    const nextDay = Number(nextValue);
    if (!Number.isInteger(nextDay) || nextDay < 2 || nextDay > 31) return;
    setMonthlyFlushPartialDays((current) =>
      Array.from(new Set(current.map((item) => (item === previousDay ? nextDay : item)))).sort(
        (a, b) => a - b,
      ),
    );
  };

  const manualMonthMax = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <p className="settings-subtitle">Gestiona tu cuenta y accesos principales</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="card-header">
            <FaUserCog className="icon-setting" />
            <h3>Mi Cuenta</h3>
          </div>

          <div className="profile-summary">
            <div className="profile-avatar-container" style={{ cursor: "default" }}>
              <div className="profile-avatar-large profile-avatar-fallback">
                {userInitials}
              </div>
            </div>

            <div className="profile-details">
              <h4>{user?.name ?? "Usuario Viggo"}</h4>
              <span>{user?.email ?? "Sin correo"}</span>
            </div>
          </div>
        </div>

        {canManageLocalConfig ? (
          <div className="settings-card settings-card--wide">
            <div className="card-header">
              <FaCloudDownloadAlt className="icon-setting" />
              <h3>Configuracion local</h3>
            </div>

            <div className="settings-sync">
              <p>
                Sincroniza desde la nube proyecto, modulos, submodulos,
                pensiones, pension pass, usuarios y perfiles de permisos.
              </p>

              <div className="settings-sync__grid">
                <span>
                  Proyecto
                  <strong>{configStatus?.proyectoNombre ?? "Sin vincular"}</strong>
                </span>
                <span>
                  Nube
                  <strong>{configStatus?.cloudApiUrl ?? "Sin configurar"}</strong>
                </span>
                <span>
                  Ultimo sync
                  <strong>{formatConfigStatusDate(configStatus?.lastSyncAt)}</strong>
                </span>
                <span>
                  Estado sync
                  <strong>{getConfigSyncStatusLabel(configStatus?.lastSyncStatus)}</strong>
                </span>
                <span>
                  Version config
                  <strong>{configStatus?.lastConfigurationVersion ?? "Sin version"}</strong>
                </span>
                <span>
                  Version accesos
                  <strong>{configStatus?.lastAccessVersion ?? "Sin version"}</strong>
                </span>
              </div>

              {configError ? (
                <p className="settings-sync__error">{configError}</p>
              ) : null}

              {(configStatus?.lastSyncStatus === "failed" ||
                configStatus?.lastSyncStatus === "success_with_warnings") &&
              configStatus.lastSyncError ? (
                <p className="settings-sync__error">
                  {getConfigSyncIssueLabel(configStatus.lastSyncStatus)}:{" "}
                  {normalizeConfigSyncError(configStatus.lastSyncError, "sync")}
                </p>
              ) : null}

              {syncResult ? (
                <p className="settings-sync__success">{formatConfigSyncSuccess(syncResult)}</p>
              ) : null}

              <button
                className="btn-setting-action"
                disabled={configLoading || syncing || !configStatus?.configured}
                onClick={handleSyncNow}
              >
                {syncing ? <FaSyncAlt /> : <FaCloudDownloadAlt />}
                {syncing ? "Sincronizando..." : "Sincronizar ahora"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="settings-card">
          <div className="card-header">
            <ThemeIcon className="icon-setting" />
            <h3>Apariencia</h3>
          </div>

          <div className="setting-row theme-container">
            <div className="theme-info-row">
              <div className="setting-info">
                <p>Tema</p>
              </div>
              <span className="theme-status">
                Modo actual:
                <span className="theme-badge">{themeBadge}</span>
              </span>
            </div>

            <div className="theme-button-row">
              <button
                type="button"
                className="btn-setting-action theme-toggle"
                onClick={toggleTheme}
                disabled={isThemeLockedByEnv}
              >
                {runtimeTheme === "dark" ? <FaSun /> : <FaMoon />} Cambiar tema
              </button>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <FaShieldAlt className="icon-setting" />
            <h3>Administracion</h3>
          </div>

          <div className="admin-actions-grid">
            <button className="btn-setting-action" onClick={() => navigate("/accesos")}>
              <FaUsers /> Administrar Accesos
            </button>

            <button className="btn-setting-action" onClick={() => navigate("/projects")}>
              <FaBuilding /> Gestionar Proyectos
            </button>

            {canManageLocalConfig ? (
              <button className="btn-setting-action" onClick={() => void handleOpenMonthlyFlush()}>
                <FaHistory /> Flush mensual
              </button>
            ) : null}
          </div>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <FaSignOutAlt className="icon-setting" />
            <h3>Sesion</h3>
          </div>

          <button className="btn-setting-action danger" onClick={handleLogout}>
            <FaSignOutAlt /> Cerrar Sesion
          </button>
        </div>
      </div>

      <MonthlyFlushModal
        open={isMonthlyFlushOpen}
        onClose={() => setIsMonthlyFlushOpen(false)}
        error={monthlyFlushError}
        isLoading={monthlyFlushLoading}
        isSaving={monthlyFlushSaving}
        enabled={monthlyFlushEnabled}
        onEnabledChange={setMonthlyFlushEnabled}
        partialCurrentMonthEnabled={monthlyFlushPartialEnabled}
        onPartialCurrentMonthEnabledChange={setMonthlyFlushPartialEnabled}
        closeDay={monthlyFlushStatus?.closeDay ?? 1}
        partialDays={monthlyFlushPartialDays}
        onToggleDay={handleTogglePartialDay}
        onAddDay={handleAddPartialDay}
        onRemoveDay={handleRemovePartialDay}
        onUpdateDay={handleUpdatePartialDay}
        hour={monthlyFlushHour}
        minute={monthlyFlushMinute}
        onHourChange={setMonthlyFlushHour}
        onMinuteChange={setMonthlyFlushMinute}
        updatedAt={monthlyFlushStatus?.updatedAt ?? null}
        updatedBy={monthlyFlushStatus?.updatedBy ?? null}
        history={monthlyFlushStatus?.history ?? []}
        manualMonth={manualMonth}
        manualMonthMax={manualMonthMax}
        manualRunDisabled={!manualMonth}
        manualRunHint="El mes seleccionado se consolida sobre la bitacora local."
        onManualMonthChange={setManualMonth}
        isRunningManual={monthlyFlushRunning}
        onRunManual={handleRunManualMonthlyFlush}
        onSave={handleSaveMonthlyFlush}
      />
    </div>
  );
}
