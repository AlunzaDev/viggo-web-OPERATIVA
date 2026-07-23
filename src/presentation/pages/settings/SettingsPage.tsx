import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaMoon, FaShieldAlt, FaSignOutAlt, FaSun, FaUserCog, FaUsers } from "react-icons/fa";
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
import "../../styles/settings/SettingsPage.css";

export function SettingsPage() {
  usePageTitle("Cuenta");

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());

  const runtimeTheme = resolveThemeForRuntime(theme);
  const ThemeIcon = runtimeTheme === "dark" ? FaMoon : FaSun;
  const themeBadge = isThemeLockedByEnv
    ? `${runtimeTheme === "dark" ? "Oscuro" : "Claro"} (ENV)`
    : runtimeTheme === "dark"
      ? "Oscuro"
      : "Claro";

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
