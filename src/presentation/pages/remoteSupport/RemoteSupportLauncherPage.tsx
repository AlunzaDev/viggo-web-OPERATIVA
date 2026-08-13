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
import {
  getRemoteSupportPrewarmKey,
  hasWarmMeshCentralSession,
} from "../../services/remoteSupport/remote-support-prewarm-cache";
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

const openRemoteSupportPopup = (url: string) => {
  if (!url) return;

  const width = Math.min(window.screen.availWidth || 1400, 1400);
  const height = Math.min(window.screen.availHeight || 900, 900);
  const left = Math.max(((window.screen.availWidth || width) - width) / 2, 0);
  const top = Math.max(((window.screen.availHeight || height) - height) / 2, 0);

  const features = [
    "popup=yes",
    "toolbar=no",
    "location=no",
    "menubar=no",
    "status=no",
    "scrollbars=yes",
    "resizable=yes",
    `width=${Math.floor(width)}`,
    `height=${Math.floor(height)}`,
    `left=${Math.floor(left)}`,
    `top=${Math.floor(top)}`,
  ].join(",");

  window.open(url, "viggo-remote-support", features)?.focus();
};

type MeshCentralWindow = Window & {
  currentNode?: unknown;
  desktop?: { State?: number };
  terminal?: { State?: number };
  connectDesktop?: (event: unknown, connectionType: number) => void;
  connectTerminal?: (event?: unknown, connectionType?: number) => void;
  deskToggleFull?: () => void;
};

const automateEmbeddedDesktop = (
  iframe: HTMLIFrameElement | null,
  viewMode: number,
  modeLabel: string,
  onStatusChange: (status: string) => void,
  onReady: () => void,
) => {
  if (!iframe) return;

  let attempts = 0;
  const maxAttempts = 24;

  const revealWhenConnected = (
    getState: () => number,
    readyStatus: string,
    fallbackDelay = 500,
  ) => {
    let stateAttempts = 0;
    const maxStateAttempts = 16;

    const checkState = () => {
      stateAttempts += 1;
      const state = getState();

      if (state > 0 || stateAttempts >= maxStateAttempts) {
        onStatusChange(readyStatus);
        onReady();
        return;
      }

      window.setTimeout(checkState, 150);
    };

    window.setTimeout(checkState, fallbackDelay);
  };

  const tryAutomate = () => {
    attempts += 1;

    try {
      const meshWindow = iframe.contentWindow as MeshCentralWindow | null;
      const meshDocument = iframe.contentDocument;
      const isReady =
        Boolean(meshWindow?.currentNode) &&
        (viewMode === 11
          ? typeof meshWindow?.connectDesktop === "function"
          : typeof meshWindow?.connectTerminal === "function");

      if (isReady) {
        if (viewMode === 12) {
          const terminalState = meshWindow?.terminal?.State ?? 0;

          if (terminalState === 0) {
            onStatusChange("Conectando terminal remota automaticamente...");
            meshWindow?.connectTerminal?.(null, 1);
          }

          window.setTimeout(() => {
            try {
              onStatusChange("Activando vista completa de MeshCentral...");
              if (typeof meshWindow?.deskToggleFull === "function") {
                meshWindow.deskToggleFull();
              } else {
                meshDocument
                  ?.querySelector<HTMLElement>("[onclick*='deskToggleFull']")
                  ?.click();
              }
            } catch {
              // Si MeshCentral no permite expandir terminal todavia, mostramos la terminal conectada.
            }
            revealWhenConnected(
              () => meshWindow?.terminal?.State ?? 0,
              "terminal remota lista dentro de Viggo.",
              100,
            );
          }, 220);

          return;
        }

        const desktopState = meshWindow?.desktop?.State ?? 0;

        if (desktopState === 0) {
          onStatusChange("Conectando pantalla remota automaticamente...");
          meshWindow?.connectDesktop?.(null, 1);
        }

        window.setTimeout(() => {
          try {
            onStatusChange("Activando vista completa de MeshCentral...");
            if (typeof meshWindow?.deskToggleFull === "function") {
              meshWindow.deskToggleFull();
            } else {
              meshDocument
                ?.querySelector<HTMLElement>("[onclick*='deskToggleFull']")
                ?.click();
            }
          } catch {
            // Si MeshCentral no permite expandir todavia, mostramos la pantalla conectada.
          }
          revealWhenConnected(
            () => meshWindow?.desktop?.State ?? 0,
            "pantalla remota lista dentro de Viggo.",
            100,
          );
        }, 320);

        return;
      }
    } catch {
      // El iframe todavia puede estar navegando; reintentamos abajo.
    }

    if (attempts < maxAttempts) {
      window.setTimeout(tryAutomate, 250);
    } else {
      onStatusChange(`${modeLabel} lista. Si no conecta, usa Connect.`);
      onReady();
    }
  };

  window.setTimeout(tryAutomate, 150);
};

