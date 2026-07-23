import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import "./BaseCombobox.css";

export type ComboOption = { id: string; nombre: string; className?: string };

type BaseComboboxProps = {
  placeholder: string;
  allLabel: string;
  iconTitle: string;
  options: ComboOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTriggerClick?: () => void;
  renderInPortal?: boolean;
  popClassName?: string;
  showAllOption?: boolean;
};

const ESTIMATED_POP_HEIGHT = 360;
const VIEWPORT_GUTTER = 8;
const PORTAL_Z_INDEX = "var(--vcombo-portal-z-index, 1400)";

const norm = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const classNames = (...tokens: Array<string | undefined | false>): string =>
  tokens.filter(Boolean).join(" ");

export function BaseCombobox({
  placeholder,
  allLabel,
  iconTitle,
  options,
  value,
  onChange,
  open: openProp,
  onOpenChange,
  onTriggerClick,
  renderInPortal = false,
  popClassName = "",
  showAllOption = true,
}: BaseComboboxProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openAbove, setOpenAbove] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({});
  const [themeName, setThemeName] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  });

  const isControlled = typeof openProp === "boolean";
  const open = isControlled ? openProp : internalOpen;

  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const updateTheme = () => {
      setThemeName(root.dataset.theme === "light" ? "light" : "dark");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === open) return;
      if (!isControlled) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange, open]
  );

  const selectedOption = useMemo(() => {
    if (!value) return undefined;
    return options.find((option) => option.id === value);
  }, [options, value]);

  const selectedLabel = selectedOption?.nombre ?? (value ? value : allLabel);
  const selectedOptionClassName = selectedOption?.className;

  const filtered = useMemo(() => {
    const search = norm(query);
    if (!search) return options;
    return options.filter((option) => norm(option.nombre).includes(search));
  }, [options, query]);

  const updatePopoverPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenAbove =
      spaceBelow < ESTIMATED_POP_HEIGHT && spaceAbove > spaceBelow;

    setOpenAbove(shouldOpenAbove);

    if (!renderInPortal) return;

    const width = Math.max(
      240,
      Math.min(window.innerWidth - VIEWPORT_GUTTER * 2, rect.width)
    );
    const maxLeft = Math.max(
      VIEWPORT_GUTTER,
      window.innerWidth - width - VIEWPORT_GUTTER
    );
    const left = Math.min(Math.max(VIEWPORT_GUTTER, rect.left), maxLeft);
    const top = shouldOpenAbove ? rect.top - 10 : rect.bottom + 10;

    setPortalStyle({
      position: "fixed",
      left,
      top,
      width,
      zIndex: PORTAL_Z_INDEX,
      transform: shouldOpenAbove ? "translateY(-100%)" : undefined,
    });
  }, [renderInPortal]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!open) return;
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) return;
    setQuery("");
    setActiveIdx(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    window.setTimeout(() => inputRef.current?.focus(), 0);
    updatePopoverPosition();

    const onReposition = () => updatePopoverPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    setActiveIdx(() => {
      if (query.trim()) return 0;
      if (!value) return 0;
      const index = options.findIndex((option) => option.id === value);
      return index >= 0 ? index : 0;
    });

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, options, query, updatePopoverPosition, value]);

  useEffect(() => {
    if (!open) return;
    setActiveIdx((index) => Math.min(index, Math.max(0, filtered.length - 1)));
  }, [filtered.length, open]);

  const commit = useCallback(
    (id?: string) => {
      onChange(id);
      setOpen(false);
      setQuery("");
      setActiveIdx(0);
    },
    [onChange, setOpen]
  );

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIdx((prev) => {
        const max = Math.max(0, filtered.length - 1);
        const next = prev + delta;
        if (next < 0) return 0;
        if (next > max) return max;
        return next;
      });
    },
    [filtered.length]
  );

  const pickActive = useCallback(() => {
    const option = filtered[activeIdx];
    if (option) commit(option.id);
  }, [activeIdx, commit, filtered]);

  const shouldUsePortal = renderInPortal && typeof document !== "undefined";

  const solidThemeStyles = useMemo(() => {
    if (themeName === "light") {
      return {
        surface: "#ffffff",
        surfaceAlt: "#f2f4f8",
        text: "#1a1a1a",
        textSoft: "rgba(26, 26, 26, 0.45)",
        border: "rgba(20, 33, 66, 0.18)",
        hover: "#f6f8fc",
        active: "#e9eef9",
        divider: "rgba(20, 33, 66, 0.12)",
      };
    }

    return {
      surface: "#252528",
      surfaceAlt: "#333338",
      text: "#eaf1ff",
      textSoft: "rgba(234, 241, 255, 0.68)",
      border: "rgba(255, 255, 255, 0.14)",
      hover: "#2d2d31",
      active: "#333338",
      divider: "rgba(255, 255, 255, 0.12)",
    };
  }, [themeName]);

  const popClasses = classNames(
    "vcombo-pop",
    !shouldUsePortal && openAbove ? "vcombo-pop-above" : "",
    shouldUsePortal ? "vcombo-pop-portal" : "",
    popClassName
  );

  const popupStyle: CSSProperties = {
    boxSizing: "border-box",
    fontFamily: "var(--font-body)",
    lineHeight: 1.4,
    background: solidThemeStyles.surface,
    backgroundColor: solidThemeStyles.surface,
    color: solidThemeStyles.text,
    border: `1px solid ${solidThemeStyles.border}`,
    borderRadius: 16,
    opacity: 1,
    isolation: "isolate",
    mixBlendMode: "normal",
    pointerEvents: "auto",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    transform: "translateZ(0)",
    boxShadow: "none",
  };

  const listStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    maxHeight: "min(280px, 52dvh)",
    overflowX: "hidden",
    overflowY: "auto",
    padding: 0,
    border: `1px solid ${solidThemeStyles.border}`,
    borderRadius: 12,
    background: solidThemeStyles.surface,
    backgroundColor: solidThemeStyles.surface,
    boxSizing: "border-box",
    opacity: 1,
    mixBlendMode: "normal",
  };

  const searchStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
    padding: 0,
    border: `1px solid ${solidThemeStyles.border}`,
    borderRadius: 12,
    background: solidThemeStyles.surface,
    backgroundColor: solidThemeStyles.surface,
    boxSizing: "border-box",
    opacity: 1,
    mixBlendMode: "normal",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 40px 10px 12px",
    border: "none",
    borderRadius: 12,
    background: solidThemeStyles.surface,
    backgroundColor: solidThemeStyles.surface,
    color: solidThemeStyles.text,
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    opacity: 1,
    mixBlendMode: "normal",
  };

  const baseItemStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderLeft: "3px solid transparent",
    background: solidThemeStyles.surface,
    backgroundColor: solidThemeStyles.surface,
    color: solidThemeStyles.text,
    textAlign: "left",
    font: "inherit",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    opacity: 1,
    mixBlendMode: "normal",
  };

  const portalRootStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: PORTAL_Z_INDEX,
    pointerEvents: "none",
    isolation: "isolate",
    background: "transparent",
    opacity: 1,
    transform: "translateZ(0)",
  };

  const popupPositionStyle: CSSProperties = shouldUsePortal
    ? {
        position: "fixed",
        left: portalStyle.left,
        top: portalStyle.top,
        width: portalStyle.width,
        transform: portalStyle.transform,
      }
    : {};

  const popupCardBackdropStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: solidThemeStyles.surface,
    backgroundColor: solidThemeStyles.surface,
    borderRadius: 16,
    zIndex: 0,
    pointerEvents: "none",
    opacity: 1,
  };

  const popoverNode = (
    <div
      ref={popRef}
      className={popClasses}
      role="listbox"
      style={{
        ...popupStyle,
        ...popupPositionStyle,
      }}
    >
      <div aria-hidden="true" style={popupCardBackdropStyle} />
      {showAllOption ? (
        <>
          <button
            type="button"
            className={classNames("vcombo-item", !value ? "is-active" : "")}
            onClick={() => commit(undefined)}
            style={{
              ...baseItemStyle,
              background: !value ? solidThemeStyles.active : solidThemeStyles.surface,
              backgroundColor: !value ? solidThemeStyles.active : solidThemeStyles.surface,
              color: !value ? solidThemeStyles.text : solidThemeStyles.text,
              borderLeftColor: !value ? "var(--primary-color)" : "transparent",
            }}
          >
            {allLabel}
          </button>

          <div
            className="vcombo-sep"
            style={{ height: 1, background: solidThemeStyles.divider, flex: "0 0 auto" }}
          />
        </>
      ) : null}

      <div className="vcombo-list" style={listStyle}>
        {filtered.length === 0 ? (
          <div
            className="vcombo-empty"
            style={{
              background: solidThemeStyles.surface,
              backgroundColor: solidThemeStyles.surface,
              color: solidThemeStyles.textSoft,
            }}
          >
            No hay coincidencias para "{query.trim()}".
          </div>
        ) : (
          filtered.map((option, index) => {
            const isSelected = value === option.id;
            const isActive = index === activeIdx;
            const itemBackground = isSelected
              ? solidThemeStyles.active
              : isActive
                ? solidThemeStyles.hover
                : solidThemeStyles.surface;
            const itemBorderLeft = isSelected
              ? "var(--primary-color)"
              : isActive
                ? solidThemeStyles.border
                : "transparent";

            return (
              <button
                type="button"
                key={option.id}
                className={classNames(
                  "vcombo-item",
                  option.className,
                  isSelected ? "is-active" : "",
                  isActive ? "is-key-active" : ""
                )}
                onMouseEnter={() => setActiveIdx(index)}
                onClick={() => commit(option.id)}
                title={option.nombre}
                style={{
                  ...baseItemStyle,
                  background: itemBackground,
                  backgroundColor: itemBackground,
                  color: solidThemeStyles.text,
                  borderLeftColor: itemBorderLeft,
                }}
              >
                {option.nombre}
              </button>
            );
          })
        )}
      </div>

      <div
        className="vcombo-search"
        style={searchStyle}
      >
        <input
          ref={inputRef}
          className="vcombo-input"
          placeholder={placeholder}
          value={query}
          style={inputStyle}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveActive(1);
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              moveActive(-1);
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (filtered.length === 1) commit(filtered[0].id);
              else pickActive();
            }
          }}
        />

        {query ? (
          <button
            type="button"
            className="vcombo-clear"
            style={{
              background: solidThemeStyles.surfaceAlt,
              backgroundColor: solidThemeStyles.surfaceAlt,
              color: solidThemeStyles.text,
              border: `1px solid ${solidThemeStyles.border}`,
            }}
            onClick={() => {
              setQuery("");
              setActiveIdx(0);
              window.setTimeout(() => inputRef.current?.focus(), 0);
            }}
            aria-label="Limpiar busqueda"
            title="Limpiar"
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="vcombo" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="vcombo-btn"
        aria-label={iconTitle}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          background: solidThemeStyles.surface,
          backgroundColor: solidThemeStyles.surface,
          color: solidThemeStyles.text,
          borderColor: solidThemeStyles.border,
        }}
        onClick={() => {
          if (onTriggerClick) {
            onTriggerClick();
            return;
          }

          const nextOpen = !open;
          if (nextOpen) updatePopoverPosition();
          setOpen(nextOpen);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) {
              updatePopoverPosition();
              setOpen(true);
            }
          }
        }}
      >
        <span className={classNames("vcombo-btn-text", selectedOptionClassName)}>
          {selectedLabel}
        </span>
        <span className="vcombo-caret" aria-hidden="true" />
      </button>

      {open
        ? shouldUsePortal
          ? createPortal(
              <div style={portalRootStyle}>
                {popoverNode}
              </div>,
              document.body
            )
          : popoverNode
        : null}
    </div>
  );
}
