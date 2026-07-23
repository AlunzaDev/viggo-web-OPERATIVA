import type { ReactNode } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { usePageLoadingSignal } from "../loading/usePageLoading";
import { ScreenLoader } from "../loading/ScreenLoader";
import "./MobileCardsList.css";

type MobileCardsListProps = {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: ReactNode | string;
  loadingMessage?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  pageSizeLabel?: string;
};

export function MobileCardsList({
  children,
  className = "",
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No se encontraron resultados.",
  loadingMessage = "Cargando datos...",
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  pageSizeLabel = "Tarjetas",
}: MobileCardsListProps) {
  const loadingLabel =
    loadingMessage.replace(/^Cargando\s+/i, "").replace(/\.\.\.$/, "") || "datos";
  const hasGlobalPageLoader = usePageLoadingSignal(isLoading, loadingLabel);
  const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);
  const rootClassName = ["mobile-cards-list", className].filter(Boolean).join(" ");

  return (
    <section className={rootClassName}>
      {isLoading ? (
        <div
          className={`mobile-cards-list__state ${
            hasGlobalPageLoader ? "mobile-cards-list__state--loading-placeholder" : ""
          }`.trim()}
          aria-hidden={hasGlobalPageLoader || undefined}
        >
          {hasGlobalPageLoader ? null : (
            <ScreenLoader label={loadingLabel} fullscreen={false} />
          )}
        </div>
      ) : isEmpty ? (
        <div className="mobile-cards-list__state">{emptyMessage}</div>
      ) : (
        <div className="mobile-cards-list__grid">{children}</div>
      )}

      <div className="mobile-cards-pagination">
        <p className="mobile-cards-pagination__summary">
          Mostrando {pageStart}-{pageEnd} de {totalItems} registros
        </p>

        <div className="mobile-cards-pagination__controls">
          <div className="mobile-cards-pagination__size">
            <label htmlFor="mobile-cards-page-size">{pageSizeLabel}</label>
            <select
              id="mobile-cards-page-size"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mobile-cards-pagination__nav-group">
            <button
              type="button"
              className="mobile-cards-pagination__nav"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              aria-label="Página anterior"
            >
              <FaAngleLeft />
            </button>

            <span className="mobile-cards-pagination__indicator" aria-live="polite">
              {page} / {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              className="mobile-cards-pagination__nav"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              aria-label="Página siguiente"
            >
              <FaAngleRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

