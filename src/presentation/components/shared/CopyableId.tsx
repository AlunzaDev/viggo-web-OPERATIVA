import { useEffect, useState, type MouseEvent } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";
import { InfoChip } from "./InfoChip";
import "./CopyableId.css";

type CopyableIdProps = {
  value: string;
  tone?: "default" | "accent" | "success" | "warning" | "info" | "muted";
  className?: string;
  copyLabel?: string;
};

export function CopyableId({
  value,
  tone = "accent",
  className = "",
  copyLabel = "Copiar ID",
}: CopyableIdProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const timeoutId = window.setTimeout(() => {
      setIsCopied(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  const rootClassName = ["copyable-id", className].filter(Boolean).join(" ");

  return (
    <span className={rootClassName}>
      <InfoChip tone={tone} mono>
        {value}
      </InfoChip>
      <button
        type="button"
        className={`copyable-id__button ${isCopied ? "is-copied" : ""}`}
        onClick={handleCopy}
        aria-label={isCopied ? "ID copiado" : copyLabel}
        title={isCopied ? "Copiado" : copyLabel}
      >
        {isCopied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
      </button>
    </span>
  );
}
