import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FaCheckCircle, FaLink, FaLock, FaParking, FaSyncAlt } from "react-icons/fa";
import {
  type BrowserInstallationLocation,
  getInstallationCloudProjects,
  getLocalInstallation,
  requestLocalInstallationProject,
  type LocalInstallation,
} from "../../services/installation/installation.api";
import { ScreenLoader } from "../shared/loading/ScreenLoader";
import { showAppToast } from "../../utils/feedback/swalToast";
import "./InstallationGate.css";

type ProjectOption = {
  id: string;
  nombre: string;
  identificador: string;
};

type InstallationGateProps = {
  children: ReactNode;
};

type InstallationAlertTone = "error" | "warning";
const GEOLOCATION_TIMEOUT_MS = 8000;
const GEOLOCATION_RELAXED_TIMEOUT_MS = 15000;
const GEOLOCATION_CACHE_MAX_AGE_MS = 1000 * 60 * 5;
const LOCATION_REQUIRED_ERROR = "__location_required__";
const LOCATION_PERMISSION_DENIED_ERROR = "__location_permission_denied__";
const LOCATION_TIMEOUT_ERROR = "__location_timeout__";
const LOCATION_UNAVAILABLE_ERROR = "__location_unavailable__";
const LOCATION_FETCH_FAILED_ERROR = "__location_fetch_failed__";

const shouldRedirectToSessionExpired = (rawMessage: string): boolean => {
  const normalized = rawMessage.trim().toLowerCase();

  return (
    normalized.includes("user not found or inactive") ||
    normalized.includes("unauthorized") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid token")
  );
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
  if (installation.status === "requested") return "Solicitud enviada. Esperando aprobacion en la nube.";
  if (installation.status === "rejected") return "Solicitud rechazada. Revisa el motivo y solicita de nuevo.";
  if (installation.status === "approved") return "Solicitud aprobada. Recarga para terminar la vinculacion.";
  return "Selecciona el proyecto de esta terminal local.";
};

const getWaitingStateMeta = (installation: LocalInstallation | null) => {
  if (installation?.status === "approved") {
    return {
      title: "Aprobacion recibida",
      description:
        "Este punto local ya fue aprobado. Revisa el estado para terminar la vinculacion y entrar al sistema.",
    };
  }

  return {
    title: "Solicitud enviada correctamente",
    description:
      "La solicitud ya quedo en revision. Solo falta que la aprueben en administrativo para habilitar este punto local.",
  };
};

const normalizeInstallationError = (
  rawMessage: string,
): { title: string; message: string; tone: InstallationAlertTone } => {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (normalized.includes("nube no esta disponible para consultar proyectos")) {
    return {
      title: "No pudimos conectar con la nube",
      message: "Revisa la conexion o intenta nuevamente en unos momentos para cargar los proyectos disponibles.",
      tone: "warning",
    };
  }

  if (normalized.includes("selecciona un proyecto")) {
    return {
      title: "Selecciona un proyecto",
      message: "Elige el proyecto que quieres vincular antes de continuar.",
      tone: "warning",
    };
  }

  if (normalized.includes("ingresa el token")) {
    return {
      title: "Falta el token de vinculacion",
      message: "Captura el token del proyecto para poder solicitar la vinculacion de este punto local.",
      tone: "warning",
    };
  }

  if (normalized.includes("token de vinculacion invalido")) {
    return {
      title: "El token no coincide",
      message: "Verifica que el token pertenezca a este proyecto e intenta nuevamente.",
      tone: "error",
    };
  }

  if (normalized.includes("no hay proyectos disponibles")) {
    return {
      title: "No hay proyectos disponibles",
      message: "Todavia no hay proyectos listos para vincular desde la nube.",
      tone: "warning",
    };
  }

  if (message === LOCATION_REQUIRED_ERROR) {
    return {
      title: "Activa tu ubicacion",
      message: "Necesitamos la ubicacion del navegador para validar que esta instalacion este cerca del proyecto antes de solicitar la vinculacion.",
      tone: "warning",
    };
  }

  if (message === LOCATION_PERMISSION_DENIED_ERROR) {
    return {
      title: "Permite la ubicacion",
      message: "Da permiso de ubicacion en el navegador e intenta nuevamente.",
      tone: "warning",
    };
  }

  if (message === LOCATION_TIMEOUT_ERROR) {
    return {
      title: "No se obtuvo la ubicacion a tiempo",
      message: "El navegador tardó demasiado en resolver tu ubicacion. Intenta de nuevo en un lugar con mejor senal o GPS.",
      tone: "warning",
    };
  }

  if (message === LOCATION_UNAVAILABLE_ERROR) {
    return {
      title: "Ubicacion no disponible",
      message: "El dispositivo no pudo determinar tu ubicacion actual. Revisa si la ubicacion del sistema esta activa e intenta de nuevo.",
      tone: "warning",
    };
  }

  if (message === LOCATION_FETCH_FAILED_ERROR) {
    return {
      title: "No se pudo obtener la ubicacion",
      message: "El navegador no pudo leer tu ubicacion en este momento. Intenta nuevamente en unos segundos.",
      tone: "warning",
    };
  }

  return {
    title: "No pudimos completar la accion",
    message: message || "Intenta nuevamente en un momento.",
    tone: "error",
  };
};