export function RemoteSupportLauncherPage() {
  const navigate = useNavigate();
  const { moduleId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const viewMode = normalizeViewMode(searchParams.get("viewMode"));
  const modeLabel = SUPPORT_MODE_LABELS[viewMode] ?? SUPPORT_MODE_LABELS[10];
  const modeIcon = SUPPORT_MODE_ICONS[viewMode] ?? SUPPORT_MODE_ICONS[10];
  const hasStartedRef = useRef(false);
  const embeddedFrameRef = useRef<HTMLIFrameElement | null>(null);
  const embeddedAutomationUrlRef = useRef("");
  const [status, setStatus] = useState("Preparando sesion segura...");
  const [targetUrl, setTargetUrl] = useState("");
  const [embeddedUrl, setEmbeddedUrl] = useState("");
  const [isEmbeddedReady, setIsEmbeddedReady] = useState(false);
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
        const hasWarmSession = hasWarmMeshCentralSession(
          getRemoteSupportPrewarmKey(moduleId),
        );
        setStatus(
          hasWarmSession
            ? `Usando sesion preparada para ${session.deviceName || moduleName}...`
            : `Autenticando MeshCentral para ${session.deviceName || moduleName}...`,
        );

        window.setTimeout(() => {
          if (viewMode === 10) {
            setStatus(`Abriendo ${modeLabel}...`);
            window.location.href = session.targetUrl;
            return;
          }

          if (hasWarmSession) {
            setStatus(`Abriendo ${modeLabel} del equipo...`);
            setEmbeddedUrl(toEmbeddedMeshCentralUrl(session.targetUrl));
            return;
          }

          setStatus(`Autenticando MeshCentral dentro de Viggo...`);
          setEmbeddedUrl(toEmbeddedMeshCentralUrl(session.loginUrl || session.url));
          window.setTimeout(() => {
            setStatus(`Abriendo ${modeLabel} del equipo...`);
            setEmbeddedUrl(toEmbeddedMeshCentralUrl(session.targetUrl));
          }, 350);
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
          className={`remote-support-launcher__card${isEmbeddedReady ? " is-embedded-ready" : ""}`}
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
          <section
            className={`remote-support-launcher__embedded-panel${isEmbeddedReady ? " is-ready" : ""}`}
            aria-hidden={!isEmbeddedReady}
          >
            <div className="remote-support-launcher__embedded-toolbar">
              <div>
                <p className="remote-support-launcher__embedded-eyebrow">
                  Sesion embebida
                </p>
                <h2>{modeLabel}</h2>
              </div>

              <button
                type="button"
                className="remote-support-launcher__button"
                onClick={() => openRemoteSupportPopup(targetUrl)}
              >
                Abrir externo
              </button>
            </div>

            <iframe
              ref={embeddedFrameRef}
              className="remote-support-launcher__embedded-frame"
              src={embeddedUrl}
              title={`MeshCentral ${modeLabel}`}
              allow="clipboard-read; clipboard-write; fullscreen"
              onLoad={() => {
                if (![11, 12].includes(viewMode)) return;
                if (!embeddedUrl || embeddedAutomationUrlRef.current === embeddedUrl) {
                  return;
                }

                embeddedAutomationUrlRef.current = embeddedUrl;
                automateEmbeddedDesktop(
                  embeddedFrameRef.current,
                  viewMode,
                  modeLabel,
                  setStatus,
                  () => {
                    setIsEmbeddedReady(true);
                  },
                );
              }}
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
