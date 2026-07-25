import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaCloudDownloadAlt,
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
import {
  getLocalConfigStatus,
  syncLocalConfiguration,
  type LocalConfigStatus,
  type LocalConfigSyncResult,
} from "../../services/config/config.api";
import "../../styles/settings/SettingsPage.css";

const formatDate = (value?: number | null) => {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

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

  const runtimeTheme = resolveThemeForRuntime(theme);
  const ThemeIcon = runtimeTheme === "dark" ? FaMoon : FaSun;
  const themeBadge = isThemeLockedByEnv
    ? `${runtimeTheme === "dark" ? "Oscuro" : "Claro"} (ENV)`
    : runtimeTheme === "dark"
      ? "Oscuro"
      : "Claro";
  const canManageLocalConfig =
    user?.role === "superRole" || user?.role === "adminRole";

  const loadConfigStatus = async () => {
    if (!canManageLocalConfig) {
      setConfigLoading(false);
      return;
    }

    setConfigLoading(true);
    setConfigError(null);
    try {
      setConfigStatus(await getLocalConfigStatus());
    } catch (error) {
      setConfigError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuracion local",
      );
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigStatus();
  }, [canManageLocalConfig]);

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
      const result = await syncLocalConfiguration();
      setSyncResult(result);
      await loadConfigStatus();
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "No se pudo sincronizar");
    } finally {
      setSyncing(false);
    }
  };

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
                <FaUserCog />
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
                Sincroniza desde NUBEADMIN proyecto, modulos, submodulos,
                pensiones, pension pass, usuarios y perfiles de permisos.
              </p>

              <div className="settings-sync__grid">
                <span>
                  Proyecto
                  <strong>{configStatus?.proyectoNombre ?? "Sin vincular"}</strong>
                </span>
                <span>
                  NUBEADMIN
                  <strong>{configStatus?.cloudApiUrl ?? "Sin configurar"}</strong>
                </span>
                <span>
                  Ultimo sync
                  <strong>{formatDate(configStatus?.lastSyncAt)}</strong>
                </span>
                <span>
                  Estado sync
                  <strong>
                    {configStatus?.lastSyncStatus === "success"
                      ? "Correcto"
                      : configStatus?.lastSyncStatus === "success_with_warnings"
                        ? "Con alertas"
                      : configStatus?.lastSyncStatus === "failed"
                        ? "Fallido"
                        : "Sin registro"}
                  </strong>
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
                  {configStatus.lastSyncStatus === "failed" ? "Ultimo error" : "Ultima alerta"}:{" "}
                  {configStatus.lastSyncError}
                </p>
              ) : null}

              {syncResult ? (
                <p className="settings-sync__success">
                  Aplicado: {syncResult.configuration.modulos} modulos,{" "}
                  {syncResult.configuration.pensiones} pensiones,{" "}
                  {syncResult.configuration.pensionPasses} pension pass,{" "}
                  {syncResult.access.users} usuarios y{" "}
                  {syncResult.access.permissionProfiles} perfiles.
                  {syncResult.integrity?.warnings?.length
                    ? ` Alertas: ${syncResult.integrity.warnings.length}.`
                    : ""}
                </p>
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
    </div>
  );
}
