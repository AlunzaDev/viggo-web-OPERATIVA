import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaExternalLinkAlt, FaSpinner, FaTimes } from "react-icons/fa";
import { automateMeshCentralIframe } from "../../services/remoteSupport/meshcentral-iframe-automation";
import {
  getRemoteSupportViewLabel,
  MESH_CENTRAL_TERMINAL_VIEW_MODE,
  type RemoteSupportViewMode,
} from "../../services/remoteSupport/remote-support-view-mode";
import "./RemoteSupportViewerModal.css";

type Props = {
  open: boolean;
  viewMode: RemoteSupportViewMode;
  moduleName?: string;
  embedUrl: string;
  externalUrl: string;
  onClose: () => void;
};

export function RemoteSupportViewerModal({
  open,
  viewMode,
  moduleName = "Equipo remoto",
  embedUrl,
  externalUrl,
  onClose,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const automationStartedRef = useRef(false);
  const cleanupAutomationRef = useRef<(() => void) | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);

  const modeLabel = getRemoteSupportViewLabel(viewMode);
  const frameKey = `${moduleName}:${viewMode}:${embedUrl}`;

  const startAutomation = () => {
    if (!open || !embedUrl || automationStartedRef.current) return;
    automationStartedRef.current = true;

    cleanupAutomationRef.current?.();
    cleanupAutomationRef.current = automateMeshCentralIframe({
      iframe: iframeRef.current,
      viewMode,
      onReady: () => setIsFrameReady(true),
    });
  };

  useEffect(() => {
    cleanupAutomationRef.current?.();
    cleanupAutomationRef.current = null;

    if (!open) {
      setIsFrameReady(false);
      automationStartedRef.current = false;
      return;
    }

    setIsFrameReady(false);
    automationStartedRef.current = false;
    const startTimeout = window.setTimeout(startAutomation, 100);
    const fallback = window.setTimeout(() => setIsFrameReady(true), 5500);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(fallback);
      cleanupAutomationRef.current?.();
      cleanupAutomationRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, frameKey]);

  const content = (
    <div
      aria-hidden={!open}
      className={`remote-support-viewer${open ? " is-active" : ""}`}
    >
      <section className="remote-support-viewer__modal" aria-label={modeLabel}>
        {open ? (
          <div className="remote-support-viewer__toolbar">
            <div>
              <span>Sesión preparada</span>
              <strong>
                {moduleName} · {modeLabel}
              </strong>
            </div>
            <div className="remote-support-viewer__actions">
              {externalUrl ? (
                <a
                  className="remote-support-viewer__button"
                  href={externalUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaExternalLinkAlt />
                  Abrir externo
                </a>
              ) : null}
              <button
                type="button"
                className="remote-support-viewer__button"
                onClick={onClose}
              >
                <FaTimes />
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
        {embedUrl ? (
          <iframe
            key={frameKey}
            ref={iframeRef}
            src={embedUrl}
            title={`Precalentamiento ${modeLabel}`}
            tabIndex={-1}
            onLoad={startAutomation}
          />
        ) : null}
        {open && !isFrameReady ? (
          <div className="remote-support-viewer__loading">
            <div className="remote-support-viewer__loading-card">
              <span className="remote-support-viewer__loading-mark">V</span>
              <p className="remote-support-viewer__loading-eyebrow">
                Viggo Remote Support
              </p>
              <h3 className="remote-support-viewer__loading-title">
                Preparando {modeLabel}
              </h3>
              <div className="remote-support-viewer__loading-status">
                <FaSpinner />
                <span>
                  Conectando y ajustando{" "}
                  {viewMode === MESH_CENTRAL_TERMINAL_VIEW_MODE
                    ? "shell remota"
                    : "vista completa"}
                  ...
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
