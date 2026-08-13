import {
  MESH_CENTRAL_TERMINAL_VIEW_MODE,
  type RemoteSupportViewMode,
} from "./remote-support-view-mode";

type MeshCentralWindow = Window & {
  currentNode?: unknown;
  desktop?: { State?: number };
  terminal?: { State?: number };
  connectDesktop?: (event: unknown, connectionType: number) => void;
  connectTerminal?: (event?: unknown, connectionType?: number) => void;
  deskToggleFull?: () => void;
};

type AutomationOptions = {
  iframe: HTMLIFrameElement | null;
  viewMode: RemoteSupportViewMode;
  onReady?: () => void;
};

export const automateMeshCentralIframe = ({
  iframe,
  viewMode,
  onReady,
}: AutomationOptions) => {
  if (!iframe) return;

  let attempts = 0;
  const maxAttempts = 24;

  const tryConnect = () => {
    attempts += 1;

    try {
      const meshWindow = iframe.contentWindow as MeshCentralWindow | null;
      const isTerminal = viewMode === MESH_CENTRAL_TERMINAL_VIEW_MODE;
      const isReady =
        Boolean(meshWindow?.currentNode) &&
        (isTerminal
          ? typeof meshWindow?.connectTerminal === "function"
          : typeof meshWindow?.connectDesktop === "function");

      if (isReady) {
        const getState = () =>
          isTerminal
            ? meshWindow?.terminal?.State ?? 0
            : meshWindow?.desktop?.State ?? 0;

        if (getState() === 0) {
          if (isTerminal) {
            meshWindow?.connectTerminal?.(null, 1);
          } else {
            meshWindow?.connectDesktop?.(null, 1);
          }
        }

        window.setTimeout(() => {
          try {
            if (typeof meshWindow?.deskToggleFull === "function") {
              meshWindow.deskToggleFull();
            } else {
              iframe.contentDocument
                ?.querySelector<HTMLElement>("[onclick*='deskToggleFull']")
                ?.click();
            }
          } catch {
            // MeshCentral puede seguir reconstruyendo controles internos.
          }

          let stateAttempts = 0;
          const checkConnectedState = () => {
            stateAttempts += 1;

            if (getState() > 0 || stateAttempts >= 16) {
              onReady?.();
              return;
            }

            window.setTimeout(checkConnectedState, 150);
          };

          window.setTimeout(checkConnectedState, 100);
        }, 320);
        return;
      }
    } catch {
      // El iframe puede seguir navegando; reintentamos.
    }

    if (attempts < maxAttempts) {
      window.setTimeout(tryConnect, 250);
    } else {
      onReady?.();
    }
  };

  window.setTimeout(tryConnect, 150);
};
