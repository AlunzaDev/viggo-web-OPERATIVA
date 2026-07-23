import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FaEraser, FaFilter, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import "./CrudActionsIsland.css";

type CrudActionsIslandProps = {
  showSearch?: boolean;
  searchValue: string;
  onSearchChange: ChangeEventHandler<HTMLInputElement>;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
  showFilter?: boolean;
  onToggleFilter?: () => void;
  isFilterOpen?: boolean;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  showCreate?: boolean;
  onCreate?: () => void;
  createLabel?: string;
  createIcon?: ReactNode;
  middleActions?: ReactNode;
  className?: string;
  layout?: "floating-dock" | "inline";
  searchRevealOnIconClick?: boolean;
  isBusy?: boolean;
};

export function CrudActionsIsland({
  showSearch = true,
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Buscar...",
  showFilter = false,
  onToggleFilter,
  isFilterOpen = false,
  activeFiltersCount = 0,
  onClearFilters,
  showCreate = false,
  onCreate,
  createLabel = "Crear",
  createIcon = <FaPlus />,
  middleActions,
  className = "",
  layout = "floating-dock",
  searchRevealOnIconClick = true,
  isBusy = false,
}: CrudActionsIslandProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const isFloatingDock = layout === "floating-dock";
  const enableIosHover = isFloatingDock && !shouldReduceMotion;
  const [isSearchExpanded, setIsSearchExpanded] = useState(
    () => !searchRevealOnIconClick || searchValue.trim().length > 0
  );

  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [floatingScale, setFloatingScale] = useState(1);

  useEffect(() => {
    if (!searchRevealOnIconClick) {
      setIsSearchExpanded(true);
      return;
    }
    if (searchValue.trim().length > 0) {
      setIsSearchExpanded(true);
    }
  }, [searchRevealOnIconClick, searchValue]);

  useEffect(() => {
    if (!isFloatingDock) return;
    document.documentElement.classList.add("has-floating-crud-island");
    document.documentElement.classList.add("has-floating-crud-island-space");
    document.body.classList.add("has-floating-crud-island");
    document.body.classList.add("has-floating-crud-island-space");
    return () => {
      document.documentElement.classList.remove("has-floating-crud-island");
      document.documentElement.classList.remove("has-floating-crud-island-space");
      document.body.classList.remove("has-floating-crud-island");
      document.body.classList.remove("has-floating-crud-island-space");
    };
  }, [isFloatingDock]);

  useEffect(() => {
    if (!isSearchExpanded || !searchRevealOnIconClick) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (searchWrapRef.current?.contains(target)) return;
      if (searchValue.trim().length > 0) return;
      setIsSearchExpanded(false);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isSearchExpanded, searchRevealOnIconClick, searchValue]);

  const openSearch = useCallback(() => {
    setIsSearchExpanded(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  const closeSearch = useCallback(() => {
    if (searchValue.trim().length > 0) return;
    setIsSearchExpanded(false);
  }, [searchValue]);

  const handleSearchTriggerClick = useCallback(() => {
    if (isSearchExpanded) {
      if (searchValue.trim().length > 0) {
        onSearchClear?.();
        return;
      }
      setIsSearchExpanded(false);
      return;
    }
    openSearch();
  }, [isSearchExpanded, onSearchClear, openSearch, searchValue]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeSearch();
    },
    [closeSearch]
  );

  const rootClassName = [
    "crud-actions-island",
    isFloatingDock ? "crud-actions-island--floating-dock" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const hasMiddleActions = Children.toArray(middleActions).length > 0;
  const hasRightActions = showCreate || hasMiddleActions;

  useLayoutEffect(() => {
    if (!isFloatingDock || typeof window === "undefined") {
      setFloatingScale(1);
      return;
    }

    const measure = () => {
      const panel = panelRef.current;
      if (!panel) return;

      const viewportWidth = window.innerWidth;
      const horizontalSafetyGap = viewportWidth <= 640 ? 20 : 8;
      const availableWidth = Math.max(220, viewportWidth - horizontalSafetyGap);
      const naturalWidth = Math.ceil(Math.max(panel.scrollWidth, panel.offsetWidth));

      if (!naturalWidth || naturalWidth < 100) return;

      const nextScale = naturalWidth > availableWidth ? Math.min(1, availableWidth / naturalWidth) : 1;

      setFloatingScale((current) => (Math.abs(current - nextScale) < 0.001 ? current : nextScale));
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && panelRef.current
        ? new ResizeObserver(() => {
            window.requestAnimationFrame(measure);
          })
        : null;

    if (panelRef.current && resizeObserver) {
      resizeObserver.observe(panelRef.current);
    }

    window.addEventListener("resize", measure);

    const timeoutId = window.setTimeout(measure, 400);

    return () => {
      window.clearTimeout(timeoutId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    activeFiltersCount,
    createLabel,
    hasMiddleActions,
    isBusy,
    isFloatingDock,
    isSearchExpanded,
    middleActions,
    searchRevealOnIconClick,
    searchValue,
    showCreate,
    showFilter,
    showSearch,
  ]);

  const floatingDockStyle: CSSProperties | undefined = isFloatingDock
    ? ({
        x: "-50%",
        transformPerspective: 1000,
        maxWidth: "calc(100vw - 16px)",
        ["--crud-island-scale" as string]: String(floatingScale),
      } as CSSProperties)
    : undefined;

  const islandContent = (
    <motion.div
      className={rootClassName}
      style={floatingDockStyle}
      initial={isFloatingDock ? { y: 40 } : { y: 0 }}
      animate={isFloatingDock ? { y: 0 } : { y: 0 }}
      exit={isFloatingDock ? { y: 40 } : { y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        enableIosHover
          ? {
            y: -4,
            transition: { type: "spring", stiffness: 420, damping: 30, mass: 0.42 },
          }
          : undefined
      }
    >
      <div ref={panelRef} className="crud-actions-island__panel">
        <div className="crud-actions-island__group crud-actions-island__group--search-filter">
          {showSearch ? (
          <div
            ref={searchWrapRef}
            className={`crud-actions-island__search crud-actions-island__search--collapsible ${isSearchExpanded ? "is-open" : ""
              }`}
          >
            <button
              type="button"
              className="crud-actions-island__search-trigger"
              onClick={handleSearchTriggerClick}
              aria-label={isSearchExpanded ? "Cerrar búsqueda" : "Abrir búsqueda"}
              title={isSearchExpanded ? "Cerrar búsqueda" : "Abrir búsqueda"}
            >
              {isSearchExpanded ? <FaTimes /> : <FaSearch />}
            </button>

            <div className="crud-actions-island__search-field">
              <label className="crud-actions-island__search-input-wrap" htmlFor="crud-island-search">
                <FaSearch className="crud-actions-island__search-icon" />
                <input
                  id="crud-island-search"
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={onSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                />
                {Boolean(onSearchClear && searchValue.trim().length > 0) && (
                  <button
                    type="button"
                    className="crud-actions-island__icon-btn crud-actions-island__icon-btn--search-clear"
                    onClick={onSearchClear}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                  >
                    <FaTimes />
                  </button>
                )}
              </label>
            </div>
          </div>
          ) : null}

          {showFilter && (
            <button
              type="button"
              className={`crud-actions-island__icon-btn ${isFilterOpen ? "is-open" : ""} ${isBusy ? "is-busy" : ""}`}
              onClick={onToggleFilter}
              aria-label="Abrir filtros"
              title="Abrir filtros"
            >
              <FaFilter />
              {isBusy && <span className="crud-actions-island__busy-indicator" aria-hidden="true" />}
              {activeFiltersCount > 0 && (
                <span className="crud-actions-island__badge">{activeFiltersCount}</span>
              )}
            </button>
          )}

          {showFilter && activeFiltersCount > 0 && onClearFilters && (
            <button
              type="button"
              className="crud-actions-island__icon-btn"
              onClick={onClearFilters}
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <FaEraser />
            </button>
          )}
        </div>

        {hasRightActions ? <span className="crud-actions-island__separator" aria-hidden="true" /> : null}

        {hasRightActions ? (
          <div className="crud-actions-island__actions">
            {middleActions}
            {showCreate && (
              <button className="crud-actions-island__create" onClick={onCreate} type="button">
                {createIcon}
                <span>{createLabel}</span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );

  if (isFloatingDock && typeof window !== "undefined") {
    return createPortal(islandContent, document.body);
  }

  return islandContent;
}
