import type { ReactNode } from "react";
import "./StatusOverviewCardGrid.css";

type StatusOverviewCardGridProps = {
  className?: string;
  children: ReactNode;
};

export function StatusOverviewCardGrid({
  className = "",
  children,
}: StatusOverviewCardGridProps) {
  const classes = ["status-overview-card-grid", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}
