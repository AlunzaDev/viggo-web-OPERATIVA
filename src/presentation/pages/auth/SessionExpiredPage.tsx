import { useEffect, useState } from "react";
import { FiLogIn, FiPlay } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { applyTheme, resolveInitialTheme, type ThemeMode } from "../../../config/theme-mode";
import {
  BarrierBlasterGame,
  type BarrierBlasterGameSummary,
} from "../../components/auth/BarrierBlasterGame";
import { useAuth } from "../../context/auth/useAuth";
import "../../styles/auth/SessionExpiredPage.css";

const HIGH_SCORE_KEY = "viggo-operative-barrier-blaster-high-score";

const readHighScore = () => {
  if (typeof window === "undefined") return 0;
  const storedValue = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
  return Number.isFinite(storedValue) && storedValue > 0 ? Math.floor(storedValue) : 0;
};

export function SessionExpiredPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme] = useState<ThemeMode>(() => resolveInitialTheme());
  const [isGameActive, setIsGameActive] = useState(false);
  const [highScore, setHighScore] = useState(readHighScore);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleGoToLogin = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleGameOver = (summary: BarrierBlasterGameSummary) => {
    const nextHighScore = Math.max(highScore, summary.highScore, summary.score);
    setHighScore(nextHighScore);
    window.localStorage.setItem(HIGH_SCORE_KEY, String(nextHighScore));
  };

  return (
    <div className={`session-expired-container${isGameActive ? " game-active" : ""}`}>
      <div className="liquid-background" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {isGameActive ? (
        <div className="session-expired-game-shell">
          <BarrierBlasterGame
            mode="play"
            initialHighScore={highScore}
            onGameOver={handleGameOver}
            onReturnToLogin={() => void handleGoToLogin()}
          />
        </div>
      ) : (
      <div className="session-expired-overlay">
        <div className="session-expired-card">
          <div className="session-expired-brand-lockup">
            <img
              src="/logos/logo.png"
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
            <button
              type="button"
              className="session-expired-secondary-btn"
              onClick={() => setIsGameActive(true)}
            >
              <FiPlay size={19} />
              Jugar Barrier Blaster
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
