import type { ReactNode } from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./PageHeader.css";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  error?: ReactNode;
  hideTitle?: boolean;
  backLabel?: string;
  backAriaLabel?: string;
  onBack?: () => void;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  error,
  hideTitle = false,
  backLabel,
  backAriaLabel,
  onBack,
  className = "",
}: PageHeaderProps) {
  const rootClassName = ["page-header", className].filter(Boolean).join(" ");

  return (
    <header className={rootClassName}>
      {onBack ? (
        <button
          type="button"
          className="page-header__back"
          onClick={onBack}
          aria-label={backAriaLabel ?? backLabel ?? "Volver"}
          title={backAriaLabel ?? backLabel ?? "Volver"}
        >
          <FaArrowLeft aria-hidden="true" />
          {backLabel ? <span>{backLabel}</span> : null}
        </button>
      ) : null}

      <section className="page-header__main" aria-label="Resumen de la página">
        <div className="page-header__copy">
          {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
          <h1 className={`page-header__title ${hideTitle ? "is-visually-hidden" : ""}`}>{title}</h1>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>

        {meta ? (
          <div className="page-header__meta" aria-label="Datos de la página">
            {meta}
          </div>
        ) : null}
      </section>

      {error ? <p className="page-header__error">{error}</p> : null}
    </header>
  );
}
