import type { CSSProperties } from "react";

interface AtmIconProps {
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

export function AtmIcon({ alt = "ATM", className, style }: AtmIconProps) {
  const resolvedClassName = className ? `atm-icon ${className}` : "atm-icon";

  return (
    <span
      className={resolvedClassName}
      style={style}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    />
  );
}
