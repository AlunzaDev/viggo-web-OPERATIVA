import type { ReactNode } from "react";
import "./StatusOverviewCard.css";

type StatusOverviewCardProps = {
  className?: string;
  type?: "button" | "div";
  onClick?: () => void;
  topStart?: ReactNode;
  topEnd?: ReactNode;
  title: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  ariaLabel?: string;
};

export function StatusOverviewCard({
  className = "",
  type = "button",
  onClick,
  topStart,
  topEnd,
  title,
  footer,
  children,
  ariaLabel,
}: StatusOverviewCardProps) {
  const classes = ["status-overview-card", className].filter(Boolean).join(" ");

  if (type === "div") {
    return (
      <div className={classes} aria-label={ariaLabel}>
        {topStart || topEnd ? (
          <div className="status-overview-card__topbar">
            <div className="status-overview-card__topstart">{topStart}</div>
            <div className="status-overview-card__topend">{topEnd}</div>
          </div>
        ) : null}

        <header className="status-overview-card__header">
          <div className="status-overview-card__title">{title}</div>
        </header>

        {children}
        {footer ? <div className="status-overview-card__footer">{footer}</div> : null}
      </div>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} aria-label={ariaLabel}>
      {topStart || topEnd ? (
        <div className="status-overview-card__topbar">
          <div className="status-overview-card__topstart">{topStart}</div>
          <div className="status-overview-card__topend">{topEnd}</div>
        </div>
      ) : null}

      <header className="status-overview-card__header">
        <div className="status-overview-card__title">{title}</div>
      </header>

      {children}
      {footer ? <div className="status-overview-card__footer">{footer}</div> : null}
    </button>
  );
}