export function InstallationGate({ children }: InstallationGateProps) {
  const [installation, setInstallation] = useState<LocalInstallation | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [installationLinkToken, setInstallationLinkToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const isWaitingApproval =
    installation?.status === "requested" || installation?.status === "approved";
  const waitingStateMeta = getWaitingStateMeta(installation);

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
      const installationResult = await getLocalInstallation();
      setInstallation(installationResult);

      if (!installationResult.configured) {
        const projectRows = await getInstallationCloudProjects();
        const nextProjects = projectRows
          .map((project) => normalizeProject(project))
          .filter((project): project is ProjectOption => Boolean(project));

        setProjects(nextProjects);
        setSelectedProjectId("");
      }
    } catch (loadError) {
      showInstallationAlert(
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
      showInstallationAlert("Selecciona un proyecto para solicitar la vinculacion.");
      return;
    }
    if (!installationLinkToken.trim()) {
      showInstallationAlert("Ingresa el token de vinculacion del proyecto.");
      return;
    }

    setSaving(true);
    try {
      const locationResolution = await resolveBrowserLocation();
      if (!locationResolution.location) {
        showInstallationAlert(locationResolution.errorMessage ?? LOCATION_REQUIRED_ERROR);
        return;
      }
      const nextInstallation = await requestLocalInstallationProject(
        selectedProjectId,
        installationLinkToken.trim(),
        locationResolution.location,
      );
      setInstallation(nextInstallation);
    } catch (requestError) {
      showInstallationAlert(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo solicitar la vinculacion.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resolveBrowserLocation = async (): Promise<{
    location?: BrowserInstallationLocation;
    errorMessage?: string;
  }> => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return { errorMessage: LOCATION_REQUIRED_ERROR };
    }

    const getPermissionState = async (): Promise<PermissionState | "unknown"> => {
      if (!("permissions" in navigator) || typeof navigator.permissions?.query !== "function") {
        return "unknown";
      }

      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        return permission.state;
      } catch {
        return "unknown";
      }
    };

    const getPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    const toBrowserLocation = (
      position: GeolocationPosition,
    ): BrowserInstallationLocation | undefined => {
      const longitude = Number(position.coords.longitude);
      const latitude = Number(position.coords.latitude);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return undefined;
      }

      return {
        coordinates: [longitude, latitude],
        accuracy: Number.isFinite(position.coords.accuracy)
          ? Number(position.coords.accuracy)
          : undefined,
        capturedAt: Date.now(),
      };
    };

    const attempts: PositionOptions[] = [
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_CACHE_MAX_AGE_MS,
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_RELAXED_TIMEOUT_MS,
        maximumAge: 0,
      },
    ];

    let lastErrorCode: number | null = null;
    const permissionState = await getPermissionState();

    for (const attempt of attempts) {
      try {
        const position = await getPosition(attempt);
        const browserLocation = toBrowserLocation(position);
        if (browserLocation) return { location: browserLocation };
      } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
          lastErrorCode = Number((error as GeolocationPositionError).code);
          console.warn("[InstallationGate] Geolocation attempt failed", {
            code: lastErrorCode,
            message:
              "message" in (error as object)
                ? String((error as { message?: unknown }).message ?? "")
                : "",
            permissionState,
            attempt,
          });
          if (lastErrorCode === 1) {
            return {
              errorMessage:
                permissionState === "granted"
                  ? LOCATION_FETCH_FAILED_ERROR
                  : LOCATION_PERMISSION_DENIED_ERROR,
            };
          }
        } else {
          console.warn("[InstallationGate] Geolocation attempt failed with unknown error", {
            error,
            permissionState,
            attempt,
          });
        }
        continue;
      }
    }

    if (lastErrorCode === 3) {
      return { errorMessage: LOCATION_TIMEOUT_ERROR };
    }

    if (lastErrorCode === 2) {
      return { errorMessage: LOCATION_UNAVAILABLE_ERROR };
    }

    return {
      errorMessage:
        permissionState === "granted"
          ? LOCATION_FETCH_FAILED_ERROR
          : LOCATION_REQUIRED_ERROR,
    };
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
              <label htmlFor="installation-project">Proyecto en la nube</label>
              <select
                id="installation-project"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={saving || projects.length === 0}
              >
                {projects.length > 0 ? (
                  <option value="">Selecciona un proyecto</option>
                ) : null}
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
                placeholder="Ingresa el token generado al crear el proyecto"
                disabled={saving}
                autoComplete="off"
              />
            </div>
          </>
        ) : (
          <div className="installation-gate__waiting-shell">
            <article className="installation-gate__waiting-banner">
              <span className="installation-gate__waiting-badge">
                <FaCheckCircle />
                {installation?.status === "approved" ? "Aprobado" : "En revision"}
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
        )}

        <div className="installation-gate__actions">
          <button type="button" onClick={() => void loadData()} disabled={saving}>
            <FaSyncAlt /> {isWaitingApproval ? "Actualizar vinculacion" : "Revisar estado"}
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
