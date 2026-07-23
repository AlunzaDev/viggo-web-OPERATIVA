import type { ReactNode } from "react";
import "./InfoChip.css";

type InfoChipTone = "default" | "accent" | "success" | "warning" | "info" | "muted";

type InfoChipProps = {
  children: ReactNode;
  icon?: ReactNode;
  tone?: InfoChipTone;
  mono?: boolean;
  className?: string;
};

export function InfoChip({
  children,
  icon,
  tone = "default",
  mono = false,
  className = "",
}: InfoChipProps) {
  const rootClassName = [
    "info-chip",
    `is-${tone}`,
    mono ? "is-mono" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClassName}>
      {icon ? <span className="info-chip__icon">{icon}</span> : null}
      <span className="info-chip__label">{children}</span>
    </span>
  );
}
