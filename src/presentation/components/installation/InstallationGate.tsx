import { useEffect, useState, type ReactNode } from "react";
import { FaCheckCircle, FaKey, FaLink, FaLock, FaParking, FaSyncAlt } from "react-icons/fa";
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
  getInstallationStatusCopy,
  getInstallationWaitingBadgeLabel,
  getInstallationWaitingMeta,
  isBackendUnavailableMessage,
  isInstallationWaitingApproval,
  normalizeInstallationError,
  shouldRedirectToSessionExpired,
} from "../../services/installation/installation-gate.service";
import { ScreenLoader } from "../shared/loading/ScreenLoader";
import { showAppToast } from "../../utils/feedback/swalToast";
import "./InstallationGate.css";

type InstallationGateProps = {
  children: ReactNode;
};

export function InstallationGate({ children }: InstallationGateProps) {
  const [installation, setInstallation] = useState<LocalInstallation | null>(null);
  const [installationLinkToken, setInstallationLinkToken] = useState("");
  // Project the current token belongs to; the operator confirms it before requesting.
  const [linkProject, setLinkProject] = useState<InstallationLinkProject | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  if (installation?.configured) return <>{children}</>;

  return (
    <main className="installation-gate">
      <section className="installation-gate__card">
        <span className="installation-gate__eyebrow">
          {isWaitingApproval ? <FaCheckCircle /> : <FaLock />}
          Instalacion local
        </span>
        <h1>Vincula este punto local a un proyecto</h1>
        <p>{getInstallationStatusCopy(installation)}</p>
        <p className="installation-gate__id">
          ID de instalacion: <strong>{installationIdLabel}</strong>
        </p>

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
