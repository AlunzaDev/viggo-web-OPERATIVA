import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./OperationalTicker.css";

export type OperationalTickerTone = "info" | "success" | "warning" | "danger";

export type OperationalTickerItem = {
  id: string;
  tone: OperationalTickerTone;
  label: string;
  value?: string;
  meta?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

const TICKER_PIXELS_PER_SECOND = 72;

type OperationalTickerProps = {
  ariaLabel: string;
  items: OperationalTickerItem[];
  className?: string;
};

export function OperationalTicker({ ariaLabel, items, className = "" }: OperationalTickerProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [tickerSpeedSeconds, setTickerSpeedSeconds] = useState(38);

  useLayoutEffect(() => {
    if (items.length === 0) {
      setTickerSpeedSeconds(38);
      return;
    }

    const track = trackRef.current;
    if (!track || typeof window === "undefined") return;

    const measure = () => {
      const scrollDistance = track.scrollWidth / 2;
      if (!Number.isFinite(scrollDistance) || scrollDistance <= 0) return;
      const nextSpeedSeconds = scrollDistance / TICKER_PIXELS_PER_SECOND;
      setTickerSpeedSeconds((current) =>
        Math.abs(current - nextSpeedSeconds) < 0.2 ? current : nextSpeedSeconds
      );
    };

    measure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    resizeObserver?.observe(track);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  if (items.length === 0) return null;

  const repeatCount = Math.max(2, Math.ceil(10 / items.length));
  const tickerItems = Array.from({ length: repeatCount }, () => items).flat();
  const trackItems = [...tickerItems, ...tickerItems];
  const tickerStyle = {
    "--ticker-speed": `${tickerSpeedSeconds}s`,
  } as CSSProperties;

  return (
    <section
      className={`operational-ticker ${className}`.trim()}
      aria-label={ariaLabel}
      style={tickerStyle}
    >
      <div className="operational-ticker__rail">
        <div ref={trackRef} className="operational-ticker__track">
          {trackItems.map((item, index) => {
            const isCycleEnd = (index + 1) % tickerItems.length === 0;
            const itemClassName = `operational-ticker__item operational-ticker__item--${item.tone}${
              isCycleEnd ? " operational-ticker__item--cycle-end" : ""
            }`;
            const content = (
              <>
                {item.icon ? (
                  <span className="operational-ticker__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span className="operational-ticker__label">{item.label}</span>
                {item.value ? <strong>{item.value}</strong> : null}
                {item.meta ? <span className="operational-ticker__meta">{item.meta}</span> : null}
              </>
            );

            return item.onClick ? (
              <button
                key={`${item.id}-${index}`}
                type="button"
                className={itemClassName}
                onClick={item.onClick}
              >
                {content}
              </button>
            ) : (
              <div
                key={`${item.id}-${index}`}
                className={itemClassName}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
