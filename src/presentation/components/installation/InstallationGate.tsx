import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FaCheckCircle, FaLink, FaLock, FaParking, FaSyncAlt } from "react-icons/fa";
import { type LocalInstallation } from "../../services/installation/installation.api";
import {
  loadInstallationGateState,
  submitInstallationGateRequest,
} from "../../services/installation/installation-gate.flow";
import {
  getInstallationBackendMessage,
  getInstallationGateMode,
  getInstallationIdLabel,
  getInstallationProjectsPlaceholder,
  getInstallationStatusCopy,
  getInstallationWaitingBadgeLabel,
  getInstallationWaitingMeta,
  isBackendUnavailableMessage,
  isInstallationWaitingApproval,
  normalizeInstallationError,
  shouldRedirectToSessionExpired,
  type ProjectOption,
} from "../../services/installation/installation-gate.service";
import { ScreenLoader } from "../shared/loading/ScreenLoader";
import { showAppToast } from "../../utils/feedback/swalToast";
import "./InstallationGate.css";

type InstallationGateProps = {
  children: ReactNode;
};

export function InstallationGate({ children }: InstallationGateProps) {
  const [installation, setInstallation] = useState<LocalInstallation | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [installationLinkToken, setInstallationLinkToken] = useState("");
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const isWaitingApproval = isInstallationWaitingApproval(installation);
  const waitingStateMeta = getInstallationWaitingMeta(installation);
  const gateMode = getInstallationGateMode(installation, backendUnavailable);
  const backendMessage = getInstallationBackendMessage(backendUnavailable);
  const installationIdLabel = getInstallationIdLabel(installation, backendUnavailable);
  const projectsPlaceholder = getInstallationProjectsPlaceholder({
    backendUnavailable,
    projectsCount: projects.length,
  });

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
      setProjects(nextState.projects);
      setBackendUnavailable(nextState.backendUnavailable);
      if (!nextState.installation?.configured) {
        setSelectedProjectId("");
      }
    } catch (loadError) {
      setProjects([]);
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

  const handleRequest = async () => {
    if (!selectedProjectId) {
      showInstallationAlert("Selecciona un proyecto para solicitar la vinculacion.");
      return;
    }

    if (!installationLinkToken.trim()) {
      showInstallationAlert("Ingresa el token de vinculacion del proyecto.");
      return;
    }

    setSaving(true);
    try {
      const nextInstallation = await submitInstallationGateRequest({
        projectId: selectedProjectId,
        installationLinkToken,
      });
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
              <label htmlFor="installation-project">Proyecto en la nube</label>
              <select
                id="installation-project"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={saving || projects.length === 0}
              >
                <option value="">{projectsPlaceholder}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nombre}
                    {project.identificador ? ` - ${project.identificador}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject ? (
              <article className="installation-gate__preview">
                <FaParking />
                <div>
                  <strong>{selectedProject.nombre}</strong>
                  <span>{selectedProject.identificador || selectedProject.id}</span>
                </div>
              </article>
            ) : null}

            <div className="installation-gate__selector">
              <label htmlFor="installation-link-token">Token de vinculacion</label>
              <input
                id="installation-link-token"
                type="password"
                value={installationLinkToken}
                onChange={(event) => setInstallationLinkToken(event.target.value)}
                placeholder="Ingresa el token generado al crear el proyecto"
                disabled={saving}
                autoComplete="off"
              />
            </div>
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
            <button
              type="button"
              className="installation-gate__primary"
              onClick={handleRequest}
              disabled={
                backendUnavailable ||
                saving ||
                !selectedProjectId ||
                !installationLinkToken.trim()
              }
            >
              <FaLink /> {saving ? "Enviando..." : "Solicitar vinculacion"}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
