import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FaDesktop,
  FaExternalLinkAlt,
  FaSpinner,
  FaTerminal,
} from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { useModules } from "../../hooks/modules/useModules";
import "./RemoteSupportLauncherPage.css";

const SUPPORT_MODE_LABELS: Record<number, string> = {
  10: "soporte remoto",
  11: "pantalla remota",
  12: "terminal remota",
};

const SUPPORT_MODE_ICONS: Record<number, ReactNode> = {
  10: <FaDesktop />,
  11: <FaDesktop />,
  12: <FaTerminal />,
};

const toEmbeddedMeshCentralUrl = (value: string) => {
  if (!value) return "";

  try {
    const url = new URL(value);
    return `/meshcentral${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
};

const normalizeViewMode = (value: string | null) => {
  const parsed = Number(value);
  return [10, 11, 12].includes(parsed) ? parsed : 10;
};

export function RemoteSupportLauncherPage() {
  const navigate = useNavigate();
  const { moduleId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const viewMode = normalizeViewMode(searchParams.get("viewMode"));
  const modeLabel = SUPPORT_MODE_LABELS[viewMode] ?? SUPPORT_MODE_LABELS[10];
  const modeIcon = SUPPORT_MODE_ICONS[viewMode] ?? SUPPORT_MODE_ICONS[10];
  const hasStartedRef = useRef(false);
  const [status, setStatus] = useState("Preparando sesion segura...");
  const [targetUrl, setTargetUrl] = useState("");
  const [embeddedUrl, setEmbeddedUrl] = useState("");
  const [error, setError] = useState("");
  const { createRemoteSupportSessionUrl } = useModules();

  usePageTitle("Soporte remoto");

  const moduleName = useMemo(
    () => searchParams.get("moduleName") || "equipo operativo",
    [searchParams],
  );

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const openRemoteSupport = async () => {
      try {
        if (!moduleId) {
          throw new Error("No se recibio el modulo para abrir soporte remoto.");
        }

        setStatus("Generando acceso temporal a MeshCentral...");
        const session = await createRemoteSupportSessionUrl(moduleId, viewMode);

        setTargetUrl(session.targetUrl);
        setStatus(
          `Autenticando MeshCentral para ${session.deviceName || moduleName}...`,
        );

        window.setTimeout(() => {
          if (viewMode === 10) {
            setStatus(`Abriendo ${modeLabel}...`);
            window.location.href = session.targetUrl;
            return;
          }

          setStatus(`Iniciando ${modeLabel} dentro de Viggo...`);
          setEmbeddedUrl(
            toEmbeddedMeshCentralUrl(session.loginUrl || session.url),
          );

          window.setTimeout(() => {
            setStatus(`${modeLabel} lista dentro de Viggo.`);
            setEmbeddedUrl(toEmbeddedMeshCentralUrl(session.targetUrl));
          }, 3000);
        }, 300);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo abrir soporte remoto.";
        setError(message);
        setStatus("No se pudo completar la conexion.");
      }
    };

    void openRemoteSupport();
  }, [
    createRemoteSupportSessionUrl,
    modeLabel,
    moduleId,
    moduleName,
    viewMode,
  ]);

  return (
    <main className="remote-support-launcher">
      <section className="remote-support-launcher__stage" aria-live="polite">
        <div className="remote-support-launcher__brand">
          <span className="remote-support-launcher__brand-mark">V</span>
          <span>Viggo</span>
        </div>

        <article
          className={`remote-support-launcher__card${embeddedUrl ? " is-embedded-ready" : ""}`}
        >
          <div className="remote-support-launcher__icon">
            {error ? <FaExternalLinkAlt /> : modeIcon}
          </div>
          <p className="remote-support-launcher__eyebrow">
            Viggo Remote Support
          </p>
          <h1>
            {error ? "No pudimos abrir MeshCentral" : `Conectando ${modeLabel}`}
          </h1>
          <p className="remote-support-launcher__description">
            {error
              ? error
              : `Estamos preparando el acceso seguro para ${moduleName}. Si ves MeshCentral un instante, es normal: ahi se crea la sesion temporal.`}
          </p>

          <div
            className={`remote-support-launcher__status${error ? " is-error" : ""}`}
          >
            {!error ? (
              <FaSpinner className="remote-support-launcher__spinner" />
            ) : null}
            <span>{status}</span>
          </div>

          <div className="remote-support-launcher__actions">
            {targetUrl ? (
              <a
                className="remote-support-launcher__button primary"
                href={targetUrl}
              >
                Abrir de nuevo
              </a>
            ) : null}
            <button
              type="button"
              className="remote-support-launcher__button"
              onClick={() => navigate(-1)}
            >
              Volver a Viggo
            </button>
          </div>
        </article>
        {embeddedUrl ? (
          <section className="remote-support-launcher__embedded-panel">
            <div className="remote-support-launcher__embedded-toolbar">
              <div>
                <p className="remote-support-launcher__embedded-eyebrow">
                  Sesion embebida
                </p>
                <h2>{modeLabel}</h2>
              </div>

              <a
                className="remote-support-launcher__button"
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir externo
              </a>
            </div>

            <iframe
              className="remote-support-launcher__embedded-frame"
              src={embeddedUrl}
              title={`MeshCentral ${modeLabel}`}
              allow="clipboard-read; clipboard-write; fullscreen"
            />
          </section>
        ) : null}
        <div
          className="remote-support-launcher__workspace"
          aria-hidden="true"
        />
      </section>
    </main>
  );
}
