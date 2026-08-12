import { useMemo, useState } from "react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from "../../../config/password-policy";
import { resetPassword } from "../../services/auth/auth-actions.service";
import "../../styles/auth/ResetPasswordPage.css";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const sanitizedToken = typeof token === "string" ? token.trim() : "";
  const isTokenValid = useMemo(
    () => sanitizedToken.length > 16,
    [sanitizedToken],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isTokenValid) {
      Swal.fire({
        icon: "error",
        title: "Enlace invalido",
        text: "El token de recuperación no es válido.",
      });
      return;
    }

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña inválida",
        text: PASSWORD_POLICY_MESSAGE,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "No coinciden",
        text: "La confirmación no coincide con la nueva contraseña.",
      });
      return;
    }

    setLoading(true);
    try {
      const message = await resetPassword(sanitizedToken, newPassword);

      await Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: message,
        confirmButtonText: "Ir al login",
      });

      navigate("/login", { replace: true });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No fue posible restablecer",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo restablecer la contraseña.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page-container">
      <div className="reset-card">
        <img src="/logos/android_icon.png" alt="Viggo" className="reset-logo" />
        <h1 className="reset-title">Restablecer Contraseña</h1>
        <p className="reset-subtitle">
          Ingresa una nueva contraseña para terminar el proceso de recuperación.
        </p>

        <form className="reset-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">
            <FaLock /> Nueva contraseña
          </label>
          <div className="reset-password-field">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              className="reset-toggle-btn"
              disabled={loading}
              aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <label htmlFor="confirm-password">
            <FaLock /> Confirmar contraseña
          </label>
          <div className="reset-password-field">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la nueva contraseña"
              minLength={8}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="reset-toggle-btn"
              disabled={loading}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button type="submit" className="reset-submit-btn" disabled={loading || !isTokenValid}>
            {loading ? "Actualizando..." : "Guardar nueva contraseña"}
          </button>
        </form>

        <Link to="/login" className="reset-back-link">
          Volver al login
        </Link>
      </div>
    </div>
  );
}

