import { Component, type ReactNode } from "react";
import { RefreshCw, ServerCrash, ShieldAlert } from "lucide-react";
import backendDownBackground from "../../../assets/images/fondobackenddown.png";
import { checkBackendAvailability } from "../../../infrastructure/http/backend-health";

const BACKEND_OUTAGE_RELOAD_STORAGE_KEY = "sikk:backend-outage-reload-attempts";
const BACKEND_OUTAGE_COOLDOWN_UNTIL_STORAGE_KEY = "sikk:backend-outage-cooldown-until";
const BACKEND_OUTAGE_FAILED_BATCHES_STORAGE_KEY = "sikk:backend-outage-failed-batches";
const BACKEND_OUTAGE_MAX_RELOAD_ATTEMPTS = 5;
const BACKEND_OUTAGE_AUTO_RELOAD_DELAY_MS = 1_500;
const BACKEND_OUTAGE_STABLE_RESET_MS = 30_000;
const BACKEND_OUTAGE_FIRST_COOLDOWN_MS = 5 * 60 * 1_000;
const BACKEND_OUTAGE_NEXT_COOLDOWN_MS = 10 * 60 * 1_000;

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  isRetrying: boolean;
  retryMessage: string;
  message: string;
  autoReloadAttempts: number;
  cooldownRemainingMs: number;
};

const isBackendOutageMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("backend") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("servidor") ||
    normalizedMessage.includes("respuesta") ||
    normalizedMessage.includes("reconectar") ||
    normalizedMessage.includes("conexion")
  );
};

const readBackendOutageReloadAttempts = () => {
  return readPositiveSessionNumber(BACKEND_OUTAGE_RELOAD_STORAGE_KEY);
};

const readPositiveSessionNumber = (key: string) => {
  const rawValue = window.sessionStorage.getItem(key);
  const attempts = Number(rawValue);
  return Number.isFinite(attempts) && attempts > 0 ? attempts : 0;
};

const writeBackendOutageReloadAttempts = (attempts: number) => {
  window.sessionStorage.setItem(BACKEND_OUTAGE_RELOAD_STORAGE_KEY, String(attempts));
};

const clearBackendOutageReloadAttempts = () => {
  window.sessionStorage.removeItem(BACKEND_OUTAGE_RELOAD_STORAGE_KEY);
  window.sessionStorage.removeItem(BACKEND_OUTAGE_COOLDOWN_UNTIL_STORAGE_KEY);
  window.sessionStorage.removeItem(BACKEND_OUTAGE_FAILED_BATCHES_STORAGE_KEY);
};

const readBackendOutageCooldownUntil = () => {
  return readPositiveSessionNumber(BACKEND_OUTAGE_COOLDOWN_UNTIL_STORAGE_KEY);
};

const writeBackendOutageCooldownUntil = (cooldownUntil: number) => {
  window.sessionStorage.setItem(BACKEND_OUTAGE_COOLDOWN_UNTIL_STORAGE_KEY, String(cooldownUntil));
};

const readBackendOutageFailedBatches = () => {
  return readPositiveSessionNumber(BACKEND_OUTAGE_FAILED_BATCHES_STORAGE_KEY);
};

const writeBackendOutageFailedBatches = (failedBatches: number) => {
  window.sessionStorage.setItem(BACKEND_OUTAGE_FAILED_BATCHES_STORAGE_KEY, String(failedBatches));
};

const clearBackendOutageCooldown = () => {
  window.sessionStorage.removeItem(BACKEND_OUTAGE_COOLDOWN_UNTIL_STORAGE_KEY);
};

const formatCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  private autoReloadTimeoutId: number | undefined;
  private stableResetTimeoutId: number | undefined;
  private cooldownIntervalId: number | undefined;

  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
      retryMessage: "",
      message: "",
      autoReloadAttempts: readBackendOutageReloadAttempts(),
      cooldownRemainingMs: Math.max(0, readBackendOutageCooldownUntil() - Date.now()),
    };
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    const message =
      error?.message?.trim() ||
      "Recarga la pagina o intenta nuevamente en unos momentos.";

    return {
      hasError: true,
      isRetrying: false,
      retryMessage: "",
      message,
      autoReloadAttempts: readBackendOutageReloadAttempts(),
      cooldownRemainingMs: Math.max(0, readBackendOutageCooldownUntil() - Date.now()),
    };
  }

  public componentDidMount() {
    this.scheduleStableReset();
  }

  public componentDidCatch(error: Error) {
    this.scheduleAutoReloadForBackendOutage(error);
  }

  public componentWillUnmount() {
    if (this.autoReloadTimeoutId !== undefined) {
      window.clearTimeout(this.autoReloadTimeoutId);
    }

    if (this.stableResetTimeoutId !== undefined) {
      window.clearTimeout(this.stableResetTimeoutId);
    }

    if (this.cooldownIntervalId !== undefined) {
      window.clearInterval(this.cooldownIntervalId);
    }
  }

  private readonly scheduleStableReset = () => {
    if (this.stableResetTimeoutId !== undefined) {
      window.clearTimeout(this.stableResetTimeoutId);
    }

    this.stableResetTimeoutId = window.setTimeout(() => {
      if (!this.state.hasError) {
        clearBackendOutageReloadAttempts();
        this.setState({ autoReloadAttempts: 0 });
      }
    }, BACKEND_OUTAGE_STABLE_RESET_MS);
  };

  private readonly scheduleAutoReloadForBackendOutage = (error: Error) => {
    const message =
      error?.message?.trim() ||
      this.state.message ||
      "Recarga la pagina o intenta nuevamente en unos momentos.";

    if (!isBackendOutageMessage(message)) return;

    const cooldownUntil = readBackendOutageCooldownUntil();
    if (cooldownUntil > Date.now()) {
      this.startCooldownCountdown(cooldownUntil);
      return;
    }

    if (cooldownUntil > 0) {
      clearBackendOutageCooldown();
      writeBackendOutageReloadAttempts(0);
    }

    const currentAttempts = readBackendOutageReloadAttempts();
    if (currentAttempts >= BACKEND_OUTAGE_MAX_RELOAD_ATTEMPTS) {
      this.startCooldownAfterFailedBatch(currentAttempts);
      return;
    }

    const nextAttempts = currentAttempts + 1;
    writeBackendOutageReloadAttempts(nextAttempts);
    this.setState({
      autoReloadAttempts: nextAttempts,
      retryMessage: `Conexion perdida. Recargando automaticamente (${nextAttempts}/${BACKEND_OUTAGE_MAX_RELOAD_ATTEMPTS})...`,
    });

    this.autoReloadTimeoutId = window.setTimeout(() => {
      window.location.reload();
    }, BACKEND_OUTAGE_AUTO_RELOAD_DELAY_MS);
  };

  private readonly startCooldownAfterFailedBatch = (currentAttempts: number) => {
    const nextFailedBatches = readBackendOutageFailedBatches() + 1;
    writeBackendOutageFailedBatches(nextFailedBatches);

    const cooldownMs =
      nextFailedBatches === 1
        ? BACKEND_OUTAGE_FIRST_COOLDOWN_MS
        : BACKEND_OUTAGE_NEXT_COOLDOWN_MS;
    const cooldownUntil = Date.now() + cooldownMs;
    writeBackendOutageCooldownUntil(cooldownUntil);

    this.setState({ autoReloadAttempts: currentAttempts });
    this.startCooldownCountdown(cooldownUntil);
  };

  private readonly startCooldownCountdown = (cooldownUntil: number) => {
    if (this.cooldownIntervalId !== undefined) {
      window.clearInterval(this.cooldownIntervalId);
    }

    const updateCooldown = () => {
      const remainingMs = Math.max(0, cooldownUntil - Date.now());

      if (remainingMs <= 0) {
        window.clearInterval(this.cooldownIntervalId);
        this.cooldownIntervalId = undefined;
        clearBackendOutageCooldown();
        writeBackendOutageReloadAttempts(0);
        this.setState({
          autoReloadAttempts: 0,
          cooldownRemainingMs: 0,
          retryMessage: "Reiniciando ciclo de reconexion automaticamente...",
        });
        this.autoReloadTimeoutId = window.setTimeout(() => {
          window.location.reload();
        }, BACKEND_OUTAGE_AUTO_RELOAD_DELAY_MS);
        return;
      }

      this.setState({
        cooldownRemainingMs: remainingMs,
        retryMessage: `Siguiente ciclo automatico en ${formatCountdown(remainingMs)}.`,
      });
    };

    updateCooldown();
    this.cooldownIntervalId = window.setInterval(updateCooldown, 1_000);
  };

  private readonly handleRetry = async () => {
    if (this.state.isRetrying) return;

    this.setState({
      isRetrying: true,
      retryMessage: "Verificando conexion con el backend...",
    });

    const isBackendAvailable = await checkBackendAvailability();

    if (isBackendAvailable) {
      clearBackendOutageReloadAttempts();
      window.location.reload();
      return;
    }

    this.setState({
      isRetrying: false,
      retryMessage: "El backend sigue sin responder. Intenta de nuevo en unos momentos.",
    });
  };

  public render() {
    if (this.state.hasError) {
      const isBackendOutage = isBackendOutageMessage(this.state.message);
      const isWaitingForNextCycle = isBackendOutage && this.state.cooldownRemainingMs > 0;
      const shouldHideBackendOutageDuringAutoReload =
        isBackendOutage &&
        !isWaitingForNextCycle &&
        this.state.autoReloadAttempts > 0 &&
        this.state.autoReloadAttempts <= BACKEND_OUTAGE_MAX_RELOAD_ATTEMPTS;

      if (shouldHideBackendOutageDuringAutoReload) {
        return null;
      }

      const title = isBackendOutage ? "Backend sin conexion" : "Ocurrio un error inesperado";
      const description = isBackendOutage
        ? isWaitingForNextCycle
          ? "El sistema agoto los intentos inmediatos. Esperara unos minutos y volvera a recargar solo."
          : this.state.autoReloadAttempts >= BACKEND_OUTAGE_MAX_RELOAD_ATTEMPTS
          ? "El sistema no pudo recuperar conexion despues de varios intentos automaticos. Preparando el siguiente ciclo."
          : "El sistema no puede comunicarse con el servidor. Intentara recargar la pagina para recuperar conexion."
        : "Recarga la pagina o intenta nuevamente en unos momentos.";
      const Icon = isBackendOutage ? ServerCrash : ShieldAlert;
      const backgroundImage = isBackendOutage
        ? `url(${backendDownBackground})`
        : "radial-gradient(circle at 18% 18%, rgba(235, 87, 87, 0.16), transparent 28%), linear-gradient(135deg, #101114 0%, #1d2228 48%, #2f3438 100%)";

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#101414",
            color: "var(--text)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-28px",
              backgroundImage,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: isBackendOutage ? "blur(10px) saturate(1.22)" : "none",
              transform: "scale(1.03)",
              opacity: isBackendOutage ? 0.86 : 1,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(10, 18, 16, 0.68) 0%, rgba(16, 34, 24, 0.52) 42%, rgba(102, 212, 61, 0.18) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 76% 22%, rgba(102, 212, 61, 0.26), transparent 30%), radial-gradient(circle at 18% 86%, rgba(86, 179, 51, 0.18), transparent 34%)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(100%, 680px)",
              padding: "clamp(24px, 5vw, 44px)",
              borderRadius: "8px",
              background: "rgba(14, 20, 18, 0.76)",
              backdropFilter: "blur(22px) saturate(160%)",
              WebkitBackdropFilter: "blur(22px) saturate(160%)",
              border: "1px solid rgba(102, 212, 61, 0.34)",
              boxShadow: "0 28px 70px rgba(0, 0, 0, 0.34)",
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.94)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
                borderRadius: "50%",
                background: isBackendOutage ? "rgba(102, 212, 61, 0.16)" : "#eef2ff",
                color: isBackendOutage ? "#66d43d" : "#4338ca",
                border: isBackendOutage ? "1px solid rgba(102, 212, 61, 0.42)" : "none",
                boxShadow: isBackendOutage ? "0 0 34px rgba(102, 212, 61, 0.24)" : "none",
              }}
            >
              <Icon size={36} strokeWidth={2.2} />
            </div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0",
                textTransform: "uppercase",
                color: isBackendOutage ? "#8bec6a" : "#4338ca",
              }}
            >
              {isBackendOutage ? "Operacion detenida" : "Error de aplicacion"}
            </p>
            <h1
              style={{
                margin: "0 0 12px",
                fontSize: "clamp(30px, 6vw, 46px)",
                lineHeight: 1.05,
                letterSpacing: "0",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: "0 auto 18px",
                maxWidth: "560px",
                fontSize: "16px",
                lineHeight: 1.6,
                color: "rgba(255, 255, 255, 0.76)",
              }}
            >
              {description}
            </p>
            <p
              style={{
                margin: "0 auto 28px",
                maxWidth: "560px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "rgba(255, 255, 255, 0.78)",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => void this.handleRetry()}
              disabled={this.state.isRetrying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "1px solid rgba(102, 212, 61, 0.74)",
                background: "linear-gradient(135deg, #66d43d, #56b333)",
                color: "#071008",
                borderRadius: "8px",
                padding: "11px 16px",
                fontWeight: 800,
                cursor: this.state.isRetrying ? "wait" : "pointer",
                opacity: this.state.isRetrying ? 0.78 : 1,
              }}
            >
              <RefreshCw size={17} />
              {this.state.isRetrying ? "Verificando..." : "Reintentar conexion"}
            </button>
            {this.state.retryMessage ? (
              <p
                role="status"
                style={{
                  marginBottom: 0,
                  marginTop: "14px",
                  color: "rgba(255, 255, 255, 0.72)",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {this.state.retryMessage}
              </p>
            ) : null}
            <p
              style={{
                marginBottom: 0,
                marginTop: this.state.retryMessage ? "10px" : "18px",
                color: "rgba(255, 255, 255, 0.58)",
                fontSize: "13px",
              }}
            >
              Si persiste, revisa el backend o contacta al equipo de soporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
