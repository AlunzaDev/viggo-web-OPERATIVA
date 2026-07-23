import { usePageLoadingSignal } from "./usePageLoading";
import "./ScreenLoader.css";

type ScreenLoaderProps = {
  label?: string;
  fullscreen?: boolean;
  registerPageLoading?: boolean;
};

export function ScreenLoader({
  label = "sesion",
  fullscreen = true,
  registerPageLoading = !fullscreen,
}: ScreenLoaderProps) {
  const hasGlobalPageLoader = usePageLoadingSignal(registerPageLoading, label);

  if (!fullscreen && registerPageLoading && hasGlobalPageLoader) {
    return <div className="screen-loader screen-loader--global-placeholder" aria-hidden="true" />;
  }

  return (
    <div
      className={`screen-loader ${fullscreen ? "is-fullscreen" : "is-inline"}`}
      role="status"
      aria-live="polite"
    >
      <div className="screen-loader__card">
        <div className="screen-loader__spinner" aria-hidden="true" />
        <p className="screen-loader__text">Cargando {label}...</p>
      </div>
    </div>
  );
}
