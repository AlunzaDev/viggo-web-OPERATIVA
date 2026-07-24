import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FaCheckCircle, FaLink, FaLock, FaParking, FaSyncAlt } from "react-icons/fa";
import {
  getInstallationCloudProjects,
  getLocalInstallation,
  requestLocalInstallationProject,
  type LocalInstallation,
} from "../../services/installation/installation.api";
import { ScreenLoader } from "../shared/loading/ScreenLoader";
import "./InstallationGate.css";

type ProjectOption = {
  id: string;
  nombre: string;
  identificador: string;
};

type InstallationGateProps = {
  children: ReactNode;
};

const normalizeProject = (value: unknown): ProjectOption | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? record._id ?? "").trim();
  const nombre = String(record.nombre ?? "").trim();
  const identificador = String(record.identificador ?? "").trim();
  if (!id || !nombre) return null;
  return { id, nombre, identificador };
};

const getStatusCopy = (installation: LocalInstallation | null) => {
  if (!installation) return "Selecciona el proyecto de esta terminal local.";
  if (installation.status === "requested") return "Solicitud enviada. Esperando aprobacion en NUBEADMIN.";
  if (installation.status === "rejected") return "Solicitud rechazada. Revisa el motivo y solicita de nuevo.";
  if (installation.status === "approved") return "Solicitud aprobada. Recarga para terminar la vinculacion.";
  return "Selecciona el proyecto de esta terminal local.";
};

export function InstallationGate({ children }: InstallationGateProps) {
  const [installation, setInstallation] = useState<LocalInstallation | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [installationLinkToken, setInstallationLinkToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const isWaitingApproval =
    installation?.status === "requested" || installation?.status === "approved";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const installationResult = await getLocalInstallation();
      setInstallation(installationResult);

      if (!installationResult.configured) {
        const projectRows = await getInstallationCloudProjects();
        const nextProjects = projectRows
          .map((project) => normalizeProject(project))
          .filter((project): project is ProjectOption => Boolean(project));

        setProjects(nextProjects);
        setSelectedProjectId(nextProjects[0]?.id ?? "");
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la configuracion de instalacion.",
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
      setError("Selecciona un proyecto para solicitar la vinculacion.");
      return;
    }
    if (!installationLinkToken.trim()) {
      setError("Ingresa el token de vinculacion del proyecto.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const nextInstallation = await requestLocalInstallationProject(
        selectedProjectId,
        installationLinkToken.trim(),
      );
      setInstallation(nextInstallation);
    } catch (requestError) {
      setError(
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
        <p>{getStatusCopy(installation)}</p>
        <p className="installation-gate__id">
          ID de instalacion: <strong>{installation?.installationId ?? "sin identificar"}</strong>
        </p>

        {installation?.status === "rejected" && installation.reviewNote ? (
          <p className="installation-gate__error">{installation.reviewNote}</p>
        ) : null}

        {!isWaitingApproval ? (
          <>
            <div className="installation-gate__selector">
              <label htmlFor="installation-project">Proyecto en NUBEADMIN</label>
              <select
                id="installation-project"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={saving || projects.length === 0}
              >
                {projects.length === 0 ? (
                  <option value="">No hay proyectos disponibles en nube</option>
                ) : null}
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
                placeholder="Ingresa el token generado en NUBEADMIN"
                disabled={saving}
                autoComplete="off"
              />
            </div>
          </>
        ) : (
          <article className="installation-gate__preview">
            <FaParking />
            <div>
              <strong>{installation?.proyectoNombre ?? "Proyecto solicitado"}</strong>
              <span>{installation?.proyectoIdentificador ?? installation?.cloudRequestId}</span>
            </div>
          </article>
        )}

        {error ? <p className="installation-gate__error">{error}</p> : null}

        <div className="installation-gate__actions">
          <button type="button" onClick={() => void loadData()} disabled={saving}>
            <FaSyncAlt /> Revisar estado
          </button>
          {!isWaitingApproval ? (
            <button
              type="button"
              className="installation-gate__primary"
              onClick={handleRequest}
              disabled={saving || !selectedProjectId || !installationLinkToken.trim()}
            >
              <FaLink /> {saving ? "Enviando..." : "Solicitar vinculacion"}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
