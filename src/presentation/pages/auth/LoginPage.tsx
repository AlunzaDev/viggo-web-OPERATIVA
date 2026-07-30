import { useCallback, useEffect, useState } from "react";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../context/auth/useAuth";
import { getDefaultAuthorizedPath } from "../../router/module-routing";
import { AuthDataSourceImpl } from "../../../infrastructure/datasources/auth.datasource.impl";
import { AuthRepositoryImpl } from "../../../infrastructure/repositories/auth.repository.impl";
import { ForgotPasswordUseCase } from "../../../application/use-cases/auth/forgot-password.usecase";
import { ResendValidationEmailUseCase } from "../../../application/use-cases/auth/resend-validation-email.usecase";
import { applyTheme, resolveInitialTheme, type ThemeMode } from "../../../config/theme-mode";
import { showAppToast } from "../../utils/feedback/swalToast";
import "../../styles/auth/LoginPage.css";

const authDatasource = new AuthDataSourceImpl();
const authRepository = new AuthRepositoryImpl(authDatasource);
const forgotPasswordUseCase = new ForgotPasswordUseCase(authRepository);
const resendValidationEmailUseCase = new ResendValidationEmailUseCase(authRepository);

const normalizeLoginError = (rawMessage: string) => {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (
    normalized.includes("cors") ||
    normalized.includes("network error") ||
    normalized.includes("servidor no disponible") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed")
  ) {
    return {
      title: "No pudimos conectar",
      message: "Revisa la conexion con el sistema e intenta nuevamente en un momento.",
    };
  }

  if (
    normalized.includes("unauthorized") ||
    normalized.includes("credenciales") ||
    normalized.includes("correo o contraseña") ||
    normalized.includes("correo o contrasena")
  ) {
    return {
      title: "Acceso denegado",
      message: "Verifica tu correo y contraseña para volver a intentarlo.",
    };
  }

  if (normalized.includes("sesion") && normalized.includes("expir")) {
    return {
      title: "La sesion ya no es valida",
      message: "Inicia sesion nuevamente para continuar.",
    };
  }

  return {
    title: "No pudimos iniciar sesion",
    message: message || "Intenta nuevamente en un momento.",
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [theme] = useState<ThemeMode>(() => resolveInitialTheme());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmittingRef.current) return;

      if (!email.trim() || !password.trim()) {
        void showAppToast("warning", "Campos incompletos", "Ingresa tu correo y contraseña.");
        return;
      }

      isSubmittingRef.current = true;
      setLoading(true);

      try {
        const authenticatedUser = await login({
          email: email.trim(),
          password,
        });

        void showAppToast("success", "Bienvenido a Viggo");

        const nextPath = getDefaultAuthorizedPath(authenticatedUser);
        navigate(nextPath === "/login" ? "/projects" : nextPath, { replace: true });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Credenciales incorrectas o servidor no disponible.";
        const normalizedError = normalizeLoginError(errorMessage);
        void showAppToast("error", normalizedError.title, normalizedError.message);
      } finally {
        isSubmittingRef.current = false;
        setLoading(false);
      }
    },
    [email, password, login, navigate],
  );

  const handleForgotPassword = useCallback(() => {
    void Swal.fire({
      icon: "info",
      title: "Recuperar Contraseña",
      text: "Ingresa tu correo electrónico para enviarte un enlace de recuperación.",
      input: "email",
      inputPlaceholder: "tu@correo.com",
      showCancelButton: true,
      confirmButtonText: "Enviar Enlace",
      cancelButtonText: "Cancelar",
      background: "var(--surface)",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
      },
      showLoaderOnConfirm: true,
      preConfirm: async (value) => {
        const normalizedEmail = typeof value === "string" ? value.trim().toLowerCase() : "";
        if (!normalizedEmail) {
          Swal.showValidationMessage("Ingresa un correo electrónico");
          return null;
        }

        try {
          return await forgotPasswordUseCase.execute({ email: normalizedEmail });
        } catch (error) {
          Swal.showValidationMessage(
            error instanceof Error ? error.message : "No se pudo enviar el enlace",
          );
          return null;
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const backendMessage =
          typeof result.value === "string" && result.value.trim().length > 0
            ? result.value
            : "Si el correo existe, revisa tu bandeja de entrada.";

        void showAppToast("success", "Enlace enviado", backendMessage);
      }
    });
  }, []);

  const handleResendValidationEmail = useCallback(() => {
    void Swal.fire({
      icon: "info",
      title: "Reenviar validación",
      text: "Ingresa tu correo electrónico para reenviar el enlace de validación.",
      input: "email",
      inputPlaceholder: "tu@correo.com",
      showCancelButton: true,
      confirmButtonText: "Reenviar enlace",
      cancelButtonText: "Cancelar",
      background: "var(--surface)",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
      },
      showLoaderOnConfirm: true,
      preConfirm: async (value) => {
        const normalizedEmail = typeof value === "string" ? value.trim().toLowerCase() : "";
        if (!normalizedEmail) {
          Swal.showValidationMessage("Ingresa un correo electrónico");
          return null;
        }

        try {
          return await resendValidationEmailUseCase.execute({ email: normalizedEmail });
        } catch (error) {
          Swal.showValidationMessage(
            error instanceof Error ? error.message : "No se pudo reenviar el enlace",
          );
          return null;
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const backendMessage =
          typeof result.value === "string" && result.value.trim().length > 0
            ? result.value
            : "Si el correo existe y sigue pendiente, revisa tu bandeja de entrada.";

        void showAppToast("success", "Validacion reenviada", backendMessage);
      }
    });
  }, []);

  return (
    <div className="login-page-container">
      <div className="liquid-background" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="login-branding-container">
        <img
          src="/logos/logo.png"
          alt="Viggo"
          className="login-logo"
        />
        <p className="login-mission-statement">
          Plataforma Integral de Accesos, Gestión y Control Inteligente de Estacionamientos.
        </p>
      </div>

      <div className="login-form-container">
        <img
          src="/logos/logo.png"
          alt="Viggo"
          className="login-mobile-logo"
        />
        <h2 className="login-title">Iniciar Sesión</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope /> Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="admin@viggo.com"
              autoComplete="email"
              inputMode="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Contraseña
            </label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="********"
                autoComplete="current-password"
                disabled={loading}
              />

              <span
                className="password-toggle-icon"
                onClick={() => !loading && setShowPassword((prev) => !prev)}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !loading) {
                    event.preventDefault();
                    setShowPassword((prev) => !prev);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
                title={showPassword ? "Ocultar" : "Mostrar"}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </span>
            </div>
          </div>

          <div className="login-form-meta">
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button
              type="button"
              className="forgot-password-link secondary"
              onClick={handleResendValidationEmail}
              disabled={loading}
            >
              Reenviar validación
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Ingresando..." : "Acceder al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}

