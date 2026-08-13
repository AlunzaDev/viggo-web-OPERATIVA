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
  if (!iframe) return () => undefined;

  let attempts = 0;
  let isCancelled = false;
  const timeoutIds = new Set<number>();
  const maxAttempts = 24;

  const schedule = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIds.delete(timeoutId);
      if (!isCancelled) callback();
    }, delay);

    timeoutIds.add(timeoutId);
    return timeoutId;
  };

  const tryConnect = () => {
    if (isCancelled) return;
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

        schedule(() => {
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
            if (isCancelled) return;
            stateAttempts += 1;

            if (getState() > 0 || stateAttempts >= 16) {
              onReady?.();
              return;
            }

            schedule(checkConnectedState, 150);
          };

          schedule(checkConnectedState, 100);
        }, 320);
        return;
      }
    } catch {
      // El iframe puede seguir navegando; reintentamos.
    }

    if (attempts < maxAttempts) {
      schedule(tryConnect, 250);
    } else {
      onReady?.();
    }
  };

  schedule(tryConnect, 150);

  return () => {
    isCancelled = true;
    timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIds.clear();
  };
};
