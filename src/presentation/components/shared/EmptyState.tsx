import type { ReactNode } from "react";
import {
  FaBan,
  FaExclamationTriangle,
  FaFilter,
  FaInbox,
  FaLock,
  FaPlus,
} from "react-icons/fa";
import "./EmptyState.css";

type EmptyStateTone = "empty" | "filtered" | "error" | "permission";

type EmptyStateProps = {
  tone?: EmptyStateTone;
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  className?: string;
};

const toneIcon: Record<EmptyStateTone, ReactNode> = {
  empty: <FaInbox aria-hidden="true" />,
  filtered: <FaFilter aria-hidden="true" />,
  error: <FaExclamationTriangle aria-hidden="true" />,
  permission: <FaLock aria-hidden="true" />,
};

export function EmptyState({
  tone = "empty",
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = "",
}: EmptyStateProps) {
  const rootClassName = ["empty-state", `is-${tone}`, className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName} role={tone === "error" ? "alert" : "status"}>
      <span className="empty-state__icon">{toneIcon[tone] ?? <FaBan aria-hidden="true" />}</span>
      <strong className="empty-state__title">{title}</strong>
      {description ? <span className="empty-state__description">{description}</span> : null}
      {actionLabel && onAction ? (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {actionIcon ?? <FaPlus aria-hidden="true" />}
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
