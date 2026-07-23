import type { ReactNode } from "react";
import "./StatusOverviewGroupHeader.css";

type StatusOverviewGroupHeaderProps = {
  className?: string;
  title: ReactNode;
  meta?: ReactNode;
  summary?: ReactNode;
};

export function StatusOverviewGroupHeader({
  className = "",
  title,
  meta,
  summary,
}: StatusOverviewGroupHeaderProps) {
  const classes = ["status-overview-group-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="status-overview-group-header__headline">
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </div>

      {summary ? <div className="status-overview-group-header__summary">{summary}</div> : null}
    </header>
  );
}
