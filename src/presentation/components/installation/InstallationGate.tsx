import { ScreenLoader } from "@alunzadev/viggo-ui";
import { useEffect, useState, type ReactNode } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaKey, FaLink, FaLock, FaParking, FaSyncAlt } from "react-icons/fa";
import { type LocalInstallation } from "../../services/installation/installation.api";
import { type InstallationLinkProject } from "../../services/installation/installation.contract";
import {
  loadInstallationGateState,
  previewInstallationGateLink,
  submitInstallationGateRequest,
} from "../../services/installation/installation-gate.flow";
import {
  getInstallationBackendMessage,
  getInstallationGateMode,
  getInstallationIdLabel,
  getInstallationShortCode,
  getInstallationStatusCopy,
  getInstallationWaitingBadgeLabel,
  getInstallationWaitingMeta,
  INSTALLATION_POLL_INTERVAL_MS,
  isBackendUnavailableMessage,
  isInstallationWaitingApproval,
  needsCloudRelink,
  normalizeInstallationError,
  shouldPollInstallation,
  shouldRedirectToSessionExpired,
} from "../../services/installation/installation-gate.service";
import { showAppToast } from "../../utils/feedback/swalToast";
import "./InstallationGate.css";

type InstallationGateProps = {
  children: ReactNode;
};

// "Continue without the cloud" lasts for this browser session only.
const OFFLINE_ACK_KEY = "viggo.installation.offlineAck";
const readOfflineAck = () => {
  try {
    return window.sessionStorage.getItem(OFFLINE_ACK_KEY) === "1";
  } catch {
    return false;
  }
};
const writeOfflineAck = () => {
  try {
    window.sessionStorage.setItem(OFFLINE_ACK_KEY, "1");
  } catch {
    // Storage unavailable: the choice lasts until the page reloads.
  }
};

