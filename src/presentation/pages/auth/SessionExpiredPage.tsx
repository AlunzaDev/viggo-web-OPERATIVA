import { useEffect, useState } from "react";
import { FiClock, FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { applyTheme, resolveInitialTheme, type ThemeMode } from "../../../config/theme-mode";
import { useAuth } from "../../context/auth/useAuth";
import "../../styles/auth/SessionExpiredPage.css";

export function SessionExpiredPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme] = useState<ThemeMode>(() => resolveInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleGoToLogin = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="session-expired-container">
      <div className="liquid-background" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="session-expired-overlay">
        <div className="session-expired-card">
          <div className="session-expired-icon-wrapper">
            <FiClock className="session-expired-icon" size={48} />
            <div className="session-expired-icon-pulse" />
          </div>

          <div className="session-expired-brand">
            <img
              src="/favicon.svg"
              alt="Viggo"
              className="session-expired-logo"
            />
          </div>

          <h1 className="session-expired-title">Sesion expirada</h1>

          <p className="session-expired-message">
            Tu token de acceso ya no es valido. Inicia sesion nuevamente para continuar.
          </p>

          <div className="session-expired-card-actions">
            <button
              id="session-expired-login-btn"
              type="button"
              className="session-expired-btn"
              onClick={handleGoToLogin}
            >
              <FiLogIn size={20} />
              Volver al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