export function InstallationGate({ children }: InstallationGateProps) {
  const [installation, setInstallation] = useState<LocalInstallation | null>(null);
  const [installationLinkToken, setInstallationLinkToken] = useState("");
  // Project the current token belongs to; the operator confirms it before requesting.
  const [linkProject, setLinkProject] = useState<InstallationLinkProject | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offlineAck, setOfflineAck] = useState(readOfflineAck);

  const relinkNeeded = needsCloudRelink(installation);
  const isWaitingApproval = isInstallationWaitingApproval(installation);
  const waitingStateMeta = getInstallationWaitingMeta(installation);
  const gateMode = getInstallationGateMode(installation, backendUnavailable);
  const backendMessage = getInstallationBackendMessage(backendUnavailable);
  const installationIdLabel = getInstallationIdLabel(installation, backendUnavailable);

  const showInstallationAlert = (rawMessage: string) => {
    if (shouldRedirectToSessionExpired(rawMessage)) {
      window.location.assign("/session-expired");
      return;
    }

    const nextAlert = normalizeInstallationError(rawMessage);
    void showAppToast(
      nextAlert.tone === "warning" ? "warning" : "error",
      nextAlert.title,
      nextAlert.message,
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const nextState = await loadInstallationGateState();
      setInstallation(nextState.installation);
      setBackendUnavailable(nextState.backendUnavailable);
    } catch (loadError) {
      setInstallation(null);
      const message =
        loadError instanceof Error
          ? loadError.message
          : typeof loadError === "object" && loadError !== null && "message" in loadError
            ? String((loadError as { message: unknown }).message)
            : "No se pudo cargar la configuracion de instalacion.";
      const unavailable =
        typeof loadError === "object" &&
        loadError !== null &&
        "backendUnavailable" in loadError
          ? Boolean((loadError as { backendUnavailable?: unknown }).backendUnavailable)
          : isBackendUnavailableMessage(message);
      setBackendUnavailable(unavailable);
      showInstallationAlert(
        message,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const polling = shouldPollInstallation(installation, backendUnavailable);

  // While the request is under review, check on our own so the operator does not have to.
  useEffect(() => {
    if (!polling) return;
    let cancelled = false;

    const check = async () => {
      if (cancelled || document.hidden) return;
      try {
        const nextState = await loadInstallationGateState();
        if (!cancelled) setInstallation(nextState.installation);
      } catch (pollError) {
        // Stop when the local API is down; other errors are retried on the next tick.
        const unavailable =
          typeof pollError === "object" && pollError !== null && "backendUnavailable" in pollError
            ? Boolean((pollError as { backendUnavailable?: unknown }).backendUnavailable)
            : false;
        if (!cancelled && unavailable) setBackendUnavailable(true);
      }
    };

    const timer = window.setInterval(() => void check(), INSTALLATION_POLL_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [polling]);

  const handleContinueOffline = () => {
    writeOfflineAck();
    setOfflineAck(true);
  };

  const handleTokenChange = (value: string) => {
    setInstallationLinkToken(value);
    // A different token may belong to another project: confirm it again.
    setLinkProject(null);
  };

  const handlePreview = async () => {
    setSaving(true);
    try {
      setLinkProject(await previewInstallationGateLink(installationLinkToken));
      setBackendUnavailable(false);
    } catch (previewError) {
      setLinkProject(null);
      showInstallationAlert(
        previewError instanceof Error
          ? previewError.message
          : "No se pudo validar el token de vinculacion.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRequest = async () => {
    if (!linkProject) {
      showInstallationAlert("Confirma el proyecto antes de solicitar la vinculacion.");
      return;
    }

    setSaving(true);
    try {
      const nextInstallation = await submitInstallationGateRequest({ installationLinkToken });
      setBackendUnavailable(false);
      setInstallation(nextInstallation);
    } catch (requestError) {
      setBackendUnavailable(
        requestError instanceof Error
          ? isBackendUnavailableMessage(requestError.message)
          : false,
      );
      showInstallationAlert(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo solicitar la vinculacion.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ScreenLoader label="instalacion" />;
  if (installation?.configured && (!relinkNeeded || offlineAck)) return <>{children}</>;

  return (
    <main className="installation-gate">
      <section className="installation-gate__card">
        <span className="installation-gate__eyebrow">
          {isWaitingApproval ? <FaCheckCircle /> : relinkNeeded ? <FaExclamationTriangle /> : <FaLock />}
          Instalacion local
        </span>
        <h1>{relinkNeeded ? "Este punto local no puede conectarse a la nube" : "Vincula este punto local a un proyecto"}</h1>
        <p>{getInstallationStatusCopy(installation)}</p>
        <p className="installation-gate__id">
          ID de instalacion: <strong>{installationIdLabel}</strong>
        </p>
        {getInstallationShortCode(installation) && !installation?.configured ? (
          <p className="installation-gate__id">
            Codigo de verificacion: <strong>{getInstallationShortCode(installation)}</strong>
            <br />
            Dicta este codigo a quien aprueba la solicitud en administrativo.
          </p>
        ) : null}

        {installation?.status === "rejected" && installation.reviewNote ? (
          <p className="installation-gate__error">{installation.reviewNote}</p>
        ) : null}

        {backendMessage ? <p className="installation-gate__error">{backendMessage}</p> : null}

        {gateMode === "ready" ? (
          <>
            <div className="installation-gate__selector">
              <label htmlFor="installation-link-token">Token de vinculacion</label>
              <input
                id="installation-link-token"
                type="password"
                value={installationLinkToken}
                onChange={(event) => handleTokenChange(event.target.value)}
                placeholder="Pega el token generado al crear el proyecto"
                disabled={saving}
                autoComplete="off"
              />
            </div>

            {linkProject ? (
              <article className="installation-gate__preview">
                <FaParking />
                <div>
                  <strong>{linkProject.nombre}</strong>
                  <span>
                    {[linkProject.identificador || linkProject.id, linkProject.ciudad]
                      .filter(Boolean)
                      .join(" - ")}
                  </span>
                </div>
              </article>
            ) : null}
          </>
        ) : gateMode === "waitingApproval" ? (
          <div className="installation-gate__waiting-shell">
            <article className="installation-gate__waiting-banner">
              <span className="installation-gate__waiting-badge">
                <FaCheckCircle />
                {getInstallationWaitingBadgeLabel(installation)}
              </span>
              <strong>{waitingStateMeta.title}</strong>
              <p>{waitingStateMeta.description}</p>
              {polling ? (
                <p className="installation-gate__id">Revisando automaticamente cada {INSTALLATION_POLL_INTERVAL_MS / 1000} s.</p>
              ) : null}
            </article>

            <article className="installation-gate__preview installation-gate__preview--waiting">
              <FaParking />
              <div>
                <strong>{installation?.proyectoNombre ?? "Proyecto solicitado"}</strong>
                <span>{installation?.proyectoIdentificador ?? installation?.cloudRequestId}</span>
              </div>
            </article>
          </div>
        ) : null}

        <div className="installation-gate__actions">
          <button type="button" onClick={() => void loadData()} disabled={saving}>
            <FaSyncAlt /> {isWaitingApproval ? "Actualizar vinculacion" : "Revisar estado"}
          </button>
          {relinkNeeded && !isWaitingApproval ? (
            <button type="button" onClick={handleContinueOffline} disabled={saving}>
              Continuar sin conexion a la nube
            </button>
          ) : null}
          {!isWaitingApproval && !backendUnavailable ? (
            linkProject ? (
              <button
                type="button"
                className="installation-gate__primary"
                onClick={handleRequest}
                disabled={saving}
              >
                <FaLink /> {saving ? "Enviando..." : "Solicitar vinculacion"}
              </button>
            ) : (
              <button
                type="button"
                className="installation-gate__primary"
                onClick={handlePreview}
                disabled={saving || !installationLinkToken.trim()}
              >
                <FaKey /> {saving ? "Validando..." : "Validar token"}
              </button>
            )
          ) : null}
        </div>
      </section>
    </main>
  );
}
